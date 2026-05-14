import type { CanvasStatGridBlock } from "~/lib/canvas-document";

export function StatGrid({ block }: { block: CanvasStatGridBlock }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {block.items.map((item) => (
        <div
          key={item.label}
          className="border-border bg-muted/55 rounded-3xl border p-4"
        >
          <p className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.22em] uppercase">
            {item.label}
          </p>
          <p className="mt-2 text-2xl leading-tight font-black tracking-[-0.04em]">
            {item.value}
          </p>
          {item.detail && (
            <p className="text-muted-foreground mt-1 text-sm">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}
