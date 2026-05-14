import { useAtomValue } from "jotai";
import { canvasDocumentAtom } from "~/lib/canvas-atoms";
import type { CanvasBlock } from "~/lib/canvas-document";
import { Hero } from "./hero";
import { Paragraph } from "./paragraph";
import { Callout } from "./callout";
import { StatGrid } from "./stat-grid";
import { TagList } from "./tag-list";
import { Map } from "./map";
import { Timeline } from "./timeline";
import { MomentGrid } from "./moment-grid";
import { ProjectList } from "./project-list";

export function CanvasBlockRenderer({ block }: { block: CanvasBlock }) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />;
    case "paragraph":
      return <Paragraph block={block} />;
    case "callout":
      return <Callout block={block} />;
    case "statGrid":
      return <StatGrid block={block} />;
    case "tagList":
      return <TagList block={block} />;
    case "map":
      return <Map block={block} />;
    case "timeline":
      return <Timeline block={block} />;
    case "momentGrid":
      return <MomentGrid block={block} />;
    case "projectList":
      return <ProjectList block={block} />;
    default:
      return null;
  }
}

export function Canvas() {
  const canvasDocument = useAtomValue(canvasDocumentAtom);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 fill-mode-[both] flex h-full flex-col gap-7 duration-500">
      {canvasDocument.blocks.map((block, index) => (
        <CanvasBlockRenderer key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  );
}
