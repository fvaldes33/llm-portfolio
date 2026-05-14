import type { CanvasParagraphBlock } from "~/lib/canvas-document";

export function Paragraph({ block }: { block: CanvasParagraphBlock }) {
  return (
    <p className="text-muted-foreground max-w-2xl text-lg leading-8">
      {block.text}
    </p>
  );
}
