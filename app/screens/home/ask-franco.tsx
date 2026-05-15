import { EyeIcon, RotateCcwIcon } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "~/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "~/components/ai-elements/prompt-input";
import { Shimmer } from "~/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "~/components/ai-elements/suggestion";
import { followUpPromptsAtom, setCanvasDocumentAtom } from "~/lib/canvas-atoms";
import {
  canvasDocumentSchema,
  type CanvasDocument,
} from "~/lib/canvas-document";
import { SUGGESTED_PROMPTS } from "~/lib/franco-knowledge";
import { cn } from "~/lib/utils";
import { useSheetControl } from "~/hooks/use-sheet-control";
import { useFrancoChat } from "./use-franco-chat";

const seedText =
  "I'm Franco — Director of Engineering at Safety Radar. Ask anything, or pick a question.";

function getToolInputString(part: unknown, key: string) {
  if (!part || typeof part !== "object" || !("input" in part)) return undefined;
  const input = part.input;
  if (!input || typeof input !== "object" || !(key in input)) return undefined;
  const value = input[key as keyof typeof input];
  return typeof value === "string" ? value : undefined;
}

function getToolOutputCount(part: unknown) {
  if (!part || typeof part !== "object" || !("output" in part))
    return undefined;
  return Array.isArray(part.output) ? part.output.length : undefined;
}

function getCanvasDocumentFromToolPart(part: unknown) {
  if (!part || typeof part !== "object") return undefined;

  if ("output" in part && part.output && typeof part.output === "object") {
    const output = part.output;
    if ("canvasDocument" in output) {
      const parsed = canvasDocumentSchema.safeParse(output.canvasDocument);
      if (parsed.success) return parsed.data;
    }
  }

  if ("input" in part) {
    const parsed = canvasDocumentSchema.safeParse(part.input);
    if (parsed.success) return parsed.data;
  }

  return undefined;
}

function ToolCallStatus({
  label,
  doneLabel,
  state,
  detail,
  resultCount,
  canvasDocument,
  onShowCanvas,
}: {
  label: string;
  doneLabel?: string;
  state: string;
  detail?: string;
  resultCount?: number;
  canvasDocument?: CanvasDocument;
  onShowCanvas?: (canvasDocument: CanvasDocument) => void;
}) {
  const isDone = state === "output-available";
  const isError = state === "output-error";
  const displayLabel = isDone && doneLabel ? doneLabel : label;

  return (
    <div className="border-border bg-muted/40 text-muted-foreground rounded-2xl border px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-1.5 rounded-full",
            isError
              ? "bg-destructive"
              : isDone
                ? "bg-primary"
                : "bg-primary animate-pulse",
          )}
        />
        <span className="text-foreground font-medium">{displayLabel}</span>
        <span className="font-mono uppercase">{isDone ? "done" : state}</span>
        {isDone && canvasDocument && onShowCanvas && (
          <button
            type="button"
            onClick={() => onShowCanvas(canvasDocument)}
            className="hover:text-foreground focus-visible:ring-ring ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`Show canvas: ${canvasDocument.title}`}
            title="Show this canvas again"
          >
            <EyeIcon className="size-3" />
            <span>view</span>
          </button>
        )}
      </div>
      {detail && <p className="mt-1 truncate">{detail}</p>}
      {typeof resultCount === "number" && (
        <p className="mt-1 font-mono uppercase">
          {resultCount} related {resultCount === 1 ? "chunk" : "chunks"}
        </p>
      )}
    </div>
  );
}

export type AskFrancoVariant = "card" | "embedded";

