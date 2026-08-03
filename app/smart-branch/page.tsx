"use client";

import { ArrowRight, BarChart3, Boxes, BrainCircuit, Building2, CalendarCheck, CheckCircle2, ClipboardCheck, PackageCheck, PhoneCall, Route, ShieldCheck, Truck, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

type Workflow = "promises" | "receiving" | "inventory" | "counter" | "vmi" | "tasks" | "safety";
type View = Workflow | "dashboard" | "huddle" | "reporting";
type WorkStatus = "Open" | "In Progress" | "Blocked" | "Completed";
type Priority = "Low" | "Medium" | "High" | "Critical";

type BranchRecord = { id:string; workflow:Workflow; title:string; customer?:string; owner:string; due:string; status:WorkStatus; priority:Priority; notes?:string };
type WorkflowInfo = { label:string; icon:LucideIcon };
type MetricCard = { label:string; value:number; icon:LucideIcon };

const workflows: Record<Workflow, WorkflowInfo> = {
  promises:{label:"Customer Promise Tracker",icon:CalendarCheck},
  receiving:{label:"Receiving Workflow",icon:PackageCheck},
  inventory:{label:"Inventory Exception Workflow",icon:Boxes},
  counter:{label:"Counter Sales Follow-Up",icon:PhoneCall},
  vmi:{label:"VMI Route Manager",icon:Route},
  tasks:{label:"Employee Task Manager",icon:UserCheck},
  safety:{label:"Safety & Facility",icon:ShieldCheck},
};

const starter: BranchRecord[] = [
  {id:"SB-1001",workflow:"promises",title:"Deliver 200 bearings",customer:"ABC Manufacturing",owner:"John",due:"2026-08-06",status:"In Progress",priority:"Critical",notes:"Customer update due before noon."},
  {id:"SB-1002",workflow:"receiving",title:"Receive shipment 77421",owner:"Jane",due:"2026-08-03",status:"Open",priority:"High",notes:"Count, inspect, photograph, and put away."},
  {id:"SB-1003",workflow:"inventory",title:"Aisle B4 cycle-count mismatch",owner:"Mike",due:"2026-08-04",status:"Blocked",priority:"High",notes:"Expected 480; actual 421."},
  {id:"SB-1004",workflow:"counter",title:"Source alternate hydraulic fitting",customer:"Delta Fabrication",owner:"Jane",due:"2026-08-03",status:"Open",priority:"High"},
  {id:"SB-1005",workflow:"vmi",title:"Service Route 3 bins",customer:"Pineywoods Industrial",owner:"Mike",due:"2026-08-03",status:"In Progress",priority:"Medium"},
  {id:"SB-1006",workflow:"tasks",title:"Complete dock housekeeping",owner:"John",due:"2026-08-03",status:"Completed",priority:"Medium"},
  {id:"SB-1007",workflow:"safety",title:"Inspect eyewash station",owner:"Jane",due:"2026-08-05",status:"Open",priority:"Medium"},
];

const vendors = [
  {name:"Industrial Supply Co.",detail:"OTD 96% · Fill 98%",score:97,status:"green"},
  {name:"Vendor XYZ",detail:"OTD 71% · Fill 84%",score:76,status:"red"},
  {name:"Regional Bearings",detail:"OTD 88% · Fill 93%",score:90,status:"yellow"},
];

const isoToday = () => new Date().toISOString().slice(0,10);

export default function SmartBranchPage(){
  const [view,setView]=useState<View>("dashboard");
  const [records,setRecords]=useState<BranchRecord[]>(starter);
  const [showForm,setShowForm]=useState(false);
  const [draft,setDraft]=useState({workflow:"promises" as Workflow,title:"",customer:"",owner:"",due:isoToday(),priority:"Medium" as Priority,notes:""});

  useEffect(()=>{const raw=localStorage.getItem("northstar-smart-branch-records");if(raw){try{setRecords(JSON.parse(raw) as BranchRecord[])}catch{}}},[]);
  useEffect(()=>{localStorage.setItem("northstar-smart-branch-records",JSON.stringify(records))},[records]);

  const summary=useMemo(()=>{
    const open=records.filter(r=>r.status!=="Completed");
    const count=(workflow:Workflow)=>open.filter(r=>r.workflow===workflow).length;
    const completed=records.length-open.length;
    const overdue=open.filter(r=>r.due<isoToday()).length;
    const completion=records.length?Math.round(completed/records.length*100):100;
    const health=Math.max(45,100-overdue*8-count("inventory")*5-count("safety")*3);
    return {open,completed,overdue,completion,health,promises:count("promises"),receiving:count("receiving"),inventory:count("inventory"),counter:count("counter"),vmi:count("vmi"),tasks:count("tasks"),safety:count("safety")};
  },[records]);

  const metricCards:MetricCard[]=[
    {label:"Open customer issues",value:summary.promises,icon:CalendarCheck},
    {label:"Late deliveries / work",value:summary.overdue,icon:Truck},
    {label:"Inventory discrepancies",value:summary.inventory,icon:Boxes},
    {label:"Customer callbacks today",value:summary.counter,icon:PhoneCall},
    {label:"Employee tasks open",value:summary.tasks,icon:UserCheck},
    {label:"Safety concerns",value:summary.safety,icon:ShieldCheck},
  ];

  const filtered=view in workflows?records.filter(r=>r.workflow===view):records;

  function createRecord(){
    if(!draft.title.trim()||!draft.owner.trim())return;
    setRecords(current=>[{id:`SB-${Date.now().toString().slice(-6)}`,workflow:draft.workflow,title:draft.title.trim(),customer:draft.customer.trim()||undefined,owner:draft.owner.trim(),due:draft.due,status:"Open",priority:draft.priority,notes:draft.notes.trim()||undefined},...current]);
    setDraft({...draft,title:"",customer:"",owner:"",notes:"",due:isoToday()});setShowForm(false);
  }

  function advance(id:string){const order:WorkStatus[]=["Open","In Progress","Blocked","Completed"];setRecords(current=>current.map(r=>r.id===id?{...r,status:order[(order.indexOf(r.status)+1)%order.length]}:r))}

  return <main className="shell">
    <aside>
      <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div>
      <div className="north"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div>
      <div className="workspace"><Building2 size={20}/><div><strong>Smart Branch</strong><small>Branch Operations Workspace</small></div></div>
      <nav>
        <button className={view==="dashboard"?"active":""} onClick={()=>setView("dashboard")}><BarChart3 size={15}/>GM Dashboard</button>
        {(Object.keys(workflows) as Workflow[]).map(key=>{const Icon=workflows[key].icon;return <button key={key} className={view===key?"active":""} onClick={()=>setView(key)}><Icon size={15}/>{workflows[key].label}</button>})}
        <button className={view==="huddle"?"active":""} onClick={()=>setView("huddle")}><Users size={15}/>Daily Branch Huddle</button>
        <button className={view==="reporting"?"active":""} onClick={()=>setView("reporting")}><ClipboardCheck size={15}/>Executive Reporting</button>
      </nav>
      <a href="/toolbox">← Back to Workspaces</a>
    </aside>

    <section className="main">
      <header><div><small>QMSPILOT NORTHSTAR · SMART BRANCH</small><strong>{view==="dashboard"?"Branch General Manager Dashboard":view==="huddle"?"Daily Branch Huddle":view==="reporting"?"Executive Reporting":workflows[view as Workflow].label}</strong></div><span>Live branch operating record</span></header>
      <div className="content">
        <section className="hero"><div><small>BRANCH OPERATING COMMAND CENTER</small><h1>See what needs attention, who owns it, and what is at risk.</h1><p>Customer promises, receiving, inventory, counter follow-up, VMI, employee work, vendor performance, and safety all feed one leadership view.</p></div><div className="health"><span>BRANCH HEALTH</span><strong>{summary.health}</strong><b>out of 100</b><em>{summary.health>=85?"Controlled":summary.health>=70?"Attention required":"Recovery required"}</em></div></section>

        {view==="dashboard"&&<>
          <section className="metrics">{metricCards.map(({label,value,icon:Icon})=><article key={label}><Icon size={20}/><small>{label}</small><strong>{value}</strong></article>)}</section>
          <section className="two">
            <article className="panel"><Heading over="OPERATIONAL HEALTH" title="Green. Yellow. Red. No guessing."/><div className="health-list">{[["Customer promises",summary.promises],["Inventory",summary.inventory],["Vendor performance",3],["VMI routes",summary.vmi],["Employee tasks",summary.tasks],["Safety",summary.safety]].map(([label,value])=>{const n=Number(value);const state=n>=4?"red":n>=1?"yellow":"green";return <div key={String(label)}><i className={state}/><strong>{label}</strong><em>{state}</em></div>})}</div></article>
            <article className="panel ai"><Heading over="PILOT DAILY BRIEF" title="Recommended branch priorities" icon={BrainCircuit}/><ol><li>Protect {summary.promises} open customer promise{summary.promises===1?"":"s"}.</li><li>Resolve {summary.inventory} inventory exception{summary.inventory===1?"":"s"}.</li><li>Complete {summary.counter} customer callback{summary.counter===1?"":"s"}.</li><li>Close {summary.overdue} overdue item{summary.overdue===1?"":"s"}.</li></ol></article>
          </section>
          <section className="panel records"><div className="head"><Heading over="BRANCH ACCOUNTABILITY BOARD" title="Every issue, promise, and task has an owner."/><button className="primary" onClick={()=>setShowForm(true)}>+ Create record</button></div><RecordTable records={records.slice(0,10)} onAdvance={advance}/></section>
          <section className="two"><article className="panel"><Heading over="VENDOR PERFORMANCE" title="Supplier reliability" icon={Truck}/><div className="vendor-list">{vendors.map(v=><div key={v.name}><i className={v.status}/><strong>{v.name}</strong><small>{v.detail}</small><b>{v.score}</b></div>)}</div></article><article className="panel"><Heading over="EXECUTION RATE" title="Verified closure" icon={CheckCircle2}/><div className="completion"><strong>{summary.completion}%</strong><span>of recorded branch work completed</span><div><i style={{width:`${summary.completion}%`}}/></div><small>{summary.completed} completed · {summary.open.length} open</small></div></article></section>
        </>}

        {view in workflows&&<section className="panel records"><div className="head"><Heading over="CONTROLLED WORKFLOW" title={workflows[view as Workflow].label}/><button className="primary" onClick={()=>{setDraft(d=>({...d,workflow:view as Workflow}));setShowForm(true)}}>+ New record</button></div><p className="intro">Create, assign, update, and close work. Every record immediately updates the General Manager Dashboard.</p><RecordTable records={filtered} onAdvance={advance}/></section>}

        {view==="huddle"&&<section className="two"><article className="panel"><Heading over="FIVE-MINUTE HUDDLE" title="What changed? What is critical? Who owns it?" icon={Users}/><div className="huddle">{[["Customer risk",`${summary.promises} commitments; ${summary.counter} callbacks.`],["Material flow",`${summary.receiving} receiving items; ${summary.inventory} discrepancies.`],["Execution",`${summary.overdue} overdue; ${summary.open.length} total open.`],["Safety",`${summary.safety} open actions.`]].map(([a,b],i)=><div key={a}><b>{i+1}</b><span><strong>{a}</strong><small>{b}</small></span></div>)}</div></article><article className="panel ai"><Heading over="HUDDLE OUTPUT" title="Pilot-generated leadership message" icon={BrainCircuit}/><p>Protect customer commitments, complete receiving without shortcuts, resolve inventory variances, and make every due customer callback before close of business. Owners should identify blockers during the huddle—not after the due date.</p><button className="secondary" onClick={()=>window.print()}>Print huddle brief</button></article></section>}

        {view==="reporting"&&<section className="reports">{[["Inventory Accuracy","92%"],["Customer Promise Performance","86%"],["Counter Follow-Up Closure",`${Math.max(0,100-summary.counter*8)}%`],["Vendor Performance","88%"],["VMI Compliance","91%"],["Task Completion",`${summary.completion}%`],["Open Issues",String(summary.open.length)],["Closed This Week",String(summary.completed)]].map(([label,value])=><article key={label}><small>{label}</small><strong>{value}</strong><span>Current branch operating view</span></article>)}</section>}
      </div>
    </section>

    {showForm&&<div className="backdrop" onMouseDown={()=>setShowForm(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="head"><Heading over="NEW SMART BRANCH RECORD" title="Create controlled work"/><button className="close" onClick={()=>setShowForm(false)}>×</button></div><label>Workflow<select value={draft.workflow} onChange={e=>setDraft({...draft,workflow:e.target.value as Workflow})}>{(Object.keys(workflows) as Workflow[]).map(k=><option key={k} value={k}>{workflows[k].label}</option>)}</select></label><label>Title<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="What needs to be completed?"/></label><label>Customer / location<input value={draft.customer} onChange={e=>setDraft({...draft,customer:e.target.value})}/></label><div className="form-grid"><label>Owner<input value={draft.owner} onChange={e=>setDraft({...draft,owner:e.target.value})}/></label><label>Due date<input type="date" value={draft.due} onChange={e=>setDraft({...draft,due:e.target.value})}/></label></div><label>Priority<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Notes<textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><button className="primary full" onClick={createRecord}>Create and feed GM Dashboard</button></div></div>}

    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8}.shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}aside{position:fixed;inset:0 auto 0 0;width:276px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo,.north{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.north{margin-top:8px;background:#020914}.logo img,.north img{max-width:195px;max-height:48px}.workspace{display:flex;align-items:center;gap:10px;margin:16px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.workspace strong,.workspace small{display:block}.workspace small{margin-top:3px;color:#9abbd6;font-size:9px}nav{display:grid;gap:5px}nav button{display:flex;align-items:center;gap:9px;width:100%;padding:10px 11px;border:0;border-radius:9px;color:#bed2e4;background:transparent;text-align:left;font-size:10px;font-weight:800;cursor:pointer}nav button.active{color:#fff;background:#0d4a7c}aside>a{display:block;margin-top:18px;padding-top:15px;border-top:1px solid #28475f;color:#9ec5e2;text-decoration:none;font-size:10px;font-weight:850}.main{margin-left:276px}.main>header{min-height:68px;display:flex;align-items:center;gap:15px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header>div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:9px;font-weight:900}.content{max-width:1500px;margin:auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:center;padding:28px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 22px 55px rgba(8,47,82,.2)}.hero small,.heading small{color:#9ed6ff;font-size:9px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:900px;margin:11px 0;font-size:clamp(30px,4vw,52px);line-height:1.03}.hero p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.6}.health{display:grid;place-items:center;padding:18px;border:1px solid #72afe1;border-radius:20px;background:#0a3558;text-align:center}.health span,.health b,.health em{display:block}.health strong{font-size:58px;line-height:1}.health em{margin-top:8px;color:#8ee0b8;font-size:10px;font-style:normal;font-weight:900}.metrics,.reports{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}.metrics article,.reports article,.panel{border:1px solid #d8e4ed;border-radius:17px;background:#fff;box-shadow:0 10px 28px rgba(24,53,77,.07)}.metrics article{padding:16px}.metrics svg{color:#0a66ff}.metrics small,.metrics strong,.reports small,.reports strong,.reports span{display:block}.metrics small{margin-top:14px;color:#6c8295;font-size:9px;font-weight:900;text-transform:uppercase}.metrics strong{margin-top:5px;font-size:30px}.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px;margin-top:16px}.panel{padding:19px}.heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.heading small{color:#0a66ff}.heading h2{margin:5px 0 0}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.health-list,.vendor-list{display:grid;gap:8px;margin-top:15px}.health-list>div,.vendor-list>div{display:flex;align-items:center;gap:9px;padding:11px;border:1px solid #e0e8ee;border-radius:11px}.health-list strong,.vendor-list strong{margin-right:auto;font-size:11px}.health-list em{font-size:9px;font-style:normal;font-weight:900;text-transform:capitalize}.vendor-list small{margin-right:auto;color:#71869a;font-size:9px}.health-list i,.vendor-list i{width:10px;height:10px;border-radius:50%}.green{background:#20a46b}.yellow{background:#e7a724}.red{background:#d94a54}.ai{color:#fff;background:linear-gradient(145deg,#07192c,#0b3b65);border-color:#315a7c}.ai .heading small{color:#9ed6ff}.ai ol,.ai p{color:#d3e4f1;font-size:11px;line-height:1.8}.records{margin-top:16px;overflow:hidden}.intro{color:#647b8e;font-size:11px}.primary,.secondary,.close{border:0;border-radius:9px;font-weight:900;cursor:pointer}.primary{min-height:38px;padding:0 13px;color:#fff;background:#0a66ff;font-size:10px}.secondary{min-height:38px;padding:0 13px;color:#10263a;background:#fff;font-size:10px}.full{width:100%}.close{font-size:25px;background:transparent}.table{width:100%;border-collapse:collapse;margin-top:15px}.table th,.table td{padding:11px 9px;border-bottom:1px solid #e3e9ee;text-align:left;font-size:10px}.table th{color:#70869a;font-size:8px;letter-spacing:.08em;text-transform:uppercase}.table td strong,.table td small{display:block}.table td small{margin-top:3px;color:#71869a}.pill{display:inline-block;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900;background:#e8f2ff}.critical,.blocked{color:#8f1f2c;background:#ffe7ea}.high,.in-progress{color:#85520a;background:#fff0d5}.completed{color:#176747;background:#e4f8ef}.advance{display:inline-flex;align-items:center;gap:5px;border:1px solid #c9d7e2;border-radius:8px;padding:6px 8px;color:#285674;background:#fff;font-size:8px;font-weight:850;cursor:pointer}.completion{text-align:center;padding:18px}.completion>strong{display:block;font-size:52px}.completion>span,.completion>small{display:block;color:#6d8295;font-size:10px}.completion>div{height:10px;margin:16px 0;border-radius:999px;background:#e4ebf0;overflow:hidden}.completion>div i{display:block;height:100%;border-radius:999px;background:#0a66ff}.huddle{display:grid;gap:10px;margin-top:16px}.huddle>div{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #dce6ed;border-radius:12px}.huddle>b{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#e8f2ff}.huddle strong,.huddle small{display:block}.huddle small{margin-top:4px;color:#6d8295}.reports article{padding:20px}.reports small{color:#6c8295;font-size:9px;font-weight:900;text-transform:uppercase}.reports strong{margin:12px 0 5px;font-size:34px}.reports span{color:#71869a;font-size:9px}.backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(3,17,29,.72)}.modal{width:min(620px,100%);max-height:90vh;overflow:auto;padding:22px;border-radius:20px;background:#fff}.modal label{display:grid;gap:6px;margin-top:12px;color:#4f6679;font-size:9px;font-weight:900;text-transform:uppercase}.modal input,.modal select,.modal textarea{width:100%;padding:11px;border:1px solid #cbd8e2;border-radius:9px;color:#10263a;background:#fff;font:inherit;text-transform:none}.modal textarea{min-height:88px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:900px){aside{position:static;width:auto;height:auto}.main{margin-left:0}.hero{grid-template-columns:1fr}.main>header{align-items:flex-start;flex-direction:column;padding:15px 20px}.table{display:block;overflow:auto}}@media print{aside,.main>header,.primary,.secondary,.advance{display:none}.main{margin:0}.content{padding:0}.hero,.ai{color:#10263a;background:#fff;box-shadow:none}.ai p,.ai ol{color:#10263a}}
    `}</style>
  </main>
}

function Heading({over,title,icon:Icon}:{over:string;title:string;icon?:LucideIcon}){return <div className="heading"><div><small>{over}</small><h2>{title}</h2></div>{Icon&&<Icon size={23}/>}</div>}

function RecordTable({records,onAdvance}:{records:BranchRecord[];onAdvance:(id:string)=>void}){if(!records.length)return <p className="intro">No records yet. Create the first controlled branch record.</p>;return <table className="table"><thead><tr><th>ID</th><th>Work</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td>{r.id}</td><td><strong>{r.title}</strong><small>{r.customer||workflows[r.workflow].label}</small></td><td>{r.owner}</td><td>{r.due}</td><td><span className={`pill ${r.priority.toLowerCase()}`}>{r.priority}</span></td><td><span className={`pill ${r.status.toLowerCase().replace(" ","-")}`}>{r.status}</span></td><td><button className="advance" onClick={()=>onAdvance(r.id)}>Advance <ArrowRight size={10}/></button></td></tr>)}</tbody></table>}
