"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Gauge,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

const periods = ["Today", "Week", "Month", "Quarter", "Year"] as const;
type Period = (typeof periods)[number];
type IconComponent = typeof Gauge;

type WorkforceMember = {
  name: string;
  title: string;
  score: number;
  status: "Live" | "Ready";
  kpi: string;
  value: string;
  impact: string;
  icon: IconComponent;
};

const aiWorkforce: WorkforceMember[] = [
  { name: "Pilot", title: "Chief of Staff", score: 96, status: "Live", kpi: "Executive decisions prepared", value: "12", impact: "$84.7K protected", icon: BrainCircuit },
  { name: "Atlas", title: "Quality Intelligence", score: 93, status: "Live", kpi: "Quality risks resolved", value: "28", impact: "4 escapes prevented", icon: ShieldCheck },
  { name: "Forge", title: "Operations Intelligence", score: 89, status: "Live", kpi: "Throughput opportunities", value: "7", impact: "+6.4% capacity", icon: Target },
  { name: "Sentinel", title: "Compliance Intelligence", score: 97, status: "Live", kpi: "Audit readiness", value: "96%", impact: "3 controls watched", icon: ClipboardCheck },
  { name: "Vector", title: "Continuous Improvement", score: 91, status: "Live", kpi: "Verified savings YTD", value: "$238K", impact: "14 projects active", icon: TrendingUp },
  { name: "Beacon", title: "Customer Intelligence", score: 88, status: "Ready", kpi: "Customer health", value: "92%", impact: "2 accounts watched", icon: Users },
  { name: "Ledger", title: "Financial Intelligence", score: 94, status: "Ready", kpi: "Value realization", value: "4.7x", impact: "ROI on QMS activity", icon: CircleDollarSign },
  { name: "Nexus", title: "Growth Intelligence", score: 86, status: "Ready", kpi: "Growth opportunities", value: "9", impact: "$1.2M pipeline", icon: BarChart3 },
];

const healthDimensions = [
  { label: "Quality", score: 94, note: "First-pass yield and corrective-action health" },
  { label: "Delivery", score: 90, note: "Schedule adherence and capacity confidence" },
  { label: "Customer", score: 92, note: "Complaint, responsiveness, and account risk" },
  { label: "Compliance", score: 96, note: "ISO readiness and control effectiveness" },
  { label: "Workforce", score: 87, note: "Training, ownership, and execution capacity" },
  { label: "Improvement", score: 91, note: "Savings, velocity, and opportunity conversion" },
];

const priorities = [
  { level: "Critical", title: "Recover two overdue CAPA commitments", owner: "Atlas", due: "Today", value: "$42K exposure" },
  { level: "High", title: "Approve supplier containment recommendation", owner: "Pilot", due: "Today", value: "Customer protection" },
  { level: "High", title: "Resolve Line 3 throughput constraint", owner: "Forge", due: "48 hours", value: "+7% output" },
  { level: "Medium", title: "Close three effectiveness checks", owner: "Sentinel", due: "This week", value: "Audit confidence" },
];

const performanceMetrics: Array<{ label: string; value: string; note: string; icon: IconComponent }> = [
  { label: "First-pass yield", value: "98.6%", note: "+0.8 pts", icon: Target },
  { label: "On-time delivery", value: "94.2%", note: "+2.1 pts", icon: CheckCircle2 },
  { label: "Verified savings", value: "$238K", note: "YTD", icon: CircleDollarSign },
  { label: "Open high risk", value: "3", note: "-2 this week", icon: AlertTriangle },
  { label: "Action closure", value: "91%", note: "On time", icon: Clock3 },
  { label: "ISO readiness", value: "96%", note: "March 2027", icon: ShieldCheck },
];

const navItems: Array<{ label: string; href: string; icon: IconComponent }> = [
  { label: "Command center", href: "/", icon: Gauge },
  { label: "Accountability", href: "/dashboard", icon: ClipboardCheck },
  { label: "Digital toolbox", href: "/toolbox", icon: Wrench },
  { label: "AI workforce", href: "#ai-workforce", icon: Users },
  { label: "Performance", href: "#performance", icon: BarChart3 },
];

const companyHealth = Math.round(
  healthDimensions.reduce((sum, item) => sum + item.score, 0) / healthDimensions.length,
);

