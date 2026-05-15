import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  francoKnowledgeChunks,
  francoKnowledgeDocuments,
} from "~/server/db/schema";
import { generateEmbedding, generateEmbeddings } from "./embeddings";

export type RetrievedKnowledgeChunk = {
  documentTitle: string;
  sourcePath: string;
  heading: string | null;
  content: string;
  similarity: number;
};

export async function retrieveFrancoKnowledge(query: string, limit = 8) {
  if (!db || !process.env.OPENAI_API_KEY) {
    return [] satisfies RetrievedKnowledgeChunk[];
  }

  const embedding = await generateEmbedding(query);
  if (embedding.length === 0) return [] satisfies RetrievedKnowledgeChunk[];

  return retrieveChunksForEmbedding(embedding, limit);
}

export async function retrieveFrancoKnowledgeMany({
  queries,
  limitPerQuery = 4,
  maxResults = 8,
}: {
  queries: string[];
  limitPerQuery?: number;
  maxResults?: number;
}) {
  if (!db || !process.env.OPENAI_API_KEY) {
    return [] satisfies (RetrievedKnowledgeChunk & {
      matchedQueries: string[];
    })[];
  }

  const normalizedQueries = queries
    .map((query) => query.replaceAll("\n", " ").trim())
    .filter(Boolean);
  if (normalizedQueries.length === 0) {
    return [] satisfies (RetrievedKnowledgeChunk & {
      matchedQueries: string[];
    })[];
  }

  const embeddings = await generateEmbeddings(normalizedQueries);
  const resultSets = await Promise.all(
    embeddings.map((embedding) =>
      retrieveChunksForEmbedding(embedding, limitPerQuery),
    ),
  );

  const dedupedChunks = new Map<
    string,
    RetrievedKnowledgeChunk & { matchedQueries: string[] }
  >();

  resultSets.forEach((chunks, queryIndex) => {
    const query = normalizedQueries[queryIndex];
    for (const chunk of chunks) {
      const key = `${chunk.sourcePath}:${chunk.heading ?? ""}:${chunk.content}`;
      const existing = dedupedChunks.get(key);
      if (existing) {
        existing.similarity = Math.max(existing.similarity, chunk.similarity);
        existing.matchedQueries.push(query);
        continue;
      }

      dedupedChunks.set(key, {
        ...chunk,
        matchedQueries: [query],
      });
    }
  });

  return Array.from(dedupedChunks.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

function retrieveChunksForEmbedding(embedding: number[], limit: number) {
  if (!db) return [];

  const MIN_SIMILARITY = 0.25;

  const similarity = sql<number>`1 - (${cosineDistance(
    francoKnowledgeChunks.embedding,
    embedding,
  )})`;

  return db
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
    .where(gt(similarity, MIN_SIMILARITY))
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
