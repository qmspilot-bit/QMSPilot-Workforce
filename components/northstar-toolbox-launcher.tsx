"use client";

import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  ExternalLink,
  FlaskConical,
  Gauge,
  GraduationCap,
  HardHat,
  LayoutGrid,
  Network,
  PackageCheck,
  Share2,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type Section = "overview" | "intelligence" | "workspaces" | "platform";

type CardProps = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  action: string;
  badge?: string;
  featured?: boolean;
};

export function NorthstarToolboxLauncher() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => {
    const openFromUrl = new URLSearchParams(window.location.search).get("toolbox") === "open";
    if (openFromUrl) setOpen(true);
    const openToolbox = () => setOpen(true);
    window.addEventListener("qmspilot:open-toolbox", openToolbox);
    return () => window.removeEventListener("qmspilot:open-toolbox", openToolbox);
  }, []);

  function closeToolbox() {
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.get("toolbox") === "open") {
      url.searchParams.delete("toolbox");
      const query = url.searchParams.toString();
      window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
    }
  }

  const card = ({ title, description, href, icon, action, badge = "CONNECTED", featured = false }: CardProps) => (
    <article className={featured ? "nav-card featured" : "nav-card"} key={title}>
      <div className="card-top"><span className="badge">{badge}</span><span className="card-icon">{icon}</span></div>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={href}>{action}<ExternalLink size={15}/></a>
    </article>
  );

  const executiveCards: CardProps[] = [
    { title: "Workforce Readiness", description: "Skills matrix, qualification evidence, cross-training priorities, expiration risk, and critical-process coverage.", href: "/tools/workforce-readiness", icon: <GraduationCap size={21}/>, action: "Open readiness", featured: true },
    { title: "Asset Reliability", description: "Executive equipment-health view covering PM compliance, failures, downtime cost, MTBF, MTTR, and critical assets.", href: "/tools/asset-reliability", icon: <Gauge size={21}/>, action: "Open reliability" },
    { title: "Process Assurance", description: "Process adherence, layered audit performance, standards verification, open risks, and sustained corrective action.", href: "/tools/process-assurance", icon: <ClipboardCheck size={21}/>, action: "Open assurance" },
    { title: "Delivery Assurance", description: "Customer commitments, delayed orders, shipment risk, constraints, recovery actions, and on-time delivery visibility.", href: "/tools/delivery-assurance", icon: <PackageCheck size={21}/>, action: "Open delivery view" },
    { title: "Value Ledger", description: "Financially validated savings, avoided cost, protected revenue, working-capital impact, and QMSPilot ROI.", href: "/tools/value-ledger", icon: <BadgeDollarSign size={21}/>, action: "Open value ledger" },
    { title: "Entity Graph", description: "Trace customers, orders, products, suppliers, assets, people, risks, actions, and controlled records to their source events.", href: "/entity-graph", icon: <Share2 size={21}/>, action: "Explore entity graph" },
  ];

  const workspaceCards: CardProps[] = [
    { title: "Smart Operations", description: "Production flow, shift handoffs, downtime, bottlenecks, labor, escalation, and daily accountability.", href: "/smart-operations", icon: <BarChart3 size={21}/>, action: "Open Operations" },
    { title: "Smart Quality", description: "Inspection, NCR, CAPA, audits, calibration, customer assurance, documents, and quality planning.", href: "/smart-quality", icon: <ClipboardCheck size={21}/>, action: "Open Quality" },
    { title: "Smart Warehouse", description: "Receiving, inventory, kitting, quarantine, shipping, material flow, evidence, and warehouse safety.", href: "/smart-warehouse", icon: <Boxes size={21}/>, action: "Open Warehouse" },
    { title: "Smart Maintenance", description: "Work orders, preventive maintenance, breakdowns, asset history, spares, inspections, and reliability work.", href: "/smart-maintenance", icon: <Wrench size={21}/>, action: "Open Maintenance" },
    { title: "Smart Safety", description: "Observations, hazards, incidents, PPE, JSA/JHA, training, inspections, permits, and emergency readiness.", href: "/smart-safety", icon: <HardHat size={21}/>, action: "Open Safety" },
    { title: "Smart Supplier", description: "Supplier approval, performance, risk, audits, SCAR, PPAP, incoming issues, and development plans.", href: "/smart-supplier", icon: <Users size={21}/>, action: "Open Supplier" },
    { title: "Smart Delivery", description: "Shipment readiness, packaging, documentation, customer release, carrier performance, POD, and exceptions.", href: "/smart-delivery", icon: <Truck size={21}/>, action: "Open Delivery" },
  ];

  const platformCards: CardProps[] = [
    { title: "Executive Command Center", description: "Leadership priorities, business exposure, closed-loop readiness, AI briefing, and synchronized execution.", href: "/", icon: <Activity size={21}/>, action: "Open command center" },
    { title: "AI Workforce Operations", description: "Operate the Intelligence Bus, review recommendations, approve decisions, route actions, and govern writeback.", href: "/workforce-operations", icon: <Network size={21}/>, action: "Open AI Workforce" },
    { title: "Accountability", description: "Track owners, due dates, status, escalation, evidence, and verified closure across the operating platform.", href: "/dashboard", icon: <ShieldCheck size={21}/>, action: "Open accountability" },
    { title: "Golden Path Validation", description: "Run the controlled customer-recovery demonstration and validate every closed-loop release gate.", href: "/golden-path", icon: <FlaskConical size={21}/>, action: "Open Golden Path" },
  ];

  return (
    <>
      <button type="button" className="northstar-launcher" onClick={() => setOpen(true)} aria-label="Open Northstar Navigator">
        <LayoutGrid size={17}/> Northstar Navigator
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Northstar Navigator" className="navigator-overlay">
          <div className="navigator-shell">
            <header className="navigator-header">
              <BrainCircuit size={23}/>
              <div><small>QMSPILOT NORTHSTAR</small><strong>Navigator</strong></div>
              <button type="button" onClick={closeToolbox} aria-label="Close Northstar Navigator"><X size={18}/></button>
            </header>

            <div className="navigator-body">
              <section className="navigator-intro">
                <div><small>ONE PLATFORM · THREE CLEAR LAYERS</small><h2>Find the view you need without sorting through unrelated tools.</h2><p>Leadership uses Executive Intelligence. Teams perform work inside Smart Workspaces. Specialized applications remain organized inside the workspace where the work belongs.</p></div>
                <a href="/executive-intelligence">Open Executive Intelligence <ExternalLink size={15}/></a>
              </section>

              <nav className="navigator-tabs" aria-label="Navigator sections">
                {(["overview", "intelligence", "workspaces", "platform"] as Section[]).map((item) => (
                  <button className={section === item ? "active" : ""} onClick={() => setSection(item)} key={item}>
                    {item === "overview" ? "Overview" : item === "intelligence" ? "Executive Intelligence" : item === "workspaces" ? "Smart Workspaces" : "Platform & Validation"}
                  </button>
                ))}
              </nav>

              {section === "overview" && <>
                <div className="layer-grid">
                  <button onClick={() => setSection("intelligence")}><span>01</span><div><strong>Executive Intelligence</strong><p>Readiness, reliability, process, delivery, value, and cross-platform context.</p></div></button>
                  <button onClick={() => setSection("workspaces")}><span>02</span><div><strong>Smart Workspaces</strong><p>Seven consistent operating environments where teams complete controlled work.</p></div></button>
                  <button onClick={() => setSection("platform")}><span>03</span><div><strong>Platform & Validation</strong><p>AI Workforce, accountability, command, Entity Graph, and Golden Path governance.</p></div></button>
                </div>
                <section className="readiness-preview">
                  <div><small>WORKFORCE READINESS</small><h3>The capability you liked is preserved and promoted.</h3><p>The complete skills matrix, qualification history, critical-coverage analysis, cross-training recommendations, evidence, expiration tracking, roster management, and Submit to Northstar function remain available.</p></div>
                  <div className="preview-score"><strong>87%</strong><span>illustrative readiness</span><a href="/tools/workforce-readiness">Open full readiness system <ExternalLink size={14}/></a></div>
                </section>
              </>}

              {section === "intelligence" && <section><div className="section-title"><div><small>LEADERSHIP VIEWS</small><h2>Executive Intelligence</h2></div><span>Cross-workspace visibility</span></div><div className="card-grid">{executiveCards.map(card)}</div></section>}
              {section === "workspaces" && <section><div className="section-title"><div><small>WHERE WORK GETS DONE</small><h2>Smart Workspaces</h2></div><a href="/toolbox">View workspace directory <ExternalLink size={14}/></a></div><div className="card-grid">{workspaceCards.map(card)}</div></section>}
              {section === "platform" && <section><div className="section-title"><div><small>CONNECTED GOVERNANCE</small><h2>Platform & Validation</h2></div><span>Human authority preserved</span></div><div className="card-grid">{platformCards.map(card)}</div></section>}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .northstar-launcher{position:fixed;top:70px;right:20px;z-index:180;display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:0 16px;border:1px solid #8fbbe9;border-radius:999px;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8);box-shadow:0 14px 36px rgba(17,74,137,.28);font-size:12px;font-weight:850;cursor:pointer}.navigator-overlay{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:18px;background:rgba(4,17,31,.84);backdrop-filter:blur(10px)}.navigator-shell{width:min(1240px,100%);max-height:92vh;overflow:auto;border:1px solid #365b7b;border-radius:22px;background:#f4f8fc;box-shadow:0 35px 100px rgba(0,0,0,.5);font-family:Inter,Arial,sans-serif}.navigator-header{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:15px 18px;color:#fff;background:linear-gradient(135deg,#071a31,#123f73)}.navigator-header>div{margin-right:auto}.navigator-header small,.navigator-header strong{display:block}.navigator-header small{color:#9ec8ee;font-size:9px;font-weight:900;letter-spacing:.14em}.navigator-header strong{font-size:18px}.navigator-header>button{width:38px;height:38px;display:grid;place-items:center;border:1px solid #426587;border-radius:10px;color:#fff;background:#102d4d;cursor:pointer}.navigator-body{padding:22px}.navigator-intro{display:flex;align-items:center;gap:20px;padding:22px;border-radius:18px;color:#fff;background:linear-gradient(135deg,#071a31,#0d477f)}.navigator-intro>div{margin-right:auto}.navigator-intro small,.section-title small,.readiness-preview small{color:#8bc8ff;font-size:9px;font-weight:900;letter-spacing:.13em}.navigator-intro h2{margin:7px 0;font-size:clamp(23px,3vw,36px)}.navigator-intro p{max-width:850px;margin:0;color:#d8e8f5;font-size:12px;line-height:1.65}.navigator-intro>a,.section-title>a{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;min-height:40px;padding:0 13px;border-radius:10px;color:#0e3153;background:#fff;text-decoration:none;font-size:11px;font-weight:900}.navigator-tabs{display:flex;gap:8px;overflow:auto;margin:16px 0;padding:5px;border:1px solid #d4e1eb;border-radius:13px;background:#fff}.navigator-tabs button{min-height:38px;padding:0 13px;border:0;border-radius:9px;color:#547087;background:transparent;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}.navigator-tabs button.active{color:#fff;background:#135eaa}.layer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.layer-grid>button{display:flex;gap:14px;padding:18px;border:1px solid #d6e3ed;border-radius:17px;text-align:left;background:#fff;cursor:pointer;box-shadow:0 9px 25px rgba(31,69,100,.06)}.layer-grid>button>span{width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;color:#0a66ff;background:#e8f3ff;font-weight:950}.layer-grid strong{color:#10263a}.layer-grid p{margin:6px 0 0;color:#61798d;font-size:11px;line-height:1.5}.readiness-preview{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;margin-top:14px;padding:21px;border:1px solid #9dc9ed;border-radius:18px;background:linear-gradient(135deg,#edf7ff,#fff)}.readiness-preview h3{margin:6px 0 7px;color:#10263a;font-size:22px}.readiness-preview p{max-width:800px;margin:0;color:#577087;font-size:12px;line-height:1.6}.preview-score{min-width:220px;text-align:center}.preview-score strong,.preview-score span{display:block}.preview-score strong{color:#0a66ff;font-size:48px;line-height:1}.preview-score span{margin:6px 0 12px;color:#6a8194;font-size:9px;font-weight:900;text-transform:uppercase}.preview-score a{display:inline-flex;align-items:center;gap:6px;color:#0d5da9;font-size:10px;font-weight:900;text-decoration:none}.section-title{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:4px 0 13px}.section-title h2{margin:5px 0 0;color:#10263a}.section-title>span{color:#698094;font-size:10px;font-weight:850}.section-title>a{color:#fff;background:#135eaa}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.nav-card{min-height:265px;display:flex;flex-direction:column;padding:18px;border:1px solid #d2e0eb;border-radius:17px;background:#fff;box-shadow:0 10px 25px rgba(31,69,100,.06)}.nav-card.featured{border:2px solid #1681db;background:linear-gradient(160deg,#edf7ff,#fff)}.card-top{display:flex;align-items:center;justify-content:space-between}.badge{padding:5px 8px;border-radius:999px;color:#28614c;background:#edf9f3;font-size:8px;font-weight:900}.card-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#1f67c8;background:#e8f3ff}.nav-card h3{margin:14px 0 7px;color:#0e1b31;font-size:18px}.nav-card p{margin:0;color:#53677d;font-size:11px;line-height:1.58}.nav-card>a{min-height:40px;display:flex;align-items:center;justify-content:center;gap:7px;margin-top:auto;padding:0 12px;border-radius:10px;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8);font-size:10px;font-weight:900;text-decoration:none}@media(max-width:800px){.northstar-launcher{top:auto;bottom:18px;right:14px}.navigator-overlay{padding:8px}.navigator-body{padding:13px}.navigator-intro{align-items:flex-start;flex-direction:column}.layer-grid{grid-template-columns:1fr}.readiness-preview{grid-template-columns:1fr}.preview-score{text-align:left}.card-grid{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
