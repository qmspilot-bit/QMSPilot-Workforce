"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";
import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";
import { BranchGuidedWorkflow } from "./BranchGuidedWorkflow";
import { iconMap } from "./shared";
import { smartWorkspaceStyles } from "./styles";

const field = (
  key: string,
  label: string,
  type: FieldDef["type"],
  section: FieldDef["section"],
  required = false,
  options?: string[],
  help?: string,
): FieldDef => ({ key, label, type, section, required, options, help });

const makeTool = (
  id: string,
  name: string,
  group: string,
  description: string,
  icon: string,
  fields: FieldDef[],
): WorkflowTool => ({
  id,
  name,
  group,
  description,
  icon,
  kind: "work",
  procedure: {
    id: `BR-${id}`,
    title: `${name} Standard Work`,
    revision: "A",
    owner: "Branch General Manager",
    standards: ["Northstar controlled workflow", "Branch operating standard"],
  },
  stages: ["Create", "Assign", "Work", "Update", "Verify", "Close"],
  fields,
  controls: [
    "Owner and due date are controlled",
    "Exceptions and blockers are visible",
    "Completion requires objective verification",
    "Critical risk escalates to branch leadership",
  ],
  approvalRoles: ["Branch General Manager", "Process Owner"],
  evidenceRequired: false,
  evidenceGuidance: ["Photographs or documents", "System transaction or customer communication", "Completion verification"],
  escalations: [{
    when: "Critical, overdue, blocked, safety-related, or customer-impacting",
    route: "Branch General Manager and Pilot decision queue",
  }],
});

const tools: WorkflowTool[] = [
  makeTool("01.01", "Customer Promise Tracker", "Customer Service", "Create every customer commitment, assign an owner, set the due date, and track it through verified completion.", "CalendarCheck", [
    field("customer", "Customer", "text", "Record Context", true),
    field("promise", "Promise / commitment", "textarea", "Evaluation", true, undefined, "State exactly what was promised to the customer."),
    field("customer_contact", "Customer contact", "text", "Record Context"),
    field("status", "Current status / blocker", "textarea", "Response & Action"),
    field("updated", "Customer updated?", "select", "Response & Action", false, ["No", "Yes"]),
    field("verification", "Completion evidence", "textarea", "Closure"),
  ]),
  makeTool("02.01", "Receiving Workflow", "Material Flow", "Create and track incoming shipments through count, inspection, reconciliation, and put-away.", "PackageCheck", [
    field("shipment", "Shipment / PO", "text", "Record Context", true),
    field("supplier", "Supplier", "text", "Record Context", true),
    field("expected", "Expected quantity", "number", "Evaluation"),
    field("received", "Received quantity", "number", "Evaluation"),
    field("condition", "Condition / damage result", "textarea", "Evaluation"),
    field("location", "Put-away location", "text", "Closure"),
    field("reconciled", "System reconciled?", "select", "Closure", false, ["No", "Yes"]),
  ]),
  makeTool("03.01", "Inventory Exception Workflow", "Inventory Control", "Create a controlled stock discrepancy, assign investigation, correct the quantity, and trend recurrence.", "Boxes", [
    field("item", "Item / SKU", "text", "Record Context", true),
    field("location", "Bin / location", "text", "Record Context", true),
    field("expected", "Expected quantity", "number", "Evaluation", true),
    field("actual", "Actual quantity", "number", "Evaluation", true),
    field("cause", "Cause category", "select", "Evaluation", false, ["Receiving", "Put-away", "Picking", "VMI", "Count error", "Damage", "Unknown"]),
    field("root", "Root cause / finding", "textarea", "Evaluation"),
    field("correction", "Correction", "textarea", "Response & Action"),
    field("verified", "Verified final quantity", "number", "Closure"),
  ]),
  makeTool("04.01", "Counter Sales Follow-Up", "Customer Service", "Create an owned callback when an item is unavailable and track the opportunity through recovery or closure.", "PhoneCall", [
    field("customer", "Customer", "text", "Record Context", true),
    field("item", "Requested item", "text", "Evaluation", true),
    field("quantity", "Quantity", "number", "Evaluation"),
    field("reason", "Why unavailable", "select", "Evaluation", true, ["Out of stock", "Backorder", "Not stocked", "Quote required", "Technical clarification"]),
    field("alternative", "Alternative / source", "textarea", "Response & Action"),
    field("contact", "Customer contact result", "textarea", "Closure"),
    field("result", "Sales result", "select", "Closure", false, ["Order recovered", "Alternative accepted", "Customer declined", "Still open"]),
  ]),
  makeTool("05.01", "VMI Route Manager", "VMI & Service", "Create and track customer visits, bin health, stock-outs, replenishment, and the next service date.", "Route", [
    field("customer", "Customer location", "text", "Record Context", true),
    field("route", "Route / stop", "text", "Record Context", true),
    field("health", "Bin health", "select", "Evaluation", true, ["Green", "Yellow", "Red"]),
    field("stockouts", "Stock-outs / risks", "textarea", "Evaluation"),
    field("replenished", "Items replenished", "textarea", "Response & Action"),
    field("notes", "Customer notes", "textarea", "Response & Action"),
    field("next", "Next visit", "date", "Closure"),
  ]),
  makeTool("06.01", "Employee Task Manager", "Daily Execution", "Create branch work, assign accountability, expose blockers, and verify completion.", "UserCheck", [
    field("task", "Task / commitment", "textarea", "Evaluation", true),
    field("area", "Department / area", "text", "Evaluation", true),
    field("blocked", "Blocked?", "select", "Evaluation", false, ["No", "Yes"]),
    field("blocker", "Blocker and support required", "textarea", "Response & Action"),
    field("completion", "Completion result", "textarea", "Closure"),
    field("verified", "Verified by", "text", "Closure"),
  ]),
  makeTool("07.01", "Safety & Facility", "Safety & Facility", "Create and control hazards, incidents, inspections, repairs, housekeeping, and corrective actions.", "ShieldCheck", [
    field("type", "Type", "select", "Evaluation", true, ["Safety concern", "Near miss", "Incident", "Facility repair", "Inspection finding", "Housekeeping"]),
    field("location", "Location", "text", "Evaluation", true),
    field("risk", "Risk level", "select", "Evaluation", true, ["Low", "Moderate", "High", "Critical"]),
    field("immediate", "Immediate action", "textarea", "Response & Action"),
    field("corrective", "Corrective action", "textarea", "Response & Action"),
    field("verification", "Closure verification", "textarea", "Closure"),
  ]),
  makeTool("08.01", "Vendor Performance", "Supplier Performance", "Create supplier performance reviews covering delivery, fill rate, quality, responsiveness, risk, and action.", "Truck", [
    field("vendor", "Vendor", "text", "Record Context", true),
    field("otd", "On-time delivery %", "number", "Evaluation"),
    field("fill", "Fill rate %", "number", "Evaluation"),
    field("quality", "Damage / quality issue rate %", "number", "Evaluation"),
    field("response", "Communication score", "number", "Evaluation"),
    field("risk", "Vendor risk", "select", "Evaluation", true, ["Green", "Yellow", "Red"]),
    field("action", "Required supplier action", "textarea", "Response & Action"),
    field("decision", "Approval decision", "select", "Closure", false, ["Approved", "Conditional", "Development required", "Disqualified"]),
  ]),
];

