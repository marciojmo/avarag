// DELETE /api/uploads/:id -> removes the document, its chunks and the S3 file
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/auth";
import { BUCKET, s3 } from "@/lib/aws";
import { query } from "@/lib/db";
import { UUID_PATTERN } from "@/lib/rag";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
        return Response.json({ error: "Not found" }, { status: 404 });
    }

    try {
        // Chunks are removed by ON DELETE CASCADE.
        const result = await query(
            "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING s3_key",
            [id, session.user.id]
        );
        if (result.rows.length === 0) {
            return Response.json({ error: "Not found" }, { status: 404 });
        }

        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: result.rows[0].s3_key }));
        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
