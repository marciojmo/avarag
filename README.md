# AYDA — Ask Your Documents Anything

Upload documents and ask questions about them in a chat.

- **Upload:** the browser sends the file (PDF, TXT, Markdown or MP3) straight to
  S3 with a presigned URL. The API then records the document and queues an SQS
  message.
- **Processing:** a Lambda reads the queue, extracts the text (MP3s are
  transcribed with Whisper), splits it into chunks, embeds them and stores
  everything in Postgres with pgvector.
- **Chat (RAG):** each question is embedded, the closest chunks from the user's
  documents are retrieved, and the model's answer is streamed back.
- **Public chat:** each user gets a shareable link (`/live-chat/<id>`, shown on
  the dashboard) where anyone can ask about that user's documents without
  signing in.

## Structure

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Landing page |
| `src/app/login`, `src/app/signup` | Google sign-in and sign-up |
| `src/app/dashboard` | Main screen: files and public link on the side, chat in the center |
| `src/app/live-chat/[ownerId]` | Public chat over a user's documents |
| `src/app/api/uploads` | List, register (`POST`), presign (`presign`) and delete (`[id]`) documents |
| `src/app/api/chat`, `src/app/api/public/chat` | Answer questions from the documents (RAG in `src/lib/rag.ts`) |
| `src/workers` | Document processing: `lambda.ts` (production), `document-processor.ts` (local) |
| `infra/document-processor` | SAM template (queue, DLQ, Lambda) and deploy guide |
| `db/migrations` | SQL migrations |

## Development

Start the local database (Postgres 17 + pgvector in Docker) and apply the
migrations:

```bash
docker compose up -d
```

```bash
npm run db:migrate
```

Create `.env.local` with the variables below, then start the app and,
optionally, the local worker to process documents:

```bash
npm run dev
```

```bash
npm run worker
```

To reset the database, run `docker compose down -v`.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Postgres with pgvector. Locally: `postgresql://postgres:postgres@localhost:5432/avarag`; on Supabase, use the pooler on port 6543 |
| `OPENAI_API_KEY` | Embeddings, chat and transcription |
| `OPENAI_CHAT_MODEL` | Optional, defaults to `gpt-4o-mini` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 and SQS |
| `S3_BUCKET_NAME` | Upload bucket |
| `SQS_QUEUE_URL` | Processing queue |

## Deployment

- **App:** Vercel, with the same environment variables.
- **Worker:** Lambda + SQS. See [`infra/document-processor/README.md`](infra/document-processor/README.md).
- **Database:** any Postgres with pgvector (e.g. Supabase). Run
  `npm run db:migrate` with the production `DATABASE_URL`.

## Migrations

`npm run db:migrate` applies each pending file in `db/migrations`
(`NNNN_description.sql`) once, inside a transaction, and records it in the
`schema_migrations` table. To change the schema, add a new file. Never edit an
applied migration: the command detects the change and fails.
