import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <Loader2 className="text-primary size-10 animate-spin" />
    </div>
  );
}
