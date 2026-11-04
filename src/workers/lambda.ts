// AWS Lambda entry point, triggered by the document-processing SQS queue.
//
// Uses partial batch responses (ReportBatchItemFailures): only the messages
// that failed with a transient error go back to the queue for another try.
// After MAX_RECEIVE_COUNT attempts SQS moves them to the dead-letter queue.

import type { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import {
    PermanentError,
    assertEnv,
    markFailed,
    parseMessage,
    processDocument,
} from "./processor";

// Keep in sync with the queue's redrive policy (maxReceiveCount).
const MAX_RECEIVE_COUNT = Number(process.env.MAX_RECEIVE_COUNT ?? 3);

async function handleRecord(record: SQSRecord): Promise<boolean> {
    let documentId: string | undefined;
    try {
        documentId = parseMessage(record.body).documentId;
        await processDocument(documentId);
        return true;
    } catch (error) {
        const attempt = Number(record.attributes.ApproximateReceiveCount ?? 1);
        const permanent = error instanceof PermanentError;
        console.error(
            `[${documentId ?? record.messageId}] attempt ${attempt} failed` +
                (permanent ? " (permanent)" : ""),
            error
        );

        // Surface the failure to the user once no more retries will happen.
        if (documentId && (permanent || attempt >= MAX_RECEIVE_COUNT)) {
            await markFailed(documentId).catch((e) =>
                console.error(`[${documentId}] could not mark as failed`, e)
            );
        }
        // Permanent errors are dropped; transient ones are retried by SQS.
        return permanent;
    }
}

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
    assertEnv();
    const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];
    for (const record of event.Records) {
        if (!(await handleRecord(record))) {
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    }
    return { batchItemFailures };
}
