// app/api/public/chat/reengage/route.ts - Public re-engagement endpoint
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { OpenAI } from "openai";

type State = {
    name: string;
    goal: string;
    chat_options: string[];
    transitions: any[];
    is_final?: boolean;
    is_research?: boolean;
};

type Agent = {
    id: string;
    name: string;
    model: string;
};

const DEFAULT_LLM_MODEL = "gpt-4o-mini";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
    try {
        const { agentId, currentStateIndex, conversationHistory } = await req.json();

        if (!agentId || typeof currentStateIndex !== "number") {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Get agent info (public endpoint, no auth check)
        const agentResult = await query(
            `SELECT id, model, name FROM agents WHERE id = $1`,
            [agentId]
        );

        if (agentResult.rows.length === 0) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        const agent = agentResult.rows[0] as Agent;

        // Get agent's state machine
        const scriptResult = await query(
            `SELECT script FROM agents WHERE id = $1`,
            [agentId]
        );

        let states: State[];
        if (scriptResult.rows.length === 0 || !scriptResult.rows[0].script) {
            states = [{
                name: "Initial",
                goal: "Help the user with their questions",
                chat_options: ["Hello! How can I help you today?"],
                transitions: [],
                is_final: false
            }];
        } else {
            const script = scriptResult.rows[0].script;
            states = (typeof script === 'string' ? JSON.parse(script) : script) as State[];
        }

        if (currentStateIndex < 0 || currentStateIndex >= states.length) {
            return NextResponse.json({ error: "Invalid state index" }, { status: 400 });
        }

        const currentState = states[currentStateIndex];

        // Generate contextual re-engagement message
        const systemPrompt = `You are ${agent.name}, an AI assistant trying to re-engage with a user who hasn't responded.

Current State: ${currentState.name}
State Goal: ${currentState.goal}

CRITICAL INSTRUCTIONS:
- Generate a SINGLE short message (1-2 sentences) to re-engage the user
- Be contextual and relevant to the conversation history
- DO NOT use generic phrases like "Are you still there?" or "Hello?"
- Instead, provide value by:
  - Offering additional relevant information about ${currentState.goal}
  - Asking a specific follow-up question related to the state goal
  - Sharing a helpful tip or insight
  - Making a specific suggestion based on what was discussed
- Match the conversational tone from the history
- Keep it natural, friendly, and on-topic
- Be conversational like texting a friend`;

        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        // Add recent conversation history for context
        const recentHistory = (conversationHistory || []).slice(-6);
        recentHistory.forEach((msg: any) => {
            messages.push({ role: msg.role, content: msg.content });
        });

        messages.push({ 
            role: "user", 
            content: "Generate a contextual re-engagement message:" 
        });

        const completion = await openai.chat.completions.create({
            model: agent.model || DEFAULT_LLM_MODEL,
            messages,
            temperature: 0.8,
            max_tokens: 100,
        });

        const reengagementMessage = completion.choices[0].message.content?.trim();
        
        if (!reengagementMessage) {
            return NextResponse.json({ 
                message: `Ah, pensando mais sobre ${currentState.goal.toLowerCase()}...`,
                stateIndex: currentStateIndex,
                stateName: currentState.name
            });
        }

        return NextResponse.json({
            message: reengagementMessage,
            stateIndex: currentStateIndex,
            stateName: currentState.name
        });

    } catch (error: any) {
        console.error("❌ Public re-engagement API error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}

