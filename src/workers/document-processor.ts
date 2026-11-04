// Local development worker: long-polls the SQS queue and runs the same
// pipeline as the Lambda (see lambda.ts). In production the Lambda consumes
// the queue instead, so don't run both against the same queue.
//
//   npm run worker

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import {
    PermanentError,
    assertEnv,
    closePool,
    markFailed,
    parseMessage,
    processDocument,
} from "./processor";

const MAX_RECEIVE_COUNT = Number(process.env.MAX_RECEIVE_COUNT ?? 3);

if (!process.env.SQS_QUEUE_URL) {
    console.error("Missing environment variable: SQS_QUEUE_URL");
    process.exit(1);
}
try {
    assertEnv();
} catch (error) {
    console.error((error as Error).message);
    process.exit(1);
}

const queueUrl = process.env.SQS_QUEUE_URL;
const sqs = new SQSClient({ region: process.env.AWS_REGION });
let running = true;

async function pollQueue() {
    console.log(`Polling ${queueUrl} (region ${process.env.AWS_REGION})...`);

    while (running) {
        try {
            const response = await sqs.send(new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
                MessageSystemAttributeNames: ["ApproximateReceiveCount"],
            }));

            for (const message of response.Messages ?? []) {
                let documentId: string | undefined;
                let done = false;
                try {
                    documentId = parseMessage(message.Body ?? "").documentId;
                    await processDocument(documentId);
                    done = true;
                } catch (error) {
                    const attempt = Number(message.Attributes?.ApproximateReceiveCount ?? 1);
                    const permanent = error instanceof PermanentError;
                    console.error(`[${documentId ?? message.MessageId}] attempt ${attempt} failed`, error);
                    if (documentId && (permanent || attempt >= MAX_RECEIVE_COUNT)) {
                        await markFailed(documentId).catch(() => {});
                    }
                    done = permanent;
                }

                // Messages left undeleted reappear after the visibility timeout.
                if (done) {
                    await sqs.send(new DeleteMessageCommand({
                        QueueUrl: queueUrl,
                        ReceiptHandle: message.ReceiptHandle!,
                    }));
                }
            }
        } catch (error) {
            console.error("Queue error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

async function shutdown() {
    console.log("Shutting down...");
    running = false;
    await closePool();
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

pollQueue();
