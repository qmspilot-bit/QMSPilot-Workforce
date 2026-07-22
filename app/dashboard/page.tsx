"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileWarning,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

type Period = "today" | "week" | "month" | "quarter" | "year";

type MetricCard = {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
};

type WorkforceMember = {
  name: string;
  title: string;
  mission: string;
  score: number;
  primaryKpi: string;
  status: string;
  icon: typeof Target;
};

const periodData: Record<Period, { production: number; rejects: number; ncrs: number; copq: number; avoided: number }> = {
  today: { production: 142, rejects: 1, ncrs: 1, copq: 1850, avoided: 7400 },
  week: { production: 887, rejects: 7, ncrs: 4, copq: 10800, avoided: 36500 },
  month: { production: 3478, rejects: 21, ncrs: 12, copq: 42600, avoided: 118000 },
  quarter: { production: 10244, rejects: 74, ncrs: 31, copq: 126000, avoided: 344000 },
  year: { production: 28110, rejects: 246, ncrs: 94, copq: 411000, avoided: 1040000 },
};

const healthCategories = [
  { name: "Quality", score: 88, detail: "FPY, NCR recurrence, scrap, rework and customer escapes" },
  { name: "Compliance", score: 92, detail: "Audit readiness, document control, calibration and training" },
  { name: "Execution", score: 79, detail: "Owner discipline, due-date performance and action closure" },
  { name: "Improvement", score: 84, detail: "Verified savings, kaizen velocity and effectiveness" },
  { name: "Customer", score: 90, detail: "Complaints, response time, delivery and confidence" },
  { name: "Workforce", score: 86, detail: "Skills coverage, qualification, safety and engagement" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreTone(score: number) {
  if (score >= 90) return "#15805f";
  if (score >= 80) return "#1769d2";
  if (score >= 70) return "#c77a00";
  return "#b93843";
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const data = periodData[period];

  const fpy = ((data.production - data.rejects) / data.production) * 100;
  const healthScore = Math.round(healthCategories.reduce((sum, item) => sum + item.score, 0) / healthCategories.length);

  const cards: MetricCard[] = useMemo(
    () => [
      { label: "Company Health Score", value: `${healthScore}/100`, note: "Weighted enterprise operating health", icon: Gauge },
      { label: "First Pass Yield", value: `${fpy.toFixed(1)}%`, note: `${data.production.toLocaleString()} units processed`, icon: Target },
      { label: "NCRs Opened", value: String(data.ncrs), note: "Internal, supplier and customer events", icon: FileWarning },
      { label: "CAPA On-Time Closure", value: "91%", note: "Target: 95% or better", icon: CheckCircle2 },
      { label: "Cost of Poor Quality", value: money(data.copq), note: "Scrap, rework, delay and escape cost", icon: CircleDollarSign },
      { label: "Verified / Avoided Cost", value: money(data.avoided), note: "Value attributed to closed improvements", icon: TrendingUp },
    ],
    [data, fpy, healthScore],
  );

  const workforce: WorkforceMember[] = [
    { name: "Pilot", title: "AI Chief of Staff", mission: "Turns operating signals into executive decisions.", score: 93, primaryKpi: "Decision readiness", status: "3 leadership actions prioritized", icon: BrainCircuit },
    { name: "Atlas", title: "Accountability Officer", mission: "Protects ownership, due dates and closure discipline.", score: 84, primaryKpi: "On-time commitments", status: "5 overdue commitments under recovery", icon: Users },
    { name: "Forge", title: "Manufacturing Performance", mission: "Improves flow, FPY, capacity, scrap and rework.", score: 88, primaryKpi: "Operational yield", status: `${fpy.toFixed(1)}% FPY with 2 constraint alerts`, icon: Wrench },
    { name: "Sentinel", title: "Compliance & Risk", mission: "Maintains audit readiness and prevents compliance drift.", score: 92, primaryKpi: "Readiness confidence", status: "2 effectiveness checks pending", icon: ShieldCheck },
    { name: "Vector", title: "Continuous Improvement", mission: "Finds, validates and scales measurable improvement.", score: 86, primaryKpi: "Verified value", status: `${money(data.avoided)} value protected`, icon: Sparkles },
  ];

  const priorities = [
    { priority: "Contain repeat supplier defect", owner: "Sentinel + Atlas", due: "Today", impact: "High customer risk" },
    { priority: "Recover overdue CAPA-019", owner: "Atlas", due: "48 hours", impact: "Audit readiness" },
    { priority: "Validate press-cell scrap reduction", owner: "Forge + Vector", due: "This week", impact: "$24K annualized" },
    { priority: "Close training coverage gap", owner: "Sentinel", due: "7 days", impact: "Operational resilience" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#06101d 0,#0c2037 370px,#edf3f8 370px)", color: "#122033" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", color: "white", borderBottom: "1px solid rgba(126,180,235,.22)", background: "rgba(6,16,29,.96)", backdropFilter: "blur(12px)" }}>
        <a href="/" aria-label="Back to Northstar" style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #31506f", borderRadius: 10, color: "white", background: "#132a45" }}>
          <ArrowLeft size={18} />
        </a>
        <BarChart3 size={23} />
        <div style={{ marginRight: "auto" }}>
          <small style={{ display: "block", color: "#8fb4d4", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase" }}>QMSPilot Northstar</small>
          <strong>Executive Command Center</strong>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(Object.keys(periodData) as Period[]).map((item) => (
            <button key={item} type="button" onClick={() => setPeriod(item)} style={{ minHeight: 34, padding: "0 11px", border: period === item ? "1px solid #7cb7f4" : "1px solid #31506f", borderRadius: 9, color: "white", background: period === item ? "#1f67c8" : "#132a45", fontSize: 10, fontWeight: 800, textTransform: "capitalize", cursor: "pointer" }}>
              {item}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1540, margin: "0 auto", padding: "34px 20px 72px" }}>
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(300px,.55fr)", gap: 18, marginBottom: 18 }}>
          <article style={{ padding: 30, border: "1px solid rgba(116,181,255,.28)", borderRadius: 24, color: "white", background: "linear-gradient(135deg,rgba(10,43,80,.98),rgba(24,103,200,.9))", boxShadow: "0 24px 60px rgba(0,0,0,.24)" }}>
            <small style={{ color: "#9fd1ff", fontSize: 10, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" }}>Executive operating intelligence</small>
            <h1 style={{ margin: "9px 0 12px", fontSize: "clamp(32px,5vw,58px)", lineHeight: 1 }}>Know what is happening, why it matters, and what to do next.</h1>
            <p style={{ maxWidth: 900, margin: 0, color: "#d7e8f7", lineHeight: 1.7 }}>Northstar gives growing manufacturers the decision clarity of a world-class enterprise without the overhead, complexity or staffing burden of one.</p>
          </article>

          <article style={{ padding: 25, border: "1px solid #bcdaca", borderRadius: 24, background: "#f0fbf6", boxShadow: "0 18px 45px rgba(28,111,82,.13)" }}>
            <small style={{ color: "#33735c", fontSize: 9, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Pilot executive briefing</small>
            <strong style={{ display: "block", margin: "12px 0 9px", color: "#133b30", fontSize: 23 }}>Protect execution before chasing more output.</strong>
            <p style={{ margin: 0, color: "#526f65", fontSize: 12, lineHeight: 1.65 }}>Quality remains strong, but five overdue commitments and two unresolved effectiveness checks could create avoidable risk. Assign recovery owners today.</p>
          </article>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 14, marginBottom: 18 }}>
          {cards.map(({ label, value, note, icon: Icon }) => (
            <article key={label} style={{ padding: 19, border: "1px solid #d5e0eb", borderRadius: 18, background: "white", boxShadow: "0 10px 28px rgba(25,50,75,.075)" }}>
              <Icon size={21} style={{ color: "#1769d2" }} />
              <span style={{ display: "block", marginTop: 14, color: "#6b7f94", fontSize: 9, fontWeight: 900, letterSpacing: ".09em", textTransform: "uppercase" }}>{label}</span>
              <strong style={{ display: "block", marginTop: 5, color: "#173a5d", fontSize: 27 }}>{value}</strong>
              <small style={{ display: "block", marginTop: 6, color: "#7a8da1", fontSize: 9, lineHeight: 1.45 }}>{note}</small>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: 18, marginBottom: 18 }}>
          <article style={{ padding: 23, border: "1px solid #d5e0eb", borderRadius: 21, background: "white", boxShadow: "0 12px 34px rgba(25,50,75,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Gauge size={21} style={{ color: scoreTone(healthScore) }} />
              <div><strong style={{ display: "block", color: "#173a5d" }}>Company Health Score</strong><small style={{ color: "#74879a" }}>A balanced view prevents one good metric from hiding a weak operating system.</small></div>
            </div>
            <div style={{ display: "grid", gap: 13 }}>
              {healthCategories.map((item) => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}><strong style={{ color: "#29435c", fontSize: 11 }}>{item.name}</strong><strong style={{ color: scoreTone(item.score), fontSize: 12 }}>{item.score}</strong></div>
                  <div style={{ height: 8, overflow: "hidden", borderRadius: 999, background: "#e8eef4" }}><div style={{ width: `${item.score}%`, height: "100%", borderRadius: 999, background: scoreTone(item.score) }} /></div>
                  <small style={{ display: "block", marginTop: 5, color: "#7a8da1", fontSize: 9 }}>{item.detail}</small>
                </div>
              ))}
            </div>
          </article>

          <article style={{ padding: 23, border: "1px solid #d5e0eb", borderRadius: 21, background: "white", boxShadow: "0 12px 34px rgba(25,50,75,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><AlertTriangle size={21} style={{ color: "#c77a00" }} /><div><strong style={{ display: "block", color: "#173a5d" }}>Executive priority queue</strong><small style={{ color: "#74879a" }}>The few actions leadership should care about right now.</small></div></div>
            <div style={{ display: "grid", gap: 10 }}>
              {priorities.map((item) => (
                <div key={item.priority} style={{ padding: 13, border: "1px solid #e1e8ef", borderRadius: 13, background: "#fafcfe" }}>
                  <strong style={{ display: "block", color: "#29435c", fontSize: 11 }}>{item.priority}</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, color: "#708398", fontSize: 9 }}><span>Owner: {item.owner}</span><span>Due: {item.due}</span></div>
                  <small style={{ display: "block", marginTop: 6, color: "#a05c00" }}>{item.impact}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section style={{ marginBottom: 18, padding: 23, border: "1px solid #d5e0eb", borderRadius: 21, background: "white", boxShadow: "0 12px 34px rgba(25,50,75,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><BrainCircuit size={22} style={{ color: "#1769d2" }} /><div><strong style={{ display: "block", color: "#173a5d" }}>AI workforce performance</strong><small style={{ color: "#74879a" }}>Every AI employee is accountable to a measurable business outcome.</small></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 12 }}>
            {workforce.map(({ name, title, mission, score, primaryKpi, status, icon: Icon }) => (
              <article key={name} style={{ padding: 16, border: "1px solid #e0e7ef", borderRadius: 15, background: "#f9fbfd" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}><span style={{ width: 43, height: 43, display: "grid", placeItems: "center", borderRadius: 12, color: "#1769d2", background: "#e8f3ff" }}><Icon size={20} /></span><div><strong style={{ display: "block", color: "#29435c", fontSize: 12 }}>{name}</strong><small style={{ color: "#708398" }}>{title}</small></div></div>
                <p style={{ minHeight: 42, margin: "13px 0 10px", color: "#63778b", fontSize: 10, lineHeight: 1.5 }}>{mission}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><small style={{ color: "#6b7f94" }}>{primaryKpi}</small><strong style={{ color: scoreTone(score), fontSize: 12 }}>{score}</strong></div>
                <div style={{ height: 7, overflow: "hidden", borderRadius: 999, background: "#e6edf4" }}><div style={{ width: `${score}%`, height: "100%", background: scoreTone(score) }} /></div>
                <small style={{ display: "block", marginTop: 9, color: "#4f6579", lineHeight: 1.45 }}>{status}</small>
              </article>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
          {[
            { title: "Quality Intelligence", value: "3 repeat-risk patterns", note: "Correlates NCRs, complaints, scrap, rework and process history.", icon: Activity },
            { title: "Compliance Readiness", value: "92% ready", note: "Tracks audits, clauses, records, calibration, training and evidence.", icon: ShieldCheck },
            { title: "Accountability Velocity", value: "4.6 days", note: "Median time from assignment to verified closure.", icon: Clock3 },
            { title: "Growth Capacity", value: "+11% available", note: "Capacity opportunity after current constraints are removed.", icon: TrendingUp },
          ].map(({ title, value, note, icon: Icon }) => (
            <article key={title} style={{ padding: 19, border: "1px solid #d5e0eb", borderRadius: 18, background: "white" }}><Icon size={20} style={{ color: "#1769d2" }} /><strong style={{ display: "block", marginTop: 12, color: "#29435c", fontSize: 12 }}>{title}</strong><span style={{ display: "block", marginTop: 6, color: "#173a5d", fontSize: 23, fontWeight: 800 }}>{value}</span><small style={{ display: "block", marginTop: 7, color: "#75889b", lineHeight: 1.5 }}>{note}</small></article>
          ))}
        </section>

        <p style={{ margin: "18px 2px 0", color: "#728499", fontSize: 9, lineHeight: 1.55 }}>Northstar is designed to connect each KPI to evidence from microtools, ERP data, QMS records and verified human decisions. Demonstration values remain clearly identified until each live connector is activated.</p>
      </div>
    </main>
  );
}
