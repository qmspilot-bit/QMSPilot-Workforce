"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

type WorkStatus = "Open" | "In Progress" | "Blocked" | "Completed";
type BranchRecord = {
  recordId: string;
  toolId: string;
  toolName: string;
  title: string;
  customer?: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: WorkStatus;
  submittedAt: string;
  values?: Record<string, string>;
  evidence?: unknown[];
};

const workflows = [
  ["01.01", "Customer Promises"],
  ["02.01", "Receiving"],
  ["03.01", "Inventory Exceptions"],
  ["04.01", "Customer Follow-Ups"],
  ["05.01", "VMI Visits"],
  ["06.01", "Employee Tasks"],
  ["07.01", "Safety & Facility"],
  ["08.01", "Vendor Performance"],
] as const;

const storageKey = "qmspilot:northstar:smart-branch-records";
const today = () => new Date().toISOString().slice(0, 10);
const readRecords = (): BranchRecord[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function SmartBranchDashboardPage() {
  const [records, setRecords] = useState<BranchRecord[]>([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tool");
    if (requested && workflows.some(([id]) => id === requested)) setFilter(requested);
    setRecords(readRecords());
    const refresh = () => setRecords(readRecords());
    window.addEventListener("storage", refresh);
    window.addEventListener("qmspilot:smart-branch-record-submitted", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("qmspilot:smart-branch-record-submitted", refresh);
    };
  }, []);

  const filtered = useMemo(() => records.filter(record => {
    const matchesWorkflow = filter === "All" || record.toolId === filter;
    const haystack = `${record.recordId} ${record.toolName} ${record.title} ${record.customer || ""} ${record.owner} ${record.status}`.toLowerCase();
    return matchesWorkflow && haystack.includes(query.toLowerCase());
  }), [records, filter, query]);

  const open = records.filter(record => record.status !== "Completed");
  const overdue = open.filter(record => record.dueDate && record.dueDate < today()).length;
  const blocked = open.filter(record => record.status === "Blocked").length;
  const critical = open.filter(record => record.priority === "Critical").length;
  const completion = records.length ? Math.round(records.filter(record => record.status === "Completed").length / records.length * 100) : 100;
  const selectedName = filter === "All" ? "General Manager" : workflows.find(([id]) => id === filter)?.[1] || "Workflow";

  const counts = Object.fromEntries(workflows.map(([id]) => [id, open.filter(record => record.toolId === id).length]));

  const advance = (recordId: string) => {
    const order: WorkStatus[] = ["Open", "In Progress", "Blocked", "Completed"];
    const next = records.map(record => record.recordId === recordId
      ? { ...record, status: order[(order.indexOf(record.status) + 1) % order.length] }
      : record);
    setRecords(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  return <main className="branch-dash-shell">
    <aside>
      <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
      <div className="north"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
      <a className="back" href="/smart-branch"><ArrowLeft size={15} /> Smart Branch Workspace</a>
      <nav>
        <button className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}><BarChart3 size={15} /> General Manager Dashboard</button>
        {workflows.map(([id, name]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}><span>{counts[id] || 0}</span>{name}</button>)}
      </nav>
      <div className="status"><small>LIVE OPERATING RECORD</small><span>● Saved actions route here automatically</span><span>● Every open item keeps an owner and due date</span><span>● Pilot, Beacon, and Forge surface risk</span></div>
    </aside>

    <section className="main">
      <header>
        <div><small>QMSPILOT NORTHSTAR · SMART BRANCH</small><strong>{selectedName} Dashboard</strong></div>
        <a href="/smart-branch"><Plus size={15} /> Create New Record</a>
      </header>

      <div className="content">
        <section className="hero">
          <div><small>BRANCH OPERATING COMMAND CENTER</small><h1>{selectedName} Dashboard</h1><p>Every saved promise, exception, visit, task, safety action, receiving record, and vendor review is visible, owned, and tracked here.</p></div>
          <div className="health"><strong>{Math.max(45, 100 - overdue * 7 - blocked * 5 - critical * 4)}</strong><span>Branch health</span><b>{open.length} open · {overdue} overdue</b></div>
        </section>

        <section className="metrics">
          <article><Clock3 /><small>Open work</small><strong>{open.length}</strong><span>Across all branch queues</span></article>
          <article><RefreshCw /><small>Overdue</small><strong>{overdue}</strong><span>Requires owner action</span></article>
          <article><ShieldCheck /><small>Blocked</small><strong>{blocked}</strong><span>Needs support or escalation</span></article>
          <article><CheckCircle2 /><small>Closure rate</small><strong>{completion}%</strong><span>Verified completed records</span></article>
        </section>

        <section className="ai-grid">
          <article><div><BrainCircuit /><span><small>PILOT</small><strong>Daily branch priority</strong></span></div><p>{critical ? `${critical} critical record${critical === 1 ? "" : "s"} require leadership attention before routine work.` : overdue ? `Resolve ${overdue} overdue commitment${overdue === 1 ? "" : "s"} and confirm customer impact.` : "No critical or overdue records. Protect today's due commitments and maintain the operating rhythm."}</p></article>
          <article><div><Sparkles /><span><small>BEACON</small><strong>Customer risk</strong></span></div><p>{counts["01.01"] || counts["04.01"] ? `${counts["01.01"] || 0} open promises and ${counts["04.01"] || 0} customer follow-ups remain visible.` : "No open customer promises or counter follow-ups are recorded."}</p></article>
          <article><div><Users /><span><small>FORGE</small><strong>Execution discipline</strong></span></div><p>{blocked ? `${blocked} blocked record${blocked === 1 ? "" : "s"} should be reviewed for recurring process constraints.` : "No blocked records. Continue verifying evidence and closure before marking work complete."}</p></article>
        </section>

        <section className="panel">
          <div className="panel-head"><div><small>CONTROLLED WORK QUEUE</small><h2>{selectedName} Records</h2></div><a href="/smart-branch"><Plus size={15} /> Create New</a></div>
          <div className="filters"><label><Filter size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search records, customers, owners, or status" /></label><span>{filtered.length} records shown</span></div>
          {filtered.length ? <div className="table">
            <div className="row head"><span>Record</span><span>Work</span><span>Customer</span><span>Owner</span><span>Due</span><span>Priority</span><span>Status</span><span>Action</span></div>
            {filtered.map(record => <div className="row" key={record.recordId}>
              <span>{record.recordId}</span><strong>{record.title}</strong><span>{record.customer || "—"}</span><span>{record.owner}</span><span className={record.dueDate < today() && record.status !== "Completed" ? "late" : ""}>{record.dueDate || "—"}</span><em className={record.priority.toLowerCase()}>{record.priority}</em><b>{record.status}</b><button onClick={() => advance(record.recordId)}>Advance <ArrowRight size={13} /></button>
            </div>)}
          </div> : <div className="empty"><CheckCircle2 /><div><strong>No records in this dashboard yet.</strong><span>Create and save a new action in Smart Branch; it will appear here automatically.</span></div><a href="/smart-branch">Create New Record</a></div>}
        </section>
      </div>
    </section>

    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8}.branch-dash-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.branch-dash-shell aside{position:fixed;inset:0 auto 0 0;width:260px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo,.north{height:57px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.north{margin-top:8px;background:#020914}.logo img,.north img{max-width:190px;max-height:47px}.back{display:flex;align-items:center;gap:7px;margin:16px 0;color:#b9d2e5;text-decoration:none;font-size:10px;font-weight:850}.branch-dash-shell nav{display:grid;gap:5px}.branch-dash-shell nav button{display:flex;align-items:center;gap:8px;width:100%;min-height:39px;padding:0 10px;border:0;border-radius:9px;color:#c6d9e8;background:transparent;text-align:left;font-size:10px;font-weight:850;cursor:pointer}.branch-dash-shell nav button.active{color:#fff;background:#15558a}.branch-dash-shell nav button span{min-width:25px;padding:4px;border-radius:999px;color:#0d4a7c;background:#dceeff;text-align:center;font-size:8px}.status{display:grid;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid #294960;color:#c4d8e7;font-size:9px}.status small{color:#79a7cb;font-weight:900;letter-spacing:.1em}.main{margin-left:260px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d6e2eb;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#71879a;font-size:8px;font-weight:900;letter-spacing:.12em}.main>header a,.panel-head a,.empty a{display:flex;align-items:center;gap:6px;min-height:38px;padding:0 12px;border-radius:9px;color:#fff;background:#0a66ff;text-decoration:none;font-size:9px;font-weight:900}.content{max-width:1500px;margin:auto;padding:24px 24px 80px}.hero{display:grid;grid-template-columns:1fr 250px;gap:16px;padding:27px;border-radius:22px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff)}.hero small{color:#6db7ff;font-size:8px;font-weight:900;letter-spacing:.12em}.hero h1{margin:10px 0 8px;font-size:40px}.hero p{max-width:850px;margin:0;color:#d4e7f5;line-height:1.6}.health{display:grid;place-items:center;align-content:center;border-radius:18px;background:rgba(3,24,45,.5)}.health strong{font-size:48px}.health span,.health b{font-size:9px}.health b{margin-top:6px;color:#9ed8b9}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}.metrics article,.ai-grid article,.panel{border:1px solid #d9e4ec;border-radius:16px;background:#fff;box-shadow:0 10px 25px rgba(20,55,82,.07)}.metrics article{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;padding:16px}.metrics svg{grid-row:1/4;color:#0a66ff}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#6e8598;font-size:8px;font-weight:900;text-transform:uppercase}.metrics strong{font-size:25px}.metrics span{color:#71879a;font-size:8px}.ai-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.ai-grid article{padding:16px}.ai-grid article>div{display:flex;align-items:center;gap:9px}.ai-grid svg{color:#0a66ff}.ai-grid small,.ai-grid strong{display:block}.ai-grid small{color:#0a66ff;font-size:8px;font-weight:900}.ai-grid p{margin:12px 0 0;color:#526e82;font-size:10px;line-height:1.55}.panel{margin-top:14px;padding:18px}.panel-head{display:flex;align-items:center}.panel-head>div{margin-right:auto}.panel-head small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.panel-head h2{margin:4px 0 0}.filters{display:flex;align-items:center;gap:10px;margin:14px 0}.filters label{display:flex;align-items:center;gap:7px;flex:1;padding:0 11px;border:1px solid #cadbe7;border-radius:10px}.filters input{width:100%;min-height:42px;border:0;outline:0}.filters>span{color:#6f8598;font-size:9px}.table{overflow:auto}.row{min-width:1100px;display:grid;grid-template-columns:1.1fr 1.8fr 1.1fr .9fr .9fr .7fr .8fr .8fr;gap:9px;align-items:center;padding:11px;border-bottom:1px solid #e2eaf0;font-size:9px}.row.head{color:#6c8396;font-size:8px;font-weight:900;text-transform:uppercase}.row strong{font-size:10px}.row em{justify-self:start;padding:5px 7px;border-radius:999px;font-style:normal;font-weight:900}.row em.critical{color:#8f1f2c;background:#ffe7ea}.row em.high{color:#85520a;background:#fff0d5}.row em.medium,.row em.low{color:#176747;background:#e4f8ef}.row b{color:#315f80}.row .late{color:#a22432;font-weight:900}.row button{display:flex;align-items:center;justify-content:center;gap:4px;min-height:32px;border:1px solid #bfd2e0;border-radius:8px;color:#245474;background:#fff;font-size:8px;font-weight:900;cursor:pointer}.empty{display:flex;align-items:center;gap:12px;padding:24px;border:1px dashed #aac5d8;border-radius:13px;background:#f8fcff}.empty>div{margin-right:auto}.empty strong,.empty span{display:block}.empty span{margin-top:4px;color:#6e8497;font-size:9px}@media(max-width:1000px){.metrics{grid-template-columns:1fr 1fr}.ai-grid{grid-template-columns:1fr}.hero{grid-template-columns:1fr}.health{padding:18px}}@media(max-width:760px){.branch-dash-shell aside{position:static;width:auto;height:auto}.main{margin-left:0}.metrics{grid-template-columns:1fr}.content{padding:15px}.hero h1{font-size:29px}}
    `}</style>
  </main>;
}
