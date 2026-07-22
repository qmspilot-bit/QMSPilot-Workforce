"use client";

import { Activity, AlertTriangle, ArrowRight, BrainCircuit, ClipboardCheck, Database, Network, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const agents = ["Pilot", "Atlas", "Forge", "Sentinel", "Vector", "Beacon", "Ledger", "Nexus"];
const rank = { critical: 4, high: 3, medium: 2, low: 1 };

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function demoData() {
  return {
    events: [
      { id: "customer", event_title: "Strategic customer recovery requires one executive sponsor", source_tool: "customer-assurance", source_record_key: "CC-2026-0047", source_path: "/tools/customer-assurance", severity: "critical", summary: "Customer startup, replacement delivery, measurement containment, and final response remain connected.", financial_exposure: 28200, revenue_exposure: 180000 },
      { id: "delivery", event_title: "Two strategic orders remain at risk", source_tool: "delivery-assurance", source_record_key: "NDA-20260722-DEMO", source_path: "/tools/delivery-assurance", severity: "critical", summary: "Supplier material, equipment capability, and final inspection capacity remain constrained.", financial_exposure: 5600, revenue_exposure: 306000 },
      { id: "measurement", event_title: "Out-of-tolerance bore-gage impact review", source_tool: "measurement-assurance", source_record_key: "OOT-2026-0006", source_path: "/tools/measurement-assurance", severity: "critical", summary: "The gage is quarantined and affected product requires a controlled impact decision.", financial_exposure: 62000, revenue_exposure: 180000 },
    ],
    assignments: [{ agent_code: "Pilot", assignment_status: "queued" }, { agent_code: "Atlas", assignment_status: "queued" }, { agent_code: "Forge", assignment_status: "queued" }, { agent_code: "Sentinel", assignment_status: "queued" }, { agent_code: "Ledger", assignment_status: "queued" }],
    recommendations: [{ recommendation_status: "pending_approval" }],
    actions: [{ action_status: "in_progress" }, { action_status: "blocked" }],
    writebacks: [{ writeback_status: "awaiting_human" }],
    brief: { title: "Pilot Executive Brief · Strategic Customer Recovery", executive_summary: "Protect the customer first. Approve one integrated recovery owner, restore trusted measurement capability, secure qualified final inspection, and protect the replacement shipment.", decisions_required: [{ decision: "Approve the integrated customer-recovery command plan.", reason: "$180,000 in strategic customer revenue remains exposed." }] },
    value: { verified_realized_value: 18375, net_realized_value: 6675, qmspilot_roi: 0.12 },
  };
}

export default function NorthstarLiveCommandCenter() {
  const cloud = useCloudWorkspace();
  const demo = useMemo(demoData, []);
  const [data, setData] = useState(demo);
  const [mode, setMode] = useState("demo");
  const [notice, setNotice] = useState("Design-partner connected operating scenario loaded.");
  const [busy, setBusy] = useState("");

  async function syncLive() {
    const token = await cloud.getAccessToken();
    if (!token) {
      setNotice("Sign in to Northstar Secure to activate live executive metrics.");
      return;
    }
    setBusy("sync");
    try {
      const response = await fetch("/api/command-center", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Command Center data could not be loaded.");
      if (!payload.events?.length) {
        setNotice("Northstar Secure is connected. Submit a controlled tool record to create live executive intelligence.");
        return;
      }
      setData(payload);
      setMode("secure");
      setNotice(`${payload.events.length} live operating events synchronized from Northstar Secure.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Command Center synchronization failed.");
    } finally {
      setBusy("");
    }
  }

  async function runRhythm() {
    const token = await cloud.getAccessToken();
    if (!token) {
      setNotice("Sign in to Northstar Secure before running the Pilot and Atlas operating rhythm.");
      return;
    }
    setBusy("rhythm");
    try {
      const response = await fetch("/api/northstar-operating-rhythm", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: "{}" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The operating rhythm could not run.");
      setNotice("Pilot and Atlas completed the operating rhythm. The new executive brief awaits human review.");
      await syncLive();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The operating rhythm could not run.");
    } finally {
      setBusy("");
    }
  }

  const events = data.events || [];
  const critical = events.filter((event) => event.severity === "critical").length;
  const high = events.filter((event) => event.severity === "high").length;
  const financial = events.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const revenue = events.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const openActions = (data.actions || []).filter((action) => !["done", "rejected"].includes(action.action_status));
  const blocked = openActions.filter((action) => action.action_status === "blocked").length;
  const decisions = (data.recommendations || []).filter((item) => item.recommendation_status === "pending_approval").length;
  const writebacks = (data.writebacks || []).filter((item) => !["executed", "rejected"].includes(item.writeback_status)).length;
  const score = Math.max(0, Math.min(100, 100 - critical * 8 - high * 4 - blocked * 3));
  const priorities = [...events].sort((left, right) => (rank[right.severity] || 0) - (rank[left.severity] || 0)).slice(0, 5);
  const brief = data.brief || demo.brief;

  return <main className="command-shell">
    <aside className="command-sidebar">
      <div className="logo-card"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div>
      <div className="northstar-card"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div>
      <div className="pilot-card"><span>PI</span><div><strong>Pilot</strong><small>Online · supervised</small></div></div>
      <nav><a className="active" href="/">Command Center</a><a href="/workforce-operations">AI Workforce Operations</a><a href="/entity-graph">Entity Graph</a><a href="/dashboard">Accountability</a><a href="/toolbox">Digital Toolbox</a></nav>
      <div className="system-status"><small>SYSTEM STATUS</small><span>● Intelligence Bus online</span><span>● Closed-loop writeback active</span><span>● Human authority preserved</span></div>
    </aside>

    <section className="command-main">
      <header className="command-topbar"><div><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div><span className={`mode ${mode}`}>{mode === "secure" ? "Live Northstar Secure" : "Design-partner demonstration"}</span></header>
      <div className="command-content">
        <section className="hero-grid">
          <article className="pilot-brief"><div className="eyebrow"><BrainCircuit size={17}/> PILOT EXECUTIVE BRIEFING</div><h1>{brief.title}</h1><p>{brief.executive_summary}</p><div className="hero-actions"><a href="/workforce-operations">Review decisions <ArrowRight size={16}/></a><button onClick={runRhythm} disabled={busy === "rhythm"}><RefreshCw size={16}/>{busy === "rhythm" ? "Pilot and Atlas are running..." : "Run Pilot + Atlas rhythm"}</button></div></article>
          <article className="health-card"><small>COMPANY HEALTH</small><div className="ring" style={{ background: `conic-gradient(#0a66ff ${score * 3.6}deg,#dce7ef 0)` }}><div><strong>{score}</strong><span>out of 100</span></div></div><b>{score >= 90 ? "Strong · controlled" : score >= 80 ? "Stable · attention required" : "Leadership intervention required"}</b><em>{mode === "secure" ? "Calculated from connected risk and execution" : "Demonstration model"}</em></article>
        </section>

        <section className="toolbar"><button onClick={syncLive} disabled={busy === "sync"}><RefreshCw size={16}/>{busy === "sync" ? "Synchronizing..." : "Sync live data"}</button><a href="/workforce-operations"><Network size={16}/>Intelligence Bus</a><a href="/entity-graph"><Database size={16}/>Entity Graph</a><a href="/toolbox"><ClipboardCheck size={16}/>Digital Toolbox</a></section>
        {notice && <div className="notice"><Activity size={17}/>{notice}</div>}

        <section className="metric-grid">{[["Critical events",critical,`${high} additional high priority`],["Revenue exposure",money(revenue),"Never counted as savings"],["Financial exposure",money(financial),"Connected operating loss and risk"],["Open actions",openActions.length,`${blocked} blocked`],["Human decisions",decisions,"Recommendations awaiting approval"],["Writebacks",writebacks,"Awaiting target-tool execution"],["Verified value",money(data.value?.verified_realized_value),`${money(data.value?.net_realized_value)} net realized`],["QMSPilot ROI",`${Number(data.value?.qmspilot_roi || 0).toFixed(2)}x`,"Value Ledger basis"]].map(([label,value,note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</section>

        <section className="two-grid">
          <article className="panel"><div className="panel-heading"><div><small>LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><AlertTriangle size={24}/></div><div className="priority-list">{priorities.map((event) => <a href={event.source_path || "/workforce-operations"} key={event.id}><span className={`severity ${event.severity}`}>{event.severity}</span><div><strong>{event.event_title}</strong><small>{event.source_tool} · {event.source_record_key}</small><p>{event.summary}</p></div><b>{money(Number(event.revenue_exposure || 0) || Number(event.financial_exposure || 0))}</b></a>)}</div></article>
          <article className="panel"><div className="panel-heading"><div><small>CLOSED-LOOP EXECUTION</small><h2>Recommendations become controlled work.</h2></div><CheckCircle2 size={24}/></div><div className="execution-flow"><span>Agent recommendation</span><ArrowRight/><span>Human approval</span><ArrowRight/><span>Native writeback</span><ArrowRight/><span>Evidence closure</span></div><p>Approved actions are written into the target application, updated where the work occurs, synchronized back to Atlas, and used to close the originating event only after verification.</p></article>
        </section>

        <section className="workforce"><div className="workforce-heading"><div><small>AI WORKFORCE</small><h2>One team working from the same operating context.</h2></div><span>Queues reflect Intelligence Bus assignments.</span></div><div className="agent-grid">{agents.map((agent) => { const load = (data.assignments || []).filter((assignment) => assignment.agent_code === agent && !["approved","rejected","closed"].includes(assignment.assignment_status)).length; return <article key={agent}><div><span>{agent.slice(0,2).toUpperCase()}</span><strong>{agent}</strong><em>{load ? "ACTIVE" : "READY"}</em></div><small>Open assignments</small><b>{load}</b><small>Final authority: Human</small></article>; })}</div></section>

        <section className="two-grid final-grid"><article className="recommendation"><small>PILOT RECOMMENDATION</small><h2>{brief.decisions_required?.[0]?.decision || "Maintain the connected operating rhythm."}</h2><p>{brief.decisions_required?.[0]?.reason || "Review the highest-risk event and approve one accountable response."}</p><a href="/workforce-operations">Open human decision queue <ArrowRight size={16}/></a></article><article className="panel"><div className="panel-heading"><div><small>OPERATING BOUNDARY</small><h2>Supervised intelligence—not autonomous control.</h2></div><ShieldCheck size={25}/></div><p>Northstar analyzes, routes, recommends, and writes only after authorization. Qualified humans retain authority for customer commitments, product release, financial validation, corrective-action closure, and management decisions.</p></article></section>
      </div>
    </section>

    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8}.command-shell{min-height:100vh;color:#12263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.command-sidebar{position:fixed;inset:0 auto 0 0;width:258px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo-card,.northstar-card{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar-card{margin-top:8px;background:#020914}.logo-card img,.northstar-card img{max-width:190px;max-height:48px}.pilot-card{display:flex;align-items:center;gap:10px;margin:17px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.pilot-card>span{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:#0a66ff;font-weight:900}.pilot-card strong,.pilot-card small{display:block}.pilot-card small{margin-top:3px;color:#9abbd6}.command-sidebar nav{display:grid;gap:6px}.command-sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.command-sidebar nav a.active{color:#fff;background:#0d4a7c}.system-status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.system-status small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.command-main{margin-left:258px}.command-topbar{min-height:68px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.command-topbar>div{margin-right:auto}.command-topbar small,.command-topbar strong{display:block}.command-topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.mode{padding:8px 11px;border-radius:999px;font-size:10px;font-weight:900}.mode.secure{color:#176747;background:#e4f8ef}.mode.demo{color:#7a5715;background:#fff1cd}.command-content{max-width:1540px;margin:0 auto;padding:24px 24px 70px}.hero-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}.pilot-brief{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.24)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.pilot-brief h1{max-width:900px;margin:14px 0 12px;font-size:clamp(31px,4vw,55px);line-height:1.02}.pilot-brief p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.65}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.hero-actions a,.hero-actions button,.toolbar a,.toolbar button{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border:1px solid #c6d6e2;border-radius:10px;color:#285674;background:#fff;text-decoration:none;font-size:11px;font-weight:850;cursor:pointer}.hero-actions a{color:#09223b}.hero-actions button{border-color:#72afe1;color:#fff;background:transparent}.health-card{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:#fff;box-shadow:0 15px 38px rgba(24,55,83,.08);text-align:center}.health-card>small{color:#71879a;font-size:9px;font-weight:900;letter-spacing:.12em}.ring{width:178px;height:178px;display:grid;place-items:center;margin:16px 0;border-radius:50%}.ring>div{width:137px;height:137px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.ring strong,.ring span{display:block}.ring strong{font-size:49px;line-height:1}.ring span{color:#74899b;font-size:10px;font-weight:850}.health-card b{color:#16835a}.health-card em{margin-top:5px;color:#71869a;font-size:9px;font-style:normal}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.notice{display:flex;align-items:center;gap:8px;margin-top:13px;padding:11px 13px;border:1px solid #9cc7e9;border-radius:11px;color:#174d78;background:#e9f5ff;font-size:11px;font-weight:800}.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:15px}.metric-grid article,.panel,.agent-grid article{border:1px solid #dbe5ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.metric-grid article{padding:16px}.metric-grid small,.metric-grid strong,.metric-grid span{display:block}.metric-grid small{color:#70869a;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.metric-grid strong{margin-top:7px;font-size:27px}.metric-grid span{margin-top:4px;color:#60788c;font-size:9px}.two-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:17px;margin-top:17px}.panel{padding:19px}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading small,.workforce-heading small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.12em}.panel-heading h2,.workforce-heading h2{margin:5px 0 0}.priority-list{display:grid;gap:9px;margin-top:15px}.priority-list a{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:11px;border:1px solid #dce5ed;border-radius:12px;color:inherit;text-decoration:none}.priority-list strong,.priority-list small{display:block}.priority-list small{margin-top:3px;color:#73899b;font-size:9px}.priority-list p{margin:5px 0 0;color:#4d667b;font-size:10px;line-height:1.45}.priority-list>a>b{color:#295e84;font-size:11px}.severity{height:max-content;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.severity.medium{color:#19517e;background:#e6f3ff}.severity.low{color:#22704f;background:#e5f8ef}.execution-flow{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:22px}.execution-flow span{padding:9px 10px;border:1px solid #d9e4ec;border-radius:10px;color:#2d5c7e;background:#f4f9fc;font-size:9px;font-weight:850}.panel>p{color:#536d82;font-size:11px;line-height:1.6}.workforce{margin-top:18px}.workforce-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.workforce-heading>span{color:#6a8195;font-size:11px}.agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:13px}.agent-grid article{padding:14px}.agent-grid article>div{display:flex;align-items:center;gap:9px}.agent-grid article>div>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:#0b579f;background:#e1f1ff;font-size:10px;font-weight:950}.agent-grid article>div>strong{margin-right:auto}.agent-grid em{padding:4px 6px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:7px;font-style:normal;font-weight:950}.agent-grid small,.agent-grid b{display:block}.agent-grid small{margin-top:10px;color:#71869a;font-size:8px}.agent-grid b{margin-top:3px}.final-grid{align-items:stretch}.recommendation{padding:22px;border-radius:18px;color:#fff;background:linear-gradient(145deg,#07192c,#0c497f)}.recommendation small{color:#9bd1fc;font-weight:900;letter-spacing:.12em}.recommendation h2{margin:12px 0}.recommendation p{color:#d4e6f5;line-height:1.6}.recommendation a{display:inline-flex;align-items:center;gap:7px;color:#fff;font-weight:900;text-decoration:none}@media(max-width:900px){.command-sidebar{position:static;width:auto;height:auto}.command-main{margin-left:0}.hero-grid{grid-template-columns:1fr}.system-status{display:none}}@media(max-width:600px){.command-content{padding:14px 12px 60px}.workforce-heading{align-items:start;flex-direction:column}.pilot-brief h1{font-size:34px}.priority-list a{grid-template-columns:auto 1fr}.priority-list>a>b{grid-column:2}}
    `}</style>
  </main>;
}
