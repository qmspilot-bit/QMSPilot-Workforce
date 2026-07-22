"use client";

import {
  Activity, AlertTriangle, ArrowLeft, Bot, BrainCircuit, CheckCircle2, ChevronRight,
  ClipboardCheck, Copy, Database, Download, ExternalLink, FileCheck2, Filter,
  GitBranch, History, Network, Play, Printer, RefreshCw, Route, Send, ShieldCheck,
  Sparkles, UploadCloud, Users, WalletCards, XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const evidenceBucket = "workforce-operations-evidence";
const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
const agents = {
  Pilot: { initials: "PI", role: "AI Chief of Staff", focus: "Executive coordination and prioritization" },
  Atlas: { initials: "AT", role: "Accountability Intelligence", focus: "Owners, due dates, escalation, and closure" },
  Forge: { initials: "FO", role: "Root Cause & Operations", focus: "Technical recovery and corrective-action quality" },
  Sentinel: { initials: "SE", role: "Evidence & Compliance", focus: "Evidence, control sufficiency, and release" },
  Vector: { initials: "VE", role: "Systemic Prevention", focus: "Trends, recurrence, and continuous improvement" },
  Beacon: { initials: "BE", role: "Customer Intelligence", focus: "Communication, recovery, and relationship protection" },
  Ledger: { initials: "LE", role: "Financial Intelligence", focus: "Loss, recovery, savings, revenue, and ROI" },
  Nexus: { initials: "NE", role: "Growth Intelligence", focus: "Commercial risk and opportunity" },
};
const sourceLabels = {
  "customer-assurance": "Customer Assurance",
  "delivery-assurance": "Delivery Assurance",
  "measurement-assurance": "Measurement Assurance",
  "supplier-assurance": "Supplier Assurance",
  "asset-reliability": "Asset Reliability",
  "workforce-readiness": "Workforce Readiness",
  "controlled-change": "Controlled Change",
  "process-assurance": "Process Assurance",
  "daily-operations": "Daily Operations",
  "value-ledger": "Value Ledger",
};

function uid() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function datePlus(days) { const date = new Date(); date.setDate(date.getDate() + Number(days || 0)); return date.toISOString().slice(0, 10); }
function money(value) { return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }
function safeFileName(name) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "evidence"; }
function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase()); }
function agentListFor(sourceTool) {
  const map = {
    "customer-assurance": ["Pilot", "Beacon", "Atlas", "Forge", "Sentinel", "Vector", "Ledger"],
    "delivery-assurance": ["Pilot", "Atlas", "Forge", "Beacon", "Ledger"],
    "measurement-assurance": ["Pilot", "Atlas", "Forge", "Sentinel", "Vector", "Ledger"],
    "supplier-assurance": ["Pilot", "Atlas", "Forge", "Sentinel", "Ledger"],
    "asset-reliability": ["Pilot", "Atlas", "Forge", "Ledger"],
    "workforce-readiness": ["Pilot", "Atlas", "Sentinel", "Vector"],
    "controlled-change": ["Pilot", "Atlas", "Forge", "Sentinel"],
    "process-assurance": ["Pilot", "Atlas", "Forge", "Sentinel", "Vector"],
    "daily-operations": ["Pilot", "Atlas", "Forge", "Ledger"],
    "value-ledger": ["Pilot", "Ledger", "Vector"],
  };
  return map[sourceTool] || ["Pilot", "Atlas"];
}

function makeAssignments(events) {
  return events.flatMap((event) => agentListFor(event.source_tool).map((agent) => ({
    id: `assign-${event.id}-${agent.toLowerCase()}`,
    event_id: event.id,
    assignment_key: `${event.id}:${agent.toLowerCase()}`,
    agent_code: agent,
    agent_role: agents[agent]?.role || "Northstar specialist",
    assignment_reason: `${agents[agent]?.focus || "Specialist review"} based on the ${sourceLabels[event.source_tool] || event.source_tool} event.`,
    priority: event.severity === "critical" ? "urgent" : event.severity === "high" ? "high" : "normal",
    assignment_status: "queued",
    due_at: new Date(Date.now() + (event.severity === "critical" ? 1 : event.severity === "high" ? 3 : 7) * 86400000).toISOString(),
  })));
}

