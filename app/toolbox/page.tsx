import { ArrowRight, BarChart3, Boxes, BrainCircuit, Building2, ClipboardCheck, Gauge, HardHat, PackageCheck, Settings, ShieldCheck, Truck, Users, Wrench } from "lucide-react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const workspaces = [
  { title: "Smart Operations", description: "Production status, shift handoffs, downtime, bottlenecks, labor, escalation, and daily accountability.", href: "/smart-operations", icon: BarChart3 },
  { title: "Smart Quality", description: "Inspection, NCR, CAPA, audits, calibration, customer assurance, documents, and quality planning.", href: "/smart-quality", icon: ClipboardCheck },
  { title: "Smart Warehouse", description: "Receiving, inventory, kitting, quarantine, material flow, shipping, evidence, and warehouse safety.", href: "/smart-warehouse", icon: Boxes },
  { title: "Smart Branch", description: "Branch leadership, customer promises, receiving, inventory exceptions, counter follow-up, VMI routes, vendor performance, employee accountability, and safety.", href: "/smart-branch", icon: Building2 },
  { title: "Smart Maintenance", description: "Work orders, preventive maintenance, breakdowns, asset history, spares, inspections, and reliability execution.", href: "/smart-maintenance", icon: Wrench },
  { title: "Smart Safety", description: "Observations, hazards, incidents, PPE, JSA/JHA, training, inspections, permits, and emergency readiness.", href: "/smart-safety", icon: HardHat },
  { title: "Smart Supplier", description: "Supplier approval, performance, risk, audits, SCAR, PPAP, incoming issues, and development plans.", href: "/smart-supplier", icon: Users },
  { title: "Smart Delivery", description: "Shipment readiness, packaging, documentation, customer release, carrier performance, POD, and exceptions.", href: "/smart-delivery", icon: Truck },
];

const intelligence = [
  { title: "Executive Intelligence", description: "Leadership views for workforce readiness, reliability, process assurance, delivery risk, value creation, and connected business context.", href: "/executive-intelligence", icon: BrainCircuit, status: "EXECUTIVE LAYER" },
  { title: "AI Workforce Operations", description: "Pilot and specialist agents convert connected operating evidence into supervised recommendations, decisions, and actions.", href: "/workforce-operations", icon: Gauge, status: "CONNECTED" },
  { title: "Accountability", description: "Owners, due dates, escalation, evidence, status, and verified closure across every workspace.", href: "/dashboard", icon: ShieldCheck, status: "CONNECTED" },
  { title: "System Administration", description: "Companies, users, permissions, integrations, records, configuration, and controlled platform governance.", href: "/", icon: Settings, status: "CONTROLLED" },
];

