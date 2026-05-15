import type { UIMessage } from "ai";
import { and, asc, eq, gt } from "drizzle-orm";
import type { FrancoUIMessage } from "~/lib/chat/types";
import { db } from "~/server/db";
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
  if (!db) return null;

  const [conversation] = await db
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
  if (!db || !conversationId) return [];

  const rows = await db
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
  if (!db || !conversationId) return;

  await db
    .delete(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId));

  await db
    .update(chatConversations)
    .set({
      messageCount: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chatConversations.id, conversationId));
}

export async function persistUserMessage({
  conversationId,
  message,
  order,
  model,
}: {
  conversationId?: string;
  message: FrancoUIMessage;
  order: number;
  model?: string;
}) {
  if (!db || !conversationId || message.role !== "user") return;

  const id = isUuid(message.id) ? message.id : crypto.randomUUID();
  await db
    .insert(chatMessages)
    .values({
      id,
      conversationId,
      role: "user",
      status: "success",
      content: getTextFromParts(message.parts),
      parts: message.parts,
      order,
      model,
    })
    .onConflictDoUpdate({
      target: chatMessages.id,
      set: {
        status: "success",
        content: getTextFromParts(message.parts),
        parts: message.parts,
        order,
        model,
        updatedAt: new Date().toISOString(),
      },
    });

  // Regenerate resends an existing user message. Drop only stale messages after
  // that point, usually the assistant response being regenerated.
  await db
    .delete(chatMessages)
    .where(
      and(
        eq(chatMessages.conversationId, conversationId),
        gt(chatMessages.order, order),
      ),
    );

  await db
    .update(chatConversations)
    .set({
      messageCount: order + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chatConversations.id, conversationId));
}

export async function persistAssistantMessage({
  conversationId,
  inputMessageCount,
  assistantMessageId,
  assistantText,
  assistantParts,
  model,
  finishReason,
  promptTokens,
  completionTokens,
  totalTokens,
}: {
  conversationId?: string;
  inputMessageCount: number;
  assistantMessageId: string;
  assistantText: string;
  assistantParts: UIMessage["parts"];
  model: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) {
  if (!db || !conversationId) return;

  await db
    .insert(chatMessages)
    .values({
      id: assistantMessageId,
      conversationId,
      role: "assistant",
      status: "success",
      content: assistantText,
      parts: assistantParts,
      order: inputMessageCount,
      model,
      finishReason,
      promptTokens,
      completionTokens,
      totalTokens,
    })
    .onConflictDoUpdate({
      target: chatMessages.id,
      set: {
        status: "success",
        content: assistantText,
        parts: assistantParts,
        order: inputMessageCount,
        model,
        finishReason,
        promptTokens,
        completionTokens,
        totalTokens,
        updatedAt: new Date().toISOString(),
      },
    });

  await db
    .update(chatConversations)
    .set({
      messageCount: inputMessageCount + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chatConversations.id, conversationId));
}

function isUuid(value?: string) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function getTextFromParts(parts: UIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}
