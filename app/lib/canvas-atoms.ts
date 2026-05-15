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

const jsonStorage = createJSONStorage<unknown>(() =>
  typeof window === "undefined" ? noopStorage : window.localStorage,
);

const canvasDocumentStorage = {
  getItem: (key: string, initialValue: CanvasDocument) => {
    const value = jsonStorage.getItem(key, initialValue);
    const parsed = canvasDocumentSchema.safeParse(value);
    return parsed.success ? parsed.data : initialValue;
  },
  setItem: (key: string, value: CanvasDocument) => {
    jsonStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    jsonStorage.removeItem(key);
  },
};

function isFollowUpPrompt(value: unknown): value is FollowUpPrompt {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "prompt" in value &&
    typeof value.label === "string" &&
    typeof value.prompt === "string"
  );
}

const followUpPromptsStorage = {
  getItem: (key: string, initialValue: FollowUpPrompt[]) => {
    const value = jsonStorage.getItem(key, initialValue);
    return Array.isArray(value) && value.every(isFollowUpPrompt)
      ? value
      : initialValue;
  },
  setItem: (key: string, value: FollowUpPrompt[]) => {
    jsonStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    jsonStorage.removeItem(key);
  },
};

export const canvasDocumentAtom = atomWithStorage<CanvasDocument>(
  "franco.canvasDocument",
  welcomeCanvasDocument,
  canvasDocumentStorage,
);
export const followUpPromptsAtom = atomWithStorage<FollowUpPrompt[]>(
  "franco.followUpPrompts",
  [],
  followUpPromptsStorage,
);

export const setCanvasDocumentAtom = atom(
  null,
  async (_get, set, canvasDocument: CanvasDocument) => {
    set(canvasDocumentAtom, canvasDocument);
  },
);

export const resetCanvasDocumentAtom = atom(null, (_get, set) => {
  set(canvasDocumentAtom, RESET);
  set(canvasActivityAtom, { state: "idle" });
});

export type CanvasActivity =
  | { state: "idle" }
  | { state: "pending"; intent: CanvasDocument["intent"] }
  | { state: "generated" };

export const canvasActivityAtom = atom<CanvasActivity>({ state: "idle" });
export const setCanvasActivityAtom = atom(
  null,
  (_get, set, activity: CanvasActivity) => {
    set(canvasActivityAtom, activity);
  },
);
export const resetCanvasActivityAtom = atom(null, (_get, set) => {
  set(canvasActivityAtom, { state: "idle" });
});

export const setFollowUpPromptsAtom = atom(
  null,
  (_get, set, prompts: FollowUpPrompt[]) => {
    set(followUpPromptsAtom, prompts);
  },
);

export const resetFollowUpPromptsAtom = atom(null, (_get, set) => {
  set(followUpPromptsAtom, RESET);
});

export const mobileChatExpandedAtom = atom(false);
