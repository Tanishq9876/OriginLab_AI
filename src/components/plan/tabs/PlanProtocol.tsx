import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, MetricTile, BulletList } from "../PlanSection";
import { Beaker, AlertTriangle, Wrench } from "lucide-react";

export function PlanProtocol({ plan }: { plan: ExperimentPlan }) {
  const p = plan.protocol;
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Steps" value={p?.steps?.length ?? 0} />
        <MetricTile label="Duration" value={p?.total_duration ?? "—"} />
        <MetricTile label="Difficulty" value={p?.difficulty ?? "—"} />
        <MetricTile
          label="Failure modes"
          value={p?.failure_modes?.length ?? 0}
          tone={(p?.failure_modes?.length ?? 0) > 2 ? "warning" : "default"}
        />
      </div>

      <PlanSection
        title="Critical step"
        subtitle="The single most likely point of failure — focus extra attention here"
        icon={<AlertTriangle className="h-4.5 w-4.5" />}
      >
        <p className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
          {p?.critical_step}
        </p>
      </PlanSection>

      <PlanSection
        title="Required equipment"
        icon={<Wrench className="h-4.5 w-4.5" />}
      >
        <div className="flex flex-wrap gap-1.5">
          {p?.required_equipment?.map((e, i) => (
            <span key={i} className="chip">{e}</span>
          ))}
        </div>
      </PlanSection>

      <PlanSection title="Step-by-step protocol" icon={<Beaker className="h-4.5 w-4.5" />}>
        <ol className="space-y-3">
          {p?.steps?.map((s) => (
            <li key={s.step} className="rounded-lg border border-border bg-surface-1 p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-foreground/90">{s.action}</p>
                  </div>
                </div>
                <span className="chip whitespace-nowrap">{s.duration}</span>
              </div>

              {s.details && (
                <p className="mt-3 whitespace-pre-line rounded-md border border-border bg-surface-0 p-3 font-mono text-[12.5px] leading-relaxed text-foreground/90">
                  {s.details}
                </p>
              )}

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {s.reagents?.length > 0 && (
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Reagents
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.reagents.map((r, i) => (
                        <span key={i} className="chip">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {s.checkpoint && (
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Checkpoint
                    </div>
                    <p className="text-sm text-foreground/90">{s.checkpoint}</p>
                  </div>
                )}
              </div>

              {s.critical_notes && (
                <div className="mt-3 rounded-md border border-warning/25 bg-warning/5 p-3 text-sm text-foreground">
                  <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    Critical notes
                  </div>
                  {s.critical_notes}
                </div>
              )}
            </li>
          ))}
        </ol>
      </PlanSection>

      <PlanSection
        title="Failure modes & mitigations"
        icon={<AlertTriangle className="h-4.5 w-4.5" />}
      >
        <div className="grid gap-2">
          {p?.failure_modes?.map((f, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{f.mode}</span>
                <LikelihoodBadge likelihood={f.likelihood} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">Mitigation:</span>{" "}
                {f.mitigation}
              </p>
            </div>
          ))}
        </div>
      </PlanSection>
    </div>
  );
}

function LikelihoodBadge({ likelihood }: { likelihood: string }) {
  const map: Record<string, string> = {
    high: "border-destructive/40 bg-destructive/10 text-destructive",
    medium: "border-warning/40 bg-warning/10 text-warning",
    low: "border-success/40 bg-success/10 text-success",
  };
  const cls = map[likelihood?.toLowerCase()] ?? "border-border bg-secondary text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {likelihood}
    </span>
  );
}
