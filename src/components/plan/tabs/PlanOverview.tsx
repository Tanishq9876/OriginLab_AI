import type { ExperimentPlan } from "@/types/experiment";
import {
  PlanSection,
  KeyValue,
  BulletList,
  ConfidenceBar,
  MetricTile,
} from "../PlanSection";
import { Compass, Activity, ListTree, BookOpenCheck, Gauge } from "lucide-react";

export function PlanOverview({ plan }: { plan: ExperimentPlan }) {
  const cs = plan.confidence_scores;
  return (
    <div className="grid gap-5">
      {/* Top-level metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Difficulty" value={plan.protocol?.difficulty ?? "—"} />
        <MetricTile label="Duration" value={plan.protocol?.total_duration ?? "—"} />
        <MetricTile
          label="Est. Budget"
          value={`$${(plan.budget?.total_estimated_usd ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricTile
          label="Confidence"
          value={`${Math.round((cs?.overall ?? 0) * 100)}%`}
          tone={cs?.overall >= 0.7 ? "success" : cs?.overall >= 0.5 ? "primary" : "warning"}
        />
      </div>

      <PlanSection title="Overview" icon={<Compass className="h-4.5 w-4.5" />}>
        <p className="text-[15px] leading-relaxed text-foreground">{plan.overview}</p>
      </PlanSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlanSection
          title="Hypothesis breakdown"
          subtitle={`Quality ${plan.hypothesis_breakdown?.hypothesis_quality_score ?? "—"}/10`}
          icon={<ListTree className="h-4.5 w-4.5" />}
        >
          <dl>
            <KeyValue k="Independent" v={plan.hypothesis_breakdown?.independent_variable} />
            <KeyValue k="Dependent" v={plan.hypothesis_breakdown?.dependent_variable} />
            <KeyValue k="System" v={plan.hypothesis_breakdown?.system} />
            <KeyValue k="Mechanism" v={plan.hypothesis_breakdown?.expected_mechanism} />
            <KeyValue
              k="Methods"
              v={
                <div className="flex flex-wrap gap-1.5">
                  {plan.hypothesis_breakdown?.measurement_methods?.map((m, i) => (
                    <span key={i} className="chip">{m}</span>
                  ))}
                </div>
              }
            />
            <KeyValue
              k="Confounders"
              v={<BulletList items={plan.hypothesis_breakdown?.confounding_factors ?? []} />}
            />
            <KeyValue
              k="Notes"
              v={<span className="text-muted-foreground">{plan.hypothesis_breakdown?.hypothesis_quality_notes}</span>}
            />
          </dl>
        </PlanSection>

        <PlanSection
          title="Confidence scores"
          subtitle="Anything below 70% deserves human expert review"
          icon={<Gauge className="h-4.5 w-4.5" />}
        >
          <div className="space-y-4">
            <ConfidenceBar value={cs?.overall ?? 0} label="Overall" />
            <ConfidenceBar value={cs?.protocol_feasibility ?? 0} label="Protocol feasibility" />
            <ConfidenceBar value={cs?.materials_accuracy ?? 0} label="Materials accuracy" />
            <ConfidenceBar value={cs?.budget_accuracy ?? 0} label="Budget accuracy" />
            <ConfidenceBar value={cs?.timeline_accuracy ?? 0} label="Timeline accuracy" />
            <ConfidenceBar value={cs?.literature_qc_accuracy ?? 0} label="Literature QC" />
            <ConfidenceBar value={cs?.safety_completeness ?? 0} label="Safety completeness" />
            {cs?.note && <p className="border-t border-border pt-3 text-xs text-muted-foreground">{cs.note}</p>}
          </div>
        </PlanSection>
      </div>

      <PlanSection
        title="Literature QC"
        subtitle={plan.literature_qc?.summary}
        icon={<BookOpenCheck className="h-4.5 w-4.5" />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="chip-primary">{plan.literature_qc?.novelty_signal}</span>
          <span className="chip">confidence {(plan.literature_qc?.confidence ?? 0).toFixed(2)}</span>
        </div>

        {plan.literature_qc?.key_gaps?.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Key gaps
            </div>
            <BulletList items={plan.literature_qc.key_gaps} />
          </div>
        )}

        <div className="space-y-3">
          {plan.literature_qc?.references?.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-1 p-4">
              <div className="font-display text-sm font-semibold text-foreground">{r.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {r.authors} · <span className="font-mono">{r.year}</span> · {r.journal}
              </div>
              {r.relevance && <p className="mt-2 text-sm text-foreground/90">{r.relevance}</p>}
              {r.doi_or_url && r.doi_or_url !== "VERIFY_REQUIRED" && (
                <a
                  href={r.doi_or_url.startsWith("http") ? r.doi_or_url : `https://doi.org/${r.doi_or_url}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-block font-mono text-[11px] text-primary hover:underline"
                >
                  {r.doi_or_url} ↗
                </a>
              )}
              {r.doi_or_url === "VERIFY_REQUIRED" && (
                <span className="mt-2 inline-block font-mono text-[11px] text-warning">
                  ⚠ VERIFY_REQUIRED
                </span>
              )}
            </div>
          ))}
        </div>
      </PlanSection>

      {plan.next_steps?.length > 0 && (
        <PlanSection
          title="Next steps"
          subtitle="Start here on Monday"
          icon={<Activity className="h-4.5 w-4.5" />}
        >
          <ol className="space-y-2">
            {plan.next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/15 font-mono text-[11px] font-semibold text-primary ring-1 ring-primary/30">
                  {i + 1}
                </span>
                <span className="text-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </PlanSection>
      )}
    </div>
  );
}
