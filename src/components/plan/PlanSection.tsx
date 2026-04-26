import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PlanSection({
  title,
  subtitle,
  children,
  icon,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-6", className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "destructive" | "success";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    destructive: "text-destructive",
    success: "text-success",
  };
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1.5 font-display text-2xl font-semibold tabular-nums", toneClasses[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 border-b border-border/60 py-2.5 last:border-0">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm text-foreground">{v}</dd>
    </div>
  );
}

export function BulletList({ items, mono = false }: { items: string[]; mono?: boolean }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
          <span className={mono ? "font-mono text-[13px]" : ""}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const tone =
    value >= 0.8 ? "bg-success" : value >= 0.6 ? "bg-primary" : value >= 0.4 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono tabular-nums text-foreground">{(value * 100).toFixed(0)}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className={cn("h-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
