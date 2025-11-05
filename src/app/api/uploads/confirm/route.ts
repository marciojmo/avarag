// app/api/uploads/confirm/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { sendDocumentProcessingMessage } from "@/lib/sqs";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { s3Key, filename, contentType, agentId } = await req.json();

        if (!s3Key || !filename || !agentId) {
            return new Response("Missing required fields", { status: 400 });
        }

        // Verify the agent belongs to the user
        const agentCheck = await query(
            `SELECT id FROM agents WHERE id = $1 AND user_id = $2`,
            [agentId, session.user.id]
        );

        if (agentCheck.rows.length === 0) {
            return new Response("Agent not found or not authorized", { status: 403 });
        }

        // Verify file exists in S3 and get metadata
        const headCommand = new HeadObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: s3Key,
        });
        const s3Metadata = await s3.send(headCommand);

        // Insert document record
        const result = await query(
            `INSERT INTO documents (agent_id, user_id, title, mime, bytes, s3_key, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING id`,
            [agentId, session.user.id, filename, contentType, s3Metadata.ContentLength || 0, s3Key]
        );

        const documentId = result.rows[0].id;

        // Send SQS message for async processing
        await sendDocumentProcessingMessage(documentId);

        return Response.json({
            documentId,
            status: 'pending',
            message: 'Document queued for processing'
        });
    } catch (error) {
        console.error("Error confirming upload:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

