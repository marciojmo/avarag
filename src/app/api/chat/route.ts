// Signed-in user asking about their own documents.
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseChatInput, streamAnswer } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = parseChatInput(await req.json().catch(() => null));
    if (!input) {
        return Response.json({ error: "message is required" }, { status: 400 });
    }

    try {
        return await streamAnswer(session.user.id, input);
    } catch (error) {
        console.error("Chat API error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
