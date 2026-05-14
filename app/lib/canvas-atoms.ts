import { atom } from "jotai";
import type { CanvasDocument } from "~/lib/canvas-document";
import { welcomeCanvasDocument } from "~/lib/canvas-documents";

export type FollowUpPrompt = {
  label: string;
  prompt: string;
};

export const canvasDocumentAtom = atom<CanvasDocument>(welcomeCanvasDocument);
export const followUpPromptsAtom = atom<FollowUpPrompt[]>([]);

export const setCanvasDocumentAtom = atom(
  null,
  (_get, set, canvasDocument: CanvasDocument) => {
    set(canvasDocumentAtom, canvasDocument);
  },
);

export const resetCanvasDocumentAtom = atom(null, (_get, set) => {
  set(canvasDocumentAtom, welcomeCanvasDocument);
});

export const setFollowUpPromptsAtom = atom(
  null,
  (_get, set, prompts: FollowUpPrompt[]) => {
    set(followUpPromptsAtom, prompts);
  },
);

export const resetFollowUpPromptsAtom = atom(null, (_get, set) => {
  set(followUpPromptsAtom, []);
});
