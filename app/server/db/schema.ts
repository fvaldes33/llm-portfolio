import type { UIMessage } from "ai";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const timestampColumns = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
};

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
]);

export const chatMessageStatusEnum = pgEnum("chat_message_status", [
  "pending",
  "success",
  "failed",
]);

export const francoKnowledgeVisibilityEnum = pgEnum(
  "franco_knowledge_visibility",
  ["public", "internal", "private"],
);

export const francoKnowledgeKindEnum = pgEnum("franco_knowledge_kind", [
  "interview_answer",
  "profile",
  "research",
  "manual",
]);

export const ipRateLimitHits = pgTable(
  "ip_rate_limit_hits",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    ipHash: varchar("ip_hash", { length: 128 }).notNull(),
    route: varchar("route", { length: 128 }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestampColumns.createdAt,
  },
  (table) => [
    index("ip_rate_limit_hits_ip_hash_created_at_idx").on(
      table.ipHash,
      table.createdAt,
    ),
    index("ip_rate_limit_hits_route_created_at_idx").on(
      table.route,
      table.createdAt,
    ),
  ],
);

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    title: varchar("title", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 128 }),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    model: varchar("model", { length: 128 }),
    messageCount: integer("message_count").default(0).notNull(),
    createdAt: timestampColumns.createdAt,
    updatedAt: timestampColumns.updatedAt,
  },
  (table) => [
    index("chat_conversations_created_at_idx").on(table.createdAt),
    index("chat_conversations_ip_hash_created_at_idx").on(
      table.ipHash,
      table.createdAt,
    ),
  ],
);

export const francoKnowledgeDocuments = pgTable(
  "franco_knowledge_documents",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    sourcePath: text("source_path").notNull(),
    kind: francoKnowledgeKindEnum("kind").notNull(),
    visibility: francoKnowledgeVisibilityEnum("visibility")
      .default("public")
      .notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    createdAt: timestampColumns.createdAt,
    updatedAt: timestampColumns.updatedAt,
  },
  (table) => [
    index("franco_knowledge_documents_slug_idx").on(table.slug),
    index("franco_knowledge_documents_visibility_idx").on(table.visibility),
  ],
);

export const francoKnowledgeChunks = pgTable(
  "franco_knowledge_chunks",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => francoKnowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    heading: varchar("heading", { length: 255 }),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestampColumns.createdAt,
    updatedAt: timestampColumns.updatedAt,
  },
  (table) => [
    index("franco_knowledge_chunks_document_id_idx").on(table.documentId),
    index("franco_knowledge_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const chatLeads = pgTable(
  "chat_leads",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    ip: varchar("ip", { length: 45 }),
    ipHash: varchar("ip_hash", { length: 128 }),
    userAgent: text("user_agent"),
    conversationId: uuid("conversation_id").references(
      () => chatConversations.id,
      { onDelete: "set null" },
    ),
    source: varchar("source", { length: 32 }).notNull(),
    createdAt: timestampColumns.createdAt,
  },
  (table) => [
    index("chat_leads_email_idx").on(table.email),
    index("chat_leads_created_at_idx").on(table.createdAt),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    status: chatMessageStatusEnum("status").default("pending").notNull(),
    content: text("content").notNull(),
    parts: jsonb("parts").$type<UIMessage["parts"]>().notNull(),
    order: integer("order").notNull(),
    model: varchar("model", { length: 128 }),
    finishReason: varchar("finish_reason", { length: 64 }),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    totalTokens: integer("total_tokens"),
    error: text("error"),
    createdAt: timestampColumns.createdAt,
    updatedAt: timestampColumns.updatedAt,
  },
  (table) => [
    index("chat_messages_conversation_id_idx").on(table.conversationId),
    index("chat_messages_created_at_idx").on(table.createdAt),
  ],
);
