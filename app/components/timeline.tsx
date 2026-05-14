import type { CanvasTimelineBlock } from "~/lib/canvas-document";

export function Timeline({ block }: { block: CanvasTimelineBlock }) {
  return (
    <div className="flex flex-col gap-3">
      {block.items.map((item) => (
        <div
          key={`${item.period}-${item.title}`}
          className="border-border border-t pt-3"
        >
          <p className="text-primary font-mono text-xs tracking-[0.22em] uppercase">
            {item.period}
          </p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em]">
            {item.title}
          </p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
