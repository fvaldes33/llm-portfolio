import { ArrowUp } from "lucide-react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { sheetActionsAtom } from "~/lib/canvas-atoms";
import { AskFranco } from "./ask-franco";

const SNAP_PEEK = 0.2;
const SNAP_FULL = 1;
const SNAP_POINTS: (string | number)[] = [SNAP_PEEK, SNAP_FULL];

export function MobileChatSheet() {
  const [snap, setSnap] = useState<number | string | null>(SNAP_PEEK);

  return (
    <Drawer.Root
      modal={false}
      defaultOpen={true}
      dismissible={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      repositionInputs={false}
      handleOnly={true}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-describedby={undefined}
          className="dark bg-background text-foreground fixed inset-x-0 bottom-0 z-50 flex h-full max-h-[94dvh] flex-col rounded-t-3xl outline-none"
        >
          <Drawer.Handle className="bg-muted-foreground/40 mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full" />
          <Drawer.Title className="sr-only">Ask Franco</Drawer.Title>
          <SheetBody snap={snap} setSnap={setSnap} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetBody({
  snap,
  setSnap,
}: {
  snap: number | string | null;
  setSnap: (snap: number | string | null) => void;
}) {
  const setSheetActions = useSetAtom(sheetActionsAtom);
  const isPeek = snap === SNAP_PEEK;

  useEffect(() => {
    setSheetActions({
      revealCanvas: () => setSnap(SNAP_PEEK),
      focusChat: () => setSnap(SNAP_FULL),
      minimize: () => setSnap(SNAP_PEEK),
    });
    return () => setSheetActions(null);
  }, [setSnap, setSheetActions]);

  function expand() {
    setSnap(SNAP_FULL);
  }

  function ensureExpanded() {
    if (snap !== SNAP_FULL) setSnap(SNAP_FULL);
  }

  if (isPeek) return <PeekComposer onActivate={expand} />;
  return <AskFranco variant="embedded" onBeforeAsk={ensureExpanded} />;
}

function PeekComposer({ onActivate }: { onActivate: () => void }) {
  return (
    <div className="dark px-4 pb-4">
      <button
        type="button"
        onClick={onActivate}
        className="border-border bg-muted/40 hover:bg-muted/60 group flex w-full items-center gap-3 rounded-full border px-4 py-3 text-left transition-colors"
      >
        <span className="text-primary font-mono text-sm">›</span>
        <span className="text-muted-foreground flex-1 text-sm">
          Ask Franco anything…
        </span>
        <span className="bg-primary text-primary-foreground inline-flex size-7 items-center justify-center rounded-full">
          <ArrowUp className="size-4" />
        </span>
      </button>
    </div>
  );
}