function demoWorkspace() {
  const events = [
    { id: "event-customer", event_key: "customer-demo", source_tool: "customer-assurance", source_record_key: "CC-2026-0047", source_path: "/tools/customer-assurance", event_title: "Critical customer recovery · Alpha Industrial Systems", summary: "Repeat bearing-fit condition delayed customer startup. Containment is active, replacement delivery is at risk, and the final 8D response requires leadership coordination.", severity: "critical", event_status: "routed", site: "Lufkin Operations", financial_exposure: 28200, revenue_exposure: 180000, requires_decision: true, source_submitted_at: new Date().toISOString() },
    { id: "event-delivery", event_key: "delivery-demo", source_tool: "delivery-assurance", source_record_key: "NDA-20260722-DEMO", source_path: "/tools/delivery-assurance", event_title: "Strategic orders at risk", summary: "Two strategic orders totaling $306,000 are exposed by a supplier shaft delay, restricted press capability, and constrained final inspection capacity.", severity: "critical", event_status: "routed", site: "Lufkin Operations", financial_exposure: 5600, revenue_exposure: 306000, requires_decision: true, source_submitted_at: new Date().toISOString() },
    { id: "event-measurement", event_key: "measurement-demo", source_tool: "measurement-assurance", source_record_key: "OOT-2026-0006", source_path: "/tools/measurement-assurance", event_title: "Out-of-tolerance bore-gage review", summary: "A failed master-ring verification quarantined the bore-gage set and opened product-impact review for jobs inspected since the last known acceptable check.", severity: "critical", event_status: "routed", site: "Lufkin Operations", financial_exposure: 62000, revenue_exposure: 180000, requires_decision: true, source_submitted_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "event-supplier", event_key: "supplier-demo", source_tool: "supplier-assurance", source_record_key: "SUP-Apex-004", source_path: "/tools/supplier-assurance", event_title: "Supplier shaft delay and recovery decision", summary: "Replacement shaft delivery missed the recovery cutoff. Alternate sourcing and a protected weekend machining slot require a decision today.", severity: "high", event_status: "routed", site: "Lufkin Operations", financial_exposure: 9800, revenue_exposure: 126000, requires_decision: true, source_submitted_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "event-workforce", event_key: "workforce-demo", source_tool: "workforce-readiness", source_record_key: "NWR-20260722-DEMO", source_path: "/tools/workforce-readiness", event_title: "Final inspection single-point dependency", summary: "One qualified final inspector covers the critical replacement build. Backup qualification is in progress but not yet released.", severity: "high", event_status: "routed", site: "Lufkin Operations", financial_exposure: 12000, revenue_exposure: 180000, requires_decision: true, source_submitted_at: new Date(Date.now() - 10800000).toISOString() },
    { id: "event-value", event_key: "value-demo", source_tool: "value-ledger", source_record_key: "NVL-20260722-DEMO", source_path: "/tools/value-ledger", event_title: "Verified masking improvement value", summary: "$18,375 of monthly realization is financially verified from the blast-and-prime masking improvement. Annual forecast remains $101,250.", severity: "medium", event_status: "approved", site: "Lufkin Operations", financial_exposure: 0, revenue_exposure: 0, requires_decision: false, source_submitted_at: new Date(Date.now() - 14400000).toISOString() },
  ];
  const assignments = makeAssignments(events);
  const pilotAssignment = assignments.find((item) => item.event_id === "event-customer" && item.agent_code === "Pilot");
  const atlasAssignment = assignments.find((item) => item.event_id === "event-customer" && item.agent_code === "Atlas");
  pilotAssignment.assignment_status = "awaiting_human";
  atlasAssignment.assignment_status = "approved";
  const recommendations = [
    { id: "rec-pilot", event_id: "event-customer", assignment_id: pilotAssignment.id, agent_code: "Pilot", recommendation_title: "Approve the integrated customer-recovery command plan", executive_summary: "Protect the customer first, synchronize replacement delivery and measurement containment, and assign one executive sponsor for the cross-functional recovery.", rationale: "The complaint, delivery constraint, measurement OOT, and workforce dependency are linked to the same strategic account and should not be managed as separate departmental issues.", evidence: [{ statement: "Customer startup is delayed and replacement delivery remains exposed.", source: "Customer Assurance · CC-2026-0047" }, { statement: "The affected bore-gage set is quarantined pending product-impact review.", source: "Measurement Assurance · OOT-2026-0006" }], recommended_actions: [{ title: "Authorize the integrated Alpha recovery plan", ownerRole: "Director of Operations", dueInDays: 0, priority: "urgent", targetTool: "daily-operations", targetRecord: "Tier 3 Recovery", verification: "A single recovery owner, replacement completion date, customer communication commitment, and escalation cadence are approved." }], confidence: 91, risk_level: "critical", recommendation_status: "pending_approval", model_mode: "ai" },
    { id: "rec-atlas", event_id: "event-customer", assignment_id: atlasAssignment.id, agent_code: "Atlas", recommendation_title: "Create one controlled recovery action register", executive_summary: "Unify customer, delivery, measurement, supplier, training, and corrective-action commitments under one owned action structure.", rationale: "The same recovery depends on multiple records and owners. A shared action structure prevents departmental completion from being mistaken for customer recovery.", evidence: [{ statement: "Multiple connected records contain separate due dates and owners.", source: "Northstar Intelligence Bus" }], recommended_actions: [{ title: "Issue integrated customer-recovery action register", ownerRole: "Quality Manager", dueInDays: 1, priority: "urgent", targetTool: "customer-assurance", targetRecord: "CC-2026-0047", verification: "Every material action has one owner, due date, objective evidence, linked source record, and authorized closer." }], confidence: 88, risk_level: "critical", recommendation_status: "approved", model_mode: "rules", human_decision_note: "Approved for the design-partner recovery scenario." },
  ];
  const actions = [{ id: "action-atlas", event_id: "event-customer", recommendation_id: "rec-atlas", action_key: "AT-RECOVERY-001", title: "Issue integrated customer-recovery action register", owner_name: "Quality Manager", due_date: datePlus(1), priority: "urgent", action_status: "in_progress", target_tool: "customer-assurance", target_record: "CC-2026-0047", verification_required: "Every action has one owner, due date, linked evidence, and authorized closer.", progress_note: "Cross-functional owners identified; final approval meeting scheduled.", evidence_names: [], approved_at: new Date().toISOString() }];
  const writebacks = [{ id: "writeback-demo", action_id: "action-atlas", target_tool: "customer-assurance", target_record: "CC-2026-0047", writeback_operation: "create_action", writeback_status: "awaiting_human", execution_note: "Approved action is ready to be confirmed in the Customer Assurance record." }];
  const brief = { id: "brief-demo", title: "Pilot Executive Brief · Strategic Customer Recovery", executive_summary: "Three linked critical events require one coordinated leadership response. Protect the Alpha customer recovery, authorize the alternate supplier path, restore trusted measurement capability, and secure qualified final-inspection coverage before the replacement shipment is released.", decisions_required: [{ decision: "Approve the integrated Alpha recovery plan and executive sponsor.", reason: "$180,000 strategic revenue and customer startup are exposed.", ownerRole: "Director of Operations", urgency: "today", eventId: "event-customer" }, { decision: "Authorize alternate shaft sourcing if the supplier misses today's cutoff.", reason: "$126,000 order exposure remains open.", ownerRole: "VP Operations", urgency: "today", eventId: "event-supplier" }], priorities: [{ title: "Complete bore-gage product-impact review", ownerRole: "Quality Manager", due: datePlus(1), impact: "Restores trusted final inspection and defines reinspection scope.", eventId: "event-measurement" }, { title: "Protect qualified final-inspection coverage", ownerRole: "Plant Manager", due: datePlus(1), impact: "Prevents replacement-order delay caused by a single-point dependency.", eventId: "event-workforce" }], watchlist: ["Replacement build completion", "Customer communication commitment", "Supplier shipment cutoff", "Final-inspection evidence"], value_summary: { financialExposure: 117600, revenueExposure: 972000, verifiedValue: 18375, note: "Exposure is not counted as savings. Verified value remains separated in Value Ledger." }, confidence: 92, brief_status: "awaiting_review", model_mode: "ai", created_at: new Date().toISOString() };
  const rules = [
    { id: "rule-pilot", rule_name: "Pilot enterprise coordination", source_tool: "*", minimum_severity: "low", agent_codes: ["Pilot"], assignment_reason: "Pilot receives every connected event for executive prioritization." },
    { id: "rule-customer", rule_name: "Customer recovery team", source_tool: "customer-assurance", minimum_severity: "low", agent_codes: ["Beacon", "Atlas", "Forge", "Sentinel", "Vector", "Ledger"], assignment_reason: "Customer recovery requires relationship, action, cause, evidence, recurrence, and financial intelligence." },
    { id: "rule-delivery", rule_name: "Delivery recovery team", source_tool: "delivery-assurance", minimum_severity: "low", agent_codes: ["Atlas", "Forge", "Beacon", "Ledger"], assignment_reason: "Delivery risk requires ownership, recovery, customer awareness, and value prioritization." },
  ];
  return { events, assignments, recommendations, actions, writebacks, briefs: [brief], rules };
}

