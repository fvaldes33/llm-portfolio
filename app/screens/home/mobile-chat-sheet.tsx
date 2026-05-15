import { useAtom } from "jotai";
import { Drawer } from "vaul";
import { mobileChatExpandedAtom } from "~/lib/canvas-atoms";
import { AskFranco } from "./ask-franco";

const SNAP_PEEK = 0.2;
const SNAP_FULL = 1;
const SNAP_POINTS: (string | number)[] = [SNAP_PEEK, SNAP_FULL];

export function MobileChatSheet() {
  const [expanded, setExpanded] = useAtom(mobileChatExpandedAtom);
  const snap = expanded ? SNAP_FULL : SNAP_PEEK;

  return (
    <Drawer.Root
      modal={false}
      defaultOpen={true}
      dismissible={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={(nextSnap) => setExpanded(nextSnap === SNAP_FULL)}
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
          <AskFranco variant="embedded" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
