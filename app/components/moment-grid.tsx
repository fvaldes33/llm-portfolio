import type { CanvasMomentGridBlock } from "~/lib/canvas-document";

export function MomentGrid({ block }: { block: CanvasMomentGridBlock }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {block.items.map((item) => (
        <div
          key={`${item.eyebrow}-${item.title}`}
          className="border-border bg-card relative overflow-hidden rounded-3xl border p-5 shadow-sm"
        >
          <div className="bg-primary/10 absolute -top-10 -right-10 size-28 rounded-full blur-2xl" />
          {item.eyebrow && (
            <p className="text-primary font-mono text-[0.68rem] tracking-[0.22em] uppercase">
              {item.eyebrow}
            </p>
          )}
          <p className="relative mt-2 text-xl leading-tight font-black tracking-[-0.04em]">
            {item.title}
          </p>
          <p className="text-muted-foreground relative mt-3 text-sm leading-6">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  );
}
