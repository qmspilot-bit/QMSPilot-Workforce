import { ArrowRight, BarChart3, Boxes, Building2, ClipboardCheck, Gauge, HardHat, PackageCheck, ShieldCheck, Truck, Users, Wrench } from "lucide-react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const runBusiness = [
  { title: "Operations", description: "Production, shift handoffs, downtime, bottlenecks, labor, escalation, and daily execution.", href: "/smart-operations", icon: BarChart3 },
  { title: "Branch", description: "Customer promises, receiving, inventory exceptions, counter follow-up, VMI routes, vendor performance, employee accountability, and safety.", href: "/smart-branch", icon: Building2 },
  { title: "Warehouse", description: "Receiving, inventory, kitting, quarantine, material flow, shipping, evidence, and warehouse safety.", href: "/smart-warehouse", icon: Boxes },
  { title: "Delivery", description: "Shipment readiness, packaging, documentation, customer release, carrier performance, POD, and exceptions.", href: "/smart-delivery", icon: Truck },
];

const controlImprove = [
  { title: "Quality", description: "Inspection, NCR, CAPA, audits, calibration, customer assurance, documents, and quality planning.", href: "/smart-quality", icon: ClipboardCheck },
  { title: "Maintenance", description: "Work orders, preventive maintenance, breakdowns, asset history, spares, inspections, and reliability execution.", href: "/smart-maintenance", icon: Wrench },
  { title: "Safety", description: "Observations, hazards, incidents, PPE, JSA/JHA, training, inspections, permits, and emergency readiness.", href: "/smart-safety", icon: HardHat },
  { title: "Supplier", description: "Supplier approval, performance, risk, audits, SCAR, PPAP, incoming issues, and development plans.", href: "/smart-supplier", icon: Users },
];

const focused = [
  { title: "Delivery Assurance", note: "Customer commitments, order risk, recovery, and shipment readiness.", href: "/tools/delivery-assurance", icon: PackageCheck },
  { title: "Workforce Readiness", note: "Controlled instructions, training, competency, and authorization.", href: "/tools/workforce-readiness", icon: Users },
  { title: "Asset Reliability", note: "Assets, PM plans, work orders, downtime, and return to service.", href: "/tools/asset-reliability", icon: Gauge },
  { title: "Process Assurance", note: "Layered audits, findings, process adherence, and sustained control.", href: "/tools/process-assurance", icon: ClipboardCheck },
  { title: "6S Workplace Excellence", note: "Workplace standards, audits, findings, ownership, and sustainment.", href: "/tools/6s-workplace-excellence", icon: ShieldCheck },
];

