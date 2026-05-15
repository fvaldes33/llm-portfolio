import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function generateEmbedding(value: string): Promise<number[]> {
  const input = normalizeEmbeddingInput(value);
  if (!input) return [];

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: input,
  });

  return embedding;
}

export async function generateEmbeddings(
  values: string[],
): Promise<number[][]> {
  const inputs = values.map(normalizeEmbeddingInput).filter(Boolean);
  if (inputs.length === 0) return [];

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: inputs,
  });

  return embeddings;
}

function normalizeEmbeddingInput(value: string) {
  return value.replaceAll("\n", " ").trim();
}
