import { ArrowRight, BarChart3, BrainCircuit, BriefcaseBusiness, CheckCircle2, Database, ListChecks, ShieldCheck } from "lucide-react";
import { LiveCommandMetrics } from "@/components/live-command-metrics";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const priorities = [
  ["Critical", "Approve the integrated customer-recovery command plan", "Pilot", "$180K revenue exposure"],
  ["Critical", "Complete bore-gage product-impact review", "Sentinel + Forge", "$62K financial exposure"],
  ["High", "Protect qualified final-inspection coverage", "Atlas", "Replacement delivery"],
  ["High", "Authorize alternate supplier recovery path", "Pilot + Ledger", "$126K order exposure"],
];

const primary = [
  { title: "Work", note: "Open the workspace where the job gets done.", href: "/toolbox", icon: BriefcaseBusiness, action: "Start or continue work" },
  { title: "My Actions", note: "See what you own, what is due, and what needs closure.", href: "/my-actions", icon: ListChecks, action: "Review my commitments" },
  { title: "Leadership", note: "See risk, readiness, performance, and business priorities.", href: "/executive-intelligence", icon: BarChart3, action: "Open leadership view" },
];

export default function Home() {
  return (
    <main className="home-shell">
      <aside className="home-sidebar">
        <div className="logo-card"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar-card"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="pilot-card"><span>PI</span><div><strong>Pilot</strong><small>Ready to help</small></div></div>
        <nav>
          <a className="active" href="/">Home</a>
          <a href="/toolbox">Work</a>
          <a href="/my-actions">My Actions</a>
          <a href="/executive-intelligence">Leadership</a>
        </nav>
        <div className="system-status">
          <small>NORTHSTAR STATUS</small>
          <span>● Secure workspace online</span>
          <span>● Cross-device persistence active</span>
          <span>● Human authority preserved</span>
        </div>
      </aside>

      <section className="home-main">
        <header className="command-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>Home</strong></div>
          <span className="connected">Connected · Secure</span>
        </header>

        <div className="home-content">
          <section className="welcome">
            <div>
              <small>WELCOME BACK</small>
              <h1>Start with what needs your attention.</h1>
              <p>Northstar keeps the complexity underneath. You focus on the work, the commitments you own, and the decisions that matter.</p>
            </div>
            <div className="pilot-guidance"><BrainCircuit size={24}/><div><small>PILOT</small><strong>Use My Actions first when you are not sure where to start.</strong><span>It brings ownership, due dates, evidence, and closure into one place.</span></div></div>
          </section>

          <section className="primary-grid">
            {primary.map(({ title, note, href, icon: Icon, action }) => (
              <a href={href} className="primary-card" key={title}>
                <span><Icon size={24}/></span>
                <div><h2>{title}</h2><p>{note}</p><b>{action} <ArrowRight size={15}/></b></div>
              </a>
            ))}
          </section>

          <LiveCommandMetrics />

          <section className="two-grid">
            <article className="panel">
              <div className="panel-heading"><div><small>NEEDS ATTENTION</small><h2>Leadership priorities</h2></div><ListChecks size={23}/></div>
              <div className="priority-list">
                {priorities.map(([level, title, owner, value]) => (
                  <article key={title}>
                    <span className={`severity ${level.toLowerCase()}`}>{level}</span>
                    <div><strong>{title}</strong><small>{owner}</small></div>
                    <b>{value}</b>
                  </article>
                ))}
              </div>
              <a className="panel-link" href="/my-actions">Open My Actions <ArrowRight size={15}/></a>
            </article>

            <article className="panel simple-flow">
              <div className="panel-heading"><div><small>HOW NORTHSTAR WORKS</small><h2>Keep the user journey simple.</h2></div><CheckCircle2 size={23}/></div>
              <div className="flow-step"><span>1</span><div><strong>Do the work</strong><p>Enter the workspace where the activity belongs.</p></div></div>
              <div className="flow-step"><span>2</span><div><strong>Own the action</strong><p>Track commitments, evidence, dates, and closure in My Actions.</p></div></div>
              <div className="flow-step"><span>3</span><div><strong>Lead from the signal</strong><p>Use Leadership for risk, performance, and business decisions.</p></div></div>
            </article>
          </section>

          <section className="advanced">
            <div><ShieldCheck size={20}/><span><small>ADVANCED NORTHSTAR VIEWS</small><strong>Available when you need deeper system context.</strong></span></div>
            <div><a href="/workforce-operations"><BrainCircuit size={15}/> AI Workforce</a><a href="/entity-graph"><Database size={15}/> Entity Graph</a><a href="/dashboard"><ListChecks size={15}/> Accountability</a></div>
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.home-shell{min-height:100vh;color:#12263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.home-sidebar{position:fixed;inset:0 auto 0 0;width:258px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.logo-card,.northstar-card{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar-card{margin-top:8px;background:#020914}.logo-card img,.northstar-card img{max-width:190px;max-height:48px}.pilot-card{display:flex;align-items:center;gap:10px;margin:17px 0;padding:12px;border:1px solid #31516f;border-radius:13px;background:#102f4d}.pilot-card>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#0a66ff;font-weight:900}.pilot-card strong,.pilot-card small{display:block}.pilot-card small{margin-top:3px;color:#9abbd6}.home-sidebar nav{display:grid;gap:6px}.home-sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.home-sidebar nav a.active{color:#fff;background:#0d4a7c}.system-status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.system-status small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.home-main{margin-left:258px}.command-topbar{min-height:68px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.command-topbar>div{margin-right:auto}.command-topbar small,.command-topbar strong{display:block}.command-topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.connected{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.home-content{max-width:1460px;margin:0 auto;padding:24px 24px 70px}.welcome{display:grid;grid-template-columns:1.35fr .65fr;gap:18px;align-items:stretch}.welcome>div:first-child{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.22)}.welcome small,.panel-heading small,.advanced small{font-size:9px;font-weight:900;letter-spacing:.12em}.welcome>div:first-child small{color:#9ed6ff}.welcome h1{max-width:850px;margin:12px 0 10px;font-size:clamp(32px,4vw,55px);line-height:1.02}.welcome p{max-width:850px;margin:0;color:#d6e8f6;line-height:1.65}.pilot-guidance{display:flex;gap:12px;align-items:flex-start;padding:23px;border:1px solid #d5e1ea;border-radius:20px;background:#fff;box-shadow:0 13px 35px rgba(24,53,77,.08)}.pilot-guidance>svg{flex:0 0 auto;color:#0a66ff}.pilot-guidance small,.pilot-guidance strong,.pilot-guidance span{display:block}.pilot-guidance small{color:#0a66ff}.pilot-guidance strong{margin-top:6px;font-size:17px;line-height:1.35}.pilot-guidance span{margin-top:7px;color:#647b8f;font-size:11px;line-height:1.55}.primary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}.primary-card{display:grid;grid-template-columns:50px 1fr;gap:13px;padding:18px;border:1px solid #d7e2eb;border-radius:18px;color:#173550;background:#fff;text-decoration:none;box-shadow:0 10px 28px rgba(24,53,77,.07);transition:.18s}.primary-card:hover{transform:translateY(-2px);border-color:#84b7df}.primary-card>span{width:50px;height:50px;display:grid;place-items:center;border-radius:13px;color:#0a66ff;background:#e9f4ff}.primary-card h2{margin:1px 0 7px}.primary-card p{margin:0;color:#647b8f;font-size:11px;line-height:1.5}.primary-card b{display:flex;align-items:center;gap:6px;margin-top:13px;color:#0a66ff;font-size:10px}.live-command-block{margin-top:16px}.two-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:17px;margin-top:17px}.panel{padding:20px;border:1px solid #dbe5ed;border-radius:18px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.panel-heading small{color:#0a66ff}.panel-heading h2{margin:5px 0 0}.panel-heading>svg{color:#0a66ff}.priority-list{display:grid;gap:9px;margin-top:15px}.priority-list article{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:11px;border:1px solid #dce5ed;border-radius:12px}.priority-list strong,.priority-list small{display:block}.priority-list small{margin-top:3px;color:#73899b;font-size:9px}.priority-list article>b{color:#295e84;font-size:11px}.severity{padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.severity.critical{color:#8f1f2c;background:#ffe7ea}.severity.high{color:#85520a;background:#fff0d5}.panel-link{display:flex;align-items:center;gap:6px;margin-top:14px;color:#0a66ff;text-decoration:none;font-size:10px;font-weight:900}.simple-flow{display:grid;gap:12px}.flow-step{display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:start;padding:12px;border:1px solid #e0e8ef;border-radius:12px;background:#f8fbfd}.flow-step>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#e8f2ff;font-weight:950}.flow-step strong{display:block}.flow-step p{margin:4px 0 0;color:#647b8f;font-size:10px;line-height:1.5}.advanced{display:flex;align-items:center;gap:12px;margin-top:17px;padding:14px 16px;border:1px solid #d8e4ed;border-radius:15px;background:#fff}.advanced>div:first-child{display:flex;align-items:center;gap:9px;margin-right:auto}.advanced>div:first-child>svg{color:#16835a}.advanced small,.advanced strong{display:block}.advanced small{color:#6c8194}.advanced strong{margin-top:3px;font-size:11px}.advanced>div:last-child{display:flex;gap:8px;flex-wrap:wrap}.advanced a{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #d7e3ec;border-radius:9px;color:#42637e;text-decoration:none;font-size:9px;font-weight:850}@media(max-width:980px){.welcome,.two-grid{grid-template-columns:1fr}.primary-grid{grid-template-columns:1fr}}@media(max-width:820px){.home-sidebar{position:static;width:auto;height:auto}.home-main{margin-left:0}.system-status{display:none}}@media(max-width:640px){.advanced{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  );
}
