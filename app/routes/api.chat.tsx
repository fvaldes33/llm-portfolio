import { anthropic } from "@ai-sdk/anthropic";
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
import {
  formatRetrievedKnowledge,
  retrieveFrancoKnowledge,
} from "~/server/knowledge/retrieval";
import type { Route } from "./+types/api.chat";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1500;

const MODEL = "claude-sonnet-4-6";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ip = getRequestIp(request);
  const userAgent = request.headers.get("user-agent");
  if (!(await checkRateLimit({ ip, route: "/api/chat", userAgent }))) {
    return new Response("Slow down a bit.", { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "Chat is not configured yet. Set ANTHROPIC_API_KEY in your environment.",
      { status: 503 },
    );
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
  if (messages.length > MAX_MESSAGES) {
    return new Response("Conversation too long. Refresh to start over.", {
      status: 413,
    });
  }
  for (const msg of messages) {
    for (const part of msg.parts ?? []) {
      if (
        part.type === "text" &&
        typeof part.text === "string" &&
        part.text.length > MAX_MESSAGE_CHARS
      ) {
        return new Response("Message too long.", { status: 413 });
      }
    }
  }

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

  const latestUserText = getLatestUserText(messages);
  const retrievedKnowledge = await retrieveFrancoKnowledge(latestUserText);
  const groundedSystemPrompt = `${SYSTEM_PROMPT}\n\n# Retrieved Franco knowledge\n\nUse these retrieved chunks as the most specific source for this answer. If the chunks do not cover the question, say what you know from the core profile and do not invent details.\n\n${formatRetrievedKnowledge(retrievedKnowledge)}`;

  const stream = createUIMessageStream<FrancoUIMessage>({
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(messages);

      const result = streamText({
        model: anthropic(MODEL),
        system: groundedSystemPrompt,
        messages: modelMessages,
        stopWhen: stepCountIs(5),
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
        onFinish: async (event) => {
          await persistConversationTurn({
            conversationId,
            inputMessages: messages,
            assistantText: event.text,
            assistantParts: [{ type: "text", text: event.text }],
            model: MODEL,
            finishReason: event.finishReason,
            promptTokens: event.totalUsage.inputTokens,
            completionTokens: event.totalUsage.outputTokens,
            totalTokens: event.totalUsage.totalTokens,
          });
        },
      });
      result.consumeStream();
      writer.merge(result.toUIMessageStream());
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

function getLatestUserText(messages: FrancoUIMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  return (
    lastUserMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

function getConversationTitle(messages: FrancoUIMessage[]) {
  const title = getLatestUserText(messages);
  return title ? title.slice(0, 255) : undefined;
}
