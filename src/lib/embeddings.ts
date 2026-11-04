// Shared by the chat route (query embeddings) and the document worker
// (chunk embeddings): both sides must use the same model and dimension.
export const EMBEDDING_MODEL = "text-embedding-ada-002";

/** Formats an embedding as a pgvector literal, e.g. "[0.1,0.2]". */
export function toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}
