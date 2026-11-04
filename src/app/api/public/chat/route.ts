// Public share link: anyone with the link can ask questions about the
// documents of the user who shared it (see /live-chat/[ownerId]).
import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { UUID_PATTERN, parseChatInput, streamAnswer } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const ownerId = (body as { ownerId?: unknown } | null)?.ownerId;
    if (typeof ownerId !== "string" || !UUID_PATTERN.test(ownerId)) {
        return Response.json({ error: "Link inválido" }, { status: 404 });
    }

    const input = parseChatInput(body);
    if (!input) {
        return Response.json({ error: "message is required" }, { status: 400 });
    }

    try {
        const owner = await query("SELECT 1 FROM users WHERE id = $1", [ownerId]);
        if (owner.rows.length === 0) {
            return Response.json({ error: "Link inválido" }, { status: 404 });
        }
        return await streamAnswer(ownerId, input);
    } catch (error) {
        console.error("Public chat API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
