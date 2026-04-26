import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Reply, Sparkles, Trash2, Send, ListTree } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ExperimentPlan } from "@/types/experiment";

type CommentRow = {
  id: string;
  experiment_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type SummaryResult = {
  type: "summary";
  key_points: string[];
  consensus: string[];
  disagreements: string[];
};

type AssistantTurn =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "reply"; text: string }
  | { id: string; kind: "summary"; data: SummaryResult };

function initials(name: string | null | undefined, fallback = "U") {
  const s = (name ?? "").trim();
  if (!s) return fallback;
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function DiscussionPanel({
  experimentId,
  plan,
}: {
  experimentId: string;
  plan: ExperimentPlan | null;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [posting, setPosting] = useState(false);

  // AI assistant
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiTurns, setAiTurns] = useState<AssistantTurn[]>([]);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Load comments + profiles
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("experiment_comments")
        .select("*")
        .eq("experiment_id", experimentId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Could not load discussion");
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as CommentRow[];
      setComments(rows);
      await hydrateProfiles(rows.map((c) => c.user_id));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`comments:${experimentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "experiment_comments",
          filter: `experiment_id=eq.${experimentId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as CommentRow;
            setComments((prev) =>
              prev.some((c) => c.id === row.id) ? prev : [...prev, row],
            );
            hydrateProfiles([row.user_id]);
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as CommentRow;
            setComments((prev) => prev.filter((c) => c.id !== oldRow.id));
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as CommentRow;
            setComments((prev) => prev.map((c) => (c.id === row.id ? row : c)));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [experimentId]);

  async function hydrateProfiles(userIds: string[]) {
    const need = Array.from(new Set(userIds)).filter((id) => id && !profiles[id]);
    if (!need.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", need);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as ProfileLite[]) next[p.id] = p;
        return next;
      });
    }
  }

  const tree = useMemo(() => {
    const roots: CommentRow[] = [];
    const childMap: Record<string, CommentRow[]> = {};
    for (const c of comments) {
      if (c.parent_id) {
        (childMap[c.parent_id] ||= []).push(c);
      } else {
        roots.push(c);
      }
    }
    return { roots, childMap };
  }, [comments]);

  async function postComment() {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    const { error } = await supabase.from("experiment_comments").insert({
      experiment_id: experimentId,
      user_id: user.id,
      parent_id: replyTo?.id ?? null,
      body: text,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    setReplyTo(null);
  }

  async function deleteComment(id: string) {
    const { error } = await supabase.from("experiment_comments").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  // ---- AI assistant calls ----
  async function callAssistant(mode: "reply" | "summary", query?: string) {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const enriched = comments.map((c) => ({
        ...c,
        author_name: profiles[c.user_id]?.display_name ?? "user",
      }));
      const { data, error } = await supabase.functions.invoke("experiment-assistant", {
        body: { mode, plan, comments: enriched, query },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (mode === "reply") {
        setAiTurns((t) => [
          ...t,
          { id: crypto.randomUUID(), kind: "user", text: query ?? "" },
          { id: crypto.randomUUID(), kind: "reply", text: data.response ?? "" },
        ]);
      } else {
        setAiTurns((t) => [
          ...t,
          {
            id: crypto.randomUUID(),
            kind: "summary",
            data: {
              type: "summary",
              key_points: data.key_points ?? [],
              consensus: data.consensus ?? [],
              disagreements: data.disagreements ?? [],
            },
          },
        ]);
      }
      setTimeout(() => {
        aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistant failed");
    } finally {
      setAiBusy(false);
    }
  }

  async function askAi() {
    const q = aiQuery.trim();
    if (!q) return;
    setAiQuery("");
    await callAssistant("reply", q);
  }

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[1fr,360px]">
      {/* Comments column */}
      <div className="panel p-6">
        <header className="mb-5 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Discussion</h2>
          <span className="ml-1 text-xs text-muted-foreground">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </header>

        {/* Composer */}
        <div className="mb-6 rounded-md border border-border bg-surface-1 p-3">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded bg-surface-2 px-2 py-1 text-xs text-muted-foreground">
              <span>
                Replying to{" "}
                <span className="text-foreground/90">
                  {profiles[replyTo.user_id]?.display_name ?? "user"}
                </span>
                : <em className="line-clamp-1">{replyTo.body}</em>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 underline-offset-2 hover:underline"
              >
                cancel
              </button>
            </div>
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={user ? "Share an observation, critique, or question…" : "Sign in to join the discussion"}
            disabled={!user || posting}
            className="min-h-[80px] resize-y bg-background"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Markdown supported. Be specific and constructive.
            </p>
            <Button
              size="sm"
              onClick={postComment}
              disabled={!user || !body.trim() || posting}
              className="gap-1.5"
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {replyTo ? "Reply" : "Post"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet. Start the discussion.
          </p>
        ) : (
          <ul className="space-y-5">
            {tree.roots.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                replies={tree.childMap[c.id] ?? []}
                profiles={profiles}
                currentUserId={user?.id}
                onReply={(target) => setReplyTo(target)}
                onDelete={deleteComment}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Assistant sidebar */}
      <aside className="panel flex h-fit flex-col p-5 lg:sticky lg:top-6">
        <header className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">AI assistant</h3>
        </header>
        <p className="mb-3 text-xs text-muted-foreground">
          Ask about the plan, or summarize the discussion.
        </p>

        <div className="mb-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => callAssistant("summary")}
            disabled={aiBusy}
            className="gap-1.5"
          >
            <ListTree className="h-3.5 w-3.5" /> Summarize thread
          </Button>
        </div>

        <div
          ref={aiScrollRef}
          className="mb-3 max-h-[420px] min-h-[120px] space-y-3 overflow-y-auto rounded-md border border-border bg-surface-1 p-3 text-sm"
        >
          {aiTurns.length === 0 && !aiBusy && (
            <p className="text-xs text-muted-foreground">
              No messages yet. Ask a question below.
            </p>
          )}
          {aiTurns.map((t) =>
            t.kind === "user" ? (
              <div key={t.id} className="rounded bg-surface-2 px-3 py-2 text-foreground/90">
                <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  You
                </div>
                {t.text}
              </div>
            ) : t.kind === "reply" ? (
              <div key={t.id} className="rounded border border-border bg-background px-3 py-2">
                <div className="mb-1 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Assistant
                </div>
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                  <ReactMarkdown>{t.text}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <SummaryCard key={t.id} data={t.data} />
            ),
          )}
          {aiBusy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                askAi();
              }
            }}
            placeholder="Ask about the plan or thread…"
            disabled={aiBusy}
            className="min-h-[44px] resize-none bg-background text-sm"
          />
          <Button size="sm" onClick={askAi} disabled={aiBusy || !aiQuery.trim()} className="self-end gap-1.5">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </aside>
    </section>
  );
}

function SummaryCard({ data }: { data: SummaryResult }) {
  return (
    <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2">
      <div className="mb-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary">
        <ListTree className="h-3 w-3" /> Thread summary
      </div>
      <SummarySection title="Key points" items={data.key_points} />
      <SummarySection title="Consensus" items={data.consensus} accent="success" />
      <SummarySection title="Disagreements" items={data.disagreements} accent="warning" />
    </div>
  );
}

function SummarySection({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent?: "success" | "warning";
}) {
  if (!items?.length) return null;
  const tone =
    accent === "success"
      ? "text-emerald-400"
      : accent === "warning"
        ? "text-amber-400"
        : "text-foreground/80";
  return (
    <div className="mb-2 last:mb-0">
      <div className={`mb-1 text-[10px] font-medium uppercase tracking-wider ${tone}`}>{title}</div>
      <ul className="ml-4 list-disc space-y-0.5 text-xs text-foreground/90">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  profiles,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  profiles: Record<string, ProfileLite>;
  currentUserId?: string;
  onReply: (c: CommentRow) => void;
  onDelete: (id: string) => void;
}) {
  const profile = profiles[comment.user_id];
  const name = profile?.display_name ?? "User";
  const isMine = currentUserId === comment.user_id;
  return (
    <li>
      <article className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">{name}</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground/90 prose-p:my-0">
            {comment.body}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Reply className="h-3 w-3" /> Reply
            </button>
            {isMine && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            )}
          </div>
          {replies.length > 0 && (
            <ul className="mt-4 space-y-4 border-l border-border pl-4">
              {replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  replies={[]}
                  profiles={profiles}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      </article>
    </li>
  );
}
