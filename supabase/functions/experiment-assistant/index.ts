// Discussion AI assistant: Reply or Summary modes over an experiment plan + comment thread.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-pro";

const SYSTEM_PROMPT = `You are an AI research assistant embedded in a scientific discussion platform.
Users are reviewing an experiment plan and discussing it in a threaded comment section.

Your job depends on the requested mode:

- "reply": Respond to the user's question or comment. Be scientifically rigorous, concise, specific, and actionable. Reference concrete parts of the plan or prior comments when relevant. If the user proposes an improvement, validate it, expand it with reasoning, and flag limitations honestly. If you don't know something, say so. Never hallucinate citations.

- "summary": Read the entire thread and produce: key_points (the main ideas raised), consensus (where most commenters agree), disagreements (open conflicts or trade-offs being debated). Stay neutral. If the thread is empty or thin, say so plainly in key_points.

Rules:
- Be concise. No filler, no praise, no "great question".
- Markdown allowed in reply text (lists, **bold**, inline code).
- Never invent facts about the plan that aren't present.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "respond",
      description: "Return the assistant response in the requested mode.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["reply", "summary"] },
          response: {
            type: "string",
            description: "Reply text (markdown). Required when type is 'reply'. Empty string when type is 'summary'.",
          },
          key_points: {
            type: "array",
            items: { type: "string" },
            description: "Required for summary mode.",
          },
          consensus: {
            type: "array",
            items: { type: "string" },
            description: "Required for summary mode.",
          },
          disagreements: {
            type: "array",
            items: { type: "string" },
            description: "Required for summary mode.",
          },
        },
        required: ["type", "response", "key_points", "consensus", "disagreements"],
        additionalProperties: false,
      },
    },
  },
];

function trimPlan(plan: unknown): string {
  // Keep payload small — pass title + overview + protocol summary + validation summary.
  if (!plan || typeof plan !== "object") return "(no plan)";
  const p = plan as Record<string, any>;
  const out: Record<string, unknown> = {
    title: p.experiment_title,
    domain: p.domain,
    overview: p.overview,
    hypothesis_breakdown: p.hypothesis_breakdown,
    protocol_steps: Array.isArray(p.protocol?.steps)
      ? p.protocol.steps.map((s: any) => ({
          step: s.step,
          title: s.title,
          action: s.action,
        }))
      : undefined,
    validation: p.validation
      ? {
          primary_outcome: p.validation.primary_outcome,
          success_threshold: p.validation.success_threshold,
          statistical_method: p.validation.statistical_method,
        }
      : undefined,
    safety_risk_level: p.safety_assessment?.risk_level,
  };
  return JSON.stringify(out, null, 2).slice(0, 8000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, plan, comments, query } = await req.json();
    if (mode !== "reply" && mode !== "summary") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "reply" && (!query || typeof query !== "string")) {
      return new Response(JSON.stringify({ error: "query is required for reply mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const threadText = Array.isArray(comments) && comments.length
      ? comments
          .slice(-40)
          .map(
            (c: any, i: number) =>
              `[#${i + 1}${c.parent_id ? " ↳reply" : ""}] ${c.author_name ?? "user"}: ${c.body}`,
          )
          .join("\n")
      : "(no comments yet)";

    const userMessage =
      mode === "reply"
        ? `# Experiment plan\n${trimPlan(plan)}\n\n# Discussion thread\n${threadText}\n\n# New user message\n${query}\n\nRespond with mode="reply".`
        : `# Experiment plan\n${trimPlan(plan)}\n\n# Discussion thread\n${threadText}\n\nProduce mode="summary".`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "respond" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errTxt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errTxt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Model did not return a structured response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("experiment-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