const config: WorkspaceConfig = {
  discipline: "Branch Operations",
  slug: "smart-branch",
  name: "Smart Branch",
  tag: "CONNECTED INDUSTRIAL DISTRIBUTION WORKSPACE",
  description: "Run the branch from one clear operating rhythm—customer commitments, material flow, inventory, VMI, people, vendors, and safety.",
  health: 100,
  healthText: "Controlled with focused attention",
  attention: "New records immediately feed the General Manager dashboard.",
  startToolId: "01.01",
  metrics: [],
  insights: [
    ["Pilot", "Create the commitment or issue immediately; complete closure details as the work progresses.", "High"],
    ["Beacon", "Customer promises and callbacks stay visible until verified complete.", "Moderate"],
    ["Forge", "Inventory and receiving exceptions are trended by workflow and owner.", "High"],
  ],
  queues: [],
  tools,
};

type BranchRecord = {
  recordId: string;
  toolId: string;
  toolName: string;
  title: string;
  customer?: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
  submittedAt: string;
};

const labels: Record<string, string> = {
  "01.01": "Customer Promise",
  "02.01": "Receiving Record",
  "03.01": "Inventory Exception",
  "04.01": "Customer Follow-Up",
  "05.01": "VMI Visit",
  "06.01": "Employee Task",
  "07.01": "Safety / Facility Record",
  "08.01": "Vendor Review",
};

const readRecords = (): BranchRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("qmspilot:northstar:smart-branch-records") || "[]");
  } catch {
    return [];
  }
};

