// app/api/chat/route.ts - State Machine Based Chat
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { OpenAI } from "openai";

// ========== TYPES ==========
type Transition = {
    automatic?: boolean; // If true, automatically transition without condition
    condition: string;
    if_true: number;  // State index if condition is met (or next state if automatic)
    if_false: number; // State index if condition is not met
};

type State = {
    name: string;
    goal: string;
    chat_options: string[];
    transitions: Transition[];
    is_final?: boolean;
    is_research?: boolean; // If true, use database search to compose response
};

type Agent = {
    id: string;
    name: string;
    model: string;
    user_id: string;
};

type Chunk = {
    content: string;
    distance: number;
};

type ChatRequest = {
    message: string;
    agentId: string;
    currentStateIndex: number;
    conversationHistory: { role: string; content: string }[];
};

type ChatResponse = {
    response: string;
    nextStateIndex: number;
    stateName: string;
    isFinal: boolean;
};

// ========== CONSTANTS ==========
const EMBEDDING_MODEL = "text-embedding-ada-002";
const DEFAULT_LLM_MODEL = "gpt-4o-mini";
const TOP_K_CHUNKS = 3;
const LLM_TEMPERATURE = 0.7;
const LLM_MAX_TOKENS = 500;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ========== HELPER FUNCTIONS ==========

async function validateRequest(req: NextRequest): Promise<{
    message: string;
    agentId: string;
    email: string;
    currentStateIndex: number;
    conversationHistory: { role: string; content: string }[];
}> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error("UNAUTHORIZED");
    }

    const body = await req.json();
    const { message, agentId, currentStateIndex, conversationHistory } = body as Partial<ChatRequest>;

    if (!message || typeof message !== "string" || !message.trim()) {
        throw new Error("INVALID_MESSAGE");
    }

    if (!agentId || typeof agentId !== "string") {
        throw new Error("INVALID_AGENT_ID");
    }

    if (typeof currentStateIndex !== "number") {
        throw new Error("INVALID_STATE_INDEX");
    }

    return {
        message: message.trim(),
        agentId,
        email: session.user.email,
        currentStateIndex,
        conversationHistory: conversationHistory || []
    };
}

async function getAgentByIdAndEmail(agentId: string, email: string): Promise<Agent> {
    const result = await query(
        `SELECT a.id, a.model, a.name, u.id as user_id 
         FROM agents a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = $1 AND u.email = $2`,
        [agentId, email]
    );

    if (result.rows.length === 0) {
        throw new Error("AGENT_NOT_FOUND");
    }

    return result.rows[0] as Agent;
}

async function getAgentStateMachine(agentId: string): Promise<State[]> {
    // TODO: In production, fetch from database
    // For now, return a default state machine
    const result = await query(
        `SELECT script FROM agents WHERE id = $1`,
        [agentId]
    );

    if (result.rows.length === 0 || !result.rows[0].script) {
        // Return default state machine if no script exists
        return [{
            name: "Initial",
            goal: "Help the user with their questions",
            chat_options: ["Hello! How can I help you today?"],
            transitions: [],
            is_final: false
        }];
    }

    // PostgreSQL jsonb type already returns parsed JSON, no need to parse again
    const script = result.rows[0].script;
    return (typeof script === 'string' ? JSON.parse(script) : script) as State[];
}

function selectRandomChatOption(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)];
}

async function generateEmbedding(text: string): Promise<number[]> {
    console.log("🧠 Generating embedding for research...");
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
        return "";
    }

    let context = "Relevant information from the knowledge base:\n\n";
    chunks.forEach((chunk, idx) => {
        context += `[Document ${idx + 1}]:\n${chunk.content}\n\n`;
    });
    return context;
}

