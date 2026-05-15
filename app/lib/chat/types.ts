import type { UIMessage } from "ai";
import type { FrancoUITools } from "~/server/chat/tools";
import type { CanvasDocument } from "~/lib/canvas-document";
import type { CanvasActivity, FollowUpPrompt } from "~/lib/canvas-atoms";

export type FrancoUIMessage = UIMessage<
  unknown,
  {
    canvas: { canvasDocument: CanvasDocument };
    canvasActivity: CanvasActivity;
    followUps: { prompts: FollowUpPrompt[] };
  },
  FrancoUITools
>;
