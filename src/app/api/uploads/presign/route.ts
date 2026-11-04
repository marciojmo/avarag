// Returns a short-lived URL the browser uses to PUT the file straight to S3.
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";
import { BUCKET, s3 } from "@/lib/aws";
import { resolveContentType } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = (await req.json().catch(() => ({}))) as { filename?: unknown };
    if (typeof filename !== "string" || !filename) {
        return Response.json({ error: "filename is required" }, { status: 400 });
    }

    const contentType = resolveContentType(filename);
    if (!contentType) {
        return Response.json({ error: "Tipo de arquivo não suportado" }, { status: 400 });
    }

    try {
        const safeName = filename.replace(/[^\w.\-]+/g, "_");
        const key = `${session.user.id}/${Date.now()}_${safeName}`;
        const url = await getSignedUrl(
            s3,
            new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
            { expiresIn: 300 }
        );
        return Response.json({ url, key, contentType });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
