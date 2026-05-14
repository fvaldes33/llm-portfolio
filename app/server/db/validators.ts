import type { UIMessage } from "ai";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  chatConversations,
  chatMessages,
  francoKnowledgeChunks,
  francoKnowledgeDocuments,
  ipRateLimitHits,
} from "./schema";

export const uiMessagePartSchema = z.custom<UIMessage["parts"][number]>();
export const uiMessagePartsSchema = z.array(uiMessagePartSchema);

export const insertIpRateLimitHitSchema = createInsertSchema(ipRateLimitHits);
export const selectIpRateLimitHitSchema = createSelectSchema(ipRateLimitHits);

export const insertChatConversationSchema =
  createInsertSchema(chatConversations);
export const selectChatConversationSchema =
  createSelectSchema(chatConversations);

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  parts: uiMessagePartsSchema,
});
export const selectChatMessageSchema = createSelectSchema(chatMessages, {
  parts: uiMessagePartsSchema,
});

export const insertFrancoKnowledgeDocumentSchema = createInsertSchema(
  francoKnowledgeDocuments,
);
export const selectFrancoKnowledgeDocumentSchema = createSelectSchema(
  francoKnowledgeDocuments,
);
export const insertFrancoKnowledgeChunkSchema = createInsertSchema(
  francoKnowledgeChunks,
  {
    embedding: z.array(z.number()).length(1536),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  },
);
export const selectFrancoKnowledgeChunkSchema = createSelectSchema(
  francoKnowledgeChunks,
  {
    embedding: z.array(z.number()).length(1536),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  },
);

export type InsertIpRateLimitHit = z.infer<typeof insertIpRateLimitHitSchema>;
export type SelectIpRateLimitHit = z.infer<typeof selectIpRateLimitHitSchema>;
export type InsertChatConversation = z.infer<
  typeof insertChatConversationSchema
>;
export type SelectChatConversation = z.infer<
  typeof selectChatConversationSchema
>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SelectChatMessage = z.infer<typeof selectChatMessageSchema>;
export type InsertFrancoKnowledgeDocument = z.infer<
  typeof insertFrancoKnowledgeDocumentSchema
>;
export type SelectFrancoKnowledgeDocument = z.infer<
  typeof selectFrancoKnowledgeDocumentSchema
>;
export type InsertFrancoKnowledgeChunk = z.infer<
  typeof insertFrancoKnowledgeChunkSchema
>;
export type SelectFrancoKnowledgeChunk = z.infer<
  typeof selectFrancoKnowledgeChunkSchema
>;
