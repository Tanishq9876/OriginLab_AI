import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExperimentPlan } from "@/types/experiment";

export type CommentForReport = {
  body: string;
  created_at: string;
  display_name: string | null;
};

export type AiInsights = {
  consensus: string[];
  key_points: string[];
  disagreements: string[];
  top_improvements: string[];
  refined_hypothesis: string;
};

export type ReportInput = {
  title: string;
  hypothesis: string;
  feedback?: string | null;
  createdAt: string;
  plan: ExperimentPlan;
  comments: CommentForReport[];
  ai?: AiInsights | null;
};

const PAGE_MARGIN = 48;
const LINE = 14;

export function generatePdfReport(input: ReportInput): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const setFont = (size: number, style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const writeWrapped = (text: string, size = 10, style: "normal" | "bold" | "italic" = "normal", indent = 0) => {
    if (!text) return;
    setFont(size, style);
    const lines = doc.splitTextToSize(text, contentW - indent);
    for (const ln of lines) {
      ensureSpace(LINE);
      doc.text(ln, PAGE_MARGIN + indent, y);
      y += size + 4;
    }
  };

  const h1 = (t: string) => {
    ensureSpace(40);
    setFont(18, "bold");
    doc.setTextColor(20, 20, 30);
    doc.text(t, PAGE_MARGIN, y);
    y += 22;
    doc.setDrawColor(120, 120, 200);
    doc.setLineWidth(1);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 14;
    doc.setTextColor(0, 0, 0);
  };

  const h2 = (t: string) => {
    ensureSpace(28);
    setFont(13, "bold");
    doc.setTextColor(40, 40, 80);
    doc.text(t, PAGE_MARGIN, y);
    y += 18;
    doc.setTextColor(0, 0, 0);
  };

  const h3 = (t: string) => {
    ensureSpace(22);
    setFont(11, "bold");
    doc.text(t, PAGE_MARGIN, y);
    y += 14;
  };

  const bullets = (items: (string | undefined | null)[], indent = 12) => {
    const clean = items.filter((s): s is string => !!s && s.trim().length > 0);
    if (clean.length === 0) {
      writeWrapped("—", 10, "italic", indent);
      return;
    }
    for (const it of clean) {
      setFont(10);
      const lines = doc.splitTextToSize(it, contentW - indent - 10);
      ensureSpace(LINE * lines.length);
      doc.text("•", PAGE_MARGIN + indent - 8, y);
      doc.text(lines, PAGE_MARGIN + indent + 4, y);
      y += lines.length * (10 + 4) + 2;
    }
  };

  const placeholder = (label: string) => {
    ensureSpace(80);
    doc.setDrawColor(180);
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(PAGE_MARGIN, y, contentW, 70, 6, 6, "FD");
    setFont(10, "italic");
    doc.setTextColor(110);
    doc.text(`[Graph: ${label}]`, PAGE_MARGIN + 12, y + 28);
    setFont(8);
    doc.text("Visualization placeholder for PDF report", PAGE_MARGIN + 12, y + 46);
    doc.setTextColor(0);
    y += 84;
  };

  const table = (head: string[][], body: (string | number)[][]) => {
    autoTable(doc, {
      head,
      body,
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [60, 60, 110], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      didDrawPage: (data) => {
        y = data.cursor?.y ?? y;
      },
    });
    // @ts-expect-error - autoTable patches lastAutoTable on doc
    y = (doc.lastAutoTable?.finalY ?? y) + 14;
  };

  // ---------- Cover ----------
  setFont(22, "bold");
  doc.text("Experiment Report", PAGE_MARGIN, y);
  y += 28;
  setFont(14, "bold");
  doc.setTextColor(60, 60, 110);
  const titleLines = doc.splitTextToSize(input.title || "Untitled experiment", contentW);
  doc.text(titleLines, PAGE_MARGIN, y);
  y += titleLines.length * 18 + 6;
  doc.setTextColor(110);
  setFont(10);
  doc.text(
    `Generated ${new Date().toLocaleDateString()} · Domain: ${input.plan.domain ?? "—"} · Tag: ${input.plan.experiment_type_tag ?? "—"}`,
    PAGE_MARGIN,
    y,
  );
  y += 22;
  doc.setTextColor(0);

  // ---------- 1. Overview ----------
  h1("1. Overview");
  h3("Hypothesis");
  writeWrapped(input.hypothesis);
  y += 4;
  h3("Objective");
  writeWrapped(input.plan.overview);
  y += 4;
  h3("Background");
  writeWrapped(input.plan.literature_qc?.summary ?? "No literature summary available.");
  if (input.plan.literature_qc?.key_gaps?.length) {
    h3("Key research gaps");
    bullets(input.plan.literature_qc.key_gaps);
  }
  if (input.feedback) {
    h3("Prior feedback considered");
    writeWrapped(input.feedback, 10, "italic");
  }

  // ---------- 2. Protocols ----------
  h1("2. Protocols");
  const p = input.plan.protocol;
  writeWrapped(`Total duration: ${p?.total_duration ?? "—"} · Difficulty: ${p?.difficulty ?? "—"}`);
  if (p?.critical_step) {
    h3("Critical step");
    writeWrapped(p.critical_step);
  }
  if (p?.required_equipment?.length) {
    h3("Required equipment");
    bullets(p.required_equipment);
  }
  h3("Procedure");
  (p?.steps ?? []).forEach((s) => {
    ensureSpace(40);
    setFont(11, "bold");
    doc.text(`Step ${s.step}. ${s.title}`, PAGE_MARGIN, y);
    y += 14;
    writeWrapped(s.action, 10, "normal");
    if (s.details) writeWrapped(s.details, 9, "normal", 12);
    if (s.duration) writeWrapped(`Duration: ${s.duration}`, 9, "italic", 12);
    if (s.reagents?.length) writeWrapped(`Reagents: ${s.reagents.join(", ")}`, 9, "italic", 12);
    if (s.critical_notes) writeWrapped(`⚠ ${s.critical_notes}`, 9, "italic", 12);
    if (s.checkpoint) writeWrapped(`Checkpoint: ${s.checkpoint}`, 9, "italic", 12);
    y += 4;
  });

  const ctrls = input.plan.hypothesis_breakdown?.controls ?? [];
  if (ctrls.length) {
    h3("Controls & variables");
    writeWrapped(`Independent: ${input.plan.hypothesis_breakdown?.independent_variable ?? "—"}`);
    writeWrapped(`Dependent: ${input.plan.hypothesis_breakdown?.dependent_variable ?? "—"}`);
    table(
      [["Type", "Description"]],
      ctrls.map((c) => [c.type, c.description]),
    );
  }

  // ---------- 3. Materials ----------
  h1("3. Materials");
  const mats = input.plan.materials ?? [];
  if (mats.length === 0) writeWrapped("No materials listed.", 10, "italic");
  else
    table(
      [["Item", "Qty", "Supplier", "Cat #", "Cost (USD)"]],
      mats.map((m) => [
        m.name,
        m.quantity,
        m.supplier,
        m.catalog_number,
        `$${(m.estimated_cost_usd ?? 0).toLocaleString()}`,
      ]),
    );

  // ---------- 4. Budget ----------
  h1("4. Budget");
  const b = input.plan.budget;
  if (b?.line_items?.length) {
    table(
      [["Category", "Item", "Qty", "Unit $", "Total $"]],
      b.line_items.map((li) => [
        li.category,
        li.item,
        String(li.quantity),
        `$${(li.unit_cost_usd ?? 0).toLocaleString()}`,
        `$${(li.total_cost_usd ?? 0).toLocaleString()}`,
      ]),
    );
  }
  writeWrapped(`Reagents: $${(b?.subtotal_reagents_usd ?? 0).toLocaleString()}`);
  writeWrapped(`Equipment: $${(b?.subtotal_equipment_usd ?? 0).toLocaleString()}`);
  writeWrapped(`Consumables: $${(b?.subtotal_consumables_usd ?? 0).toLocaleString()}`);
  writeWrapped(`Services: $${(b?.subtotal_services_usd ?? 0).toLocaleString()}`);
  writeWrapped(`Contingency (10%): $${(b?.contingency_10pct_usd ?? 0).toLocaleString()}`);
  setFont(12, "bold");
  ensureSpace(20);
  doc.text(`Total estimated: $${(b?.total_estimated_usd ?? 0).toLocaleString()}`, PAGE_MARGIN, y);
  y += 18;
  if (b?.cost_reduction_tips?.length) {
    h3("Cost optimization");
    bullets(b.cost_reduction_tips);
  }
  placeholder("Budget Allocation Pie Chart");

  // ---------- 5. Timeline ----------
  h1("5. Timeline");
  const t = input.plan.timeline;
  writeWrapped(`Total: ${t?.total_weeks ?? "—"} weeks · Critical path: ${t?.critical_path ?? "—"}`);
  if (t?.phases?.length) {
    table(
      [["#", "Phase", "Days", "Depends on", "Milestone"]],
      t.phases.map((ph) => [
        String(ph.phase_number),
        ph.name,
        String(ph.duration_days),
        ph.depends_on_phase != null ? `Phase ${ph.depends_on_phase}` : "—",
        ph.milestone,
      ]),
    );
  }
  placeholder("Timeline Gantt Chart");

  // ---------- 6. Validation ----------
  h1("6. Validation");
  const v = input.plan.validation;
  writeWrapped(`Primary outcome: ${v?.primary_outcome ?? "—"}`);
  writeWrapped(`Success threshold: ${v?.success_threshold ?? "—"}`);
  writeWrapped(`Failure threshold: ${v?.failure_threshold ?? "—"}`);
  writeWrapped(`Measurement method: ${v?.measurement_method ?? "—"}`);
  writeWrapped(`Statistical method: ${v?.statistical_method ?? "—"}`);
  writeWrapped(`Replicates: ${v?.replicates ?? "—"}`);
  writeWrapped(`Power calculation: ${v?.power_calculation ?? "—"}`);
  if (v?.secondary_outcomes?.length) {
    h3("Secondary outcomes");
    bullets(v.secondary_outcomes);
  }
  placeholder("Dose–Response / Outcome Comparison Chart");

  // ---------- 7. Safety ----------
  h1("7. Safety");
  const s = input.plan.safety_assessment;
  writeWrapped(`Risk level: ${s?.risk_level ?? "—"} · Biosafety: ${s?.biosafety_level ?? "—"}`);
  if (s?.ppe_required?.length) {
    h3("PPE required");
    bullets(s.ppe_required);
  }
  if (s?.flags?.length) {
    h3("Safety flags");
    table(
      [["Type", "Severity", "Description", "Action"]],
      s.flags.map((f) => [f.type, f.severity, f.description, f.action_required]),
    );
  }
  if (s?.waste_disposal) {
    h3("Waste disposal");
    writeWrapped(s.waste_disposal);
  }
  if (s?.approvals_required?.length) {
    h3("Approvals required (ethical/regulatory)");
    bullets(s.approvals_required);
  }

  // ---------- 8. Community Critique ----------
  h1("8. Community Critique");
  if (input.comments.length === 0) {
    writeWrapped("No community comments yet.", 10, "italic");
  } else {
    writeWrapped(`${input.comments.length} comment(s) collected from the discussion thread.`);
    y += 4;
    input.comments.slice(0, 25).forEach((c) => {
      ensureSpace(40);
      setFont(10, "bold");
      doc.text(
        `${c.display_name ?? "Anonymous"} · ${new Date(c.created_at).toLocaleDateString()}`,
        PAGE_MARGIN,
        y,
      );
      y += 12;
      writeWrapped(c.body, 10, "normal", 12);
      y += 4;
    });
  }

  // ---------- 9. AI-Summarized Insights ----------
  h1("9. AI-Summarized Insights");
  if (!input.ai) {
    writeWrapped("No AI summary was generated. Open the Discussion panel and run the assistant to include consensus and improvement suggestions in future reports.", 10, "italic");
  } else {
    h3("Consensus from community");
    bullets(input.ai.consensus);
    h3("Key discussion points");
    bullets(input.ai.key_points);
    if (input.ai.disagreements?.length) {
      h3("Open disagreements");
      bullets(input.ai.disagreements);
    }
    h3("Top improvements suggested");
    bullets(input.ai.top_improvements);
    if (input.ai.refined_hypothesis) {
      h3("Final refined hypothesis");
      writeWrapped(input.ai.refined_hypothesis, 11, "italic");
    }
  }

  const sc = input.plan.self_critique;
  if (sc?.improvements_applied?.length) {
    h3("AI self-critique improvements already applied");
    bullets(sc.improvements_applied);
  }

  // ---------- 10. Graphical Analysis ----------
  h1("10. Graphical Analysis");
  writeWrapped(
    "The following placeholders mark recommended visualizations. They can be rendered from the structured data above using your preferred plotting tool.",
    10,
    "italic",
  );
  placeholder("Reaction Time vs Caffeine Dose (Placebo vs Levels)");
  placeholder("Dose–Response Curve");
  placeholder("Timeline Gantt Chart");
  placeholder("Budget Allocation Pie Chart");

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setFont(8);
    doc.setTextColor(140);
    doc.text(
      `${input.title || "Experiment Report"}  ·  Page ${i} of ${pages}`,
      pageW / 2,
      pageH - 20,
      { align: "center" },
    );
    doc.setTextColor(0);
  }

  return doc;
}