function WorkspaceGroup({ title, note, items }: { title: string; note: string; items: typeof runBusiness }) {
  return (
    <section className="work-group">
      <div className="section-head"><div><small>{note}</small><h2>{title}</h2></div></div>
      <div className="workspace-grid">
        {items.map(({ title: itemTitle, description, href, icon: Icon }) => (
          <a className="workspace-card" href={href} key={itemTitle}>
            <span><Icon size={24}/></span>
            <div><h3>{itemTitle}</h3><p>{description}</p><b>Open {itemTitle} <ArrowRight size={15}/></b></div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function ToolboxPage() {
  return (
    <main className="work-shell">
      <aside>
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <nav><a href="/">Home</a><a className="active" href="/toolbox">Work</a><a href="/dashboard">My Actions</a><a href="/executive-intelligence">Leadership</a></nav>
        <div className="boundary"><ShieldCheck size={18}/><span>Choose the area where the work happens. Northstar handles the connected intelligence underneath.</span></div>
      </aside>

      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR</small><strong>Work</strong></div><span>Choose where the job gets done</span></header>
        <div className="content">
          <section className="hero">
            <div><small>WORK</small><h1>Where do you need to work?</h1><p>Choose the business area. You do not need to know which Northstar engine, agent, or data layer sits underneath it.</p></div>
            <div className="hero-rule"><strong>One rule</strong><span>Go to the area where the activity naturally belongs.</span></div>
          </section>

          <WorkspaceGroup title="Run the business" note="DAY-TO-DAY EXECUTION" items={runBusiness} />
          <WorkspaceGroup title="Control and improve" note="QUALITY · RELIABILITY · SAFETY · SUPPLIERS" items={controlImprove} />

          <section className="work-group">
            <div className="section-head"><div><small>FOCUSED APPLICATIONS</small><h2>Direct access when you know the exact job</h2></div><span>Optional shortcuts</span></div>
            <div className="focused-grid">
              {focused.map(({ title, note, href, icon: Icon }) => (
                <a href={href} className="focused-card" key={title}><Icon size={20}/><span><strong>{title}</strong><small>{note}</small></span><ArrowRight size={15}/></a>
              ))}
            </div>
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.work-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.work-shell>aside{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;background:linear-gradient(180deg,#061729,#0a2744);color:white;height:100vh;overflow:auto}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:190px;max-height:48px}.work-shell nav{display:grid;gap:6px;margin-top:20px}.work-shell nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.work-shell nav a.active{color:#fff;background:#0d4a7c}.boundary{display:flex;gap:9px;margin-top:24px;padding:14px;border:1px solid #31516f;border-radius:13px;color:#bcd2e4;font-size:10px;line-height:1.5}.main{margin-left:258px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.content{max-width:1460px;margin:0 auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:20px;align-items:center;padding:28px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff)}.hero small,.section-head small{font-size:9px;font-weight:900;letter-spacing:.12em}.hero small{color:#9ed6ff}.hero h1{margin:10px 0;font-size:clamp(31px,4vw,52px);line-height:1.03}.hero p{max-width:820px;margin:0;color:#d6e8f6;line-height:1.65}.hero-rule{padding:18px;border:1px solid #73a9d5;border-radius:15px;background:rgba(4,34,59,.45)}.hero-rule strong,.hero-rule span{display:block}.hero-rule strong{font-size:12px}.hero-rule span{margin-top:5px;color:#d8eafb;font-size:11px;line-height:1.5}.work-group{margin-top:24px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:12px}.section-head small{color:#0a66ff}.section-head h2{margin:5px 0 0}.section-head>span{color:#667e91;font-size:9px}.workspace-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.workspace-card{display:grid;grid-template-columns:52px 1fr;gap:14px;min-height:180px;padding:18px;border:1px solid #d8e4ed;border-radius:18px;color:#10263a;background:#fff;text-decoration:none;box-shadow:0 10px 28px rgba(24,53,77,.07);transition:.18s}.workspace-card:hover{transform:translateY(-2px);border-color:#84b7df}.workspace-card>span{width:52px;height:52px;display:grid;place-items:center;border-radius:14px;color:#0a66ff;background:#e8f2ff}.workspace-card h3{margin:2px 0 7px;font-size:20px}.workspace-card p{margin:0;color:#60788c;font-size:11px;line-height:1.55}.workspace-card b{display:flex;align-items:center;gap:6px;margin-top:16px;color:#0a66ff;font-size:10px}.focused-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.focused-card{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:13px 14px;border:1px solid #d8e4ed;border-radius:13px;color:#284b68;background:#fff;text-decoration:none}.focused-card>svg:first-child{color:#0a66ff}.focused-card strong,.focused-card small{display:block}.focused-card strong{font-size:10px}.focused-card small{margin-top:3px;color:#72879a;font-size:8px;line-height:1.45}.focused-card>svg:last-child{color:#7d94a6}@media(max-width:980px){.hero,.workspace-grid,.focused-grid{grid-template-columns:1fr}}@media(max-width:820px){.work-shell>aside{position:static;width:auto;height:auto}.main{margin-left:0}.boundary{display:none}}
      `}</style>
    </main>
  );
}