export default function AIWorkforceOperationsCenter() {
  const cloud = useCloudWorkspace();
  const actionFiles = useRef(new Map());
  const initial = useMemo(() => demoWorkspace(), []);
  const [events, setEvents] = useState(initial.events);
  const [assignments, setAssignments] = useState(initial.assignments);
  const [recommendations, setRecommendations] = useState(initial.recommendations);
  const [actions, setActions] = useState(initial.actions);
  const [writebacks, setWritebacks] = useState(initial.writebacks);
  const [briefs, setBriefs] = useState(initial.briefs);
  const [rules, setRules] = useState(initial.rules);
  const [mode, setMode] = useState("demo");
  const [selectedEventId, setSelectedEventId] = useState(initial.events[0]?.id || "");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [notice, setNotice] = useState("Design-partner AI workforce scenario loaded.");
  const [busy, setBusy] = useState("");

  const selectedEvent = events.find((item) => item.id === selectedEventId) || events[0];
  const eventAssignments = assignments.filter((item) => item.event_id === selectedEvent?.id);
  const eventRecommendations = recommendations.filter((item) => item.event_id === selectedEvent?.id);
  const filteredEvents = events.filter((event) => (severityFilter === "all" || event.severity === severityFilter) && (sourceFilter === "all" || event.source_tool === sourceFilter)).sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const latestBrief = briefs[0];

  const metrics = useMemo(() => {
    const active = events.filter((item) => !["closed", "dismissed"].includes(item.event_status));
    const critical = active.filter((item) => item.severity === "critical").length;
    const high = active.filter((item) => item.severity === "high").length;
    const queued = assignments.filter((item) => ["queued", "analyzing"].includes(item.assignment_status)).length;
    const pending = recommendations.filter((item) => item.recommendation_status === "pending_approval").length;
    const openActions = actions.filter((item) => !["done", "rejected"].includes(item.action_status)).length;
    const waitingWriteback = writebacks.filter((item) => !["executed", "rejected"].includes(item.writeback_status)).length;
    const financial = active.reduce((sum, item) => sum + Number(item.financial_exposure || 0), 0);
    const revenue = active.reduce((sum, item) => sum + Number(item.revenue_exposure || 0), 0);
    return { active, critical, high, queued, pending, openActions, waitingWriteback, financial, revenue };
  }, [events, assignments, recommendations, actions, writebacks]);

  useEffect(() => {
    if (cloud.status === "ready" && cloud.organizationId) loadSecure(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud.status, cloud.organizationId]);

  async function loadSecure(showNotice = true) {
    if (!cloud.organizationId) { setNotice("Sign in to Northstar Secure to load tenant-protected intelligence events."); return; }
    const supabase = createClient(); if (!supabase) return;
    setBusy("sync");
    try {
      const [eventResult, assignmentResult, recommendationResult, actionResult, writebackResult, briefResult, ruleResult] = await Promise.all([
        supabase.from("northstar_intelligence_events").select("*").eq("organization_id", cloud.organizationId).order("source_submitted_at", { ascending: false }).limit(100),
        supabase.from("northstar_agent_assignments").select("*").eq("organization_id", cloud.organizationId).order("assigned_at", { ascending: false }).limit(500),
        supabase.from("northstar_agent_recommendations").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_workforce_actions").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_writeback_requests").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_executive_briefs").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(30),
        supabase.from("northstar_routing_rules").select("*").or(`organization_id.is.null,organization_id.eq.${cloud.organizationId}`).eq("enabled", true).order("rule_priority", { ascending: false }),
      ]);
      const error = [eventResult, assignmentResult, recommendationResult, actionResult, writebackResult, briefResult, ruleResult].find((result) => result.error)?.error;
      if (error) throw error;
      if (!eventResult.data?.length) { if (showNotice) setNotice("The Intelligence Bus is active. Submit a connected tool record to create the first secure event, or continue with the design-partner demonstration."); return; }
      setEvents(eventResult.data || []); setAssignments(assignmentResult.data || []); setRecommendations(recommendationResult.data || []); setActions(actionResult.data || []); setWritebacks(writebackResult.data || []); setBriefs(briefResult.data || []); setRules(ruleResult.data || []); setMode("secure"); setSelectedEventId(eventResult.data[0].id); if (showNotice) setNotice(`Northstar Secure synchronized ${eventResult.data.length} connected events and ${assignmentResult.data?.length || 0} agent assignments.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Northstar Secure could not synchronize the AI workforce."); }
    finally { setBusy(""); }
  }

  function loadDemo() {
    const demo = demoWorkspace(); setEvents(demo.events); setAssignments(demo.assignments); setRecommendations(demo.recommendations); setActions(demo.actions); setWritebacks(demo.writebacks); setBriefs(demo.briefs); setRules(demo.rules); setMode("demo"); setSelectedEventId(demo.events[0].id); setNotice("Design-partner AI workforce scenario loaded.");
  }

  async function runAgent(assignment) {
    const event = events.find((item) => item.id === assignment.event_id); if (!event) return;
    setBusy(assignment.id); setNotice(`${assignment.agent_code} is analyzing ${event.event_title}.`);
    setAssignments((current) => current.map((item) => item.id === assignment.id ? { ...item, assignment_status: "analyzing" } : item));
    try {
      const response = await fetch("/api/workforce-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "recommendation", agent: assignment.agent_code, event }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "The agent could not complete the analysis.");
      if (mode === "secure" && cloud.organizationId && cloud.user) {
        const supabase = createClient(); if (!supabase) throw new Error("Northstar Secure is unavailable.");
        const existing = recommendations.find((item) => item.assignment_id === assignment.id && ["draft", "pending_approval"].includes(item.recommendation_status));
        const row = { organization_id: cloud.organizationId, event_id: event.id, assignment_id: assignment.id, agent_code: assignment.agent_code, recommendation_title: payload.title, executive_summary: payload.summary, rationale: payload.rationale, evidence: payload.evidence || [], recommended_actions: payload.recommendedActions || [], confidence: payload.confidence, risk_level: payload.riskLevel, recommendation_status: "pending_approval", model_mode: payload.mode === "ai" ? "ai" : "rules", created_by: cloud.user.id, updated_at: new Date().toISOString() };
        if (existing) { const { error } = await supabase.from("northstar_agent_recommendations").update(row).eq("id", existing.id); if (error) throw error; }
        else { const { error } = await supabase.from("northstar_agent_recommendations").insert(row); if (error) throw error; }
        await supabase.from("northstar_agent_assignments").update({ assignment_status: "awaiting_human", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", assignment.id);
        await supabase.from("northstar_intelligence_events").update({ event_status: "awaiting_human", updated_at: new Date().toISOString() }).eq("id", event.id);
        await loadSecure(false);
      } else {
        const existing = recommendations.find((item) => item.assignment_id === assignment.id && ["draft", "pending_approval"].includes(item.recommendation_status));
        const recommendation = { id: existing?.id || uid(), event_id: event.id, assignment_id: assignment.id, agent_code: assignment.agent_code, recommendation_title: payload.title, executive_summary: payload.summary, rationale: payload.rationale, evidence: payload.evidence || [], recommended_actions: payload.recommendedActions || [], confidence: payload.confidence, risk_level: payload.riskLevel, recommendation_status: "pending_approval", model_mode: payload.mode === "ai" ? "ai" : "rules", created_at: new Date().toISOString() };
        setRecommendations((current) => existing ? current.map((item) => item.id === existing.id ? recommendation : item) : [recommendation, ...current]);
        setAssignments((current) => current.map((item) => item.id === assignment.id ? { ...item, assignment_status: "awaiting_human" } : item));
        setEvents((current) => current.map((item) => item.id === event.id ? { ...item, event_status: "awaiting_human" } : item));
      }
      setNotice(`${assignment.agent_code} prepared a ${payload.mode === "ai" ? "model-assisted" : "rules-based"} recommendation for human review.`);
    } catch (error) { setAssignments((current) => current.map((item) => item.id === assignment.id ? { ...item, assignment_status: "queued" } : item)); setNotice(error instanceof Error ? error.message : "Agent analysis failed."); }
    finally { setBusy(""); }
  }

  async function decideRecommendation(recommendation, decision) {
    const note = window.prompt(decision === "approved" ? "Record the human approval rationale:" : "Record why this recommendation is being rejected:", decision === "approved" ? "Reviewed and approved for controlled execution." : "Recommendation rejected or requires revision.");
    if (note === null || !note.trim()) return;
    const assignment = assignments.find((item) => item.id === recommendation.assignment_id);
    setBusy(`decision-${recommendation.id}`);
    try {
      if (mode === "secure" && cloud.organizationId && cloud.user) {
        const supabase = createClient(); if (!supabase) throw new Error("Northstar Secure is unavailable.");
        const { error: recommendationError } = await supabase.from("northstar_agent_recommendations").update({ recommendation_status: decision, human_decision_note: note, decided_by: cloud.user.id, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", recommendation.id); if (recommendationError) throw recommendationError;
        await supabase.from("northstar_agent_assignments").update({ assignment_status: decision === "approved" ? "approved" : "rejected", updated_at: new Date().toISOString() }).eq("id", recommendation.assignment_id);
        if (decision === "approved") {
          const newActions = (recommendation.recommended_actions || []).map((item, index) => ({ organization_id: cloud.organizationId, event_id: recommendation.event_id, recommendation_id: recommendation.id, action_key: `${recommendation.agent_code}-${Date.now().toString(36)}-${index + 1}`.slice(0, 100), title: item.title, owner_name: item.ownerRole, due_date: datePlus(item.dueInDays), priority: item.priority, action_status: "approved", target_tool: item.targetTool || "", target_record: item.targetRecord || "", verification_required: item.verification, approved_by: cloud.user.id, approved_at: new Date().toISOString(), created_by: cloud.user.id }));
          if (newActions.length) {
            const { data: savedActions, error: actionError } = await supabase.from("northstar_workforce_actions").insert(newActions).select("*"); if (actionError) throw actionError;
            const writebackRows = (savedActions || []).filter((item) => item.target_tool).map((item) => ({ organization_id: cloud.organizationId, action_id: item.id, target_tool: item.target_tool, target_record: item.target_record, writeback_operation: "create_action", writeback_payload: { title: item.title, owner: item.owner_name, dueDate: item.due_date, priority: item.priority, verification: item.verification_required, sourceEvent: item.event_id }, writeback_status: "awaiting_human", authorized_by: cloud.user.id, authorized_at: new Date().toISOString(), created_by: cloud.user.id }));
            if (writebackRows.length) { const { error } = await supabase.from("northstar_writeback_requests").insert(writebackRows); if (error) throw error; }
          }
        }
        await loadSecure(false);
      } else {
        setRecommendations((current) => current.map((item) => item.id === recommendation.id ? { ...item, recommendation_status: decision, human_decision_note: note, decided_at: new Date().toISOString() } : item));
        setAssignments((current) => current.map((item) => item.id === recommendation.assignment_id ? { ...item, assignment_status: decision === "approved" ? "approved" : "rejected" } : item));
        if (decision === "approved") {
          const newActions = (recommendation.recommended_actions || []).map((item, index) => ({ id: uid(), event_id: recommendation.event_id, recommendation_id: recommendation.id, action_key: `${recommendation.agent_code}-${Date.now().toString(36)}-${index + 1}`, title: item.title, owner_name: item.ownerRole, due_date: datePlus(item.dueInDays), priority: item.priority, action_status: "approved", target_tool: item.targetTool || "", target_record: item.targetRecord || "", verification_required: item.verification, progress_note: "", evidence_names: [], approved_at: new Date().toISOString() }));
          setActions((current) => [...newActions, ...current]);
          setWritebacks((current) => [...newActions.filter((item) => item.target_tool).map((item) => ({ id: uid(), action_id: item.id, target_tool: item.target_tool, target_record: item.target_record, writeback_operation: "create_action", writeback_status: "awaiting_human", execution_note: "Approved recommendation is ready for controlled target-tool confirmation." })), ...current]);
        }
      }
      setNotice(`${recommendation.agent_code} recommendation ${decision}. ${decision === "approved" ? "Controlled actions and writeback requests were created." : "No controlled records were changed."}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The human decision could not be saved."); }
    finally { setBusy(""); }
  }

  async function generateBrief() {
    if (!events.length) return;
    setBusy("brief"); setNotice("Pilot is assembling the executive brief from connected events, recommendations, actions, and value exposure.");
    try {
      const response = await fetch("/api/workforce-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "brief", events, recommendations, actions }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Pilot could not prepare the executive brief.");
      const brief = { id: uid(), title: payload.title, executive_summary: payload.executiveSummary, decisions_required: payload.decisionsRequired || [], priorities: payload.priorities || [], watchlist: payload.watchlist || [], value_summary: payload.valueSummary || {}, confidence: payload.confidence, model_mode: payload.mode === "ai" ? "ai" : "rules", brief_status: "awaiting_review", created_at: new Date().toISOString() };
      if (mode === "secure" && cloud.organizationId && cloud.user) {
        const supabase = createClient(); if (!supabase) throw new Error("Northstar Secure is unavailable.");
        const { error } = await supabase.from("northstar_executive_briefs").insert({ organization_id: cloud.organizationId, brief_type: "on_demand", period_start: today(), period_end: today(), title: brief.title, executive_summary: brief.executive_summary, decisions_required: brief.decisions_required, priorities: brief.priorities, watchlist: brief.watchlist, value_summary: brief.value_summary, source_event_ids: events.map((item) => item.id), confidence: brief.confidence, model_mode: brief.model_mode, brief_status: "awaiting_review", created_by: cloud.user.id }); if (error) throw error;
        await loadSecure(false);
      } else setBriefs((current) => [brief, ...current]);
      setNotice(`Pilot prepared a ${payload.mode === "ai" ? "model-assisted" : "rules-based"} executive brief. Human review remains required.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Pilot could not generate the executive brief."); }
    finally { setBusy(""); }
  }

  async function approveBrief(brief) {
    const note = window.prompt("Record the executive review note:", "Reviewed and approved for the leadership operating rhythm."); if (note === null || !note.trim()) return;
    if (mode === "secure" && cloud.user) {
      const supabase = createClient(); if (!supabase) return;
      const { error } = await supabase.from("northstar_executive_briefs").update({ brief_status: "approved", reviewed_by: cloud.user.id, reviewed_at: new Date().toISOString(), review_note: note, updated_at: new Date().toISOString() }).eq("id", brief.id); if (error) { setNotice(error.message); return; }
      await loadSecure(false);
    } else setBriefs((current) => current.map((item) => item.id === brief.id ? { ...item, brief_status: "approved", review_note: note, reviewed_at: new Date().toISOString() } : item));
    setNotice("Pilot executive brief approved by a human leader.");
  }

  async function updateAction(action, nextStatus) {
    const note = window.prompt(nextStatus === "done" ? "Document objective closure and effectiveness evidence:" : "Add a progress note:", nextStatus === "done" ? "Verification completed and evidence reviewed." : action.progress_note || "Work is progressing under the approved plan.");
    if (note === null || !note.trim()) return;
    if (nextStatus === "done" && !action.verification_required) { setNotice("Closure is blocked because the action has no defined verification requirement."); return; }
    setBusy(`action-${action.id}`);
    try {
      const files = actionFiles.current.get(action.id) || [];
      if (mode === "secure" && cloud.organizationId && cloud.user) {
        const supabase = createClient(); if (!supabase) throw new Error("Northstar Secure is unavailable.");
        const evidenceNames = [...(action.evidence_names || [])];
        for (const file of files) {
          const evidenceId = uid(); const path = `${cloud.organizationId}/${action.id}/${evidenceId}-${safeFileName(file.name)}`;
          const { error: uploadError } = await supabase.storage.from(evidenceBucket).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false }); if (uploadError) throw uploadError;
          const { error } = await supabase.from("northstar_workforce_action_evidence").insert({ id: evidenceId, organization_id: cloud.organizationId, action_id: action.id, file_name: file.name, storage_path: path, mime_type: file.type || "application/octet-stream", size_bytes: file.size, uploaded_by: cloud.user.id }); if (error) throw error;
          evidenceNames.push(file.name);
        }
        const patch = nextStatus === "done" ? { action_status: "done", closure_note: note, closed_by: cloud.user.id, closed_at: new Date().toISOString(), progress_note: note, evidence_names: evidenceNames, updated_at: new Date().toISOString() } : { action_status: nextStatus, progress_note: note, evidence_names: evidenceNames, updated_at: new Date().toISOString() };
        const { error } = await supabase.from("northstar_workforce_actions").update(patch).eq("id", action.id); if (error) throw error;
        actionFiles.current.delete(action.id); await loadSecure(false);
      } else {
        setActions((current) => current.map((item) => item.id === action.id ? { ...item, action_status: nextStatus, progress_note: note, closure_note: nextStatus === "done" ? note : item.closure_note, closed_at: nextStatus === "done" ? new Date().toISOString() : item.closed_at, evidence_names: [...(item.evidence_names || []), ...files.map((file) => file.name)] } : item)); actionFiles.current.delete(action.id);
      }
      setNotice(nextStatus === "done" ? "Action closed with documented human verification." : `Action moved to ${titleCase(nextStatus)}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The action could not be updated."); }
    finally { setBusy(""); }
  }

  async function executeWriteback(request) {
    const note = window.prompt("Confirm what was written or linked in the target Northstar tool:", `Action confirmed in ${sourceLabels[request.target_tool] || titleCase(request.target_tool)} ${request.target_record || "record"}.`); if (note === null || !note.trim()) return;
    if (mode === "secure" && cloud.user) {
      const supabase = createClient(); if (!supabase) return;
      const { error } = await supabase.from("northstar_writeback_requests").update({ writeback_status: "executed", executed_by: cloud.user.id, executed_at: new Date().toISOString(), execution_note: note, updated_at: new Date().toISOString() }).eq("id", request.id); if (error) { setNotice(error.message); return; }
      await loadSecure(false);
    } else setWritebacks((current) => current.map((item) => item.id === request.id ? { ...item, writeback_status: "executed", execution_note: note, executed_at: new Date().toISOString() } : item));
    setNotice("Controlled writeback was human-confirmed and recorded in the audit trail.");
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify({ schema: "qmspilot.northstar.ai-workforce-operations.v1", exportedAt: new Date().toISOString(), mode, events, assignments, recommendations, actions, writebacks, briefs, rules }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `Northstar_AI_Workforce_Operations_${today()}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function copyBrief() {
    if (!latestBrief) return;
    const decisions = (latestBrief.decisions_required || []).map((item) => `• ${item.decision}`).join("\n");
    await navigator.clipboard.writeText(`${latestBrief.title}\n\n${latestBrief.executive_summary}\n\nDecisions required:\n${decisions}`); setNotice("Pilot executive brief copied.");
  }

  const eventStatus = (event) => event.event_status === "awaiting_human" ? "Awaiting human" : titleCase(event.event_status);

  return <main className="wf-shell">
    <header className="wf-header">
      <a href="/" className="back"><ArrowLeft size={18}/></a>
      <div className="brand-lockup"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div>
      <div className="northstar-lockup"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div>
      <div className="header-meta"><small>NORTHSTAR INTELLIGENCE BUS</small><strong>AI Workforce Operations Center</strong></div>
      <div className={`mode ${mode}`}><span/>{mode === "secure" ? "Secure connected events" : "Design-partner demonstration"}</div>
    </header>

    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><Network size={17}/> EVENT INGESTION · AGENT ROUTING · HUMAN APPROVAL · CONTROLLED WRITEBACK</div><h1>Turn every Northstar submission into coordinated intelligence and controlled action.</h1><p>The Intelligence Bus detects connected tool records, standardizes severity and exposure, routes the right digital specialists, prepares cited recommendations and executive briefings, and keeps every controlled change behind human authority.</p><div className="chips"><span>Operations Center v1.0</span><span>10 connected systems</span><span>8 digital specialists</span><span>Human authority preserved</span></div></div>
      <article className="bus-card"><small>INTELLIGENCE BUS</small><strong>ONLINE</strong><div className="bus-flow"><Database/><ChevronRight/><Route/><ChevronRight/><Bot/><ChevronRight/><ShieldCheck/></div><span>{metrics.active.length} active events · {metrics.queued} assignments queued</span></article>
    </section>

    <section className="toolbar no-print">
      <button onClick={loadDemo}><Sparkles size={17}/>Load full scenario</button>
      <button onClick={()=>loadSecure(true)} disabled={busy === "sync"}><RefreshCw size={17}/>{busy === "sync" ? "Synchronizing..." : "Sync Intelligence Bus"}</button>
      <button className="primary" onClick={generateBrief} disabled={busy === "brief"}><BrainCircuit size={17}/>{busy === "brief" ? "Pilot is briefing..." : "Generate Pilot brief"}</button>
      <button onClick={()=>window.print()}><Printer size={17}/>Executive report</button>
      <button onClick={exportWorkspace}><Download size={17}/>Export workspace</button>
    </section>

    {notice && <div className="notice"><Activity size={18}/>{notice}</div>}

    <section className="metrics">
      <article><small>Critical events</small><strong>{metrics.critical}</strong><span>{metrics.high} additional high priority</span></article>
      <article><small>Agent assignments</small><strong>{assignments.length}</strong><span>{metrics.queued} queued or analyzing</span></article>
      <article><small>Human decisions</small><strong>{metrics.pending}</strong><span>Recommendations awaiting approval</span></article>
      <article><small>Controlled actions</small><strong>{metrics.openActions}</strong><span>{metrics.waitingWriteback} writebacks awaiting confirmation</span></article>
      <article><small>Financial exposure</small><strong>{money(metrics.financial)}</strong><span>Cost and operational exposure</span></article>
      <article><small>Revenue exposure</small><strong>{money(metrics.revenue)}</strong><span>Not counted as savings</span></article>
    </section>

    {latestBrief && <section className="brief-panel">
      <div className="brief-top"><div><small>PILOT EXECUTIVE BRIEF</small><h2>{latestBrief.title}</h2></div><div className="brief-actions no-print"><button onClick={copyBrief}><Copy size={16}/>Copy</button>{latestBrief.brief_status !== "approved" && <button className="approve" onClick={()=>approveBrief(latestBrief)}><CheckCircle2 size={16}/>Approve brief</button>}</div></div>
      <p>{latestBrief.executive_summary}</p>
      <div className="brief-grid"><div><h3>Decisions required</h3>{(latestBrief.decisions_required || []).map((item, index)=><article key={index}><span className={`severity ${item.urgency === "today" ? "critical" : "high"}`}>{titleCase(item.urgency)}</span><strong>{item.decision}</strong><small>{item.ownerRole} · {item.reason}</small></article>)}</div><div><h3>Execution priorities</h3>{(latestBrief.priorities || []).map((item, index)=><article key={index}><span className="severity medium">{item.due}</span><strong>{item.title}</strong><small>{item.ownerRole} · {item.impact}</small></article>)}</div><div><h3>Watchlist</h3>{(latestBrief.watchlist || []).map((item, index)=><article key={index}><AlertTriangle size={16}/><strong>{item}</strong></article>)}</div></div>
      <div className="brief-value"><span><small>Financial exposure</small><strong>{money(latestBrief.value_summary?.financialExposure || latestBrief.value_summary?.financial_exposure)}</strong></span><span><small>Revenue exposure</small><strong>{money(latestBrief.value_summary?.revenueExposure || latestBrief.value_summary?.revenue_exposure)}</strong></span><span><small>Verified value</small><strong>{money(latestBrief.value_summary?.verifiedValue || latestBrief.value_summary?.verified_value)}</strong></span><p>{latestBrief.value_summary?.note}</p></div>
      <footer><span className={`status ${latestBrief.brief_status}`}>{titleCase(latestBrief.brief_status)}</span><span>{latestBrief.model_mode === "ai" ? "Model-assisted with structured sources" : "Rules-based fallback"}</span><span>Confidence {latestBrief.confidence}%</span></footer>
    </section>}

    <section className="workspace-grid">
      <article className="panel event-panel">
        <div className="section-title"><div><small>INTELLIGENCE BUS</small><h2>Connected event stream</h2></div><Network size={25}/></div>
        <div className="filters no-print"><Filter size={16}/><select value={severityFilter} onChange={(e)=>setSeverityFilter(e.target.value)}><option value="all">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select value={sourceFilter} onChange={(e)=>setSourceFilter(e.target.value)}><option value="all">All source tools</option>{Object.entries(sourceLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        <div className="event-list">{filteredEvents.map((event)=><button key={event.id} className={selectedEvent?.id === event.id ? "event active" : "event"} onClick={()=>setSelectedEventId(event.id)}><span className={`severity ${event.severity}`}>{event.severity}</span><span><strong>{event.event_title}</strong><small>{sourceLabels[event.source_tool] || event.source_tool} · {event.source_record_key}</small><em>{event.summary}</em></span><span className="event-state">{eventStatus(event)}</span></button>)}</div>
      </article>

      <article className="panel routing-panel">
        <div className="section-title"><div><small>SELECTED EVENT</small><h2>{selectedEvent?.event_title || "No event selected"}</h2></div>{selectedEvent?.source_path && <a className="source-link no-print" href={selectedEvent.source_path}>Open source <ExternalLink size={15}/></a>}</div>
        {selectedEvent && <><div className="event-summary"><span className={`severity ${selectedEvent.severity}`}>{selectedEvent.severity}</span><p>{selectedEvent.summary}</p><div><span><small>Site</small><strong>{selectedEvent.site || "Not specified"}</strong></span><span><small>Financial</small><strong>{money(selectedEvent.financial_exposure)}</strong></span><span><small>Revenue</small><strong>{money(selectedEvent.revenue_exposure)}</strong></span><span><small>Decision</small><strong>{selectedEvent.requires_decision ? "Required" : "Monitor"}</strong></span></div></div><h3 className="subhead">Agent routing</h3><div className="assignment-list">{eventAssignments.map((assignment)=><div className="assignment" key={assignment.id}><span className="agent-mark">{agents[assignment.agent_code]?.initials || assignment.agent_code.slice(0,2)}</span><span><strong>{assignment.agent_code}</strong><small>{assignment.agent_role}</small><em>{assignment.assignment_reason}</em></span><span className={`status ${assignment.assignment_status}`}>{titleCase(assignment.assignment_status)}</span><button className="run no-print" onClick={()=>runAgent(assignment)} disabled={busy === assignment.id || assignment.assignment_status === "approved"}>{busy === assignment.id ? <RefreshCw size={15}/> : <Play size={15}/>}Analyze</button></div>)}</div></>}
      </article>
    </section>

    <section className="panel workforce-panel">
      <div className="section-title"><div><small>DIGITAL TEAM</small><h2>Agent workload and supervised status</h2><p>Assignments are created by transparent routing rules. Agents prepare recommendations; humans retain decision and closure authority.</p></div><Users size={25}/></div>
      <div className="agent-grid">{Object.entries(agents).map(([name,profile])=>{const assigned=assignments.filter((item)=>item.agent_code===name);const waiting=assigned.filter((item)=>["queued","analyzing","awaiting_human","recommendation_ready"].includes(item.assignment_status)).length;const approved=assigned.filter((item)=>item.assignment_status==="approved").length;return <article key={name}><div><span className="agent-mark large">{profile.initials}</span><span><strong>{name}</strong><small>{profile.role}</small></span></div><p>{profile.focus}</p><footer><span><small>Assigned</small><strong>{assigned.length}</strong></span><span><small>Waiting</small><strong>{waiting}</strong></span><span><small>Approved</small><strong>{approved}</strong></span></footer></article>})}</div>
    </section>

    <section className="panel recommendation-panel">
      <div className="section-title"><div><small>HUMAN APPROVAL GATE</small><h2>Recommendations for the selected event</h2><p>Every recommendation shows its evidence, rationale, actions, confidence, and model mode before a human decision.</p></div><ShieldCheck size={25}/></div>
      {!eventRecommendations.length && <div className="empty"><Bot size={30}/><strong>No recommendations yet.</strong><span>Run one or more assigned agents for the selected event.</span></div>}
      <div className="recommendation-grid">{eventRecommendations.map((recommendation)=><article key={recommendation.id} className="recommendation"><div className="rec-head"><span className="agent-mark">{agents[recommendation.agent_code]?.initials}</span><span><strong>{recommendation.agent_code}</strong><small>{recommendation.model_mode === "ai" ? "Model-assisted" : "Rules-based"} · Confidence {recommendation.confidence}%</small></span><span className={`status ${recommendation.recommendation_status}`}>{titleCase(recommendation.recommendation_status)}</span></div><h3>{recommendation.recommendation_title}</h3><p>{recommendation.executive_summary}</p><details><summary>Evidence and rationale</summary><p>{recommendation.rationale}</p>{(recommendation.evidence || []).map((item,index)=><div className="evidence" key={index}><FileCheck2 size={15}/><span><strong>{item.statement}</strong><small>{item.source}</small></span></div>)}</details><div className="proposed-actions">{(recommendation.recommended_actions || []).map((item,index)=><div key={index}><span className={`priority ${item.priority}`}>{item.priority}</span><span><strong>{item.title}</strong><small>{item.ownerRole} · due in {item.dueInDays} day(s) · {item.targetTool} {item.targetRecord}</small><em>Verify: {item.verification}</em></span></div>)}</div>{recommendation.recommendation_status === "pending_approval" && <footer className="decision-buttons no-print"><button className="reject" onClick={()=>decideRecommendation(recommendation,"rejected")} disabled={busy===`decision-${recommendation.id}`}><XCircle size={16}/>Reject</button><button className="approve" onClick={()=>decideRecommendation(recommendation,"approved")} disabled={busy===`decision-${recommendation.id}`}><CheckCircle2 size={16}/>Approve controlled work</button></footer>}{recommendation.human_decision_note && <div className="decision-note"><strong>Human decision:</strong> {recommendation.human_decision_note}</div>}</article>)}</div>
    </section>

    <section className="panel action-panel">
      <div className="section-title"><div><small>ATLAS UNIFIED ACTION BOARD</small><h2>Approved cross-tool execution</h2><p>Actions originate only from human-approved recommendations and remain open until objective verification and authorized closure are recorded.</p></div><ClipboardCheck size={25}/></div>
      <div className="action-list">{actions.map((action)=><article key={action.id}><div className="action-head"><span className={`priority ${action.priority}`}>{action.priority}</span><span><strong>{action.title}</strong><small>{action.owner_name} · due {action.due_date || "not set"}</small></span><span className={`status ${action.action_status}`}>{titleCase(action.action_status)}</span></div><div className="action-body"><span><small>Target</small><strong>{sourceLabels[action.target_tool] || titleCase(action.target_tool)} · {action.target_record || "new action"}</strong></span><span><small>Verification required</small><strong>{action.verification_required}</strong></span>{action.progress_note && <span><small>Progress / closure</small><strong>{action.progress_note}</strong></span>}{action.evidence_names?.length > 0 && <span><small>Evidence</small><strong>{action.evidence_names.join(", ")}</strong></span>}</div>{!["done","rejected"].includes(action.action_status) && <footer className="action-buttons no-print"><label><UploadCloud size={16}/>Stage evidence<input type="file" multiple onChange={(e)=>{actionFiles.current.set(action.id,Array.from(e.target.files||[]));setNotice(`${e.target.files?.length||0} evidence file(s) staged for ${action.action_key}.`);}}/></label><button onClick={()=>updateAction(action,"in_progress")}><Play size={16}/>In progress</button><button className="approve" onClick={()=>updateAction(action,"done")}><CheckCircle2 size={16}/>Verify and close</button></footer>}</article>)}</div>
    </section>

    <section className="two-panel">
      <article className="panel writeback-panel"><div className="section-title"><div><small>CONTROLLED WRITEBACK</small><h2>Approved target-tool requests</h2></div><GitBranch size={25}/></div><p className="boundary">Northstar creates a governed writeback request after human approval. This release requires a human to confirm the action was created or linked in the target tool; it does not silently alter controlled records.</p><div className="writeback-list">{writebacks.map((request)=><div key={request.id}><span><strong>{sourceLabels[request.target_tool] || titleCase(request.target_tool)}</strong><small>{request.target_record || "New target action"} · {titleCase(request.writeback_operation)}</small></span><span className={`status ${request.writeback_status}`}>{titleCase(request.writeback_status)}</span>{!["executed","rejected"].includes(request.writeback_status) && <button className="no-print" onClick={()=>executeWriteback(request)}><CheckCircle2 size={15}/>Confirm writeback</button>}<p>{request.execution_note}</p></div>)}</div></article>
      <article className="panel rules-panel"><div className="section-title"><div><small>TRANSPARENT ROUTING</small><h2>Why each agent receives work</h2></div><Route size={25}/></div><div className="rule-list">{rules.slice(0,12).map((rule)=><div key={rule.id}><span><strong>{rule.rule_name}</strong><small>{rule.source_tool === "*" ? "All connected systems" : sourceLabels[rule.source_tool] || rule.source_tool} · minimum {rule.minimum_severity}</small></span><div>{(rule.agent_codes || []).map((agent)=><em key={agent}>{agent}</em>)}</div><p>{rule.assignment_reason}</p></div>)}</div></article>
    </section>

    <section className="architecture">
      <div><Database/><strong>Connected tools</strong><span>Structured submissions, metrics, evidence, owners, and exposure</span></div><ChevronRight/><div><Network/><strong>Intelligence Bus</strong><span>Standard event, severity, context, and transparent routing</span></div><ChevronRight/><div><Bot/><strong>Digital specialists</strong><span>Cited recommendations and executive coordination</span></div><ChevronRight/><div><ShieldCheck/><strong>Human authority</strong><span>Approve, execute, verify, close, and confirm writeback</span></div>
    </section>

    <p className="disclaimer">Northstar AI Workforce Operations Center provides supervised decision support. Agent recommendations do not certify compliance, accept product, authorize financial claims, contact customers, change controlled records, or close work without an authorized human decision. Connected tool submissions automatically create Intelligence Bus events after the database migration is active.</p>

    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#10243a;font-family:Inter,Arial,sans-serif}.wf-shell{min-height:100vh}.wf-header{position:sticky;top:0;z-index:40;min-height:74px;display:flex;align-items:center;gap:15px;padding:10px 22px;border-bottom:1px solid #263f59;color:#fff;background:linear-gradient(135deg,#061729,#0b3157)}.back{width:40px;height:40px;display:grid;place-items:center;border:1px solid #355878;border-radius:11px;color:#fff}.brand-lockup,.northstar-lockup{height:44px;padding:7px 10px;border-radius:10px;background:#fff}.brand-lockup img,.northstar-lockup img{height:100%;max-width:160px;object-fit:contain}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#8fc8f4;font-size:10px;letter-spacing:.13em}.header-meta strong{font-size:18px}.mode{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #436680;border-radius:999px;font-size:11px;font-weight:900}.mode span{width:8px;height:8px;border-radius:50%;background:#ffb84d}.mode.secure span{background:#39d899}.hero{display:grid;grid-template-columns:1.45fr .55fr;gap:18px;padding:30px max(24px,calc((100vw - 1500px)/2));color:#fff;background:radial-gradient(circle at 80% 20%,#145ca4 0,#0a3158 28%,#061729 75%)}.hero-copy{padding:18px}.eyebrow{display:flex;align-items:center;gap:8px;color:#8fd1ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:14px 0;font-size:clamp(34px,4vw,62px);line-height:1.02}.hero p{max-width:980px;color:#cce0f1;line-height:1.7}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.chips span{padding:7px 10px;border:1px solid #3f6383;border-radius:999px;color:#cde4f6;font-size:10px;font-weight:850}.bus-card{display:grid;align-content:center;justify-items:center;padding:24px;border:1px solid #386284;border-radius:22px;background:rgba(13,57,96,.78);box-shadow:0 25px 70px rgba(0,0,0,.25)}.bus-card small{color:#91bedd;font-weight:900;letter-spacing:.12em}.bus-card>strong{margin:10px 0;color:#50e4aa;font-size:38px}.bus-flow{display:flex;align-items:center;gap:7px;margin:12px 0;color:#9ed1f6}.bus-card>span{color:#d3e5f3;font-size:11px;font-weight:800}.toolbar{display:flex;gap:9px;flex-wrap:wrap;padding:14px max(24px,calc((100vw - 1500px)/2));border-bottom:1px solid #d7e2ec;background:#fff}.toolbar button,.brief-actions button,.run,.decision-buttons button,.action-buttons button,.action-buttons label,.writeback-list button{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 12px;border:1px solid #ccdae7;border-radius:10px;color:#25445f;background:#fff;font-weight:850;cursor:pointer}.toolbar button.primary,.approve{color:#fff!important;background:#0a66ff!important;border-color:#0a66ff!important}.toolbar button:disabled,.run:disabled{opacity:.55;cursor:not-allowed}.notice{max-width:1500px;margin:16px auto 0;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid #9ac8ef;border-radius:13px;color:#14517f;background:#eff8ff;font-weight:800}.metrics{max-width:1500px;margin:16px auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:0 24px}.metrics article{padding:17px;border:1px solid #dbe6ef;border-radius:17px;background:#fff;box-shadow:0 10px 28px rgba(25,56,82,.07)}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#6b8297;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.metrics strong{margin:7px 0;font-size:27px}.metrics span{color:#658097;font-size:11px;font-weight:750}.panel,.brief-panel{border:1px solid #dbe6ef;border-radius:20px;background:#fff;box-shadow:0 14px 36px rgba(24,55,83,.08)}.brief-panel{max-width:1452px;margin:16px auto;padding:24px;color:#fff;background:linear-gradient(135deg,#071a30,#0d416f)}.brief-top,.section-title{display:flex;align-items:flex-start;gap:14px}.brief-top>div:first-child,.section-title>div{margin-right:auto}.brief-top small,.section-title small{color:#72a8d2;font-size:10px;font-weight:900;letter-spacing:.12em}.brief-top h2,.section-title h2{margin:5px 0 0}.brief-top h2{font-size:28px}.brief-panel>p{max-width:1250px;color:#d0e1ef;line-height:1.7}.brief-actions{display:flex;gap:8px}.brief-actions button{color:#fff;border-color:#476783;background:#102f4f}.brief-grid{display:grid;grid-template-columns:1fr 1fr .8fr;gap:14px;margin-top:18px}.brief-grid>div{padding:15px;border:1px solid #31516d;border-radius:15px;background:rgba(7,28,50,.65)}.brief-grid h3{margin:0 0 10px;color:#8fc7ef;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.brief-grid article{display:grid;gap:5px;padding:10px 0;border-bottom:1px solid #2f4c67}.brief-grid article:last-child{border:0}.brief-grid article strong{font-size:13px}.brief-grid article small{color:#adc8dc;line-height:1.4}.brief-grid article svg{color:#f7b34d}.brief-value{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:15px;padding:14px;border-radius:14px;background:#061a2d}.brief-value span small,.brief-value span strong{display:block}.brief-value span small{color:#789fbd;font-size:9px;text-transform:uppercase}.brief-value span strong{font-size:18px}.brief-value p{margin:0 0 0 auto;color:#9ebbd1;font-size:11px}.brief-panel footer{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;color:#9dbad1;font-size:11px}.workspace-grid,.two-panel{max-width:1500px;margin:16px auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:16px;padding:0 24px}.panel{padding:21px}.section-title{margin-bottom:15px}.section-title p{max-width:900px;margin:6px 0 0;color:#6a8297;font-size:12px;line-height:1.55}.section-title>svg{color:#0a66ff}.filters{display:flex;align-items:center;gap:8px;margin-bottom:12px}.filters select{min-height:36px;padding:0 10px;border:1px solid #d1deea;border-radius:9px;background:#fff}.event-list{display:grid;gap:9px;max-height:610px;overflow:auto}.event{width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:13px;border:1px solid #dce7ef;border-radius:13px;text-align:left;background:#fff;cursor:pointer}.event.active{border-color:#0a66ff;background:#eff7ff;box-shadow:0 0 0 2px rgba(10,102,255,.08)}.event span:nth-child(2) strong,.event span:nth-child(2) small,.event span:nth-child(2) em{display:block}.event span:nth-child(2) small{margin-top:3px;color:#688198;font-size:10px;font-weight:800}.event span:nth-child(2) em{margin-top:7px;color:#526c83;font-size:11px;line-height:1.45;font-style:normal}.event-state{color:#5d7890;font-size:10px;font-weight:900}.severity,.status,.priority{display:inline-flex;width:max-content;padding:5px 7px;border-radius:999px;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.04em}.severity.critical,.priority.urgent{color:#9f1f24;background:#ffe6e7}.severity.high,.priority.high{color:#9b5a00;background:#fff0d7}.severity.medium,.priority.normal{color:#245b8e;background:#e7f3ff}.severity.low,.priority.low{color:#34705b;background:#e7f8f0}.status{color:#4b6479;background:#eaf0f5}.status.approved,.status.done,.status.executed{color:#1c6c4d;background:#e4f8ef}.status.awaiting_human,.status.pending_approval,.status.awaiting_review,.status.awaiting-human{color:#925b00;background:#fff0d5}.status.analyzing,.status.in_progress,.status.in-progress{color:#145d9b;background:#e6f3ff}.status.rejected,.status.blocked{color:#a22328;background:#ffe7e8}.source-link{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #cbdbe8;border-radius:9px;color:#0a5db8;text-decoration:none;font-size:11px;font-weight:900}.event-summary{padding:14px;border-radius:14px;background:#f2f7fb}.event-summary>p{color:#38566e;line-height:1.6}.event-summary>div{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.event-summary>div span{padding:9px;border-radius:10px;background:#fff}.event-summary small,.event-summary strong{display:block}.event-summary small{color:#71899d;font-size:9px;text-transform:uppercase}.event-summary strong{margin-top:3px;font-size:12px}.subhead{margin:18px 0 9px}.assignment-list{display:grid;gap:9px}.assignment{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:12px;border:1px solid #dce7ef;border-radius:13px}.agent-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(135deg,#0d315c,#0a66ff);font-size:11px;font-weight:950}.agent-mark.large{width:44px;height:44px}.assignment span:nth-child(2) strong,.assignment span:nth-child(2) small,.assignment span:nth-child(2) em{display:block}.assignment span:nth-child(2) small{color:#668098;font-size:10px}.assignment span:nth-child(2) em{margin-top:4px;color:#73889b;font-size:10px;font-style:normal}.run{min-height:34px;font-size:10px}.workforce-panel,.recommendation-panel,.action-panel{max-width:1452px;margin:16px auto}.agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:11px}.agent-grid article{padding:15px;border:1px solid #dce7ef;border-radius:15px;background:linear-gradient(155deg,#fff,#f4f9fd)}.agent-grid article>div{display:flex;align-items:center;gap:9px}.agent-grid article>div span:last-child strong,.agent-grid article>div span:last-child small{display:block}.agent-grid article>div span:last-child small{color:#72889a;font-size:10px}.agent-grid article>p{min-height:38px;color:#536e85;font-size:11px;line-height:1.45}.agent-grid footer{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.agent-grid footer span{padding:7px;border-radius:9px;background:#edf4f9}.agent-grid footer small,.agent-grid footer strong{display:block}.agent-grid footer small{color:#7990a2;font-size:8px;text-transform:uppercase}.agent-grid footer strong{margin-top:2px}.empty{display:grid;justify-items:center;gap:7px;padding:35px;color:#72889c}.recommendation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:13px}.recommendation{padding:17px;border:1px solid #dce7ef;border-radius:16px;background:#fff}.rec-head{display:flex;align-items:center;gap:9px}.rec-head span:nth-child(2){margin-right:auto}.rec-head span:nth-child(2) strong,.rec-head span:nth-child(2) small{display:block}.rec-head span:nth-child(2) small{color:#6f879a;font-size:10px}.recommendation h3{margin:14px 0 8px}.recommendation>p{color:#48657d;font-size:12px;line-height:1.6}.recommendation details{padding:10px;border-radius:11px;background:#f2f7fb}.recommendation summary{cursor:pointer;font-size:11px;font-weight:900}.recommendation details>p{color:#4c6880;font-size:11px;line-height:1.5}.evidence{display:flex;gap:8px;margin-top:7px}.evidence svg{color:#0a66ff}.evidence strong,.evidence small{display:block}.evidence strong{font-size:10px}.evidence small{color:#73899b;font-size:9px}.proposed-actions{display:grid;gap:8px;margin-top:12px}.proposed-actions>div{display:flex;gap:8px;padding:10px;border:1px solid #e0e9f0;border-radius:11px}.proposed-actions strong,.proposed-actions small,.proposed-actions em{display:block}.proposed-actions strong{font-size:11px}.proposed-actions small,.proposed-actions em{margin-top:3px;color:#6c8295;font-size:9px;font-style:normal}.decision-buttons,.action-buttons{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.decision-buttons .reject{color:#9f252b;background:#fff1f2;border-color:#f1b9bc}.decision-note{margin-top:10px;padding:9px;border-radius:9px;color:#28664f;background:#eaf8f1;font-size:10px}.action-list{display:grid;gap:11px}.action-list>article{padding:15px;border:1px solid #dce7ef;border-radius:15px}.action-head{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center}.action-head span:nth-child(2) strong,.action-head span:nth-child(2) small{display:block}.action-head span:nth-child(2) small{color:#70879a;font-size:10px}.action-body{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:11px}.action-body span{padding:9px;border-radius:9px;background:#f3f7fa}.action-body small,.action-body strong{display:block}.action-body small{color:#71889b;font-size:8px;text-transform:uppercase}.action-body strong{margin-top:3px;font-size:10px;line-height:1.45}.action-buttons label{position:relative;overflow:hidden}.action-buttons input{position:absolute;inset:0;opacity:0;cursor:pointer}.boundary{padding:11px;border-left:4px solid #0a66ff;color:#526d84;background:#f1f7fc;font-size:11px;line-height:1.5}.writeback-list,.rule-list{display:grid;gap:9px}.writeback-list>div,.rule-list>div{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:11px;border:1px solid #dce7ef;border-radius:12px}.writeback-list strong,.writeback-list small,.rule-list strong,.rule-list small{display:block}.writeback-list small,.rule-list small{color:#70879a;font-size:9px}.writeback-list p,.rule-list p{grid-column:1/-1;margin:2px 0;color:#60788d;font-size:10px;line-height:1.45}.rule-list>div>div{display:flex;gap:4px;flex-wrap:wrap}.rule-list em{padding:4px 6px;border-radius:999px;color:#0d5ca8;background:#e8f3ff;font-size:8px;font-style:normal;font-weight:900}.architecture{max-width:1452px;margin:17px auto;display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:12px;align-items:center;padding:22px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#061729,#0d3f6c)}.architecture>div{display:grid;justify-items:center;text-align:center}.architecture>div svg{margin-bottom:8px;color:#7fc9ff}.architecture>div strong,.architecture>div span{display:block}.architecture>div span{margin-top:5px;color:#a8c7dd;font-size:10px;line-height:1.4}.architecture>svg{color:#527c9e}.disclaimer{max-width:1452px;margin:16px auto 55px;padding:0 5px;color:#647d91;font-size:10px;line-height:1.6}@media(max-width:1000px){.hero,.workspace-grid,.two-panel{grid-template-columns:1fr}.brief-grid{grid-template-columns:1fr}.architecture{grid-template-columns:1fr}.architecture>svg{transform:rotate(90deg);margin:auto}.header-meta{display:none}.event-summary>div{grid-template-columns:1fr 1fr}}@media(max-width:650px){.wf-header{padding:9px}.brand-lockup,.northstar-lockup{height:36px;padding:5px}.mode{display:none}.hero{padding:22px 12px}.toolbar,.metrics,.workspace-grid,.two-panel{padding-left:12px;padding-right:12px}.brief-panel,.workforce-panel,.recommendation-panel,.action-panel,.architecture,.disclaimer{margin-left:12px;margin-right:12px}.assignment{grid-template-columns:auto 1fr}.assignment>.status,.assignment>.run{grid-column:2}.recommendation-grid{grid-template-columns:1fr}.action-body{grid-template-columns:1fr}.action-head{grid-template-columns:auto 1fr}.action-head>.status{grid-column:2}.brief-value p{margin-left:0}.event{grid-template-columns:auto 1fr}.event-state{grid-column:2}}@media print{.no-print,.wf-header,.toolbar{display:none!important}.hero{padding:16px;color:#10243a;background:#fff}.hero p{color:#4f687d}.bus-card{color:#10243a;background:#f1f6fa}.brief-panel{color:#10243a;background:#fff}.brief-panel>p,.brief-grid article small,.brief-value p{color:#4f687d}.brief-grid>div,.brief-value{background:#fff;border-color:#ccd9e4}.panel,.brief-panel{box-shadow:none;break-inside:avoid}.event-list{max-height:none}.workspace-grid,.two-panel{grid-template-columns:1fr}.architecture{color:#10243a;background:#fff;border:1px solid #dbe6ef}}
    `}</style>
  </main>;
}
