"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  Boxes,
  BrushCleaning,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  FileDown,
  Flag,
  GraduationCap,
  HardHat,
  History,
  ImagePlus,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  MapPinned,
  PackageCheck,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const STORAGE_KEY = "qmspilot:northstar:6s-workplace-excellence";
const SUMMARY_KEY = "qmspilot:northstar:6s-summary";
const pillars = ["Sort", "Set in Order", "Shine", "Standardize", "Sustain", "Safety"];

const initialAreas = [
  { id: "6S-FA-01", name: "Final Assembly", department: "Operations", owner: "Maria Torres", sponsor: "Operations Manager", phase: "Sustain", auditCadence: "Weekly", scores: [88, 92, 90, 86, 82, 96], lastAudit: "2026-07-31", nextAudit: "2026-08-07", openFindings: 3, criticalFindings: 0, redTags: 2, status: "Controlled" },
  { id: "6S-ET-02", name: "Electrical Test", department: "Quality", owner: "Andre Lewis", sponsor: "Quality Manager", phase: "Standardize", auditCadence: "Weekly", scores: [82, 79, 86, 76, 68, 78], lastAudit: "2026-07-30", nextAudit: "2026-08-06", openFindings: 6, criticalFindings: 1, redTags: 4, status: "Action Required" },
  { id: "6S-MS-03", name: "Machine Shop", department: "Operations", owner: "James Cole", sponsor: "Plant Manager", phase: "Set in Order", auditCadence: "Weekly", scores: [76, 71, 83, 66, 62, 88], lastAudit: "2026-07-29", nextAudit: "2026-08-05", openFindings: 7, criticalFindings: 0, redTags: 5, status: "Improving" },
  { id: "6S-FO-04", name: "Foam Operations", department: "Operations", owner: "Sofia Reed", sponsor: "Operations Manager", phase: "Sustain", auditCadence: "Weekly", scores: [91, 89, 94, 88, 85, 93], lastAudit: "2026-08-01", nextAudit: "2026-08-08", openFindings: 2, criticalFindings: 0, redTags: 1, status: "Controlled" },
  { id: "6S-PK-05", name: "Packaging", department: "Delivery", owner: "Caleb Young", sponsor: "Delivery Manager", phase: "Standardize", auditCadence: "Biweekly", scores: [86, 84, 89, 81, 74, 92], lastAudit: "2026-07-25", nextAudit: "2026-08-08", openFindings: 4, criticalFindings: 0, redTags: 1, status: "Improving" },
  { id: "6S-WH-06", name: "Warehouse & Receiving", department: "Warehouse", owner: "Emily Chen", sponsor: "Supply Chain Manager", phase: "Sort", auditCadence: "Weekly", scores: [68, 63, 72, 59, 54, 84], lastAudit: "2026-07-28", nextAudit: "2026-08-04", openFindings: 9, criticalFindings: 0, redTags: 8, status: "Launch" },
];

const initialRedTags = [
  { id: "RT-260801-01", areaId: "6S-WH-06", item: "Obsolete packaging fixtures", reason: "No use in 12 months", disposition: "Evaluate for scrap", owner: "Emily Chen", tagged: "2026-08-01", due: "2026-08-08", status: "Open", value: 0, space: 120, safety: false },
  { id: "RT-260801-02", areaId: "6S-ET-02", item: "Damaged extension cord", reason: "Electrical insulation damage", disposition: "Remove from service", owner: "Andre Lewis", tagged: "2026-08-01", due: "2026-08-01", status: "Overdue", value: 0, space: 2, safety: true },
  { id: "RT-260730-03", areaId: "6S-MS-03", item: "Duplicate cutting tools", reason: "Exceeds point-of-use quantity", disposition: "Return to tool crib", owner: "James Cole", tagged: "2026-07-30", due: "2026-08-05", status: "In Review", value: 4200, space: 18, safety: false },
  { id: "RT-260729-04", areaId: "6S-FA-01", item: "Unused assembly cart", reason: "No assigned product family", disposition: "Relocate to staging", owner: "Maria Torres", tagged: "2026-07-29", due: "2026-08-04", status: "Open", value: 850, space: 28, safety: false },
  { id: "RT-260728-05", areaId: "6S-FO-04", item: "Expired chemical container", reason: "Past shelf-life date", disposition: "Hazardous waste review", owner: "Sofia Reed", tagged: "2026-07-28", due: "2026-08-02", status: "In Review", value: 0, space: 1, safety: true },
];

const initialActions = [
  { id: "A-6S-101", source: "Safety finding", area: "Electrical Test", title: "Replace damaged extension cord and verify electrical inspection", owner: "Maintenance Lead", due: "2026-08-04", priority: "Critical", status: "Open", verification: "Safety verification required", repeat: false },
  { id: "A-6S-102", source: "Weekly audit", area: "Machine Shop", title: "Establish labeled point-of-use locations for changeover tooling", owner: "James Cole", due: "2026-08-09", priority: "High", status: "In Progress", verification: "Before/after photo", repeat: true },
  { id: "A-6S-103", source: "Red tag", area: "Warehouse & Receiving", title: "Disposition obsolete packaging fixtures", owner: "Emily Chen", due: "2026-08-08", priority: "Moderate", status: "Open", verification: "Disposition approval", repeat: false },
  { id: "A-6S-104", source: "Standard review", area: "Packaging", title: "Update visual standard for finished-goods staging lanes", owner: "Caleb Young", due: "2026-08-12", priority: "Moderate", status: "Open", verification: "Area-owner approval", repeat: false },
  { id: "A-6S-105", source: "Daily check", area: "Final Assembly", title: "Restore missing torque-tool location label", owner: "Maria Torres", due: "2026-08-05", priority: "Low", status: "Open", verification: "Supervisor check", repeat: false },
];

const initialAudits = [
  { id: "AUD-6S-241", area: "Final Assembly", type: "Weekly supervisor", auditor: "Operations Supervisor", date: "2026-07-31", score: 89, safety: 96, findings: 3, status: "Complete" },
  { id: "AUD-6S-242", area: "Electrical Test", type: "Weekly supervisor", auditor: "Quality Supervisor", date: "2026-07-30", score: 78, safety: 78, findings: 6, status: "Action Required" },
  { id: "AUD-6S-243", area: "Foam Operations", type: "Cross-functional", auditor: "6S Steering Team", date: "2026-08-01", score: 90, safety: 93, findings: 2, status: "Complete" },
  { id: "AUD-6S-244", area: "Warehouse & Receiving", type: "Baseline", auditor: "6S Leader", date: "2026-07-28", score: 67, safety: 84, findings: 9, status: "Action Required" },
];

const visualStandards = [
  { area: "Final Assembly", standard: "Torque tool shadow board", type: "Point-of-use", owner: "Maria Torres", revision: "B", status: "Current", review: "2026-10-01" },
  { area: "Electrical Test", standard: "Test lead and fixture locations", type: "Shadow board", owner: "Andre Lewis", revision: "A", status: "Update Required", review: "2026-08-06" },
  { area: "Machine Shop", standard: "Changeover tooling locations", type: "Location control", owner: "James Cole", revision: "Draft", status: "In Development", review: "2026-08-09" },
  { area: "Packaging", standard: "Finished-goods staging lanes", type: "Floor marking", owner: "Caleb Young", revision: "C", status: "Update Required", review: "2026-08-12" },
  { area: "Warehouse & Receiving", standard: "Receiving status zones", type: "Visual flow", owner: "Emily Chen", revision: "Draft", status: "In Development", review: "2026-08-15" },
];

