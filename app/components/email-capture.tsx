import { ArrowUpIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { analytics } from "~/lib/analytics";
import { cn } from "~/lib/utils";

export type EmailCaptureSource = "soft_prompt" | "hard_cap";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCapture({
  source,
  className,
  onSubmitted,
}: {
  source: EmailCaptureSource;
  className?: string;
  onSubmitted?: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = EMAIL_RE.test(email.trim());

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed) || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: trimmed, source }),
      });
      if (!res.ok) {
        const message =
          res.status === 429
            ? "Too many tries — give it a sec."
            : "Couldn't save that — try again?";
        setStatus("error");
        setErrorMessage(message);
        return;
      }
      setStatus("success");
      analytics.emailCaptureSubmitted(source);
      onSubmitted?.(trimmed);
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't save that — try again?");
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "border-primary/30 bg-primary/10 text-foreground flex items-center gap-2 rounded-full border px-4 py-3 text-sm",
          className,
        )}
        role="status"
      >
        <span className="bg-primary text-primary-foreground inline-flex size-6 items-center justify-center rounded-full">
          <CheckIcon className="size-3.5" />
        </span>
        Got it — I&apos;ll be in touch.
      </div>
    );
  }

  return (
    <form
      className={cn("space-y-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="border-border bg-muted/40 focus-within:border-primary/60 flex items-center gap-2 rounded-full border px-4 py-2 transition-colors">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@domain.com"
          disabled={status === "submitting"}
          className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={!isValid || status === "submitting"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted-foreground/40 inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed"
          aria-label="Submit email"
        >
          <ArrowUpIcon className="size-4" />
        </button>
      </div>
      {errorMessage && (
        <p className="text-destructive px-2 text-xs">{errorMessage}</p>
      )}
    </form>
  );
}
