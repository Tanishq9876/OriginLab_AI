import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  FlaskConical,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Row = {
  id: string;
  hypothesis: string;
  title: string | null;
  domain: string | null;
  status: string;
  created_at: string;
  error: string | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Row | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("experiments")
        .select("id, hypothesis, title, domain, status, created_at, error")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load experiments");
        setRows([]);
        return;
      }
      setRows(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = (rows ?? []).filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.hypothesis.toLowerCase().includes(q) ||
      (r.title ?? "").toLowerCase().includes(q) ||
      (r.domain ?? "").toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("experiments").delete().eq("id", toDelete.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.id !== toDelete.id));
    toast.success("Experiment deleted");
    setToDelete(null);
  };

  return (
    <section className="container py-10">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Your experiments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every plan you've generated, ready to revisit, share, or run.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hypothesis, title, domain…"
              className="pl-9 bg-surface-1"
            />
          </div>
          <Button
            onClick={() => navigate("/new")}
            className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </header>

      {rows === null ? (
        <div className="grid place-items-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState onCreate={() => navigate("/new")} />
        ) : (
          <div className="panel grid place-items-center p-12 text-center text-sm text-muted-foreground">
            No experiments match "{query}".
          </div>
        )
      ) : (
        <ul className="grid gap-3">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                to={`/experiment/${row.id}`}
                className="panel group flex items-start gap-4 p-5 transition hover:border-border-strong hover:bg-surface-2"
              >
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30">
                  <FlaskConical className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {row.title ?? "Generating plan…"}
                    </h3>
                    <StatusBadge status={row.status} />
                    {row.domain && <span className="chip">{row.domain}</span>}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {row.hypothesis}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </span>
                    {row.error && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-3 w-3" /> {row.error}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 transition group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    setToDelete(row);
                  }}
                  aria-label="Delete experiment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this experiment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the plan. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="panel-elevated relative overflow-hidden p-12 text-center">
      <div className="bg-gradient-glow absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/40">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-display text-xl font-semibold">Your lab notebook is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate your first complete experiment blueprint from a single hypothesis.
        </p>
        <Button
          onClick={onCreate}
          size="lg"
          className="mt-6 gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create your first experiment
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete") {
    return (
      <span className="chip-primary">
        <CheckCircle2 className="h-3 w-3" /> ready
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="chip border-destructive/40 bg-destructive/10 text-destructive">
        <AlertCircle className="h-3 w-3" /> failed
      </span>
    );
  }
  return (
    <span className="chip border-warning/40 bg-warning/10 text-warning">
      <Clock className="h-3 w-3" /> {status}
    </span>
  );
}
