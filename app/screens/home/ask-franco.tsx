import { useAtomValue } from "jotai";
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
import { followUpPromptsAtom } from "~/lib/canvas-atoms";
import { SUGGESTED_PROMPTS } from "~/lib/franco-knowledge";
import { cn } from "~/lib/utils";
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

function ToolCallStatus({
  label,
  state,
  detail,
  resultCount,
}: {
  label: string;
  state: string;
  detail?: string;
  resultCount?: number;
}) {
  const isDone = state === "output-available";
  const isError = state === "output-error";

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
        <span className="text-foreground font-medium">{label}</span>
        <span className="font-mono uppercase">{isDone ? "done" : state}</span>
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

export function AskFranco() {
  const { messages, ask, busy, status, error } = useFrancoChat();
  const followUpPrompts = useAtomValue(followUpPromptsAtom);
  const [input, setInput] = useState("");

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
    <div className="dark bg-background text-foreground border-border flex h-full flex-col overflow-hidden rounded-3xl border shadow-2xl">
      <div className="border-border flex items-center justify-between gap-4 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary relative inline-block size-2 rounded-full">
            <span
              aria-hidden
              className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60"
            />
          </span>
          <p className="text-foreground text-sm font-semibold">
            Ask Me Anything
          </p>
        </div>
        <p className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.25em] uppercase">
          live · trained by me
        </p>
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
                        state={part.state}
                        detail={getToolInputString(part, "title")}
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
                        state={part.state}
                        detail={getToolInputString(part, "view")}
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
        <ConversationScrollButton />
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
