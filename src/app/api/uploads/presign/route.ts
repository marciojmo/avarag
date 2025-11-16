// app/api/uploads/presign/route.ts
import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/S3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session?.user?.email) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { filename, contentType, agentId } = await req.json();
        if (!filename || !contentType) {
            return new Response("filename and contentType are required", { status: 400 });
        }

        // Get the user's agent ID
        let finalAgentId = agentId;

        if (!finalAgentId) {
            // Get the user's first agent (default agent created at signup)
            const agentResult = await query(
                `SELECT id FROM agents WHERE user_id = $1 ORDER BY created_at LIMIT 1`,
                [session.user.id]
            );

            if (agentResult.rows.length === 0) {
                return new Response("No agent found for user", { status: 404 });
            }

            finalAgentId = agentResult.rows[0].id;
        } else {
            // Verify the provided agent belongs to the user
            const agentResult = await query(
                `SELECT id FROM agents WHERE id = $1 AND user_id = $2`,
                [agentId, session.user.id]
            );

            if (agentResult.rows.length === 0) {
                return new Response("Agent not found or not authorized", { status: 403 });
            }
        }

        const safeName = String(filename).replace(/[^\w.\-]+/g, "_");
        const key = `${session.user.id}/agent_${finalAgentId}/${Date.now()}_${safeName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            ContentType: contentType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 60 });
        return Response.json({ url, key, agentId: finalAgentId });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}


