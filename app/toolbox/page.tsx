import { ArrowRight, BarChart3, Boxes, BrainCircuit, Building2, ClipboardCheck, Database, Gauge, HardHat, PackageCheck, Settings, ShieldCheck, Truck, Users, Wrench } from "lucide-react";
import { NorthstarPrimaryRail } from "@/components/northstar-primary-rail";

const workspaces = [
  { title: "Smart Operations", description: "Production status, shift handoffs, downtime, bottlenecks, labor, escalation, and daily accountability.", href: "/smart-operations", icon: BarChart3 },
  { title: "Smart Quality", description: "Inspection, NCR, CAPA, audits, calibration, customer assurance, documents, and quality planning.", href: "/smart-quality", icon: ClipboardCheck },
  { title: "Smart Warehouse", description: "Receiving, inventory, kitting, quarantine, material flow, shipping, evidence, and warehouse safety.", href: "/smart-warehouse", icon: Boxes },
  { title: "Smart Branch", description: "Customer promises, VMI routes, inventory exceptions, vendor performance, employee accountability, and branch safety.", href: "/smart-branch", icon: Building2 },
  { title: "Smart Maintenance", description: "Work orders, preventive maintenance, breakdowns, asset history, spares, inspections, and reliability execution.", href: "/smart-maintenance", icon: Wrench },
  { title: "Smart Safety", description: "Observations, hazards, incidents, PPE, JSA/JHA, training, inspections, permits, and emergency readiness.", href: "/smart-safety", icon: HardHat },
  { title: "Smart Supplier", description: "Supplier approval, performance, risk, audits, SCAR, PPAP, incoming issues, and development plans.", href: "/smart-supplier", icon: Users },
  { title: "Smart Delivery", description: "Shipment readiness, packaging, documentation, customer release, carrier performance, POD, and exceptions.", href: "/smart-delivery", icon: Truck },
];

const applications = [
  { title: "Delivery Assurance", note: "Customer commitments, order risk, recovery, and shipment readiness.", href: "/tools/delivery-assurance", icon: PackageCheck, status: "SYNC ACTIVE" },
  { title: "Workforce Readiness", note: "Controlled instructions, training, competency, and authorization.", href: "/tools/workforce-readiness", icon: Users, status: "READY" },
  { title: "Asset Reliability", note: "Assets, PM plans, work orders, downtime, and return to service.", href: "/tools/asset-reliability", icon: Gauge, status: "READY" },
  { title: "Process Assurance", note: "Layered audits, findings, process adherence, and sustained control.", href: "/tools/process-assurance", icon: ClipboardCheck, status: "READY" },
  { title: "6S Workplace Excellence", note: "Workplace standards, audits, findings, ownership, and sustainment.", href: "/tools/6s-workplace-excellence", icon: ShieldCheck, status: "READY" },
  { title: "Controlled Change", note: "Review, approval, implementation evidence, and controlled change closure.", href: "/tools/controlled-change", icon: Settings, status: "READY" },
  { title: "Customer Assurance", note: "Customer issues, commitments, evidence, communication, and closure.", href: "/tools/customer-assurance", icon: Building2, status: "READY" },
  { title: "Daily Operations", note: "Daily execution, ownership, escalation, and shift operating rhythm.", href: "/tools/daily-operations", icon: BarChart3, status: "READY" },
  { title: "Measurement Assurance", note: "Calibration, measurement systems, evidence, status, and control.", href: "/tools/measurement-assurance", icon: Gauge, status: "READY" },
  { title: "Supplier Assurance", note: "Supplier risk, performance, issues, evidence, and recovery.", href: "/tools/supplier-assurance", icon: Users, status: "READY" },
  { title: "Value Ledger", note: "Improvement value, financial impact, evidence, and realized benefit.", href: "/tools/value-ledger", icon: BarChart3, status: "READY" },
  { title: "CAPA", note: "Corrective action containment, root cause, action, verification, and closure.", href: "/tools/capa", icon: ClipboardCheck, status: "CONTROLLED" },
  { title: "NCR", note: "Nonconformance capture, disposition, evidence, ownership, and escalation.", href: "/tools/ncr", icon: ClipboardCheck, status: "CONTROLLED" },
];

