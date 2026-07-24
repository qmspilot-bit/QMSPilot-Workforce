import { NextResponse } from "next/server";
import { resolveNorthstarUser } from "@/lib/northstar-server-auth";

export const runtime = "nodejs";

const SCENARIO_KEY = "customer-recovery-v1";
const RECORD_KEYS = [
  "GP-COMPLAINT-001",
  "GP-NCR-001",
  "GP-CAPA-001",
  "GP-MEAS-001",
  "GP-SUP-001",
  "GP-DEL-001",
  "GP-WRK-001",
  "GP-VALUE-001",
];

const STEP_DEFINITIONS = [
  [1, "scenario-load", "Scenario Setup", "Load the controlled customer-recovery scenario", "Create a repeatable design-partner scenario with one customer complaint, NCR, CAPA, measurement concern, supplier risk, delivery risk, workforce dependency, and financial context.", "All eight scenario records are available with consistent customer, order, product, site, and ownership context.", "Scenario record list and source keys.", "/golden-path", "Demo Facilitator", "system"],
  [2, "intelligence-ingestion", "Detection", "Verify Intelligence Bus ingestion", "Confirm every scenario record becomes a tenant-protected Intelligence Bus event without duplicate or missing records.", "Eight source records produce eight traceable operating events with correct severity, exposure, and source route.", "Event IDs, source keys, severity, and source routes.", "/workforce-operations", "Quality System Owner", "system"],
  [3, "agent-routing", "Detection", "Verify digital workforce routing", "Confirm Pilot, Atlas, Forge, Sentinel, Vector, Beacon, and Ledger are assigned according to the scenario risk and context.", "Assignments are visible, explainable, source-linked, and do not bypass human authority.", "Agent assignment list and routing reasons.", "/workforce-operations", "AI Operations Reviewer", "system"],
  [4, "recommendation-review", "Human Decision", "Review the Pilot recovery recommendation", "Evaluate whether the recommendation is evidence-based, commercially sensible, and clear about customer, quality, delivery, and financial exposure.", "A human can approve, partially approve, or reject the recommendation with a decision note.", "Recommendation, evidence statements, confidence, and human decision note.", "/workforce-operations", "Executive Sponsor", "human"],
  [5, "controlled-actions", "Execution", "Create accountable recovery actions", "Confirm approved recommendations create owned actions with due dates, priority, target tool, target record, and verification requirements.", "No action is created without explicit human approval; every action is traceable to the recommendation and event.", "Approved action list and ownership fields.", "/workforce-operations", "Atlas Reviewer", "human"],
  [6, "native-writeback", "Execution", "Execute native target-tool writeback", "Verify the authorized human sees the exact proposed writeback before execution and that the target application receives a controlled action.", "Executed writeback creates one native target-tool action and a closed-loop audit record.", "Writeback request, authorization, execution note, and target-tool action ID.", "/workforce-operations", "Authorized Process Owner", "human"],
  [7, "target-tool-work", "Execution", "Perform work in the receiving Northstar tool", "Open the assigned target tool, update progress, record blockers, and keep the action connected to Atlas and the source event.", "The target-tool inbox shows the correct action, owner, due date, verification requirement, and current status.", "Target-tool action screenshot or record reference.", "/toolbox", "Action Owner", "system"],
  [8, "evidence-verification", "Verification", "Attach evidence and verify effectiveness", "Confirm evidence remains attached to the correct action and that closure requires a qualified human verification decision.", "Evidence is visible, verification is documented, and the action cannot close without the required human note.", "Evidence names, verification note, validator, and timestamp.", "/workforce-operations", "Qualified Verifier", "human"],
  [9, "atlas-closure-sync", "Verification", "Verify Atlas and event closure synchronization", "Confirm target-tool completion synchronizes to Atlas and closes the originating event only when all required actions are done or rejected.", "Action, Atlas status, audit trail, and event status agree with no orphaned work.", "Action status, event status, and closed-loop audit entries.", "/dashboard", "Atlas Reviewer", "system"],
  [10, "command-center-metrics", "Leadership", "Validate Command Center metrics", "Confirm critical events, exposure, decisions, open actions, blocked work, writebacks, verified value, and ROI reflect the scenario correctly.", "Leadership metrics reconcile to source records and financial exposure is never represented as verified savings.", "Command Center metric reconciliation.", "/", "Executive Reviewer", "reporting"],
  [11, "entity-graph", "Leadership", "Validate Entity Graph context", "Confirm customer, order, product, supplier, instrument, site, owner, NCR, CAPA, and complaint relationships remain source-event traceable.", "Relationships are explainable, evidence-linked, and no unsupported relationship is presented as fact.", "Entity and relationship list with source events.", "/entity-graph", "Data Steward", "system"],
  [12, "tenant-security", "Security", "Validate tenant isolation and role permissions", "Use separate test users or organizations to confirm one company cannot read or modify another company's validation, event, action, evidence, or report data.", "Unauthorized cross-tenant access is denied and human write permissions follow assigned organization roles.", "Access test results and denied-request evidence.", "/golden-path", "Security Reviewer", "security"],
  [13, "customer-report", "Release", "Generate the customer-facing validation report", "Produce a readable report showing what Northstar detected, recommended, routed, executed, verified, and learned during the scenario.", "Report includes pass/fail results, findings, signoffs, release recommendation, and clear operating boundaries.", "Printed or exported validation report.", "/golden-path", "Demo Facilitator", "reporting"],
];

