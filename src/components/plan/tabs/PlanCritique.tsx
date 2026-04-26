import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, MetricTile, BulletList } from "../PlanSection";
import { GitBranch, AlertOctagon, HelpCircle, Sparkles } from "lucide-react";

const SEV_CLASS: Record<string, string> = {
  major: "border-destructive/40 bg-destructive/10 text-destructive",
  moderate: "border-warning/40 bg-warning/10 text-warning",
  minor: "border-border bg-secondary text-muted-foreground",
};

export function PlanCritique({ plan }: { plan: ExperimentPlan }) {
  const c = plan.self_critique;
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricTile
          label="Plan score"
          value={`${c?.overall_score ?? 0}/10`}
          tone={
            (c?.overall_score ?? 0) >= 8
              ? "success"
              : (c?.overall_score ?? 0) >= 6
              ? "primary"
              : "warning"
          }
        />
        <MetricTile label="Issues found" value={c?.issues_found?.length ?? 0} />
        <MetricTile label="Improvements applied" value={c?.improvements_applied?.length ?? 0} />
      </div>

      <PlanSection
        title="Score rationale"
        subtitle="Why the model scored this plan as it did"
        icon={<GitBranch className="h-4.5 w-4.5" />}
      >
        <p className="text-sm text-foreground/90">{c?.score_rationale}</p>

        {c?.weakest_sections?.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Weakest sections
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.weakest_sections.map((s, i) => (
                <span key={i} className="chip">{s}</span>
              ))}
            </div>
          </div>
        )}
      </PlanSection>

      {c?.issues_found?.length > 0 && (
        <PlanSection title="Issues found & fixes applied" icon={<AlertOctagon className="h-4.5 w-4.5" />}>
          <div className="grid gap-3">
            {c.issues_found.map((it, i) => {
              const sev = it.severity?.toLowerCase();
              const cls = SEV_CLASS[sev] ?? SEV_CLASS.minor;
              return (
                <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="chip">{it.section}</span>
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
                      {it.severity}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{it.issue}</p>
                  <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-success">Fix:</span>{" "}
                    {it.fix_applied}
                  </p>
                </div>
              );
            })}
          </div>
        </PlanSection>
      )}

      {c?.uncertainty_areas?.length > 0 && (
        <PlanSection title="Uncertainty areas" icon={<HelpCircle className="h-4.5 w-4.5" />}>
          <div className="grid gap-3">
            {c.uncertainty_areas.map((u, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
                <h4 className="font-display text-sm font-semibold">{u.area}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">Reason:</span>{" "}
                  {u.reason}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">Impact:</span>{" "}
                  {u.impact}
                </p>
              </div>
            ))}
          </div>
        </PlanSection>
      )}

      {c?.peer_review_risks?.length > 0 && (
        <PlanSection title="Peer review risks">
          <BulletList items={c.peer_review_risks} />
        </PlanSection>
      )}

      {c?.improvements_applied?.length > 0 && (
        <PlanSection title="Improvements applied" icon={<Sparkles className="h-4.5 w-4.5" />}>
          <BulletList items={c.improvements_applied} />
        </PlanSection>
      )}
    </div>
  );
}
