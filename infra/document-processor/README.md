# Document processor (Lambda + SQS)

Flow: the app (Vercel) writes the file to S3, creates the row in `documents` and
sends `{ documentId }` to the SQS queue. The `avarag-document-processor` Lambda
consumes the queue, extracts the text (PDF, txt/md, mp3 via Whisper), generates
the embeddings and writes them to `chunks`, marking the document as `processed`.

- Code: [`src/workers/processor.ts`](../../src/workers/processor.ts) (pipeline) and
  [`src/workers/lambda.ts`](../../src/workers/lambda.ts) (handler).
- Transient failures (network, OpenAI, database) go back to the queue and are
  retried up to 3 times. After that, the document is marked as `failed` and the
  message goes to the `avarag-documents-dlq` DLQ.
- Permanent failures (unsupported type, file with no text) mark the document as
  `failed` right away, with no retries.
- Reprocessing is idempotent: the document's old chunks are replaced inside a
  transaction.

## Prerequisites

```bash
brew install awscli aws-sam-cli
```

```bash
aws configure   # region sa-east-1, with a user that can create stacks
```

## Deploy

1. Build the package (`.build/document-processor.zip`, Linux arm64 binaries):

   ```bash
   npm run build:lambda
   ```

2. Deploy the stack (queue, DLQ, Lambda, permissions and logs). The first time,
   use `--guided` to save the parameters to `samconfig.toml`. **Don't commit
   that file**, because it holds the secrets:

   ```bash
   sam deploy --guided --template-file infra/document-processor/template.yaml --stack-name avarag-document-processor --region sa-east-1 --resolve-s3 --capabilities CAPABILITY_IAM
   ```

   Parameters: `UploadsBucketName` (the uploads bucket), `DatabaseUrl`
   (Supabase pooler, port 6543) and `OpenAIApiKey`.

3. Copy the `QueueUrl` output to `SQS_QUEUE_URL` on Vercel (and in
   `.env.local`).

To update the code later, run `npm run build:lambda` and
`sam deploy --template-file infra/document-processor/template.yaml`.

## Vercel IAM user permissions

The app only needs to send messages to the queue and manage the bucket's objects:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "sqs:SendMessage", "Resource": "<QueueArn>" },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<bucket>/*"
    }
  ]
}
```

## Bucket CORS

Uploads go straight from the browser to the presigned URL:

```json
[
  {
    "AllowedOrigins": ["https://<your-domain>", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Operations

- Logs: `sam logs -n DocumentProcessorFunction --stack-name avarag-document-processor --tail`
- Reprocess what landed in the DLQ: in the SQS console, open the DLQ and use
  *Start DLQ redrive* to send the messages back to the main queue.
- Local development: `npm run worker` runs the same pipeline, reading the queue
  with long polling. Don't keep the local worker running against the same queue
  as the Lambda.
