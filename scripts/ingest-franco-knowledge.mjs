import "dotenv/config";
/* global console, process */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import {
  francoKnowledgeChunks,
  francoKnowledgeDocuments,
} from "../app/server/db/schema.ts";

const CONTENT_DIR = path.resolve(process.cwd(), "content/interview");
const INGEST_EXTENSIONS = new Set([".md", ".yaml", ".yml"]);
const EMBEDDING_MODEL = "text-embedding-3-small";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured");
}

const db = drizzle(process.env.DATABASE_URL);
const files = await listKnowledgeFiles(CONTENT_DIR);

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

  const cleaned = cleanKnowledgeText(raw, filePath);
  const chunks = chunkText(cleaned);
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

console.log(`Ingested ${files.length} Franco knowledge files.`);

async function generateEmbedding(value) {
  const input = value.replaceAll("\n", " ").trim();
  if (!input) return [];

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: input,
  });

  return embedding;
}

async function listKnowledgeFiles(dir) {
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

function cleanKnowledgeText(raw, filePath) {
  const extension = path.extname(filePath);
  if (extension !== ".yaml" && extension !== ".yml") return raw;

  const skippedTopLevelKeys = new Set([
    "schema_version",
    "updated_at",
    "source_session",
    "answers",
  ]);

  return raw
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [""];

      const topLevelKey = trimmed.match(/^([a-zA-Z0-9_]+):(?:\s|$)/)?.[1];
      if (topLevelKey && skippedTopLevelKeys.has(topLevelKey)) return [];

      const listKeyValue = trimmed.match(/^-\s+([a-zA-Z0-9_]+):\s*(.*)$/);
      if (listKeyValue) {
        return [
          `- ${prettifyKey(listKeyValue[1])}: ${cleanScalar(listKeyValue[2])}`,
        ];
      }

      const listValue = trimmed.match(/^-\s+(.+)$/);
      if (listValue) return [`- ${cleanScalar(listValue[1])}`];

      const keyValue = trimmed.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (keyValue) {
        const key = prettifyKey(keyValue[1]);
        const value = cleanScalar(keyValue[2]);
        return value ? [`${key}: ${value}`] : ["", `${key}:`];
      }

      return [cleanScalar(trimmed)];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function prettifyKey(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanScalar(value) {
  return value
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
}

function chunkText(raw) {
  const normalized = raw.trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n(?=#{1,3}\s+)/g);
  return sections.flatMap((section) => {
    const heading = section.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim() ?? null;
    const paragraphs = section
      .split(/\n\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean);

    const chunks = [];
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

function slugify(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFromPath(value) {
  return path
    .basename(value)
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ");
}

function getKind(sourcePath) {
  if (sourcePath.includes("/answers/")) return "interview_answer";
  if (sourcePath.includes("/profiles/")) return "profile";
  if (sourcePath.includes("/research/")) return "research";
  return "manual";
}

function getVisibility(sourcePath) {
  if (sourcePath.includes("research/sources")) return "internal";
  return "public";
}
