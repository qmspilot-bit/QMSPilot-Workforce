"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Flag,
  Gauge,
  History,
  Link2,
  ListChecks,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UploadCloud,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const draftKey = "qmspilot:daily-operations:draft";
const recordsKey = "qmspilot:daily-operations:records";
const evidenceBucket = "daily-operations-evidence";

const categoryMeta = {
  safety: { label: "Safety", icon: ShieldCheck },
  quality: { label: "Quality", icon: BadgeCheck },
  delivery: { label: "Delivery", icon: PackageCheck },
  cost: { label: "Cost", icon: BarChart3 },
  people: { label: "People", icon: Users },
};

const linkOptions = [
  { value: "", label: "No linked tool", href: "" },
  { value: "ncr", label: "NCR", href: "/tools/ncr" },
  { value: "capa", label: "CAPA", href: "https://qmspilot-bit.github.io/QMSPilot-Corrective-Action-CAPA-Northstar/" },
  { value: "process_assurance", label: "Process Assurance", href: "/tools/process-assurance" },
  { value: "workforce_readiness", label: "Workforce Readiness", href: "/tools/workforce-readiness" },
  { value: "asset_reliability", label: "Asset Reliability", href: "/tools/asset-reliability" },
  { value: "controlled_change", label: "Controlled Change", href: "/tools/controlled-change" },
  { value: "supplier_assurance", label: "Supplier Assurance", href: "/tools/supplier-assurance" },
];

function today() { return new Date().toISOString().slice(0, 10); }
function timeNow() { return new Date().toTimeString().slice(0, 5); }
function dateFromToday(days) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function splitList(value) { return String(value || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean); }
function safeFileName(name) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "evidence"; }
function createRecordId() { const date = new Date(); const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`; return `NDO-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
function normalizeHeader(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ""); }

function parseDelimited(text) {
  const rows = [];
  const delimiter = text.includes("\t") ? "\t" : ",";
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim()); if (row.some((value) => value !== "")) rows.push(row); row = []; cell = "";
    } else cell += character;
  }
  row.push(cell.trim()); if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function blankMetric(category = "safety", name = "New measure") {
  return { id: crypto.randomUUID(), category, name, target: 100, actual: 100, unit: "%", direction: "higher", owner: "", note: "" };
}

function defaultMetrics() {
  return [
    { ...blankMetric("safety", "Days without recordable injury"), target: 1, actual: 1, unit: "day", direction: "higher" },
    { ...blankMetric("quality", "First-pass yield"), target: 98, actual: 98, unit: "%", direction: "higher" },
    { ...blankMetric("quality", "Open product holds"), target: 0, actual: 0, unit: "holds", direction: "lower" },
    { ...blankMetric("delivery", "Production plan attainment"), target: 95, actual: 95, unit: "%", direction: "higher" },
    { ...blankMetric("delivery", "Customer orders at risk"), target: 0, actual: 0, unit: "orders", direction: "lower" },
    { ...blankMetric("cost", "Daily COPQ"), target: 2500, actual: 0, unit: "$", direction: "lower" },
    { ...blankMetric("people", "Qualified shift coverage"), target: 100, actual: 100, unit: "%", direction: "higher" },
  ];
}

function metricStatus(metric) {
  const target = Number(metric.target || 0);
  const actual = Number(metric.actual || 0);
  if (metric.direction === "lower") {
    if (actual <= target) return "green";
    if (actual <= target * 1.15 || (target === 0 && actual <= 1)) return "yellow";
    return "red";
  }
  if (actual >= target) return "green";
  if (actual >= target * .95) return "yellow";
  return "red";
}

function blankMeeting() {
  return { id: crypto.randomUUID(), tier: "tier_1", meetingDate: today(), startTime: timeNow(), leader: "", attendeesText: "", department: "", line: "", shift: "Day", status: "planned", notes: "", decisions: "", completedAt: "", history: [] };
}

function blankHandoff() {
  return { id: crypto.randomUUID(), handoffDate: today(), fromShift: "Day", toShift: "Night", outgoingSupervisor: "", incomingSupervisor: "", productionCompleted: "", workInProcess: "", equipmentCondition: "", qualityHolds: "", materialShortages: "", customerPriorities: "", safetyConcerns: "", temporaryChanges: "", openActions: "", acknowledged: false, acknowledgedBy: "", acknowledgedAt: "", evidenceNames: [], history: [] };
}

function blankAction() {
  return { id: crypto.randomUUID(), title: "", category: "delivery", priority: "moderate", owner: "", dueDate: dateFromToday(1), status: "open", escalationTier: "tier_1", department: "", customerOrder: "", financialExposure: 0, source: "Daily operations", linkedTool: "", linkedRecord: "", verification: "", completionAuthority: "", evidenceNames: [], history: [] };
}

function demoData() {
  const metrics = defaultMetrics();
  metrics.find((item) => item.name === "First-pass yield").actual = 96.7;
  metrics.find((item) => item.name === "Production plan attainment").actual = 88;
  metrics.find((item) => item.name === "Customer orders at risk").actual = 2;
  metrics.find((item) => item.name === "Daily COPQ").actual = 6800;
  metrics.find((item) => item.name === "Qualified shift coverage").actual = 92;

  const meeting = { ...blankMeeting(), id: "meeting-demo-1", tier: "tier_2", leader: "Plant Manager", attendeesText: "Operations Manager, Quality Manager, Maintenance Lead, Supply Chain Lead", department: "Plantwide", line: "Daily production review", shift: "All shifts", status: "completed", notes: "Press 2 remains restricted. Supplier replacement shipment due before noon.", decisions: "Run night-shift recovery after maintenance verification. Executive sourcing decision required by 11:00.", completedAt: new Date().toISOString(), history: [] };
  const handoff = { ...blankHandoff(), id: "handoff-demo-1", fromShift: "Night", toShift: "Day", outgoingSupervisor: "Night Supervisor", incomingSupervisor: "Day Supervisor", productionCompleted: "Completed 18 of 22 planned repair operations.", workInProcess: "Four gearboxes staged at final inspection; one order waiting on replacement bearing.", equipmentCondition: "Press 2 restricted after hydraulic pressure fluctuation; work order AR-WO-104 active.", qualityHolds: "One housing lot on hold pending bore verification.", materialShortages: "Replacement bearing shipment due 10:30 from Gulf Coast Bearings.", customerPriorities: "Customer order CO-8842 must ship by 16:00.", safetyConcerns: "No incidents. Maintain restricted access around Press 2.", temporaryChanges: "Use approved alternate press instruction CC-2026-031 until Press 2 release.", openActions: "Maintenance verification, source inspection, production recovery approval.", acknowledged: true, acknowledgedBy: "Day Supervisor", acknowledgedAt: new Date().toISOString(), evidenceNames: ["night_shift_board.jpg"], history: [] };
  const actions = [
    { ...blankAction(), id: "action-demo-1", title: "Complete Press 2 maintenance verification and return-to-service approval", category: "delivery", priority: "critical", owner: "Maintenance Lead", dueDate: today(), status: "in_progress", escalationTier: "tier_2", department: "Maintenance", customerOrder: "CO-8842", financialExposure: 31000, linkedTool: "asset_reliability", linkedRecord: "AR-WO-104", history: [] },
    { ...blankAction(), id: "action-demo-2", title: "Confirm replacement bearing arrival and source inspection", category: "quality", priority: "high", owner: "Supplier Quality Manager", dueDate: today(), status: "open", escalationTier: "tier_2", department: "Supply Chain", customerOrder: "CO-8842", financialExposure: 18000, linkedTool: "supplier_assurance", linkedRecord: "SCAR-2026-0019", history: [] },
    { ...blankAction(), id: "action-demo-3", title: "Approve night-shift recovery staffing plan", category: "people", priority: "high", owner: "Director of Operations", dueDate: today(), status: "open", escalationTier: "tier_3", department: "Operations", customerOrder: "CO-8842", financialExposure: 12000, linkedTool: "workforce_readiness", linkedRecord: "NWR-20260722-DEMO", history: [] },
  ];
  return { metrics, meetings: [meeting], handoffs: [handoff], actions };
}

