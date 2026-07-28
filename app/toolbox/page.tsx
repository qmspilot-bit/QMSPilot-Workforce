import { ArrowRight, Boxes, ClipboardCheck, Gauge, HardHat, Settings, ShieldCheck, Wrench } from "lucide-react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const tools = [
  { title: "Smart Quality", description: "Quality execution, inspection, NCR, CAPA, audits, calibration, supplier quality, customer assurance, documents, and AI insights.", href: "/smart-quality", icon: ClipboardCheck, status: "NEW · READY" },
  { title: "Smart Warehouse", description: "Warehouse execution, inventory visibility, receiving, kitting, quarantine, shipping, safety, and AI insights.", href: "/smart-warehouse", icon: Boxes, status: "READY" },
  { title: "AI Workforce", description: "Pilot and specialist agents convert operating evidence into supervised decisions and actions.", href: "/workforce-operations", icon: Gauge, status: "CONNECTED" },
  { title: "Safety Operations", description: "Inspections, observations, hazards, PPE, and safety action tracking.", href: "/", icon: HardHat, status: "ROADMAP" },
  { title: "Maintenance", description: "Preventive maintenance, equipment health, downtime, and work verification.", href: "/", icon: Wrench, status: "ROADMAP" },
  { title: "System Administration", description: "Companies, users, permissions, integrations, records, and configuration.", href: "/", icon: Settings, status: "CONTROLLED" },
];

export default function ToolboxPage() {
  return (
    <main className="toolbox-shell">
      <aside>
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <nav><a href="/">Command Center</a><a href="/workforce-operations">AI Workforce Operations</a><a href="/entity-graph">Entity Graph</a><a href="/dashboard">Accountability</a><a className="active" href="/toolbox">Digital Toolbox</a></nav>
        <div className="boundary"><ShieldCheck size={18}/><span>Human authority and controlled writeback remain mandatory.</span></div>
      </aside>
      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR</small><strong>Digital Toolbox</strong></div><span>Connected operating applications</span></header>
        <div className="content">
          <section className="hero"><div><small>DIGITAL OPERATIONS PLATFORM</small><h1>Open the right tool. Complete the work. Submit it to Northstar.</h1><p>Every application uses a consistent workflow and returns records, evidence, actions, status, and measurable results to the Northstar command layer.</p></div><div className="flow"><b>Field Tool</b><ArrowRight/><b>Submit to Northstar</b><ArrowRight/><b>Leadership Visibility</b></div></section>
          <section className="grid">{tools.map(({title,description,href,icon:Icon,status}) => (<a className={title.startsWith("Smart") ? "tile featured" : "tile"} href={href} key={title}><div className="tile-top"><span><Icon size={25}/></span><em>{status}</em></div><h2>{title}</h2><p>{description}</p><div className="open">Open workspace <ArrowRight size={16}/></div></a>))}</section>
        </div>
      </section>
      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.toolbox-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}aside{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;background:linear-gradient(180deg,#061729,#0a2744);color:white;height:100vh}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:190px;max-height:48px}nav{display:grid;gap:6px;margin-top:20px}nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}nav a.active{color:#fff;background:#0d4a7c}.boundary{display:flex;gap:9px;margin-top:24px;padding:14px;border:1px solid #31516f;border-radius:13px;color:#bcd2e4;font-size:10px;line-height:1.5}.main{margin-left:258px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.content{max-width:1460px;margin:0 auto;padding:24px}.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:20px;align-items:center;padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff)}.hero small{color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:850px;margin:12px 0;font-size:clamp(31px,4vw,54px);line-height:1.03}.hero p{max-width:850px;color:#d6e8f6;line-height:1.65}.flow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.flow b{padding:13px;border:1px solid #5d96c3;border-radius:12px;background:#0b3557;font-size:11px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:18px}.tile{min-height:250px;display:flex;flex-direction:column;padding:20px;border:1px solid #d8e4ed;border-radius:19px;color:#10263a;background:#fff;text-decoration:none;box-shadow:0 12px 28px rgba(24,53,77,.07);transition:.2s}.tile:hover{transform:translateY(-3px);border-color:#8db9dc}.tile.featured{border:2px solid #0a66ff;background:linear-gradient(180deg,#f4f9ff,#fff)}.tile-top{display:flex;align-items:center;justify-content:space-between}.tile-top>span{width:48px;height:48px;display:grid;place-items:center;border-radius:13px;color:#0a66ff;background:#e8f2ff}.tile-top em{padding:6px 8px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:8px;font-style:normal;font-weight:900}.tile h2{margin:22px 0 8px}.tile p{margin:0;color:#60788c;font-size:12px;line-height:1.6}.open{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:18px;color:#0a66ff;font-size:11px;font-weight:900}@media(max-width:820px){aside{position:static;width:auto;height:auto}.main{margin-left:0}.hero{grid-template-columns:1fr}.flow{grid-template-columns:1fr}.flow svg{transform:rotate(90deg);justify-self:center}}
      `}</style>
    </main>
  );
}
