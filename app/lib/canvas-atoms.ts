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
  set(followUpPromptsAtom, RESET);
});

/**
 * Imperative handles registered by the mobile bottom sheet when it mounts.
 * Stored in an atom so any component (e.g. the tool-call "view" button) can
 * trigger sheet snaps without prop drilling. Read via `useSheetControl()` —
 * NOT via `useAtomValue` directly, since this is only used in event handlers
 * (no need to subscribe / re-render).
 *
 * `null` when no sheet is mounted (desktop layout). The hook turns calls into
 * safe no-ops in that case.
 */
export type SheetActions = {
  revealCanvas: () => void;
  focusChat: () => void;
  minimize: () => void;
};

export const sheetActionsAtom = atom<SheetActions | null>(null);
