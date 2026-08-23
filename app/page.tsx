import { ArrowRight, BarChart3, Boxes, BrainCircuit, Building2, CheckCircle2, ClipboardCheck, Database, Network, ShieldCheck, Truck } from "lucide-react";
import { LiveCommandMetrics } from "@/components/live-command-metrics";
import { NorthstarPrimaryRail } from "@/components/northstar-primary-rail";

const priorities = [
  ["Critical", "Approve the integrated customer-recovery command plan", "Pilot", "$180K revenue exposure"],
  ["Critical", "Complete bore-gage product-impact review", "Sentinel + Forge", "$62K financial exposure"],
  ["High", "Protect qualified final-inspection coverage", "Atlas", "Replacement delivery"],
  ["High", "Authorize alternate supplier recovery path", "Pilot + Ledger", "$126K order exposure"],
];

const smartLaunch = [
  ["Smart Operations", "Production, handoffs, downtime and daily execution", "/smart-operations", BarChart3],
  ["Smart Quality", "Inspection, NCR, CAPA, audits and quality control", "/smart-quality", ClipboardCheck],
  ["Smart Branch", "Customer promises, VMI, inventory and accountability", "/smart-branch", Building2],
  ["Smart Delivery", "Shipment readiness, release, POD and exceptions", "/smart-delivery", Truck],
  ["Smart Warehouse", "Receiving, material flow, inventory and shipping", "/smart-warehouse", Boxes],
];

const agents = [
  ["Pilot", "Chief of Staff", "READY"],
  ["Atlas", "Accountability", "READY"],
  ["Forge", "Root Cause & Operations", "READY"],
  ["Sentinel", "Evidence & Compliance", "READY"],
  ["Beacon", "Customer Intelligence", "READY"],
  ["Ledger", "Financial Intelligence", "READY"],
];

