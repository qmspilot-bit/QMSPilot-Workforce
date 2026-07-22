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

const styles = {
  shell: { minHeight: "100vh", color: "#12263a", background: "#edf3f8", fontFamily: "Inter, Arial, sans-serif" },
  sidebar: { position: "fixed", inset: "0 auto 0 0", width: 258, overflow: "auto", padding: 18, color: "white", background: "linear-gradient(180deg,#061729,#0a2744)" },
  logo: { height: 58, display: "flex", alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 13, background: "white" },
  northstarLogo: { height: 58, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8, padding: 6, borderRadius: 13, background: "#020914" },
  nav: { display: "grid", gap: 6, marginTop: 18 },
  navLink: { padding: "11px 12px", borderRadius: 10, color: "#bed2e4", textDecoration: "none", fontSize: 12, fontWeight: 850 },
  main: { marginLeft: 258 },
  topbar: { minHeight: 68, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", borderBottom: "1px solid #d7e3ec", background: "rgba(255,255,255,.97)" },
  content: { maxWidth: 1540, margin: "0 auto", padding: "24px 24px 70px" },
  heroGrid: { display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(280px,.65fr)", gap: 18 },
  hero: { padding: 30, borderRadius: 24, color: "white", background: "linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff)", boxShadow: "0 24px 60px rgba(8,47,82,.24)" },
  health: { display: "grid", placeItems: "center", alignContent: "center", padding: 24, border: "1px solid #d8e4ed", borderRadius: 22, background: "white", boxShadow: "0 15px 38px rgba(24,55,83,.08)", textAlign: "center" },
  toolbar: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  toolButton: { minHeight: 40, display: "inline-flex", alignItems: "center", gap: 7, padding: "0 13px", border: "1px solid #c6d6e2", borderRadius: 10, color: "#285674", background: "white", textDecoration: "none", fontSize: 11, fontWeight: 850, cursor: "pointer" },
  notice: { display: "flex", alignItems: "center", gap: 8, marginTop: 13, padding: "11px 13px", border: "1px solid #9cc7e9", borderRadius: 11, color: "#174d78", background: "#e9f5ff", fontSize: 11, fontWeight: 800 },
  metrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 15 },
  card: { border: "1px solid #dbe5ed", borderRadius: 17, background: "white", boxShadow: "0 11px 28px rgba(24,53,77,.07)" },
  twoColumn: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 17, marginTop: 17 },
  panel: { padding: 19, border: "1px solid #dbe5ed", borderRadius: 17, background: "white", boxShadow: "0 11px 28px rgba(24,53,77,.07)" },
  agentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginTop: 13 },
};

function currency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function demoWorkspace() {
  return {
    mode: "demo",
    events: [
      { id: "demo-customer", event_title: "Strategic customer recovery requires one executive sponsor", source_tool: "customer-assurance", source_record_key: "CC-2026-0047", source_path: "/tools/customer-assurance", severity: "critical", summary: "Customer startup, replacement delivery, measurement containment, and final response remain connected.", financial_exposure: 28200, revenue_exposure: 180000 },
      { id: "demo-delivery", event_title: "Two strategic orders remain at risk", source_tool: "delivery-assurance", source_record_key: "NDA-20260722-DEMO", source_path: "/tools/delivery-assurance", severity: "critical", summary: "Supplier material, equipment capability, and final inspection capacity remain constrained.", financial_exposure: 5600, revenue_exposure: 306000 },
      { id: "demo-measurement", event_title: "Out-of-tolerance bore-gage impact review", source_tool: "measurement-assurance", source_record_key: "OOT-2026-0006", source_path: "/tools/measurement-assurance", severity: "critical", summary: "The gage is quarantined and affected product requires a controlled impact decision.", financial_exposure: 62000, revenue_exposure: 180000 },
    ],
    assignments: [
      { agent_code: "Pilot", assignment_status: "queued" },
      { agent_code: "Atlas", assignment_status: "queued" },
      { agent_code: "Forge", assignment_status: "queued" },
      { agent_code: "Sentinel", assignment_status: "queued" },
      { agent_code: "Ledger", assignment_status: "queued" },
    ],
    recommendations: [{ recommendation_status: "pending_approval" }],
    actions: [{ action_status: "in_progress" }, { action_status: "blocked" }],
    writebacks: [{ writeback_status: "awaiting_human" }],
    brief: {
      title: "Pilot Executive Brief · Strategic Customer Recovery",
      executive_summary: "Protect the customer first. Approve one integrated recovery owner, restore trusted measurement capability, secure qualified final inspection, and protect the replacement shipment.",
      decisions_required: [{ decision: "Approve the integrated customer-recovery command plan.", reason: "$180,000 in strategic customer revenue remains exposed." }],
    },
    value: { verified_realized_value: 18375, net_realized_value: 6675, qmspilot_roi: 0.12 },
  };
}

