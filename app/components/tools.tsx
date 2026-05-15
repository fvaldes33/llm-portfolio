import { EyeIcon } from "lucide-react";
import { memo } from "react";
import { useSetAtom } from "jotai";
import {
  mobileChatExpandedAtom,
  setCanvasDocumentAtom,
} from "~/lib/canvas-atoms";
import {
  canvasDocumentSchema,
  type CanvasDocument,
} from "~/lib/canvas-document";
import {
  currentCanvasDocument,
  locationsCanvasDocument,
  projectsCanvasDocument,
  welcomeCanvasDocument,
} from "~/lib/canvas-documents";
import { analytics } from "~/lib/analytics";
import { cn } from "~/lib/utils";
import type { FrancoUIMessage } from "~/lib/chat/types";

type FrancoMessagePart = FrancoUIMessage["parts"][number];

type SearchFrancoKnowledgePart = Extract<
  FrancoMessagePart,
  { type: "tool-searchFrancoKnowledge" }
>;
type RenderCanvasDocumentPart = Extract<
  FrancoMessagePart,
  { type: "tool-renderCanvasDocument" }
>;
type ShowKnownCanvasPart = Extract<
  FrancoMessagePart,
  { type: "tool-showKnownCanvas" }
>;

const KNOWN_CANVASES = {
  welcome: welcomeCanvasDocument,
  locations: locationsCanvasDocument,
  current: currentCanvasDocument,
  projects: projectsCanvasDocument,
} as const;

/**
 * The "view" affordance lives here, not in the chat tree, so it reads its
 * targets straight from atoms instead of being prop-drilled. Both are
 * write-only (`useSetAtom`) so this chip never re-renders on canvas/sheet
 * changes — it only fires on click (rerender-defer-reads,
 * rerender-move-effect-to-event).
 */
function useViewCanvas() {
  const setCanvasDocument = useSetAtom(setCanvasDocumentAtom);
  const setMobileChatExpanded = useSetAtom(mobileChatExpandedAtom);
  return (canvasDocument: CanvasDocument, toolType: "custom" | "known") => {
    analytics.canvasViewedFromTool({
      canvasTitle: canvasDocument.title,
      toolType,
    });
    setCanvasDocument(canvasDocument);
    setMobileChatExpanded(false);
  };
}

function ToolChip({
  label,
  state,
  detail,
  meta,
  onView,
  viewLabel,
}: {
  label: string;
  state: string;
  detail?: string;
  meta?: string;
  onView?: () => void;
  viewLabel?: string;
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
        <span className="font-mono uppercase">
          {isError ? "error" : isDone ? "done" : "working"}
        </span>
        {isDone && onView && (
          <button
            type="button"
            onClick={onView}
            className="hover:text-foreground focus-visible:ring-ring ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            title="Show this on the canvas"
          >
            <EyeIcon className="size-3" />
            <span>{viewLabel ?? "view"}</span>
          </button>
        )}
      </div>
      {detail && <p className="mt-1 truncate">{detail}</p>}
      {meta && <p className="mt-1 font-mono uppercase">{meta}</p>}
    </div>
  );
}

function getQueryDetail(part: SearchFrancoKnowledgePart) {
  const queries = part.input?.queries;
  if (!Array.isArray(queries) || queries.length === 0) return undefined;
  if (queries.length === 1) return queries[0];
  return `${queries.length} angles · ${queries.join(" / ")}`;
}

export function SearchFrancoKnowledge({
  part,
}: {
  part: SearchFrancoKnowledgePart;
}) {
  const count = Array.isArray(part.output) ? part.output.length : undefined;
  return (
    <ToolChip
      label={
        part.state === "output-available"
          ? "Searched my memory"
          : "Searching my memory"
      }
      state={part.state}
      detail={getQueryDetail(part)}
      meta={
        typeof count === "number"
          ? `${count} related ${count === 1 ? "chunk" : "chunks"}`
          : undefined
      }
    />
  );
}

export function RenderCanvasDocument({
  part,
}: {
  part: RenderCanvasDocumentPart;
}) {
  const viewCanvas = useViewCanvas();
  const parsed = canvasDocumentSchema.safeParse(part.input);
  const doc = parsed.success ? parsed.data : undefined;
  const title = part.output?.title ?? doc?.title;
  const blockCount = part.output?.blockCount ?? doc?.blocks.length;

  return (
    <ToolChip
      label={
        part.state === "output-available"
          ? "Rendered canvas"
          : "Composing canvas"
      }
      state={part.state}
      detail={
        title && blockCount
          ? `${title} · ${blockCount} ${blockCount === 1 ? "block" : "blocks"}`
          : title
      }
      onView={doc ? () => viewCanvas(doc, "custom") : undefined}
    />
  );
}

export function ShowKnownCanvas({ part }: { part: ShowKnownCanvasPart }) {
  const viewCanvas = useViewCanvas();
  const view = part.input?.view;
  const doc = view ? KNOWN_CANVASES[view] : undefined;
  const title = part.output?.title ?? doc?.title;

  return (
    <ToolChip
      label={
        part.state === "output-available" ? "Showed canvas" : "Opening canvas"
      }
      state={part.state}
      detail={title}
      onView={doc ? () => viewCanvas(doc, "known") : undefined}
    />
  );
}

function ToolPartImpl({ part }: { part: FrancoMessagePart }) {
  switch (part.type) {
    case "tool-searchFrancoKnowledge":
      return <SearchFrancoKnowledge part={part} />;
    case "tool-renderCanvasDocument":
      return <RenderCanvasDocument part={part} />;
    case "tool-showKnownCanvas":
      return <ShowKnownCanvas part={part} />;
  }
  return null;
}

/**
 * Stream-stable signature. The chat `messages` array is rebuilt on every
 * token, so without this every tool chip in the whole transcript re-renders
 * (and renderCanvasDocument re-runs safeParse) on every delta. We deliberately
 * ignore partial streamed `input` — the chip shows nothing from it until the
 * tool settles — so the chip only re-renders on real transitions (state
 * change, final output), not on each partial-JSON keystroke.
 */
function toolPartSignature(part: FrancoMessagePart) {
  switch (part.type) {
    case "tool-searchFrancoKnowledge": {
      const queries = part.input?.queries;
      const count = Array.isArray(part.output) ? part.output.length : "";
      return `s|${part.state}|${Array.isArray(queries) ? queries.join("~") : ""}|${count}`;
    }
    case "tool-renderCanvasDocument":
      return `r|${part.state}|${part.output?.title ?? ""}|${part.output?.blockCount ?? ""}`;
    case "tool-showKnownCanvas":
      return `k|${part.state}|${part.input?.view ?? ""}|${part.output?.title ?? ""}`;
    default:
      return part.type;
  }
}

export const ToolPart = memo(
  ToolPartImpl,
  (prev, next) =>
    prev.part === next.part ||
    toolPartSignature(prev.part) === toolPartSignature(next.part),
);

export function isRenderableToolPart(part: FrancoMessagePart) {
  return (
    part.type === "tool-renderCanvasDocument" ||
    part.type === "tool-showKnownCanvas" ||
    part.type === "tool-searchFrancoKnowledge"
  );
}
