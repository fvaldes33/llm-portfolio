import type { CanvasProjectListBlock } from "~/lib/canvas-document";

export function ProjectList({ block }: { block: CanvasProjectListBlock }) {
  return (
    <div className="grid gap-3">
      {block.items.map((item) => {
        const content = (
          <>
            <div className="flex items-start justify-between gap-4">
              <p className="text-2xl font-black tracking-[-0.04em]">
                {item.name}
              </p>
              {item.href && (
                <span className="text-primary text-sm font-semibold">
                  Visit
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {item.description}
            </p>
            {item.meta && (
              <p className="text-primary mt-3 font-mono text-[0.68rem] tracking-[0.18em] uppercase">
                {item.meta}
              </p>
            )}
          </>
        );

        if (item.href) {
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="border-border hover:border-primary/50 hover:bg-muted/50 rounded-3xl border p-4 transition-colors"
            >
              {content}
            </a>
          );
        }

        return (
          <div key={item.name} className="border-border rounded-3xl border p-4">
            {content}
          </div>
        );
      })}
    </div>
  );
}
