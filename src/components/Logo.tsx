import { Atom } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-8 w-8 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/40">
        <Atom className="h-4.5 w-4.5 text-primary" strokeWidth={2.25} />
        <div className="pointer-events-none absolute inset-0 rounded-md bg-gradient-glow opacity-60" />
      </div>
      {showWordmark && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
            OriginLab
          </span>
          <span className="chip-primary !px-1.5 !py-0 text-[10px] uppercase">AI</span>
        </div>
      )}
    </div>
  );
}