export default function SmartBranchWorkspace() {
  const [selected, setSelected] = useState<WorkflowTool | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [records, setRecords] = useState<BranchRecord[]>([]);

  useEffect(() => {
    setRecords(readRecords());
    const refresh = () => setRecords(readRecords());
    window.addEventListener("qmspilot:smart-branch-record-submitted", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("qmspilot:smart-branch-record-submitted", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const groups = ["All", ...Array.from(new Set(tools.map(tool => tool.group)))];
  const filtered = useMemo(() => tools.filter(tool =>
    (group === "All" || tool.group === group)
    && `${tool.name} ${tool.description} ${tool.procedure.title}`.toLowerCase().includes(query.toLowerCase()),
  ), [query, group]);

  const counts = useMemo(() => Object.fromEntries(tools.map(tool => [tool.id, records.filter(record => record.toolId === tool.id && record.status !== "Completed").length])), [records]);
  const overdue = records.filter(record => record.status !== "Completed" && record.dueDate && record.dueDate < new Date().toISOString().slice(0, 10)).length;
  const critical = records.filter(record => record.status !== "Completed" && record.priority === "Critical").length;
  const health = Math.max(45, 100 - overdue * 6 - critical * 4);
  const startTool = tools[0];

  const dynamicMetrics = [
    ["Open customer promises", String(counts["01.01"] || 0), "Tracked until verified complete"],
    ["Receiving records", String(counts["02.01"] || 0), "Incoming material queue"],
    ["Inventory exceptions", String(counts["03.01"] || 0), "Owned discrepancy records"],
    ["Customer follow-ups", String(counts["04.01"] || 0), "Callbacks and recovered sales"],
    ["VMI visits", String(counts["05.01"] || 0), "Customer service route queue"],
    ["Safety actions", String(counts["07.01"] || 0), `${overdue} total overdue records`],
  ];

  return <main className="smart-shell">
    <aside className="smart-sidebar">
      <div className="smart-logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
      <div className="smart-northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
      <nav>
        <a href="/">Command Center</a>
        <a href="/executive-intelligence">Executive Intelligence</a>
        <a href="/workforce-operations">AI Workforce Operations</a>
        <a href="/entity-graph">Entity Graph</a>
        <a href="/dashboard">Accountability</a>
        <a href="/toolbox">Workspaces</a>
        <a className="active" href="/smart-branch">Smart Branch</a>
      </nav>
      <div className="smart-status">
        <small>SMART BRANCH STATUS</small>
        <span>● 8 create-and-track workflows online</span>
        <span>● GM dashboard auto-routing enabled</span>
        <span>● Rich evidence capture enabled</span>
        <span>● Draft and open-record control enabled</span>
      </div>
    </aside>

    <section className="smart-main">
      <header className="smart-topbar">
        <div><small>QMSPILOT NORTHSTAR</small><strong>Smart Branch</strong></div>
        <a href="/toolbox"><ArrowLeft size={15} /> Workspaces</a>
        <span>Create once · track automatically</span>
      </header>

      <div className="smart-content">
        {selected ? <BranchGuidedWorkflow key={selected.id} config={config} tool={selected} onBack={() => setSelected(null)} /> : <>
          <section className="smart-hero">
            <div>
              <small>{config.tag}</small>
              <h1>{config.description}</h1>
              <p>Click Create New, enter the essential facts, attach evidence when useful, and save. Northstar automatically places the record in the correct General Manager dashboard queue.</p>
              <div className="smart-hero-actions">
                <button onClick={() => setSelected(startTool)}>Create New Customer Promise <ArrowRight size={16} /></button>
                <button className="outline" onClick={() => document.getElementById("branch-tools")?.scrollIntoView({ behavior: "smooth" })}>Browse Create New options <ClipboardCheck size={16} /></button>
              </div>
            </div>
            <div className="smart-health">
              <small>SMART BRANCH HEALTH</small>
              <div className="smart-ring"><div><strong>{health}</strong><span>out of 100</span></div></div>
              <b>{records.length ? `${records.length} tracked records` : "Ready for live branch records"}</b>
              <em>{overdue ? `${overdue} overdue records require attention` : "No overdue records in this browser"}</em>
            </div>
          </section>

          <section className="smart-metrics">{dynamicMetrics.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</section>

          <section className="smart-two">
            <article className="smart-panel">
              <div className="smart-heading"><div><small>AI BRANCH INSIGHTS</small><h2>What the General Manager needs to know</h2></div><Sparkles /></div>
              <div className="smart-insights">{config.insights.map(([agent, text, level]) => <div key={text}><span>{agent}</span><p>{text}</p><em className={level.toLowerCase()}>{level}</em></div>)}</div>
            </article>
            <article className="smart-panel">
              <div className="smart-heading"><div><small>GENERAL MANAGER QUEUES</small><h2>Live tracked work</h2></div><BarChart3 /></div>
              <div className="smart-queues">
                {tools.slice(0, 6).map(tool => <div key={tool.id}><span>{tool.name}</span><strong>{counts[tool.id] || 0}</strong><em>Open records in this queue</em></div>)}
              </div>
            </article>
          </section>

          <section className="smart-panel branch-dashboard">
            <div className="smart-section-head">
              <div><small>LIVE GENERAL MANAGER DASHBOARD</small><h2>Recently created Smart Branch records</h2></div>
              <button onClick={() => setSelected(startTool)}>+ Create New Customer Promise</button>
            </div>
            {records.length ? <div className="branch-record-table">
              <div className="branch-record-head"><span>Record</span><span>Workflow</span><span>Work</span><span>Owner</span><span>Due</span><span>Priority</span><span>Status</span></div>
              {records.slice(0, 10).map(record => <div key={record.recordId}>
                <span>{record.recordId}</span><span>{record.toolName}</span><strong>{record.title}</strong><span>{record.owner}</span><span>{record.dueDate}</span><em className={record.priority.toLowerCase()}>{record.priority}</em><b>{record.status}</b>
              </div>)}
            </div> : <div className="branch-empty"><CheckCircle2 /><div><strong>No live branch records yet.</strong><span>Create a customer promise or any other workflow record and it will appear here automatically.</span></div></div>}
          </section>

          <section className="workflow-standard">
            <div><ShieldCheck size={24} /><span><small>CONNECTED BRANCH STANDARD</small><strong>Create once. Track it in the proper queue automatically.</strong></span></div>
            <p>Save Draft keeps unfinished work private to the current browser. Save to Dashboard creates the official open Smart Branch record and feeds the General Manager view.</p>
          </section>

          <section id="branch-tools" className="smart-tool-section">
            <div className="smart-section-head"><div><small>SMART BRANCH WORKFLOWS</small><h2>Create new branch records</h2></div><span>{filtered.length} workflows available</span></div>
            <div className="smart-filters">
              <label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search customer promises, receiving, inventory, VMI, vendors, tasks, or safety" /></label>
              <select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(item => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="smart-tool-grid">{filtered.map(tool => {
              const Icon = iconMap[tool.icon] ?? Building2;
              return <button className="smart-tool" onClick={() => setSelected(tool)} key={tool.id}>
                <div><span><Icon size={22} /></span><em>{tool.group}</em></div>
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
                <div className="tool-control-row"><small>{tool.procedure.id}</small><small>{tool.fields.filter(item => item.required).length} creation inputs</small><small>Evidence available</small><small>{counts[tool.id] || 0} open</small></div>
                <b>Create New {labels[tool.id]} <ArrowRight size={15} /></b>
              </button>;
            })}</div>
          </section>
        </>}
      </div>
    </section>

    <style>{smartWorkspaceStyles}</style>
    <style>{`
      .smart-tool .tool-control-row{gap:5px}.smart-tool .tool-control-row small:last-child{color:#176747;background:#e4f8ef}.branch-dashboard{margin-top:17px}.branch-dashboard .smart-section-head{margin:0 0 12px}.branch-dashboard .smart-section-head button{min-height:40px;padding:0 13px;border:0;border-radius:10px;color:#fff;background:#0a66ff;font-size:10px;font-weight:900;cursor:pointer}.branch-record-table{overflow:auto}.branch-record-head,.branch-record-table>div:not(.branch-record-head){min-width:980px;display:grid;grid-template-columns:1.1fr 1.25fr 2fr .8fr .9fr .7fr .7fr;gap:10px;align-items:center;padding:11px;border-bottom:1px solid #e2eaf0;font-size:9px}.branch-record-head{color:#6f8597;font-size:8px;font-weight:900;text-transform:uppercase}.branch-record-table strong{font-size:10px}.branch-record-table em{justify-self:start;padding:5px 7px;border-radius:999px;font-size:8px;font-style:normal;font-weight:900}.branch-record-table em.critical{color:#8f1f2c;background:#ffe7ea}.branch-record-table em.high{color:#85520a;background:#fff0d5}.branch-record-table em.medium,.branch-record-table em.low{color:#176747;background:#e4f8ef}.branch-record-table b{color:#315f80}.branch-empty{display:flex;align-items:center;gap:11px;padding:22px;border:1px dashed #afc9dc;border-radius:13px;color:#315f80;background:#f7fbfe}.branch-empty strong,.branch-empty span{display:block}.branch-empty span{margin-top:4px;color:#6b8295;font-size:9px}
    `}</style>
  </main>;
}
