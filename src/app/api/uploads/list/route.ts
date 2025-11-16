// app/api/uploads/list/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Get the user's first agent (default agent created at signup)
        const agentResult = await query(
            `SELECT id FROM agents WHERE user_id = $1 ORDER BY created_at LIMIT 1`,
            [session.user.id]
        );

        if (agentResult.rows.length === 0) {
            return new Response("No agent found for user", { status: 404 });
        }

        const agentId = agentResult.rows[0].id;

        const result = await query(
            `SELECT id, title, mime, bytes, s3_key, status, created_at
             FROM documents
             WHERE user_id = $1 AND agent_id = $2
             ORDER BY created_at DESC`,
            [session.user.id, agentId]
        );

        const objects = result.rows.map((doc) => ({
            key: doc.s3_key,
            name: doc.title,
            size: Number(doc.bytes),
            lastModified: doc.created_at,
            url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${doc.s3_key}`,
            status: doc.status, // pending, processed, or failed
            documentId: doc.id,
        }));

        return Response.json({ objects });
    } catch (error) {
        console.error("Error listing documents:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