export default function ToolboxPage() {
  return (
    <main className="toolbox-shell">
      <aside>
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <nav><a href="/">Command Center</a><a href="/executive-intelligence">Executive Intelligence</a><a href="/workforce-operations">AI Workforce Operations</a><a href="/entity-graph">Entity Graph</a><a href="/dashboard">Accountability</a><a className="active" href="/toolbox">Workspaces</a></nav>
        <div className="boundary"><ShieldCheck size={18}/><span>Human authority, controlled records, and verified writeback remain mandatory.</span></div>
      </aside>
      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR</small><strong>Workspaces</strong></div><span>{workspaces.length} connected operating environments</span></header>
        <div className="content">
          <section className="hero">
            <div><small>NORTHSTAR OPERATING PLATFORM</small><h1>Enter the workspace. Complete the work. Return intelligence to Northstar.</h1><p>Each Smart Workspace uses the same navigation, evidence, ownership, verification, action routing, and Submit to Northstar pattern. Teams learn the platform once and use it everywhere.</p></div>
            <div className="flow"><b>Smart Workspace</b><ArrowRight/><b>Controlled Work</b><ArrowRight/><b>Executive Intelligence</b></div>
          </section>

          <section className="architecture">
            <article><span>01</span><div><strong>Executive Intelligence</strong><p>Leadership sees readiness, risk, reliability, delivery, value, and cross-platform context.</p></div></article>
            <article><span>02</span><div><strong>Smart Workspaces</strong><p>Departments execute consistent, controlled workflows inside focused operating environments.</p></div></article>
            <article><span>03</span><div><strong>Embedded Applications</strong><p>Specialized tools stay organized inside the workspace where the work naturally belongs.</p></div></article>
          </section>

          <section className="section-head"><div><small>WHERE WORK GETS DONE</small><h2>Smart Workspaces</h2></div><span>{workspaces.length} connected workspaces</span></section>
          <section className="grid workspace-grid">
            {workspaces.map(({title,description,href,icon:Icon}) => (
              <a className={`tile featured ${title === "Smart Branch" ? "new-workspace" : ""}`} href={href} key={title}><div className="tile-top"><span><Icon size={25}/></span><em>{title === "Smart Branch" ? "NEW · READY" : "READY"}</em></div><h2>{title}</h2><p>{description}</p><div className="open">Open workspace <ArrowRight size={16}/></div></a>
            ))}
          </section>

          <section className="section-head secondary-head"><div><small>DIRECT WORKFLOW ACCESS</small><h2>Embedded Applications</h2></div><span>Fast access to controlled work</span></section>
          <section className="grid application-grid">
            <a className="tile application-tile" href="/tools/delivery-assurance">
              <div className="tile-top"><span><PackageCheck size={25}/></span><em>READY · SYNC ENABLED</em></div>
              <h2>Delivery Assurance</h2>
              <p>Manage customer promises, order readiness, constraints, recovery plans, production execution, shipment release, and cross-device draft synchronization.</p>
              <div className="open">Open Delivery Assurance <ArrowRight size={16}/></div>
            </a>
          </section>

          <section className="section-head secondary-head"><div><small>LEADERSHIP & PLATFORM</small><h2>Intelligence and oversight</h2></div><a href="/executive-intelligence">Open intelligence hub <ArrowRight size={15}/></a></section>
          <section className="grid">
            {intelligence.map(({title,description,href,icon:Icon,status}) => (
              <a className="tile" href={href} key={title}><div className="tile-top"><span><Icon size={25}/></span><em>{status}</em></div><h2>{title}</h2><p>{description}</p><div className="open">Open view <ArrowRight size={16}/></div></a>
            ))}
          </section>
        </div>
      </section>
      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.toolbox-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}aside{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;background:linear-gradient(180deg,#061729,#0a2744);color:white;height:100vh;overflow:auto}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:190px;max-height:48px}nav{display:grid;gap:6px;margin-top:20px}nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}nav a.active{color:#fff;background:#0d4a7c}.boundary{display:flex;gap:9px;margin-top:24px;padding:14px;border:1px solid #31516f;border-radius:13px;color:#bcd2e4;font-size:10px;line-height:1.5}.main{margin-left:258px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.content{max-width:1460px;margin:0 auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:1.25fr .75fr;gap:20px;align-items:center;padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff)}.hero small,.section-head small{color:#9ed6ff;font-size:10px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:850px;margin:12px 0;font-size:clamp(31px,4vw,54px);line-height:1.03}.hero p{max-width:850px;color:#d6e8f6;line-height:1.65}.flow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.flow b{padding:13px;border:1px solid #5d96c3;border-radius:12px;background:#0b3557;font-size:11px}.architecture{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:16px}.architecture article{display:flex;gap:13px;padding:17px;border:1px solid #d8e4ed;border-radius:16px;background:#fff;box-shadow:0 9px 25px rgba(24,53,77,.06)}.architecture article>span{width:39px;height:39px;display:grid;place-items:center;flex:0 0 auto;border-radius:11px;color:#0a66ff;background:#e8f2ff;font-weight:950}.architecture strong{display:block}.architecture p{margin:5px 0 0;color:#60788c;font-size:10px;line-height:1.5}.section-head{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:24px 0 12px}.section-head small{color:#0a66ff}.section-head h2{margin:5px 0 0}.section-head>span{color:#61798d;font-size:10px}.section-head>a{display:flex;align-items:center;gap:6px;color:#0a66ff;text-decoration:none;font-size:10px;font-weight:900}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.tile{min-height:245px;display:flex;flex-direction:column;padding:20px;border:1px solid #d8e4ed;border-radius:19px;color:#10263a;background:#fff;text-decoration:none;box-shadow:0 12px 28px rgba(24,53,77,.07);transition:.2s}.tile:hover{transform:translateY(-3px);border-color:#8db9dc}.tile.featured{border:2px solid #0a66ff;background:linear-gradient(180deg,#f4f9ff,#fff)}.tile.new-workspace{border-color:#20a46b;box-shadow:0 14px 34px rgba(32,164,107,.15)}.application-grid{grid-template-columns:minmax(280px,420px)}.tile.application-tile{min-height:220px;border:2px solid #1f9d68;background:linear-gradient(180deg,#effbf5,#fff);box-shadow:0 14px 34px rgba(31,157,104,.14)}.application-tile .tile-top>span{color:#158458;background:#e5f8ef}.tile-top{display:flex;align-items:center;justify-content:space-between}.tile-top>span{width:48px;height:48px;display:grid;place-items:center;border-radius:13px;color:#0a66ff;background:#e8f2ff}.new-workspace .tile-top>span{color:#158458;background:#e5f8ef}.tile-top em{padding:6px 8px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:8px;font-style:normal;font-weight:900}.tile h2{margin:22px 0 8px}.tile p{margin:0;color:#60788c;font-size:12px;line-height:1.6}.open{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:18px;color:#0a66ff;font-size:11px;font-weight:900}.secondary-head{margin-top:30px}@media(max-width:820px){aside{position:static;width:auto;height:auto}.main{margin-left:0}.hero{grid-template-columns:1fr}.flow{grid-template-columns:1fr}.flow svg{transform:rotate(90deg);justify-self:center}.architecture{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
