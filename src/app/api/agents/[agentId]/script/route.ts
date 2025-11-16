// app/api/agents/[agentId]/script/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { agentId } = await params;

        // Verify agent ownership and get script
        const result = await query(
            `SELECT a.script FROM agents a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = $1 AND u.email = $2`,
            [agentId, session.user.email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Agent not found or access denied" },
                { status: 403 }
            );
        }

        const script = result.rows[0].script;

        return NextResponse.json({ script: script || null });

    } catch (error: any) {
        console.error("Error loading agent script:", error);
        return NextResponse.json(
            { error: "Failed to load script", details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { agentId } = await params;
        const { script } = await req.json();

        if (!script || !Array.isArray(script)) {
            return NextResponse.json(
                { error: "Invalid script format" },
                { status: 400 }
            );
        }

        // Verify agent ownership
        const agentCheck = await query(
            `SELECT a.id FROM agents a
             JOIN users u ON a.user_id = u.id
             WHERE a.id = $1 AND u.email = $2`,
            [agentId, session.user.email]
        );

        if (agentCheck.rows.length === 0) {
            return NextResponse.json(
                { error: "Agent not found or access denied" },
                { status: 403 }
            );
        }

        // Update agent script
        await query(
            `UPDATE agents SET script = $1 WHERE id = $2`,
            [JSON.stringify(script), agentId]
        );

        return NextResponse.json({ success: true, message: "Script saved successfully" });

    } catch (error: any) {
        console.error("Error saving agent script:", error);
        return NextResponse.json(
            { error: "Failed to save script", details: error.message },
            { status: 500 }
        );
    }
}

