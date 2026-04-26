// supabase/functions/enhance-hypothesis/index.ts
// Literature-aware hypothesis enhancer.
// 1. Pulls real papers from Semantic Scholar + arXiv
// 2. Sends them with the hypothesis to Lovable AI (Gemini) using strict tool-calling
// 3. Returns novelty classification, insights, suggestions, and an enhanced plan

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-2.5-pro";

// ---------- Literature search helpers ----------

type Paper = {
  title: string;
  authors: string;
  year: string;
  abstract: string;
  source: "semantic_scholar" | "arxiv";
  url?: string;
};

async function searchSemanticScholar(query: string): Promise<Paper[]> {
  try {
    const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("fields", "title,authors,year,abstract,url");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const papers: Paper[] = (json.data ?? []).map((p: {
      title?: string;
      authors?: { name?: string }[];
      year?: number;
      abstract?: string;
      url?: string;
    }) => ({
      title: p.title ?? "Untitled",
      authors:
        (p.authors ?? [])
          .slice(0, 3)
          .map((a) => a.name ?? "")
          .filter(Boolean)
          .join(", ") + ((p.authors?.length ?? 0) > 3 ? " et al." : ""),
      year: p.year ? String(p.year) : "n.d.",
      abstract: p.abstract ?? "",
      source: "semantic_scholar" as const,
      url: p.url,
    }));
    return papers;
  } catch (e) {
    console.warn("Semantic Scholar search failed:", e);
    return [];
  }
}

async function searchArxiv(query: string): Promise<Paper[]> {
  try {
    const url = new URL("http://export.arxiv.org/api/query");
    url.searchParams.set("search_query", `all:${query}`);
    url.searchParams.set("start", "0");
    url.searchParams.set("max_results", "5");
    url.searchParams.set("sortBy", "relevance");
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    // Tiny XML parse — arXiv returns Atom feed
    const entries = xml.split("<entry>").slice(1);
    const papers: Paper[] = entries.map((entry) => {
      const get = (tag: string) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? m[1].trim().replace(/\s+/g, " ") : "";
      };
      const authorMatches = [...entry.matchAll(/<name>([^<]+)<\/name>/g)].map(
        (m) => m[1],
      );
      const published = get("published");
      const year = published ? published.slice(0, 4) : "n.d.";
      const idLink = get("id");
      return {
        title: get("title").replace(/\s+/g, " "),
        authors:
          authorMatches.slice(0, 3).join(", ") +
          (authorMatches.length > 3 ? " et al." : ""),
        year,
        abstract: get("summary"),
        source: "arxiv" as const,
        url: idLink,
      };
    });
    return papers;
  } catch (e) {
    console.warn("arXiv search failed:", e);
    return [];
  }
}

function dedupeAndRank(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  const unique: Paper[] = [];
  for (const p of papers) {
    const key = p.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    if (p.title && p.abstract) unique.push(p);
  }
  // Prefer items with longer abstracts (more useful for the LLM)
  return unique
    .sort((a, b) => b.abstract.length - a.abstract.length)
    .slice(0, 6);
}

// ---------- LLM tool schema ----------

const ENHANCE_SCHEMA = {
  type: "object",
  properties: {
    novelty: {
      type: "string",
      enum: ["Novel", "Similar Work Exists", "Well-Studied"],
    },
    papers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          authors: { type: "string" },
          year: { type: "string" },
          summary: { type: "string" },
          key_findings: { type: "string" },
        },
        required: ["title", "authors", "year", "summary", "key_findings"],
        additionalProperties: false,
      },
    },
    insights: {
      type: "object",
      properties: {
        common_methods: { type: "array", items: { type: "string" } },
        variables_used: { type: "array", items: { type: "string" } },
        research_gaps: { type: "array", items: { type: "string" } },
      },
      required: ["common_methods", "variables_used", "research_gaps"],
      additionalProperties: false,
    },
    suggestions: { type: "array", items: { type: "string" } },
    enhanced_plan: {
      type: "object",
      properties: {
        hypothesis: { type: "string" },
        methodology: { type: "string" },
        materials: { type: "array", items: { type: "string" } },
        validation: { type: "string" },
      },
      required: ["hypothesis", "methodology", "materials", "validation"],
      additionalProperties: false,
    },
  },
  required: ["novelty", "papers", "insights", "suggestions", "enhanced_plan"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are an advanced AI research assistant.

You will be given:
- A scientific hypothesis from a user
- A list of REAL papers retrieved from Semantic Scholar and arXiv

Your job:
1. Use ONLY the provided papers — never invent citations. If none are relevant, return papers: [] and set novelty to "Novel".
2. Pick the 1–3 most relevant papers and rewrite each into a clean 2–3 line summary plus distinct key findings.
3. Classify novelty as exactly one of: "Novel", "Similar Work Exists", "Well-Studied".
4. Extract insights: common methodologies, variables typically studied, and research gaps.
5. Suggest concrete, actionable improvements to the hypothesis (refine variables, add controls, fix methodology, address gaps).
6. Produce an enhanced experiment plan with a refined hypothesis, a methodology paragraph, a materials list, and a validation criterion.

Be concise, scientifically grounded, and never hallucinate. If the supplied abstracts are weak, say so in suggestions and reflect it in novelty.`;

// ---------- Handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!req.headers.get("Authorization")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { hypothesis } = await req.json().catch(() => ({}));
    if (typeof hypothesis !== "string" || hypothesis.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Hypothesis must be at least 10 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build a focused search query — first 200 chars usually contains the IV/DV
    const query = hypothesis.trim().slice(0, 200);

    const [ss, ax] = await Promise.all([
      searchSemanticScholar(query),
      searchArxiv(query),
    ]);
    const papers = dedupeAndRank([...ss, ...ax]);

    const paperBlock = papers.length
      ? papers
          .map(
            (p, i) =>
              `[${i + 1}] (${p.source}) ${p.title}\n` +
              `Authors: ${p.authors || "Unknown"}\n` +
              `Year: ${p.year}\n` +
              `Abstract: ${p.abstract.slice(0, 1200)}\n`,
          )
          .join("\n---\n")
      : "No papers retrieved from Semantic Scholar or arXiv.";

    const userPrompt = `HYPOTHESIS:\n${hypothesis.trim()}\n\n` +
      `RETRIEVED PAPERS:\n${paperBlock}\n\n` +
      `Now produce the structured enhancement.`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submitEnhancement",
                description:
                  "Submit the literature-grounded enhancement of the hypothesis.",
                parameters: ENHANCE_SCHEMA,
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submitEnhancement" },
          },
        }),
      },
    );

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, text);
      let msg = `AI gateway error (${aiRes.status})`;
      try {
        const j = JSON.parse(text);
        if (j?.error?.message) msg = j.error.message;
      } catch { /* ignore */ }
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 502;
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Model did not return structured output" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse model output" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ...(parsed as Record<string, unknown>),
        meta: {
          retrieved_count: papers.length,
          sources: {
            semantic_scholar: ss.length,
            arxiv: ax.length,
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("enhance-hypothesis error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
