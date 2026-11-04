// GET  /api/uploads  -> the user's documents and their processing status
// POST /api/uploads  -> registers a file already uploaded to S3 and queues it
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/auth";
import { BUCKET, enqueueDocument, s3 } from "@/lib/aws";
import { query } from "@/lib/db";
import { resolveContentType } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await query(
            `SELECT id, title, bytes, status, created_at
               FROM documents
              WHERE user_id = $1
              ORDER BY created_at DESC`,
            [session.user.id]
        );
        const documents = result.rows.map((d) => ({
            id: d.id,
            name: d.title,
            size: Number(d.bytes),
            status: d.status,
            createdAt: d.created_at,
        }));
        return Response.json({ documents });
    } catch (error) {
        console.error("Error listing documents:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, filename } = (await req.json().catch(() => ({}))) as {
        key?: unknown;
        filename?: unknown;
    };
    if (typeof key !== "string" || typeof filename !== "string") {
        return Response.json({ error: "key and filename are required" }, { status: 400 });
    }
    // Only keys issued by /api/uploads/presign for this user are accepted.
    if (!key.startsWith(`${session.user.id}/`)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const contentType = resolveContentType(filename);
    if (!contentType) {
        return Response.json({ error: "Tipo de arquivo não suportado" }, { status: 400 });
    }

    try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));

        const result = await query(
            `INSERT INTO documents (user_id, title, mime, bytes, s3_key, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING id`,
            [session.user.id, filename, contentType, head.ContentLength ?? 0, key]
        );
        const documentId: string = result.rows[0].id;

        await enqueueDocument(documentId);
        return Response.json({ id: documentId, status: "pending" });
    } catch (error) {
        console.error("Error registering upload:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
