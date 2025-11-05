// Load environment variables from .env.local
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { OpenAI } from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pool } from "pg";
import * as fs from "fs";
import * as os from "os";

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION!,
    credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
        : undefined,
});

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
        : undefined,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

interface Message {
    documentId: string;
    timestamp: string;
}

async function downloadFromS3(s3Key: string): Promise<Buffer> {
    console.log(`  📥 Downloading from S3...`);
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3Key,
    });
    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.log(`  📑 Parsing PDF (${buffer.length} bytes)...`);
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse(new Uint8Array(buffer));

    const data = await parser.getText();
    console.log(`  ✓ Extracted ${data.text.length} characters`);

    if (!data.text || data.text.trim().length === 0) {
        throw new Error("PDF contains no text");
    }

    return data.text;
}

async function extractText(buffer: Buffer, mime: string, filename: string): Promise<string> {
    console.log(`  📄 Extracting text from ${mime}...`);

    switch (mime) {
        case "application/pdf":
            return await extractTextFromPDF(buffer);

        case "text/plain":
        case "text/markdown":
            return buffer.toString("utf-8");

        case "audio/mpeg":
        case "audio/mp3":
            return await transcribeAudio(buffer, filename);

        default:
            throw new Error(`Unsupported file type: ${mime}`);
    }
}

async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
    console.log(`  🎤 Transcribing audio with Whisper...`);

    const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}_${filename}`);

    try {
        await fs.promises.writeFile(tempPath, buffer);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempPath) as any,
            model: "whisper-1",
        });

        console.log(`  ✓ Transcribed ${transcription.text.length} characters`);
        return transcription.text;
    } finally {
        try {
            await fs.promises.unlink(tempPath);
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
    });
    return response.data[0].embedding;
}

async function processDocument(documentId: string) {
    console.log(`\n🔄 Processing document ${documentId}...`);

    try {
        // 1. Get document metadata
        const doc = await pool.query(
            "SELECT s3_key, mime, agent_id, title FROM documents WHERE id = $1",
            [documentId]
        );

        if (doc.rows.length === 0) {
            throw new Error("Document not found");
        }

        const { s3_key, mime, agent_id, title } = doc.rows[0];
        console.log(`  📄 ${title}`);

        // 2. Download and extract text
        const buffer = await downloadFromS3(s3_key);
        const text = await extractText(buffer, mime, title);
        console.log(`  ✓ Extracted ${text.length} characters`);

        // 3. Split into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await splitter.splitText(text);
        console.log(`  ✂️  Created ${chunks.length} chunks`);

        // 4. Generate embeddings and store
        console.log(`  🧠 Generating embeddings...`);
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);

            await pool.query(
                `INSERT INTO chunks (agent_id, document_id, content, embedding)
                 VALUES ($1, $2, $3, $4)`,
                [agent_id, documentId, chunks[i], `[${embedding.join(",")}]`]
            );

            if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
                console.log(`    → ${i + 1}/${chunks.length} chunks processed`);
            }
        }

        // 5. Mark as processed
        await pool.query(
            "UPDATE documents SET status = 'processed' WHERE id = $1",
            [documentId]
        );

        console.log(`✅ Document processed successfully\n`);
    } catch (error: any) {
        console.error(`❌ Error:`, error.message);

        // Mark as failed
        await pool.query(
            "UPDATE documents SET status = 'failed' WHERE id = $1",
            [documentId]
        );

        console.log(`  ⚠️  Document marked as failed\n`);
    }
}

async function pollQueue() {
    console.log(`👂 Polling queue...\n`);

    while (true) {
        try {
            const response = await sqsClient.send(new ReceiveMessageCommand({
                QueueUrl: process.env.SQS_QUEUE_URL!,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
                VisibilityTimeout: 300,
            }));

            if (response.Messages && response.Messages.length > 0) {
                for (const message of response.Messages) {
                    const body: Message = JSON.parse(message.Body!);

                    await processDocument(body.documentId);

                    // Delete from queue
                    await sqsClient.send(new DeleteMessageCommand({
                        QueueUrl: process.env.SQS_QUEUE_URL!,
                        ReceiptHandle: message.ReceiptHandle!,
                    }));
                }
            } else {
                process.stdout.write(".");
            }
        } catch (error) {
            console.error("\n⚠️  Queue error:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await pool.end();
    process.exit(0);
});

// Validate environment
const required = ['AWS_REGION', 'S3_BUCKET_NAME', 'SQS_QUEUE_URL', 'DATABASE_URL', 'OPENAI_API_KEY'];
const missing = required.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error("❌ Missing environment variables:", missing.join(", "));
    process.exit(1);
}

// Start
console.log("╔════════════════════════════════════════════╗");
console.log("║   🚀 Document Processor Starting...       ║");
console.log("╚════════════════════════════════════════════╝\n");
console.log(`📍 Region: ${process.env.AWS_REGION}`);
console.log(`🪣 Bucket: ${process.env.S3_BUCKET_NAME}`);
console.log(`📮 Queue: ${process.env.SQS_QUEUE_URL?.split('/').pop()}\n`);

pollQueue();
