import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  validateUIMessages,
} from "ai";
import type { CanvasDocument } from "~/lib/canvas-document";
import type { FrancoUIMessage } from "~/lib/chat/types";
import { francoTools } from "~/server/chat/tools";
import { SYSTEM_PROMPT } from "~/lib/system-prompt";
import {
  createConversation,
  loadConversationMessages,
  persistAssistantMessage,
  persistUserMessage,
} from "~/server/chat/persistence";
import { checkRateLimit, getRequestIp } from "~/server/chat/rate-limit";
import { commitSession, getSession } from "~/server/session";
import type { Route } from "./+types/api.chat";
import {
  kimiK26,
  glm5Turbo,
  claudeSonnet46,
  gpt5ChatLatest,
} from "~/server/chat/models";

const MODELS = {
  kimiK26: kimiK26,
  glm5Turbo: glm5Turbo,
  claudeSonnet46: claudeSonnet46,
  gpt5ChatLatest: gpt5ChatLatest,
};

const MAX_MESSAGES = 20; // 10 user + 10 assistant

const MODEL = MODELS.gpt5ChatLatest.modelId;

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent");
  if (!(await checkRateLimit({ ip, route: "/api/chat", userAgent }))) {
    return new Response("Slow down a bit.", { status: 429 });
  }

  let payload: { id?: unknown; message?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const incomingMessage = getIncomingMessage(payload);
  if (!incomingMessage) {
    return new Response("Bad request", { status: 400 });
  }

  const session = await getSession(request.headers.get("Cookie"));
  let conversationId = session.get("conversationId");
  let setCookie: string | undefined;

  if (!conversationId) {
    const conversation = await createConversation({
      ip,
      userAgent,
      model: MODEL,
      title: getConversationTitle([incomingMessage]),
    });
    conversationId = conversation?.id;
    if (conversationId) {
      session.set("conversationId", conversationId);
      setCookie = await commitSession(session);
    }
  }

  const previousMessages = await loadConversationMessages(conversationId);
  const messages = mergeIncomingMessage(previousMessages, incomingMessage);
  const userMessageOrder = messages.length - 1;

  if (messages.length > MAX_MESSAGES) {
    return new Response("Conversation limit reached.", { status: 413 });
  }

  const validatedMessages = await validateUIMessages<FrancoUIMessage>({
    messages,
    tools: francoTools,
  });

  await persistUserMessage({
    conversationId,
    message: incomingMessage,
    order: userMessageOrder,
    model: MODEL,
  });

  const stream = createUIMessageStream<FrancoUIMessage>({
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(validatedMessages);

      let usage:
        | {
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
          }
        | undefined;

      const result = streamText({
        model: MODELS.gpt5ChatLatest,
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        stopWhen: stepCountIs(8),
        tools: francoTools,
        experimental_onToolCallStart: (event) => {
          if (event.toolCall.toolName === "renderCanvasDocument") {
            writer.write({
              type: "data-canvasActivity",
              data: { state: "pending", intent: "custom" },
              transient: true,
            });
          }
          if (event.toolCall.toolName === "showKnownCanvas") {
            writer.write({
              type: "data-canvasActivity",
              transient: true,
              data: {
                state: "pending",
                intent: event.toolCall.input as
                  | "welcome"
                  | "locations"
                  | "current"
                  | "projects",
              },
            });
          }
        },
        experimental_onToolCallFinish: (event) => {
          if (event.toolCall.toolName === "renderCanvasDocument") {
            writer.write({
              type: "data-canvasActivity",
              data: { state: "generated" },
              transient: true,
            });
          }
          if (event.toolCall.toolName === "showKnownCanvas") {
            writer.write({
              type: "data-canvasActivity",
              data: { state: "generated" },
              transient: true,
            });
          }
        },
        experimental_context: {
          writeCanvas: (canvasDocument: CanvasDocument) => {
            writer.write({
              type: "data-canvas",
              data: { canvasDocument },
            });
          },
          writeFollowUps: (prompts: { label: string; prompt: string }[]) => {
            writer.write({
              type: "data-followUps",
              data: { prompts },
              transient: true,
            });
          },
        },
        onFinish: (event) => {
          usage = event.totalUsage;
        },
      });
      result.consumeStream();
      writer.merge(
        result.toUIMessageStream({
          originalMessages: validatedMessages,
          generateMessageId: () => crypto.randomUUID(),
          onFinish: async ({ responseMessage, finishReason }) => {
            // Persist the final UI message, not the raw text response. This keeps
            // tool calls/results and generated data parts available after refresh.
            await persistAssistantMessage({
              conversationId,
              inputMessageCount: validatedMessages.length,
              assistantMessageId: responseMessage.id,
              assistantText: getTextFromParts(responseMessage.parts),
              assistantParts: responseMessage.parts,
              model: MODEL,
              finishReason,
              promptTokens: usage?.inputTokens,
              completionTokens: usage?.outputTokens,
              totalTokens: usage?.totalTokens,
            });
          },
        }),
      );
    },
    onError: (error: unknown) => {
      console.error("[api.chat] stream error", error);
      return "Something went wrong on my end. Try again in a moment.";
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: setCookie ? { "Set-Cookie": setCookie } : undefined,
  });
}

function getIncomingMessage(payload: {
  message?: unknown;
}): FrancoUIMessage | null {
  const message = payload.message;
  if (isUserMessage(message)) return message;

  return null;
}

function isUserMessage(value: unknown): value is FrancoUIMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "role" in value &&
    "parts" in value &&
    typeof value.id === "string" &&
    value.role === "user" &&
    Array.isArray(value.parts)
  );
}

function mergeIncomingMessage(
  previousMessages: FrancoUIMessage[],
  incomingMessage: FrancoUIMessage,
) {
  const existingIndex = previousMessages.findIndex(
    (message) => message.id === incomingMessage.id,
  );

  if (existingIndex === -1) {
    return [...previousMessages, incomingMessage];
  }

  // Regenerate sends a previous user message. Keep history through that user
  // turn and drop stale assistant/tool output after it.
  return [...previousMessages.slice(0, existingIndex), incomingMessage];
}

function getTextFromParts(parts: FrancoUIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getLatestUserText(messages: FrancoUIMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  return lastUserMessage ? getTextFromParts(lastUserMessage.parts) : "";
}

function getConversationTitle(messages: FrancoUIMessage[]) {
  const title = getLatestUserText(messages);
  return title ? title.slice(0, 255) : undefined;
}
