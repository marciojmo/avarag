import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Credentials come from the default AWS provider chain
// (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars on Vercel and locally).
export const s3 = new S3Client({ region: process.env.AWS_REGION });
const sqs = new SQSClient({ region: process.env.AWS_REGION });

export const BUCKET = process.env.S3_BUCKET_NAME!;

/** Queues a document for background processing (see src/workers). */
export async function enqueueDocument(documentId: string) {
    await sqs.send(
        new SendMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL!,
            MessageBody: JSON.stringify({ documentId, timestamp: new Date().toISOString() }),
        })
    );
}
