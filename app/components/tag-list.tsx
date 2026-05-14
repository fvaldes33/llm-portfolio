import type { CanvasTagListBlock } from "~/lib/canvas-document";

export function TagList({ block }: { block: CanvasTagListBlock }) {
  return (
    <div>
      {block.label && (
        <p className="text-muted-foreground mb-3 font-mono text-xs tracking-[0.22em] uppercase">
          {block.label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {block.items.map((item) => (
          <span
            key={item}
            className="border-border bg-muted/40 rounded-full border px-3 py-1.5 text-sm font-medium"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
