import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sqsClient = new SQSClient({
    region: process.env.AWS_REGION!,
    credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
        : undefined,
});

export async function sendDocumentProcessingMessage(documentId: string) {
    const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL!,
        MessageBody: JSON.stringify({
            documentId,
            timestamp: new Date().toISOString(),
        }),
    });
    return await sqsClient.send(command);
}

