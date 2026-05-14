import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "~/server/db";
import {
  francoKnowledgeChunks,
  francoKnowledgeDocuments,
} from "~/server/db/schema";
import { generateEmbedding } from "./embeddings";

export type RetrievedKnowledgeChunk = {
  documentTitle: string;
  sourcePath: string;
  heading: string | null;
  content: string;
  similarity: number;
};

export async function retrieveFrancoKnowledge(query: string, limit = 8) {
  if (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY) {
    return [] satisfies RetrievedKnowledgeChunk[];
  }

  const embedding = await generateEmbedding(query);
  if (embedding.length === 0) return [] satisfies RetrievedKnowledgeChunk[];

  const similarity = sql<number>`1 - (${cosineDistance(
    francoKnowledgeChunks.embedding,
    embedding,
  )})`;

  return getDb()
    .select({
      documentTitle: francoKnowledgeDocuments.title,
      sourcePath: francoKnowledgeDocuments.sourcePath,
      heading: francoKnowledgeChunks.heading,
      content: francoKnowledgeChunks.content,
      similarity,
    })
    .from(francoKnowledgeChunks)
    .innerJoin(
      francoKnowledgeDocuments,
      eq(francoKnowledgeChunks.documentId, francoKnowledgeDocuments.id),
    )
    .where(gt(similarity, 0.45))
    .orderBy((table) => desc(table.similarity))
    .limit(limit);
}

export function formatRetrievedKnowledge(chunks: RetrievedKnowledgeChunk[]) {
  if (chunks.length === 0) {
    return "No retrieved knowledge chunks. Use the core profile in the system prompt and avoid making up specifics.";
  }

  return chunks
    .map((chunk, index) => {
      const heading = chunk.heading ? ` / ${chunk.heading}` : "";
      return [
        `## ${index + 1}. ${chunk.documentTitle}${heading}`,
        `Source: ${chunk.sourcePath}`,
        `Similarity: ${chunk.similarity.toFixed(3)}`,
        chunk.content,
      ].join("\n");
    })
    .join("\n\n");
}