export default function Home() {
  return (
    <main className="enterprise-shell">
      <NorthstarPrimaryRail active="home" />

      <section className="enterprise-main">
        <header className="command-topbar enterprise-topbar">
          <div><small>NORTHSTAR / HOME</small><strong>Executive Operating Console</strong></div>
          <span className="secure-state"><i /> Connected · Northstar Secure</span>
        </header>

        <div className="enterprise-content">
          <section className="pilot-briefing">
            <div className="pilot-mark"><BrainCircuit size={24} /></div>
            <div className="pilot-copy">
              <small>PILOT BRIEFING</small>
              <h1>Four priorities require attention. Two carry direct customer or revenue exposure.</h1>
              <p>Start with assigned actions, then move into the source workspace. Northstar keeps ownership, evidence, and closure connected underneath.</p>
            </div>
            <div className="pilot-actions">
              <a className="primary" href="/my-actions">Review My Actions <ArrowRight size={15} /></a>
              <a href="/workforce-operations">Decision queue</a>
            </div>
          </section>

          <LiveCommandMetrics />

          <section className="console-grid">
            <article className="enterprise-panel priorities-panel">
              <div className="panel-title"><div><small>NEEDS ATTENTION</small><h2>Leadership priorities</h2></div><ClipboardCheck size={20} /></div>
              <div className="priority-table">
                {priorities.map(([level, title, owner, value]) => (
                  <div className="priority-row" key={title}>
                    <span className={`severity ${level.toLowerCase()}`}>{level}</span>
                    <div><strong>{title}</strong><small>{owner}</small></div>
                    <b>{value}</b>
                    <a href="/my-actions" aria-label={`Open ${title}`}><ArrowRight size={14}/></a>
                  </div>
                ))}
              </div>
            </article>

            <article className="enterprise-panel readiness-panel">
              <div className="panel-title"><div><small>OPERATING HEALTH</small><h2>Closed-loop readiness</h2></div><ShieldCheck size={20} /></div>
              <div className="readiness-score"><strong>92</strong><span>/100</span></div>
              <div className="readiness-bar"><i /></div>
              <ul>
                <li><CheckCircle2 size={14}/> Secure persistence active</li>
                <li><CheckCircle2 size={14}/> Human approval preserved</li>
                <li><CheckCircle2 size={14}/> Evidence closure connected</li>
              </ul>
              <a className="text-link" href="/executive-intelligence">Open Leadership <ArrowRight size={14}/></a>
            </article>
          </section>

          <section className="section-heading enterprise-section-heading">
            <div><small>QUICK ACCESS</small><h2>Smart Workspaces</h2></div>
            <a href="/toolbox">View all workspaces <ArrowRight size={14}/></a>
          </section>
          <section className="smart-launch-grid">
            {smartLaunch.map(([title, note, href, Icon]) => (
              <a className="smart-launch-tile" href={href as string} key={title as string}>
                <div className="smart-launch-top"><span><Icon size={20}/></span><em>READY</em></div>
                <strong>{title as string}</strong>
                <p>{note as string}</p>
                <div>Open workspace <ArrowRight size={14}/></div>
              </a>
            ))}
          </section>

          <section className="console-grid lower-grid">
            <article className="enterprise-panel">
              <div className="panel-title"><div><small>AI WORKFORCE</small><h2>Supervised specialist status</h2></div><BrainCircuit size={20} /></div>
              <div className="agent-status-grid">
                {agents.map(([name, role, status]) => (
                  <div key={name}><span className="agent-dot"/><div><strong>{name}</strong><small>{role}</small></div><em>{status}</em></div>
                ))}
              </div>
              <a className="text-link" href="/workforce-operations">Open AI Workforce <ArrowRight size={14}/></a>
            </article>

            <article className="enterprise-panel advanced-panel">
              <div className="panel-title"><div><small>ADVANCED VIEWS</small><h2>Platform context</h2></div><Network size={20} /></div>
              <p>Use these views when deeper system context is needed. They are not required for everyday work.</p>
              <a href="/entity-graph"><Database size={16}/><span><strong>Entity Graph</strong><small>Connected operating relationships</small></span><ArrowRight size={14}/></a>
              <a href="/dashboard"><ClipboardCheck size={16}/><span><strong>Accountability</strong><small>Organization-wide owners and closure</small></span><ArrowRight size={14}/></a>
              <a href="/workforce-operations"><BrainCircuit size={16}/><span><strong>AI Workforce</strong><small>Supervised recommendations and decisions</small></span><ArrowRight size={14}/></a>
            </article>
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#eef2f6}.enterprise-shell{min-height:100vh;color:#14283b;background:#eef2f6;font-family:Inter,Arial,sans-serif}.enterprise-main{margin-left:236px}.enterprise-topbar{min-height:64px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e0e8;background:rgba(255,255,255,.98)}.enterprise-topbar>div{margin-right:auto}.enterprise-topbar small,.enterprise-topbar strong{display:block}.enterprise-topbar small{color:#71869a;font-size:8px;font-weight:900;letter-spacing:.14em}.enterprise-topbar strong{margin-top:3px;color:#18344d;font-size:13px}.secure-state{display:flex;align-items:center;gap:7px;margin-right:300px;color:#3e617d;font-size:9px;font-weight:850}.secure-state i{width:7px;height:7px;border-radius:50%;background:#31bd80;box-shadow:0 0 0 3px rgba(49,189,128,.1)}.enterprise-content{max-width:1540px;margin:0 auto;padding:20px 22px 58px}.pilot-briefing{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:15px;align-items:center;padding:18px 20px;border:1px solid #1c4161;border-radius:12px;color:#fff;background:linear-gradient(105deg,#0a1d2f 0%,#0b3152 68%,#0d4f82 100%);box-shadow:0 12px 32px rgba(13,40,63,.16)}.pilot-mark{width:42px;height:42px;display:grid;place-items:center;border:1px solid #386789;border-radius:9px;color:#8fc9f6;background:#0d2941}.pilot-copy small{color:#8fc8ef;font-size:8px;font-weight:950;letter-spacing:.14em}.pilot-copy h1{margin:5px 0 4px;font-size:17px;line-height:1.3}.pilot-copy p{margin:0;color:#b9d0e1;font-size:9px;line-height:1.5}.pilot-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.pilot-actions a{min-height:36px;display:flex;align-items:center;gap:6px;padding:0 11px;border:1px solid #4e7795;border-radius:7px;color:#d8e8f4;background:rgba(5,29,48,.45);text-decoration:none;font-size:9px;font-weight:850}.pilot-actions a.primary{border-color:#d8e9f6;color:#0c2940;background:#fff}.live-command-block{margin-top:14px}.live-command-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.live-mode{padding:6px 9px;border-radius:999px;font-size:8px;font-weight:900}.live-mode.secure{color:#166847;background:#e4f7ee}.live-mode.demo{color:#7a5715;background:#fff1cd}.live-command-toolbar button{min-height:34px;padding:0 10px;border:1px solid #ccd8e2;border-radius:7px;color:#315a78;background:#fff;font-size:9px;font-weight:850}.live-command-notice{display:flex;align-items:center;gap:7px;margin-top:8px;padding:9px 11px;border:1px solid #b9d3e7;border-radius:8px;color:#245b81;background:#f0f7fc;font-size:9px;font-weight:750}.live-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:9px}.live-metric-grid article{padding:13px 14px;border:1px solid #d8e2ea;border-radius:10px;background:#fff;box-shadow:0 4px 14px rgba(24,52,76,.04)}.live-metric-grid small,.live-metric-grid strong,.live-metric-grid span{display:block}.live-metric-grid small{color:#74899b;font-size:7px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.live-metric-grid strong{margin-top:6px;font-size:22px}.live-metric-grid span{margin-top:3px;color:#698093;font-size:8px}.console-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.45fr);gap:12px;margin-top:12px}.enterprise-panel{padding:16px;border:1px solid #d5e0e8;border-radius:11px;background:#fff;box-shadow:0 5px 18px rgba(20,48,72,.05)}.panel-title{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:11px;border-bottom:1px solid #e5ebf0}.panel-title small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.13em}.panel-title h2{margin:4px 0 0;font-size:15px}.panel-title>svg{color:#62819a}.priority-table{display:grid}.priority-row{display:grid;grid-template-columns:62px minmax(0,1fr) auto 28px;gap:10px;align-items:center;min-height:57px;border-bottom:1px solid #edf1f4}.priority-row:last-child{border-bottom:0}.priority-row strong,.priority-row small{display:block}.priority-row strong{font-size:10px}.priority-row small{margin-top:3px;color:#788c9e;font-size:8px}.priority-row b{color:#335d7b;font-size:9px;white-space:nowrap}.priority-row>a{width:28px;height:28px;display:grid;place-items:center;border:1px solid #d8e3eb;border-radius:7px;color:#447394}.severity{justify-self:start;padding:4px 6px;border-radius:5px;font-size:7px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f2531;background:#fce8eb}.severity.high{color:#7d550d;background:#fff0d3}.readiness-score{display:flex;align-items:baseline;margin-top:18px}.readiness-score strong{font-size:42px;line-height:1}.readiness-score span{margin-left:4px;color:#6f8597;font-size:11px;font-weight:800}.readiness-bar{height:7px;margin:12px 0 15px;overflow:hidden;border-radius:999px;background:#e3e9ee}.readiness-bar i{display:block;width:92%;height:100%;background:linear-gradient(90deg,#176db4,#26a879)}.readiness-panel ul{display:grid;gap:8px;margin:0;padding:0;list-style:none}.readiness-panel li{display:flex;align-items:center;gap:7px;color:#526e84;font-size:9px}.readiness-panel li svg{color:#20a875}.text-link{display:flex;align-items:center;gap:6px;margin-top:14px;color:#0a66b7;text-decoration:none;font-size:9px;font-weight:900}.enterprise-section-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:20px 0 10px}.enterprise-section-heading small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.13em}.enterprise-section-heading h2{margin:4px 0 0;font-size:16px}.enterprise-section-heading>a{display:flex;align-items:center;gap:5px;color:#0a66b7;text-decoration:none;font-size:9px;font-weight:850}.smart-launch-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.smart-launch-tile{min-height:160px;display:flex;flex-direction:column;padding:14px;border:1px solid #d4dfe8;border-radius:10px;color:#16354d;background:#fff;text-decoration:none;box-shadow:0 4px 14px rgba(23,52,77,.04);transition:.16s}.smart-launch-tile:hover{transform:translateY(-2px);border-color:#7baacf;box-shadow:0 8px 20px rgba(23,52,77,.08)}.smart-launch-top{display:flex;align-items:center;justify-content:space-between}.smart-launch-top>span{width:38px;height:38px;display:grid;place-items:center;border-radius:8px;color:#0b67b3;background:#e9f2fa}.smart-launch-top em{color:#2d7558;font-size:7px;font-style:normal;font-weight:900;letter-spacing:.08em}.smart-launch-tile>strong{margin-top:13px;font-size:11px}.smart-launch-tile p{margin:6px 0 0;color:#6e8294;font-size:8px;line-height:1.5}.smart-launch-tile>div:last-child{display:flex;align-items:center;gap:5px;margin-top:auto;padding-top:13px;color:#0a66b7;font-size:8px;font-weight:900}.lower-grid{grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr);margin-top:12px}.agent-status-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0 16px}.agent-status-grid>div{display:grid;grid-template-columns:9px 1fr auto;gap:8px;align-items:center;min-height:50px;border-bottom:1px solid #edf1f4}.agent-dot{width:7px;height:7px;border-radius:50%;background:#30bd81}.agent-status-grid strong,.agent-status-grid small{display:block}.agent-status-grid strong{font-size:9px}.agent-status-grid small{margin-top:2px;color:#768b9c;font-size:7px}.agent-status-grid em{color:#2e7458;font-size:7px;font-style:normal;font-weight:900}.advanced-panel>p{color:#60778a;font-size:9px;line-height:1.55}.advanced-panel>a{display:grid;grid-template-columns:26px 1fr auto;gap:9px;align-items:center;padding:10px 0;border-top:1px solid #edf1f4;color:#31536d;text-decoration:none}.advanced-panel>a>svg:first-child{color:#0a66b7}.advanced-panel>a strong,.advanced-panel>a small{display:block}.advanced-panel>a strong{font-size:9px}.advanced-panel>a small{margin-top:2px;color:#7a8e9f;font-size:7px}.advanced-panel>a>svg:last-child{color:#8da0af}@media(max-width:1200px){.smart-launch-grid{grid-template-columns:repeat(3,1fr)}.console-grid,.lower-grid{grid-template-columns:1fr}.secure-state{margin-right:72px}}@media(max-width:820px){.enterprise-main{margin-left:0}.enterprise-topbar{padding:0 14px}.enterprise-content{padding:14px}.pilot-briefing{grid-template-columns:40px 1fr}.pilot-actions{grid-column:1/-1;justify-content:flex-start}.smart-launch-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.smart-launch-grid,.agent-status-grid{grid-template-columns:1fr}.priority-row{grid-template-columns:58px 1fr 28px}.priority-row b{display:none}}
      `}</style>
    </main>
  );
}
