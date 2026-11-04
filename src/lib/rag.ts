// Retrieval-augmented answers over one user's processed documents.
// Used by the private chat (/api/chat) and the public share link
// (/api/public/chat).
//
// 1. Embeds the question.
// 2. Fetches the closest chunks from the user's documents (pgvector).
// 3. Streams the model's answer back as plain text. The documents used as
//    sources are sent in the X-Sources header (URI-encoded JSON).

import { OpenAI } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { query } from "@/lib/db";
import { EMBEDDING_MODEL, toVectorLiteral } from "@/lib/embeddings";

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const TOP_K = 6;
const MAX_HISTORY = 10;
const MAX_MESSAGE_LENGTH = 4000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type HistoryMessage = { role: "user" | "assistant"; content: string };
export type ChatInput = { message: string; history: HistoryMessage[] };
type Chunk = { content: string; title: string | null; document_id: string };

const SYSTEM_PROMPT = `Você é um assistente que responde perguntas com base nos documentos enviados pelo usuário.

Regras:
- Use apenas as informações dos trechos de documentos fornecidos no contexto.
- Se a resposta não estiver nos documentos, diga claramente que não encontrou essa informação nos arquivos enviados.
- Responda no mesmo idioma da pergunta, de forma clara e objetiva.
- Quando útil, mencione de qual documento veio a informação.`;

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates { message, history } from a request body; null if invalid. */
export function parseChatInput(body: unknown): ChatInput | null {
    if (!body || typeof body !== "object") return null;
    const { message, history } = body as { message?: unknown; history?: unknown };
    if (typeof message !== "string" || !message.trim()) return null;

    const cleanHistory = Array.isArray(history)
        ? history
              .filter(
                  (m): m is HistoryMessage =>
                      !!m &&
                      (m.role === "user" || m.role === "assistant") &&
                      typeof m.content === "string"
              )
              .slice(-MAX_HISTORY)
              .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
        : [];

    return { message: message.trim().slice(0, MAX_MESSAGE_LENGTH), history: cleanHistory };
}

async function searchChunks(userId: string, question: string): Promise<Chunk[]> {
    const embedding = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: question });
    const result = await query(
        `SELECT c.content, c.document_id, d.title
           FROM chunks c
           JOIN documents d ON d.id = c.document_id
          WHERE c.user_id = $1
          ORDER BY c.embedding <=> $2::vector
          LIMIT $3`,
        [userId, toVectorLiteral(embedding.data[0].embedding), TOP_K]
    );
    return result.rows;
}

function buildContext(chunks: Chunk[]): string {
    if (chunks.length === 0) {
        return "Nenhum trecho relevante foi encontrado nos documentos.";
    }
    return chunks
        .map((c, i) => `[Trecho ${i + 1} — ${c.title ?? "documento"}]\n${c.content}`)
        .join("\n\n");
}

/** Answers `input.message` from `userId`'s documents as a streamed Response. */
export async function streamAnswer(userId: string, input: ChatInput): Promise<Response> {
    const chunks = await searchChunks(userId, input.message);

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...input.history,
        {
            role: "user",
            content: `Contexto dos documentos:\n\n${buildContext(chunks)}\n\nPergunta: ${input.message}`,
        },
    ];

    const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.2,
        stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                for await (const part of completion) {
                    const delta = part.choices[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                }
                controller.close();
            } catch (error) {
                console.error("Chat stream error:", error);
                controller.error(error);
            }
        },
        cancel() {
            completion.controller.abort();
        },
    });

    const sources = [...new Map(chunks.map((c) => [c.document_id, c.title ?? "documento"])).values()];

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Sources": encodeURIComponent(JSON.stringify(sources)),
        },
    });
}
