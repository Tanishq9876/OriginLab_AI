import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  BookOpenCheck,
  Loader2,
  ScrollText,
  Sparkles,
  FlaskConical,
  Lightbulb,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export type EnhancementResult = {
  novelty: "Novel" | "Similar Work Exists" | "Well-Studied";
  papers: {
    title: string;
    authors: string;
    year: string;
    summary: string;
    key_findings: string;
  }[];
  insights: {
    common_methods: string[];
    variables_used: string[];
    research_gaps: string[];
  };
  suggestions: string[];
  enhanced_plan: {
    hypothesis: string;
    methodology: string;
    materials: string[];
    validation: string;
  };
  meta?: {
    retrieved_count: number;
    sources: { semantic_scholar: number; arxiv: number };
  };
};

const NOVELTY_TONE: Record<EnhancementResult["novelty"], string> = {
  "Novel": "bg-success/15 text-success border-success/30",
  "Similar Work Exists": "bg-primary/15 text-primary border-primary/30",
  "Well-Studied": "bg-warning/15 text-warning border-warning/30",
};

interface Props {
  hypothesis: string;
  disabled?: boolean;
  onUseEnhanced: (refined: string) => void;
}

export function HypothesisEnhancer({ hypothesis, disabled, onUseEnhanced }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);

  const run = async () => {
    const trimmed = hypothesis.trim();
    if (trimmed.length < 10) {
      toast.error("Write at least one full sentence first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-hypothesis", {
        body: { hypothesis: trimmed },
      });
      if (error) {
        const ctx = (error as { context?: { body?: string } })?.context;
        let msg = error.message;
        try {
          const parsed = ctx?.body ? JSON.parse(ctx.body) : null;
          if (parsed?.error) msg = parsed.error;
        } catch { /* ignore */ }
        toast.error(msg);
        return;
      }
      setResult(data as EnhancementResult);
      toast.success("Literature scan complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enhancement failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface-1/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">Literature scan</span>
          <span className="text-muted-foreground">
            — Semantic Scholar + arXiv → novelty + suggested improvements
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={run}
          disabled={disabled || loading}
          className="gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Enhance with literature
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-surface-1 p-5 animate-fade-up">
          {/* Novelty badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider ${NOVELTY_TONE[result.novelty]}`}
            >
              {result.novelty}
            </span>
            {result.meta && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {result.meta.retrieved_count} papers retrieved · SS{" "}
                {result.meta.sources.semantic_scholar} / arXiv{" "}
                {result.meta.sources.arxiv}
              </span>
            )}
          </div>

          {/* Papers */}
          {result.papers.length > 0 ? (
            <section className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5" /> Relevant prior work
              </h4>
              <ul className="space-y-2">
                {result.papers.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-border bg-background p-3 text-sm"
                  >
                    <div className="font-medium leading-snug">{p.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {p.authors || "Unknown"} · {p.year}
                    </div>
                    <p className="mt-1.5 text-[13px] text-foreground/90">{p.summary}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">Key findings: </span>
                      {p.key_findings}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              No strong matches found — your hypothesis appears under-explored.
            </p>
          )}

          {/* Insights grid */}
          <section className="grid gap-3 sm:grid-cols-3">
            <InsightBlock
              icon={<FlaskConical className="h-3.5 w-3.5" />}
              title="Common methods"
              items={result.insights.common_methods}
            />
            <InsightBlock
              icon={<ListChecks className="h-3.5 w-3.5" />}
              title="Variables used"
              items={result.insights.variables_used}
            />
            <InsightBlock
              icon={<Lightbulb className="h-3.5 w-3.5" />}
              title="Research gaps"
              items={result.insights.research_gaps}
            />
          </section>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Suggested improvements
              </h4>
              <ul className="space-y-1 text-sm">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Refined hypothesis CTA */}
          <section className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-primary">
                Refined hypothesis
              </h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onUseEnhanced(result.enhanced_plan.hypothesis);
                  toast.success("Hypothesis updated");
                }}
                className="h-7 gap-1 text-xs"
              >
                Use this <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-2 text-sm leading-relaxed">
              {result.enhanced_plan.hypothesis}
            </p>
            <details className="mt-2 text-[12px] text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Show suggested methodology, materials & validation
              </summary>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="font-medium text-foreground/80">Methodology: </span>
                  {result.enhanced_plan.methodology}
                </p>
                {result.enhanced_plan.materials.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground/80">Materials: </span>
                    {result.enhanced_plan.materials.join(", ")}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground/80">Validation: </span>
                  {result.enhanced_plan.validation}
                </p>
              </div>
            </details>
          </section>
        </div>
      )}
    </div>
  );
}

function InsightBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <h5 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h5>
      {items.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5 text-[12px]">
          {items.map((it, i) => (
            <li key={i} className="text-foreground/90">• {it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12px] text-muted-foreground">—</p>
      )}
    </div>
  );
}
