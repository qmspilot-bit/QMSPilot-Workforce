import { ArrowRight, BrainCircuit, CheckCircle2, ClipboardCheck, Database, Network, ShieldCheck } from "lucide-react";
import { LiveCommandMetrics } from "@/components/live-command-metrics";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const agents = [
  ["Pilot", "PI", "Chief of Staff"],
  ["Atlas", "AT", "Accountability"],
  ["Forge", "FO", "Root Cause & Operations"],
  ["Sentinel", "SE", "Evidence & Compliance"],
  ["Vector", "VE", "Systemic Prevention"],
  ["Beacon", "BE", "Customer Intelligence"],
  ["Ledger", "LE", "Financial Intelligence"],
  ["Nexus", "NE", "Growth Intelligence"],
];

const priorities = [
  ["Critical", "Approve the integrated customer-recovery command plan", "Pilot", "$180K revenue exposure"],
  ["Critical", "Complete bore-gage product-impact review", "Sentinel + Forge", "$62K financial exposure"],
  ["High", "Protect qualified final-inspection coverage", "Atlas", "Replacement delivery"],
  ["High", "Authorize alternate supplier recovery path", "Pilot + Ledger", "$126K order exposure"],
];

export default function Home() {
  return (
    <main className="command-shell">
      <aside className="command-sidebar">
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

      <section className="command-main">
        <header className="command-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div>
          <span className="connected">Closed-Loop Execution Engine</span>
        </header>

        <div className="command-content">
          <section className="hero-grid">
            <article className="pilot-brief">
              <div className="eyebrow"><BrainCircuit size={17} /> PILOT EXECUTIVE BRIEFING</div>
              <h1>Protect the customer, control the recovery, and close the loop.</h1>
              <p>Northstar now converts connected operating records into routed intelligence, human-approved actions, native target-tool writeback, evidence-based execution, and synchronized closure.</p>
              <div className="hero-actions">
                <a href="/workforce-operations">Open human decision queue <ArrowRight size={16} /></a>
                <a className="outline" href="/entity-graph">Explore Entity Graph <Database size={16} /></a>
              </div>
            </article>
            <article className="health-card">
              <small>CLOSED-LOOP READINESS</small>
              <div className="readiness-ring"><div><strong>92</strong><span>out of 100</span></div></div>
              <b>Connected · supervised</b>
              <em>Human approval and closure remain mandatory</em>
            </article>
          </section>

          <LiveCommandMetrics />

          <section className="two-grid">
            <article className="panel">
              <div className="panel-heading"><div><small>LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><ClipboardCheck size={24} /></div>
              <div className="priority-list">
                {priorities.map(([level, title, owner, value]) => (
                  <article key={title}>
                    <span className={`severity ${level.toLowerCase()}`}>{level}</span>
                    <div><strong>{title}</strong><small>{owner}</small></div>
                    <b>{value}</b>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading"><div><small>CLOSED-LOOP EXECUTION</small><h2>Approved intelligence becomes controlled work.</h2></div><CheckCircle2 size={24} /></div>
              <div className="execution-flow">
                <span>Agent recommendation</span><ArrowRight size={15} />
                <span>Human approval</span><ArrowRight size={15} />
                <span>Native writeback</span><ArrowRight size={15} />
                <span>Evidence closure</span>
              </div>
              <p>Actions are written into the target Northstar application only after authorization. Owners update the work where it occurs, and Atlas receives the synchronized status and evidence.</p>
            </article>
          </section>

          <section className="workforce-section">
            <div className="section-heading"><div><small>AI WORKFORCE</small><h2>One digital team working from the same operating context.</h2></div><span>Every specialist remains supervised and evidence-bound.</span></div>
            <div className="agent-grid">
              {agents.map(([name, initials, role]) => (
                <article key={name}>
                  <div className="agent-head"><span>{initials}</span><div><strong>{name}</strong><small>{role}</small></div><em>READY</em></div>
                  <div className="agent-footer"><span>Intelligence Bus</span><strong>Connected</strong></div>
                </article>
              ))}
            </div>
          </section>

          <section className="two-grid final-grid">
            <article className="recommendation-card">
              <small>PILOT RECOMMENDATION</small>
              <h2>Run the operating rhythm before adding another standalone tool.</h2>
              <p>Use the current applications, Intelligence Bus, Entity Graph, and writeback engine to demonstrate one complete customer-recovery story from detection through verified closure.</p>
              <a href="/workforce-operations">Open AI Workforce Operations <ArrowRight size={16} /></a>
            </article>
            <article className="panel">
              <div className="panel-heading"><div><small>OPERATING BOUNDARY</small><h2>Supervised intelligence—not autonomous control.</h2></div><ShieldCheck size={25} /></div>
              <p>Northstar analyzes, routes, recommends, and writes only after authorization. Qualified humans retain authority for customer commitments, product release, financial validation, corrective-action closure, and management decisions.</p>
              <div className="quick-links"><a href="/workforce-operations"><Network size={16} />Intelligence Bus</a><a href="/entity-graph"><Database size={16} />Entity Graph</a><a href="/toolbox"><ClipboardCheck size={16} />Digital Toolbox</a></div>
            </article>
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.command-shell{min-height:100vh;color:#12263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.command-sidebar{position:fixed;inset:0 auto 0 0;width:258px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo-card,.northstar-card{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar-card{margin-top:8px;background:#020914}.logo-card img,.northstar-card img{max-width:190px;max-height:48px}.pilot-card{display:flex;align-items:center;gap:10px;margin:17px 0;padding:13px;border:1px solid #31516f;border-radius:14px;background:#102f4d}.pilot-card>span{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:#0a66ff;font-weight:900}.pilot-card strong,.pilot-card small{display:block}.pilot-card small{margin-top:3px;color:#9abbd6}.command-sidebar nav{display:grid;gap:6px}.command-sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.command-sidebar nav a.active{color:#fff;background:#0d4a7c}.system-status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.system-status small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.command-main{margin-left:258px}.command-topbar{min-height:68px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.command-topbar>div{margin-right:auto}.command-topbar small,.command-topbar strong{display:block}.command-topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.connected{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.command-content{max-width:1540px;margin:0 auto;padding:24px 24px 70px}.hero-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}.pilot-brief{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.24)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.pilot-brief h1{max-width:900px;margin:14px 0 12px;font-size:clamp(31px,4vw,55px);line-height:1.02}.pilot-brief p{max-width:930px;margin:0;color:#d6e8f6;line-height:1.65}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.hero-actions a,.quick-links a,.live-command-toolbar button{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border:1px solid #c6d6e2;border-radius:10px;color:#285674;background:#fff;text-decoration:none;font-size:11px;font-weight:850;cursor:pointer}.hero-actions a{color:#09223b}.hero-actions a.outline{border-color:#72afe1;color:#fff;background:transparent}.health-card{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:#fff;box-shadow:0 15px 38px rgba(24,55,83,.08);text-align:center}.health-card>small{color:#71879a;font-size:9px;font-weight:900;letter-spacing:.12em}.readiness-ring{width:178px;height:178px;display:grid;place-items:center;margin:16px 0;border-radius:50%;background:conic-gradient(#0a66ff 331deg,#dce7ef 0)}.readiness-ring>div{width:137px;height:137px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.readiness-ring strong,.readiness-ring span{display:block}.readiness-ring strong{font-size:49px;line-height:1}.readiness-ring span{color:#74899b;font-size:10px;font-weight:850}.health-card b{color:#16835a}.health-card em{margin-top:5px;color:#71869a;font-size:9px;font-style:normal}.live-command-block{margin-top:15px}.live-command-toolbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.live-mode{padding:8px 11px;border-radius:999px;font-size:10px;font-weight:900}.live-mode.secure{color:#176747;background:#e4f8ef}.live-mode.demo{color:#7a5715;background:#fff1cd}.live-command-notice{display:flex;align-items:center;gap:8px;margin-top:11px;padding:11px 13px;border:1px solid #9cc7e9;border-radius:11px;color:#174d78;background:#e9f5ff;font-size:11px;font-weight:800}.live-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:12px}.live-metric-grid article,.panel,.agent-grid article{border:1px solid #dbe5ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.live-metric-grid article{padding:16px}.live-metric-grid small,.live-metric-grid strong,.live-metric-grid span{display:block}.live-metric-grid small{color:#70869a;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.live-metric-grid strong{margin-top:7px;font-size:27px}.live-metric-grid span{margin-top:4px;color:#60788c;font-size:9px}.two-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:17px;margin-top:17px}.panel{padding:19px}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading small,.section-heading small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.12em}.panel-heading h2,.section-heading h2{margin:5px 0 0}.priority-list{display:grid;gap:9px;margin-top:15px}.priority-list article{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:11px;border:1px solid #dce5ed;border-radius:12px}.priority-list strong,.priority-list small{display:block}.priority-list small{margin-top:3px;color:#73899b;font-size:9px}.priority-list article>b{color:#295e84;font-size:11px}.severity{padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.execution-flow{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:22px}.execution-flow span{padding:9px 10px;border:1px solid #d9e4ec;border-radius:10px;color:#2d5c7e;background:#f4f9fc;font-size:9px;font-weight:850}.panel>p{color:#536d82;font-size:11px;line-height:1.6}.workforce-section{margin-top:18px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.section-heading>span{color:#6a8195;font-size:11px}.agent-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:13px}.agent-grid article{padding:14px}.agent-head{display:flex;align-items:center;gap:9px}.agent-head>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:#0b579f;background:#e1f1ff;font-size:10px;font-weight:950}.agent-head>div{margin-right:auto}.agent-head strong,.agent-head small{display:block}.agent-head small{margin-top:3px;color:#71869a;font-size:8px}.agent-head em{padding:4px 6px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:7px;font-style:normal;font-weight:950}.agent-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:11px;border-top:1px solid #e1e8ee;color:#71869a;font-size:9px}.agent-footer strong{color:#16835a}.final-grid{align-items:stretch}.recommendation-card{padding:22px;border-radius:18px;color:#fff;background:linear-gradient(145deg,#07192c,#0c497f)}.recommendation-card small{color:#9bd1fc;font-weight:900;letter-spacing:.12em}.recommendation-card h2{margin:12px 0}.recommendation-card p{color:#d4e6f5;line-height:1.6}.recommendation-card a{display:inline-flex;align-items:center;gap:7px;color:#fff;font-weight:900;text-decoration:none}.quick-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}@media(max-width:900px){.command-sidebar{position:static;width:auto;height:auto}.command-main{margin-left:0}.hero-grid{grid-template-columns:1fr}.system-status{display:none}}@media(max-width:600px){.command-content{padding:14px 12px 60px}.section-heading{align-items:start;flex-direction:column}.pilot-brief h1{font-size:34px}.priority-list article{grid-template-columns:auto 1fr}.priority-list article>b{grid-column:2}}
      `}</style>
    </main>
  );
}
