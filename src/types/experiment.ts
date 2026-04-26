/**
 * Type definitions for the structured experiment plan returned by the AI.
 * Mirrors the JSON schema submitted via tool calling in the edge function.
 */

export type ExperimentControl = { type: string; description: string };

export type Reference = {
  title: string;
  authors: string;
  year: string;
  journal: string;
  doi_or_url: string;
  relevance: string;
};

export type ProtocolStep = {
  step: number;
  title: string;
  action: string;
  details: string;
  duration: string;
  reagents: string[];
  critical_notes: string;
  checkpoint: string;
};

export type FailureMode = {
  mode: string;
  likelihood: "low" | "medium" | "high" | string;
  mitigation: string;
};

export type MaterialAlternative = {
  name: string;
  supplier: string;
  cost_usd: number;
  tradeoff: string;
};

export type Material = {
  name: string;
  purpose: string;
  quantity: string;
  supplier: string;
  catalog_number: string;
  estimated_cost_usd: number;
  storage: string;
  lead_time_days: number;
  alternatives: MaterialAlternative[];
};

export type BudgetLineItem = {
  category: string;
  item: string;
  quantity: number;
  unit_cost_usd: number;
  total_cost_usd: number;
};

export type TimelinePhase = {
  phase_number: number;
  name: string;
  duration_days: number;
  tasks: string[];
  depends_on_phase: number | null;
  milestone: string;
  go_no_go_criteria: string;
};

export type SafetyFlag = {
  type: string;
  severity: "info" | "warning" | "critical" | string;
  description: string;
  action_required: string;
  regulatory_reference: string;
};

export type Troubleshooting = {
  symptom: string;
  likely_cause: string;
  fix: string;
};

export type IssueFound = {
  section: string;
  issue: string;
  severity: "minor" | "moderate" | "major" | string;
  fix_applied: string;
};

export type UncertaintyArea = { area: string; reason: string; impact: string };

export type ExperimentPlan = {
  experiment_title: string;
  domain: string;
  experiment_type_tag: string;
  overview: string;

  hypothesis_breakdown: {
    independent_variable: string;
    dependent_variable: string;
    system: string;
    controls: ExperimentControl[];
    measurement_methods: string[];
    expected_mechanism: string;
    confounding_factors: string[];
    hypothesis_quality_score: number;
    hypothesis_quality_notes: string;
  };

  literature_qc: {
    novelty_signal: string;
    confidence: number;
    summary: string;
    key_gaps: string[];
    references: Reference[];
  };

  protocol: {
    steps: ProtocolStep[];
    total_duration: string;
    difficulty: string;
    required_equipment: string[];
    critical_step: string;
    failure_modes: FailureMode[];
  };

  materials: Material[];

  budget: {
    line_items: BudgetLineItem[];
    subtotal_reagents_usd: number;
    subtotal_equipment_usd: number;
    subtotal_consumables_usd: number;
    subtotal_services_usd: number;
    contingency_10pct_usd: number;
    total_estimated_usd: number;
    budget_confidence: number;
    budget_notes: string;
    cost_reduction_tips: string[];
  };

  timeline: {
    phases: TimelinePhase[];
    total_weeks: number;
    critical_path: string;
    earliest_start_date_note: string;
  };

  validation: {
    primary_outcome: string;
    success_threshold: string;
    failure_threshold: string;
    measurement_method: string;
    controls: { positive: string; negative: string; vehicle: string };
    statistical_method: string;
    replicates: string;
    power_calculation: string;
    secondary_outcomes: string[];
    troubleshooting: Troubleshooting[];
  };

  safety_assessment: {
    risk_level: string;
    biosafety_level: string;
    flags: SafetyFlag[];
    ppe_required: string[];
    waste_disposal: string;
    approvals_required: string[];
  };

  self_critique: {
    overall_score: number;
    score_rationale: string;
    weakest_sections: string[];
    issues_found: IssueFound[];
    uncertainty_areas: UncertaintyArea[];
    peer_review_risks: string[];
    improvements_applied: string[];
  };

  confidence_scores: {
    overall: number;
    protocol_feasibility: number;
    materials_accuracy: number;
    budget_accuracy: number;
    timeline_accuracy: number;
    literature_qc_accuracy: number;
    safety_completeness: number;
    note: string;
  };

  next_steps: string[];
};
