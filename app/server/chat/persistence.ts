import type { UIMessage } from "ai";
import { asc, count, eq } from "drizzle-orm";
import type { FrancoUIMessage } from "~/lib/chat/types";
import { getDb } from "~/server/db";
import { chatConversations, chatMessages } from "~/server/db/schema";
import { hashIp } from "./rate-limit";

export type PersistedConversation = {
  id: string;
};

export async function createConversation({
  ip,
  userAgent,
  model,
  title,
}: {
  ip: string;
  userAgent?: string | null;
  model: string;
  title?: string;
}): Promise<PersistedConversation | null> {
  if (!process.env.DATABASE_URL) return null;

  const [conversation] = await getDb()
    .insert(chatConversations)
    .values({
      ipHash: hashIp(ip),
      userAgent,
      model,
      title: title?.slice(0, 255),
    })
    .returning({ id: chatConversations.id });

  return conversation ?? null;
}

export async function loadConversationMessages(
  conversationId?: string,
): Promise<FrancoUIMessage[]> {
  if (!process.env.DATABASE_URL || !conversationId) return [];

  const rows = await getDb()
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      parts: chatMessages.parts,
    })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.order));

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: row.parts as FrancoUIMessage["parts"],
  }));
}

export async function resetConversationMessages(conversationId?: string) {
  if (!process.env.DATABASE_URL || !conversationId) return;

  await getDb()
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  await getDb()
    .update(chatConversations)
    .set({
      messageCount: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chatConversations.id, conversationId));
}

export async function persistConversationTurn({
  conversationId,
  inputMessages,
  assistantText,
  assistantParts,
  model,
  finishReason,
  promptTokens,
  completionTokens,
  totalTokens,
}: {
  conversationId?: string;
  inputMessages: FrancoUIMessage[];
  assistantText: string;
  assistantParts: UIMessage["parts"];
  model: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) {
  if (!process.env.DATABASE_URL || !conversationId) return;

  const latestUserMessage = [...inputMessages]
    .reverse()
    .find((message) => message.role === "user");
  if (!latestUserMessage) return;

  const [{ value: orderStart }] = await getDb()
    .select({ value: count() })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  const rows = [
    {
      conversationId,
      role: "user" as const,
      status: "success" as const,
      content: getTextFromParts(latestUserMessage.parts),
      parts: latestUserMessage.parts,
      order: orderStart,
    },
    {
      conversationId,
      role: "assistant" as const,
      status: "success" as const,
      content: assistantText,
      parts: assistantParts,
      order: orderStart + 1,
      model,
      finishReason,
      promptTokens,
      completionTokens,
      totalTokens,
    },
  ];

  await getDb().insert(chatMessages).values(rows);
  await getDb()
    .update(chatConversations)
    .set({
      messageCount: orderStart + rows.length,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chatConversations.id, conversationId));
}

function getTextFromParts(parts: UIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
