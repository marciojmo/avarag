# AVA

Envie documentos e faça perguntas sobre eles num chat.

- **Upload:** o navegador envia o arquivo (PDF, TXT, Markdown ou MP3) direto
  para o S3, usando uma URL pré-assinada. Depois, a API registra o documento e
  coloca uma mensagem na fila SQS.
- **Processamento em segundo plano:** um Lambda consome a fila, extrai o texto
  (o MP3 é transcrito com o Whisper), divide em trechos, gera os embeddings e
  grava tudo no Postgres com pgvector.
- **Chat (RAG):** cada pergunta é transformada em embedding. O app busca os
  trechos mais próximos entre os documentos do usuário e envia a resposta do
  modelo em streaming.
- **Chat público:** cada usuário tem um link (`/live-chat/<id>`), exibido no
  dashboard. Qualquer pessoa com o link pode fazer perguntas sobre os documentos
  desse usuário, sem precisar entrar.

## Estrutura

| Caminho | O que faz |
| --- | --- |
| `src/app/page.tsx` | Landing page |
| `src/app/login`, `src/app/signup` | Entrada e cadastro com Google |
| `src/app/dashboard` | Tela principal: arquivos e link público na lateral, chat no centro |
| `src/app/live-chat/[ownerId]` | Chat público sobre os documentos de um usuário |
| `src/app/api/uploads` | Lista, registra (`POST`), gera URL de upload (`presign`) e exclui (`[id]`) documentos |
| `src/app/api/chat`, `src/app/api/public/chat` | Respondem perguntas com base nos documentos (RAG em `src/lib/rag.ts`) |
| `src/workers` | Processamento dos documentos: `lambda.ts` (produção) e `document-processor.ts` (local) |
| `infra/document-processor` | Template SAM (fila, DLQ, Lambda) e guia de deploy |
| `__docs/db_schema.sql` | Schema do banco |

## Desenvolvimento

1. Crie o `.env.local` com as variáveis abaixo e rode `__docs/db_schema.sql`
   no Postgres (a extensão `vector` é obrigatória).
2. Suba o app e, se quiser processar documentos localmente, o worker:

```bash
npm run dev
```

```bash
npm run worker
```

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Postgres com pgvector (no Supabase, use o pooler na porta 6543) |
| `OPENAI_API_KEY` | Embeddings, chat e transcrição |
| `OPENAI_CHAT_MODEL` | Opcional, padrão `gpt-4o-mini` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login com o Google |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | NextAuth |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 e SQS |
| `S3_BUCKET_NAME` | Bucket dos uploads |
| `SQS_QUEUE_URL` | Fila de processamento |

## Deploy

- **App:** Vercel, com as mesmas variáveis de ambiente.
- **Worker:** Lambda + SQS. Veja [`infra/document-processor/README.md`](infra/document-processor/README.md).
- **Banco já existente com o schema antigo (com agentes):** rode
  `__docs/migrations/001_remove_agents.sql`.
