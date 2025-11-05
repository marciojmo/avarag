// app/api/public/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { OpenAI } from "openai";

// ========== TYPES ==========
type Agent = {
    id: string;
    name: string;
    model: string;
};

type Chunk = {
    content: string;
    distance: number;
};

type ChatRequest = {
    message: string;
    agentId: string;
};

type ChatResponse = {
    response: string;
    chunksFound: number;
};

// ========== CONSTANTS ==========
const EMBEDDING_MODEL = "text-embedding-ada-002";
const DEFAULT_LLM_MODEL = "gpt-4o-mini";
const TOP_K_CHUNKS = 3;
const LLM_TEMPERATURE = 0.7;
const LLM_MAX_TOKENS = 500;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ========== HELPER FUNCTIONS ==========

async function validateRequest(req: NextRequest): Promise<{ message: string; agentId: string }> {
    const body = await req.json();
    const { message, agentId } = body as Partial<ChatRequest>;

    if (!message || typeof message !== "string" || !message.trim()) {
        throw new Error("INVALID_MESSAGE");
    }

    if (!agentId || typeof agentId !== "string") {
        throw new Error("INVALID_AGENT_ID");
    }

    return { message: message.trim(), agentId };
}

async function getAgentById(agentId: string): Promise<Agent> {
    const result = await query(
        `SELECT id, model, name 
         FROM agents 
         WHERE id = $1`,
        [agentId]
    );

    if (result.rows.length === 0) {
        throw new Error("AGENT_NOT_FOUND");
    }

    return result.rows[0] as Agent;
}

async function generateEmbedding(text: string): Promise<number[]> {
    console.log("🧠 Generating embedding...");
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
    });
    return response.data[0].embedding;
}

async function searchSimilarChunks(embedding: number[], agentId: string): Promise<Chunk[]> {
    console.log("🔍 Searching for similar chunks...");
    const result = await query(
        `SELECT content, embedding <-> $1::vector as distance
         FROM chunks
         WHERE agent_id = $2
         ORDER BY embedding <-> $1::vector
         LIMIT $3`,
        [`[${embedding.join(",")}]`, agentId, TOP_K_CHUNKS]
    );

    console.log(`✓ Found ${result.rows.length} relevant chunks`);
    return result.rows as Chunk[];
}

function buildContext(chunks: Chunk[]): string {
    if (chunks.length === 0) {
        return "No relevant information found in the knowledge base.\n";
    }

    let context = "Here is some relevant information from the knowledge base:\n\n";
    chunks.forEach((chunk, idx) => {
        context += `[Document ${idx + 1}]:\n${chunk.content}\n\n`;
    });
    return context;
}

function createSystemPrompt(agentName: string): string {
    return `You are ${agentName}, an AI assistant. Answer the user's question based on the provided context. If the context doesn't contain relevant information, say so and provide a helpful response based on your general knowledge. Be concise and accurate.`;
}

async function generateResponse(agent: Agent, context: string, userMessage: string): Promise<string> {
    console.log("💬 Calling LLM...");
    
    const completion = await openai.chat.completions.create({
        model: agent.model || DEFAULT_LLM_MODEL,
        messages: [
            { role: "system", content: createSystemPrompt(agent.name) },
            { role: "user", content: `${context}\nUser Question: ${userMessage}` }
        ],
        temperature: LLM_TEMPERATURE,
        max_tokens: LLM_MAX_TOKENS,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
        throw new Error("LLM_NO_RESPONSE");
    }

    console.log("✅ Response generated successfully");
    return response;
}

function createErrorResponse(error: string): NextResponse {
    const errorMap: Record<string, { message: string; status: number }> = {
        INVALID_MESSAGE: { message: "Message is required and must be a non-empty string", status: 400 },
        INVALID_AGENT_ID: { message: "Agent ID is required", status: 400 },
        AGENT_NOT_FOUND: { message: "Agent not found", status: 404 },
        LLM_NO_RESPONSE: { message: "Failed to generate response from LLM", status: 500 },
    };

    const errorInfo = errorMap[error] || { message: "Internal server error", status: 500 };
    return NextResponse.json({ error: errorInfo.message }, { status: errorInfo.status });
}

// ========== ROUTE HANDLER ==========

export async function POST(req: NextRequest) {
    try {
        // 1. Validate request (no authentication required for public chat)
        const { message, agentId } = await validateRequest(req);

        // 2. Verify agent exists
        const agent = await getAgentById(agentId);

        // 3. Generate embedding for user message
        const embedding = await generateEmbedding(message);

        // 4. Search for similar chunks
        const chunks = await searchSimilarChunks(embedding, agentId);

        // 5. Build context from chunks
        const context = buildContext(chunks);

        // 6. Generate AI response
        const response = await generateResponse(agent, context, message);

        // 7. Return response
        return NextResponse.json<ChatResponse>({
            response,
            chunksFound: chunks.length,
        });

    } catch (error: any) {
        console.error("❌ Public chat API error:", error);

        // Handle known errors
        if (error.message && (
            error.message.startsWith("INVALID_") || 
            error.message.startsWith("AGENT_") ||
            error.message.startsWith("LLM_"))) {
            return createErrorResponse(error.message);
        }

        // Handle unknown errors
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}

