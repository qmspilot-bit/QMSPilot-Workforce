"use client";

import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  BrainCircuit,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  PackageCheck,
  Share2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const SUMMARY_KEY = "qmspilot:northstar:workforce-readiness-summary";
const defaultSummary = {
  company: "Davicorp",
  readinessPercent: 92,
  activeDocuments: 3,
  awaitingApproval: 3,
  trainingRequired: 6,
  fullyAuthorized: 22,
  totalEmployees: 24,
  expiredQualifications: 2,
  criticalGaps: 2,
  workCenters: [
    { name: "Final Assembly", readiness: 96 },
    { name: "Foam Operations", readiness: 91 },
    { name: "Electrical Test", readiness: 88 },
    { name: "Packaging", readiness: 100 },
  ],
  source: "Controlled Work Instructions & Workforce Readiness",
  sourcePath: "/tools/workforce-readiness",
};

const otherViews = [
  { title: "Asset Reliability", description: "PM compliance, MTBF, MTTR, downtime cost, critical assets, and repeat-failure visibility.", href: "/tools/asset-reliability", icon: Gauge, metric: "81", note: "7 PMs overdue" },
  { title: "Process Assurance", description: "Process adherence, layered audit performance, standards verification, open risks, and sustained corrective action.", href: "/tools/process-assurance", icon: ClipboardCheck, metric: "91%", note: "4 weak controls" },
  { title: "Delivery Assurance", description: "Customer commitments, delayed orders, shipment risk, constraints, recovery actions, and on-time delivery.", href: "/tools/delivery-assurance", icon: PackageCheck, metric: "95.1%", note: "3 orders at risk" },
  { title: "Value Ledger", description: "Financially validated savings, avoided cost, protected revenue, working-capital impact, and QMSPilot ROI.", href: "/tools/value-ledger", icon: BadgeDollarSign, metric: "$2.44M", note: "YTD value protected" },
  { title: "Entity Graph", description: "Trace people, assets, suppliers, customers, orders, risks, actions, and records back to source events.", href: "/entity-graph", icon: Share2, metric: "146", note: "connected entities" },
];

