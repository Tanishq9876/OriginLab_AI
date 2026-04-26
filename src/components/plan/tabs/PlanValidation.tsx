import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, KeyValue, BulletList } from "../PlanSection";
import { Target, Wrench, Plus, AlertTriangle } from "lucide-react";

export function PlanValidation({ plan }: { plan: ExperimentPlan }) {
  const v = plan.validation;
  return (
    <div className="grid gap-5">
      <PlanSection
        title="Primary outcome & thresholds"
        icon={<Target className="h-4.5 w-4.5" />}
      >
        <dl>
          <KeyValue k="Primary outcome" v={v?.primary_outcome} />
          <KeyValue
            k="Success"
            v={
              <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-success">
                {v?.success_threshold}
              </span>
            }
          />
          <KeyValue
            k="Failure"
            v={
              <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-destructive">
                {v?.failure_threshold}
              </span>
            }
          />
          <KeyValue k="Method" v={v?.measurement_method} />
        </dl>
      </PlanSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlanSection title="Controls">
          <dl>
            <KeyValue k="Positive" v={v?.controls?.positive} />
            <KeyValue k="Negative" v={v?.controls?.negative} />
            <KeyValue k="Vehicle"  v={v?.controls?.vehicle} />
          </dl>
        </PlanSection>

        <PlanSection title="Statistics & power">
          <dl>
            <KeyValue k="Method" v={v?.statistical_method} />
            <KeyValue k="Replicates" v={<span className="font-mono">{v?.replicates}</span>} />
            <KeyValue k="Power calc" v={v?.power_calculation} />
          </dl>
        </PlanSection>
      </div>

      {v?.secondary_outcomes?.length > 0 && (
        <PlanSection title="Secondary outcomes" icon={<Plus className="h-4.5 w-4.5" />}>
          <BulletList items={v.secondary_outcomes} />
        </PlanSection>
      )}

      {v?.troubleshooting?.length > 0 && (
        <PlanSection
          title="Troubleshooting"
          icon={<Wrench className="h-4.5 w-4.5" />}
        >
          <div className="grid gap-3">
            {v.troubleshooting.map((t, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span className="font-medium text-foreground">{t.symptom}</span>
                </div>
                <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Likely cause</span>
                    <p className="text-foreground/90">{t.likely_cause}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Fix</span>
                    <p className="text-foreground/90">{t.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PlanSection>
      )}
    </div>
  );
}
