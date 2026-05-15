import { Canvas } from "~/components/canvas";
import { Header } from "~/components/header";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useIsMobile } from "~/hooks/use-mobile";
import { AskFranco } from "./ask-franco";
import { MobileChatSheet } from "./mobile-chat-sheet";
import { ClientOnly } from "~/components/client-only";
import { Loader } from "~/components/loader";

export function HomeScreen() {
  const isMobile = useIsMobile();

  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col lg:h-screen lg:overflow-hidden">
      <Header />
      <ClientOnly fallback={<Loader />}>
        {() => (isMobile ? <MobileLayout /> : <DesktopLayout />)}
      </ClientOnly>
    </main>
  );
}

function DesktopLayout() {
  return (
    <div className="flex-1 lg:min-h-0">
      <div className="mx-auto grid h-full w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[1fr_minmax(380px,460px)] lg:px-6">
        <div className="border-border bg-card relative overflow-hidden rounded-3xl border lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_85%_10%,oklch(0.527_0.154_150.069/.12),transparent_50%)]" />
          <ScrollArea className="relative z-10 h-full lg:mask-[linear-gradient(to_bottom,transparent_0,black_2.5rem,black_calc(100%-2.5rem),transparent_100%)]">
            <div className="min-h-full p-6 sm:p-8 lg:p-10">
              <Canvas />
            </div>
          </ScrollArea>
        </div>
        <div className="lg:h-auto lg:min-h-0">
          <AskFranco />
        </div>
      </div>
    </div>
  );
}

function MobileLayout() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Canvas gets bottom padding equal to the sheet's peek snap (20dvh)
          plus a buffer so the last content clears the composer. */}
      <div className="flex-1 px-4 pt-2 pb-[calc(20dvh+1.5rem)]">
        <Canvas />
      </div>
      <MobileChatSheet />
    </div>
  );
}