function scoreTone(score: number) {
  if (score >= 93) return "#16835a";
  if (score >= 87) return "#1769d2";
  return "#b36b00";
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={{
        border: "1px solid #dce6ef",
        borderRadius: 20,
        background: "#ffffff",
        boxShadow: "0 12px 34px rgba(24,55,83,.08)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export default function NorthstarCommandCenter() {
  const [period, setPeriod] = useState<Period>("Month");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="northstar-shell">
      <aside className={`northstar-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="northstar-brand">QMSPilot</div>
        <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
          <X />
        </button>

        <div className="pilot-status">
          <span className="pilot-icon"><Bot size={21} /></span>
          <span><strong>Pilot</strong><small>Online · supervised</small></span>
        </div>

        <nav className="northstar-nav">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a className={label === "Command center" ? "active" : ""} key={label} href={href}>
              <Icon size={18} />
              {label}
            </a>
          ))}
        </nav>

        <div className="system-status">
          <small>SYSTEM STATUS</small>
          {["Northstar online", "Human approval active", "Evidence traceability on"].map((item) => (
            <div key={item}><CheckCircle2 size={15} />{item}</div>
          ))}
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="northstar-main">
        <header className="northstar-topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="topbar-title"><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div>
          <div className="period-selector" aria-label="Reporting period">
            {periods.map((item) => (
              <button className={period === item ? "selected" : ""} key={item} onClick={() => setPeriod(item)}>{item}</button>
            ))}
          </div>
        </header>

        <div className="northstar-content">
          <section className="hero-grid">
            <div className="executive-briefing">
              <div className="eyebrow"><Sparkles size={16} />PILOT EXECUTIVE BRIEFING</div>
              <h1>Good evening, Donald. Your company is operating with strength.</h1>
              <p>Company health improved two points. Quality and compliance are under control. Leadership attention should move to two overdue commitments and one production constraint with measurable financial exposure.</p>
              <div className="hero-actions">
                <a className="primary-action" href="/dashboard">Review decisions <ArrowRight size={17} /></a>
                <a className="secondary-action" href="/toolbox">Open digital toolbox <Wrench size={17} /></a>
              </div>
            </div>

            <Card style={{ padding: 24, display: "grid", alignContent: "center", textAlign: "center" }}>
              <small className="section-label">COMPANY HEALTH</small>
              <div className="health-ring" style={{ background: `conic-gradient(#1769d2 ${companyHealth * 3.6}deg,#e5edf4 0)` }}>
                <div><span><strong>{companyHealth}</strong><small>out of 100</small></span></div>
              </div>
              <strong className="health-status">Strong · improving</strong>
              <small className="muted">Executive confidence: 94%</small>
            </Card>
          </section>

          <section id="performance" className="metric-grid">
            {performanceMetrics.map(({ label, value, note, icon: Icon }) => (
              <Card key={label} style={{ padding: 18 }}>
                <Icon size={20} color="#1769d2" />
                <small className="metric-label">{label}</small>
                <strong className="metric-value">{value}</strong>
                <small className="metric-note">{note}</small>
              </Card>
            ))}
          </section>

          <section className="two-column-grid">
            <Card style={{ padding: 22 }}>
              <div className="card-heading"><div><small className="section-label">ENTERPRISE HEALTH MODEL</small><h2>What is driving the score</h2></div><Gauge color="#1769d2" /></div>
              <div className="health-list">
                {healthDimensions.map(({ label, score, note }) => (
                  <div key={label}>
                    <div className="health-row"><span><strong>{label}</strong><small>{note}</small></span><strong style={{ color: scoreTone(score) }}>{score}</strong></div>
                    <div className="progress-track"><div style={{ width: `${score}%`, background: scoreTone(score) }} /></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 22 }}>
              <div className="card-heading"><div><small className="section-label">LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><AlertTriangle color="#b36b00" /></div>
              <div className="priority-list">
                {priorities.map((item) => (
                  <div className="priority-row" key={item.title}>
                    <span className={item.level === "Critical" ? "priority critical" : "priority high"}>{item.level}</span>
                    <span><strong>{item.title}</strong><small>{item.owner} · {item.due}</small></span>
                    <strong className="priority-value">{item.value}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section id="ai-workforce" className="workforce-section">
            <div className="workforce-heading"><div><small className="section-label">AI WORKFORCE</small><h2>Every digital employee earns its seat.</h2></div><span>KPIs tied to operating outcomes—not activity theater.</span></div>
            <div className="workforce-grid">
              {aiWorkforce.map(({ name, title, score, status, kpi, value, impact, icon: Icon }) => (
                <Card key={name} style={{ padding: 18 }}>
                  <div className="employee-heading"><span className="employee-icon"><Icon size={23} /></span><span><strong>{name}</strong><small>{title}</small></span><em className={status === "Live" ? "live" : "ready"}>{status}</em></div>
                  <div className="employee-kpi"><span><small>{kpi}</small><strong>{value}</strong></span><span><small>Performance</small><strong style={{ color: scoreTone(score) }}>{score}</strong></span></div>
                  <div className="employee-impact">{impact}</div>
                </Card>
              ))}
            </div>
          </section>

          <section className="two-column-grid execution-grid">
            <Card style={{ padding: 22 }}>
              <div className="card-heading"><div><small className="section-label">EXECUTION VELOCITY</small><h2>Northstar is converting risk into results.</h2></div><TrendingUp color="#1769d2" /></div>
              <div className="execution-metrics">
                {[{ label: "Actions completed", value: "142" }, { label: "Avg. closure", value: "9.4 days" }, { label: "Risks prevented", value: "18" }, { label: "ROI multiple", value: "4.7x" }].map((item) => (
                  <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 22, color: "white", background: "linear-gradient(145deg,#0c3153,#1769d2)" }}>
              <div className="recommendation-label"><BrainCircuit size={18} />PILOT RECOMMENDATION</div>
              <h2 className="recommendation-title">Protect the customer, then unlock capacity.</h2>
              <p className="recommendation-copy">Approve the supplier containment package today. Assign Forge to the Line 3 constraint immediately afterward. Combined expected value: $126,000 in protected revenue and recoverable capacity.</p>
              <a className="recommendation-link" href="/dashboard">Open decision queue <ChevronRight size={17} /></a>
            </Card>
          </section>

          <p className="data-disclaimer">Northstar Command Center v1 combines connected quality records with configurable demonstration operating data until ERP, finance, customer, workforce, and production connectors are activated. All external actions remain behind a human approval gate.</p>
        </div>
      </main>

      <style>{`
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#edf3f8}.northstar-shell{min-height:100vh;background:#edf3f8;color:#12253a;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.northstar-sidebar{position:fixed;inset:0 auto 0 0;z-index:40;width:252px;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744);overflow-y:auto}.northstar-brand{padding:15px 16px;border-radius:16px;color:#0c3154;background:#fff;font-size:22px;font-weight:950}.mobile-close,.mobile-menu{display:none;border:0;background:transparent}.mobile-close{position:absolute;right:15px;top:16px;color:#fff}.pilot-status{display:flex;align-items:center;gap:10px;margin:18px 0;padding:14px;border:1px solid #31516f;border-radius:15px;background:#102f4d}.pilot-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:#1d6fce}.pilot-status strong,.pilot-status small,.employee-heading strong,.employee-heading small{display:block}.pilot-status small{color:#91b4d2}.northstar-nav{display:grid;gap:7px}.northstar-nav a{display:flex;align-items:center;gap:11px;padding:12px 13px;border-radius:11px;color:#b9d0e4;text-decoration:none;font-size:13px;font-weight:800}.northstar-nav a.active{color:#fff;background:#0d4a7c}.system-status{margin-top:24px;padding-top:18px;border-top:1px solid #24455f}.system-status>small,.section-label{color:#71869a;letter-spacing:.11em;font-weight:900}.system-status>small{color:#78a4c8}.system-status>div{display:flex;gap:8px;margin-top:12px;color:#c7d9e8;font-size:11px}.system-status svg{color:#37d39a}.sidebar-scrim{display:none}.northstar-main{margin-left:252px}.northstar-topbar{position:sticky;top:0;z-index:30;min-height:68px;display:flex;align-items:center;gap:14px;padding:0 24px;border-bottom:1px solid #d9e4ed;background:rgba(255,255,255,.94);backdrop-filter:blur(12px)}.topbar-title{margin-right:auto}.topbar-title small,.topbar-title strong{display:block}.topbar-title small{color:#6a839a;font-weight:800;letter-spacing:.1em}.topbar-title strong{font-size:16px}.period-selector{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.period-selector button{min-height:34px;padding:0 11px;border:1px solid #d7e1ea;border-radius:9px;color:#526b82;background:#fff;font-size:11px;font-weight:850}.period-selector button.selected{border-color:#1769d2;color:#fff;background:#1769d2}.northstar-content{max-width:1560px;margin:0 auto;padding:26px 24px 70px}.hero-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.executive-briefing{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#1769d2);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{display:flex;gap:9px;align-items:center;color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.executive-briefing h1{max-width:850px;margin:13px 0 12px;font-size:clamp(32px,4vw,58px);line-height:1.02}.executive-briefing p{max-width:900px;margin:0;color:#d4e7f7;font-size:15px;line-height:1.65}.hero-actions{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}.hero-actions a{display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border-radius:11px;text-decoration:none;font-weight:900}.primary-action{color:#08213a;background:#fff}.secondary-action{border:1px solid #6facdf;color:#fff}.health-ring{width:172px;height:172px;margin:17px auto;display:grid;place-items:center;border-radius:50%}.health-ring>div{width:132px;height:132px;display:grid;place-items:center;border-radius:50%;background:#fff}.health-ring strong,.health-ring small{display:block}.health-ring strong{font-size:48px;line-height:1}.health-ring small,.muted{color:#71869a;font-weight:800}.health-status{color:#16835a;font-size:16px}.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:13px;margin-top:18px}.metric-label{display:block;margin-top:14px;color:#70859a;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.metric-value{display:block;margin-top:6px;font-size:27px}.metric-note{color:#16835a;font-weight:800}.two-column-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.card-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.card-heading h2{margin:5px 0 0}.health-list{display:grid;gap:14px;margin-top:20px}.health-row{display:flex;justify-content:space-between;gap:10px}.health-row span strong,.health-row span small{display:block}.health-row span small{margin-top:2px;color:#7a8ea1}.health-row>strong{font-size:19px}.progress-track{height:8px;margin-top:8px;overflow:hidden;border-radius:999px;background:#e8eef4}.progress-track>div{height:100%;border-radius:999px}.priority-list{margin-top:14px}.priority-row{display:grid;grid-template-columns:86px 1fr auto;gap:12px;padding:14px 0;border-top:1px solid #e6edf3;align-items:center}.priority{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;text-align:center}.priority.critical{color:#a52d39;background:#fff0f2}.priority.high{color:#96600b;background:#fff7e8}.priority-row span strong,.priority-row span small{display:block}.priority-row span strong{font-size:13px}.priority-row span small{color:#74899d}.priority-value{color:#1769d2;font-size:11px}.workforce-section{margin-top:18px}.workforce-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}.workforce-heading h2{margin:5px 0 0;font-size:26px}.workforce-heading>span{color:#657d92;font-size:12px}.workforce-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.employee-heading{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:12px}.employee-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;color:#1769d2;background:#eaf4ff}.employee-heading small{color:#71869a}.employee-heading em{font-size:10px;font-style:normal;font-weight:950;text-transform:uppercase}.employee-heading em.live{color:#16835a}.employee-heading em.ready{color:#1769d2}.employee-kpi{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:17px;padding-top:15px;border-top:1px solid #e6edf3}.employee-kpi span:last-child{text-align:right}.employee-kpi small,.employee-kpi strong{display:block}.employee-kpi small{color:#71869a}.employee-kpi strong{margin-top:4px;font-size:22px}.employee-impact{margin-top:12px;padding:9px 11px;border-radius:10px;color:#31536d;background:#f3f7fa;font-size:11px;font-weight:800}.execution-grid{grid-template-columns:1.2fr .8fr}.execution-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.execution-metrics>div{padding:14px;border-radius:13px;background:#f4f8fb}.execution-metrics small,.execution-metrics strong{display:block}.execution-metrics small{color:#71869a}.execution-metrics strong{margin-top:5px;font-size:20px}.recommendation-label{display:flex;gap:9px;color:#a9d7ff;font-weight:900;font-size:11px}.recommendation-title{margin:13px 0 9px;font-size:24px}.recommendation-copy{margin:0;color:#d7e9f8;line-height:1.6;font-size:13px}.recommendation-link{display:inline-flex;align-items:center;gap:7px;margin-top:17px;color:#fff;font-weight:900;text-decoration:none}.data-disclaimer{margin:18px 2px 0;color:#71869a;font-size:10px;line-height:1.5}
        @media(max-width:1000px){.northstar-sidebar{transform:translateX(-100%);transition:transform .25s}.northstar-sidebar.is-open{transform:translateX(0)}.northstar-main{margin-left:0}.mobile-menu,.mobile-close{display:block}.sidebar-scrim{display:block;position:fixed;inset:0;z-index:35;border:0;background:rgba(3,15,27,.52)}.hero-grid,.two-column-grid{grid-template-columns:1fr}.execution-metrics{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.northstar-topbar{align-items:flex-start;padding:12px 14px}.period-selector{max-width:220px}.northstar-content{padding:18px 14px 50px}.hero-grid{display:block}.hero-grid>section{margin-top:14px}.executive-briefing{padding:24px}.priority-row{grid-template-columns:70px 1fr}.priority-value{grid-column:2}.workforce-heading{display:block}.workforce-heading>span{display:block;margin-top:8px}.execution-metrics{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
