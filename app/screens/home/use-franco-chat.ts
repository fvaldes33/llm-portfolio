import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSetAtom } from "jotai";
import {
  resetCanvasDocumentAtom,
  resetFollowUpPromptsAtom,
  setCanvasDocumentAtom,
  setFollowUpPromptsAtom,
} from "~/lib/canvas-atoms";
import { useRootLoader } from "~/hooks/use-root-loader";
import type { CanvasDocument } from "~/lib/canvas-document";
import type { FrancoUIMessage } from "~/lib/chat/types";

export type FrancoChat = ReturnType<typeof useFrancoChat>;

export function useFrancoChat() {
  const { conversation } = useRootLoader();
  const setCanvasDocument = useSetAtom(setCanvasDocumentAtom);
  const setFollowUpPrompts = useSetAtom(setFollowUpPromptsAtom);
  const resetCanvasDocument = useSetAtom(resetCanvasDocumentAtom);
  const resetFollowUpPrompts = useSetAtom(resetFollowUpPromptsAtom);

  const { messages, sendMessage, setMessages, status, error } =
    useChat<FrancoUIMessage>({
      id: conversation.id,
      messages: conversation.messages,
      transport: new DefaultChatTransport({ api: "/api/chat" }),
      onData: (part) => {
        if (part.type === "data-canvas") {
          const next = (part.data as { canvasDocument?: CanvasDocument })
            ?.canvasDocument;
          if (next?.blocks?.length) {
            setCanvasDocument(next);
          }
        }
        if (part.type === "data-followUps") {
          const next = (part.data as { prompts?: unknown })?.prompts;
          if (Array.isArray(next)) {
            setFollowUpPrompts(
              next.filter(
                (prompt): prompt is { label: string; prompt: string } =>
                  typeof prompt === "object" &&
                  prompt !== null &&
                  "label" in prompt &&
                  "prompt" in prompt &&
                  typeof prompt.label === "string" &&
                  typeof prompt.prompt === "string",
              ),
            );
          }
        }
      },
    });

  const busy = status === "streaming" || status === "submitted";

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
  }

  async function resetChat() {
    if (busy) return;

    setMessages([]);
    resetFollowUpPrompts();
    resetCanvasDocument();

    const response = await fetch("/api/chat/reset", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
  }

  return { messages, status, error, ask, busy, resetChat };
}
