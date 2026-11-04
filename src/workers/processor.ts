// Document processing pipeline shared by the Lambda handler (lambda.ts)
// and the local SQS poller (document-processor.ts).
//
// Downloads a document from S3, extracts its text, splits it into chunks,
// embeds the chunks with OpenAI and stores them in Postgres (pgvector).

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { OpenAI, toFile } from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pool } from "pg";

// Must match the model used for query embeddings in src/app/api/chat/route.ts.
const EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_BATCH_SIZE = 100;

export interface DocumentMessage {
    documentId: string;
    timestamp?: string;
}

/** An error that will not go away on retry (bad input, unsupported file). */
export class PermanentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PermanentError";
    }
}

export function assertEnv() {
    const required = ["S3_BUCKET_NAME", "DATABASE_URL", "OPENAI_API_KEY"];
    const missing = required.filter((v) => !process.env[v]);
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
}

// Clients are created lazily and reused across invocations (warm Lambdas).
// Credentials come from the default AWS provider chain: the IAM role on Lambda,
// AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars locally.
let s3: S3Client | undefined;
let openai: OpenAI | undefined;
let pool: Pool | undefined;

function getS3() {
    return (s3 ??= new S3Client({ region: process.env.AWS_REGION }));
}

function getOpenAI() {
    return (openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }));
}

export function getPool() {
    return (pool ??= new Pool({
        connectionString: process.env.DATABASE_URL!,
        // One connection per Lambda instance; the Supabase pooler does the rest.
        max: Number(process.env.PG_POOL_MAX ?? 1),
    }));
}

export async function closePool() {
    await pool?.end();
    pool = undefined;
}

export function parseMessage(body: string): DocumentMessage {
    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        throw new PermanentError("Message body is not valid JSON");
    }
    const documentId = (parsed as DocumentMessage | null)?.documentId;
    if (typeof documentId !== "string" || documentId.length === 0) {
        throw new PermanentError("Message has no documentId");
    }
    return parsed as DocumentMessage;
}

async function downloadFromS3(key: string): Promise<Buffer> {
    const response = await getS3().send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key })
    );
    if (!response.Body) throw new Error(`Empty S3 object: ${key}`);
    return Buffer.from(await response.Body.transformToByteArray());
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Loaded on demand: pdf-parse pulls in pdfjs and a native canvas binary.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
        const { text } = await parser.getText();
        return text;
    } finally {
        await parser.destroy();
    }
}

async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
    const transcription = await getOpenAI().audio.transcriptions.create({
        file: await toFile(buffer, filename || "audio.mp3"),
        model: "whisper-1",
    });
    return transcription.text;
}

async function extractText(buffer: Buffer, mime: string, filename: string): Promise<string> {
    let text: string;
    switch (mime) {
        case "application/pdf":
            text = await extractTextFromPDF(buffer);
            break;
        case "text/plain":
        case "text/markdown":
            text = buffer.toString("utf-8");
            break;
        case "audio/mpeg":
        case "audio/mp3":
            text = await transcribeAudio(buffer, filename);
            break;
        default:
            throw new PermanentError(`Unsupported file type: ${mime}`);
    }
    if (!text || text.trim().length === 0) {
        throw new PermanentError("Document contains no extractable text");
    }
    return text;
}

async function embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
        const response = await getOpenAI().embeddings.create({
            model: EMBEDDING_MODEL,
            input: batch,
        });
        // The API returns one item per input, tagged with its index.
        const sorted = [...response.data].sort((a, b) => a.index - b.index);
        embeddings.push(...sorted.map((d) => d.embedding));
    }
    return embeddings;
}

export async function markFailed(documentId: string) {
    await getPool().query(
        "UPDATE documents SET status = 'failed' WHERE id = $1",
        [documentId]
    );
}

/**
 * Processes one document end to end. Safe to retry: existing chunks for the
 * document are replaced inside a single transaction.
 *
 * Throws PermanentError for failures a retry cannot fix; any other error is
 * transient and the caller should let SQS redeliver the message.
 */
export async function processDocument(documentId: string): Promise<"processed" | "skipped"> {
    const doc = await getPool().query(
        "SELECT s3_key, mime, agent_id, title FROM documents WHERE id = $1",
        [documentId]
    );
    if (doc.rows.length === 0) {
        // Deleted by the user before we got to it; nothing to do.
        console.log(`[${documentId}] document not found, skipping`);
        return "skipped";
    }

    const { s3_key, mime, agent_id, title } = doc.rows[0];
    console.log(`[${documentId}] processing "${title}" (${mime})`);

    const buffer = await downloadFromS3(s3_key);
    const text = await extractText(buffer, mime, title);

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const chunks = await splitter.splitText(text);
    const embeddings = await embed(chunks);
    console.log(`[${documentId}] ${text.length} chars -> ${chunks.length} chunks`);

    const client = await getPool().connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM chunks WHERE document_id = $1", [documentId]);
        for (let i = 0; i < chunks.length; i++) {
            await client.query(
                `INSERT INTO chunks (agent_id, document_id, content, embedding)
                 VALUES ($1, $2, $3, $4)`,
                [agent_id, documentId, chunks[i], `[${embeddings[i].join(",")}]`]
            );
        }
        await client.query("UPDATE documents SET status = 'processed' WHERE id = $1", [documentId]);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }

    console.log(`[${documentId}] processed`);
    return "processed";
}
