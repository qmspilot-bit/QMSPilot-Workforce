"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  PhoneCall,
  Route,
  ShieldCheck,
  Truck,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

type Status = "Green" | "Yellow" | "Red";
type RecordStatus = "Open" | "In Progress" | "Blocked" | "Completed";
type WorkflowKey = "promises" | "receiving" | "inventory" | "counter" | "vmi" | "tasks" | "safety";

type BranchRecord = {
  id: string;
  workflow: WorkflowKey;
  title: string;
  customer?: string;
  owner: string;
  due: string;
  status: RecordStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  notes?: string;
  createdAt: string;
};

const workflowMeta: Record<WorkflowKey, { label: string; icon: typeof ClipboardCheck }> = {
  promises: { label: "Customer Promise Tracker", icon: CalendarCheck },
  receiving: { label: "Receiving Workflow", icon: PackageCheck },
  inventory: { label: "Inventory Exceptions", icon: Boxes },
  counter: { label: "Counter Sales Follow-Up", icon: PhoneCall },
  vmi: { label: "VMI Route Manager", icon: Route },
  tasks: { label: "Employee Task Manager", icon: UserCheck },
  safety: { label: "Safety & Facility", icon: ShieldCheck },
};

const seedRecords: BranchRecord[] = [
  { id: "SB-1001", workflow: "promises", title: "Deliver 200 bearings", customer: "ABC Manufacturing", owner: "John", due: "2026-08-06", status: "In Progress", priority: "Critical", notes: "Customer update due before noon.", createdAt: "2026-08-03T08:00:00.000Z" },
  { id: "SB-1002", workflow: "receiving", title: "Receive vendor shipment 77421", owner: "Jane", due: "2026-08-03", status: "Open", priority: "High", notes: "Count, inspect, photograph, and put away.", createdAt: "2026-08-03T08:15:00.000Z" },
  { id: "SB-1003", workflow: "inventory", title: "Aisle B4 cycle-count mismatch", owner: "Mike", due: "2026-08-04", status: "Blocked", priority: "High", notes: "Expected 480; actual 421.", createdAt: "2026-08-03T08:30:00.000Z" },
  { id: "SB-1004", workflow: "counter", title: "Source alternate hydraulic fitting", customer: "Delta Fabrication", owner: "Jane", due: "2026-08-03", status: "Open", priority: "High", notes: "Call customer when alternate is confirmed.", createdAt: "2026-08-03T08:45:00.000Z" },
  { id: "SB-1005", workflow: "vmi", title: "Service Route 3 bins", customer: "Pineywoods Industrial", owner: "Mike", due: "2026-08-03", status: "In Progress", priority: "Medium", notes: "Three low-stock bins flagged.", createdAt: "2026-08-03T09:00:00.000Z" },
  { id: "SB-1006", workflow: "tasks", title: "Complete dock housekeeping", owner: "John", due: "2026-08-03", status: "Completed", priority: "Medium", createdAt: "2026-08-03T09:15:00.000Z" },
  { id: "SB-1007", workflow: "safety", title: "Inspect eyewash station", owner: "Jane", due: "2026-08-05", status: "Open", priority: "Medium", createdAt: "2026-08-03T09:30:00.000Z" },
];

