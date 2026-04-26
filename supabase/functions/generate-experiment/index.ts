// Edge function: generate-experiment
// Calls Lovable AI Gateway with GPT-5 + high reasoning to produce a structured experiment plan.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "openai/gpt-5";

const buildSystemPrompt = (countryCode: string) => `
You are OriginLab AI, an expert multi-disciplinary scientific research operating system.

You act as a combined Principal Investigator, Literature Analyst, Lab Technician, Data Scientist,
Safety Officer, Procurement Specialist, and Peer Reviewer.

Your job is to convert a natural language scientific hypothesis into a complete, lab-executable
experimental plan that a real laboratory could pick up on Monday and begin executing by Friday.

Target country / region for supplier and currency localization: ${countryCode}

CRITICAL RULES — NEVER VIOLATE THESE:
1. NEVER hallucinate catalog numbers. If you are not certain, write "VERIFY_REQUIRED".
2. NEVER invent unsafe, impossible, or unverifiable biological or chemical steps.
3. NEVER omit controls. Every experiment needs a positive and negative control.
4. NEVER skip the self_critique section. It is mandatory.
5. ALWAYS prioritize reproducibility over novelty.
6. ALWAYS flag uncertainty using confidence scores below 0.7.
7. ALWAYS incorporate prior feedback corrections exactly as given — silently, without referencing.
8. ALWAYS check ethical, safety, and regulatory concerns.
9. IF the hypothesis is too vague to generate a plan, return the tool with experiment_title set to
   "INVALID_HYPOTHESIS", domain set to "error", overview explaining why, and minimal placeholder
   values for all other required fields.

Internal reasoning pipeline (do silently before producing tool call):
1. Parse hypothesis (independent var, dependent var, system, mechanism, implied control)
2. Assess feasibility (testable, reagents available, measurement validated, failure modes, confounders)
3. Literature similarity (novelty, prior benchmarks, gap)
4. Safety/ethics pre-check
5. Protocol design (minimum viable, executable, realistic durations, critical step)
6. Materials and procurement (real suppliers, catalog numbers or VERIFY_REQUIRED, costs)
7. Budget and timeline (bottom-up, 10% contingency, critical path)
8. Validation design (primary outcome, success threshold, controls, statistics, replicates)
9. Self-critique (weakest parts, peer review risks, improvements applied)

Return your output via the submit_experiment_plan tool. Every field must be populated. Never leave
arrays empty unless the field truly does not apply.
`;

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    experiment_title: { type: "string" },
    domain: { type: "string" },
    experiment_type_tag: { type: "string" },
    overview: { type: "string" },

    hypothesis_breakdown: {
      type: "object",
      additionalProperties: false,
      properties: {
        independent_variable: { type: "string" },
        dependent_variable: { type: "string" },
        system: { type: "string" },
        controls: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string" },
              description: { type: "string" },
            },
            required: ["type", "description"],
          },
        },
        measurement_methods: { type: "array", items: { type: "string" } },
        expected_mechanism: { type: "string" },
        confounding_factors: { type: "array", items: { type: "string" } },
        hypothesis_quality_score: { type: "number" },
        hypothesis_quality_notes: { type: "string" },
      },
      required: [
        "independent_variable",
        "dependent_variable",
        "system",
        "controls",
        "measurement_methods",
        "expected_mechanism",
        "confounding_factors",
        "hypothesis_quality_score",
        "hypothesis_quality_notes",
      ],
    },

    literature_qc: {
      type: "object",
      additionalProperties: false,
      properties: {
        novelty_signal: { type: "string" },
        confidence: { type: "number" },
        summary: { type: "string" },
        key_gaps: { type: "array", items: { type: "string" } },
        references: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              authors: { type: "string" },
              year: { type: "string" },
              journal: { type: "string" },
              doi_or_url: { type: "string" },
              relevance: { type: "string" },
            },
            required: ["title", "authors", "year", "journal", "doi_or_url", "relevance"],
          },
        },
      },
      required: ["novelty_signal", "confidence", "summary", "key_gaps", "references"],
    },

    protocol: {
      type: "object",
      additionalProperties: false,
      properties: {
        steps: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              step: { type: "number" },
              title: { type: "string" },
              action: { type: "string" },
              details: { type: "string" },
              duration: { type: "string" },
              reagents: { type: "array", items: { type: "string" } },
              critical_notes: { type: "string" },
              checkpoint: { type: "string" },
            },
            required: ["step", "title", "action", "details", "duration", "reagents", "critical_notes", "checkpoint"],
          },
        },
        total_duration: { type: "string" },
        difficulty: { type: "string" },
        required_equipment: { type: "array", items: { type: "string" } },
        critical_step: { type: "string" },
        failure_modes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string" },
              likelihood: { type: "string" },
              mitigation: { type: "string" },
            },
            required: ["mode", "likelihood", "mitigation"],
          },
        },
      },
      required: ["steps", "total_duration", "difficulty", "required_equipment", "critical_step", "failure_modes"],
    },

    materials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          purpose: { type: "string" },
          quantity: { type: "string" },
          supplier: { type: "string" },
          catalog_number: { type: "string" },
          estimated_cost_usd: { type: "number" },
          storage: { type: "string" },
          lead_time_days: { type: "number" },
          alternatives: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                supplier: { type: "string" },
                cost_usd: { type: "number" },
                tradeoff: { type: "string" },
              },
              required: ["name", "supplier", "cost_usd", "tradeoff"],
            },
          },
        },
        required: ["name", "purpose", "quantity", "supplier", "catalog_number", "estimated_cost_usd", "storage", "lead_time_days", "alternatives"],
      },
    },

    budget: {
      type: "object",
      additionalProperties: false,
      properties: {
        line_items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: "string" },
              item: { type: "string" },
              quantity: { type: "number" },
              unit_cost_usd: { type: "number" },
              total_cost_usd: { type: "number" },
            },
            required: ["category", "item", "quantity", "unit_cost_usd", "total_cost_usd"],
          },
        },
        subtotal_reagents_usd: { type: "number" },
        subtotal_equipment_usd: { type: "number" },
        subtotal_consumables_usd: { type: "number" },
        subtotal_services_usd: { type: "number" },
        contingency_10pct_usd: { type: "number" },
        total_estimated_usd: { type: "number" },
        budget_confidence: { type: "number" },
        budget_notes: { type: "string" },
        cost_reduction_tips: { type: "array", items: { type: "string" } },
      },
      required: [
        "line_items",
        "subtotal_reagents_usd",
        "subtotal_equipment_usd",
        "subtotal_consumables_usd",
        "subtotal_services_usd",
        "contingency_10pct_usd",
        "total_estimated_usd",
        "budget_confidence",
        "budget_notes",
        "cost_reduction_tips",
      ],
    },

    timeline: {
      type: "object",
      additionalProperties: false,
      properties: {
        phases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              phase_number: { type: "number" },
              name: { type: "string" },
              duration_days: { type: "number" },
              tasks: { type: "array", items: { type: "string" } },
              depends_on_phase: { type: ["number", "null"] },
              milestone: { type: "string" },
              go_no_go_criteria: { type: "string" },
            },
            required: ["phase_number", "name", "duration_days", "tasks", "depends_on_phase", "milestone", "go_no_go_criteria"],
          },
        },
        total_weeks: { type: "number" },
        critical_path: { type: "string" },
        earliest_start_date_note: { type: "string" },
      },
      required: ["phases", "total_weeks", "critical_path", "earliest_start_date_note"],
    },

    validation: {
      type: "object",
      additionalProperties: false,
      properties: {
        primary_outcome: { type: "string" },
        success_threshold: { type: "string" },
        failure_threshold: { type: "string" },
        measurement_method: { type: "string" },
        controls: {
          type: "object",
          additionalProperties: false,
          properties: {
            positive: { type: "string" },
            negative: { type: "string" },
            vehicle: { type: "string" },
          },
          required: ["positive", "negative", "vehicle"],
        },
        statistical_method: { type: "string" },
        replicates: { type: "string" },
        power_calculation: { type: "string" },
        secondary_outcomes: { type: "array", items: { type: "string" } },
        troubleshooting: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              symptom: { type: "string" },
              likely_cause: { type: "string" },
              fix: { type: "string" },
            },
            required: ["symptom", "likely_cause", "fix"],
          },
        },
      },
      required: [
        "primary_outcome",
        "success_threshold",
        "failure_threshold",
        "measurement_method",
        "controls",
        "statistical_method",
        "replicates",
        "power_calculation",
        "secondary_outcomes",
        "troubleshooting",
      ],
    },

    safety_assessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        risk_level: { type: "string" },
        biosafety_level: { type: "string" },
        flags: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string" },
              severity: { type: "string" },
              description: { type: "string" },
              action_required: { type: "string" },
              regulatory_reference: { type: "string" },
            },
            required: ["type", "severity", "description", "action_required", "regulatory_reference"],
          },
        },
        ppe_required: { type: "array", items: { type: "string" } },
        waste_disposal: { type: "string" },
        approvals_required: { type: "array", items: { type: "string" } },
      },
      required: ["risk_level", "biosafety_level", "flags", "ppe_required", "waste_disposal", "approvals_required"],
    },

    self_critique: {
      type: "object",
      additionalProperties: false,
      properties: {
        overall_score: { type: "number" },
        score_rationale: { type: "string" },
        weakest_sections: { type: "array", items: { type: "string" } },
        issues_found: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              section: { type: "string" },
              issue: { type: "string" },
              severity: { type: "string" },
              fix_applied: { type: "string" },
            },
            required: ["section", "issue", "severity", "fix_applied"],
          },
        },
        uncertainty_areas: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              area: { type: "string" },
              reason: { type: "string" },
              impact: { type: "string" },
            },
            required: ["area", "reason", "impact"],
          },
        },
        peer_review_risks: { type: "array", items: { type: "string" } },
        improvements_applied: { type: "array", items: { type: "string" } },
      },
      required: [
        "overall_score",
        "score_rationale",
        "weakest_sections",
        "issues_found",
        "uncertainty_areas",
        "peer_review_risks",
        "improvements_applied",
      ],
    },

    confidence_scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        overall: { type: "number" },
        protocol_feasibility: { type: "number" },
        materials_accuracy: { type: "number" },
        budget_accuracy: { type: "number" },
        timeline_accuracy: { type: "number" },
        literature_qc_accuracy: { type: "number" },
        safety_completeness: { type: "number" },
        note: { type: "string" },
      },
      required: [
        "overall",
        "protocol_feasibility",
        "materials_accuracy",
        "budget_accuracy",
        "timeline_accuracy",
        "literature_qc_accuracy",
        "safety_completeness",
        "note",
      ],
    },

    next_steps: { type: "array", items: { type: "string" } },
  },
  required: [
    "experiment_title",
    "domain",
    "experiment_type_tag",
    "overview",
    "hypothesis_breakdown",
    "literature_qc",
    "protocol",
    "materials",
    "budget",
    "timeline",
    "validation",
    "safety_assessment",
    "self_critique",
    "confidence_scores",
    "next_steps",
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const hypothesis = String(body.hypothesis ?? "").trim();
    const feedback = String(body.feedback ?? "").trim() || "None";
    const countryCode = String(body.country_code ?? "US").trim().toUpperCase().slice(0, 4) || "US";

    if (hypothesis.length < 10) {
      return new Response(JSON.stringify({ error: "Hypothesis must be at least 10 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hypothesis.length > 4000) {
      return new Response(JSON.stringify({ error: "Hypothesis must be under 4000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the experiment row in pending state.
    const { data: inserted, error: insertErr } = await supabase
      .from("experiments")
      .insert({
        user_id: userId,
        hypothesis,
        feedback: feedback === "None" ? null : feedback,
        country_code: countryCode,
        status: "generating",
        model: MODEL,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error("insert error", insertErr);
      return new Response(JSON.stringify({ error: "Could not create experiment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const experimentId = inserted.id;

    // Call Lovable AI Gateway with tool calling for structured output.
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning: { effort: "high" },
        messages: [
          { role: "system", content: buildSystemPrompt(countryCode) },
          {
            role: "user",
            content:
              `Scientific hypothesis:\n${hypothesis}\n\n` +
              `Prior scientist feedback (apply silently):\n${feedback}\n\n` +
              `Target country/region: ${countryCode}\n\n` +
              `Generate the full experiment plan now via the submit_experiment_plan tool.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_experiment_plan",
              description:
                "Submit the complete, lab-executable experiment plan for the given hypothesis.",
              parameters: PLAN_SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_experiment_plan" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      let userMsg = "AI generation failed.";
      if (aiResp.status === 429) userMsg = "Rate limit exceeded. Please try again in a moment.";
      if (aiResp.status === 402) userMsg = "AI credits exhausted. Add funds in Settings → Workspace → Usage.";

      await supabase
        .from("experiments")
        .update({ status: "failed", error: userMsg })
        .eq("id", experimentId);

      return new Response(JSON.stringify({ error: userMsg, experiment_id: experimentId }), {
        status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(aiJson).slice(0, 1000));
      await supabase
        .from("experiments")
        .update({ status: "failed", error: "Model returned no structured plan." })
        .eq("id", experimentId);
      return new Response(JSON.stringify({ error: "Model returned no structured plan.", experiment_id: experimentId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let plan: Record<string, unknown>;
    try {
      plan = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e);
      await supabase
        .from("experiments")
        .update({ status: "failed", error: "Could not parse model output." })
        .eq("id", experimentId);
      return new Response(JSON.stringify({ error: "Could not parse model output.", experiment_id: experimentId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = String(plan.experiment_title ?? "Untitled experiment");
    const domain = String(plan.domain ?? "Unknown");
    const tag = String(plan.experiment_type_tag ?? "");

    const { error: updateErr } = await supabase
      .from("experiments")
      .update({
        status: "complete",
        plan,
        title,
        domain,
        experiment_type_tag: tag,
        error: null,
      })
      .eq("id", experimentId);

    if (updateErr) {
      console.error("Update error", updateErr);
    }

    return new Response(JSON.stringify({ experiment_id: experimentId, plan, title, domain }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-experiment fatal", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
