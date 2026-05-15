import { ArrowUpIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
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
import {
  followUpPromptsAtom,
  mobileChatExpandedAtom,
} from "~/lib/canvas-atoms";
import { analytics } from "~/lib/analytics";
import { SUGGESTED_PROMPTS } from "~/lib/franco-knowledge";
import { cn } from "~/lib/utils";
import { useFrancoChat } from "./use-franco-chat";
import { isRenderableToolPart, ToolPart } from "~/components/tools";

const seedText =
  "I'm Franco — Director of Engineering at Safety Radar. Ask anything, or pick a question.";

function PeekComposer({ onActivate }: { onActivate: () => void }) {
  function handleActivate() {
    analytics.chatOpened("peek_composer");
    onActivate();
  }

  return (
    <div className="dark px-4 pb-4">
      <button
        type="button"
        onClick={handleActivate}
        className="border-border bg-muted/40 hover:bg-muted/60 group flex w-full items-center gap-3 rounded-full border px-4 py-3 text-left transition-colors"
      >
        <span className="text-primary font-mono text-sm">›</span>
        <span className="text-muted-foreground flex-1 text-sm">
          Ask Franco anything…
        </span>
        <span className="bg-primary text-primary-foreground inline-flex size-7 items-center justify-center rounded-full">
          <ArrowUpIcon className="size-4" />
        </span>
      </button>
    </div>
  );
}

export type AskFrancoVariant = "card" | "embedded";

export function AskFranco({
  variant = "card",
}: {
  /**
   * "card" — standalone panel with rounded border + shadow (desktop right pane).
   * "embedded" — mobile sheet mode. It renders its own peek composer when the
   * sheet is collapsed, without unmounting the chat hook.
   */
  variant?: AskFrancoVariant;
} = {}) {
  const {
    messages,
    ask: askChat,
    busy,
    status,
    error,
    retryLastResponse,
    resetChat,
  } = useFrancoChat();
  const followUpPrompts = useAtomValue(followUpPromptsAtom);
  const mobileChatExpanded = useAtomValue(mobileChatExpandedAtom);
  const setMobileChatExpanded = useSetAtom(mobileChatExpandedAtom);
  const [input, setInput] = useState("");

  function ask(
    text: string,
    source: "composer" | "follow_up" | "suggested_prompt" = "composer",
    promptLabel?: string,
  ) {
    analytics.chatMessageSent({
      source,
      promptLabel,
      characterCount: text.trim().length,
      hasConversation,
    });
    askChat(text);
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

  useEffect(() => {
    if (error) analytics.chatErrorShown(error.message);
  }, [error]);

  function handleSubmit(message: PromptInputMessage) {
    if (!message.text.trim()) return;
    ask(message.text);
    setInput("");
  }

  if (variant === "embedded" && !mobileChatExpanded) {
    return <PeekComposer onActivate={() => setMobileChatExpanded(true)} />;
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
              onClick={() => {
                analytics.chatResetClicked(messages.length);
                void resetChat();
              }}
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

                  if (isRenderableToolPart(part)) {
                    return <ToolPart key={`${message.id}-${i}`} part={part} />;
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
              <div className="flex items-center justify-between gap-3">
                <p>Something went wrong. {error.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    analytics.chatRetryClicked(messages.length);
                    void retryLastResponse();
                  }}
                  disabled={busy || messages.length === 0}
                  className="hover:bg-destructive/10 focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current/25 px-2.5 py-1 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  <RefreshCwIcon className="size-3" />
                  Retry
                </button>
              </div>
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
                    onClick={() => ask(p.prompt, "follow_up", p.label)}
                  />
                ))
              : SUGGESTED_PROMPTS.map((p) => (
                  <Suggestion
                    key={p.text}
                    suggestion={p.text}
                    onClick={(s) => ask(s, "suggested_prompt", s)}
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
