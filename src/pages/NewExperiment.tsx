import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Lightbulb,
  Brain,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "CH", label: "Switzerland" },
  { code: "SE", label: "Sweden" },
  { code: "JP", label: "Japan" },
  { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" },
  { code: "IN", label: "India" },
  { code: "BR", label: "Brazil" },
];

const EXAMPLES = [
  "Adding 5% DMSO to HeLa cryopreservation media improves post-thaw viability vs 10% glycerol.",
  "B. subtilis biofilm formation on stainless steel coupons is reduced ≥50% by 1 mM cinnamaldehyde at 30°C over 24 h.",
  "Soil amended with 2% w/w biochar increases tomato seedling biomass by 20% under simulated drought stress.",
  "Pre-treating mild steel with a 5 mM benzotriazole solution reduces corrosion rate by ≥40% in 3.5% NaCl over 7 days.",
];

export default function NewExperiment() {
  const navigate = useNavigate();
  const [hypothesis, setHypothesis] = useState("");
  const [feedback, setFeedback] = useState("");
  const [country, setCountry] = useState("US");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hypothesis.trim();
    if (trimmed.length < 10) {
      toast.error("Please write at least one full sentence.");
      return;
    }
    if (trimmed.length > 4000) {
      toast.error("Hypothesis must be under 4000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-experiment", {
        body: {
          hypothesis: trimmed,
          feedback: feedback.trim() || null,
          country_code: country,
        },
      });

      if (error) {
        // supabase.functions.invoke wraps non-2xx — try to surface server message
        const ctx = (error as { context?: { body?: string } })?.context;
        let msg = error.message;
        try {
          const parsed = ctx?.body ? JSON.parse(ctx.body) : null;
          if (parsed?.error) msg = parsed.error;
        } catch { /* ignore */ }
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      const id = (data as { experiment_id?: string })?.experiment_id;
      if (!id) {
        toast.error("Generation finished but no experiment ID returned.");
        setSubmitting(false);
        return;
      }
      toast.success("Plan ready");
      navigate(`/experiment/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
      setSubmitting(false);
    }
  };

  return (
    <section className="container max-w-3xl py-10">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6 gap-1.5" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <header className="mb-8">
        <div className="chip-primary mb-3">NEW EXPERIMENT</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          What do you want to test?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your hypothesis in plain English. We'll handle the rest.
        </p>
      </header>

      <form onSubmit={submit} className="panel-elevated space-y-6 p-6 md:p-8">
        <div className="space-y-2">
          <Label htmlFor="hypothesis" className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-primary" />
            Hypothesis
          </Label>
          <Textarea
            id="hypothesis"
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="e.g. Heat-shocking E. coli at 42°C for 90s before transformation increases plasmid uptake efficiency vs the standard 30s shock."
            rows={5}
            disabled={submitting}
            className="resize-y bg-surface-1 font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>State the variable you change and the outcome you measure.</span>
            <span className="font-mono">{hypothesis.length}/4000</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback" className="flex items-center gap-2 text-sm font-medium">
            <Brain className="h-4 w-4 text-primary" />
            Prior feedback or constraints <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. We don't have access to a flow cytometer. Use trypan blue + hemocytometer instead."
            rows={3}
            disabled={submitting}
            className="resize-y bg-surface-1 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            The model applies these silently to the plan.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
            <Globe2 className="h-4 w-4 text-primary" />
            Region
          </Label>
          <Select value={country} onValueChange={setCountry} disabled={submitting}>
            <SelectTrigger id="country" className="bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Used to localize suppliers and pricing.
          </p>
        </div>

        <div className="border-t border-border pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full gap-2 bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating with GPT-5 deep reasoning… (~30–90s)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate experiment plan
              </>
            )}
          </Button>
          {submitting && (
            <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Reviewing literature · designing protocol · sourcing materials · running self-critique
            </p>
          )}
        </div>
      </form>

      <div className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Try an example
        </p>
        <div className="mt-3 grid gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={submitting}
              onClick={() => setHypothesis(ex)}
              className="panel cursor-pointer p-3 text-left text-sm text-muted-foreground transition hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