const shineTasks = [
  { area: "Machine Shop", task: "Inspect and clean chip-control zones", frequency: "Daily", owner: "Area Operator", last: "2026-08-03", next: "2026-08-04", abnormalities: 2, status: "Due" },
  { area: "Electrical Test", task: "Inspect cords, fixtures, guards, and test bench", frequency: "Start of shift", owner: "Test Technician", last: "2026-08-03", next: "2026-08-04", abnormalities: 1, status: "Action Required" },
  { area: "Foam Operations", task: "Clean fixture surfaces and inspect chemical controls", frequency: "End of shift", owner: "Foam Operator", last: "2026-08-03", next: "2026-08-04", abnormalities: 0, status: "Controlled" },
  { area: "Warehouse & Receiving", task: "Verify aisles, exits, storage height, and dock condition", frequency: "Daily", owner: "Warehouse Lead", last: "2026-08-02", next: "2026-08-03", abnormalities: 3, status: "Overdue" },
];

const trainingRows = [
  { role: "Executive Sponsor", requirement: "6S governance and review", assigned: 2, complete: 2, status: "Complete" },
  { role: "6S Steering Team", requirement: "Audit calibration and coaching", assigned: 6, complete: 5, status: "In Progress" },
  { role: "Area Owner", requirement: "Area ownership, red tags, standards, daily checks", assigned: 6, complete: 5, status: "In Progress" },
  { role: "6S Auditor", requirement: "Scoring, evidence, safety escalation, repeat findings", assigned: 8, complete: 6, status: "In Progress" },
  { role: "All Employees", requirement: "6S awareness and improvement participation", assigned: 50, complete: 43, status: "In Progress" },
];

const tabs = [
  ["dashboard", "6S Executive Dashboard", LayoutDashboard],
  ["areas", "Area Readiness", MapPinned],
  ["red-tags", "Red Tag Center", Tag],
  ["visual", "Set in Order & Visuals", Eye],
  ["shine", "Shine & Safety", BrushCleaning],
  ["audits", "Audit Program", ClipboardCheck],
  ["actions", "Actions & Kaizen", Lightbulb],
  ["standards", "Standards & Training", GraduationCap],
];

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function statusClass(status) {
  if (["Controlled", "Complete", "Current", "Closed", "Verified"].includes(status)) return "good";
  if (["Improving", "In Progress", "In Review", "Due", "In Development"].includes(status)) return "warn";
  if (["Action Required", "Overdue", "Critical", "Update Required"].includes(status)) return "bad";
  return "blue";
}

function createId(prefix) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function daysOld(date) {
  return Math.max(0, Math.floor((new Date("2026-08-04T12:00:00").getTime() - new Date(`${date}T12:00:00`).getTime()) / 86400000));
}

