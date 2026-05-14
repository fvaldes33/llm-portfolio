import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "~/server/db";
import {
  francoKnowledgeChunks,
  francoKnowledgeDocuments,
} from "~/server/db/schema";
import { generateEmbedding } from "./embeddings";

const CONTENT_DIR = path.resolve(process.cwd(), "content/interview");
const INGEST_EXTENSIONS = new Set([".md", ".yaml", ".yml"]);

export async function ingestFrancoKnowledge() {
  const files = await listKnowledgeFiles(CONTENT_DIR);
  const db = getDb();

  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8");
    const relativePath = path.relative(process.cwd(), filePath);
    const slug = slugify(relativePath);
    const contentHash = createHash("sha256").update(raw).digest("hex");
    const title = titleFromPath(relativePath);

    const [document] = await db
      .insert(francoKnowledgeDocuments)
      .values({
        slug,
        title,
        sourcePath: relativePath,
        kind: getKind(relativePath),
        visibility: getVisibility(relativePath),
        contentHash,
      })
      .onConflictDoUpdate({
        target: francoKnowledgeDocuments.slug,
        set: {
          title,
          sourcePath: relativePath,
          kind: getKind(relativePath),
          visibility: getVisibility(relativePath),
          contentHash,
          updatedAt: new Date().toISOString(),
        },
      })
      .returning({ id: francoKnowledgeDocuments.id });

    if (!document) continue;

    await db
      .delete(francoKnowledgeChunks)
      .where(eq(francoKnowledgeChunks.documentId, document.id));

    const chunks = chunkText(raw);
    for (const [index, chunk] of chunks.entries()) {
      const embedding = await generateEmbedding(chunk.content);
      await db.insert(francoKnowledgeChunks).values({
        documentId: document.id,
        chunkIndex: index,
        heading: chunk.heading,
        content: chunk.content,
        metadata: { sourcePath: relativePath },
        embedding,
      });
    }
  }

  return { files: files.length };
}

async function listKnowledgeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listKnowledgeFiles(entryPath);
      if (INGEST_EXTENSIONS.has(path.extname(entry.name))) return [entryPath];
      return [];
    }),
  );

  return files.flat();
}

function chunkText(raw: string) {
  const normalized = raw.trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n(?=#{1,3}\s+)/g);
  return sections.flatMap((section) => {
    const heading = section.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() ?? null;
    const paragraphs = section
      .split(/\n\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean);

    const chunks: { heading: string | null; content: string }[] = [];
    let current = "";
    for (const paragraph of paragraphs) {
      const next = current ? `${current}\n\n${paragraph}` : paragraph;
      if (next.length > 1800 && current) {
        chunks.push({ heading, content: current });
        current = paragraph;
      } else {
        current = next;
      }
    }
    if (current) chunks.push({ heading, content: current });
    return chunks;
  });
}

function slugify(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromPath(value: string) {
  return path
    .basename(value)
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ");
}

function getKind(sourcePath: string) {
  if (sourcePath.includes("/answers/")) return "interview_answer" as const;
  if (sourcePath.includes("/profiles/")) return "profile" as const;
  if (sourcePath.includes("/research/")) return "research" as const;
  return "manual" as const;
}

function getVisibility(sourcePath: string) {
  if (sourcePath.includes("research/sources")) return "internal" as const;
  return "public" as const;
}