export default function DailyOperationsApp() {
  const cloud = useCloudWorkspace();
  const handoffFilesRef = useRef(new Map());
  const actionFilesRef = useRef(new Map());
  const [setup, setSetup] = useState({ organization: "QMSPilot Design Partner", site: "", dailyOwner: "", departmentsText: "Operations, Quality, Maintenance, Supply Chain", linesText: "", shiftsText: "Day, Night", tierTimesText: "Tier 1 06:45; Tier 2 08:00; Tier 3 09:00", leadershipIntent: "Create a disciplined daily operating rhythm that exposes risk early, assigns clear ownership, and protects customer commitments." });
  const [metrics, setMetrics] = useState(defaultMetrics());
  const [meetings, setMeetings] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [actions, setActions] = useState([]);
  const [recordId, setRecordId] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meetingModal, setMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState(blankMeeting());
  const [handoffModal, setHandoffModal] = useState(false);
  const [handoffForm, setHandoffForm] = useState(blankHandoff());
  const [actionModal, setActionModal] = useState(false);
  const [actionForm, setActionForm] = useState(blankAction());
  const [historyItem, setHistoryItem] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [actionFilter, setActionFilter] = useState("open");

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.setup) setSetup(draft.setup);
      if (Array.isArray(draft.metrics)) setMetrics(draft.metrics);
      if (Array.isArray(draft.meetings)) setMeetings(draft.meetings);
      if (Array.isArray(draft.handoffs)) setHandoffs(draft.handoffs);
      if (Array.isArray(draft.actions)) setActions(draft.actions);
      if (draft.recordId) setRecordId(draft.recordId);
      setNotice("Saved Daily Operations workspace restored.");
    } catch { window.localStorage.removeItem(draftKey); }
  }, []);

  const operating = useMemo(() => {
    const statusCounts = metrics.reduce((counts, metric) => { counts[metricStatus(metric)] += 1; return counts; }, { green: 0, yellow: 0, red: 0 });
    const metricPoints = metrics.length ? metrics.reduce((sum, metric) => sum + ({ green: 100, yellow: 65, red: 25 }[metricStatus(metric)]), 0) / metrics.length : 100;
    const openActions = actions.filter((action) => action.status !== "closed");
    const overdueActions = openActions.filter((action) => action.dueDate && action.dueDate < today());
    const criticalActions = openActions.filter((action) => action.priority === "critical");
    const customerRisk = openActions.filter((action) => action.customerOrder).length;
    const exposure = openActions.reduce((sum, action) => sum + Number(action.financialExposure || 0), 0);
    const latestHandoff = [...handoffs].sort((a, b) => String(b.handoffDate).localeCompare(String(a.handoffDate)))[0];
    const handoffPenalty = latestHandoff && !latestHandoff.acknowledged ? 8 : 0;
    const health = Math.max(0, Math.round(metricPoints - overdueActions.length * 4 - criticalActions.length * 3 - handoffPenalty));
    const completedMeetings = meetings.filter((meeting) => meeting.status === "completed").length;
    const closureRate = actions.length ? Math.round(actions.filter((action) => action.status === "closed").length / actions.length * 100) : 100;
    return { statusCounts, openActions, overdueActions, criticalActions, customerRisk, exposure, latestHandoff, health, completedMeetings, closureRate };
  }, [metrics, actions, handoffs, meetings]);

  const filteredActions = useMemo(() => actions.filter((action) => actionFilter === "all" || (actionFilter === "open" ? action.status !== "closed" : action.status === actionFilter)), [actions, actionFilter]);

  function updateMetric(id, patch) { setMetrics((current) => current.map((metric) => metric.id === id ? { ...metric, ...patch } : metric)); setSubmitted(false); }
  function addMetric() { setMetrics((current) => [...current, blankMetric()]); }
  function removeMetric(id) { setMetrics((current) => current.filter((metric) => metric.id !== id)); }

  function saveMeeting() {
    if (!meetingForm.leader.trim() || !meetingForm.department.trim()) { setNotice("Meeting leader and department or scope are required."); return; }
    const exists = meetings.some((meeting) => meeting.id === meetingForm.id);
    const saved = { ...meetingForm, completedAt: meetingForm.status === "completed" ? meetingForm.completedAt || new Date().toISOString() : "", history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Meeting update" : "Meeting created", detail: `${meetingForm.tier.replace("_", " ")} meeting saved as ${meetingForm.status}.`, actor: setup.dailyOwner || meetingForm.leader }, ...(meetingForm.history || [])] };
    setMeetings((current) => exists ? current.map((meeting) => meeting.id === saved.id ? saved : meeting) : [saved, ...current]);
    setMeetingModal(false); setSubmitted(false); setNotice("Tier meeting record saved.");
  }

  function saveHandoff() {
    if (!handoffForm.outgoingSupervisor.trim() || !handoffForm.incomingSupervisor.trim()) { setNotice("Outgoing and incoming supervisors are required for a controlled handoff."); return; }
    const exists = handoffs.some((handoff) => handoff.id === handoffForm.id);
    const saved = { ...handoffForm, acknowledgedAt: handoffForm.acknowledged ? handoffForm.acknowledgedAt || new Date().toISOString() : "", history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Handoff update" : "Shift handoff", detail: `${handoffForm.fromShift} to ${handoffForm.toShift} handoff saved.`, actor: handoffForm.outgoingSupervisor }, ...(handoffForm.history || [])] };
    setHandoffs((current) => exists ? current.map((handoff) => handoff.id === saved.id ? saved : handoff) : [saved, ...current]);
    setHandoffModal(false); setSubmitted(false); setNotice("Shift handoff saved with acknowledgment control.");
  }

  function handleHandoffEvidence(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 8 || files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) { setNotice("Handoff evidence allows up to 8 files and 30 MB total."); return; }
    setHandoffForm((current) => ({ ...current, evidenceNames: files.map((file) => file.name) }));
    handoffFilesRef.current.set(handoffForm.id, files);
  }

  function saveAction() {
    if (!actionForm.title.trim() || !actionForm.owner.trim() || !actionForm.dueDate) { setNotice("Action statement, owner, and due date are required."); return; }
    if (actionForm.status === "closed" && (!actionForm.verification.trim() || !actionForm.completionAuthority.trim())) { setNotice("Closing an action requires verification evidence and completion authority."); return; }
    const exists = actions.some((action) => action.id === actionForm.id);
    const saved = { ...actionForm, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Action update" : "Action created", detail: `${actionForm.title} saved as ${actionForm.status}.`, actor: setup.dailyOwner || actionForm.owner }, ...(actionForm.history || [])] };
    setActions((current) => exists ? current.map((action) => action.id === saved.id ? saved : action) : [saved, ...current]);
    setActionModal(false); setSubmitted(false); setNotice("Daily operations action saved.");
  }

  function handleActionEvidence(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 8 || files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) { setNotice("Action evidence allows up to 8 files and 30 MB total."); return; }
    setActionForm((current) => ({ ...current, evidenceNames: files.map((file) => file.name) }));
    actionFilesRef.current.set(actionForm.id, files);
  }

  function deleteAction(action) { if (!window.confirm(`Delete action: ${action.title}?`)) return; setActions((current) => current.filter((item) => item.id !== action.id)); setSubmitted(false); }
  function linkedTool(action) { return linkOptions.find((item) => item.value === action.linkedTool); }

  function loadDemo() {
    const demo = demoData();
    setSetup({ organization: "Northstar Precision Systems", site: "Lufkin Operations", dailyOwner: "Plant Manager", departmentsText: "Operations, Quality, Maintenance, Supply Chain, Shipping", linesText: "Repair Cell, Machine Shop, Final Inspection, Shipping", shiftsText: "Day, Night", tierTimesText: "Tier 1 06:45 and 18:45; Tier 2 08:00; Tier 3 09:00", leadershipIntent: "Recover two customer orders while controlling Press 2, supplier replacement material, quality verification, and qualified night-shift staffing." });
    setMetrics(demo.metrics); setMeetings(demo.meetings); setHandoffs(demo.handoffs); setActions(demo.actions); setRecordId(""); setSubmitted(false); setNotice("Design-partner Daily Operations demonstration loaded.");
  }

  function saveDraft() { window.localStorage.setItem(draftKey, JSON.stringify({ setup, metrics, meetings, handoffs, actions, recordId })); setNotice("Daily Operations workspace saved on this device."); }
  function clearTool() { if ((meetings.length || handoffs.length || actions.length) && !window.confirm("Start a new Daily Operations workspace and clear the current local draft?")) return; setSetup({ organization: "QMSPilot Design Partner", site: "", dailyOwner: "", departmentsText: "Operations, Quality, Maintenance, Supply Chain", linesText: "", shiftsText: "Day, Night", tierTimesText: "Tier 1 06:45; Tier 2 08:00; Tier 3 09:00", leadershipIntent: "Create a disciplined daily operating rhythm that exposes risk early, assigns clear ownership, and protects customer commitments." }); setMetrics(defaultMetrics()); setMeetings([]); setHandoffs([]); setActions([]); setRecordId(""); setSubmitted(false); setNotice("New Daily Operations workspace started."); window.localStorage.removeItem(draftKey); }

  function downloadTemplate() {
    const csv = "category,name,target,actual,unit,direction,owner,note\nsafety,Days without recordable injury,1,1,day,higher,HSE Manager,\nquality,First-pass yield,98,97.5,%,higher,Quality Manager,\ndelivery,Production plan attainment,95,92,%,higher,Operations Manager,\ncost,Daily COPQ,2500,4100,$,lower,Quality Manager,\npeople,Qualified shift coverage,100,96,%,higher,Operations Manager,\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "Northstar_SQDCP_Measures_Template.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  function importMetrics() {
    const rows = parseDelimited(importText);
    if (rows.length < 2) { setNotice("No SQDCP rows were found. Use the Northstar template or paste rows copied from Excel."); return; }
    const headers = rows[0].map(normalizeHeader);
    const aliases = { category:["category","sqdcp"], name:["name","metric","measure"], target:["target"], actual:["actual","result"], unit:["unit"], direction:["direction"], owner:["owner"], note:["note","notes"] };
    const indexFor = (key) => headers.findIndex((header) => aliases[key].includes(header));
    if (["category","name","target","actual"].some((key) => indexFor(key) < 0)) { setNotice("Import requires category, name, target, and actual columns."); return; }
    const imported = rows.slice(1).map((row) => {
      const value = (key, fallback = "") => { const index = indexFor(key); return index >= 0 ? String(row[index] || "").trim() : fallback; };
      const category = Object.keys(categoryMeta).includes(value("category")) ? value("category") : "delivery";
      return { ...blankMetric(category, value("name") || "Imported measure"), target: Number(value("target")) || 0, actual: Number(value("actual")) || 0, unit: value("unit", "%") || "%", direction: value("direction") === "lower" ? "lower" : "higher", owner: value("owner"), note: value("note") };
    }).filter((item) => item.name);
    setMetrics(imported); setImportModal(false); setImportText(""); setSubmitted(false); setNotice(`${imported.length} SQDCP measures imported.`);
  }

  function buildPayload(id) {
    return { schema: "qmspilot.northstar.daily-operations.v1", recordId: id, toolId: "QMSP-DO-001", version: "1.0.0", submittedAt: new Date().toISOString(), setup, metrics: { dailyOperatingHealth: operating.health, redMeasures: operating.statusCounts.red, yellowMeasures: operating.statusCounts.yellow, openActions: operating.openActions.length, overdueActions: operating.overdueActions.length, customerOrdersAtRisk: operating.customerRisk, financialExposure: operating.exposure, shiftHandoffAcknowledged: Boolean(operating.latestHandoff?.acknowledged), actionClosureRate: operating.closureRate }, sqdcp: metrics.map((metric) => ({ ...metric, status: metricStatus(metric) })), meetings, handoffs, actions, governance: { humanDecisionAuthority: true, verificationRequiredForClosure: true, shiftAcknowledgmentControlled: true, source: "Northstar Daily Operations" } };
  }

  async function uploadEvidence(supabase, organizationId, snapshotId, handoffIds, actionIds) {
    let uploaded = 0;
    const groups = [];
    for (const [localId, files] of handoffFilesRef.current.entries()) groups.push({ entityType: "handoff", databaseId: handoffIds.get(localId), files });
    for (const [localId, files] of actionFilesRef.current.entries()) groups.push({ entityType: "action", databaseId: actionIds.get(localId), files });
    for (const group of groups) {
      if (!group.databaseId || !group.files?.length) continue;
      for (const file of group.files) {
        const evidenceId = crypto.randomUUID();
        const storagePath = `${organizationId}/${snapshotId}/${group.entityType}/${group.databaseId}/${evidenceId}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(evidenceBucket).upload(storagePath, file, { contentType: file.type || "application/octet-stream", cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: evidenceError } = await supabase.from("daily_operations_evidence").insert({ id: evidenceId, organization_id: organizationId, snapshot_id: snapshotId, handoff_id: group.entityType === "handoff" ? group.databaseId : null, action_id: group.entityType === "action" ? group.databaseId : null, entity_type: group.entityType, file_name: file.name, storage_path: storagePath, mime_type: file.type || "application/octet-stream", size_bytes: file.size, uploaded_by: cloud.user.id });
        if (evidenceError) throw evidenceError;
        uploaded += 1;
      }
    }
    return uploaded;
  }

  async function submitToNorthstar() {
    if (!setup.organization.trim() || !setup.site.trim() || !setup.dailyOwner.trim()) { setNotice("Complete organization, site, and Daily Operations owner before submission."); return; }
    setSaving(true); const id = recordId || createRecordId(); const payload = buildPayload(id);
    try {
      const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]"); window.localStorage.setItem(recordsKey, JSON.stringify([payload, ...records].slice(0, 50))); window.localStorage.removeItem(draftKey);
      if (cloud.status === "ready" && cloud.organizationId && cloud.user) {
        const supabase = createClient(); if (!supabase) throw new Error("Northstar Secure cloud is unavailable.");
        const { data: snapshot, error: snapshotError } = await supabase.from("daily_operations_snapshots").upsert({ record_id: id, organization_id: cloud.organizationId, created_by: cloud.user.id, organization_name: setup.organization || cloud.organizationName, site: setup.site, operating_date: today(), health_score: operating.health, red_measures: operating.statusCounts.red, open_actions: operating.openActions.length, overdue_actions: operating.overdueActions.length, customer_orders_at_risk: operating.customerRisk, financial_exposure: operating.exposure, payload, submitted_at: payload.submittedAt, updated_at: new Date().toISOString() }, { onConflict: "record_id" }).select("id").single();
        if (snapshotError) throw snapshotError;

        const metricRows = metrics.map((metric) => ({ organization_id: cloud.organizationId, snapshot_id: snapshot.id, metric_key: metric.id, category: metric.category, metric_name: metric.name, target_value: metric.target, actual_value: metric.actual, unit: metric.unit, direction: metric.direction, status: metricStatus(metric), owner_name: metric.owner, note: metric.note, created_by: cloud.user.id, updated_at: new Date().toISOString() }));
        if (metricRows.length) { const { error } = await supabase.from("daily_operations_metrics").upsert(metricRows, { onConflict: "snapshot_id,metric_key" }); if (error) throw error; }

        const meetingRows = meetings.map((meeting) => ({ organization_id: cloud.organizationId, snapshot_id: snapshot.id, meeting_key: meeting.id, tier: meeting.tier, meeting_date: meeting.meetingDate, start_time: meeting.startTime || null, leader_name: meeting.leader, attendees: splitList(meeting.attendeesText), department: meeting.department, line_name: meeting.line, shift_name: meeting.shift, meeting_status: meeting.status, notes: meeting.notes, decisions: meeting.decisions, completed_at: meeting.completedAt || null, history: meeting.history || [], created_by: cloud.user.id, updated_at: new Date().toISOString() }));
        if (meetingRows.length) { const { error } = await supabase.from("daily_operations_meetings").upsert(meetingRows, { onConflict: "snapshot_id,meeting_key" }); if (error) throw error; }

        const handoffRows = handoffs.map((handoff) => ({ organization_id: cloud.organizationId, snapshot_id: snapshot.id, handoff_key: handoff.id, handoff_date: handoff.handoffDate, from_shift: handoff.fromShift, to_shift: handoff.toShift, outgoing_supervisor: handoff.outgoingSupervisor, incoming_supervisor: handoff.incomingSupervisor, production_completed: handoff.productionCompleted, work_in_process: handoff.workInProcess, equipment_condition: handoff.equipmentCondition, quality_holds: handoff.qualityHolds, material_shortages: handoff.materialShortages, customer_priorities: handoff.customerPriorities, safety_concerns: handoff.safetyConcerns, temporary_changes: handoff.temporaryChanges, open_actions: handoff.openActions, acknowledged: handoff.acknowledged, acknowledged_by: handoff.acknowledgedBy, acknowledged_at: handoff.acknowledgedAt || null, evidence_names: handoff.evidenceNames || [], history: handoff.history || [], created_by: cloud.user.id, updated_at: new Date().toISOString() }));
        let savedHandoffs = [];
        if (handoffRows.length) { const { data, error } = await supabase.from("daily_operations_handoffs").upsert(handoffRows, { onConflict: "snapshot_id,handoff_key" }).select("id,handoff_key"); if (error) throw error; savedHandoffs = data || []; }
        const handoffIds = new Map(savedHandoffs.map((handoff) => [handoff.handoff_key, handoff.id]));

        const actionRows = actions.map((action) => ({ organization_id: cloud.organizationId, snapshot_id: snapshot.id, action_key: action.id, action_title: action.title, category: action.category, priority: action.priority, owner_name: action.owner, due_date: action.dueDate || null, action_status: action.status, escalation_tier: action.escalationTier, department: action.department, customer_order: action.customerOrder, financial_exposure: action.financialExposure, source_name: action.source, linked_tool: action.linkedTool, linked_record: action.linkedRecord, verification: action.verification, completion_authority: action.completionAuthority, evidence_names: action.evidenceNames || [], history: action.history || [], created_by: cloud.user.id, updated_at: new Date().toISOString() }));
        let savedActions = [];
        if (actionRows.length) { const { data, error } = await supabase.from("daily_operations_actions").upsert(actionRows, { onConflict: "snapshot_id,action_key" }).select("id,action_key"); if (error) throw error; savedActions = data || []; }
        const actionIds = new Map(savedActions.map((action) => [action.action_key, action.id]));

        const uploaded = await uploadEvidence(supabase, cloud.organizationId, snapshot.id, handoffIds, actionIds);
        handoffFilesRef.current.clear(); actionFilesRef.current.clear();
        setNotice(`${id} submitted to the secure Northstar workspace with ${metrics.length} SQDCP measures, ${meetings.length} meetings, ${handoffs.length} handoffs, ${actions.length} actions, and ${uploaded} evidence file${uploaded === 1 ? "" : "s"}.`);
      } else setNotice(`${id} saved in the Northstar demonstration workspace. Sign in to Secure cloud for tenant-protected persistence.`);
      setRecordId(id); setSubmitted(true);
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : "Daily Operations could not submit to Northstar."); }
    finally { setSaving(false); }
  }

  function exportRecord() { const id = recordId || createRecordId(); if (!recordId) setRecordId(id); const url = URL.createObjectURL(new Blob([JSON.stringify(buildPayload(id), null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${id}-daily-operations.json`; anchor.click(); URL.revokeObjectURL(url); }

  return (
    <main className="do-shell">
      <header className="do-header"><a href="/" className="back" aria-label="Return to Northstar"><ArrowLeft size={18}/></a><div className="brand-lockup"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div><div className="northstar-lockup"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div><div className="header-meta"><small>Northstar-connected operating system</small><strong>Daily Operations</strong></div><div className="header-status"><span/>Human decision authority active</div></header>

      <section className="hero"><div className="hero-copy"><div className="eyebrow"><CalendarClock size={17}/> TIERED DAILY MANAGEMENT · SHIFT HANDOFF · SQDCP · ESCALATION</div><h1>Run the business from one disciplined daily operating rhythm.</h1><p>Connect shift handoffs, SQDCP performance, tier meetings, customer risk, cross-functional actions, and executive decisions without losing ownership between departments.</p><div className="chips"><span>Tool ID QMSP-DO-001</span><span>Version 1.0.0</span><span>Northstar Connected</span><span>Daily Management System</span></div></div><article className="health-card"><small>DAILY OPERATING HEALTH</small><strong>{operating.health}%</strong><span>{operating.health >= 90 ? "Operating to plan" : operating.health >= 75 ? "Recovery actions active" : "Leadership intervention required"}</span><div className="ring" style={{background:`conic-gradient(#0a66ff ${operating.health*3.6}deg,#26384d 0)`}}><div>{operating.health}</div></div></article></section>

      <section className="toolbar no-print"><button onClick={loadDemo}><Sparkles size={17}/>Load design-partner demo</button><button onClick={saveDraft}><Save size={17}/>Save draft</button><button onClick={()=>window.print()}><Printer size={17}/>Executive report</button><button onClick={exportRecord}><Download size={17}/>Export record</button><button onClick={downloadTemplate}><FileDown size={17}/>SQDCP template</button><button onClick={()=>setImportModal(true)}><FileSpreadsheet size={17}/>Import SQDCP</button><button onClick={clearTool}><RotateCcw size={17}/>New day</button><button className="submit" onClick={submitToNorthstar} disabled={saving}><Send size={17}/>{saving?"Submitting...":"Submit to Northstar"}</button></section>
      {notice&&<div className={`notice ${submitted?"submitted":""}`}>{submitted?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>} {notice}</div>}

      <section className="metrics"><article><small>Red measures</small><strong>{operating.statusCounts.red}</strong><span>{operating.statusCounts.yellow} yellow</span></article><article><small>Open actions</small><strong>{operating.openActions.length}</strong><span>{operating.overdueActions.length} overdue</span></article><article><small>Customer orders at risk</small><strong>{operating.customerRisk}</strong><span>Require recovery control</span></article><article><small>Financial exposure</small><strong>${operating.exposure.toLocaleString()}</strong><span>Open action estimate</span></article><article><small>Action closure rate</small><strong>{operating.closureRate}%</strong><span>{operating.completedMeetings} meetings complete</span></article><article><small>Northstar record</small><strong className="record-id">{recordId||"DRAFT"}</strong><span>{submitted?"Submitted":"Not submitted"}</span></article></section>

      <section className="panel"><div className="panel-title"><div><small>01 · OPERATING STRUCTURE</small><h2>Configure the daily management rhythm</h2></div><Target size={24}/></div><div className="form-grid"><label>Organization<input value={setup.organization} onChange={(event)=>setSetup({...setup,organization:event.target.value})}/></label><label>Site / facility<input value={setup.site} onChange={(event)=>setSetup({...setup,site:event.target.value})} placeholder="Required"/></label><label>Daily operations owner<input value={setup.dailyOwner} onChange={(event)=>setSetup({...setup,dailyOwner:event.target.value})} placeholder="Required"/></label><label>Tier meeting times<input value={setup.tierTimesText} onChange={(event)=>setSetup({...setup,tierTimesText:event.target.value})}/></label><label>Departments<textarea value={setup.departmentsText} onChange={(event)=>setSetup({...setup,departmentsText:event.target.value})}/></label><label>Lines / work centers<textarea value={setup.linesText} onChange={(event)=>setSetup({...setup,linesText:event.target.value})}/></label><label>Shifts<textarea value={setup.shiftsText} onChange={(event)=>setSetup({...setup,shiftsText:event.target.value})}/></label><label>Leadership intent<textarea value={setup.leadershipIntent} onChange={(event)=>setSetup({...setup,leadershipIntent:event.target.value})}/></label></div></section>

      <section className="panel"><div className="panel-title"><div><small>02 · SQDCP OPERATING BOARD</small><h2>Safety, quality, delivery, cost, and people</h2><p>Targets and actuals calculate red, yellow, or green status automatically.</p></div><Gauge size={24}/></div><div className="sqdcp-grid">{Object.entries(categoryMeta).map(([category,meta])=>{const Icon=meta.icon;const categoryMetrics=metrics.filter((metric)=>metric.category===category);return <article className="category-card" key={category}><header><Icon size={19}/><strong>{meta.label}</strong><span>{categoryMetrics.filter((metric)=>metricStatus(metric)==="red").length} red</span></header><div>{categoryMetrics.map((metric)=><div className="metric-row" key={metric.id}><span className={`signal ${metricStatus(metric)}`}/><input value={metric.name} onChange={(event)=>updateMetric(metric.id,{name:event.target.value})}/><label>Target<input type="number" value={metric.target} onChange={(event)=>updateMetric(metric.id,{target:Number(event.target.value)})}/></label><label>Actual<input type="number" value={metric.actual} onChange={(event)=>updateMetric(metric.id,{actual:Number(event.target.value)})}/></label><input className="unit" value={metric.unit} onChange={(event)=>updateMetric(metric.id,{unit:event.target.value})}/><button className="icon-button no-print" onClick={()=>removeMetric(metric.id)}><Trash2 size={14}/></button></div>)}</div></article>})}</div><button className="secondary no-print" onClick={addMetric}><Plus size={16}/>Add measure</button></section>

      <section className="two-grid"><article className="panel"><div className="panel-title"><div><small>03 · SHIFT HANDOFF</small><h2>Preserve critical information between shifts</h2></div><ClipboardList size={24}/></div><div className="section-actions no-print"><button className="primary" onClick={()=>{setHandoffForm(blankHandoff());setHandoffModal(true)}}><Plus size={16}/>New handoff</button></div>{handoffs.length?<div className="record-list">{handoffs.map((handoff)=><article key={handoff.id}><span className={handoff.acknowledged?"good":"warn"}>{handoff.acknowledged?<CheckCircle2/>:<AlertTriangle/>}</span><div><strong>{handoff.fromShift} → {handoff.toShift}</strong><small>{handoff.handoffDate} · {handoff.outgoingSupervisor} to {handoff.incomingSupervisor}</small><p>{handoff.workInProcess||handoff.productionCompleted||"No operational summary entered."}</p></div><div className="record-actions no-print"><button onClick={()=>{setHandoffForm(deepClone(handoff));setHandoffModal(true)}}><Pencil size={15}/></button><button onClick={()=>setHistoryItem({title:`${handoff.fromShift} to ${handoff.toShift} handoff`,history:handoff.history})}><History size={15}/></button></div></article>)}</div>:<div className="empty"><ClipboardList size={38}/><h3>No shift handoffs recorded</h3><p>Create the outgoing-to-incoming shift record and require acknowledgment.</p></div>}</article>

      <article className="panel"><div className="panel-title"><div><small>04 · TIER MEETINGS</small><h2>Carry one issue through every leadership level</h2></div><Users size={24}/></div><div className="section-actions no-print"><button className="primary" onClick={()=>{setMeetingForm(blankMeeting());setMeetingModal(true)}}><Plus size={16}/>Create meeting</button></div>{meetings.length?<div className="record-list">{meetings.map((meeting)=><article key={meeting.id}><span className={meeting.status==="completed"?"good":"info"}>{meeting.status==="completed"?<CheckCircle2/>:<CalendarClock/>}</span><div><strong>{meeting.tier.replace("_"," ").toUpperCase()} · {meeting.department}</strong><small>{meeting.meetingDate} {meeting.startTime} · Led by {meeting.leader}</small><p>{meeting.decisions||meeting.notes||"Meeting record ready for review."}</p></div><div className="record-actions no-print"><button onClick={()=>{setMeetingForm(deepClone(meeting));setMeetingModal(true)}}><Pencil size={15}/></button><button onClick={()=>setHistoryItem({title:`${meeting.tier} meeting`,history:meeting.history})}><History size={15}/></button></div></article>)}</div>:<div className="empty"><CalendarClock size={38}/><h3>No tier meetings recorded</h3><p>Configure Tier 1, Tier 2, and Tier 3 daily reviews.</p></div>}</article></section>

      <section className="panel"><div className="panel-title"><div><small>05 · CONTROLLED ACTION & ESCALATION BOARD</small><h2>Ownership, due dates, customer risk, and verification</h2></div><ListChecks size={24}/></div><div className="action-toolbar no-print"><button className="primary" onClick={()=>{setActionForm(blankAction());setActionModal(true)}}><Plus size={16}/>Add action</button><select value={actionFilter} onChange={(event)=>setActionFilter(event.target.value)}><option value="open">Open actions</option><option value="closed">Closed actions</option><option value="all">All actions</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option></select></div>{filteredActions.length?<div className="action-table"><table><thead><tr><th>Priority / action</th><th>Owner / due</th><th>Escalation</th><th>Customer exposure</th><th>Linked system</th><th>Status</th><th className="no-print">Actions</th></tr></thead><tbody>{filteredActions.map((action)=>{const link=linkedTool(action);return <tr key={action.id}><td><b className={`priority ${action.priority}`}>{action.priority}</b><strong>{action.title}</strong><small>{action.department||action.category}</small></td><td><strong>{action.owner}</strong><small className={action.status!=="closed"&&action.dueDate<today()?"overdue":""}>{action.dueDate}</small></td><td><strong>{action.escalationTier.replace("_"," ").toUpperCase()}</strong><small>{action.source}</small></td><td><strong>{action.customerOrder||"—"}</strong><small>${Number(action.financialExposure||0).toLocaleString()}</small></td><td>{link?.href?<a href={link.href} target={link.href.startsWith("http")?"_blank":undefined} rel="noreferrer"><Link2 size={14}/>{link.label}</a>:<span>Not linked</span>}<small>{action.linkedRecord}</small></td><td><b className={`status ${action.status}`}>{action.status.replace("_"," ")}</b></td><td className="record-actions no-print"><button onClick={()=>{setActionForm(deepClone(action));setActionModal(true)}}><Pencil size={15}/></button><button onClick={()=>setHistoryItem({title:action.title,history:action.history})}><History size={15}/></button><button className="danger" onClick={()=>deleteAction(action)}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div>:<div className="empty"><ListChecks size={38}/><h3>No matching actions</h3><p>Create actions directly from shift handoffs, tier meetings, or SQDCP misses.</p></div>}</section>

      <section className="executive-summary"><div><small>PILOT EXECUTIVE INTERPRETATION</small><h2>{operating.statusCounts.red||operating.criticalActions.length?"Protect customer commitments through disciplined recovery execution.":"The operating plan is controlled."}</h2><p>{operating.statusCounts.red||operating.criticalActions.length?`${operating.statusCounts.red} red measures and ${operating.criticalActions.length} critical actions require leadership attention. Current open financial exposure is approximately $${operating.exposure.toLocaleString()}, with ${operating.customerRisk} customer orders connected to active recovery actions.`:"SQDCP performance, shift handoff, meeting completion, and action closure are operating within the current plan."}</p></div><button onClick={submitToNorthstar} disabled={saving}><Send size={18}/>Submit daily operating record</button></section>
      <p className="disclaimer">Northstar Daily Operations supports configurable SQDCP measures, controlled shift handoffs, tiered meetings, cross-functional escalation, customer and financial exposure, evidence, executive reporting, and Secure cloud submission. Humans retain all operational, quality, safety, and customer-release authority.</p>

      {meetingModal&&<div className="modal-backdrop"><div className="modal"><header><div><small>TIERED DAILY MANAGEMENT</small><h2>{meetings.some((item)=>item.id===meetingForm.id)?"Update meeting":"Create meeting"}</h2></div><button onClick={()=>setMeetingModal(false)}><X/></button></header><div className="modal-grid"><label>Tier<select value={meetingForm.tier} onChange={(event)=>setMeetingForm({...meetingForm,tier:event.target.value})}><option value="tier_1">Tier 1 · Frontline</option><option value="tier_2">Tier 2 · Department</option><option value="tier_3">Tier 3 · Plant / Executive</option></select></label><label>Date<input type="date" value={meetingForm.meetingDate} onChange={(event)=>setMeetingForm({...meetingForm,meetingDate:event.target.value})}/></label><label>Start time<input type="time" value={meetingForm.startTime} onChange={(event)=>setMeetingForm({...meetingForm,startTime:event.target.value})}/></label><label>Status<select value={meetingForm.status} onChange={(event)=>setMeetingForm({...meetingForm,status:event.target.value})}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><label>Leader<input value={meetingForm.leader} onChange={(event)=>setMeetingForm({...meetingForm,leader:event.target.value})}/></label><label>Department / scope<input value={meetingForm.department} onChange={(event)=>setMeetingForm({...meetingForm,department:event.target.value})}/></label><label>Line / work center<input value={meetingForm.line} onChange={(event)=>setMeetingForm({...meetingForm,line:event.target.value})}/></label><label>Shift<input value={meetingForm.shift} onChange={(event)=>setMeetingForm({...meetingForm,shift:event.target.value})}/></label><label className="wide">Attendees<textarea value={meetingForm.attendeesText} onChange={(event)=>setMeetingForm({...meetingForm,attendeesText:event.target.value})}/></label><label className="wide">Operating notes<textarea value={meetingForm.notes} onChange={(event)=>setMeetingForm({...meetingForm,notes:event.target.value})}/></label><label className="wide">Decisions and escalations<textarea value={meetingForm.decisions} onChange={(event)=>setMeetingForm({...meetingForm,decisions:event.target.value})}/></label></div><footer><button onClick={()=>setMeetingModal(false)}>Cancel</button><button className="primary" onClick={saveMeeting}><Save size={16}/>Save meeting</button></footer></div></div>}

      {handoffModal&&<div className="modal-backdrop"><div className="modal wide-modal"><header><div><small>CONTROLLED SHIFT HANDOFF</small><h2>{handoffs.some((item)=>item.id===handoffForm.id)?"Update handoff":"Create shift handoff"}</h2></div><button onClick={()=>setHandoffModal(false)}><X/></button></header><div className="modal-grid"><label>Date<input type="date" value={handoffForm.handoffDate} onChange={(event)=>setHandoffForm({...handoffForm,handoffDate:event.target.value})}/></label><label>From shift<input value={handoffForm.fromShift} onChange={(event)=>setHandoffForm({...handoffForm,fromShift:event.target.value})}/></label><label>To shift<input value={handoffForm.toShift} onChange={(event)=>setHandoffForm({...handoffForm,toShift:event.target.value})}/></label><label>Outgoing supervisor<input value={handoffForm.outgoingSupervisor} onChange={(event)=>setHandoffForm({...handoffForm,outgoingSupervisor:event.target.value})}/></label><label>Incoming supervisor<input value={handoffForm.incomingSupervisor} onChange={(event)=>setHandoffForm({...handoffForm,incomingSupervisor:event.target.value})}/></label><label>Production completed<textarea value={handoffForm.productionCompleted} onChange={(event)=>setHandoffForm({...handoffForm,productionCompleted:event.target.value})}/></label><label>Work in process<textarea value={handoffForm.workInProcess} onChange={(event)=>setHandoffForm({...handoffForm,workInProcess:event.target.value})}/></label><label>Equipment condition<textarea value={handoffForm.equipmentCondition} onChange={(event)=>setHandoffForm({...handoffForm,equipmentCondition:event.target.value})}/></label><label>Quality holds<textarea value={handoffForm.qualityHolds} onChange={(event)=>setHandoffForm({...handoffForm,qualityHolds:event.target.value})}/></label><label>Material shortages<textarea value={handoffForm.materialShortages} onChange={(event)=>setHandoffForm({...handoffForm,materialShortages:event.target.value})}/></label><label>Customer priorities<textarea value={handoffForm.customerPriorities} onChange={(event)=>setHandoffForm({...handoffForm,customerPriorities:event.target.value})}/></label><label>Safety concerns<textarea value={handoffForm.safetyConcerns} onChange={(event)=>setHandoffForm({...handoffForm,safetyConcerns:event.target.value})}/></label><label>Temporary changes<textarea value={handoffForm.temporaryChanges} onChange={(event)=>setHandoffForm({...handoffForm,temporaryChanges:event.target.value})}/></label><label>Open actions<textarea value={handoffForm.openActions} onChange={(event)=>setHandoffForm({...handoffForm,openActions:event.target.value})}/></label><label className="wide evidence"><UploadCloud size={20}/><span><strong>Attach handoff evidence</strong><small>{handoffForm.evidenceNames.length?handoffForm.evidenceNames.join(", "):"Photos, schedules, quality holds, work orders, or shift-board evidence"}</small></span><input type="file" multiple onChange={handleHandoffEvidence}/></label><label className="checkbox"><input type="checkbox" checked={handoffForm.acknowledged} onChange={(event)=>setHandoffForm({...handoffForm,acknowledged:event.target.checked})}/>Incoming supervisor acknowledges the handoff</label>{handoffForm.acknowledged&&<label>Acknowledged by<input value={handoffForm.acknowledgedBy} onChange={(event)=>setHandoffForm({...handoffForm,acknowledgedBy:event.target.value})}/></label>}</div><footer><button onClick={()=>setHandoffModal(false)}>Cancel</button><button className="primary" onClick={saveHandoff}><Save size={16}/>Save handoff</button></footer></div></div>}

      {actionModal&&<div className="modal-backdrop"><div className="modal wide-modal"><header><div><small>CONTROLLED ACTION & ESCALATION</small><h2>{actions.some((item)=>item.id===actionForm.id)?"Update action":"Create action"}</h2></div><button onClick={()=>setActionModal(false)}><X/></button></header><div className="modal-grid"><label className="wide">Clear action statement<input value={actionForm.title} onChange={(event)=>setActionForm({...actionForm,title:event.target.value})}/></label><label>Category<select value={actionForm.category} onChange={(event)=>setActionForm({...actionForm,category:event.target.value})}>{Object.entries(categoryMeta).map(([value,meta])=><option key={value} value={value}>{meta.label}</option>)}</select></label><label>Priority<select value={actionForm.priority} onChange={(event)=>setActionForm({...actionForm,priority:event.target.value})}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label><label>Owner<input value={actionForm.owner} onChange={(event)=>setActionForm({...actionForm,owner:event.target.value})}/></label><label>Due date<input type="date" value={actionForm.dueDate} onChange={(event)=>setActionForm({...actionForm,dueDate:event.target.value})}/></label><label>Status<select value={actionForm.status} onChange={(event)=>setActionForm({...actionForm,status:event.target.value})}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="verification">Verification</option><option value="closed">Closed</option></select></label><label>Escalation tier<select value={actionForm.escalationTier} onChange={(event)=>setActionForm({...actionForm,escalationTier:event.target.value})}><option value="tier_1">Tier 1</option><option value="tier_2">Tier 2</option><option value="tier_3">Tier 3</option></select></label><label>Department<input value={actionForm.department} onChange={(event)=>setActionForm({...actionForm,department:event.target.value})}/></label><label>Customer / order at risk<input value={actionForm.customerOrder} onChange={(event)=>setActionForm({...actionForm,customerOrder:event.target.value})}/></label><label>Financial exposure<input type="number" value={actionForm.financialExposure} onChange={(event)=>setActionForm({...actionForm,financialExposure:Number(event.target.value)})}/></label><label>Source meeting / condition<input value={actionForm.source} onChange={(event)=>setActionForm({...actionForm,source:event.target.value})}/></label><label>Linked Northstar tool<select value={actionForm.linkedTool} onChange={(event)=>setActionForm({...actionForm,linkedTool:event.target.value})}>{linkOptions.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Linked record ID<input value={actionForm.linkedRecord} onChange={(event)=>setActionForm({...actionForm,linkedRecord:event.target.value})}/></label><label className="wide">Verification / objective closure evidence<textarea value={actionForm.verification} onChange={(event)=>setActionForm({...actionForm,verification:event.target.value})}/></label><label>Completion authority<input value={actionForm.completionAuthority} onChange={(event)=>setActionForm({...actionForm,completionAuthority:event.target.value})}/></label><label className="wide evidence"><UploadCloud size={20}/><span><strong>Attach action evidence</strong><small>{actionForm.evidenceNames.length?actionForm.evidenceNames.join(", "):"Photos, reports, approvals, schedules, or verification records"}</small></span><input type="file" multiple onChange={handleActionEvidence}/></label></div><footer><button onClick={()=>setActionModal(false)}>Cancel</button><button className="primary" onClick={saveAction}><Save size={16}/>Save action</button></footer></div></div>}

      {importModal&&<div className="modal-backdrop"><div className="modal"><header><div><small>EXCEL / CSV SQDCP IMPORT</small><h2>Load the customer’s operating measures</h2></div><button onClick={()=>setImportModal(false)}><X/></button></header><div className="import-controls"><label className="dropzone"><FileSpreadsheet size={28}/><strong>Choose CSV file</strong><small>Excel: Save As → CSV UTF-8</small><input type="file" accept=".csv,.txt,text/csv" onChange={(event)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setImportText(String(reader.result||""));reader.readAsText(file)}}/></label><textarea value={importText} onChange={(event)=>setImportText(event.target.value)} placeholder="category,name,target,actual,unit,direction,owner,note"/></div><footer><button onClick={downloadTemplate}><FileDown size={16}/>Download template</button><button onClick={()=>setImportModal(false)}>Cancel</button><button className="primary" onClick={importMetrics}><Upload size={16}/>Import measures</button></footer></div></div>}

      {historyItem&&<div className="modal-backdrop"><div className="modal"><header><div><small>CONTROLLED HISTORY</small><h2>{historyItem.title}</h2></div><button onClick={()=>setHistoryItem(null)}><X/></button></header><div className="history-list">{historyItem.history?.length?historyItem.history.map((event)=><article key={event.id}><span><History size={16}/></span><div><strong>{event.type}</strong><p>{event.detail}</p><small>{new Date(event.date).toLocaleString()} · {event.actor}</small></div></article>):<div className="empty"><History size={36}/><h3>No history recorded yet</h3></div>}</div><footer><button className="primary" onClick={()=>setHistoryItem(null)}>Done</button></footer></div></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#12253a;font-family:Inter,Arial,sans-serif}.do-shell{min-height:100vh;padding-bottom:70px}.do-header{min-height:74px;display:flex;align-items:center;gap:14px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#061729,#0b3158);border-bottom:1px solid #24547d}.back{width:38px;height:38px;display:grid;place-items:center;border:1px solid #365c7d;border-radius:11px;color:#fff}.brand-lockup{width:172px;padding:8px 10px;border-radius:12px;background:#fff}.brand-lockup img,.northstar-lockup img{display:block;width:100%;height:auto}.northstar-lockup{width:220px;padding:4px 8px;border:1px solid #314d67;border-radius:10px;background:#050b12}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#8fb5d6;text-transform:uppercase;letter-spacing:.1em}.header-status{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #2b6d5a;border-radius:999px;color:#c9f3e5;background:#0d3a31;font-size:11px;font-weight:800}.header-status span{width:8px;height:8px;border-radius:50%;background:#45d39d}.hero{max-width:1540px;margin:0 auto;display:grid;grid-template-columns:1.45fr .55fr;gap:18px;padding:28px 24px}.hero-copy{padding:32px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{display:flex;align-items:center;gap:8px;color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:14px 0 12px;font-size:clamp(34px,4vw,62px);line-height:1.02}.hero p{max-width:900px;color:#d4e7f7;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:7px 10px;border:1px solid #5f9fd3;border-radius:999px;color:#d9ecfb;font-size:10px;font-weight:800}.health-card{display:grid;place-items:center;padding:24px;border:1px solid #dce6ef;border-radius:24px;background:#fff;box-shadow:0 16px 38px rgba(24,55,83,.1);text-align:center}.health-card>small{color:#71869a;font-weight:900;letter-spacing:.12em}.health-card>strong{font-size:52px}.health-card>span{color:#16835a;font-weight:800}.ring{width:150px;height:150px;display:grid;place-items:center;margin-top:12px;border-radius:50%}.ring div{width:112px;height:112px;display:grid;place-items:center;border-radius:50%;background:#fff;font-size:34px;font-weight:900}.toolbar{max-width:1540px;margin:0 auto;padding:0 24px;display:flex;gap:9px;flex-wrap:wrap}.toolbar button,.section-actions button,.secondary,.modal button,.executive-summary button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid #cddbe7;border-radius:11px;color:#21405d;background:#fff;font-weight:850;cursor:pointer}.toolbar button.submit,.primary,.executive-summary button{border-color:#0a66ff!important;color:#fff!important;background:linear-gradient(135deg,#0d315c,#0a66ff)!important}.toolbar button.submit{margin-left:auto}button:disabled{opacity:.55;cursor:not-allowed}.notice{max-width:1492px;margin:14px auto 0;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid #e7c66c;border-radius:12px;color:#765408;background:#fff9e8;font-weight:800}.notice.submitted{border-color:#8fd0b3;color:#155f45;background:#effbf6}.metrics{max-width:1540px;margin:18px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.metrics article{padding:17px;border:1px solid #dce6ef;border-radius:17px;background:#fff}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70859a;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.metrics strong{margin-top:6px;font-size:28px}.metrics span{margin-top:3px;color:#16835a;font-size:11px;font-weight:800}.record-id{font-size:16px!important}.panel{max-width:1492px;margin:18px auto 0;padding:22px;border:1px solid #dce6ef;border-radius:20px;background:#fff;box-shadow:0 12px 32px rgba(24,55,83,.07)}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:1px solid #e2eaf1}.panel-title small{color:#71869a;font-weight:900;letter-spacing:.1em}.panel-title h2{margin:5px 0 0}.panel-title p{margin:6px 0 0;color:#6d8194;font-size:12px}.form-grid,.modal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:18px}.form-grid label,.modal-grid label{display:grid;gap:6px;color:#526a80;font-size:11px;font-weight:850}.form-grid input,.form-grid select,.form-grid textarea,.modal-grid input,.modal-grid select,.modal-grid textarea,.action-toolbar select{width:100%;min-height:42px;padding:10px;border:1px solid #cad9e6;border-radius:10px;color:#12253a;background:#fbfdff;font:inherit}.form-grid textarea,.modal-grid textarea{min-height:82px;resize:vertical}.wide{grid-column:1/-1}.sqdcp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:12px;margin-top:16px}.category-card{border:1px solid #dce6ef;border-radius:16px;overflow:hidden;background:#fbfdff}.category-card>header{display:flex;align-items:center;gap:8px;padding:12px 14px;color:#fff;background:linear-gradient(135deg,#0d315c,#1761a6)}.category-card>header strong{margin-right:auto}.category-card>header span{font-size:10px}.metric-row{display:grid;grid-template-columns:auto 1fr 72px 72px 50px auto;gap:6px;align-items:end;padding:10px;border-bottom:1px solid #e3ebf2}.metric-row>input{min-width:0;height:36px;padding:7px;border:1px solid #ccdbe7;border-radius:8px}.metric-row label{font-size:8px;color:#6b8194}.metric-row label input{width:100%;height:30px;margin-top:3px;padding:5px;border:1px solid #ccdbe7;border-radius:7px}.signal{width:12px;height:12px;margin-bottom:12px;border-radius:50%}.green{background:#16835a}.yellow{background:#c38a20}.red{background:#b43b4d}.unit{width:50px}.icon-button,.record-actions button{width:34px;height:34px;display:grid!important;place-items:center;padding:0!important;border:1px solid #d5e0e9!important;border-radius:9px!important;background:#fff!important;color:#33516d!important}.secondary{margin-top:14px}.two-grid{max-width:1492px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:18px}.two-grid .panel{margin-top:18px}.section-actions,.action-toolbar{display:flex;gap:9px;margin-top:14px}.action-toolbar select{max-width:180px}.record-list{display:grid;margin-top:12px}.record-list>article{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #e1e9f0}.record-list>article>span{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;color:#fff}.record-list>article>div:nth-child(2){flex:1}.record-list strong,.record-list small{display:block}.record-list small{margin-top:3px;color:#71869a}.record-list p{margin:7px 0 0;color:#4e667c;font-size:12px;line-height:1.5}.info{background:#347bac}.record-actions{display:flex;gap:5px}.record-actions button.danger,.danger{color:#aa3445!important}.empty{padding:42px;text-align:center;color:#6c8296}.action-table{overflow:auto;margin-top:14px;border:1px solid #dce6ef;border-radius:14px}.action-table table{width:100%;min-width:1180px;border-collapse:collapse}.action-table th,.action-table td{padding:12px;border-bottom:1px solid #e1e9f0;text-align:left;vertical-align:middle}.action-table th{background:#f2f7fb;color:#526a80;font-size:10px;text-transform:uppercase}.action-table td strong,.action-table td small{display:block}.action-table td small{margin-top:4px;color:#71869a}.action-table td a{display:flex;align-items:center;gap:5px;color:#0a66ff;text-decoration:none;font-weight:800}.priority,.status{display:inline-flex;margin-bottom:6px;padding:5px 8px;border-radius:999px;text-transform:capitalize;font-size:9px}.priority.low{color:#506a7e;background:#eaf0f4}.priority.moderate{color:#865d00;background:#fff3d7}.priority.high{color:#9a4c12;background:#fff0e5}.priority.critical{color:#a5263a;background:#ffecef}.status.open{color:#2c608a;background:#e9f4fc}.status.in_progress{color:#745b0c;background:#fff4d6}.status.blocked{color:#a5263a;background:#ffecef}.status.verification{color:#643d92;background:#f2eaff}.status.closed{color:#176247;background:#e9f8f1}.overdue{color:#ad2f42!important;font-weight:900}.executive-summary{max-width:1492px;margin:18px auto 0;display:flex;align-items:center;gap:20px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.executive-summary>div{margin-right:auto}.executive-summary small{color:#8fc9f7;font-weight:900;letter-spacing:.1em}.executive-summary h2{margin:6px 0}.executive-summary p{max-width:950px;margin:0;color:#d2e6f5;line-height:1.55}.disclaimer{max-width:1492px;margin:18px auto 0;color:#6b7f91;font-size:10px;line-height:1.5}.modal-backdrop{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:18px;background:rgba(3,15,28,.82);backdrop-filter:blur(9px)}.modal{width:min(900px,100%);max-height:92vh;overflow:auto;border:1px solid #345b7c;border-radius:22px;background:#f8fbfe;box-shadow:0 30px 90px rgba(0,0,0,.45)}.wide-modal{width:min(1120px,100%)}.modal header,.modal footer{display:flex;align-items:center;gap:12px;padding:16px 18px}.modal header{position:sticky;top:0;z-index:2;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.modal header>div{margin-right:auto}.modal header small{color:#9ecbf1;font-weight:900;letter-spacing:.1em}.modal header h2{margin:4px 0 0}.modal header button{width:38px;padding:0;color:#fff;background:#123a60;border-color:#476a88}.modal-grid{padding:2px 22px 22px}.modal footer{justify-content:flex-end;border-top:1px solid #dbe6ee;background:#fff}.checkbox{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center}.checkbox input{width:auto!important}.evidence{display:flex!important;grid-template-columns:auto 1fr auto!important;align-items:center;padding:15px;border:1px dashed #7db2df;border-radius:13px;background:#f2f8fd;cursor:pointer}.evidence span strong,.evidence span small{display:block}.evidence input{max-width:260px}.import-controls{display:grid;grid-template-columns:240px 1fr;gap:16px;padding:22px}.dropzone{min-height:190px;display:grid;place-items:center;align-content:center;gap:7px;padding:18px;border:2px dashed #79acd6;border-radius:16px;color:#285a80;background:#eef7ff;text-align:center;cursor:pointer}.dropzone input{display:none}.import-controls textarea{min-height:230px;padding:12px;border:1px solid #cbdbe8;border-radius:14px;font:12px ui-monospace,monospace}.history-list{display:grid;padding:18px}.history-list article{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #dfe8ef}.history-list article>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#eaf4ff}.history-list p{margin:4px 0;color:#51687d}.history-list small{color:#8192a1}@media(max-width:1000px){.hero,.two-grid{grid-template-columns:1fr}.form-grid,.modal-grid{grid-template-columns:1fr 1fr}.do-header{flex-wrap:wrap}.header-meta{order:5;width:100%}.executive-summary{align-items:flex-start;flex-direction:column}.metric-row{grid-template-columns:auto 1fr 65px 65px 45px auto}}@media(max-width:650px){.hero{padding:18px 12px}.toolbar,.metrics{padding-left:12px;padding-right:12px}.panel,.notice,.executive-summary,.disclaimer{margin-left:12px;margin-right:12px}.form-grid,.modal-grid{grid-template-columns:1fr}.brand-lockup{width:125px}.northstar-lockup{width:160px}.header-status{display:none}.hero-copy{padding:23px}.hero h1{font-size:36px}.two-grid{display:block}.toolbar button.submit{margin-left:0}.executive-summary button{width:100%}.metric-row{grid-template-columns:auto 1fr 58px 58px auto}.metric-row .unit{display:none}.import-controls{grid-template-columns:1fr}.action-toolbar{flex-wrap:wrap}}@media print{body{background:#fff}.no-print,.back,.header-status,.modal-backdrop{display:none!important}.panel,.health-card,.metrics article{box-shadow:none}.action-table{overflow:visible}.action-table table{min-width:0;font-size:8px}.disclaimer{display:block}}
      `}</style>
    </main>
  );
}
