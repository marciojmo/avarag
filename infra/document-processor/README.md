# Document processor (Lambda + SQS)

Fluxo: o app (Vercel) grava o arquivo no S3, cria o registro em `documents` e
envia `{ documentId }` para a fila SQS. O Lambda `avarag-document-processor`
consome a fila, extrai o texto (PDF, txt/md, mp3 via Whisper), gera os
embeddings e grava em `chunks`, marcando o documento como `processed`.

- Código: [`src/workers/processor.ts`](../../src/workers/processor.ts) (pipeline) e
  [`src/workers/lambda.ts`](../../src/workers/lambda.ts) (handler).
- Falhas transitórias (rede, OpenAI, banco) voltam para a fila e são tentadas até
  3 vezes. Depois disso, o documento é marcado como `failed` e a mensagem vai
  para a DLQ `avarag-documents-dlq`.
- Falhas permanentes (tipo não suportado, arquivo sem texto) marcam o documento
  como `failed` na hora, sem novas tentativas.
- O reprocessamento é idempotente: os chunks antigos do documento são
  substituídos dentro de uma transação.

## Pré-requisitos

```bash
brew install awscli aws-sam-cli
```

```bash
aws configure   # região sa-east-1, com um usuário que possa criar stacks
```

## Deploy

1. Gerar o pacote (`.build/document-processor.zip`, binários para Linux arm64):

   ```bash
   npm run build:lambda
   ```

2. Publicar a stack (fila, DLQ, Lambda, permissões e logs). Na primeira vez,
   use `--guided` para salvar os parâmetros em `samconfig.toml`. **Não faça
   commit desse arquivo**, porque ele guarda os segredos:

   ```bash
   sam deploy --guided --template-file infra/document-processor/template.yaml --stack-name avarag-document-processor --region sa-east-1 --resolve-s3 --capabilities CAPABILITY_IAM
   ```

   Parâmetros: `UploadsBucketName` (o bucket de uploads), `DatabaseUrl`
   (pooler do Supabase, porta 6543) e `OpenAIApiKey`.

3. Copiar o output `QueueUrl` para `SQS_QUEUE_URL` na Vercel (e no
   `.env.local`).

Para atualizar o código depois, rode `npm run build:lambda` e
`sam deploy --template-file infra/document-processor/template.yaml`.

## Permissões do usuário IAM da Vercel

O app só precisa enviar mensagens para a fila e mexer nos objetos do bucket:

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

## CORS do bucket

O upload sai direto do browser para a URL pré-assinada:

```json
[
  {
    "AllowedOrigins": ["https://<seu-dominio>", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Operação

- Logs: `sam logs -n DocumentProcessorFunction --stack-name avarag-document-processor --tail`
- Reprocessar o que caiu na DLQ: no console do SQS, abra a DLQ e use
  *Start DLQ redrive* para devolver as mensagens à fila principal.
- Desenvolvimento local: `npm run worker` roda o mesmo pipeline lendo a fila
  com long polling. Não deixe o worker local ligado contra a mesma fila do
  Lambda.