export default function NorthstarLiveCommandCenter() {
  const cloud = useCloudWorkspace();
  const demo = useMemo(demoWorkspace, []);
  const [workspace, setWorkspace] = useState(demo);
  const [notice, setNotice] = useState("Design-partner connected operating scenario loaded.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (cloud.status === "ready" && cloud.organizationId) void syncSecure(false);
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
      const results = await Promise.all([
        supabase.from("northstar_intelligence_events").select("*").eq("organization_id", cloud.organizationId).order("source_submitted_at", { ascending: false }).limit(100),
        supabase.from("northstar_agent_assignments").select("agent_code,assignment_status").eq("organization_id", cloud.organizationId).order("assigned_at", { ascending: false }).limit(500),
        supabase.from("northstar_agent_recommendations").select("recommendation_status").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_workforce_actions").select("action_status").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_writeback_requests").select("writeback_status").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(300),
        supabase.from("northstar_executive_briefs").select("*").eq("organization_id", cloud.organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("value_ledger_snapshots").select("verified_realized_value,net_realized_value,qmspilot_roi").eq("organization_id", cloud.organizationId).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      const [events, assignments, recommendations, actions, writebacks, briefs, value] = results;
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
        brief: briefs.data || demo.brief,
        value: value.data || {},
      });
      if (showNotice) setNotice(`${activeEvents.length} live operating events synchronized from Northstar Secure.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Live Command Center synchronization failed.");
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
      const response = await fetch("/api/northstar-operating-rhythm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
  const critical = events.filter((event) => event.severity === "critical").length;
  const high = events.filter((event) => event.severity === "high").length;
  const financialExposure = events.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const revenueExposure = events.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const openActions = (workspace.actions || []).filter((action) => !["done", "rejected"].includes(action.action_status));
  const blocked = openActions.filter((action) => action.action_status === "blocked").length;
  const pendingRecommendations = (workspace.recommendations || []).filter((item) => item.recommendation_status === "pending_approval").length;
  const pendingWritebacks = (workspace.writebacks || []).filter((item) => !["executed", "rejected"].includes(item.writeback_status)).length;
  const healthScore = Math.max(0, Math.min(100, 100 - critical * 8 - high * 4 - blocked * 3));
  const priorities = [...events].sort((left, right) => (SEVERITY_RANK[right.severity] || 0) - (SEVERITY_RANK[left.severity] || 0)).slice(0, 5);
  const brief = workspace.brief || demo.brief;

  return (
    <main style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" style={{ maxWidth: 190, maxHeight: 48 }} /></div>
        <div style={styles.northstarLogo}><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" style={{ maxWidth: 190, maxHeight: 48 }} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "17px 0", padding: 13, border: "1px solid #31516f", borderRadius: 14, background: "#102f4d" }}>
          <span style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 11, background: "#0a66ff", fontWeight: 900 }}>PI</span>
          <div><strong style={{ display: "block" }}>Pilot</strong><small style={{ display: "block", marginTop: 3, color: "#9abbd6" }}>Online · supervised</small></div>
        </div>
        <nav style={styles.nav}>
          <a href="/" style={{ ...styles.navLink, color: "white", background: "#0d4a7c" }}>Command Center</a>
          <a href="/workforce-operations" style={styles.navLink}>AI Workforce Operations</a>
          <a href="/entity-graph" style={styles.navLink}>Entity Graph</a>
          <a href="/dashboard" style={styles.navLink}>Accountability</a>
          <a href="/toolbox" style={styles.navLink}>Digital Toolbox</a>
        </nav>
        <div style={{ display: "grid", gap: 10, marginTop: 22, paddingTop: 17, borderTop: "1px solid #28475f", color: "#c6d9e8", fontSize: 10 }}>
          <small style={{ color: "#7fa9ca", letterSpacing: ".12em", fontWeight: 900 }}>SYSTEM STATUS</small>
          <span>● Intelligence Bus online</span><span>● Closed-loop writeback active</span><span>● Human authority preserved</span><span>● Entity Graph connected</span>
        </div>
      </aside>

      <section style={styles.main}>
        <header style={styles.topbar}>
          <div style={{ marginRight: "auto" }}><small style={{ display: "block", color: "#6b8296", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>QMSPILOT NORTHSTAR</small><strong style={{ display: "block" }}>Executive Command Center</strong></div>
          <span style={{ padding: "8px 11px", borderRadius: 999, color: workspace.mode === "secure" ? "#176747" : "#7a5715", background: workspace.mode === "secure" ? "#e4f8ef" : "#fff1cd", fontSize: 10, fontWeight: 900 }}>{workspace.mode === "secure" ? "Live Northstar Secure" : "Design-partner demonstration"}</span>
        </header>

        <div style={styles.content}>
          <section style={styles.heroGrid}>
            <article style={styles.hero}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#9ed6ff", fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}><BrainCircuit size={17} /> PILOT EXECUTIVE BRIEFING</div>
              <h1 style={{ maxWidth: 900, margin: "14px 0 12px", fontSize: "clamp(31px,4vw,55px)", lineHeight: 1.02 }}>{brief.title}</h1>
              <p style={{ maxWidth: 930, margin: 0, color: "#d6e8f6", lineHeight: 1.65 }}>{brief.executive_summary}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 21 }}>
                <a href="/workforce-operations" style={{ ...styles.toolButton, color: "#09223b" }}>Review decisions <ArrowRight size={16} /></a>
                <button type="button" onClick={() => void runRhythm()} disabled={busy === "rhythm"} style={{ ...styles.toolButton, borderColor: "#72afe1", color: "white", background: "transparent" }}><RefreshCw size={16} /> {busy === "rhythm" ? "Pilot and Atlas are running..." : "Run Pilot + Atlas rhythm"}</button>
              </div>
            </article>
            <article style={styles.health}>
              <small style={{ color: "#71879a", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>COMPANY HEALTH</small>
              <div style={{ width: 178, height: 178, display: "grid", placeItems: "center", margin: "16px 0", borderRadius: "50%", background: `conic-gradient(#0a66ff ${healthScore * 3.6}deg,#dce7ef 0)` }}>
                <div style={{ width: 137, height: 137, display: "grid", placeItems: "center", alignContent: "center", borderRadius: "50%", background: "white" }}><strong style={{ fontSize: 49, lineHeight: 1 }}>{healthScore}</strong><span style={{ color: "#74899b", fontSize: 10, fontWeight: 850 }}>out of 100</span></div>
              </div>
              <b style={{ color: healthScore >= 80 ? "#16835a" : "#a66310" }}>{healthScore >= 90 ? "Strong · controlled" : healthScore >= 80 ? "Stable · attention required" : "Leadership intervention required"}</b>
              <em style={{ marginTop: 5, color: "#71869a", fontSize: 9, fontStyle: "normal" }}>{workspace.mode === "secure" ? "Calculated from connected risk and execution" : "Demonstration model"}</em>
            </article>
          </section>

          <section style={styles.toolbar}>
            <button type="button" onClick={() => void syncSecure(true)} disabled={busy === "sync"} style={styles.toolButton}><RefreshCw size={16} /> {busy === "sync" ? "Synchronizing..." : "Sync live data"}</button>
            <a href="/workforce-operations" style={styles.toolButton}><Network size={16} /> Intelligence Bus</a>
            <a href="/entity-graph" style={styles.toolButton}><Database size={16} /> Entity Graph</a>
            <a href="/toolbox" style={styles.toolButton}><ClipboardCheck size={16} /> Digital Toolbox</a>
          </section>

          {notice && <div style={styles.notice}><Activity size={17} /> {notice}</div>}

          <section style={styles.metrics}>
            {[
              ["Critical events", critical, `${high} additional high priority`],
              ["Revenue exposure", currency(revenueExposure), "Never counted as savings"],
              ["Financial exposure", currency(financialExposure), "Connected operating loss and risk"],
              ["Open actions", openActions.length, `${blocked} blocked`],
              ["Human decisions", pendingRecommendations, "Recommendations awaiting approval"],
              ["Writebacks", pendingWritebacks, "Awaiting target-tool execution"],
              ["Verified value", currency(workspace.value?.verified_realized_value), `${currency(workspace.value?.net_realized_value)} net realized`],
              ["QMSPilot ROI", `${Number(workspace.value?.qmspilot_roi || 0).toFixed(2)}x`, "Value Ledger basis"],
            ].map(([label, value, note]) => (
              <article key={label} style={{ ...styles.card, padding: 16 }}><small style={{ display: "block", color: "#70869a", fontSize: 9, fontWeight: 900, letterSpacing: ".09em", textTransform: "uppercase" }}>{label}</small><strong style={{ display: "block", marginTop: 7, fontSize: 27 }}>{value}</strong><span style={{ display: "block", marginTop: 4, color: "#60788c", fontSize: 9 }}>{note}</span></article>
            ))}
          </section>

          <section style={styles.twoColumn}>
            <article style={styles.panel}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><div><small style={{ color: "#0a66ff", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>LEADERSHIP PRIORITIES</small><h2 style={{ margin: "5px 0 0" }}>Decisions that move the business</h2></div><AlertTriangle size={24} /></div>
              <div style={{ display: "grid", gap: 9, marginTop: 15 }}>
                {priorities.map((event) => (
                  <a key={event.id} href={event.source_path || "/workforce-operations"} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "start", padding: 11, border: "1px solid #dce5ed", borderRadius: 12, color: "inherit", textDecoration: "none" }}>
                    <span style={{ padding: "5px 7px", borderRadius: 999, color: event.severity === "critical" ? "#8f1f2c" : "#85520a", background: event.severity === "critical" ? "#ffe7ea" : "#fff0d5", fontSize: 8, fontWeight: 950, textTransform: "uppercase" }}>{event.severity}</span>
                    <div><strong style={{ display: "block" }}>{event.event_title}</strong><small style={{ display: "block", marginTop: 3, color: "#73899b", fontSize: 9 }}>{titleCase(event.source_tool)} · {event.source_record_key}</small><p style={{ margin: "5px 0 0", color: "#4d667b", fontSize: 10, lineHeight: 1.45 }}>{event.summary}</p></div>
                    <b style={{ color: "#295e84", fontSize: 11 }}>{currency(Number(event.revenue_exposure || 0) || Number(event.financial_exposure || 0))}</b>
                  </a>
                ))}
              </div>
            </article>

            <article style={styles.panel}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><div><small style={{ color: "#0a66ff", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>CLOSED-LOOP EXECUTION</small><h2 style={{ margin: "5px 0 0" }}>Recommendations become controlled work.</h2></div><CheckCircle2 size={24} /></div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, flexWrap: "wrap", marginTop: 22 }}>
                <span style={{ ...styles.toolButton, minHeight: 38 }}><Bot size={15} />Agent recommendation</span><ArrowRight size={16} /><span style={{ ...styles.toolButton, minHeight: 38 }}><ShieldCheck size={15} />Human approval</span><ArrowRight size={16} /><span style={{ ...styles.toolButton, minHeight: 38 }}><ClipboardCheck size={15} />Native writeback</span><ArrowRight size={16} /><span style={{ ...styles.toolButton, minHeight: 38 }}><CheckCircle2 size={15} />Evidence closure</span>
              </div>
              <p style={{ margin: "20px 0 0", color: "#536d82", fontSize: 11, lineHeight: 1.6 }}>Approved actions are written into the target application, updated where the work occurs, synchronized back to Atlas, and used to close the originating event only after verification.</p>
            </article>
          </section>

          <section style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16 }}><div><small style={{ color: "#0a66ff", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>AI WORKFORCE</small><h2 style={{ margin: "5px 0 0" }}>One team working from the same operating context.</h2></div><span style={{ color: "#6a8195", fontSize: 11 }}>Queues reflect Intelligence Bus assignments.</span></div>
            <div style={styles.agentGrid}>
              {AGENTS.map(([name, initials, role]) => {
                const load = (workspace.assignments || []).filter((assignment) => assignment.agent_code === name && !["approved", "rejected", "closed"].includes(assignment.assignment_status)).length;
                return <article key={name} style={{ ...styles.card, padding: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 10, color: "#0b579f", background: "#e1f1ff", fontSize: 10, fontWeight: 950 }}>{initials}</span><div style={{ marginRight: "auto" }}><strong style={{ display: "block" }}>{name}</strong><small style={{ display: "block", marginTop: 3, color: "#71869a", fontSize: 8 }}>{role}</small></div><em style={{ padding: "4px 6px", borderRadius: 999, color: "#176747", background: "#e4f8ef", fontSize: 7, fontStyle: "normal", fontWeight: 950 }}>{load ? "ACTIVE" : "READY"}</em></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 11, borderTop: "1px solid #e1e8ee" }}><span><small style={{ display: "block", color: "#71869a", fontSize: 8 }}>Open assignments</small><strong style={{ display: "block", marginTop: 4 }}>{load}</strong></span><span><small style={{ display: "block", color: "#71869a", fontSize: 8 }}>Final authority</small><strong style={{ display: "block", marginTop: 4 }}>Human</strong></span></div></article>;
              })}
            </div>
          </section>

          <section style={{ ...styles.twoColumn, alignItems: "stretch" }}>
            <article style={{ padding: 22, borderRadius: 18, color: "white", background: "linear-gradient(145deg,#07192c,#0c497f)" }}><small style={{ color: "#9bd1fc", fontWeight: 900, letterSpacing: ".12em" }}>PILOT RECOMMENDATION</small><h2 style={{ margin: "12px 0" }}>{brief.decisions_required?.[0]?.decision || "Maintain the connected operating rhythm."}</h2><p style={{ color: "#d4e6f5", lineHeight: 1.6 }}>{brief.decisions_required?.[0]?.reason || "Review the highest-risk event and approve one accountable response."}</p><a href="/workforce-operations" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "white", fontWeight: 900, textDecoration: "none" }}>Open human decision queue <ArrowRight size={16} /></a></article>
            <article style={styles.panel}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><small style={{ color: "#0a66ff", fontSize: 9, fontWeight: 900, letterSpacing: ".12em" }}>OPERATING BOUNDARY</small><h2 style={{ margin: "5px 0 0" }}>Supervised intelligence—not autonomous control.</h2></div><ShieldCheck size={25} /></div><p style={{ color: "#536d82", fontSize: 11, lineHeight: 1.65 }}>Northstar analyzes, routes, recommends, and writes only after authorization. Qualified humans retain authority for customer commitments, product release, financial validation, corrective-action closure, and management decisions.</p></article>
          </section>
        </div>
      </section>
    </main>
  );
}
