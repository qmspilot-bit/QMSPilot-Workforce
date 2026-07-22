"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Factory,
  Gauge,
  HeartPulse,
  LineChart,
  Menu,
  PackageCheck,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

const periods = ["Today", "Week", "Month", "Quarter", "Year"] as const;
type Period = (typeof periods)[number];

const aiWorkforce = [
  { name: "Pilot", title: "Chief of Staff", score: 96, status: "Live", kpi: "Executive decisions prepared", value: "12", impact: "$84.7K protected", icon: BrainCircuit },
  { name: "Atlas", title: "Quality Intelligence", score: 93, status: "Live", kpi: "Quality risks resolved", value: "28", impact: "4 escapes prevented", icon: ShieldCheck },
  { name: "Forge", title: "Operations Intelligence", score: 89, status: "Live", kpi: "Throughput opportunities", value: "7", impact: "+6.4% capacity", icon: Factory },
  { name: "Sentinel", title: "Compliance Intelligence", score: 97, status: "Live", kpi: "Audit readiness", value: "96%", impact: "3 controls watched", icon: ClipboardCheck },
  { name: "Vector", title: "Continuous Improvement", score: 91, status: "Live", kpi: "Verified savings YTD", value: "$238K", impact: "14 projects active", icon: TrendingUp },
  { name: "Beacon", title: "Customer Intelligence", score: 88, status: "Ready", kpi: "Customer health", value: "92%", impact: "2 accounts watched", icon: HeartPulse },
  { name: "Ledger", title: "Financial Intelligence", score: 94, status: "Ready", kpi: "Value realization", value: "4.7x", impact: "ROI on QMS activity", icon: CircleDollarSign },
  { name: "Nexus", title: "Growth Intelligence", score: 86, status: "Ready", kpi: "Growth opportunities", value: "9", impact: "$1.2M pipeline", icon: Rocket },
];

const healthDimensions = [
  ["Quality", 94, "First-pass yield and corrective-action health"],
  ["Delivery", 90, "Schedule adherence and capacity confidence"],
  ["Customer", 92, "Complaint, responsiveness, and account risk"],
  ["Compliance", 96, "ISO readiness and control effectiveness"],
  ["Workforce", 87, "Training, ownership, and execution capacity"],
  ["Improvement", 91, "Savings, velocity, and opportunity conversion"],
] as const;

const priorities = [
  { level: "Critical", title: "Recover two overdue CAPA commitments", owner: "Atlas", due: "Today", value: "$42K exposure" },
  { level: "High", title: "Approve supplier containment recommendation", owner: "Pilot", due: "Today", value: "Customer protection" },
  { level: "High", title: "Resolve Line 3 throughput constraint", owner: "Forge", due: "48 hours", value: "+7% output" },
  { level: "Medium", title: "Close three effectiveness checks", owner: "Sentinel", due: "This week", value: "Audit confidence" },
];

function scoreTone(score: number) {
  if (score >= 93) return "#37d39a";
  if (score >= 87) return "#64a9ff";
  return "#ffbf5b";
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section style={{ border: "1px solid #dce6ef", borderRadius: 20, background: "#fff", boxShadow: "0 12px 34px rgba(24,55,83,.08)", ...style }}>{children}</section>;
}