export default function ExecutiveIntelligencePage() {
  const [readiness, setReadiness] = useState(defaultSummary);

  useEffect(() => {
    const load = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(SUMMARY_KEY) || "null");
        if (saved?.company === "Davicorp") setReadiness({ ...defaultSummary, ...saved });
      } catch {}
    };
    load();
    window.addEventListener("qmspilot:workforce-readiness-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("qmspilot:workforce-readiness-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const enterpriseScore = Math.round((readiness.readinessPercent + 81 + 91 + 95) / 4);

  return (
    <main className="ei-shell">
      <aside>
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="tenant"><small>DEMONSTRATION TENANT</small><strong>Davicorp</strong><span>Cross-workspace leadership intelligence</span></div>
        <nav>
          <a href="/">Command Center</a>
          <a className="active" href="/executive-intelligence">Executive Intelligence</a>
          <a href="/workforce-operations">AI Workforce Operations</a>
          <a href="/entity-graph">Entity Graph</a>
          <a href="/dashboard">Accountability</a>
          <a href="/toolbox">Workspaces</a>
        </nav>
        <div className="status"><small>EXECUTIVE LAYER</small><span>● Operational records remain in workspaces</span><span>● Leadership receives controlled rollups</span><span>● Human-reviewed intelligence</span><span>● Source-event traceability</span></div>
      </aside>

      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR</small><strong>Executive Intelligence</strong></div><span>Davicorp demonstration data</span></header>
        <div className="content">
          <section className="hero">
            <div><small>LEADERSHIP VISIBILITY</small><h1>See readiness, reliability, process risk, delivery exposure, and value in one place.</h1><p>Executive Intelligence does not replace operational work. It consumes controlled records from the Northstar workspaces and converts them into leadership priorities, risk visibility, and decisions.</p><div className="hero-actions"><a href="/tools/workforce-readiness">Open Workforce Workspace <ArrowRight size={16} /></a><a className="outline" href="/toolbox">Open Smart Workspaces <ArrowRight size={16} /></a></div></div>
            <div className="health"><small>DAVICORP ENTERPRISE READINESS</small><div className="ring" style={{ "--score": `${enterpriseScore * 3.6}deg` } as React.CSSProperties}><div><strong>{enterpriseScore}</strong><span>out of 100</span></div></div><b>Stable · focused action required</b><em>Operational workspaces provide the source records</em></div>
          </section>

          <section className="metrics">
            {[
              ["Workforce readiness", `${readiness.readinessPercent}%`, `${readiness.criticalGaps} critical qualification gaps`],
              ["Asset reliability", "81", "7 overdue PMs"],
              ["Process assurance", "91%", "4 weak controls"],
              ["On-time delivery", "95.1%", "3 orders at risk"],
              ["YTD value protected", "$2.44M", "Finance validation enabled"],
              ["Leadership actions", "19", "5 overdue"],
            ].map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
          </section>

          <section className="two">
            <article className="panel workforce-feed">
              <div className="heading"><div><small>LIVE WORKFORCE READINESS FEED</small><h2>Controlled work instructions now drive the leadership view</h2></div><GraduationCap /></div>
              <div className="feed-grid">
                <div><small>Fully authorized</small><strong>{readiness.fullyAuthorized} / {readiness.totalEmployees}</strong><span>Approved for independent work</span></div>
                <div><small>Open training</small><strong>{readiness.trainingRequired}</strong><span>Role-based assignments</span></div>
                <div><small>Expired qualifications</small><strong>{readiness.expiredQualifications}</strong><span>Immediate supervisor action</span></div>
                <div><small>Pending revisions</small><strong>{readiness.awaitingApproval}</strong><span>Potential retraining impact</span></div>
              </div>
              <div className="work-center-bars">{readiness.workCenters.map((item: { name: string; readiness: number }) => <div key={item.name}><span><strong>{item.name}</strong><em>{item.readiness}%</em></span><i><b style={{ width: `${item.readiness}%` }} /></i></div>)}</div>
              <div className="source-note"><BarChart3 /><div><strong>Source: {readiness.source}</strong><p>The operational workspace owns documents, approvals, assignments, competency evidence, and authorization. Executive Intelligence receives only the controlled summary and drill-down path.</p></div></div>
              <a className="open-link" href={readiness.sourcePath}>Open operational source <ArrowRight size={15} /></a>
            </article>

            <article className="panel briefing"><div className="heading"><div><small>PILOT EXECUTIVE BRIEFING</small><h2>What Davicorp leadership needs to know now</h2></div><Sparkles /></div><div className="insights">
              <div><span>Atlas</span><p>Electrical Test has two expired qualifications and remains the highest workforce-readiness exposure.</p><em className="high">High</em></div>
              <div><span>Forge</span><p>Three document revisions are awaiting approval; each can trigger targeted retraining by role and work center.</p><em className="high">High</em></div>
              <div><span>Beacon</span><p>Final Assembly is at 96% readiness, but one practical signoff remains before full independent coverage.</p><em className="medium">Medium</em></div>
              <div><span>Ledger</span><p>Workforce risk is now traceable to the exact instruction, employee assignment, evidence, and authorization decision.</p><em className="medium">Medium</em></div>
            </div></article>
          </section>

          <section className="section-head"><div><small>EXECUTIVE INTELLIGENCE VIEWS</small><h2>Leadership dashboards with direct operational traceability</h2></div><span>6 connected views</span></section>
          <section className="view-grid">
            <a href="/tools/workforce-readiness" className="view-card featured"><div className="view-top"><span><GraduationCap size={24} /></span><div><strong>{readiness.readinessPercent}%</strong><small>{readiness.criticalGaps} critical gaps</small></div></div><h3>Workforce Readiness</h3><p>Controlled SOPs, work instructions, training assignments, demonstrated competency, authorization, expiration risk, and critical-process coverage.</p><b>Open operational source <ArrowRight size={15} /></b></a>
            {otherViews.map(({ title, description, href, icon: Icon, metric, note }) => <a href={href} className="view-card" key={title}><div className="view-top"><span><Icon size={24} /></span><div><strong>{metric}</strong><small>{note}</small></div></div><h3>{title}</h3><p>{description}</p><b>Open intelligence view <ArrowRight size={15} /></b></a>)}
          </section>

          <section className="operating-model"><article><span>01</span><div><strong>Operational Workspace</strong><p>Owns controlled records, evidence, approvals, assignments, competency, and authorization.</p></div></article><article><span>02</span><div><strong>Executive Intelligence</strong><p>Consumes the rollup, identifies exposure, and links leadership back to source records.</p></div></article><article><span>03</span><div><strong>Closed-Loop Action</strong><p>Leaders assign ownership, supervisors close gaps, and the readiness score updates.</p></div></article></section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.ei-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.ei-shell>aside{position:fixed;inset:0 auto 0 0;width:258px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:190px;max-height:48px}.tenant{display:grid;gap:4px;margin:18px 0;padding:13px;border:1px solid #31536f;border-radius:12px;background:#0b2b4a}.tenant small,.status small{color:#86b4da;font-size:8px;font-weight:900;letter-spacing:.13em}.tenant strong{font-size:18px}.tenant span{color:#bfd3e4;font-size:9px}nav{display:grid;gap:6px}nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:11px;font-weight:850}nav a.active{color:#fff;background:#0d4a7c}.status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:9px}.main{margin-left:258px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:8px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#7a5715;background:#fff1cd;font-size:9px;font-weight:900}.content{max-width:1540px;margin:0 auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}.hero>div:first-child{padding:30px;border-radius:24px;color:#fff;background:radial-gradient(circle at 95% 0%,rgba(68,211,255,.24),transparent 32%),linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.22)}.hero small,.heading small,.section-head small{color:#8ecbff;font-size:8px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:920px;margin:14px 0 12px;font-size:clamp(31px,4vw,55px);line-height:1.02}.hero p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.65}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.hero-actions a{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border:1px solid #c6d6e2;border-radius:10px;color:#09223b;background:#fff;text-decoration:none;font-size:10px;font-weight:850}.hero-actions a.outline{border-color:#72afe1;color:#fff;background:transparent}.health{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:#fff;text-align:center}.health>small{color:#71879a}.ring{width:170px;height:170px;display:grid;place-items:center;margin:16px 0;border-radius:50%;background:conic-gradient(#0a66ff var(--score),#dce7ef 0)}.ring>div{width:130px;height:130px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.ring strong,.ring span{display:block}.ring strong{font-size:48px;line-height:1}.ring span{color:#74899b;font-size:10px}.health b{color:#a96810}.health em{margin-top:5px;color:#71869a;font-size:8px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;margin-top:16px}.metrics article,.panel,.view-card{border:1px solid #dbe5ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.metrics article{padding:16px}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70869a;font-size:8px;font-weight:900;text-transform:uppercase}.metrics strong{margin-top:7px;font-size:27px}.metrics span{margin-top:4px;color:#60788c;font-size:8px}.two{display:grid;grid-template-columns:1.15fr .85fr;gap:17px;margin-top:17px}.panel{padding:19px}.heading,.section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.heading h2,.section-head h2{margin:5px 0 0}.heading>svg{color:#0a66ff}.feed-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:15px}.feed-grid>div{padding:12px;border:1px solid #dce6ed;border-radius:12px;background:#f8fbfd}.feed-grid small,.feed-grid strong,.feed-grid span{display:block}.feed-grid small{color:#6d8396;font-size:8px;font-weight:900;text-transform:uppercase}.feed-grid strong{margin-top:7px;font-size:21px}.feed-grid span{margin-top:4px;color:#687f93;font-size:8px}.work-center-bars{display:grid;gap:11px;margin-top:15px}.work-center-bars>div>span{display:flex;justify-content:space-between;font-size:9px}.work-center-bars em{font-style:normal;font-weight:900}.work-center-bars i{height:9px;display:block;margin-top:5px;overflow:hidden;border-radius:999px;background:#e3edf4}.work-center-bars b{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#45cfff)}.source-note{display:flex;gap:11px;margin-top:15px;padding:13px;border-left:4px solid #0a66ff;border-radius:11px;color:#174d78;background:#e9f5ff}.source-note p{margin:5px 0 0;font-size:9px;line-height:1.5}.open-link{display:inline-flex;align-items:center;gap:6px;margin-top:12px;color:#0a66ff;text-decoration:none;font-size:9px;font-weight:900}.insights{display:grid;gap:9px;margin-top:15px}.insights>div{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:11px;border:1px solid #dce5ed;border-radius:12px}.insights span{font-weight:900;color:#0a66ff}.insights p{margin:0;font-size:10px;line-height:1.5}.insights em{padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900}.insights .high{color:#8f1f2c;background:#ffe7ea}.insights .medium{color:#85520a;background:#fff0d5}.section-head{align-items:end;margin:24px 0 12px}.section-head small{color:#0a66ff}.section-head>span{color:#61798d;font-size:9px}.view-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.view-card{min-height:260px;display:flex;flex-direction:column;padding:18px;color:#10263a;text-decoration:none}.view-card.featured{border:2px solid #0a66ff;background:linear-gradient(180deg,#f4f9ff,#fff)}.view-top{display:flex;align-items:center;justify-content:space-between}.view-top>span{width:46px;height:46px;display:grid;place-items:center;border-radius:13px;color:#0a66ff;background:#e8f2ff}.view-top>div{text-align:right}.view-top strong,.view-top small{display:block}.view-top strong{font-size:23px}.view-top small{color:#71869a;font-size:8px}.view-card h3{margin:18px 0 7px}.view-card p{margin:0;color:#60788c;font-size:10px;line-height:1.6}.view-card b{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:17px;color:#0a66ff;font-size:9px}.operating-model{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:18px}.operating-model article{display:flex;gap:12px;padding:17px;border:1px solid #d8e4ed;border-radius:16px;background:#fff}.operating-model article>span{width:39px;height:39px;display:grid;place-items:center;flex:0 0 auto;border-radius:11px;color:#0a66ff;background:#e8f2ff;font-weight:950}.operating-model p{margin:5px 0 0;color:#60788c;font-size:9px;line-height:1.5}@media(max-width:980px){.two{grid-template-columns:1fr}.feed-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:820px){.ei-shell>aside{position:static;width:auto;height:auto}.main{margin-left:0}.hero{grid-template-columns:1fr}.operating-model{grid-template-columns:1fr}.feed-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
