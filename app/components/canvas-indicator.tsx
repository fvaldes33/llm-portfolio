import { canvasActivityAtom } from "~/lib/canvas-atoms";
import { Badge } from "./ui/badge";
import { useAtomValue } from "jotai";
import { cn } from "~/lib/utils";

export function CanvasIndicator() {
  const canvasActivity = useAtomValue(canvasActivityAtom);
  if (canvasActivity.state === "idle") return null;
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex justify-end sm:justify-center">
      <Badge variant="secondary" className="h-8 gap-2 px-3 shadow-md">
        <span
          className={cn(
            "bg-primary size-2 rounded-full",
            canvasActivity.state === "pending" && "animate-ping",
          )}
        />
        <span className="text-xs">
          {canvasActivity.state === "pending"
            ? canvasActivity.intent === "custom"
              ? "Creating Custom Canvas..."
              : "Updating Canvas..."
            : "Canvas Ready"}
        </span>
      </Badge>
    </div>
  );
}