export default function NorthstarCommandCenter() {
  const [period, setPeriod] = useState<Period>("Month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const companyHealth = useMemo(() => Math.round(healthDimensions.reduce((sum, [, score]) => sum + score, 0) / healthDimensions.length), []);

  return (
    <div style={{ minHeight: "100vh", background: "#edf3f8", color: "#12253a", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <aside style={{ position: "fixed", inset: "0 auto 0 0", zIndex: 30, width: 252, padding: 18, color: "white", background: "linear-gradient(180deg,#061729,#0a2744)", transform: sidebarOpen ? "translateX(0)" : undefined }} className="northstar-sidebar">
        <div style={{ padding: "15px 16px", borderRadius: 16, color: "#0c3154", background: "white", fontSize: 22, fontWeight: 950 }}>QMSPilot</div>
        <button onClick={() => setSidebarOpen(false)} aria-label="Close navigation" style={{ display: "none", position: "absolute", right: 15, top: 16, border: 0, color: "white", background: "transparent" }} className="mobile-close"><X /></button>
        <div style={{ margin: "18px 0", padding: 14, border: "1px solid #31516f", borderRadius: 15, background: "#102f4d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: 12, background: "#1d6fce" }}><Bot size={21} /></span><div><strong style={{ display: "block" }}>Pilot</strong><small style={{ color: "#91b4d2" }}>Online · supervised</small></div></div>
        </div>
        <nav style={{ display: "grid", gap: 7 }}>
          {[[Gauge,"Command center","/"],[ClipboardCheck,"Accountability","/dashboard"],[Wrench,"Digital toolbox","/toolbox"],[Users,"AI workforce","#ai-workforce"],[BarChart3,"Performance","#performance"]].map(([Icon,label,href]) => { const I = Icon as typeof Gauge; return <a key={String(label)} href={String(href)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderRadius: 11, color: label === "Command center" ? "white" : "#b9d0e4", background: label === "Command center" ? "#0d4a7c" : "transparent", textDecoration: "none", fontSize: 13, fontWeight: 800 }}><I size={18} />{String(label)}</a>; })}
        </nav>
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #24455f" }}>
          <small style={{ color: "#78a4c8", letterSpacing: ".13em", fontWeight: 900 }}>SYSTEM STATUS</small>
          {["Northstar online","Human approval active","Evidence traceability on"].map((item) => <div key={item} style={{ display: "flex", gap: 8, marginTop: 12, color: "#c7d9e8", fontSize: 11 }}><CheckCircle2 size={15} color="#37d39a" />{item}</div>)}
        </div>
      </aside>

      <main style={{ marginLeft: 252 }} className="northstar-main">
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 14, minHeight: 68, padding: "0 24px", borderBottom: "1px solid #d9e4ed", background: "rgba(255,255,255,.94)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" style={{ display: "none", border: 0, background: "transparent" }} className="mobile-menu"><Menu /></button>
          <div style={{ marginRight: "auto" }}><small style={{ color: "#6a839a", fontWeight: 800, letterSpacing: ".1em" }}>QMSPILOT NORTHSTAR</small><strong style={{ display: "block", fontSize: 16 }}>Executive Command Center</strong></div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {periods.map((item) => <button key={item} onClick={() => setPeriod(item)} style={{ minHeight: 34, padding: "0 11px", border: period === item ? "1px solid #1769d2" : "1px solid #d7e1ea", borderRadius: 9, color: period === item ? "white" : "#526b82", background: period === item ? "#1769d2" : "white", fontSize: 11, fontWeight: 850 }}>{item}</button>)}
          </div>
        </header>

        <div style={{ maxWidth: 1560, margin: "0 auto", padding: "26px 24px 70px" }}>
          <section style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 18 }} className="hero-grid">
            <div style={{ padding: 30, borderRadius: 24, color: "white", background: "linear-gradient(135deg,#07192c,#0b477c 62%,#1769d2)", boxShadow: "0 24px 60px rgba(9,48,83,.25)" }}>
              <div style={{ display: "flex", gap: 9, alignItems: "center", color: "#9fd3ff", fontSize: 11, fontWeight: 900, letterSpacing: ".12em" }}><Sparkles size={16} />PILOT EXECUTIVE BRIEFING</div>
              <h1 style={{ maxWidth: 850, margin: "13px 0 12px", fontSize: "clamp(32px,4vw,58px)", lineHeight: 1.02 }}>Good evening, Donald. Your company is operating with strength.</h1>
              <p style={{ maxWidth: 900, margin: 0, color: "#d4e7f7", fontSize: 15, lineHeight: 1.65 }}>Company health improved two points. Quality and compliance are under control. Leadership attention should move to two overdue commitments and one production constraint with measurable financial exposure.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}><a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 11, color: "#08213a", background: "white", textDecoration: "none", fontWeight: 900 }}>Review decisions <ArrowRight size={17} /></a><a href="/toolbox" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px", border: "1px solid #6facdf", borderRadius: 11, color: "white", textDecoration: "none", fontWeight: 900 }}>Open digital toolbox <Wrench size={17} /></a></div>
            </div>
            <Card style={{ padding: 24, display: "grid", alignContent: "center", textAlign: "center" }}>
              <small style={{ color: "#6e8497", fontWeight: 900, letterSpacing: ".12em" }}>COMPANY HEALTH</small>
              <div style={{ width: 172, height: 172, margin: "17px auto", display: "grid", placeItems: "center", borderRadius: "50%", background: `conic-gradient(#1769d2 ${companyHealth * 3.6}deg,#e5edf4 0)` }}><div style={{ width: 132, height: 132, display: "grid", placeItems: "center", borderRadius: "50%", background: "white" }}><span><strong style={{ display: "block", fontSize: 48, lineHeight: 1 }}>{companyHealth}</strong><small style={{ color: "#71869a", fontWeight: 800 }}>out of 100</small></span></div></div>
              <strong style={{ color: "#16835a", fontSize: 16 }}>Strong · improving</strong><small style={{ marginTop: 6, color: "#71869a" }}>Executive confidence: 94%</small>
            </Card>
          </section>

          <section id="performance" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 13, marginTop: 18 }}>
            {[
              [Target,"First-pass yield","98.6%","+0.8 pts",Target],
              [PackageCheck,"On-time delivery","94.2%","+2.1 pts",PackageCheck],
              [CircleDollarSign,"Verified savings","$238K","YTD",CircleDollarSign],
              [AlertTriangle,"Open high risk","3","-2 this week",AlertTriangle],
              [Clock3,"Action closure","91%","On time",Clock3],
              [ShieldCheck,"ISO readiness","96%","March 2027",ShieldCheck],
            ].map(([labelKey,label,value,note,Icon]) => { const I = Icon as typeof Target; return <Card key={String(labelKey)} style={{ padding: 18 }}><I size={20} color="#1769d2" /><small style={{ display: "block", marginTop: 14, color: "#70859a", fontWeight: 900, letterSpacing: ".07em", textTransform: "uppercase" }}>{String(label)}</small><strong style={{ display: "block", marginTop: 6, fontSize: 27 }}>{String(value)}</strong><small style={{ color: "#16835a", fontWeight: 800 }}>{String(note)}</small></Card>; })}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }} className="two-grid">
            <Card style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><small style={{ color: "#71869a", fontWeight: 900, letterSpacing: ".1em" }}>ENTERPRISE HEALTH MODEL</small><h2 style={{ margin: "5px 0 0" }}>What is driving the score</h2></div><Gauge color="#1769d2" /></div>
              <div style={{ display: "grid", gap: 14, marginTop: 20 }}>{healthDimensions.map(([label,score,note]) => <div key={label}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span><strong>{label}</strong><small style={{ display: "block", color: "#7a8ea1", marginTop: 2 }}>{note}</small></span><strong style={{ color: scoreTone(score), fontSize: 19 }}>{score}</strong></div><div style={{ height: 8, marginTop: 8, overflow: "hidden", borderRadius: 999, background: "#e8eef4" }}><div style={{ width: `${score}%`, height: "100%", borderRadius: 999, background: scoreTone(score) }} /></div></div>)}</div>
            </Card>
            <Card style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><small style={{ color: "#71869a", fontWeight: 900, letterSpacing: ".1em" }}>LEADERSHIP PRIORITIES</small><h2 style={{ margin: "5px 0 0" }}>Decisions that move the business</h2></div><Zap color="#c87a00" /></div>
              <div style={{ marginTop: 14 }}>{priorities.map((item) => <div key={item.title} style={{ display: "grid", gridTemplateColumns: "86px 1fr auto", gap: 12, padding: "14px 0", borderTop: "1px solid #e6edf3", alignItems: "center" }} className="priority-row"><span style={{ padding: "5px 8px", borderRadius: 999, color: item.level === "Critical" ? "#a52d39" : "#96600b", background: item.level === "Critical" ? "#fff0f2" : "#fff7e8", fontSize: 10, fontWeight: 900, textAlign: "center" }}>{item.level}</span><span><strong style={{ display: "block", fontSize: 13 }}>{item.title}</strong><small style={{ color: "#74899d" }}>{item.owner} · {item.due}</small></span><strong style={{ color: "#1769d2", fontSize: 11 }}>{item.value}</strong></div>)}</div>
            </Card>
          </section>

          <section id="ai-workforce" style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, marginBottom: 12 }}><div><small style={{ color: "#71869a", fontWeight: 900, letterSpacing: ".12em" }}>AI WORKFORCE</small><h2 style={{ margin: "5px 0 0", fontSize: 26 }}>Every digital employee earns its seat.</h2></div><span style={{ color: "#657d92", fontSize: 12 }}>KPIs tied to operating outcomes—not activity theater.</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>{aiWorkforce.map(({ name,title,score,status,kpi,value,impact,icon:Icon }) => <Card key={name} style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 14, color: "#1769d2", background: "#eaf4ff" }}><Icon size={23} /></span><span style={{ marginRight: "auto" }}><strong style={{ display: "block", fontSize: 16 }}>{name}</strong><small style={{ color: "#71869a" }}>{title}</small></span><span style={{ color: status === "Live" ? "#16835a" : "#1769d2", fontSize: 10, fontWeight: 950 }}>{status.toUpperCase()}</span></div><div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 17, paddingTop: 15, borderTop: "1px solid #e6edf3" }}><span><small style={{ display: "block", color: "#71869a" }}>{kpi}</small><strong style={{ display: "block", marginTop: 4, fontSize: 22 }}>{value}</strong></span><span style={{ textAlign: "right" }}><small style={{ display: "block", color: "#71869a" }}>Performance</small><strong style={{ display: "block", marginTop: 4, color: scoreTone(score), fontSize: 22 }}>{score}</strong></span></div><div style={{ marginTop: 12, padding: "9px 11px", borderRadius: 10, color: "#31536d", background: "#f3f7fa", fontSize: 11, fontWeight: 800 }}>{impact}</div></Card>)}</div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, marginTop: 18 }} className="two-grid">
            <Card style={{ padding: 22 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><LineChart color="#1769d2" /><div><small style={{ color: "#71869a", fontWeight: 900 }}>EXECUTION VELOCITY</small><h2 style={{ margin: "3px 0 0" }}>Northstar is converting risk into results.</h2></div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 20 }} className="mini-grid">{[["Actions completed","142"],["Avg. closure","9.4 days"],["Risks prevented","18"],["ROI multiple","4.7x"]].map(([label,value]) => <div key={label} style={{ padding: 14, borderRadius: 13, background: "#f4f8fb" }}><small style={{ color: "#71869a" }}>{label}</small><strong style={{ display: "block", marginTop: 5, fontSize: 20 }}>{value}</strong></div>)}</div></Card>
            <Card style={{ padding: 22, color: "white", background: "linear-gradient(145deg,#0c3153,#1769d2)" }}><div style={{ display: "flex", gap: 9, color: "#a9d7ff", fontWeight: 900, fontSize: 11 }}><BriefcaseBusiness size={18} />PILOT RECOMMENDATION</div><h2 style={{ margin: "13px 0 9px", fontSize: 24 }}>Protect the customer, then unlock capacity.</h2><p style={{ margin: 0, color: "#d7e9f8", lineHeight: 1.6, fontSize: 13 }}>Approve the supplier containment package today. Assign Forge to the Line 3 constraint immediately afterward. Combined expected value: $126,000 in protected revenue and recoverable capacity.</p><a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 17, color: "white", fontWeight: 900, textDecoration: "none" }}>Open decision queue <ChevronRight size={17} /></a></Card>
          </section>

          <p style={{ margin: "18px 2px 0", color: "#71869a", fontSize: 10, lineHeight: 1.5 }}>Northstar Command Center v1 combines connected quality records with configurable demonstration operating data until ERP, finance, customer, workforce, and production connectors are activated. All external actions remain behind a human approval gate.</p>
        </div>
      </main>

      <style jsx global>{`
        *{box-sizing:border-box} body{margin:0} button,a{font:inherit}
        @media(max-width:1000px){.northstar-sidebar{transform:translateX(-100%);transition:.25s}.northstar-sidebar[style*="translateX(0)"]{transform:translateX(0)!important}.northstar-main{margin-left:0!important}.mobile-menu,.mobile-close{display:block!important}.hero-grid,.two-grid{grid-template-columns:1fr!important}.mini-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:640px){.hero-grid{display:block!important}.hero-grid>section{margin-top:14px}.priority-row{grid-template-columns:70px 1fr!important}.priority-row>strong:last-child{grid-column:2}.mini-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}
