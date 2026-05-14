import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, RESET } from "jotai/utils";
import {
  canvasDocumentSchema,
  type CanvasDocument,
} from "~/lib/canvas-document";
import { welcomeCanvasDocument } from "~/lib/canvas-documents";

export type FollowUpPrompt = {
  label: string;
  prompt: string;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const jsonCanvasDocumentStorage = createJSONStorage<unknown>(() =>
  typeof window === "undefined" ? noopStorage : window.localStorage,
);

const canvasDocumentStorage = {
  getItem: (key: string, initialValue: CanvasDocument) => {
    const value = jsonCanvasDocumentStorage.getItem(key, initialValue);
    const parsed = canvasDocumentSchema.safeParse(value);
    return parsed.success ? parsed.data : initialValue;
  },
  setItem: (key: string, value: CanvasDocument) => {
    jsonCanvasDocumentStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    jsonCanvasDocumentStorage.removeItem(key);
  },
};

export const canvasDocumentAtom = atomWithStorage<CanvasDocument>(
  "franco.canvasDocument",
  welcomeCanvasDocument,
  canvasDocumentStorage,
);
export const followUpPromptsAtom = atom<FollowUpPrompt[]>([]);

export const setCanvasDocumentAtom = atom(
  null,
  (_get, set, canvasDocument: CanvasDocument) => {
    set(canvasDocumentAtom, canvasDocument);
  },
);

export const resetCanvasDocumentAtom = atom(null, (_get, set) => {
  set(canvasDocumentAtom, RESET);
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
