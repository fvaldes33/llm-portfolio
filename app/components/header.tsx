import { Button } from "~/components/ui/button";
import { FrancoLogo } from "~/components/franco-logo";

export function Header() {
  return (
    <header className="border-border shrink-0 border-b px-4 py-4 lg:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-3" aria-label="Home">
          <FrancoLogo className="h-7 w-[42px]" />
          <span className="text-muted-foreground hidden font-mono text-xs tracking-[0.22em] uppercase sm:inline">
            fvaldes33
          </span>
        </a>
        <Button asChild size="sm" className="rounded-full px-4">
          <a href="mailto:franco@appvents.com">Contact</a>
        </Button>
      </nav>
    </header>
  );
}