async function generateStateResponse(
    agent: Agent,
    state: State,
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    agentId: string
): Promise<string> {
    console.log(`💬 Generating response for state: ${state.name}${state.is_research ? ' (Research Mode)' : ''}`);

    let contextFromDatabase = "";

    // If research state, search database for relevant information
    if (state.is_research) {
        const embedding = await generateEmbedding(userMessage);
        const chunks = await searchSimilarChunks(embedding, agentId);
        contextFromDatabase = buildContext(chunks);
    }

    const systemPrompt = `You are ${agent.name}, an AI assistant. 

Current State: ${state.name}
Goal: ${state.goal}

Available message templates: ${state.chat_options.join(" OR ")}

Instructions:
- Your goal in this state is: ${state.goal}
- Use the provided message templates as inspiration, but personalize based on the conversation
- Be natural and conversational
- Stay focused on the state's goal
- Keep responses concise and engaging${contextFromDatabase ? '\n- Use the information from the knowledge base to provide accurate answers' : ''}`;

    const messages: any[] = [
        { role: "system", content: systemPrompt }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
    });

    // Add context from database if research state
    if (contextFromDatabase) {
        messages.push({ role: "user", content: contextFromDatabase });
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
        model: agent.model || DEFAULT_LLM_MODEL,
        messages,
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

async function determineStateTransition(
    state: State,
    states: State[],
    userMessage: string,
    conversationHistory: { role: string; content: string }[]
): Promise<number> {
    console.log(`🔄 Checking transitions for state: ${state.name}`);

    if (state.transitions.length === 0) {
        console.log("  → No transitions defined, staying in current state");
        return -1; // Stay in current state
    }

    // Process each transition sequentially
    for (let i = 0; i < state.transitions.length; i++) {
        const transition = state.transitions[i];

        // If transition is automatic, go directly to next state
        if (transition.automatic) {
            const nextStateIndex = transition.if_true;
            const nextStateName = states[nextStateIndex]?.name || `State ${nextStateIndex}`;
            console.log(`  → Automatic transition to state ${nextStateIndex}: ${nextStateName}`);
            return nextStateIndex;
        }

        const systemPrompt = `You are a state machine analyzer. Evaluate if a specific condition is met based on the conversation.

Current State: ${state.name}
Condition to evaluate: ${transition.condition}

Instructions:
- Analyze the user's message and conversation history carefully
- Determine if the condition "${transition.condition}" is satisfied
- Respond with ONLY "true" or "false"
- Be strict: only respond "true" if the condition is clearly and unambiguously met`;

        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        // Add recent conversation history
        const recentHistory = conversationHistory.slice(-6); // Last 6 messages
        recentHistory.forEach(msg => {
            messages.push({ role: msg.role, content: msg.content });
        });

        messages.push({ role: "user", content: userMessage });
        messages.push({ role: "user", content: `Is the condition "${transition.condition}" met? Respond with only "true" or "false":` });

        const completion = await openai.chat.completions.create({
            model: DEFAULT_LLM_MODEL,
            messages,
            temperature: 0.3, // Lower temperature for more deterministic decisions
            max_tokens: 10,
        });

        const response = completion.choices[0].message.content?.trim().toLowerCase() || "false";
        const conditionMet = response === "true";

        const nextStateIndex = conditionMet ? transition.if_true : transition.if_false;
        const nextStateName = states[nextStateIndex]?.name || `State ${nextStateIndex}`;

        console.log(`  → Condition "${transition.condition}": ${conditionMet ? 'TRUE' : 'FALSE'}`);
        console.log(`  → Transitioning to state ${nextStateIndex}: ${nextStateName}`);

        return nextStateIndex;
    }

    console.log("  → No transitions evaluated, staying in current state");
    return -1;
}

function createErrorResponse(error: string): NextResponse {
    const errorMap: Record<string, { message: string; status: number }> = {
        UNAUTHORIZED: { message: "Unauthorized", status: 401 },
        INVALID_MESSAGE: { message: "Message is required and must be a non-empty string", status: 400 },
        INVALID_AGENT_ID: { message: "Agent ID is required", status: 400 },
        INVALID_STATE_INDEX: { message: "State index is required", status: 400 },
        AGENT_NOT_FOUND: { message: "Agent not found or access denied", status: 403 },
        LLM_NO_RESPONSE: { message: "Failed to generate response from LLM", status: 500 },
    };

    const errorInfo = errorMap[error] || { message: "Internal server error", status: 500 };
    return NextResponse.json({ error: errorInfo.message }, { status: errorInfo.status });
}

// ========== ROUTE HANDLER ==========

export async function POST(req: NextRequest) {
    try {
        // 1. Validate request and authenticate
        const { message, agentId, email, currentStateIndex, conversationHistory } = await validateRequest(req);

        // 2. Verify agent ownership
        const agent = await getAgentByIdAndEmail(agentId, email);

        // 3. Get agent's state machine
        const states = await getAgentStateMachine(agentId);

        if (currentStateIndex < 0 || currentStateIndex >= states.length) {
            throw new Error("INVALID_STATE_INDEX");
        }

        const currentState = states[currentStateIndex];

        // 4. Generate response based on current state
        const response = await generateStateResponse(agent, currentState, message, conversationHistory, agentId);

        // 5. Determine if state transition should occur
        const nextStateIndex = await determineStateTransition(currentState, states, message, conversationHistory);
        const actualNextState = nextStateIndex >= 0 ? nextStateIndex : currentStateIndex;
        const nextState = states[actualNextState];

        // 6. Check if final state
        const isFinal = nextState.is_final || false;

        // 7. Return response with state information
        return NextResponse.json<ChatResponse>({
            response,
            nextStateIndex: actualNextState,
            stateName: nextState.name,
            isFinal,
        });

    } catch (error: any) {
        console.error("❌ Chat API error:", error);

        // Handle known errors
        if (error.message && (
            error.message.startsWith("UNAUTHORIZED") ||
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
