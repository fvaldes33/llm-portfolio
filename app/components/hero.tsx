import type { CanvasHeroBlock } from "~/lib/canvas-document";

export function Hero({ block }: { block: CanvasHeroBlock }) {
  return (
    <div>
      {block.eyebrow && (
        <p className="text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase">
          {block.eyebrow}
        </p>
      )}
      <h1 className="mt-5 max-w-4xl text-[clamp(3rem,6.8vw,6.75rem)] leading-[0.86] font-black tracking-[-0.08em] text-balance">
        {block.title}
      </h1>
      {block.body && (
        <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 sm:text-xl">
          {block.body}
        </p>
      )}
    </div>
  );
}
