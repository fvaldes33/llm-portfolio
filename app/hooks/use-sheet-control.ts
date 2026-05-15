import { useStore } from "jotai";
import { useMemo } from "react";
import { sheetActionsAtom, type SheetActions } from "~/lib/canvas-atoms";

const NOOP: SheetActions = {
  revealCanvas: () => {},
  focusChat: () => {},
  minimize: () => {},
};

/**
 * Imperative handle on the mobile bottom sheet without prop drilling.
 *
 * Reads the sheet's actions through the jotai store rather than subscribing —
 * so consumers do NOT re-render when the sheet registers or snaps. Intended for
 * use inside event handlers, not for rendering decisions.
 *
 * On desktop (no sheet mounted) every action is a no-op, so calls are safe
 * everywhere.
 */
export function useSheetControl(): SheetActions {
  const store = useStore();
  return useMemo(
    () => ({
      revealCanvas: () => (store.get(sheetActionsAtom) ?? NOOP).revealCanvas(),
      focusChat: () => (store.get(sheetActionsAtom) ?? NOOP).focusChat(),
      minimize: () => (store.get(sheetActionsAtom) ?? NOOP).minimize(),
    }),
    [store],
  );
}