export default function SixSWorkplaceExcellenceApp() {
  const [tab, setTab] = useState("dashboard");
  const [areas, setAreas] = useState(initialAreas);
  const [redTags, setRedTags] = useState(initialRedTags);
  const [actions, setActions] = useState(initialActions);
  const [audits, setAudits] = useState(initialAudits);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [redTagFormOpen, setRedTagFormOpen] = useState(false);
  const [auditFormOpen, setAuditFormOpen] = useState(false);
  const [redTagForm, setRedTagForm] = useState({ areaId: "6S-WH-06", item: "", reason: "", disposition: "Evaluate", owner: "", due: "2026-08-11", safety: false });
  const [auditForm, setAuditForm] = useState({ areaId: "6S-FA-01", auditor: "6S Auditor", type: "Weekly supervisor", scores: [80, 80, 80, 80, 80, 80] });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (Array.isArray(saved.areas)) setAreas(saved.areas);
      if (Array.isArray(saved.redTags)) setRedTags(saved.redTags);
      if (Array.isArray(saved.actions)) setActions(saved.actions);
      if (Array.isArray(saved.audits)) setAudits(saved.audits);
    } catch {}
  }, []);

  const areaScores = useMemo(() => areas.map((area) => ({ ...area, score: average(area.scores), safety: area.scores[5] })), [areas]);
  const enterpriseScore = average(areaScores.map((area) => area.score));
  const safetyScore = average(areaScores.map((area) => area.safety));
  const openRedTags = redTags.filter((item) => !["Disposed", "Closed"].includes(item.status)).length;
  const overdueActions = actions.filter((item) => item.status !== "Closed" && item.due < "2026-08-04").length;
  const criticalSafety = actions.filter((item) => item.priority === "Critical" && item.status !== "Closed").length;
  const areasAtTarget = areaScores.filter((area) => area.score >= 85 && area.safety >= 80 && area.criticalFindings === 0).length;
  const recoveredSpace = redTags.filter((item) => ["Disposed", "Closed"].includes(item.status)).reduce((sum, item) => sum + Number(item.space || 0), 0) + 610;
  const recoveredValue = redTags.filter((item) => ["Disposed", "Closed"].includes(item.status)).reduce((sum, item) => sum + Number(item.value || 0), 0) + 42750;
  const auditCompletion = 94;

  const summary = useMemo(() => ({
    company: "Davicorp",
    enterpriseScore,
    safetyScore,
    openRedTags,
    overdueActions,
    criticalSafety,
    areasAtTarget,
    totalAreas: areas.length,
    recoveredSpace,
    recoveredValue,
    auditCompletion,
    areas: areaScores.map((area) => ({ name: area.name, score: area.score, safety: area.safety, status: area.status })),
    source: "6S Workplace Excellence",
    sourcePath: "/tools/6s-workplace-excellence",
    updatedAt: new Date().toISOString(),
  }), [enterpriseScore, safetyScore, openRedTags, overdueActions, criticalSafety, areasAtTarget, areas.length, recoveredSpace, recoveredValue, auditCompletion, areaScores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ areas, redTags, actions, audits }));
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
    window.dispatchEvent(new CustomEvent("qmspilot:6s-summary-updated", { detail: summary }));
  }, [areas, redTags, actions, audits, summary]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const filteredAreas = areaScores.filter((area) => {
    const searchable = `${area.id} ${area.name} ${area.department} ${area.owner} ${area.phase}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (department === "All" || area.department === department) && (readinessFilter === "All" || area.status === readinessFilter);
  });

  const addRedTag = () => {
    if (!redTagForm.item.trim() || !redTagForm.owner.trim()) {
      flash("Add the item and accountable owner before creating the red tag.");
      return;
    }
    const area = areas.find((item) => item.id === redTagForm.areaId);
    const newTag = {
      id: createId("RT"),
      ...redTagForm,
      tagged: "2026-08-04",
      status: redTagForm.safety ? "Action Required" : "Open",
      value: 0,
      space: 0,
    };
    setRedTags((current) => [newTag, ...current]);
    setAreas((current) => current.map((item) => item.id === redTagForm.areaId ? { ...item, redTags: item.redTags + 1, openFindings: item.openFindings + 1, criticalFindings: redTagForm.safety ? item.criticalFindings + 1 : item.criticalFindings, status: redTagForm.safety ? "Action Required" : item.status } : item));
    if (redTagForm.safety) {
      setActions((current) => [{ id: createId("A-6S"), source: "Safety red tag", area: area?.name || "Area", title: `Remove unsafe item: ${redTagForm.item}`, owner: redTagForm.owner, due: redTagForm.due, priority: "Critical", status: "Open", verification: "Safety verification required", repeat: false }, ...current]);
    }
    setRedTagFormOpen(false);
    setRedTagForm({ areaId: "6S-WH-06", item: "", reason: "", disposition: "Evaluate", owner: "", due: "2026-08-11", safety: false });
    flash("Red tag created and routed to the area owner. Safety-related tags also created an immediate action.");
  };

  const closeRedTag = (id) => {
    const tag = redTags.find((item) => item.id === id);
    setRedTags((current) => current.map((item) => item.id === id ? { ...item, status: "Disposed" } : item));
    if (tag) setAreas((current) => current.map((area) => area.id === tag.areaId ? { ...area, redTags: Math.max(0, area.redTags - 1), openFindings: Math.max(0, area.openFindings - 1) } : area));
    flash("Disposition recorded. Recovered space and value are now available to the 6S value feed.");
  };

  const completeAction = (id) => {
    const action = actions.find((item) => item.id === id);
    setActions((current) => current.map((item) => item.id === id ? { ...item, status: "Closed" } : item));
    if (action?.priority === "Critical") {
      setAreas((current) => current.map((area) => area.name === action.area ? { ...area, criticalFindings: Math.max(0, area.criticalFindings - 1), status: area.criticalFindings <= 1 ? "Improving" : area.status } : area));
    }
    flash("Action closed with verification evidence. The area and Executive Intelligence summaries were recalculated.");
  };

  const submitAudit = () => {
    const area = areas.find((item) => item.id === auditForm.areaId);
    if (!area) return;
    const score = average(auditForm.scores);
    const safety = Number(auditForm.scores[5]);
    const safetyGateFailed = safety < 80;
    const status = safetyGateFailed || score < 75 ? "Action Required" : score >= 85 ? "Complete" : "Improving";
    setAudits((current) => [{ id: createId("AUD-6S"), area: area.name, type: auditForm.type, auditor: auditForm.auditor, date: "2026-08-04", score, safety, findings: safetyGateFailed ? 3 : score < 85 ? 2 : 0, status }, ...current]);
    setAreas((current) => current.map((item) => item.id === area.id ? { ...item, scores: auditForm.scores.map(Number), lastAudit: "2026-08-04", nextAudit: "2026-08-11", openFindings: safetyGateFailed ? item.openFindings + 3 : score < 85 ? item.openFindings + 2 : item.openFindings, criticalFindings: safetyGateFailed ? item.criticalFindings + 1 : item.criticalFindings, status: safetyGateFailed ? "Action Required" : score >= 85 ? "Controlled" : "Improving" } : item));
    if (safetyGateFailed) {
      setActions((current) => [{ id: createId("A-6S"), source: "6S audit safety gate", area: area.name, title: "Correct safety score below the 80-point release threshold", owner: area.owner, due: "2026-08-05", priority: "Critical", status: "Open", verification: "Leadership safety verification", repeat: false }, ...current]);
    }
    setAuditFormOpen(false);
    flash(safetyGateFailed ? "Audit recorded. Safety gate failed, so the area cannot be classified as controlled and a critical action was created." : "Audit recorded and the area readiness score was updated.");
  };

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify({ summary, areas, redTags, actions, audits }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Davicorp-6S-Workplace-Excellence-Demo.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetDemo = () => {
    setAreas(initialAreas);
    setRedTags(initialRedTags);
    setActions(initialActions);
    setAudits(initialAudits);
    flash("Davicorp 6S demonstration data restored.");
  };

  return (
    <main className="six-shell">
      <aside className="six-sidebar">
        <div className="six-brand"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="six-brand six-northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="six-company"><small>DEMONSTRATION TENANT</small><strong>Davicorp</strong><span>6S Workplace Excellence</span></div>
        <nav>
          {tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={17} /><span>{label}</span><ChevronRight size={14} /></button>)}
        </nav>
        <div className="six-side-footer">
          <small>CONNECTED OPERATING MODEL</small>
          <span><ShieldCheck size={13} /> Safety is a release gate</span>
          <span><CheckCircle2 size={13} /> Area owners close the work</span>
          <span><BarChart3 size={13} /> Executive Intelligence receives the rollup</span>
          <a href="/executive-intelligence">Open Executive Intelligence <ArrowRight size={14} /></a>
        </div>
      </aside>

      <section className="six-main">
        <header className="six-topbar">
          <div><small>QMSPILOT NORTHSTAR · SMART OPERATIONS</small><strong>6S Workplace Excellence</strong></div>
          <div className="six-top-actions"><span>Design-partner demonstration</span><button onClick={exportSnapshot}><Download size={15} /> Export</button><button onClick={resetDemo}><RotateCcw size={15} /> Reset</button></div>
        </header>

        <div className="six-content">
          {notice && <div className="six-notice"><Sparkles size={17} />{notice}</div>}

          {tab === "dashboard" && <>
            <section className="six-hero">
              <div>
                <small>SORT · SET IN ORDER · SHINE · STANDARDIZE · SUSTAIN · SAFETY</small>
                <h1>Build a workplace that exposes problems, protects people, and improves every day.</h1>
                <p>Davicorp uses one controlled 6S system for area ownership, red tags, visual standards, cleaning-as-inspection, safety, layered audits, corrective action, recognition, and verified improvement value.</p>
                <div className="six-hero-actions"><button onClick={() => setAuditFormOpen(true)}><ClipboardCheck size={16} /> Start 6S Audit</button><button className="outline" onClick={() => setRedTagFormOpen(true)}><Tag size={16} /> Create Red Tag</button><a href="/executive-intelligence">Executive Rollup <ArrowRight size={16} /></a></div>
                <div className="six-pillars">{pillars.map((pillar, index) => <span key={pillar}><b>0{index + 1}</b>{pillar}</span>)}</div>
              </div>
              <div className="six-score-card">
                <small>DAVICORP 6S READINESS</small>
                <div className="six-ring" style={{ "--score": `${enterpriseScore * 3.6}deg` }}><div><strong>{enterpriseScore}</strong><span>out of 100</span></div></div>
                <b>{criticalSafety ? "Safety action required" : areasAtTarget === areas.length ? "Sustained control" : "Implementation progressing"}</b>
                <em>{areasAtTarget} of {areas.length} areas at target</em>
                <div className="safety-gate"><HardHat size={16} /><span>Safety score {safetyScore}% · {criticalSafety} critical open</span></div>
              </div>
            </section>

            <section className="six-metrics">
              {[
                ["Enterprise 6S score", `${enterpriseScore}%`, "Across six controlled pillars", BarChart3],
                ["Safety score", `${safetyScore}%`, criticalSafety ? `${criticalSafety} critical action open` : "No critical safety actions", HardHat],
                ["Open red tags", openRedTags, "Disposition ownership active", Tag],
                ["Areas at target", `${areasAtTarget}/${areas.length}`, "Score ≥85 and safety gate passed", Target],
                ["Audit completion", `${auditCompletion}%`, "Layered cadence completion", CalendarCheck],
                ["Recovered space", `${recoveredSpace} ft²`, `$${recoveredValue.toLocaleString()} verified value`, TrendingUp],
              ].map(([label, value, note, Icon]) => <article key={label}><span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><em>{note}</em></article>)}
            </section>

            <section className="six-two">
              <article className="six-panel">
                <div className="six-heading"><div><small>AREA READINESS</small><h2>Where Davicorp is sustaining versus still implementing</h2></div><MapPinned /></div>
                <div className="six-area-bars">{areaScores.map((area) => <button key={area.id} onClick={() => setSelectedArea(area)}><span><strong>{area.name}</strong><em>{area.score}%</em></span><i><b style={{ width: `${area.score}%` }} /></i><small><span className={`six-tag ${statusClass(area.status)}`}>{area.status}</span>{area.openFindings} open findings · Safety {area.safety}%</small></button>)}</div>
              </article>
              <article className="six-panel">
                <div className="six-heading"><div><small>IMPLEMENTATION ROADMAP</small><h2>Launch deliberately, then build sustainment</h2></div><TrendingUp /></div>
                <div className="six-roadmap">{[
                  ["01", "Prepare", "Executive sponsor, steering team, scope, baseline, communication"],
                  ["02", "Stabilize", "Red tags, safety corrections, defined ownership, abnormality control"],
                  ["03", "Visualize", "Point-of-use locations, labels, floor marking, min/max, zone maps"],
                  ["04", "Standardize", "Photo standards, routines, audit criteria, role training"],
                  ["05", "Sustain", "Layered audits, coaching, recognition, repeat-finding escalation"],
                  ["06", "Improve", "Kaizen pipeline, value verification, executive review, expansion"],
                ].map(([number, title, note]) => <div key={number}><span>{number}</span><div><strong>{title}</strong><small>{note}</small></div></div>)}</div>
              </article>
            </section>

            <section className="six-two">
              <article className="six-panel"><div className="six-heading"><div><small>PRIORITY CONTROL</small><h2>What must be closed now</h2></div><AlertTriangle /></div><div className="six-action-list">{actions.filter((item) => item.status !== "Closed").slice(0, 5).map((item) => <div key={item.id}><span className={statusClass(item.priority)}>{item.priority}</span><strong>{item.title}</strong><small>{item.area} · Owner: {item.owner} · Due {item.due}</small><button onClick={() => completeAction(item.id)}><CheckCircle2 size={14} /> Verify</button></div>)}</div></article>
              <article className="six-panel"><div className="six-heading"><div><small>OPERATING RHYTHM</small><h2>6S survives through routine, not campaigns</h2></div><History /></div><div className="six-rhythm"><div><span>Daily</span><strong>Area-owner condition check</strong><small>Restore standards immediately; identify abnormalities.</small></div><div><span>Weekly</span><strong>Supervisor audit and coaching</strong><small>Score evidence, assign actions, review repeat findings.</small></div><div><span>Monthly</span><strong>Cross-functional calibration</strong><small>Compare areas, verify standards, transfer good practices.</small></div><div><span>Quarterly</span><strong>Leadership review</strong><small>Remove barriers, validate value, recognize teams, reset priorities.</small></div></div></article>
            </section>
          </>}

          {tab === "areas" && <>
            <section className="six-panel section-card">
              <div className="six-section-title"><div><small>02 · AREA READINESS REGISTER</small><h2>Control every workplace through visible ownership and maturity</h2><p>Establish boundaries, assign an owner, define the audit rhythm, and prevent an area from being declared controlled when safety is below threshold.</p></div><Settings2 /></div>
              <div className="six-toolbar"><button className="primary" onClick={() => flash("New-area setup will capture boundaries, owner, sponsor, current condition, baseline score, and launch date.")}><Plus size={15} /> Add area</button><button onClick={() => setAuditFormOpen(true)}><ClipboardCheck size={15} /> Launch baseline</button><button onClick={exportSnapshot}><FileDown size={15} /> Download template</button><a href="/executive-intelligence"><BarChart3 size={15} /> Executive view</a></div>
              <div className="six-filters"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search area, owner, department, or phase" /></label><select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All</option>{[...new Set(areas.map((area) => area.department))].map((item) => <option key={item}>{item}</option>)}</select><select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)}><option>All</option><option>Controlled</option><option>Improving</option><option>Action Required</option><option>Launch</option></select></div>
              <div className="six-table"><table><thead><tr><th>Area</th><th>Department / Owner</th><th>Implementation</th><th>6S Health</th><th>Safety Gate</th><th>Open Control</th><th>Actions</th></tr></thead><tbody>{filteredAreas.map((area) => <tr key={area.id}><td><div className="area-identity"><span><MapPinned size={17} /></span><div><strong>{area.name}</strong><small>{area.id} · {area.auditCadence} audit</small></div></div></td><td><strong>{area.department}</strong><small>{area.owner} · Sponsor: {area.sponsor}</small></td><td><span className={`six-tag ${statusClass(area.status)}`}>{area.status}</span><small>Phase: {area.phase}</small></td><td><strong>{area.score}%</strong><div className="mini-bar"><i style={{ width: `${area.score}%` }} /></div></td><td><span className={`six-tag ${area.safety >= 80 && area.criticalFindings === 0 ? "good" : "bad"}`}>{area.safety >= 80 && area.criticalFindings === 0 ? "Passed" : "Blocked"}</span><small>{area.safety}% · {area.criticalFindings} critical</small></td><td><strong>{area.openFindings} findings</strong><small>{area.redTags} red tags · Next {area.nextAudit}</small></td><td><div className="icon-actions"><button title="View area" onClick={() => setSelectedArea(area)}><Eye size={14} /></button><button title="Run audit" onClick={() => { setAuditForm({ ...auditForm, areaId: area.id }); setAuditFormOpen(true); }}><ClipboardCheck size={14} /></button><button title="Create red tag" onClick={() => { setRedTagForm({ ...redTagForm, areaId: area.id, owner: area.owner }); setRedTagFormOpen(true); }}><Tag size={14} /></button></div></td></tr>)}</tbody></table></div>
            </section>
          </>}

          {tab === "red-tags" && <section className="six-panel section-card">
            <div className="six-section-title"><div><small>03 · RED TAG CONTROL</small><h2>Separate needed from unneeded without losing accountability</h2><p>Every tagged item receives a reason, owner, due date, disposition decision, safety review, and measured space or value recovery.</p></div><Tag /></div>
            <div className="six-toolbar"><button className="primary" onClick={() => setRedTagFormOpen(true)}><Plus size={15} /> Create red tag</button><button onClick={() => flash("The red-tag holding area review is scheduled weekly with Operations, Safety, Quality, and Finance representation.")}><CalendarCheck size={15} /> Review holding area</button><button onClick={exportSnapshot}><Download size={15} /> Export register</button></div>
            <div className="six-table"><table><thead><tr><th>Red Tag / Item</th><th>Area</th><th>Reason</th><th>Disposition</th><th>Owner / Age</th><th>Safety</th><th>Status</th><th>Action</th></tr></thead><tbody>{redTags.map((item) => { const area = areas.find((areaItem) => areaItem.id === item.areaId); return <tr key={item.id}><td><strong>{item.item}</strong><small>{item.id} · Tagged {item.tagged}</small></td><td><strong>{area?.name || item.areaId}</strong><small>{area?.department}</small></td><td>{item.reason}</td><td><strong>{item.disposition}</strong><small>{item.space} ft² · ${Number(item.value).toLocaleString()}</small></td><td><strong>{item.owner}</strong><small>{daysOld(item.tagged)} days old · Due {item.due}</small></td><td><span className={`six-tag ${item.safety ? "bad" : "blue"}`}>{item.safety ? "Safety related" : "Standard"}</span></td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td>{!["Disposed", "Closed"].includes(item.status) ? <button onClick={() => closeRedTag(item.id)}><CheckCircle2 size={14} /> Disposition</button> : <span className="six-tag good">Verified</span>}</td></tr>; })}</tbody></table></div>
          </section>}

          {tab === "visual" && <>
            <section className="six-panel section-card"><div className="six-section-title"><div><small>04 · SET IN ORDER & VISUAL FACTORY</small><h2>Make the correct condition obvious at a glance</h2><p>Control point-of-use locations, quantities, labels, shadow boards, floor markings, replenishment signals, and visual flow.</p></div><Eye /></div><div className="six-toolbar"><button className="primary" onClick={() => flash("Visual-standard builder opened for location photos, labels, boundaries, min/max, and approval.")}><ImagePlus size={15} /> Create visual standard</button><button><MapPinned size={15} /> Build zone map</button><button><PackageCheck size={15} /> Define min / max</button></div><div className="six-table"><table><thead><tr><th>Area / Standard</th><th>Control Type</th><th>Owner</th><th>Revision</th><th>Review Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visualStandards.map((item) => <tr key={`${item.area}-${item.standard}`}><td><strong>{item.standard}</strong><small>{item.area}</small></td><td>{item.type}</td><td>{item.owner}</td><td>{item.revision}</td><td>{item.review}</td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td><div className="icon-actions"><button title="View"><Eye size={14} /></button><button title="Edit"><Pencil size={14} /></button><button title="History"><History size={14} /></button></div></td></tr>)}</tbody></table></div></section>
            <section className="six-two"><article className="six-panel"><div className="six-heading"><div><small>VISUAL-CONTROL DESIGN RULES</small><h2>Every standard must answer five questions</h2></div><ListChecks /></div><div className="six-rule-grid">{["What belongs here?", "Exactly where does it belong?", "How many are required?", "What is the normal condition?", "What action is required when abnormal?"].map((rule, index) => <div key={rule}><span>0{index + 1}</span><strong>{rule}</strong></div>)}</div></article><article className="six-panel"><div className="six-heading"><div><small>ABNORMALITY RESPONSE</small><h2>Visual controls must trigger action</h2></div><AlertTriangle /></div><p className="six-copy">A label or painted line is not success by itself. Northstar links the visual standard to the area owner, audit criterion, replenishment rule, safety requirement, and corrective action when the condition is not maintained.</p><div className="six-callout"><ShieldCheck /><span>Missing, damaged, incorrect, or unsafe visual controls become controlled findings—not informal reminders.</span></div></article></section>
          </>}

          {tab === "shine" && <>
            <section className="six-panel section-card"><div className="six-section-title"><div><small>05 · SHINE & SAFETY CONTROL</small><h2>Use cleaning as inspection and correct abnormalities at the source</h2><p>Cleaning routines must reveal leaks, loose hardware, damage, contamination, guarding issues, blocked access, and other abnormal conditions.</p></div><BrushCleaning /></div><div className="six-toolbar"><button className="primary" onClick={() => flash("A new cleaning-as-inspection routine was staged for owner, frequency, acceptance criteria, and abnormality routing.")}><Plus size={15} /> Add routine</button><button><HardHat size={15} /> Record safety finding</button><button><Wrench size={15} /> Create maintenance handoff</button></div><div className="six-table"><table><thead><tr><th>Area / Routine</th><th>Frequency</th><th>Owner</th><th>Last Completed</th><th>Next Due</th><th>Abnormalities</th><th>Status</th><th>Action</th></tr></thead><tbody>{shineTasks.map((item) => <tr key={`${item.area}-${item.task}`}><td><strong>{item.task}</strong><small>{item.area}</small></td><td>{item.frequency}</td><td>{item.owner}</td><td>{item.last}</td><td>{item.next}</td><td><strong>{item.abnormalities}</strong><small>{item.abnormalities ? "Requires source correction" : "Normal condition"}</small></td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td><div className="icon-actions"><button title="Complete"><CheckCircle2 size={14} /></button><button title="Record abnormality"><AlertTriangle size={14} /></button><button title="Work order"><Wrench size={14} /></button></div></td></tr>)}</tbody></table></div></section>
            <section className="six-panel"><div className="six-heading"><div><small>SAFETY RELEASE GATE</small><h2>An area cannot be classified as controlled with an open critical hazard</h2></div><HardHat /></div><div className="six-safety-grid">{["Aisles, exits, and emergency access", "Machine guarding and energy control", "Electrical condition and panel access", "Chemical storage, labeling, and spill control", "PPE and ergonomic risk", "Fire protection and emergency equipment"].map((item) => <div key={item}><ShieldCheck size={18} /><strong>{item}</strong><span>Evidence required during audit</span></div>)}</div></section>
          </>}

          {tab === "audits" && <>
            <section className="six-panel section-card"><div className="six-section-title"><div><small>06 · LAYERED 6S AUDIT PROGRAM</small><h2>Calibrate scoring, coach the area, and prevent repeat findings</h2><p>Audits verify the standard and create action. They are not photo opportunities or scorekeeping exercises.</p></div><ClipboardCheck /></div><div className="six-toolbar"><button className="primary" onClick={() => setAuditFormOpen(true)}><Plus size={15} /> Start audit</button><button onClick={() => flash("Audit calibration session opened for scoring examples, evidence expectations, and auditor alignment.")}><Users size={15} /> Calibrate auditors</button><button><QrCode size={15} /> Area QR check</button><button onClick={exportSnapshot}><Download size={15} /> Export results</button></div><div className="six-table"><table><thead><tr><th>Audit</th><th>Area</th><th>Layer / Auditor</th><th>Date</th><th>Overall</th><th>Safety</th><th>Findings</th><th>Status</th><th>Action</th></tr></thead><tbody>{audits.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.area}</td><td><strong>{item.type}</strong><small>{item.auditor}</small></td><td>{item.date}</td><td><strong>{item.score}%</strong></td><td><span className={`six-tag ${item.safety >= 80 ? "good" : "bad"}`}>{item.safety}%</span></td><td>{item.findings}</td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td><button><Eye size={14} /> Review</button></td></tr>)}</tbody></table></div></section>
            <section className="six-two"><article className="six-panel"><div className="six-heading"><div><small>LAYERED CADENCE</small><h2>Different layers answer different questions</h2></div><CalendarCheck /></div><div className="six-rhythm"><div><span>Daily</span><strong>Is the area restored to standard?</strong><small>Area owner; 3–5 minutes.</small></div><div><span>Weekly</span><strong>Are standards effective and actions closing?</strong><small>Supervisor; 10–15 minutes.</small></div><div><span>Monthly</span><strong>Are scores calibrated and practices transferable?</strong><small>Cross-functional team.</small></div><div><span>Quarterly</span><strong>Is leadership removing systemic barriers?</strong><small>Executive sponsor and steering team.</small></div></div></article><article className="six-panel"><div className="six-heading"><div><small>SCORING GOVERNANCE</small><h2>Evidence before score</h2></div><BadgeCheck /></div><div className="six-rule-grid">{["0 — No control", "1 — Initial activity", "2 — Inconsistent", "3 — Defined standard", "4 — Controlled", "5 — Sustained and improving"].map((item, index) => <div key={item}><span>{index}</span><strong>{item}</strong></div>)}</div></article></section>
          </>}

          {tab === "actions" && <>
            <section className="six-panel section-card"><div className="six-section-title"><div><small>07 · ACTIONS & KAIZEN PIPELINE</small><h2>Turn every finding into accountable, verified improvement</h2><p>Immediate restoration, root-cause correction, ownership, due date, evidence, recurrence review, and value validation remain connected.</p></div><Lightbulb /></div><div className="six-toolbar"><button className="primary" onClick={() => flash("New 6S improvement record staged for problem, idea, owner, impact, effort, due date, and verification.")}><Plus size={15} /> Add improvement</button><button><Target size={15} /> Prioritize pipeline</button><button><Trophy size={15} /> Recognize team</button><button onClick={exportSnapshot}><Download size={15} /> Export actions</button></div><div className="six-table"><table><thead><tr><th>Action / Source</th><th>Area</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th><th>Verification</th><th>Repeat</th><th>Action</th></tr></thead><tbody>{actions.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.id} · {item.source}</small></td><td>{item.area}</td><td>{item.owner}</td><td>{item.due}</td><td><span className={`six-tag ${statusClass(item.priority)}`}>{item.priority}</span></td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td>{item.verification}</td><td>{item.repeat ? <span className="six-tag bad">Recurring</span> : <span className="six-tag blue">First occurrence</span>}</td><td>{item.status !== "Closed" ? <button onClick={() => completeAction(item.id)}><CheckCircle2 size={14} /> Verify</button> : <span className="six-tag good">Closed</span>}</td></tr>)}</tbody></table></div></section>
            <section className="six-two"><article className="six-panel"><div className="six-heading"><div><small>IMPROVEMENT VALUE</small><h2>Measure outcomes without inventing savings</h2></div><TrendingUp /></div><div className="six-value-grid"><div><small>Floor space recovered</small><strong>{recoveredSpace} ft²</strong><span>Verified disposition records</span></div><div><small>Reusable value recovered</small><strong>${recoveredValue.toLocaleString()}</strong><span>Finance review available</span></div><div><small>Open repeat findings</small><strong>{actions.filter((item) => item.repeat && item.status !== "Closed").length}</strong><span>Escalation required</span></div><div><small>Actions closed</small><strong>{actions.filter((item) => item.status === "Closed").length}</strong><span>Evidence verified</span></div></div></article><article className="six-panel"><div className="six-heading"><div><small>CONTINUOUS IMPROVEMENT</small><h2>Recognize behavior, not cosmetic scores</h2></div><Trophy /></div><p className="six-copy">Recognition should reward employees who identify abnormalities, remove root causes, improve standards, help another area, or prevent recurrence. High audit scores without participation or evidence should not win recognition.</p><div className="six-callout"><Sparkles /><span>Northstar tracks participation, verified improvements, transferred practices, and sustained closure—not just the latest audit percentage.</span></div></article></section>
          </>}

          {tab === "standards" && <>
            <section className="six-panel section-card"><div className="six-section-title"><div><small>08 · STANDARDIZE, SUSTAIN & TRAIN</small><h2>Make the expected condition teachable and repeatable</h2><p>Connect area standards, role responsibilities, training, audit criteria, escalation, leadership review, and recognition.</p></div><BookOpenCheck /></div><div className="six-toolbar"><button className="primary" onClick={() => flash("6S standard builder opened for purpose, area boundaries, photos, routines, audit criteria, and approval.")}><Plus size={15} /> Create 6S standard</button><button><GraduationCap size={15} /> Assign training</button><button><Users size={15} /> Manage roles</button><button><Trophy size={15} /> Recognition review</button></div><div className="six-table"><table><thead><tr><th>Role</th><th>Required Capability</th><th>Assigned</th><th>Complete</th><th>Coverage</th><th>Status</th><th>Action</th></tr></thead><tbody>{trainingRows.map((item) => { const coverage = Math.round((item.complete / item.assigned) * 100); return <tr key={item.role}><td><strong>{item.role}</strong></td><td>{item.requirement}</td><td>{item.assigned}</td><td>{item.complete}</td><td><strong>{coverage}%</strong><div className="mini-bar"><i style={{ width: `${coverage}%` }} /></div></td><td><span className={`six-tag ${statusClass(item.status)}`}>{item.status}</span></td><td><button><GraduationCap size={14} /> Review</button></td></tr>; })}</tbody></table></div></section>
            <section className="six-two"><article className="six-panel"><div className="six-heading"><div><small>GOVERNANCE ROLES</small><h2>Clear authority prevents 6S from fading</h2></div><Users /></div><div className="six-rhythm"><div><span>Sponsor</span><strong>Sets expectations and removes barriers</strong><small>Reviews performance and resources.</small></div><div><span>6S Lead</span><strong>Owns method, calibration, and rollout</strong><small>Coaches without taking ownership away from areas.</small></div><div><span>Area Owner</span><strong>Restores and improves the standard</strong><small>Owns daily condition and action closure.</small></div><div><span>Employees</span><strong>Follow, challenge, and improve standards</strong><small>Identify abnormalities and submit ideas.</small></div></div></article><article className="six-panel"><div className="six-heading"><div><small>EXECUTIVE INTELLIGENCE FEED</small><h2>Leadership receives the minimum useful rollup</h2></div><BarChart3 /></div><div className="six-value-grid"><div><small>Enterprise score</small><strong>{enterpriseScore}%</strong><span>Trend and maturity</span></div><div><small>Safety gate</small><strong>{criticalSafety ? "Blocked" : "Passed"}</strong><span>{criticalSafety} critical open</span></div><div><small>Area coverage</small><strong>{areasAtTarget}/{areas.length}</strong><span>Areas at target</span></div><div><small>Value verified</small><strong>${recoveredValue.toLocaleString()}</strong><span>Space and disposition value</span></div></div><a className="six-open-link" href="/executive-intelligence">Open leadership view <ArrowRight size={15} /></a></article></section>
          </>}
        </div>
      </section>

      {selectedArea && <div className="six-modal-backdrop" onClick={() => setSelectedArea(null)}><section className="six-modal area-modal" onClick={(event) => event.stopPropagation()}><div className="six-modal-head"><div><small>6S AREA CONTROL RECORD</small><h2>{selectedArea.name}</h2><p>{selectedArea.department} · Owner: {selectedArea.owner}</p></div><button onClick={() => setSelectedArea(null)}><X size={18} /></button></div><div className="area-summary"><div><small>Readiness</small><strong>{selectedArea.score}%</strong></div><div><small>Phase</small><strong>{selectedArea.phase}</strong></div><div><small>Open findings</small><strong>{selectedArea.openFindings}</strong></div><div><small>Safety gate</small><strong>{selectedArea.safety >= 80 && selectedArea.criticalFindings === 0 ? "Passed" : "Blocked"}</strong></div></div><div className="pillar-detail">{pillars.map((pillar, index) => <div key={pillar}><span><strong>{pillar}</strong><em>{selectedArea.scores[index]}%</em></span><i><b style={{ width: `${selectedArea.scores[index]}%` }} /></i></div>)}</div>{(selectedArea.safety < 80 || selectedArea.criticalFindings > 0) && <div className="six-alert"><AlertTriangle /><div><strong>Safety release gate failed</strong><p>This area cannot be classified as controlled until the critical safety condition is corrected and verified.</p></div></div>}<div className="six-button-row"><button onClick={() => setSelectedArea(null)}>Close</button><button className="primary" onClick={() => { setAuditForm({ ...auditForm, areaId: selectedArea.id }); setSelectedArea(null); setAuditFormOpen(true); }}><ClipboardCheck size={15} /> Run audit</button><button onClick={() => { setRedTagForm({ ...redTagForm, areaId: selectedArea.id, owner: selectedArea.owner }); setSelectedArea(null); setRedTagFormOpen(true); }}><Tag size={15} /> Red tag</button></div></section></div>}

      {redTagFormOpen && <div className="six-modal-backdrop" onClick={() => setRedTagFormOpen(false)}><section className="six-modal" onClick={(event) => event.stopPropagation()}><div className="six-modal-head"><div><small>CONTROLLED RED TAG</small><h2>Create red tag</h2><p>Identify the item, reason, owner, disposition path, and safety impact.</p></div><button onClick={() => setRedTagFormOpen(false)}><X size={18} /></button></div><div className="six-form-grid"><label>Area<select value={redTagForm.areaId} onChange={(event) => setRedTagForm({ ...redTagForm, areaId: event.target.value })}>{areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select></label><label>Owner<input value={redTagForm.owner} onChange={(event) => setRedTagForm({ ...redTagForm, owner: event.target.value })} placeholder="Accountable owner" /></label><label className="full">Item / condition<input value={redTagForm.item} onChange={(event) => setRedTagForm({ ...redTagForm, item: event.target.value })} placeholder="Describe the tagged item" /></label><label className="full">Reason<textarea value={redTagForm.reason} onChange={(event) => setRedTagForm({ ...redTagForm, reason: event.target.value })} placeholder="Why is the item unnecessary, abnormal, unsafe, or not in the correct location?" /></label><label>Proposed disposition<select value={redTagForm.disposition} onChange={(event) => setRedTagForm({ ...redTagForm, disposition: event.target.value })}><option>Evaluate</option><option>Remove from service</option><option>Relocate</option><option>Return to storage</option><option>Repair</option><option>Scrap</option><option>Quarantine</option></select></label><label>Due date<input type="date" value={redTagForm.due} onChange={(event) => setRedTagForm({ ...redTagForm, due: event.target.value })} /></label><label className="full checkbox"><input type="checkbox" checked={redTagForm.safety} onChange={(event) => setRedTagForm({ ...redTagForm, safety: event.target.checked })} /> Safety-related condition requiring immediate controlled action</label></div><div className="six-button-row"><button onClick={() => setRedTagFormOpen(false)}>Cancel</button><button className="primary" onClick={addRedTag}><Tag size={15} /> Create red tag</button></div></section></div>}

      {auditFormOpen && <div className="six-modal-backdrop" onClick={() => setAuditFormOpen(false)}><section className="six-modal audit-modal" onClick={(event) => event.stopPropagation()}><div className="six-modal-head"><div><small>LAYERED 6S AUDIT</small><h2>Score the evidence, not the appearance</h2><p>Safety below 80 creates a release-gate failure regardless of overall score.</p></div><button onClick={() => setAuditFormOpen(false)}><X size={18} /></button></div><div className="six-form-grid"><label>Area<select value={auditForm.areaId} onChange={(event) => setAuditForm({ ...auditForm, areaId: event.target.value })}>{areas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select></label><label>Audit layer<select value={auditForm.type} onChange={(event) => setAuditForm({ ...auditForm, type: event.target.value })}><option>Daily owner check</option><option>Weekly supervisor</option><option>Cross-functional</option><option>Leadership review</option><option>Baseline</option></select></label><label className="full">Auditor<input value={auditForm.auditor} onChange={(event) => setAuditForm({ ...auditForm, auditor: event.target.value })} /></label></div><div className="audit-score-grid">{pillars.map((pillar, index) => <label key={pillar}><span><strong>{pillar}</strong><em>{auditForm.scores[index]}%</em></span><input type="range" min="0" max="100" step="5" value={auditForm.scores[index]} onChange={(event) => setAuditForm({ ...auditForm, scores: auditForm.scores.map((score, scoreIndex) => scoreIndex === index ? Number(event.target.value) : score) })} /></label>)}</div><div className={`audit-result ${auditForm.scores[5] < 80 ? "blocked" : "passed"}`}><HardHat size={18} /><div><strong>{auditForm.scores[5] < 80 ? "Safety gate will fail" : "Safety gate will pass"}</strong><span>Projected overall score: {average(auditForm.scores)}%</span></div></div><div className="six-button-row"><button onClick={() => setAuditFormOpen(false)}>Cancel</button><button className="primary" onClick={submitAudit}><ClipboardCheck size={15} /> Submit audit</button></div></section></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.six-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.six-sidebar{position:fixed;inset:0 auto 0 0;width:270px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744 70%,#0b3155)}.six-brand{height:58px;display:flex;align-items:center;justify-content:center;padding:7px;border-radius:13px;background:#fff}.six-brand img{max-width:205px;max-height:45px}.six-northstar{margin-top:8px;background:#020914}.six-company{display:grid;gap:4px;margin:18px 0;padding:14px;border:1px solid #31536f;border-radius:13px;background:#0b2b4a}.six-company small,.six-side-footer small{color:#86b4da;font-size:8px;font-weight:900;letter-spacing:.13em}.six-company strong{font-size:18px}.six-company span{color:#bfd3e4;font-size:9px}.six-sidebar nav{display:grid;gap:5px}.six-sidebar nav button{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:11px;border:1px solid transparent;border-radius:10px;color:#bfd2e3;background:transparent;text-align:left;font-size:10px;font-weight:850}.six-sidebar nav button:hover,.six-sidebar nav button.active{color:#fff;border-color:#315777;background:#0d4a7c}.six-side-footer{display:grid;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid #2a4b66;color:#c4d7e7;font-size:9px}.six-side-footer span,.six-side-footer a{display:flex;align-items:center;gap:7px}.six-side-footer a{margin-top:5px;padding:10px;border-radius:9px;color:#fff;background:#0a66ff;text-decoration:none;font-weight:900}.six-main{margin-left:270px}.six-topbar{min-height:70px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d6e2eb;background:#fff}.six-topbar>div:first-child{margin-right:auto}.six-topbar small,.six-topbar strong{display:block}.six-topbar small{color:#698196;font-size:8px;font-weight:900;letter-spacing:.12em}.six-topbar strong{font-size:17px}.six-top-actions{display:flex;align-items:center;gap:8px}.six-top-actions>span{padding:7px 10px;border-radius:999px;color:#765313;background:#fff0cd;font-size:9px;font-weight:900}.six-top-actions button,.six-toolbar button,.six-toolbar a,.six-button-row button,.six-table button,.icon-actions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 11px;border:1px solid #bfd0df;border-radius:9px;color:#153c5f;background:#fff;font-size:9px;font-weight:900;text-decoration:none;cursor:pointer}.six-content{max-width:1580px;margin:0 auto;padding:23px 24px 70px}.six-notice{position:sticky;top:8px;z-index:20;display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:12px 14px;border:1px solid #7cb9ec;border-radius:12px;color:#0b4d85;background:#e9f5ff;box-shadow:0 12px 35px rgba(26,74,112,.15);font-size:10px;font-weight:850}.six-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.6fr);gap:17px}.six-hero>div:first-child{padding:30px;border-radius:23px;color:#fff;background:radial-gradient(circle at 95% 0%,rgba(68,211,255,.26),transparent 32%),linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.22)}.six-hero small,.six-heading small,.six-section-title small{color:#8ecbff;font-size:8px;font-weight:900;letter-spacing:.13em}.six-hero h1{max-width:940px;margin:13px 0 12px;font-size:clamp(31px,4vw,54px);line-height:1.02}.six-hero p{max-width:920px;margin:0;color:#d6e8f6;line-height:1.65}.six-hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.six-hero-actions button,.six-hero-actions a,.six-open-link{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:0 13px;border:1px solid #95c4eb;border-radius:10px;color:#fff;background:#0a66ff;text-decoration:none;font-size:10px;font-weight:900;cursor:pointer}.six-hero-actions .outline,.six-hero-actions a{color:#0d3558;background:#fff}.six-pillars{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:21px}.six-pillars span{display:flex;align-items:center;gap:5px;padding:8px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(4,27,49,.25);font-size:8px;font-weight:850}.six-pillars b{color:#76c9ff}.six-score-card{display:grid;place-items:center;align-content:center;padding:22px;border:1px solid #d6e3ec;border-radius:22px;background:#fff;text-align:center}.six-score-card>small{color:#6b8295}.six-ring{width:170px;height:170px;display:grid;place-items:center;margin:15px 0;border-radius:50%;background:conic-gradient(#0a66ff var(--score),#dbe7ef 0)}.six-ring>div{width:132px;height:132px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.six-ring strong,.six-ring span{display:block}.six-ring strong{font-size:45px}.six-ring span{color:#6c8397;font-size:9px}.six-score-card>b{color:#a5670b}.six-score-card>em{margin-top:5px;color:#687f93;font-size:8px}.safety-gate{display:flex;align-items:center;gap:6px;margin-top:13px;padding:8px 10px;border-radius:999px;color:#185a43;background:#e7f7ef;font-size:8px;font-weight:900}.six-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:11px;margin-top:15px}.six-metrics article,.six-panel{border:1px solid #d9e4ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.six-metrics article{position:relative;padding:16px}.six-metrics article>span{position:absolute;right:14px;top:14px;width:36px;height:36px;display:grid;place-items:center;border-radius:11px;color:#0a66ff;background:#e8f2ff}.six-metrics small,.six-metrics strong,.six-metrics em{display:block}.six-metrics small{color:#6e8598;font-size:8px;font-weight:900;text-transform:uppercase}.six-metrics strong{margin-top:8px;font-size:27px}.six-metrics em{margin-top:4px;color:#657c90;font-size:8px}.six-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.six-panel{padding:19px;margin-bottom:16px}.section-card{padding:17px}.six-heading,.six-section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px}.six-heading h2,.six-section-title h2{margin:5px 0 0}.six-heading p,.six-section-title p{margin:5px 0 0;color:#62798d;font-size:10px;line-height:1.5}.six-heading>svg,.six-section-title>svg{color:#0a66ff}.six-section-title{padding-bottom:11px;border-bottom:1px solid #dce6ee}.six-section-title small{color:#6783a0}.six-area-bars{display:grid;gap:10px}.six-area-bars button{padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.six-area-bars button>span{display:flex;justify-content:space-between;font-size:10px}.six-area-bars em{font-style:normal;font-weight:900}.six-area-bars i,.pillar-detail i{height:9px;display:block;margin-top:5px;overflow:hidden;border-radius:999px;background:#e3edf4}.six-area-bars i b,.pillar-detail i b{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#45cfff)}.six-area-bars button>small{display:flex;align-items:center;gap:8px;margin-top:6px;color:#6a8194}.six-roadmap,.six-rhythm{display:grid;gap:8px}.six-roadmap>div,.six-rhythm>div{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;padding:10px;border-bottom:1px solid #e3ebf1}.six-roadmap span,.six-rhythm span{grid-row:1/3;width:38px;min-height:34px;display:grid;place-items:center;border-radius:9px;color:#0a66ff;background:#e8f2ff;font-size:9px;font-weight:950}.six-roadmap small,.six-rhythm small{color:#6a8093;font-size:8px}.six-action-list{display:grid;gap:8px}.six-action-list>div{display:grid;grid-template-columns:auto 1fr auto;gap:4px 9px;align-items:center;padding:10px;border-bottom:1px solid #e3ebf1}.six-action-list>div>span{grid-row:1/3;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900}.six-action-list small{color:#6c8295;font-size:8px}.six-action-list button{grid-column:3;grid-row:1/3;display:flex;align-items:center;gap:5px;padding:7px 8px;border:1px solid #c8d9e6;border-radius:8px;color:#155b43;background:#edf9f4;font-size:8px;font-weight:900;cursor:pointer}.six-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:11px}.six-toolbar .primary,.six-button-row .primary{border-color:#0a66ff;color:#fff;background:#0a66ff}.six-filters{display:grid;grid-template-columns:minmax(280px,1fr) 190px 190px;gap:9px;margin-bottom:11px}.six-filters label{display:flex;align-items:center;gap:7px;padding:0 10px;border:1px solid #c9d8e4;border-radius:9px;background:#fff}.six-filters label input{border:0;padding-left:0}.six-table{overflow:auto;border:1px solid #d8e4ed;border-radius:13px}.six-table table{width:100%;border-collapse:collapse;min-width:980px}.six-table th,.six-table td{padding:10px;border-bottom:1px solid #e2eaf0;text-align:left;font-size:9px;vertical-align:middle}.six-table th{color:#526d82;background:#f2f7fb;font-size:8px;text-transform:uppercase}.six-table td strong,.six-table td small{display:block}.six-table td small{margin-top:3px;color:#71879a}.six-tag{display:inline-flex!important;width:max-content;padding:5px 7px;border-radius:999px;font-size:8px!important;font-weight:900}.good{color:#176748!important;background:#e4f7ee!important}.warn{color:#85540b!important;background:#fff0d4!important}.bad{color:#922d3a!important;background:#ffe5e9!important}.blue{color:#175c91!important;background:#e7f3fc!important}.area-identity{display:flex;align-items:center;gap:9px}.area-identity>span{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;color:#fff;background:#2769ef}.mini-bar{width:90px;height:6px;margin-top:5px;overflow:hidden;border-radius:999px;background:#e1eaf1}.mini-bar i{height:100%;display:block;border-radius:999px;background:#0a66ff}.icon-actions{display:flex;gap:4px}.icon-actions button{width:31px;min-height:31px;padding:0}.six-rule-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.six-rule-grid>div{display:flex;align-items:center;gap:9px;padding:11px;border:1px solid #dce6ed;border-radius:11px;background:#f8fbfd}.six-rule-grid span{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;color:#0a66ff;background:#e8f2ff;font-size:9px;font-weight:950}.six-copy{color:#577087;font-size:11px;line-height:1.7}.six-callout,.six-alert{display:flex;gap:10px;margin-top:13px;padding:13px;border-left:4px solid #0a66ff;border-radius:10px;color:#174d78;background:#e9f5ff;font-size:9px;line-height:1.5}.six-safety-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.six-safety-grid>div{display:grid;grid-template-columns:auto 1fr;gap:4px 9px;padding:13px;border:1px solid #dce6ed;border-radius:12px;background:#f8fbfd}.six-safety-grid svg{grid-row:1/3;color:#16845c}.six-safety-grid span{color:#6a8194;font-size:8px}.six-value-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.six-value-grid>div{padding:13px;border:1px solid #dbe6ee;border-radius:12px;background:#f8fbfd}.six-value-grid small,.six-value-grid strong,.six-value-grid span{display:block}.six-value-grid small{color:#6d8396;font-size:8px;font-weight:900;text-transform:uppercase}.six-value-grid strong{margin-top:7px;font-size:21px}.six-value-grid span{margin-top:4px;color:#687f93;font-size:8px}.six-open-link{margin-top:13px}.six-modal-backdrop{position:fixed;inset:0;z-index:600;display:grid;place-items:center;padding:18px;background:rgba(3,15,27,.76);backdrop-filter:blur(8px)}.six-modal{width:min(760px,96vw);max-height:92vh;overflow:auto;padding:21px;border:1px solid #d4e1eb;border-radius:20px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.38)}.area-modal{width:min(900px,96vw)}.six-modal-head{display:flex;align-items:flex-start;gap:12px;padding-bottom:14px;border-bottom:1px solid #dce6ee}.six-modal-head>div{margin-right:auto}.six-modal-head small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.13em}.six-modal-head h2{margin:6px 0 3px}.six-modal-head p{margin:0;color:#657d91;font-size:9px}.six-modal-head>button{width:36px;height:36px;display:grid;place-items:center;border:1px solid #c7d8e5;border-radius:9px;color:#31516b;background:#fff;cursor:pointer}.six-form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:15px}.six-form-grid label{display:grid;gap:6px;color:#49657c;font-size:9px;font-weight:850}.six-form-grid .full{grid-column:1/-1}.six-form-grid .checkbox{display:flex;align-items:center;gap:8px;padding:11px;border:1px solid #d5e2eb;border-radius:10px;background:#f8fbfd}.six-form-grid .checkbox input{width:auto}.six-shell input,.six-shell select,.six-shell textarea{width:100%;padding:10px 11px;border:1px solid #c7d7e3;border-radius:9px;color:#153149;background:#fff;font:inherit;outline:none}.six-shell textarea{min-height:82px;resize:vertical}.six-shell input:focus,.six-shell select:focus,.six-shell textarea:focus{border-color:#0a66ff;box-shadow:0 0 0 3px rgba(10,102,255,.11)}.six-button-row{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}.area-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:15px 0}.area-summary>div{padding:12px;border:1px solid #dce6ed;border-radius:11px;background:#f8fbfd}.area-summary small,.area-summary strong{display:block}.area-summary small{color:#6c8397;font-size:8px;text-transform:uppercase}.area-summary strong{margin-top:6px}.pillar-detail{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}.pillar-detail span{display:flex;justify-content:space-between;font-size:9px}.pillar-detail em{font-style:normal;font-weight:900}.six-alert{border-left-color:#c53a4c;color:#7f2834;background:#fff0f2}.six-alert p{margin:4px 0 0}.audit-score-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:15px}.audit-score-grid label{padding:11px;border:1px solid #dce6ed;border-radius:11px;background:#f8fbfd}.audit-score-grid label>span{display:flex;justify-content:space-between;font-size:9px}.audit-score-grid em{font-style:normal;font-weight:900}.audit-score-grid input{padding:0;box-shadow:none}.audit-result{display:flex;align-items:center;gap:9px;margin-top:13px;padding:12px;border-radius:11px;font-size:9px}.audit-result strong,.audit-result span{display:block}.audit-result span{margin-top:3px}.audit-result.passed{color:#176748;background:#e4f7ee}.audit-result.blocked{color:#922d3a;background:#ffe5e9}@media(max-width:1100px){.six-pillars{grid-template-columns:repeat(3,1fr)}.six-safety-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:850px){.six-sidebar{position:static;width:auto;height:auto}.six-main{margin-left:0}.six-sidebar nav{grid-template-columns:repeat(2,1fr)}.six-side-footer{display:none}.six-hero,.six-two{grid-template-columns:1fr}.six-filters{grid-template-columns:1fr}.six-topbar{align-items:flex-start;gap:10px;padding:14px;flex-direction:column}.six-top-actions{width:100%;flex-wrap:wrap}.six-content{padding:14px}.six-pillars,.six-safety-grid,.area-summary,.pillar-detail,.audit-score-grid,.six-form-grid{grid-template-columns:1fr}.six-form-grid .full{grid-column:auto}.six-rule-grid,.six-value-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