const SIGNOFF_ROLES = [
  "QMSPilot Product Owner",
  "Quality & Compliance Reviewer",
  "Design Partner Sponsor",
];

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function throwOnError(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

async function loadWorkspace(supabase, organizationId) {
  const session = throwOnError(await supabase
    .from("northstar_validation_sessions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("scenario_key", SCENARIO_KEY)
    .maybeSingle());

  if (!session) return { session: null, steps: [], findings: [], signoffs: [], telemetry: emptyTelemetry() };

  const [stepsResult, findingsResult, signoffsResult, eventsResult] = await Promise.all([
    supabase.from("northstar_validation_steps").select("*").eq("session_id", session.id).order("sequence_number"),
    supabase.from("northstar_validation_findings").select("*").eq("session_id", session.id).order("created_at", { ascending: false }),
    supabase.from("northstar_validation_signoffs").select("*").eq("session_id", session.id).order("created_at"),
    supabase.from("northstar_intelligence_events").select("*").eq("organization_id", organizationId).in("source_record_key", RECORD_KEYS).order("created_at"),
  ]);

  const steps = throwOnError(stepsResult) || [];
  const findings = throwOnError(findingsResult) || [];
  const signoffs = throwOnError(signoffsResult) || [];
  const events = throwOnError(eventsResult) || [];
  const eventIds = events.map((event) => event.id);

  let assignments = [];
  let recommendations = [];
  let actions = [];
  let writebacks = [];
  let toolActions = [];
  let evidence = [];
  let audit = [];

  if (eventIds.length) {
    const [assignmentResult, recommendationResult, actionResult, toolActionResult, auditResult] = await Promise.all([
      supabase.from("northstar_agent_assignments").select("*").in("event_id", eventIds).order("assigned_at"),
      supabase.from("northstar_agent_recommendations").select("*").in("event_id", eventIds).order("created_at"),
      supabase.from("northstar_workforce_actions").select("*").in("event_id", eventIds).order("created_at"),
      supabase.from("northstar_tool_actions").select("*").in("source_event_id", eventIds).order("created_at"),
      supabase.from("northstar_closed_loop_audit").select("*").in("event_id", eventIds).order("performed_at"),
    ]);
    assignments = throwOnError(assignmentResult) || [];
    recommendations = throwOnError(recommendationResult) || [];
    actions = throwOnError(actionResult) || [];
    toolActions = throwOnError(toolActionResult) || [];
    audit = throwOnError(auditResult) || [];
  }

  const actionIds = actions.map((action) => action.id);
  if (actionIds.length) {
    const [writebackResult, evidenceResult] = await Promise.all([
      supabase.from("northstar_writeback_requests").select("*").in("action_id", actionIds).order("created_at"),
      supabase.from("northstar_workforce_action_evidence").select("*").in("action_id", actionIds).order("uploaded_at"),
    ]);
    writebacks = throwOnError(writebackResult) || [];
    evidence = throwOnError(evidenceResult) || [];
  }

  const telemetry = buildTelemetry({ events, assignments, recommendations, actions, writebacks, toolActions, evidence, audit, findings, steps, signoffs });
  return { session, steps, findings, signoffs, telemetry, records: { events, assignments, recommendations, actions, writebacks, toolActions, evidence, audit } };
}

function emptyTelemetry() {
  return {
    events: 0, assignments: 0, agents: [], recommendations: 0, approvedRecommendations: 0,
    actions: 0, completedActions: 0, writebacks: 0, executedWritebacks: 0, toolActions: 0,
    evidence: 0, auditEntries: 0, passedSteps: 0, failedSteps: 0, blockedSteps: 0,
    openFindings: 0, criticalFindings: 0, approvedSignoffs: 0, releaseRecommendation: "NOT READY",
    signals: {},
  };
}

function buildTelemetry({ events, assignments, recommendations, actions, writebacks, toolActions, evidence, audit, findings, steps, signoffs }) {
  const agents = [...new Set(assignments.map((assignment) => assignment.agent_code))];
  const passedSteps = steps.filter((step) => step.step_status === "passed").length;
  const failedSteps = steps.filter((step) => step.step_status === "failed").length;
  const blockedSteps = steps.filter((step) => step.step_status === "blocked").length;
  const openFindings = findings.filter((finding) => !["closed", "deferred"].includes(finding.finding_status)).length;
  const criticalFindings = findings.filter((finding) => finding.severity === "critical" && finding.finding_status !== "closed").length;
  const approvedSignoffs = signoffs.filter((signoff) => ["approved", "approved_with_conditions"].includes(signoff.decision)).length;
  const requiredSteps = steps.filter((step) => step.step_status !== "not_applicable");
  const allPassed = requiredSteps.length > 0 && requiredSteps.every((step) => step.step_status === "passed");
  const rejectedSignoff = signoffs.some((signoff) => signoff.decision === "rejected");
  let releaseRecommendation = "NOT READY";
  if (!criticalFindings && !failedSteps && !blockedSteps && allPassed && approvedSignoffs === signoffs.length && !rejectedSignoff) {
    releaseRecommendation = openFindings ? "GO WITH CONDITIONS" : "GO";
  } else if (!criticalFindings && !failedSteps && !blockedSteps && passedSteps >= Math.ceil(requiredSteps.length * 0.8)) {
    releaseRecommendation = "VALIDATION IN PROGRESS";
  }

  return {
    events: events.length,
    assignments: assignments.length,
    agents,
    recommendations: recommendations.length,
    approvedRecommendations: recommendations.filter((item) => ["approved", "partially_approved"].includes(item.recommendation_status)).length,
    actions: actions.length,
    completedActions: actions.filter((item) => item.action_status === "done").length,
    writebacks: writebacks.length,
    executedWritebacks: writebacks.filter((item) => item.writeback_status === "executed").length,
    toolActions: toolActions.length,
    evidence: evidence.length + toolActions.reduce((count, item) => count + (Array.isArray(item.evidence_names) ? item.evidence_names.length : 0), 0),
    auditEntries: audit.length,
    passedSteps,
    failedSteps,
    blockedSteps,
    openFindings,
    criticalFindings,
    approvedSignoffs,
    releaseRecommendation,
    signals: {
      "scenario-load": events.length >= 8,
      "intelligence-ingestion": events.length >= 8,
      "agent-routing": assignments.length >= 12 && ["Pilot", "Atlas", "Forge", "Sentinel", "Vector", "Beacon", "Ledger"].every((agent) => agents.includes(agent)),
      "recommendation-review": recommendations.length > 0,
      "controlled-actions": actions.length > 0,
      "native-writeback": writebacks.some((item) => item.writeback_status === "executed") && toolActions.length > 0,
      "target-tool-work": toolActions.length > 0,
      "evidence-verification": evidence.length > 0 || toolActions.some((item) => (item.evidence_names || []).length > 0),
      "atlas-closure-sync": actions.length > 0 && actions.every((item) => ["done", "rejected"].includes(item.action_status)) && events.some((item) => item.event_status === "closed"),
      "command-center-metrics": events.length > 0,
      "entity-graph": events.length > 0,
      "tenant-security": false,
      "customer-report": passedSteps > 0,
    },
  };
}

async function clearScenario(supabase, organizationId) {
  const eventRows = throwOnError(await supabase
    .from("northstar_intelligence_events")
    .select("id")
    .eq("organization_id", organizationId)
    .in("source_record_key", RECORD_KEYS)) || [];
  if (eventRows.length) {
    throwOnError(await supabase.from("northstar_intelligence_events").delete().in("id", eventRows.map((row) => row.id)));
  }
  throwOnError(await supabase.from("northstar_external_quality_records").delete().eq("organization_id", organizationId).in("source_record_key", ["GP-NCR-001", "GP-CAPA-001"]));
  throwOnError(await supabase.from("northstar_validation_sessions").delete().eq("organization_id", organizationId).eq("scenario_key", SCENARIO_KEY));
}

async function seedScenario(supabase, organizationId, organizationName, user, input = {}) {
  await clearScenario(supabase, organizationId);

  const designPartnerName = String(input.designPartnerName || "North Ridge Cooling Systems").trim().slice(0, 240);
  const site = String(input.site || "East Texas Manufacturing Center").trim().slice(0, 180);
  const facilitatorName = String(input.facilitatorName || user.email || "QMSPilot Facilitator").trim().slice(0, 180);

  const session = throwOnError(await supabase.from("northstar_validation_sessions").insert({
    organization_id: organizationId,
    scenario_key: SCENARIO_KEY,
    scenario_version: "1.0",
    scenario_name: "Closed-Loop Customer Recovery",
    design_partner_name: designPartnerName,
    site,
    facilitator_name: facilitatorName,
    session_status: "in_progress",
    run_number: 1,
    started_at: new Date().toISOString(),
    scenario_payload: {
      customer: designPartnerName,
      site,
      orderNumber: "SO-10482",
      product: "PAC2K36HPVS",
      partNumber: "BRKT-4472",
      instrument: "BG-214",
      supplier: "Precision Alloy Supply",
      complaint: "Customer reports intermittent shaft interference during final installation.",
      operatingBoundary: "Northstar recommends and routes. Qualified humans retain authority for product release, customer commitments, financial validation, and closure.",
      sourceRecordKeys: RECORD_KEYS,
    },
    result_summary: {},
    created_by: user.id,
  }).select("*").single());

  throwOnError(await supabase.from("northstar_validation_steps").insert(STEP_DEFINITIONS.map(([sequence_number, step_key, phase, title, objective, expected_result, evidence_required, linked_route, responsible_role, gate_type]) => ({
    organization_id: organizationId,
    session_id: session.id,
    sequence_number,
    step_key,
    phase,
    title,
    objective,
    expected_result,
    evidence_required,
    linked_route,
    responsible_role,
    gate_type,
  }))));

  throwOnError(await supabase.from("northstar_validation_signoffs").insert(SIGNOFF_ROLES.map((signoff_role) => ({
    organization_id: organizationId,
    session_id: session.id,
    signoff_role,
  }))));

  const externalRecords = [
    {
      organization_id: organizationId,
      source_tool: "ncr",
      source_record_key: "GP-NCR-001",
      title: "Customer complaint confirmed as product nonconformance",
      summary: "Returned assembly shows bore variation outside the approved drawing tolerance. Suspect product requires containment and product-impact review.",
      severity: "critical",
      record_status: "open",
      organization_name: organizationName,
      site,
      department: "Quality",
      customer_name: designPartnerName,
      supplier_name: "Precision Alloy Supply",
      product_name: "PAC2K36HPVS",
      part_number: "BRKT-4472",
      order_number: "SO-10482",
      owner_name: "Quality Manager",
      due_date: isoDate(5),
      financial_exposure: 28200,
      revenue_exposure: 180000,
      payload: { scenarioKey: SCENARIO_KEY, complaint: "CC-GP-001", containment: "Hold suspect product and stop shipment release pending qualified review.", evidence: [{ name: "Customer complaint record", status: "available" }] },
      created_by: user.id,
    },
    {
      organization_id: organizationId,
      source_tool: "capa",
      source_record_key: "GP-CAPA-001",
      title: "Corrective action for bore variation escape",
      summary: "CAPA requires verified root cause, measurement-system review, supplier contribution analysis, effectiveness criteria, and controlled customer recovery.",
      severity: "high",
      record_status: "investigation",
      organization_name: organizationName,
      site,
      department: "Quality Engineering",
      customer_name: designPartnerName,
      supplier_name: "Precision Alloy Supply",
      product_name: "PAC2K36HPVS",
      part_number: "BRKT-4472",
      order_number: "SO-10482",
      owner_name: "Quality Engineer",
      due_date: isoDate(14),
      financial_exposure: 62000,
      revenue_exposure: 180000,
      payload: { scenarioKey: SCENARIO_KEY, linkedNcr: "GP-NCR-001", effectiveness: "Three consecutive conforming lots and verified gage control before closure.", evidence: [{ name: "CAPA action register", status: "available" }] },
      created_by: user.id,
    },
  ];
  throwOnError(await supabase.from("northstar_external_quality_records").insert(externalRecords));

  const directEvents = [
    ["complaint", "GP-COMPLAINT-001", "customer-assurance", "/tools/customer-assurance", "Customer complaint threatens strategic account recovery", "Customer reports shaft interference on installation. Immediate containment, communication, replacement planning, and executive coordination are required.", "critical", 5600, 306000, "Customer Assurance", "Quality Manager", { customer: designPartnerName, orderNumber: "SO-10482", product: "PAC2K36HPVS", partNumber: "BRKT-4472" }],
    ["measurement", "GP-MEAS-001", "measurement-assurance", "/tools/measurement-assurance", "Bore gage BG-214 found outside intermediate verification limit", "Instrument status creates product-impact uncertainty across released and in-process product.", "critical", 62000, 180000, "Measurement Assurance", "Metrology Lead", { asset: "BG-214", product: "PAC2K36HPVS", orderNumber: "SO-10482" }],
    ["supplier", "GP-SUP-001", "supplier-assurance", "/tools/supplier-assurance", "Alternate material lot delayed during customer recovery", "Single-source material dependency may delay replacement production unless an alternate recovery path is authorized.", "high", 14500, 126000, "Supplier Assurance", "Supplier Quality Engineer", { supplier: "Precision Alloy Supply", product: "BRKT-4472", orderNumber: "SO-10482" }],
    ["delivery", "GP-DEL-001", "delivery-assurance", "/tools/delivery-assurance", "Replacement customer order at risk", "Replacement order must be protected while containment, measurement review, and material recovery are completed.", "critical", 9000, 306000, "Delivery Assurance", "Operations Manager", { customer: designPartnerName, orderNumber: "SO-10482-R", product: "PAC2K36HPVS" }],
    ["workforce", "GP-WRK-001", "workforce-readiness", "/tools/workforce-readiness", "Final inspection coverage depends on one qualified employee", "The recovery plan has a single-point qualification dependency for final bore inspection and release recommendation.", "high", 0, 180000, "Workforce Readiness", "Production Manager", { person: "Senior Inspector", product: "PAC2K36HPVS", orderNumber: "SO-10482-R" }],
    ["value", "GP-VALUE-001", "value-ledger", "/tools/value-ledger", "Customer recovery financial baseline established", "Northstar separates actual loss, recovery cost, protected revenue, avoided cost, and verified realized value.", "medium", 21300, 306000, "Value Ledger", "Finance Reviewer", { actualOperationalLoss: 11700, recoveryCost: 9600, revenueProtected: 306000, verifiedRealizedValue: 0 }],
  ];

  const directPayload = directEvents.map(([kind, sourceRecordKey, sourceTool, sourcePath, eventTitle, summary, severity, financialExposure, revenueExposure, department, ownerName, setup]) => ({
    event_key: `golden-path:${organizationId}:${kind}`,
    organization_id: organizationId,
    source_tool: sourceTool,
    source_table: "golden_path_seed",
    source_record_id: crypto.randomUUID(),
    source_record_key: sourceRecordKey,
    source_path: sourcePath,
    event_type: "golden-path-scenario",
    event_title: eventTitle,
    summary,
    severity,
    event_status: "routed",
    organization_name: organizationName,
    site,
    department,
    customer_name: setup.customer || "",
    supplier_name: setup.supplier || "",
    asset_name: setup.asset || "",
    order_number: setup.orderNumber || "",
    owner_name: ownerName,
    due_date: isoDate(severity === "critical" ? 2 : 5),
    financial_exposure: financialExposure,
    revenue_exposure: revenueExposure,
    requires_decision: ["critical", "high"].includes(severity),
    human_authority_required: true,
    source_payload: { scenarioKey: SCENARIO_KEY, setup, evidence: [{ name: `${sourceRecordKey} controlled scenario evidence`, status: "available" }] },
    routing_context: { scenarioKey: SCENARIO_KEY, validationMode: true },
    evidence_refs: [{ name: `${sourceRecordKey} source evidence`, type: "scenario" }],
    created_by: user.id,
    source_submitted_at: new Date().toISOString(),
  }));
  throwOnError(await supabase.from("northstar_intelligence_events").insert(directPayload));

  const events = throwOnError(await supabase.from("northstar_intelligence_events").select("*").eq("organization_id", organizationId).in("source_record_key", RECORD_KEYS)) || [];
  const eventByKey = Object.fromEntries(events.map((event) => [event.source_record_key, event]));
  const routingPlan = {
    "GP-COMPLAINT-001": ["Pilot", "Atlas", "Beacon", "Forge", "Ledger"],
    "GP-NCR-001": ["Atlas", "Forge", "Sentinel", "Vector", "Ledger"],
    "GP-CAPA-001": ["Atlas", "Forge", "Sentinel", "Vector", "Ledger"],
    "GP-MEAS-001": ["Sentinel", "Forge", "Atlas"],
    "GP-SUP-001": ["Pilot", "Atlas", "Forge", "Ledger"],
    "GP-DEL-001": ["Pilot", "Atlas", "Beacon", "Ledger"],
    "GP-WRK-001": ["Atlas", "Sentinel"],
    "GP-VALUE-001": ["Ledger", "Pilot"],
  };
  const roleMap = {
    Pilot: "AI Chief of Staff", Atlas: "Accountability and closure", Forge: "Root cause and technical recovery",
    Sentinel: "Evidence and compliance", Vector: "Systemic prevention", Beacon: "Customer recovery", Ledger: "Financial intelligence",
  };
  const assignments = [];
  for (const [recordKey, agents] of Object.entries(routingPlan)) {
    const event = eventByKey[recordKey];
    if (!event) continue;
    for (const agent of agents) {
      assignments.push({
        organization_id: organizationId,
        event_id: event.id,
        assignment_key: `golden-path:${event.id}:${agent}`,
        agent_code: agent,
        agent_role: roleMap[agent] || "Digital specialist",
        assignment_reason: `Golden Path validation routes ${agent} to ${recordKey} using the shared customer-recovery context. Human authority remains required.`,
        priority: event.severity === "critical" ? "urgent" : event.severity === "high" ? "high" : "normal",
        assignment_status: agent === "Pilot" && recordKey === "GP-COMPLAINT-001" ? "recommendation_ready" : "queued",
        due_at: new Date(Date.now() + (event.severity === "critical" ? 4 : 12) * 60 * 60 * 1000).toISOString(),
        created_by: user.id,
      });
    }
  }
  throwOnError(await supabase.from("northstar_agent_assignments").upsert(assignments, { onConflict: "event_id,agent_code" }));

  const complaintEvent = eventByKey["GP-COMPLAINT-001"];
  const pilotAssignment = complaintEvent ? throwOnError(await supabase.from("northstar_agent_assignments").select("*").eq("event_id", complaintEvent.id).eq("agent_code", "Pilot").single()) : null;
  if (complaintEvent && pilotAssignment) {
    throwOnError(await supabase.from("northstar_agent_recommendations").insert({
      organization_id: organizationId,
      event_id: complaintEvent.id,
      assignment_id: pilotAssignment.id,
      agent_code: "Pilot",
      recommendation_title: "Integrated customer-recovery command plan",
      executive_summary: "Contain suspect product, protect the customer commitment, quarantine the measurement risk, activate supplier recovery, and preserve qualified inspection coverage before any release decision.",
      rationale: "The complaint, NCR, gage concern, material delay, replacement order, workforce dependency, and financial exposure describe one connected operating event. A coordinated recovery plan reduces conflicting actions and preserves human authority.",
      evidence: [
        { statement: "Customer complaint and replacement order are both tied to SO-10482.", source: "GP-COMPLAINT-001 / GP-DEL-001" },
        { statement: "BG-214 requires product-impact review before qualified release.", source: "GP-MEAS-001" },
        { statement: "Alternate material recovery is required to protect the replacement schedule.", source: "GP-SUP-001" },
        { statement: "Revenue exposure is tracked separately from verified realized value.", source: "GP-VALUE-001" },
      ],
      recommended_actions: [
        { title: "Approve customer containment and communication plan", ownerRole: "Quality Manager", dueInDays: 1, priority: "urgent", targetTool: "customer-assurance", targetRecord: "GP-COMPLAINT-001", verification: "Customer communication and containment approval documented by an authorized leader." },
        { title: "Complete BG-214 product-impact review", ownerRole: "Metrology Lead", dueInDays: 2, priority: "urgent", targetTool: "measurement-assurance", targetRecord: "GP-MEAS-001", verification: "Qualified reviewer documents instrument disposition and affected-product decision." },
        { title: "Protect replacement order recovery plan", ownerRole: "Operations Manager", dueInDays: 2, priority: "high", targetTool: "delivery-assurance", targetRecord: "GP-DEL-001", verification: "Replacement readiness, constraint ownership, and release dependency are verified." },
        { title: "Authorize alternate supplier recovery path", ownerRole: "Supplier Quality Engineer", dueInDays: 3, priority: "high", targetTool: "supplier-assurance", targetRecord: "GP-SUP-001", verification: "Approved supplier and material controls are confirmed before use." },
      ],
      confidence: 91,
      risk_level: "critical",
      recommendation_status: "pending_approval",
      model_mode: "rules",
      created_by: user.id,
    }));

    throwOnError(await supabase.from("northstar_executive_briefs").insert({
      organization_id: organizationId,
      brief_type: "on_demand",
      period_start: isoDate(0),
      period_end: isoDate(0),
      title: "Golden Path Customer Recovery Brief",
      executive_summary: "A strategic customer complaint is connected to product nonconformance, measurement uncertainty, supplier delay, replacement delivery risk, workforce dependency, and controlled financial exposure.",
      decisions_required: ["Approve the integrated recovery plan", "Authorize containment and customer communication", "Confirm measurement product-impact authority", "Protect replacement delivery"],
      priorities: ["Contain suspect product", "Complete gage review", "Secure alternate material", "Maintain qualified inspection coverage"],
      watchlist: ["Customer confidence", "Replacement order readiness", "Effectiveness evidence", "Exposure versus verified value"],
      value_summary: { financialExposure: 117300, revenueExposure: 1098000, verifiedRealizedValue: 0 },
      source_event_ids: events.map((event) => event.id),
      confidence: 91,
      model_mode: "rules",
      brief_status: "awaiting_review",
      created_by: user.id,
    }));
  }

  return loadWorkspace(supabase, organizationId);
}

export async function GET(request) {
  try {
    const { supabase, organizationId, organizationName } = await resolveNorthstarUser(request);
    const workspace = await loadWorkspace(supabase, organizationId);
    return NextResponse.json({ organizationName, scenarioKey: SCENARIO_KEY, ...workspace });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Golden Path workspace could not be loaded." }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { supabase, organizationId, organizationName, user } = await resolveNorthstarUser(request, body);
    const action = String(body.action || "seed");

    if (["seed", "reset"].includes(action)) {
      const workspace = await seedScenario(supabase, organizationId, organizationName, user, body);
      return NextResponse.json({ organizationName, scenarioKey: SCENARIO_KEY, reset: action === "reset", ...workspace });
    }

    if (action === "add_finding") {
      const session = throwOnError(await supabase.from("northstar_validation_sessions").select("id").eq("organization_id", organizationId).eq("scenario_key", SCENARIO_KEY).single());
      const count = throwOnError(await supabase.from("northstar_validation_findings").select("id", { count: "exact", head: true }).eq("session_id", session.id));
      const finding = throwOnError(await supabase.from("northstar_validation_findings").insert({
        organization_id: organizationId,
        session_id: session.id,
        step_id: body.stepId || null,
        finding_key: `GP-F-${String((count?.length || 0) + Date.now()).slice(-8)}`,
        severity: body.severity || "medium",
        category: body.category || "functional",
        title: String(body.title || "Validation finding").slice(0, 320),
        description: String(body.description || "").slice(0, 12000),
        affected_route: String(body.affectedRoute || "").slice(0, 300),
        reproduction_steps: String(body.reproductionSteps || "").slice(0, 12000),
        expected_result: String(body.expectedResult || "").slice(0, 8000),
        actual_result: String(body.actualResult || "").slice(0, 8000),
        owner_name: String(body.ownerName || "").slice(0, 180),
        due_date: body.dueDate || null,
        created_by: user.id,
      }).select("*").single());
      return NextResponse.json({ finding, workspace: await loadWorkspace(supabase, organizationId) });
    }

    return NextResponse.json({ error: "Unsupported Golden Path action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Golden Path action failed." }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { supabase, organizationId, user } = await resolveNorthstarUser(request, body);
    const action = String(body.action || "");

    if (action === "update_step") {
      const status = String(body.status || "in_progress");
      throwOnError(await supabase.from("northstar_validation_steps").update({
        step_status: status,
        actual_result: String(body.actualResult || "").slice(0, 12000),
        evidence_refs: Array.isArray(body.evidenceRefs) ? body.evidenceRefs : [],
        validated_by: ["passed", "failed", "blocked", "not_applicable"].includes(status) ? user.id : null,
        validated_at: ["passed", "failed", "blocked", "not_applicable"].includes(status) ? new Date().toISOString() : null,
      }).eq("organization_id", organizationId).eq("id", body.stepId));
    } else if (action === "update_finding") {
      const updates = {
        finding_status: body.status,
        owner_name: String(body.ownerName || "").slice(0, 180),
        due_date: body.dueDate || null,
        resolution_note: String(body.resolutionNote || "").slice(0, 12000),
        closed_by: body.status === "closed" ? user.id : null,
        closed_at: body.status === "closed" ? new Date().toISOString() : null,
      };
      throwOnError(await supabase.from("northstar_validation_findings").update(updates).eq("organization_id", organizationId).eq("id", body.findingId));
    } else if (action === "signoff") {
      const decision = String(body.decision || "pending");
      throwOnError(await supabase.from("northstar_validation_signoffs").update({
        signer_name: String(body.signerName || "").slice(0, 180),
        decision,
        note: String(body.note || "").slice(0, 8000),
        signed_by: decision === "pending" ? null : user.id,
        signed_at: decision === "pending" ? null : new Date().toISOString(),
      }).eq("organization_id", organizationId).eq("id", body.signoffId));
    } else if (action === "complete_session") {
      const workspace = await loadWorkspace(supabase, organizationId);
      const telemetry = workspace.telemetry;
      const status = telemetry.releaseRecommendation === "GO" ? "approved" : telemetry.releaseRecommendation === "NOT READY" ? "blocked" : "validation_complete";
      throwOnError(await supabase.from("northstar_validation_sessions").update({
        session_status: status,
        completed_at: new Date().toISOString(),
        result_summary: telemetry,
        approved_by: status === "approved" ? user.id : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approval_note: String(body.approvalNote || "").slice(0, 8000),
      }).eq("organization_id", organizationId).eq("scenario_key", SCENARIO_KEY));
    } else {
      return NextResponse.json({ error: "Unsupported Golden Path update." }, { status: 400 });
    }

    return NextResponse.json(await loadWorkspace(supabase, organizationId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Golden Path update failed." }, { status: 400 });
  }
}
