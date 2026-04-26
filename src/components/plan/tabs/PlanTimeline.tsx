import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, MetricTile, BulletList } from "../PlanSection";
import { CalendarRange, GitBranch, Flag } from "lucide-react";

export function PlanTimeline({ plan }: { plan: ExperimentPlan }) {
  const t = plan.timeline;
  const totalDays = (t?.phases ?? []).reduce((s, p) => s + (p.duration_days ?? 0), 0);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricTile label="Total weeks" value={t?.total_weeks ?? "—"} />
        <MetricTile label="Total days" value={totalDays || "—"} />
        <MetricTile label="Phases" value={t?.phases?.length ?? 0} />
      </div>

      <PlanSection
        title="Critical path"
        subtitle={t?.earliest_start_date_note}
        icon={<GitBranch className="h-4.5 w-4.5" />}
      >
        <p className="rounded-md border border-primary/25 bg-primary/5 p-3 font-mono text-sm text-foreground">
          {t?.critical_path}
        </p>
      </PlanSection>

      <PlanSection title="Phases" icon={<CalendarRange className="h-4.5 w-4.5" />}>
        <ol className="relative space-y-4 border-l-2 border-border pl-6">
          {t?.phases?.map((p) => (
            <li key={p.phase_number} className="relative">
              <span className="absolute -left-[31px] top-1 grid h-6 w-6 place-items-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground ring-4 ring-background">
                {p.phase_number}
              </span>
              <div className="rounded-lg border border-border bg-surface-1 p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="chip">
                      {p.duration_days} {p.duration_days === 1 ? "day" : "days"}
                    </span>
                    {p.depends_on_phase != null && (
                      <span className="chip">depends on phase {p.depends_on_phase}</span>
                    )}
                  </div>
                </div>

                {p.tasks?.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Tasks
                    </div>
                    <BulletList items={p.tasks} />
                  </div>
                )}

                <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Flag className="h-3 w-3" /> Milestone
                    </div>
                    <p className="text-sm">{p.milestone}</p>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Go / no-go
                    </div>
                    <p className="text-sm">{p.go_no_go_criteria}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </PlanSection>
    </div>
  );
}
