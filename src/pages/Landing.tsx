import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  ListChecks,
  CircleDollarSign,
  Calendar,
  GitBranch,
  Sparkles,
  Loader2,
} from "lucide-react";

const PILLARS = [
  { icon: FlaskConical, title: "Hypothesis breakdown", body: "Variables, controls, and mechanism teased apart with a quality score." },
  { icon: ListChecks, title: "Step-by-step protocol", body: "Reagents, volumes, durations, checkpoints — written for a trained tech." },
  { icon: CircleDollarSign, title: "Itemized budget", body: "Real suppliers, catalog numbers, lead times, and cheaper alternatives." },
  { icon: Calendar, title: "Phased timeline", body: "Critical path, milestones, and go/no-go criteria for every phase." },
  { icon: ShieldCheck, title: "Safety & ethics", body: "BSL flags, PPE, waste disposal, IRB/IACUC approvals — flagged automatically." },
  { icon: GitBranch, title: "Self-critique", body: "Peer-review risks, uncertainty areas, and confidence scores per section." },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-hero">
      {/* Top nav */}
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Link to="/auth" className="gap-1.5">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="grid-bg absolute inset-0 -z-10" aria-hidden />
        <div className="container relative mx-auto max-w-5xl py-24 text-center md:py-32">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by GPT-5 deep reasoning
          </div>

          <h1 className="animate-fade-up font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            From hypothesis to <br className="hidden md:block" />
            <span className="text-gradient-primary">lab-ready protocol.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            OriginLab AI converts a one-line scientific hypothesis into a complete, executable
            experiment blueprint — protocol, materials, budget, timeline, validation, and safety —
            in minutes.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
            >
              <Link to="/auth" className="gap-2">
                Generate your first experiment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="font-mono text-xs text-muted-foreground">
              Sign in with Google · No credit card
            </p>
          </div>

          {/* Mock console */}
          <div className="animate-fade-up mt-16 panel-elevated mx-auto max-w-3xl overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                originlab://generate
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">v1.0</span>
            </div>
            <div className="space-y-3 bg-surface-1 p-5 font-mono text-[13px] leading-relaxed">
              <div>
                <span className="text-muted-foreground">{">"} hypothesis:</span>{" "}
                <span className="text-foreground">
                  Adding 5% DMSO to HeLa cryopreservation media improves post-thaw viability vs 10% glycerol.
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">●</span> parsing variables, controls, mechanism…
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">●</span> designing protocol (8 steps, 4 days)…
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">●</span> sourcing materials from Sigma, Thermo Fisher…
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">●</span> running self-critique pass…
              </div>
              <div className="text-success">
                ✓ plan_ready: 8 steps · 12 materials · est. $487 · 2.5 weeks
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="chip-primary mx-auto">CAPABILITIES</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Seven specialists. One blueprint.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every plan is reviewed by a virtual PI, lab tech, data scientist, safety officer,
            procurement specialist, and peer reviewer — silently, in parallel.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="panel group p-5 transition hover:border-border-strong">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-base font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="panel-elevated relative overflow-hidden p-10 text-center md:p-14">
          <div className="bg-gradient-glow absolute inset-0 opacity-50" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Stop staring at the blank page.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Type a hypothesis. Get a Friday-ready experiment plan you can actually run.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
            >
              <Link to="/auth" className="gap-2">
                Start free with Google
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} OriginLab AI</span>
          <span className="font-mono">Built for scientists who ship.</span>
        </div>
      </footer>
    </div>
  );
}
