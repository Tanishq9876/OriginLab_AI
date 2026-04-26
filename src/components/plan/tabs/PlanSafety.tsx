import type { ExperimentPlan, SafetyFlag } from "@/types/experiment";
import { PlanSection, MetricTile, BulletList, KeyValue } from "../PlanSection";
import { ShieldAlert, HardHat, Trash2, FileCheck } from "lucide-react";

const RISK_TONE: Record<string, "default" | "primary" | "warning" | "destructive" | "success"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
};

export function PlanSafety({ plan }: { plan: ExperimentPlan }) {
  const s = plan.safety_assessment;
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MetricTile
          label="Risk level"
          value={(s?.risk_level ?? "—").toUpperCase()}
          tone={RISK_TONE[s?.risk_level?.toLowerCase()] ?? "default"}
        />
        <MetricTile label="Biosafety" value={s?.biosafety_level ?? "—"} />
        <MetricTile
          label="Safety flags"
          value={s?.flags?.length ?? 0}
          tone={(s?.flags?.length ?? 0) > 0 ? "warning" : "success"}
        />
      </div>

      <PlanSection title="Safety flags" icon={<ShieldAlert className="h-4.5 w-4.5" />}>
        {(s?.flags?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No safety flags raised.</p>
        ) : (
          <div className="grid gap-3">
            {s.flags.map((f, i) => (
              <FlagCard key={i} flag={f} />
            ))}
          </div>
        )}
      </PlanSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlanSection title="PPE required" icon={<HardHat className="h-4.5 w-4.5" />}>
          {(s?.ppe_required?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Standard lab PPE.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {s.ppe_required.map((p, i) => (
                <span key={i} className="chip">{p}</span>
              ))}
            </div>
          )}
        </PlanSection>

        <PlanSection title="Waste disposal" icon={<Trash2 className="h-4.5 w-4.5" />}>
          <p className="text-sm text-foreground/90">{s?.waste_disposal}</p>
        </PlanSection>
      </div>

      <PlanSection title="Approvals required" icon={<FileCheck className="h-4.5 w-4.5" />}>
        {(s?.approvals_required?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No formal approvals required.</p>
        ) : (
          <BulletList items={s.approvals_required} />
        )}
      </PlanSection>
    </div>
  );
}

function FlagCard({ flag }: { flag: SafetyFlag }) {
  const sev = flag.severity?.toLowerCase();
  const toneCls =
    sev === "critical"
      ? "border-destructive/40 bg-destructive/5 text-destructive"
      : sev === "warning"
      ? "border-warning/40 bg-warning/5 text-warning"
      : "border-accent/40 bg-accent/5 text-accent";

  return (
    <div className={`rounded-lg border p-4 ${toneCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider">{flag.severity}</span>
            <span className="chip !border-current/30 !bg-transparent !text-current">{flag.type}</span>
          </div>
          <p className="mt-2 text-sm text-foreground">{flag.description}</p>
        </div>
      </div>
      <dl className="mt-3 border-t border-current/20 pt-3">
        <KeyValue k="Action" v={flag.action_required} />
        <KeyValue
          k="Reference"
          v={
            flag.regulatory_reference?.startsWith("http") ? (
              <a
                href={flag.regulatory_reference}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[12px] underline"
              >
                {flag.regulatory_reference}
              </a>
            ) : (
              <span className="text-muted-foreground">{flag.regulatory_reference}</span>
            )
          }
        />
      </dl>
    </div>
  );
}
