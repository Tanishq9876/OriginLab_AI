import type { ExperimentPlan } from "@/types/experiment";
import { PlanSection, MetricTile } from "../PlanSection";
import { Package, AlertCircle } from "lucide-react";
import { useState } from "react";

export function PlanMaterials({ plan }: { plan: ExperimentPlan }) {
  const [open, setOpen] = useState<number | null>(null);
  const m = plan.materials ?? [];
  const totalCost = m.reduce((s, x) => s + (x.estimated_cost_usd ?? 0), 0);
  const verifyCount = m.filter((x) => x.catalog_number === "VERIFY_REQUIRED").length;
  const maxLead = Math.max(0, ...m.map((x) => x.lead_time_days ?? 0));

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Items" value={m.length} />
        <MetricTile
          label="Materials cost"
          value={`$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <MetricTile
          label="Verify needed"
          value={verifyCount}
          tone={verifyCount > 0 ? "warning" : "success"}
        />
        <MetricTile label="Max lead time" value={`${maxLead}d`} />
      </div>

      <PlanSection title="Materials list" icon={<Package className="h-4.5 w-4.5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3">Supplier</th>
                <th className="py-2 pr-3">Catalog #</th>
                <th className="py-2 pr-3 text-right">Cost</th>
                <th className="py-2 pr-3 text-right">Lead</th>
                <th className="py-2 pr-3" />
              </tr>
            </thead>
            <tbody>
              {m.map((mat, i) => (
                <>
                  <tr
                    key={i}
                    className="cursor-pointer border-b border-border/60 transition hover:bg-surface-2"
                    onClick={() => setOpen(open === i ? null : i)}
                  >
                    <td className="py-3 pr-3">
                      <div className="font-medium text-foreground">{mat.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{mat.purpose}</div>
                    </td>
                    <td className="py-3 pr-3 text-foreground/90">{mat.supplier}</td>
                    <td className="py-3 pr-3">
                      {mat.catalog_number === "VERIFY_REQUIRED" ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-warning">
                          <AlertCircle className="h-3 w-3" />
                          VERIFY
                        </span>
                      ) : (
                        <span className="font-mono text-[12px] text-foreground/90">{mat.catalog_number}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums">
                      ${(mat.estimated_cost_usd ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums text-muted-foreground">
                      {mat.lead_time_days ?? 0}d
                    </td>
                    <td className="py-3 pr-3 text-right text-xs text-muted-foreground">
                      {open === i ? "−" : "+"}
                    </td>
                  </tr>
                  {open === i && (
                    <tr className="bg-surface-1">
                      <td colSpan={6} className="px-3 py-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              Quantity
                            </div>
                            <div className="mt-1 text-sm">{mat.quantity}</div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              Storage
                            </div>
                            <div className="mt-1 text-sm">{mat.storage}</div>
                          </div>
                        </div>
                        {mat.alternatives?.length > 0 && (
                          <div className="mt-4">
                            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              Alternatives
                            </div>
                            <div className="grid gap-2">
                              {mat.alternatives.map((a, ai) => (
                                <div
                                  key={ai}
                                  className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-0 p-3"
                                >
                                  <div>
                                    <div className="text-sm font-medium">{a.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {a.supplier} — {a.tradeoff}
                                    </div>
                                  </div>
                                  <span className="font-mono text-sm tabular-nums">${(a.cost_usd ?? 0).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </PlanSection>
    </div>
  );
}
