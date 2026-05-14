import type { CanvasCalloutBlock } from "~/lib/canvas-document";
import { cn } from "~/lib/utils";

export function Callout({ block }: { block: CanvasCalloutBlock }) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        block.tone === "primary" &&
          "border-primary bg-primary text-primary-foreground",
        block.tone === "inverse" &&
          "border-border bg-foreground text-background",
        block.tone === "default" && "border-border bg-muted/60",
      )}
    >
      {block.title && <p className="font-semibold">{block.title}</p>}
      <p
        className={cn(
          "text-sm leading-6",
          block.title && "mt-2",
          block.tone === "default" && "text-muted-foreground",
        )}
      >
        {block.text}
      </p>
    </div>
  );
}