const advanced = [
  { title: "AI Workforce", note: "Pilot and specialist agents, recommendations, approvals, and controlled writeback.", href: "/workforce-operations", icon: BrainCircuit },
  { title: "Entity Graph", note: "Connected business context across customers, records, actions, assets, and operating signals.", href: "/entity-graph", icon: Database },
  { title: "Accountability", note: "Organization-wide ownership, due dates, evidence, escalation, and verified closure.", href: "/dashboard", icon: ShieldCheck },
];

export default function ToolboxPage() {
  return (
    <main className="work-shell">
      <NorthstarPrimaryRail active="work" />

      <section className="work-main">
        <header className="work-topbar">
          <div><small>NORTHSTAR / WORK</small><strong>Operating Workspaces</strong></div>
          <span><i /> {workspaces.length} Smart Workspaces ready</span>
        </header>

        <div className="work-content">
          <section className="work-intro">
            <div><small>OPERATING PLATFORM</small><h1>Choose the workspace where the work belongs.</h1><p>Smart Workspaces keep execution familiar while Northstar manages connected records, evidence, ownership, and intelligence underneath.</p></div>
            <div className="work-principle"><ShieldCheck size={18}/><span><strong>One operating pattern</strong><small>Enter workspace → complete work → submit → close the loop</small></span></div>
          </section>

          <section className="section-heading">
            <div><small>WHERE WORK GETS DONE</small><h2>Smart Workspaces</h2></div>
            <span>{workspaces.length} connected operating environments</span>
          </section>
          <section className="smart-grid">
            {workspaces.map(({ title, description, href, icon: Icon }) => (
              <a className={`smart-tile ${title === "Smart Branch" ? "smart-branch" : ""}`} href={href} key={title}>
                <div className="smart-tile-top"><span><Icon size={22}/></span><em>{title === "Smart Branch" ? "SYNC ACTIVE" : "READY"}</em></div>
                <h2>{title}</h2>
                <p>{description}</p>
                <div className="tile-footer"><span>Open workspace</span><ArrowRight size={15}/></div>
              </a>
            ))}
          </section>

          <section className="section-heading apps-heading">
            <div><small>FOCUSED CONTROLLED WORK</small><h2>Applications</h2></div>
            <span>Direct access when you know the exact job</span>
          </section>
          <section className="application-grid">
            {applications.map(({ title, note, href, icon: Icon, status }) => (
              <a className="application-row" href={href} key={title}>
                <span className="app-icon"><Icon size={18}/></span>
                <span className="app-copy"><strong>{title}</strong><small>{note}</small></span>
                <em>{status}</em>
                <ArrowRight className="app-arrow" size={14}/>
              </a>
            ))}
          </section>

          <section className="section-heading apps-heading">
            <div><small>ADVANCED NORTHSTAR</small><h2>Platform context</h2></div>
            <span>Use when deeper system visibility is needed</span>
          </section>
          <section className="advanced-grid">
            {advanced.map(({ title, note, href, icon: Icon }) => (
              <a href={href} key={title}><span><Icon size={18}/></span><div><strong>{title}</strong><small>{note}</small></div><ArrowRight size={14}/></a>
            ))}
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#eef2f6}.work-shell{min-height:100vh;color:#14283b;background:#eef2f6;font-family:Inter,Arial,sans-serif}.work-main{margin-left:236px}.work-topbar{min-height:64px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e0e8;background:#fff}.work-topbar>div{margin-right:auto}.work-topbar small,.work-topbar strong{display:block}.work-topbar small{color:#71869a;font-size:8px;font-weight:900;letter-spacing:.14em}.work-topbar strong{margin-top:3px;color:#18344d;font-size:13px}.work-topbar>span{display:flex;align-items:center;gap:7px;margin-right:300px;color:#47667f;font-size:9px;font-weight:850}.work-topbar>span i{width:7px;height:7px;border-radius:50%;background:#31bd80}.work-content{max-width:1540px;margin:0 auto;padding:20px 22px 58px}.work-intro{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:17px 19px;border:1px solid #d4dfe8;border-radius:11px;background:#fff;box-shadow:0 5px 18px rgba(20,48,72,.04)}.work-intro small,.section-heading small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.13em}.work-intro h1{margin:5px 0 5px;color:#14334d;font-size:19px}.work-intro p{max-width:920px;margin:0;color:#687f92;font-size:9px;line-height:1.55}.work-principle{display:flex;align-items:center;gap:10px;min-width:300px;padding:11px 13px;border-left:1px solid #dde5eb;color:#3d607b}.work-principle>svg{color:#259268}.work-principle strong,.work-principle small{display:block}.work-principle strong{font-size:9px}.work-principle small{margin-top:3px;color:#74899a;font-size:7px}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:21px 0 10px}.section-heading h2{margin:4px 0 0;font-size:16px}.section-heading>span{color:#718698;font-size:8px}.smart-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.smart-tile{position:relative;min-height:214px;display:flex;flex-direction:column;padding:15px;border:1px solid #d4dfe8;border-top:3px solid #176ead;border-radius:10px;color:#15344c;background:#fff;text-decoration:none;box-shadow:0 5px 17px rgba(20,48,72,.05);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}.smart-tile:hover{transform:translateY(-2px);border-color:#86abc8;border-top-color:#0a66b7;box-shadow:0 10px 25px rgba(20,48,72,.09)}.smart-tile.smart-branch{border-top-color:#27976c}.smart-tile-top{display:flex;align-items:center;justify-content:space-between}.smart-tile-top>span{width:42px;height:42px;display:grid;place-items:center;border-radius:8px;color:#0b67b3;background:#eaf3fa}.smart-branch .smart-tile-top>span{color:#22845f;background:#e9f6f0}.smart-tile-top em{padding:4px 6px;border-radius:5px;color:#2f7358;background:#e9f6f0;font-size:6px;font-style:normal;font-weight:950;letter-spacing:.08em}.smart-tile h2{margin:15px 0 6px;font-size:14px}.smart-tile p{margin:0;color:#687e90;font-size:8px;line-height:1.55}.tile-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:14px;color:#0a66b7;font-size:8px;font-weight:900}.apps-heading{margin-top:28px}.application-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.application-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto 22px;gap:10px;align-items:center;min-height:66px;padding:8px 10px;border:1px solid #d7e1e9;border-radius:9px;color:#23445e;background:#fff;text-decoration:none;transition:.15s}.application-row:hover{border-color:#8db1cc;background:#fbfdff}.app-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:7px;color:#0a66b7;background:#edf4fa}.app-copy strong,.app-copy small{display:block}.app-copy strong{font-size:9px}.app-copy small{margin-top:3px;color:#75899a;font-size:7px;line-height:1.45}.application-row em{padding:4px 6px;border-radius:5px;color:#44705f;background:#edf7f2;font-size:6px;font-style:normal;font-weight:900;letter-spacing:.07em;white-space:nowrap}.app-arrow{color:#8aa0b2}.advanced-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.advanced-grid>a{display:grid;grid-template-columns:36px 1fr 20px;gap:9px;align-items:center;padding:12px;border:1px solid #d5e0e8;border-radius:9px;color:#294d68;background:#fff;text-decoration:none}.advanced-grid>a>span{width:34px;height:34px;display:grid;place-items:center;border-radius:7px;color:#0a66b7;background:#edf4fa}.advanced-grid strong,.advanced-grid small{display:block}.advanced-grid strong{font-size:9px}.advanced-grid small{margin-top:3px;color:#768a9b;font-size:7px;line-height:1.4}.advanced-grid>a>svg:last-child{color:#8aa0b2}@media(max-width:1250px){.smart-grid{grid-template-columns:repeat(3,1fr)}.work-topbar>span{margin-right:72px}}@media(max-width:980px){.smart-grid{grid-template-columns:repeat(2,1fr)}.application-grid,.advanced-grid{grid-template-columns:1fr}.work-intro{grid-template-columns:1fr}.work-principle{min-width:0;border-left:0;border-top:1px solid #dde5eb;padding-left:0}}@media(max-width:820px){.work-main{margin-left:0}.work-topbar{padding:0 14px}.work-content{padding:14px}}@media(max-width:560px){.smart-grid{grid-template-columns:1fr}.application-row{grid-template-columns:36px 1fr 20px}.application-row em{display:none}}
      `}</style>
    </main>
  );
}
