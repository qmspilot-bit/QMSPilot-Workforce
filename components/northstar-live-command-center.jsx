"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Network,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
const AGENTS = [
  ["Pilot", "PI", "Chief of Staff"],
  ["Atlas", "AT", "Accountability"],
  ["Forge", "FO", "Root Cause & Operations"],
  ["Sentinel", "SE", "Evidence & Compliance"],
  ["Vector", "VE", "Systemic Prevention"],
  ["Beacon", "BE", "Customer Intelligence"],
  ["Ledger", "LE", "Financial Intelligence"],
  ["Nexus", "NE", "Growth Intelligence"],
];

function currency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function average(values) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return 0;
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function demoState() {
  return {
    mode: "demo",
    events: [
      {
        id: "demo-customer",
        event_title: "Strategic customer recovery requires one executive sponsor",
        source_tool: "customer-assurance",
        source_record_key: "CC-2026-0047",
        source_path: "/tools/customer-assurance",
        severity: "critical",
        summary: "Customer startup, replacement delivery, measurement containment, and final response remain connected.",
        financial_exposure: 28200,
        revenue_exposure: 180000,
      },
      {
        id: "demo-delivery",
        event_title: "Two strategic orders remain at risk",
        source_tool: "delivery-assurance",
        source_record_key: "NDA-20260722-DEMO",
        source_path: "/tools/delivery-assurance",
        severity: "critical",
        summary: "Supplier material, equipment capability, and final inspection capacity remain constrained.",
        financial_exposure: 5600,
        revenue_exposure: 306000,
      },
      {
        id: "demo-measurement",
        event_title: "Out-of-tolerance bore-gage impact review",
        source_tool: "measurement-assurance",
        source_record_key: "OOT-2026-0006",
        source_path: "/tools/measurement-assurance",
        severity: "critical",
        summary: "The gage is quarantined and affected product requires a controlled impact decision.",
        financial_exposure: 62000,
        revenue_exposure: 180000,
      },
    ],
    assignments: [
      { agent_code: "Pilot", assignment_status: "queued" },
      { agent_code: "Atlas", assignment_status: "queued" },
      { agent_code: "Forge", assignment_status: "queued" },
      { agent_code: "Sentinel", assignment_status: "queued" },
      { agent_code: "Ledger", assignment_status: "queued" },
    ],
    recommendations: [{ recommendation_status: "pending_approval" }],
    actions: [
      { action_status: "in_progress" },
      { action_status: "blocked" },
    ],
    writebacks: [{ writeback_status: "awaiting_human" }],
    brief: {
      title: "Pilot Executive Brief · Strategic Customer Recovery",
      executive_summary: "Protect the customer first. Approve one integrated recovery owner, restore trusted measurement capability, secure qualified final inspection, and protect the replacement shipment.",
      decisions_required: [
        {
          decision: "Approve the integrated customer-recovery command plan.",
          reason: "$180,000 in strategic customer revenue remains exposed.",
        },
      ],
    },
    health: {
      Customer: 82,
      Delivery: 78,
      Measurement: 84,
      Supplier: 81,
      Assets: 88,
      Workforce: 86,
      Process: 91,
    },
    value: { verified: 18375, net: 6675, roi: 0.12 },
  };
}