export function AskFranco({
  variant = "card",
  onBeforeAsk,
}: {
  /**
   * "card" — standalone panel with rounded border + shadow (desktop right pane).
   * "embedded" — flat, no chrome (rendered inside the mobile bottom sheet).
   */
  variant?: AskFrancoVariant;
  /**
   * Fires right before a message is sent. Used by the mobile sheet to snap to
   * the half-snap so the user can see the canvas update above the sheet.
   */
  onBeforeAsk?: () => void;
} = {}) {
  const {
    messages,
    ask: askChat,
    busy,
    status,
    error,
    resetChat,
  } = useFrancoChat();
  const followUpPrompts = useAtomValue(followUpPromptsAtom);
  const setCanvasDocument = useSetAtom(setCanvasDocumentAtom);
  const sheetControl = useSheetControl();
  const [input, setInput] = useState("");

  function ask(text: string) {
    onBeforeAsk?.();
    askChat(text);
  }

  // Tool-call "view" handler: swap the canvas, then drop the mobile sheet to
  // half so the canvas is visible above it. On desktop the sheet action is a
  // safe no-op (the sheet isn't mounted).
  function handleShowCanvas(canvasDocument: CanvasDocument) {
    setCanvasDocument(canvasDocument);
    sheetControl.revealCanvas();
  }

  const hasConversation = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasText = lastMessage?.parts?.some(
    (p) => p.type === "text" && p.text.length > 0,
  );
  const showThinking =
    busy &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      (lastMessage.role === "assistant" && !lastAssistantHasText));

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;
    ask(message.text);
    setInput("");
  }

  return (
    <div
      className={cn(
        "dark flex h-full flex-col overflow-hidden",
        variant === "card" &&
          "bg-background text-foreground border-border rounded-3xl border shadow-2xl",
      )}
    >
      <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary relative inline-block size-2 rounded-full">
            <span
              aria-hidden
              className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60"
            />
          </span>
          <p className="text-foreground text-sm font-semibold">
            Ask Me <span className="hidden sm:inline">Anything</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasConversation && (
            <button
              type="button"
              onClick={() => void resetChat()}
              disabled={busy}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              title="Reset chat"
            >
              <RotateCcwIcon className="size-3" />
              Reset
            </button>
          )}
          <p className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.25em] uppercase">
            live
          </p>
        </div>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {!hasConversation && (
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>{seedText}</MessageResponse>
              </MessageContent>
            </Message>
          )}
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <MessageResponse key={`${message.id}-${i}`}>
                        {part.text}
                      </MessageResponse>
                    );
                  }
                  if (part.type === "tool-searchFrancoKnowledge") {
                    return (
                      <ToolCallStatus
                        key={`${message.id}-${i}`}
                        label="Searching Franco knowledge"
                        state={part.state}
                        detail={getToolInputString(part, "query")}
                        resultCount={getToolOutputCount(part)}
                      />
                    );
                  }
                  if (part.type === "tool-renderCanvasDocument") {
                    return (
                      <ToolCallStatus
                        key={`${message.id}-${i}`}
                        label="Composing canvas"
                        doneLabel="Canvas ready"
                        state={part.state}
                        detail={getToolInputString(part, "title")}
                        canvasDocument={getCanvasDocumentFromToolPart(part)}
                        onShowCanvas={handleShowCanvas}
                      />
                    );
                  }
                  if (part.type === "tool-generateFollowUps") {
                    return null;
                  }
                  if (part.type === "tool-showKnownCanvas") {
                    return (
                      <ToolCallStatus
                        key={`${message.id}-${i}`}
                        label="Loading canvas"
                        doneLabel="Canvas ready"
                        state={part.state}
                        detail={getToolInputString(part, "view")}
                        canvasDocument={getCanvasDocumentFromToolPart(part)}
                        onShowCanvas={handleShowCanvas}
                      />
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {showThinking && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-4 py-2.5 text-xs">
              Something went wrong. {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton className="text-foreground!" />
      </Conversation>

      {(!hasConversation || followUpPrompts.length > 0) && (
        <div className="border-border border-t py-3">
          <Suggestions>
            {followUpPrompts.length > 0
              ? followUpPrompts.map((p) => (
                  <Suggestion
                    key={p.prompt}
                    suggestion={p.label}
                    onClick={() => ask(p.prompt)}
                  />
                ))
              : SUGGESTED_PROMPTS.map((p) => (
                  <Suggestion
                    key={p.text}
                    suggestion={p.text}
                    onClick={(s) => ask(s)}
                  />
                ))}
          </Suggestions>
        </div>
      )}

      <div className="px-3 pb-3">
        <PromptInput onSubmit={handleSubmit} className="">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask anything…"
              maxLength={1500}
              className="text-foreground!"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() || busy}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
