import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from "ai";
import type { CanvasDocument } from "~/lib/canvas-document";
import type { FrancoUIMessage } from "~/lib/chat/types";
import { francoTools } from "~/server/chat/tools";
import { SYSTEM_PROMPT } from "~/lib/system-prompt";
import {
  createConversation,
  persistConversationTurn,
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

const _MAX_MESSAGES = 20;
const _MAX_MESSAGE_CHARS = 1500;

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

  let payload: { messages?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!Array.isArray(payload.messages)) {
    return new Response("Bad request", { status: 400 });
  }
  const messages = payload.messages as FrancoUIMessage[];

  // For now, we're not enforcing any limits on the number of messages or the length of the messages.
  // if (messages.length > _MAX_MESSAGES) {
  //   return new Response("Conversation too long. Reset to start over.", {
  //     status: 413,
  //   });
  // }

  // const latestUserText = getLatestUserText(messages);
  // if (latestUserText.length > _MAX_MESSAGE_CHARS) {
  //   return new Response("Message too long.", { status: 413 });
  // }

  const session = await getSession(request.headers.get("Cookie"));
  let conversationId = session.get("conversationId");
  let setCookie: string | undefined;

  if (!conversationId) {
    const conversation = await createConversation({
      ip,
      userAgent,
      model: MODEL,
      title: getConversationTitle(messages),
    });
    conversationId = conversation?.id;
    if (conversationId) {
      session.set("conversationId", conversationId);
      setCookie = await commitSession(session);
    }
  }

  const stream = createUIMessageStream<FrancoUIMessage>({
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(messages);

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
          originalMessages: messages,
          generateMessageId: () => crypto.randomUUID(),
          onFinish: async ({ responseMessage, finishReason }) => {
            // Persist the final UI message, not the raw text response. This keeps
            // tool calls/results and generated data parts available after refresh.
            await persistConversationTurn({
              conversationId,
              inputMessages: messages,
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
