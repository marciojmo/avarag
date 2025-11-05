// app/api/uploads/delete/route.ts
import { NextRequest } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id || !session?.user?.email) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { key } = body;

        if (!key) {
            return new Response("Missing key parameter", { status: 400 });
        }

        // Delete from database first (this will cascade delete chunks)
        // Verify ownership through the WHERE clause
        const result = await query(
            `DELETE FROM documents 
             WHERE s3_key = $1 AND user_id = $2
             RETURNING id`,
            [key, session.user.id]
        );

        if (result.rows.length === 0) {
            return new Response("Document not found or forbidden", { status: 404 });
        }

        // Delete from S3
        const command = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
        });

        await s3.send(command);

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting object:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