const vendors = [
  { name: "Industrial Supply Co.", onTime: 96, fill: 98, score: 97, status: "Green" as Status },
  { name: "Vendor XYZ", onTime: 71, fill: 84, score: 76, status: "Red" as Status },
  { name: "Regional Bearings", onTime: 88, fill: 93, score: 90, status: "Yellow" as Status },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SmartBranchPage() {
  const [records, setRecords] = useState<BranchRecord[]>(seedRecords);
  const [active, setActive] = useState<WorkflowKey | "dashboard" | "huddle" | "reporting">("dashboard");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ workflow: "promises" as WorkflowKey, title: "", customer: "", owner: "", due: todayIso(), priority: "Medium" as BranchRecord["priority"], notes: "" });

  useEffect(() => {
    const saved = window.localStorage.getItem("northstar-smart-branch-records");
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch { /* keep demo records */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("northstar-smart-branch-records", JSON.stringify(records));
  }, [records]);

  const metrics = useMemo(() => {
    const open = records.filter((r) => r.status !== "Completed");
    const overdue = open.filter((r) => r.due < todayIso());
    const promises = open.filter((r) => r.workflow === "promises");
    const discrepancies = open.filter((r) => r.workflow === "inventory");
    const callbacks = open.filter((r) => r.workflow === "counter");
    const tasks = open.filter((r) => r.workflow === "tasks");
    const safety = open.filter((r) => r.workflow === "safety");
    const completed = records.filter((r) => r.status === "Completed");
    const completion = records.length ? Math.round((completed.length / records.length) * 100) : 100;
    const health = Math.max(48, 100 - overdue.length * 9 - discrepancies.length * 5 - safety.length * 3);
    return { open, overdue, promises, discrepancies, callbacks, tasks, safety, completed, completion, health };
  }, [records]);

  const statusFor = (value: number, yellow: number, red: number): Status => value >= red ? "Red" : value >= yellow ? "Yellow" : "Green";

  const healthItems = [
    ["Customer promises", statusFor(metrics.promises.length, 3, 6)],
    ["Inventory", statusFor(metrics.discrepancies.length, 1, 4)],
    ["Vendor performance", "Red" as Status],
    ["VMI routes", "Yellow" as Status],
    ["Employee tasks", statusFor(metrics.tasks.length, 4, 8)],
    ["Safety", statusFor(metrics.safety.length, 2, 5)],
  ] as const;

  function addRecord() {
    if (!draft.title.trim() || !draft.owner.trim()) return;
    const record: BranchRecord = {
      id: `SB-${Date.now().toString().slice(-6)}`,
      workflow: draft.workflow,
      title: draft.title.trim(),
      customer: draft.customer.trim() || undefined,
      owner: draft.owner.trim(),
      due: draft.due,
      priority: draft.priority,
      status: "Open",
      notes: draft.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setRecords((current) => [record, ...current]);
    setDraft({ workflow: draft.workflow, title: "", customer: "", owner: "", due: todayIso(), priority: "Medium", notes: "" });
    setFormOpen(false);
  }

  function cycleStatus(id: string) {
    const order: RecordStatus[] = ["Open", "In Progress", "Blocked", "Completed"];
    setRecords((current) => current.map((r) => r.id === id ? { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] } : r));
  }

  const visibleRecords = active in workflowMeta ? records.filter((r) => r.workflow === active) : records;

  return (
    <main className="branch-shell">
      <aside className="sidebar">
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="workspace-name"><Building2 size={20}/><div><strong>Smart Branch</strong><small>Branch Operations Workspace</small></div></div>
        <nav>
          <button className={active === "dashboard" ? "active" : ""} onClick={() => setActive("dashboard")}><BarChart3 size={16}/>GM Dashboard</button>
          {(Object.keys(workflowMeta) as WorkflowKey[]).map((key) => { const Icon = workflowMeta[key].icon; return <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}><Icon size={16}/>{workflowMeta[key].label}</button>; })}
          <button className={active === "huddle" ? "active" : ""} onClick={() => setActive("huddle")}><Users size={16}/>Daily Branch Huddle</button>
          <button className={active === "reporting" ? "active" : ""} onClick={() => setActive("reporting")}><ClipboardCheck size={16}/>Executive Reporting</button>
        </nav>
        <a className="back" href="/toolbox">← Back to Workspaces</a>
      </aside>

      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR · SMART BRANCH</small><strong>{active === "dashboard" ? "Branch General Manager Dashboard" : active === "huddle" ? "Daily Branch Huddle" : active === "reporting" ? "Executive Reporting" : workflowMeta[active as WorkflowKey].label}</strong></div><span>Live workspace · local operating record</span></header>
        <div className="content">
          <section className="hero">
            <div><small>BRANCH OPERATING COMMAND CENTER</small><h1>See what needs attention, who owns it, and what is at risk.</h1><p>Customer commitments, receiving, inventory, counter follow-up, VMI, employee work, vendor performance, and safety all feed one branch leadership view.</p></div>
            <div className="health"><span>BRANCH HEALTH</span><strong>{metrics.health}</strong><b>out of 100</b><em>{metrics.health >= 85 ? "Controlled" : metrics.health >= 70 ? "Attention required" : "Recovery required"}</em></div>
          </section>

          {active === "dashboard" && <>
            <section className="metric-grid">
              {[
                ["Open customer issues", metrics.promises.length, CalendarCheck],
                ["Late deliveries / work", metrics.overdue.length, Truck],
                ["Inventory discrepancies", metrics.discrepancies.length, Boxes],
                ["Customer callbacks today", metrics.callbacks.length, PhoneCall],
                ["Employee tasks open", metrics.tasks.length, UserCheck],
                ["Safety concerns", metrics.safety.length, ShieldCheck],
              ].map(([label, value, Icon]) => <article key={label as string}><Icon size={20}/><small>{label as string}</small><strong>{value as number}</strong></article>)}
            </section>

            <section className="two-grid">
              <article className="panel">
                <div className="panel-head"><div><small>OPERATIONAL HEALTH</small><h2>Green. Yellow. Red. No guessing.</h2></div><AlertTriangle size={22}/></div>
                <div className="health-list">{healthItems.map(([label, status]) => <div key={label}><span className={`dot ${status.toLowerCase()}`}></span><strong>{label}</strong><em>{status}</em></div>)}</div>
              </article>
              <article className="panel ai-card">
                <div className="panel-head"><div><small>PILOT DAILY BRIEF</small><h2>Recommended branch priorities</h2></div><BrainCircuit size={24}/></div>
                <ol>
                  <li><b>Protect customer commitments.</b> {metrics.promises.length} open promise{metrics.promises.length === 1 ? " is" : "s are"} being tracked.</li>
                  <li><b>Resolve inventory risk.</b> {metrics.discrepancies.length} discrepancy record{metrics.discrepancies.length === 1 ? "" : "s"} remain open.</li>
                  <li><b>Recover missed demand.</b> {metrics.callbacks.length} counter follow-up{metrics.callbacks.length === 1 ? "" : "s"} require ownership.</li>
                  <li><b>Close overdue work.</b> {metrics.overdue.length} item{metrics.overdue.length === 1 ? " is" : "s are"} past due.</li>
                </ol>
              </article>
            </section>

            <section className="panel records-panel">
              <div className="panel-head"><div><small>BRANCH ACCOUNTABILITY BOARD</small><h2>Every issue, promise, and task has an owner.</h2></div><button className="primary" onClick={() => setFormOpen(true)}>+ Create record</button></div>
              <RecordTable records={records.slice(0, 10)} onCycle={cycleStatus}/>
            </section>

            <section className="two-grid">
              <article className="panel"><div className="panel-head"><div><small>VENDOR PERFORMANCE</small><h2>Supplier reliability</h2></div><Truck size={22}/></div><div className="vendor-list">{vendors.map((v) => <div key={v.name}><span className={`dot ${v.status.toLowerCase()}`}></span><strong>{v.name}</strong><small>OTD {v.onTime}% · Fill {v.fill}%</small><b>{v.score}</b></div>)}</div></article>
              <article className="panel"><div className="panel-head"><div><small>EXECUTION RATE</small><h2>Verified closure</h2></div><CheckCircle2 size={22}/></div><div className="completion"><strong>{metrics.completion}%</strong><span>of recorded branch work completed</span><div><i style={{width:`${metrics.completion}%`}}/></div><small>{metrics.completed.length} completed · {metrics.open.length} open</small></div></article>
            </section>
          </>}

          {active in workflowMeta && <section className="panel records-panel">
            <div className="panel-head"><div><small>CONTROLLED WORKFLOW</small><h2>{workflowMeta[active as WorkflowKey].label}</h2><p>Create, assign, update, and close branch work. Every record immediately updates the General Manager Dashboard.</p></div><button className="primary" onClick={() => { setDraft((d) => ({...d, workflow: active as WorkflowKey})); setFormOpen(true); }}>+ New record</button></div>
            <RecordTable records={visibleRecords} onCycle={cycleStatus}/>
          </section>}

          {active === "huddle" && <section className="two-grid">
            <article className="panel"><div className="panel-head"><div><small>FIVE-MINUTE HUDDLE</small><h2>What changed? What is critical? Who owns it?</h2></div><Users size={24}/></div><div className="huddle-list"><div><b>1</b><span><strong>Customer risk</strong><small>{metrics.promises.length} open commitments; {metrics.callbacks.length} callbacks.</small></span></div><div><b>2</b><span><strong>Material flow</strong><small>{records.filter(r=>r.workflow === "receiving" && r.status !== "Completed").length} receiving items; {metrics.discrepancies.length} discrepancies.</small></span></div><div><b>3</b><span><strong>Execution</strong><small>{metrics.overdue.length} overdue; {metrics.open.length} total open.</small></span></div><div><b>4</b><span><strong>Safety</strong><small>{metrics.safety.length} open safety or facility actions.</small></span></div></div></article>
            <article className="panel ai-card"><div className="panel-head"><div><small>HUDDLE OUTPUT</small><h2>Pilot-generated leadership message</h2></div><BrainCircuit size={24}/></div><p>Today’s branch focus is to protect customer commitments, complete receiving without shortcuts, resolve the B4 inventory variance, and make every due customer callback before close of business. Owners should identify blockers during the huddle—not after the due date.</p><button className="secondary" onClick={() => window.print()}>Print huddle brief</button></article>
          </section>}

          {active === "reporting" && <section className="report-grid">
            {[ ["Inventory Accuracy", "92%"], ["Customer Promise Performance", "86%"], ["Counter Follow-Up Closure", `${100 - Math.min(100, metrics.callbacks * 8)}%`], ["Vendor Performance", "88%"], ["VMI Compliance", "91%"], ["Task Completion", `${metrics.completion}%`], ["Open Issues", `${metrics.open.length}`], ["Closed This Week", `${metrics.completed.length}`] ].map(([label,value]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>Current branch operating view</span></article>)}
          </section>}
        </div>
      </section>

      {formOpen && <div className="modal-backdrop" onMouseDown={() => setFormOpen(false)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="panel-head"><div><small>NEW SMART BRANCH RECORD</small><h2>Create controlled work</h2></div><button className="close" onClick={() => setFormOpen(false)}>×</button></div><label>Workflow<select value={draft.workflow} onChange={(e) => setDraft({...draft, workflow:e.target.value as WorkflowKey})}>{(Object.keys(workflowMeta) as WorkflowKey[]).map(k=><option key={k} value={k}>{workflowMeta[k].label}</option>)}</select></label><label>Title<input value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} placeholder="What needs to be completed?"/></label><label>Customer / location<input value={draft.customer} onChange={(e)=>setDraft({...draft,customer:e.target.value})} placeholder="Optional"/></label><div className="form-grid"><label>Owner<input value={draft.owner} onChange={(e)=>setDraft({...draft,owner:e.target.value})}/></label><label>Due date<input type="date" value={draft.due} onChange={(e)=>setDraft({...draft,due:e.target.value})}/></label></div><label>Priority<select value={draft.priority} onChange={(e)=>setDraft({...draft,priority:e.target.value as BranchRecord["priority"]})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Notes<textarea value={draft.notes} onChange={(e)=>setDraft({...draft,notes:e.target.value})}/></label><button className="primary full" onClick={addRecord}>Create and feed GM Dashboard</button></div></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.branch-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.sidebar{position:fixed;inset:0 auto 0 0;width:276px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:195px;max-height:48px}.workspace-name{display:flex;align-items:center;gap:10px;margin:16px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.workspace-name strong,.workspace-name small{display:block}.workspace-name small{margin-top:3px;color:#9abbd6;font-size:9px}.sidebar nav{display:grid;gap:5px}.sidebar nav button{display:flex;align-items:center;gap:9px;width:100%;padding:10px 11px;border:0;border-radius:9px;color:#bed2e4;background:transparent;text-align:left;font-size:10px;font-weight:800;cursor:pointer}.sidebar nav button.active{color:#fff;background:#0d4a7c}.back{display:block;margin-top:18px;padding-top:15px;border-top:1px solid #28475f;color:#9ec5e2;text-decoration:none;font-size:10px;font-weight:850}.main{margin-left:276px}.main>header{min-height:68px;display:flex;align-items:center;gap:15px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header>div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:9px;font-weight:900}.content{max-width:1500px;margin:auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:center;padding:28px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 22px 55px rgba(8,47,82,.2)}.hero small,.panel-head small{color:#9ed6ff;font-size:9px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:900px;margin:11px 0;font-size:clamp(30px,4vw,52px);line-height:1.03}.hero p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.6}.health{display:grid;place-items:center;padding:18px;border:1px solid #72afe1;border-radius:20px;background:#0a3558;text-align:center}.health span,.health b,.health em{display:block}.health span{font-size:8px;font-weight:900;letter-spacing:.12em}.health strong{font-size:58px;line-height:1}.health b{font-size:9px}.health em{margin-top:8px;color:#8ee0b8;font-size:10px;font-style:normal;font-weight:900}.metric-grid,.report-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}.metric-grid article,.report-grid article,.panel{border:1px solid #d8e4ed;border-radius:17px;background:#fff;box-shadow:0 10px 28px rgba(24,53,77,.07)}.metric-grid article{padding:16px}.metric-grid svg{color:#0a66ff}.metric-grid small,.metric-grid strong,.report-grid small,.report-grid strong,.report-grid span{display:block}.metric-grid small{margin-top:14px;color:#6c8295;font-size:9px;font-weight:900;text-transform:uppercase}.metric-grid strong{margin-top:5px;font-size:30px}.two-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px;margin-top:16px}.panel{padding:19px}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.panel-head small{color:#0a66ff}.panel-head h2{margin:5px 0 0}.panel-head p{margin:7px 0 0;color:#647b8e;font-size:11px}.health-list,.vendor-list{display:grid;gap:8px;margin-top:15px}.health-list>div,.vendor-list>div{display:flex;align-items:center;gap:9px;padding:11px;border:1px solid #e0e8ee;border-radius:11px}.health-list strong,.vendor-list strong{margin-right:auto;font-size:11px}.health-list em{font-size:9px;font-style:normal;font-weight:900}.vendor-list small{margin-right:auto;color:#71869a;font-size:9px}.dot{width:10px;height:10px;border-radius:50%}.dot.green{background:#20a46b}.dot.yellow{background:#e7a724}.dot.red{background:#d94a54}.ai-card{color:#fff;background:linear-gradient(145deg,#07192c,#0b3b65);border-color:#315a7c}.ai-card .panel-head small{color:#9ed6ff}.ai-card ol{margin:17px 0 0;padding-left:20px;color:#d3e4f1;font-size:11px;line-height:1.7}.ai-card p{color:#d3e4f1;line-height:1.7}.records-panel{margin-top:16px;overflow:hidden}.primary,.secondary,.close{border:0;border-radius:9px;font-weight:900;cursor:pointer}.primary{min-height:38px;padding:0 13px;color:#fff;background:#0a66ff;font-size:10px}.secondary{min-height:38px;padding:0 13px;color:#10263a;background:#fff;font-size:10px}.full{width:100%}.close{font-size:25px;background:transparent}.record-table{width:100%;border-collapse:collapse;margin-top:15px}.record-table th,.record-table td{padding:11px 9px;border-bottom:1px solid #e3e9ee;text-align:left;font-size:10px}.record-table th{color:#70869a;font-size:8px;letter-spacing:.08em;text-transform:uppercase}.record-table td strong,.record-table td small{display:block}.record-table td small{margin-top:3px;color:#71869a}.status,.priority{display:inline-block;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900}.status.open{color:#285e83;background:#e8f2ff}.status.in-progress{color:#85520a;background:#fff0d5}.status.blocked{color:#8f1f2c;background:#ffe7ea}.status.completed{color:#176747;background:#e4f8ef}.priority.critical{color:#8f1f2c;background:#ffe7ea}.priority.high{color:#85520a;background:#fff0d5}.priority.medium{color:#285e83;background:#e8f2ff}.priority.low{color:#4f6679;background:#edf2f6}.cycle{border:1px solid #c9d7e2;border-radius:8px;padding:6px 8px;color:#285674;background:#fff;font-size:8px;font-weight:850;cursor:pointer}.completion{text-align:center;padding:18px}.completion>strong{display:block;font-size:52px}.completion>span,.completion>small{display:block;color:#6d8295;font-size:10px}.completion>div{height:10px;margin:16px 0;border-radius:999px;background:#e4ebf0;overflow:hidden}.completion i{display:block;height:100%;border-radius:999px;background:#0a66ff}.huddle-list{display:grid;gap:10px;margin-top:16px}.huddle-list>div{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #dce6ed;border-radius:12px}.huddle-list b{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#e8f2ff}.huddle-list strong,.huddle-list small{display:block}.huddle-list small{margin-top:4px;color:#6d8295}.report-grid article{padding:20px}.report-grid small{color:#6c8295;font-size:9px;font-weight:900;text-transform:uppercase}.report-grid strong{margin:12px 0 5px;font-size:34px}.report-grid span{color:#71869a;font-size:9px}.modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(3,17,29,.72)}.modal{width:min(620px,100%);max-height:90vh;overflow:auto;padding:22px;border-radius:20px;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal label{display:grid;gap:6px;margin-top:12px;color:#4f6679;font-size:9px;font-weight:900;text-transform:uppercase}.modal input,.modal select,.modal textarea{width:100%;padding:11px;border:1px solid #cbd8e2;border-radius:9px;color:#10263a;background:#fff;font:inherit;text-transform:none}.modal textarea{min-height:88px;resize:vertical}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:900px){.sidebar{position:static;width:auto;height:auto}.main{margin-left:0}.hero{grid-template-columns:1fr}.main>header{align-items:flex-start;flex-direction:column;padding:15px 20px}.record-table{display:block;overflow:auto}}@media print{.sidebar,.main>header,.primary,.secondary,.cycle{display:none}.main{margin:0}.content{padding:0}.hero{color:#10263a;background:#fff;box-shadow:none}.ai-card{color:#10263a;background:#fff}.ai-card p,.ai-card ol{color:#10263a}}
      `}</style>
    </main>
  );
}

function RecordTable({ records, onCycle }: { records: BranchRecord[]; onCycle: (id: string) => void }) {
  if (!records.length) return <p style={{color:"#6d8295",fontSize:11,marginTop:18}}>No records yet. Create the first controlled branch record.</p>;
  return <table className="record-table"><thead><tr><th>ID</th><th>Work</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead><tbody>{records.map((r)=><tr key={r.id}><td>{r.id}</td><td><strong>{r.title}</strong><small>{r.customer || workflowMeta[r.workflow].label}</small></td><td>{r.owner}</td><td>{r.due}</td><td><span className={`priority ${r.priority.toLowerCase()}`}>{r.priority}</span></td><td><span className={`status ${r.status.toLowerCase().replace(" ","-")}`}>{r.status}</span></td><td><button className="cycle" onClick={()=>onCycle(r.id)}>Advance status <ArrowRight size={10}/></button></td></tr>)}</tbody></table>;
}
