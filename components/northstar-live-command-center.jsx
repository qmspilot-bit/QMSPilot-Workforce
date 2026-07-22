"use client";

import { Activity, AlertTriangle, ArrowRight, Bot, BrainCircuit, CheckCircle2, ClipboardCheck, Database, Network, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Users, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const agentProfiles = {
  Pilot: ["PI", "Chief of Staff"], Atlas: ["AT", "Accountability"], Forge: ["FO", "Root Cause & Operations"], Sentinel: ["SE", "Evidence & Compliance"],
  Vector: ["VE", "Systemic Prevention"], Beacon: ["BE", "Customer Intelligence"], Ledger: ["LE", "Financial Intelligence"], Nexus: ["NE", "Growth Intelligence"],
};

function money(value) { return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }
function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function average(values) { const present = values.filter((value) => Number.isFinite(Number(value))); return present.length ? Math.round(present.reduce((sum, value) => sum + Number(value), 0) / present.length) : 0; }

function demoData() {
  return {
    mode: "demo",
    events: [
      { id: "e1", event_title: "Strategic customer recovery requires executive sponsor", source_tool: "customer-assurance", source_record_key: "CC-2026-0047", severity: "critical", financial_exposure: 28200, revenue_exposure: 180000, summary: "Customer startup, replacement delivery, measurement containment, and final response are connected." },
      { id: "e2", event_title: "Two orders remain at risk", source_tool: "delivery-assurance", source_record_key: "NDA-20260722-DEMO", severity: "critical", financial_exposure: 5600, revenue_exposure: 306000, summary: "Supplier material, equipment capability, and final inspection capacity remain constrained." },
      { id: "e3", event_title: "Out-of-tolerance bore-gage product-impact review", source_tool: "measurement-assurance", source_record_key: "OOT-2026-0006", severity: "critical", financial_exposure: 62000, revenue_exposure: 180000, summary: "The gage is quarantined and affected product requires a controlled impact decision." },
    ],
    assignments: [{ agent_code: "Pilot", assignment_status: "queued" }, { agent_code: "Atlas", assignment_status: "queued" }, { agent_code: "Forge", assignment_status: "queued" }, { agent_code: "Sentinel", assignment_status: "queued" }, { agent_code: "Ledger", assignment_status: "queued" }],
    recommendations: [{ recommendation_status: "pending_approval" }, { recommendation_status: "approved" }],
    actions: [{ action_status: "in_progress", due_date: new Date().toISOString().slice(0, 10) }, { action_status: "blocked", due_date: new Date().toISOString().slice(0, 10) }],
    writebacks: [{ writeback_status: "awaiting_human" }],
    brief: { title: "Pilot Executive Brief · Strategic Customer Recovery", executive_summary: "Protect the customer first. Approve one integrated recovery owner, restore trusted measurement capability, secure qualified final inspection, and protect the replacement shipment before expanding improvement scope.", decisions_required: [{ decision: "Approve the integrated customer-recovery command plan.", ownerRole: "Director of Operations", urgency: "today" }], priorities: [{ title: "Complete the bore-gage product-impact review", ownerRole: "Quality Manager", due: "Tomorrow" }], watchlist: ["Replacement build", "Customer commitment", "Supplier cutoff", "Final inspection evidence"], brief_status: "awaiting_review" },
    health: { customer: 82, delivery: 78, measurement: 84, supplier: 81, asset: 88, workforce: 86, process: 91 },
    value: { verified: 18375, net: 6675, roi: 0.12 },
  };
}

export default function NorthstarLiveCommandCenter() {
  const cloud = useCloudWorkspace();
  const fallback = useMemo(() => demoData(), []);
  const [data, setData] = useState(fallback);
  const [notice, setNotice] = useState("Connected demonstration operating data is active until Northstar Secure is synchronized.");
  const [busy, setBusy] = useState("");

  useEffect(() => { if (cloud.status === "ready" && cloud.organizationId) loadSecure(false); }, [cloud.status, cloud.organizationId]);

  async function latestSnapshot(supabase, table, fields) {
    return supabase.from(table).select(fields).eq("organization_id", cloud.organizationId).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  }

  async function loadSecure(showNotice = true) {
    if (!cloud.organizationId) { setNotice("Sign in to Northstar Secure to activate live executive metrics."); return; }
    const supabase = createClient(); if (!supabase) return;
    setBusy("sync");
    try {
      const [events, assignments, recommendations, actions, writebacks, briefs, customer, delivery, measurement, supplier, asset, workforce, process, value] = await Promise.all([
        supabase.from("northstar_intelligence_events").select("*").eq("organization_id", cloud.organizationId).not("event_status", "in", "(closed,dismissed)").order("source_submitted_at", { ascending: false }).limit(100),
        supabase.from("northstar_agent_assignments").select("agent_code,assignment_status,priority").eq("organization_id", cloud.organizationId).order("assigned_at", { ascending: false }).limit(500),
        supabase.from("northstar_agent_recommendations").select("recommendation_status,risk_level").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_workforce_actions").select("*").eq("organization_id", cloud.organizationId).order("due_date", { ascending: true, nullsFirst: false }).limit(300),
        supabase.from("northstar_writeback_requests").select("writeback_status").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_executive_briefs").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        latestSnapshot(supabase, "customer_assurance_snapshots", "assurance_score"),
        latestSnapshot(supabase, "delivery_assurance_snapshots", "assurance_score"),
        latestSnapshot(supabase, "measurement_assurance_snapshots", "confidence_score"),
        latestSnapshot(supabase, "supplier_assurance_snapshots", "assurance_score"),
        latestSnapshot(supabase, "asset_reliability_snapshots", "reliability_score"),
        latestSnapshot(supabase, "workforce_readiness_snapshots", "readiness_score"),
        supabase.from("process_assurance_audits").select("score").eq("organization_id", cloud.organizationId).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
        latestSnapshot(supabase, "value_ledger_snapshots", "verified_realized_value,net_realized_value,qmspilot_roi"),
      ]);
      const results = [events, assignments, recommendations, actions, writebacks, briefs, customer, delivery, measurement, supplier, asset, workforce, process, value];
      const error = results.find((result) => result.error)?.error; if (error) throw error;
      if (!events.data?.length) { if (showNotice) setNotice("Northstar Secure is connected. Submit a controlled tool record to populate live executive intelligence."); return; }
      setData({
        mode: "secure",
        events: events.data || [], assignments: assignments.data || [], recommendations: recommendations.data || [], actions: actions.data || [], writebacks: writebacks.data || [], brief: briefs.data || null,
        health: { customer: customer.data?.assurance_score, delivery: delivery.data?.assurance_score, measurement: measurement.data?.confidence_score, supplier: supplier.data?.assurance_score, asset: asset.data?.reliability_score, workforce: workforce.data?.readiness_score, process: process.data?.score },
        value: { verified: value.data?.verified_realized_value || 0, net: value.data?.net_realized_value || 0, roi: value.data?.qmspilot_roi || 0 },
      });
      if (showNotice) setNotice(`${events.data.length} live operating events synchronized from Northstar Secure.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Live Command Center synchronization failed."); }
    finally { setBusy(""); }
  }

  async function runOperatingRhythm() {
    const token = await cloud.getAccessToken();
    if (!token) { setNotice("Sign in to Northstar Secure before running the Pilot and Atlas operating rhythm."); return; }
    setBusy("rhythm");
    try {
      const response = await fetch("/api/northstar-operating-rhythm", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ mode: "manual" }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "The operating rhythm could not run.");
      setNotice("Pilot and Atlas completed the operating rhythm. The new executive brief awaits human review.");
      await loadSecure(false);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The operating rhythm could not run."); }
    finally { setBusy(""); }
  }

  const activeEvents = data.events || [];
  const critical = activeEvents.filter((event) => event.severity === "critical");
  const high = activeEvents.filter((event) => event.severity === "high");
  const financialExposure = activeEvents.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const revenueExposure = activeEvents.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const openActions = (data.actions || []).filter((action) => !["done", "rejected"].includes(action.action_status));
  const pendingRecommendations = (data.recommendations || []).filter((item) => item.recommendation_status === "pending_approval").length;
  const pendingWritebacks = (data.writebacks || []).filter((item) => !["executed", "rejected"].includes(item.writeback_status)).length;
  const healthScore = average(Object.values(data.health || {}));
  const priorities = [...activeEvents].sort((a, b) => ({ critical: 4, high: 3, medium: 2, low: 1 }[b.severity] || 0) - ({ critical: 4, high: 3, medium: 2, low: 1 }[a.severity] || 0)).slice(0, 5);
  const agentLoad = Object.keys(agentProfiles).map((agent) => ({ agent, count: (data.assignments || []).filter((item) => item.agent_code === agent && !["approved", "rejected", "closed"].includes(item.assignment_status)).length }));
  const brief = data.brief || fallback.brief;

  return <main className="cc-shell">
    <aside className="sidebar"><div className="brand"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/></div><div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div><div className="pilot"><span>PI</span><div><strong>Pilot</strong><small>Online · supervised</small></div></div><nav><a className="active" href="/">Command Center</a><a href="/workforce-operations">AI Workforce Operations</a><a href="/entity-graph">Entity Graph</a><a href="/dashboard">Accountability</a><a href="/toolbox">Digital Toolbox</a></nav><div className="system"><small>SYSTEM STATUS</small><span>● Intelligence Bus online</span><span>● Closed-loop writeback active</span><span>● Human authority preserved</span><span>● Entity Graph connected</span></div></aside>
    <section className="main"><header className="topbar"><div><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div><span className={`mode ${data.mode}`}>{data.mode === "secure" ? "Live Northstar Secure" : "Design-partner demonstration"}</span></header>
      <div className="content">
        <section className="hero"><article className="brief"><div className="eyebrow"><BrainCircuit size={17}/> PILOT EXECUTIVE BRIEFING</div><h1>{brief?.title || "Pilot is standing by"}</h1><p>{brief?.executive_summary || "Submit connected operating records to create the first executive brief."}</p><div className="hero-actions"><a href="/workforce-operations">Review decisions <ArrowRight size={16}/></a><button onClick={runOperatingRhythm} disabled={busy === "rhythm"}><RefreshCw size={16}/>{busy === "rhythm" ? "Pilot and Atlas are running..." : "Run Pilot + Atlas rhythm"}</button></div></article><article className="health"><small>COMPANY HEALTH</small><div className="ring" style={{ background: `conic-gradient(#0a66ff ${healthScore * 3.6}deg,#dce7ef 0)` }}><div><strong>{healthScore || 0}</strong><span>out of 100</span></div></div><b>{healthScore >= 90 ? "Strong · controlled" : healthScore >= 80 ? "Stable · attention required" : "Leadership intervention required"}</b><em>{data.mode === "secure" ? "Calculated from live connected systems" : "Demonstration model"}</em></article></section>

        <div className="toolbar"><button onClick={() => loadSecure(true)} disabled={busy === "sync"}><RefreshCw size={16}/>{busy === "sync" ? "Synchronizing..." : "Sync live data"}</button><a href="/workforce-operations"><Network size={16}/>Open Intelligence Bus</a><a href="/entity-graph"><Database size={16}/>Open Entity Graph</a><a href="/toolbox"><ClipboardCheck size={16}/>Open Digital Toolbox</a></div>
        {notice && <div className="notice"><Activity size={17}/>{notice}</div>}

        <section className="metrics"><article><small>Critical events</small><strong>{critical.length}</strong><span>{high.length} additional high priority</span></article><article><small>Revenue exposure</small><strong>{money(revenueExposure)}</strong><span>Not counted as savings</span></article><article><small>Financial exposure</small><strong>{money(financialExposure)}</strong><span>Connected operating loss and risk</span></article><article><small>Open actions</small><strong>{openActions.length}</strong><span>{openActions.filter((item) => item.action_status === "blocked").length} blocked</span></article><article><small>Human decisions</small><strong>{pendingRecommendations}</strong><span>Agent recommendations awaiting approval</span></article><article><small>Writebacks</small><strong>{pendingWritebacks}</strong><span>Awaiting target-tool execution</span></article><article><small>Verified value</small><strong>{money(data.value?.verified)}</strong><span>{money(data.value?.net)} net realized</span></article><article><small>QMSPilot ROI</small><strong>{Number(data.value?.roi || 0).toFixed(2)}x</strong><span>Financially governed Value Ledger basis</span></article></section>

        <section className="two"><article className="panel"><div className="heading"><div><small>ENTERPRISE HEALTH MODEL</small><h2>What is driving company health</h2></div><TrendingUp size={24}/></div><div className="health-list">{Object.entries(data.health || {}).map(([name, score]) => <div key={name}><div><span><strong>{titleCase(name)}</strong><small>Latest connected assurance score</small></span><b>{score ?? "—"}</b></div><div className="track"><span style={{ width: `${Number(score || 0)}%` }}/></div></div>)}</div></article><article className="panel"><div className="heading"><div><small>LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><AlertTriangle size={24}/></div><div className="priority-list">{priorities.map((event) => <a href={event.source_path || "/workforce-operations"} key={event.id}><span className={`severity ${event.severity}`}>{event.severity}</span><div><strong>{event.event_title}</strong><small>{titleCase(event.source_tool)} · {event.source_record_key}</small><p>{event.summary}</p></div><b>{money(Number(event.revenue_exposure || 0) || Number(event.financial_exposure || 0))}</b></a>)}</div></article></section>

        <section className="workforce"><div className="section-heading"><div><small>AI WORKFORCE</small><h2>Every digital specialist works from the same operating context.</h2></div><span>Queues reflect Intelligence Bus assignments, not simulated activity.</span></div><div className="agent-grid">{agentLoad.map(({ agent, count }) => { const profile = agentProfiles[agent]; return <article key={agent}><div className="agent-head"><span>{profile[0]}</span><div><strong>{agent}</strong><small>{profile[1]}</small></div><em>{count ? "ACTIVE" : "READY"}</em></div><div className="agent-kpi"><span><small>Open assignments</small><strong>{count}</strong></span><span><small>Authority</small><strong>Human</strong></span></div></article>; })}</div></section>

        <section className="two bottom"><article className="panel"><div className="heading"><div><small>CLOSED-LOOP EXECUTION</small><h2>Recommendations now become controlled work.</h2></div><CheckCircle2 size={24}/></div><div className="flow"><span><Bot/>Agent recommendation</span><ArrowRight/><span><ShieldCheck/>Human approval</span><ArrowRight/><span><ClipboardCheck/>Native writeback</span><ArrowRight/><span><CheckCircle2/>Evidence closure</span></div><p>Approved actions are written into the target Northstar application, updated where the work occurs, synchronized back to Atlas, and used to close the originating event only after verification.</p></article><article className="recommendation"><small>PILOT RECOMMENDATION</small><h2>{brief?.decisions_required?.[0]?.decision || "Maintain the connected operating rhythm."}</h2><p>{brief?.decisions_required?.[0]?.reason || brief?.priorities?.[0]?.title || "Review the highest-risk event and approve one accountable response."}</p><a href="/workforce-operations">Open human decision queue <ArrowRight size={16}/></a></article></section>

        <p className="boundary"><strong>Operating boundary:</strong> Northstar analyzes, routes, recommends, writes only after authorization, and preserves evidence. Qualified humans retain authority for customer commitments, product release, financial validation, corrective-action closure, and management decisions.</p>
      </div>
    </section>
    <style>{`
      *{box-sizing:border-box}body{margin:0;background:#edf3f8}.cc-shell{min-height:100vh;color:#12263a;font-family:Inter,Arial,sans-serif}.sidebar{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;color:white;background:linear-gradient(180deg,#061729,#0a2744);overflow:auto}.brand,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:5px 9px;border-radius:13px;background:white}.northstar{margin-top:8px;background:#020914}.brand img,.northstar img{max-width:190px;max-height:48px}.pilot{display:flex;align-items:center;gap:10px;margin:17px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.pilot>span{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:#0a66ff;font-weight:900}.pilot strong,.pilot small{display:block}.pilot small{margin-top:3px;color:#9abbd6}.sidebar nav{display:grid;gap:6px}.sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.sidebar nav a.active{color:white;background:#0d4a7c}.system{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.system small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.main{margin-left:258px}.topbar{position:sticky;top:0;z-index:20;min-height:68px;display:flex;align-items:center;gap:12px;padding:0 23px;border-bottom:1px solid #d7e3ec;background:rgba(255,255,255,.96)}.topbar>div{margin-right:auto}.topbar small,.topbar strong{display:block}.topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.mode{padding:8px 11px;border-radius:999px;font-size:10px;font-weight:900}.mode.secure{color:#176747;background:#e4f8ef}.mode.demo{color:#7a5715;background:#fff1cd}.content{max-width:1600px;margin:auto;padding:24px 23px 70px}.hero{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.brief{padding:30px;border-radius:24px;color:white;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.24)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.brief h1{max-width:900px;margin:14px 0 12px;font-size:clamp(31px,4vw,55px);line-height:1.02}.brief p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.65}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.hero-actions a,.hero-actions button{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 14px;border:0;border-radius:10px;color:#09223b;background:white;text-decoration:none;font-size:11px;font-weight:900;cursor:pointer}.hero-actions button{border:1px solid #72afe1;color:white;background:transparent}.health{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:white;box-shadow:0 15px 38px rgba(24,55,83,.08);text-align:center}.health>small{color:#71879a;font-size:9px;font-weight:900;letter-spacing:.12em}.ring{width:178px;height:178px;margin:16px 0;display:grid;place-items:center;border-radius:50%}.ring>div{width:137px;height:137px;display:grid;place-items:center;align-content:center;border-radius:50%;background:white}.ring strong,.ring span{display:block}.ring strong{font-size:49px;line-height:1}.ring span{color:#74899b;font-size:10px;font-weight:850}.health b{color:#16835a}.health em{margin-top:5px;color:#71869a;font-size:9px;font-style:normal}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.toolbar button,.toolbar a{display:inline-flex;align-items:center;gap:7px;min-height:39px;padding:0 12px;border:1px solid #c6d6e2;border-radius:9px;color:#285674;background:white;text-decoration:none;font-size:10px;font-weight:850;cursor:pointer}.notice{display:flex;align-items:center;gap:8px;margin-top:13px;padding:11px 13px;border:1px solid #9cc7e9;border-radius:11px;color:#174d78;background:#e9f5ff;font-size:11px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:15px}.metrics article,.panel,.agent-grid article{border:1px solid #dbe5ed;border-radius:17px;background:white;box-shadow:0 11px 28px rgba(24,53,77,.07)}.metrics article{padding:16px}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70869a;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.metrics strong{margin-top:7px;font-size:27px}.metrics span{margin-top:4px;color:#60788c;font-size:9px}.two{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:17px}.panel{padding:19px}.heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.heading small,.section-heading small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.12em}.heading h2,.section-heading h2{margin:5px 0 0}.health-list{display:grid;gap:12px;margin-top:16px}.health-list>div>div:first-child{display:flex;align-items:center}.health-list span:first-child{margin-right:auto}.health-list strong,.health-list small{display:block}.health-list small{margin-top:3px;color:#71869a;font-size:9px}.track{height:7px;margin-top:7px;border-radius:999px;background:#e5edf3;overflow:hidden}.track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#7fdbff)}.priority-list{display:grid;gap:9px;margin-top:15px}.priority-list a{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:11px;border:1px solid #dce5ed;border-radius:12px;color:inherit;text-decoration:none}.priority-list strong,.priority-list small{display:block}.priority-list small{margin-top:3px;color:#73899b;font-size:9px}.priority-list p{margin:5px 0 0;color:#4d667b;font-size:10px;line-height:1.45}.priority-list>b{color:#295e84;font-size:11px}.severity{height:max-content;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.severity.medium{color:#19517e;background:#e6f3ff}.severity.low{color:#22704f;background:#e5f8ef}.workforce{margin-top:18px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.section-heading>span{max-width:390px;color:#6a8195;font-size:11px;text-align:right}.agent-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:13px}.agent-grid article{padding:14px}.agent-head{display:flex;align-items:center;gap:9px}.agent-head>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:#0b579f;background:#e1f1ff;font-size:10px;font-weight:950}.agent-head>div{margin-right:auto}.agent-head strong,.agent-head small{display:block}.agent-head small{margin-top:3px;color:#71869a;font-size:8px}.agent-head em{padding:4px 6px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:7px;font-style:normal;font-weight:950}.agent-kpi{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid #e1e8ee}.agent-kpi small,.agent-kpi strong{display:block}.agent-kpi small{color:#71869a;font-size:8px}.agent-kpi strong{margin-top:4px}.bottom{align-items:stretch}.flow{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.flow span{display:flex;align-items:center;gap:7px;padding:10px;border:1px solid #d9e4ec;border-radius:10px;color:#2d5c7e;background:#f4f9fc;font-size:9px;font-weight:850}.flow svg{width:15px}.panel>p{color:#536d82;font-size:11px;line-height:1.6}.recommendation{padding:22px;border-radius:18px;color:white;background:linear-gradient(145deg,#07192c,#0c497f)}.recommendation small{color:#9bd1fc;font-weight:900;letter-spacing:.12em}.recommendation h2{margin:12px 0}.recommendation p{color:#d4e6f5;line-height:1.6}.recommendation a{display:inline-flex;align-items:center;gap:7px;margin-top:8px;color:white;font-weight:900;text-decoration:none}.boundary{margin:17px 0 0;padding:13px;color:#5c7488;font-size:10px;line-height:1.55}@media(max-width:1200px){.agent-grid{grid-template-columns:repeat(2,1fr)}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.sidebar{position:static;width:auto}.main{margin-left:0}.hero,.two{grid-template-columns:1fr}.topbar{position:static}.system{display:none}}@media(max-width:600px){.content{padding:14px 12px 60px}.metrics,.agent-grid{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.section-heading>span{text-align:left}.brief h1{font-size:34px}.priority-list a{grid-template-columns:auto 1fr}.priority-list>b{grid-column:2}}
    `}</style>
  </main>;
}