export default function NorthstarLiveCommandCenter() {
  const cloud = useCloudWorkspace();
  const fallback = useMemo(demoState, []);
  const [workspace, setWorkspace] = useState(fallback);
  const [notice, setNotice] = useState("Design-partner connected operating scenario loaded.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (cloud.status === "ready" && cloud.organizationId) {
      void syncSecure(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloud.status, cloud.organizationId]);

  async function syncSecure(showNotice = true) {
    if (!cloud.organizationId) {
      setNotice("Sign in to Northstar Secure to activate live executive metrics.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setBusy("sync");

    try {
      const latest = (table, columns, dateColumn = "submitted_at") => supabase
        .from(table)
        .select(columns)
        .eq("organization_id", cloud.organizationId)
        .order(dateColumn, { ascending: false })
        .limit(1)
        .maybeSingle();

      const results = await Promise.all([
        supabase.from("northstar_intelligence_events").select("*").eq("organization_id", cloud.organizationId).order("source_submitted_at", { ascending: false }).limit(100),
        supabase.from("northstar_agent_assignments").select("agent_code,assignment_status,priority").eq("organization_id", cloud.organizationId).order("assigned_at", { ascending: false }).limit(500),
        supabase.from("northstar_agent_recommendations").select("recommendation_status,risk_level").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_workforce_actions").select("action_status,priority,due_date").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_writeback_requests").select("writeback_status").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_executive_briefs").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        latest("customer_assurance_snapshots", "assurance_score"),
        latest("delivery_assurance_snapshots", "assurance_score"),
        latest("measurement_assurance_snapshots", "confidence_score"),
        latest("supplier_assurance_snapshots", "assurance_score"),
        latest("asset_reliability_snapshots", "reliability_score"),
        latest("workforce_readiness_snapshots", "readiness_score"),
        latest("process_assurance_audits", "score"),
        latest("value_ledger_snapshots", "verified_realized_value,net_realized_value,qmspilot_roi"),
      ]);

      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const [events, assignments, recommendations, actions, writebacks, briefs, customer, delivery, measurement, supplier, assets, workforce, process, value] = results;
      const activeEvents = (events.data || []).filter((event) => !["closed", "dismissed"].includes(event.event_status));
      if (!activeEvents.length) {
        if (showNotice) setNotice("Northstar Secure is connected. Submit a controlled tool record to create live executive intelligence.");
        return;
      }

      setWorkspace({
        mode: "secure",
        events: activeEvents,
        assignments: assignments.data || [],
        recommendations: recommendations.data || [],
        actions: actions.data || [],
        writebacks: writebacks.data || [],
        brief: briefs.data || fallback.brief,
        health: {
          Customer: customer.data?.assurance_score,
          Delivery: delivery.data?.assurance_score,
          Measurement: measurement.data?.confidence_score,
          Supplier: supplier.data?.assurance_score,
          Assets: assets.data?.reliability_score,
          Workforce: workforce.data?.readiness_score,
          Process: process.data?.score,
        },
        value: {
          verified: value.data?.verified_realized_value || 0,
          net: value.data?.net_realized_value || 0,
          roi: value.data?.qmspilot_roi || 0,
        },
      });
      if (showNotice) setNotice(`${activeEvents.length} live operating events synchronized from Northstar Secure.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Live Command Center synchronization failed.");
    } finally {
      setBusy("");
    }
  }

  async function runRhythm() {
    const accessToken = await cloud.getAccessToken();
    if (!accessToken) {
      setNotice("Sign in to Northstar Secure before running the Pilot and Atlas operating rhythm.");
      return;
    }
    setBusy("rhythm");
    try {
      const response = await fetch("/api/northstar-operating-rhythm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ mode: "manual" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The operating rhythm could not run.");
      setNotice("Pilot and Atlas completed the operating rhythm. The new executive brief awaits human review.");
      await syncSecure(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The operating rhythm could not run.");
    } finally {
      setBusy("");
    }
  }

  const events = workspace.events || [];
  const criticalCount = events.filter((event) => event.severity === "critical").length;
  const highCount = events.filter((event) => event.severity === "high").length;
  const financialExposure = events.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const revenueExposure = events.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const openActions = (workspace.actions || []).filter((action) => !["done", "rejected"].includes(action.action_status));
  const blockedCount = openActions.filter((action) => action.action_status === "blocked").length;
  const pendingRecommendations = (workspace.recommendations || []).filter((item) => item.recommendation_status === "pending_approval").length;
  const pendingWritebacks = (workspace.writebacks || []).filter((item) => !["executed", "rejected"].includes(item.writeback_status)).length;
  const healthScore = average(Object.values(workspace.health || {}));
  const priorities = [...events]
    .sort((left, right) => (SEVERITY_RANK[right.severity] || 0) - (SEVERITY_RANK[left.severity] || 0))
    .slice(0, 5);
  const brief = workspace.brief || fallback.brief;

  return (
    <main className="cc-shell">
      <aside className="sidebar">
        <div className="logo-card"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar-card"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="pilot-card"><span>PI</span><div><strong>Pilot</strong><small>Online · supervised</small></div></div>
        <nav>
          <a className="active" href="/">Command Center</a>
          <a href="/workforce-operations">AI Workforce Operations</a>
          <a href="/entity-graph">Entity Graph</a>
          <a href="/dashboard">Accountability</a>
          <a href="/toolbox">Digital Toolbox</a>
        </nav>
        <div className="system-status">
          <small>SYSTEM STATUS</small>
          <span>● Intelligence Bus online</span>
          <span>● Closed-loop writeback active</span>
          <span>● Human authority preserved</span>
          <span>● Entity Graph connected</span>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div>
          <span className={`mode ${workspace.mode}`}>{workspace.mode === "secure" ? "Live Northstar Secure" : "Design-partner demonstration"}</span>
        </header>

        <div className="content">
          <section className="hero-grid">
            <article className="pilot-brief">
              <div className="eyebrow"><BrainCircuit size={17} /> PILOT EXECUTIVE BRIEFING</div>
              <h1>{brief.title}</h1>
              <p>{brief.executive_summary}</p>
              <div className="hero-actions">
                <a href="/workforce-operations">Review decisions <ArrowRight size={16} /></a>
                <button type="button" onClick={() => void runRhythm()} disabled={busy === "rhythm"}>
                  <RefreshCw size={16} /> {busy === "rhythm" ? "Pilot and Atlas are running..." : "Run Pilot + Atlas rhythm"}
                </button>
              </div>
            </article>

            <article className="health-card">
              <small>COMPANY HEALTH</small>
              <div className="health-ring" style={{ background: `conic-gradient(#0a66ff ${healthScore * 3.6}deg,#dce7ef 0)` }}>
                <div><strong>{healthScore}</strong><span>out of 100</span></div>
              </div>
              <b>{healthScore >= 90 ? "Strong · controlled" : healthScore >= 80 ? "Stable · attention required" : "Leadership intervention required"}</b>
              <em>{workspace.mode === "secure" ? "Calculated from live connected systems" : "Demonstration model"}</em>
            </article>
          </section>

          <section className="toolbar">
            <button type="button" onClick={() => void syncSecure(true)} disabled={busy === "sync"}><RefreshCw size={16} /> {busy === "sync" ? "Synchronizing..." : "Sync live data"}</button>
            <a href="/workforce-operations"><Network size={16} /> Intelligence Bus</a>
            <a href="/entity-graph"><Database size={16} /> Entity Graph</a>
            <a href="/toolbox"><ClipboardCheck size={16} /> Digital Toolbox</a>
          </section>

          {notice && <div className="notice"><Activity size={17} /> {notice}</div>}

          <section className="metrics">
            <article><small>Critical events</small><strong>{criticalCount}</strong><span>{highCount} additional high priority</span></article>
            <article><small>Revenue exposure</small><strong>{currency(revenueExposure)}</strong><span>Never counted as savings</span></article>
            <article><small>Financial exposure</small><strong>{currency(financialExposure)}</strong><span>Connected operating loss and risk</span></article>
            <article><small>Open actions</small><strong>{openActions.length}</strong><span>{blockedCount} blocked</span></article>
            <article><small>Human decisions</small><strong>{pendingRecommendations}</strong><span>Recommendations awaiting approval</span></article>
            <article><small>Writebacks</small><strong>{pendingWritebacks}</strong><span>Awaiting target-tool execution</span></article>
            <article><small>Verified value</small><strong>{currency(workspace.value?.verified)}</strong><span>{currency(workspace.value?.net)} net realized</span></article>
            <article><small>QMSPilot ROI</small><strong>{Number(workspace.value?.roi || 0).toFixed(2)}x</strong><span>Value Ledger basis</span></article>
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-heading"><div><small>ENTERPRISE HEALTH MODEL</small><h2>What is driving company health</h2></div><TrendingUp size={24} /></div>
              <div className="health-list">
                {Object.entries(workspace.health || {}).map(([label, score]) => (
                  <div key={label}>
                    <div className="health-row"><span><strong>{label}</strong><small>Latest connected assurance score</small></span><b>{score ?? "—"}</b></div>
                    <div className="track"><span style={{ width: `${Number(score || 0)}%` }} /></div>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading"><div><small>LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><AlertTriangle size={24} /></div>
              <div className="priority-list">
                {priorities.map((event) => (
                  <a href={event.source_path || "/workforce-operations"} key={event.id}>
                    <span className={`severity ${event.severity}`}>{event.severity}</span>
                    <div><strong>{event.event_title}</strong><small>{titleCase(event.source_tool)} · {event.source_record_key}</small><p>{event.summary}</p></div>
                    <b>{currency(Number(event.revenue_exposure || 0) || Number(event.financial_exposure || 0))}</b>
                  </a>
                ))}
              </div>
            </article>
          </section>

          <section className="workforce-section">
            <div className="section-heading"><div><small>AI WORKFORCE</small><h2>One team working from the same operating context.</h2></div><span>Queues reflect Intelligence Bus assignments—not simulated activity.</span></div>
            <div className="agent-grid">
              {AGENTS.map(([name, initials, role]) => {
                const openAssignments = (workspace.assignments || []).filter((assignment) => assignment.agent_code === name && !["approved", "rejected", "closed"].includes(assignment.assignment_status)).length;
                return (
                  <article key={name}>
                    <div className="agent-head"><span>{initials}</span><div><strong>{name}</strong><small>{role}</small></div><em>{openAssignments ? "ACTIVE" : "READY"}</em></div>
                    <div className="agent-kpi"><span><small>Open assignments</small><strong>{openAssignments}</strong></span><span><small>Final authority</small><strong>Human</strong></span></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="two-column bottom-grid">
            <article className="panel">
              <div className="panel-heading"><div><small>CLOSED-LOOP EXECUTION</small><h2>Recommendations become controlled work.</h2></div><CheckCircle2 size={24} /></div>
              <div className="flow"><span><Bot />Agent recommendation</span><ArrowRight /><span><ShieldCheck />Human approval</span><ArrowRight /><span><ClipboardCheck />Native writeback</span><ArrowRight /><span><CheckCircle2 />Evidence closure</span></div>
              <p>Approved actions are written into the target application, updated where the work occurs, synchronized back to Atlas, and used to close the originating event only after verification.</p>
            </article>

            <article className="recommendation-card">
              <small>PILOT RECOMMENDATION</small>
              <h2>{brief.decisions_required?.[0]?.decision || "Maintain the connected operating rhythm."}</h2>
              <p>{brief.decisions_required?.[0]?.reason || "Review the highest-risk event and approve one accountable response."}</p>
              <a href="/workforce-operations">Open human decision queue <ArrowRight size={16} /></a>
            </article>
          </section>

          <p className="boundary"><strong>Operating boundary:</strong> Northstar analyzes, routes, recommends, and writes only after authorization. Qualified humans retain authority for customer commitments, product release, financial validation, corrective-action closure, and management decisions.</p>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.cc-shell{min-height:100vh;color:#12263a;font-family:Inter,Arial,sans-serif}.sidebar{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744);overflow:auto}.logo-card,.northstar-card{height:58px;display:flex;align-items:center;justify-content:center;padding:5px 9px;border-radius:13px;background:#fff}.northstar-card{margin-top:8px;background:#020914}.logo-card img,.northstar-card img{max-width:190px;max-height:48px}.pilot-card{display:flex;align-items:center;gap:10px;margin:17px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.pilot-card>span{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:#0a66ff;font-weight:900}.pilot-card strong,.pilot-card small{display:block}.pilot-card small{margin-top:3px;color:#9abbd6}.sidebar nav{display:grid;gap:6px}.sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.sidebar nav a.active{color:#fff;background:#0d4a7c}.system-status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.system-status small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.main{margin-left:258px}.topbar{position:sticky;top:0;z-index:20;min-height:68px;display:flex;align-items:center;gap:12px;padding:0 23px;border-bottom:1px solid #d7e3ec;background:rgba(255,255,255,.96)}.topbar>div{margin-right:auto}.topbar small,.topbar strong{display:block}.topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.mode{padding:8px 11px;border-radius:999px;font-size:10px;font-weight:900}.mode.secure{color:#176747;background:#e4f8ef}.mode.demo{color:#7a5715;background:#fff1cd}.content{max-width:1600px;margin:auto;padding:24px 23px 70px}.hero-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.pilot-brief{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.24)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.pilot-brief h1{max-width:900px;margin:14px 0 12px;font-size:clamp(31px,4vw,55px);line-height:1.02}.pilot-brief p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.65}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.hero-actions a,.hero-actions button{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 14px;border:0;border-radius:10px;color:#09223b;background:#fff;text-decoration:none;font-size:11px;font-weight:900;cursor:pointer}.hero-actions button{border:1px solid #72afe1;color:#fff;background:transparent}.health-card{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:#fff;box-shadow:0 15px 38px rgba(24,55,83,.08);text-align:center}.health-card>small{color:#71879a;font-size:9px;font-weight:900;letter-spacing:.12em}.health-ring{width:178px;height:178px;margin:16px 0;display:grid;place-items:center;border-radius:50%}.health-ring>div{width:137px;height:137px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.health-ring strong,.health-ring span{display:block}.health-ring strong{font-size:49px;line-height:1}.health-ring span{color:#74899b;font-size:10px;font-weight:850}.health-card b{color:#16835a}.health-card em{margin-top:5px;color:#71869a;font-size:9px;font-style:normal}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.toolbar button,.toolbar a{display:inline-flex;align-items:center;gap:7px;min-height:39px;padding:0 12px;border:1px solid #c6d6e2;border-radius:9px;color:#285674;background:#fff;text-decoration:none;font-size:10px;font-weight:850;cursor:pointer}.notice{display:flex;align-items:center;gap:8px;margin-top:13px;padding:11px 13px;border:1px solid #9cc7e9;border-radius:11px;color:#174d78;background:#e9f5ff;font-size:11px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:15px}.metrics article,.panel,.agent-grid article{border:1px solid #dbe5ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.metrics article{padding:16px}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70869a;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.metrics strong{margin-top:7px;font-size:27px}.metrics span{margin-top:4px;color:#60788c;font-size:9px}.two-column{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-top:17px}.panel{padding:19px}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading small,.section-heading small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.12em}.panel-heading h2,.section-heading h2{margin:5px 0 0}.health-list{display:grid;gap:12px;margin-top:16px}.health-row{display:flex;align-items:center}.health-row span{margin-right:auto}.health-row strong,.health-row small{display:block}.health-row small{margin-top:3px;color:#71869a;font-size:9px}.track{height:7px;margin-top:7px;border-radius:999px;background:#e5edf3;overflow:hidden}.track span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#7fdbff)}.priority-list{display:grid;gap:9px;margin-top:15px}.priority-list a{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:11px;border:1px solid #dce5ed;border-radius:12px;color:inherit;text-decoration:none}.priority-list strong,.priority-list small{display:block}.priority-list small{margin-top:3px;color:#73899b;font-size:9px}.priority-list p{margin:5px 0 0;color:#4d667b;font-size:10px;line-height:1.45}.priority-list>a>b{color:#295e84;font-size:11px}.severity{height:max-content;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.severity.medium{color:#19517e;background:#e6f3ff}.severity.low{color:#22704f;background:#e5f8ef}.workforce-section{margin-top:18px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.section-heading>span{max-width:390px;color:#6a8195;font-size:11px;text-align:right}.agent-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:13px}.agent-grid article{padding:14px}.agent-head{display:flex;align-items:center;gap:9px}.agent-head>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:#0b579f;background:#e1f1ff;font-size:10px;font-weight:950}.agent-head>div{margin-right:auto}.agent-head strong,.agent-head small{display:block}.agent-head small{margin-top:3px;color:#71869a;font-size:8px}.agent-head em{padding:4px 6px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:7px;font-style:normal;font-weight:950}.agent-kpi{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid #e1e8ee}.agent-kpi small,.agent-kpi strong{display:block}.agent-kpi small{color:#71869a;font-size:8px}.agent-kpi strong{margin-top:4px}.bottom-grid{align-items:stretch}.flow{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.flow span{display:flex;align-items:center;gap:7px;padding:10px;border:1px solid #d9e4ec;border-radius:10px;color:#2d5c7e;background:#f4f9fc;font-size:9px;font-weight:850}.flow svg{width:15px}.panel>p{color:#536d82;font-size:11px;line-height:1.6}.recommendation-card{padding:22px;border-radius:18px;color:#fff;background:linear-gradient(145deg,#07192c,#0c497f)}.recommendation-card small{color:#9bd1fc;font-weight:900;letter-spacing:.12em}.recommendation-card h2{margin:12px 0}.recommendation-card p{color:#d4e6f5;line-height:1.6}.recommendation-card a{display:inline-flex;align-items:center;gap:7px;margin-top:8px;color:#fff;font-weight:900;text-decoration:none}.boundary{margin:17px 0 0;padding:13px;color:#5c7488;font-size:10px;line-height:1.55}@media(max-width:1200px){.agent-grid{grid-template-columns:repeat(2,1fr)}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.sidebar{position:static;width:auto}.main{margin-left:0}.hero-grid,.two-column{grid-template-columns:1fr}.topbar{position:static}.system-status{display:none}}@media(max-width:600px){.content{padding:14px 12px 60px}.metrics,.agent-grid{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.section-heading>span{text-align:left}.pilot-brief h1{font-size:34px}.priority-list a{grid-template-columns:auto 1fr}.priority-list>a>b{grid-column:2}}
      `}</style>
    </main>
  );
}
