// app/api/public/agents/[agentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: { agentId: string } }
) {
    try {
        const { agentId } = params;

        if (!agentId) {
            return NextResponse.json(
                { error: "Agent ID is required" },
                { status: 400 }
            );
        }

        // Fetch agent information
        const result = await query(
            `SELECT id, name, description, model 
             FROM agents 
             WHERE id = $1`,
            [agentId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        const agent = result.rows[0];

        return NextResponse.json({ agent });
    } catch (error: any) {
        console.error("Error fetching public agent:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

