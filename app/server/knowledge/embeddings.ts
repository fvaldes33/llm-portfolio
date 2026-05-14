import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function generateEmbedding(value: string): Promise<number[]> {
  const input = value.replaceAll("\n", " ").trim();
  if (!input) return [];

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: input,
  });

  return embedding;
}
