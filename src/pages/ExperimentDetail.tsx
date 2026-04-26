import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlanView } from "@/components/plan/PlanView";
import { DiscussionPanel } from "@/components/discussion/DiscussionPanel";
import type { ExperimentPlan } from "@/types/experiment";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { generatePdfReport, type CommentForReport, type AiInsights } from "@/lib/report/generatePdfReport";

type ExperimentRow = {
  id: string;
  hypothesis: string;
  feedback: string | null;
  country_code: string;
  title: string | null;
  domain: string | null;
  experiment_type_tag: string | null;
  status: string;
  plan: ExperimentPlan | null;
  error: string | null;
  model: string | null;
  created_at: string;
};

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<ExperimentRow | null | undefined>(undefined);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Could not load experiment");
        setRow(null);
        return;
      }
      setRow(data as unknown as ExperimentRow | null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (row === undefined) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (row === null) {
    return (
      <section className="container max-w-2xl py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Experiment not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been deleted.</p>
        <Button onClick={() => navigate("/dashboard")} className="mt-6">
          Back to dashboard
        </Button>
      </section>
    );
  }

  const downloadJson = () => {
    if (!row?.plan) return;
    const blob = new Blob([JSON.stringify(row.plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(row.title ?? "experiment").replace(/[^a-z0-9]+/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdfReport = async () => {
    if (!row?.plan) return;
    setGeneratingReport(true);
    try {
      // 1. Fetch all comments + commenter profiles
      const { data: commentRows, error: cErr } = await supabase
        .from("experiment_comments")
        .select("body, created_at, user_id")
        .eq("experiment_id", row.id)
        .order("created_at", { ascending: true });
      if (cErr) throw cErr;

      const userIds = Array.from(new Set((commentRows ?? []).map((c) => c.user_id)));
      let profileMap: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);
        profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
      }
      const comments: CommentForReport[] = (commentRows ?? []).map((c) => ({
        body: c.body,
        created_at: c.created_at,
        display_name: profileMap[c.user_id] ?? null,
      }));

      // 2. If we have comments, ask the AI assistant to summarize the discussion
      let ai: AiInsights | null = null;
      if (comments.length > 0) {
        try {
          const { data: aiData, error: aiErr } = await supabase.functions.invoke(
            "experiment-assistant",
            {
              body: {
                mode: "summary",
                experimentId: row.id,
                plan: row.plan,
                comments: comments.map((c, i) => ({
                  id: String(i),
                  author: c.display_name ?? "Anonymous",
                  body: c.body,
                  created_at: c.created_at,
                })),
              },
            },
          );
          if (!aiErr && aiData) {
            ai = {
              consensus: aiData.consensus ?? [],
              key_points: aiData.key_points ?? [],
              disagreements: aiData.disagreements ?? [],
              top_improvements: aiData.top_improvements ?? aiData.improvements ?? [],
              refined_hypothesis: aiData.refined_hypothesis ?? "",
            };
          }
        } catch (e) {
          console.warn("AI summary failed, continuing without it", e);
        }
      }

      // 3. Generate the PDF
      const doc = generatePdfReport({
        title: row.title ?? "Experiment Report",
        hypothesis: row.hypothesis,
        feedback: row.feedback,
        createdAt: row.created_at,
        plan: row.plan,
        comments,
        ai,
      });
      const safe = (row.title ?? "experiment_report").replace(/[^a-z0-9]+/gi, "_");
      doc.save(`${safe}_report.pdf`);
      toast.success("Report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <section className="container py-8">
      <Link to="/dashboard">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          All experiments
        </Button>
      </Link>

      {/* Hero header */}
      <header className="panel-elevated relative mb-6 overflow-hidden p-6 md:p-8">
        <div className="bg-gradient-glow absolute inset-0 opacity-30" aria-hidden />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {row.domain && <span className="chip-primary">{row.domain}</span>}
            {row.experiment_type_tag && (
              <span className="chip">#{row.experiment_type_tag}</span>
            )}
            <span className="chip">
              <Calendar className="h-3 w-3" />
              {format(new Date(row.created_at), "MMM d, yyyy")}
            </span>
            {row.model && <span className="chip">{row.model}</span>}
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {row.title ?? "Generating plan…"}
          </h1>

          <div className="mt-4 w-full rounded-md border border-border bg-surface-1 p-4">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Hypothesis
            </div>
            <p className="text-sm text-foreground/90">{row.hypothesis}</p>
            {row.feedback && (
              <>
                <div className="mt-3 mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Prior feedback
                </div>
                <p className="text-sm text-muted-foreground">{row.feedback}</p>
              </>
            )}
          </div>

          {row.status === "complete" && row.plan && (
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <Button
                size="sm"
                onClick={downloadPdfReport}
                disabled={generatingReport}
                className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {generatingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {generatingReport ? "Generating report…" : "Download PDF Report"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJson} className="gap-2">
                <Download className="h-4 w-4" /> JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          )}
        </div>
      </header>

      {row.status === "failed" && (
        <div className="panel mb-6 flex items-start gap-3 border-destructive/40 bg-destructive/5 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="font-display text-base font-semibold text-destructive">Generation failed</h3>
            <p className="mt-1 text-sm text-foreground/90">
              {row.error ?? "The model didn't return a usable plan."}
            </p>
            <Button
              size="sm"
              className="mt-4 bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={() => navigate("/new")}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {row.status !== "complete" && row.status !== "failed" && (
        <div className="panel grid place-items-center p-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="mt-3 font-display text-base font-semibold">Generating your plan…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Deep reasoning typically takes 30–90 seconds.
          </p>
        </div>
      )}

      {row.status === "complete" && row.plan && <PlanView plan={row.plan} />}

      {row.status === "complete" && (
        <DiscussionPanel experimentId={row.id} plan={row.plan} />
      )}
    </section>
  );
}
