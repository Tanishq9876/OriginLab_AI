import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, MetricTile, BulletList } from "../PlanSection";
import { CircleDollarSign, Lightbulb } from "lucide-react";

const fmt = (n: number) =>
  `$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function PlanBudget({ plan }: { plan: ExperimentPlan }) {
  const b = plan.budget;
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Reagents"    value={fmt(b?.subtotal_reagents_usd ?? 0)} />
        <MetricTile label="Equipment"   value={fmt(b?.subtotal_equipment_usd ?? 0)} />
        <MetricTile label="Consumables" value={fmt(b?.subtotal_consumables_usd ?? 0)} />
        <MetricTile label="Services"    value={fmt(b?.subtotal_services_usd ?? 0)} />
      </div>

      <PlanSection
        title="Budget summary"
        subtitle={b?.budget_notes}
        icon={<CircleDollarSign className="h-4.5 w-4.5" />}
      >
        <div className="rounded-lg border border-border bg-surface-1 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-mono text-base tabular-nums">
              {fmt((b?.subtotal_reagents_usd ?? 0) + (b?.subtotal_equipment_usd ?? 0) + (b?.subtotal_consumables_usd ?? 0) + (b?.subtotal_services_usd ?? 0))}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Contingency (10%)</span>
            <span className="font-mono text-base tabular-nums text-muted-foreground">
              {fmt(b?.contingency_10pct_usd ?? 0)}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-display text-base font-semibold">Total estimated</span>
            <span className="font-display text-3xl font-semibold tabular-nums text-primary">
              {fmt(b?.total_estimated_usd ?? 0)}
            </span>
          </div>
          <div className="mt-2 text-right font-mono text-[11px] text-muted-foreground">
            Confidence {(Math.round((b?.budget_confidence ?? 0) * 100))}%
          </div>
        </div>
      </PlanSection>

      <PlanSection title="Line items">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3 text-right">Qty</th>
                <th className="py-2 pr-3 text-right">Unit</th>
                <th className="py-2 pr-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {b?.line_items?.map((li, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2.5 pr-3">
                    <span className="chip">{li.category}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-foreground">{li.item}</td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{li.quantity}</td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-muted-foreground">
                    ${(li.unit_cost_usd ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                    ${(li.total_cost_usd ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PlanSection>

      {b?.cost_reduction_tips?.length > 0 && (
        <PlanSection title="Cost reduction tips" icon={<Lightbulb className="h-4.5 w-4.5" />}>
          <BulletList items={b.cost_reduction_tips} />
        </PlanSection>
      )}
    </div>
  );
}
