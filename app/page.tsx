const metrics = [
  { label: "First-pass yield", value: "98.6%", note: "+0.8 points" },
  { label: "On-time delivery", value: "94.2%", note: "+2.1 points" },
  { label: "Verified savings", value: "$238K", note: "Year to date" },
  { label: "Open high risk", value: "3", note: "Down 2 this week" },
  { label: "Action closure", value: "91%", note: "Closed on time" },
  { label: "ISO readiness", value: "96%", note: "March 2027 target" },
];

const health = [
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

const workforce = [
  { initials: "PI", name: "Pilot", title: "Chief of Staff", score: 96, status: "Live", kpi: "Executive decisions prepared", value: "12", impact: "$84.7K protected" },
  { initials: "AT", name: "Atlas", title: "Quality Intelligence", score: 93, status: "Live", kpi: "Quality risks resolved", value: "28", impact: "4 escapes prevented" },
  { initials: "FO", name: "Forge", title: "Operations Intelligence", score: 89, status: "Live", kpi: "Throughput opportunities", value: "7", impact: "+6.4% capacity" },
  { initials: "SE", name: "Sentinel", title: "Compliance Intelligence", score: 97, status: "Live", kpi: "Audit readiness", value: "96%", impact: "3 controls watched" },
  { initials: "VE", name: "Vector", title: "Continuous Improvement", score: 91, status: "Live", kpi: "Verified savings YTD", value: "$238K", impact: "14 projects active" },
  { initials: "BE", name: "Beacon", title: "Customer Intelligence", score: 88, status: "Ready", kpi: "Customer health", value: "92%", impact: "2 accounts watched" },
  { initials: "LE", name: "Ledger", title: "Financial Intelligence", score: 94, status: "Ready", kpi: "Value realization", value: "4.7x", impact: "ROI on QMS activity" },
  { initials: "NE", name: "Nexus", title: "Growth Intelligence", score: 86, status: "Ready", kpi: "Growth opportunities", value: "9", impact: "$1.2M pipeline" },
];

function scoreClass(score: number) {
  if (score >= 93) return "excellent";
  if (score >= 87) return "strong";
  return "watch";
}

export default function NorthstarCommandCenter() {
  return (
    <div className="ns-shell">
      <aside className="ns-sidebar">
        <div className="ns-brand">QMSPilot</div>
        <div className="pilot-card"><span className="pilot-mark">PI</span><span><strong>Pilot</strong><small>Online · supervised</small></span></div>
        <nav>
          <a className="active" href="/">Command center</a>
          <a href="/dashboard">Accountability</a>
          <a href="/toolbox">Digital toolbox</a>
          <a href="#ai-workforce">AI workforce</a>
          <a href="#performance">Performance</a>
        </nav>
        <div className="system-status">
          <small>SYSTEM STATUS</small>
          <span>● Northstar online</span>
          <span>● Human approval active</span>
          <span>● Evidence traceability on</span>
        </div>
      </aside>

      <main className="ns-main">
        <header className="ns-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>Executive Command Center</strong></div>
          <div className="periods"><button>Today</button><button>Week</button><button className="selected">Month</button><button>Quarter</button><button>Year</button></div>
        </header>

        <div className="ns-content">
          <section className="hero-grid">
            <article className="executive-briefing">
              <div className="eyebrow">PILOT EXECUTIVE BRIEFING</div>
              <h1>Good evening, Donald. Your company is operating with strength.</h1>
              <p>Company health improved two points. Quality and compliance are under control. Leadership attention should move to two overdue commitments and one production constraint with measurable financial exposure.</p>
              <div className="hero-actions"><a href="/dashboard">Review decisions →</a><a className="outline" href="/toolbox">Open digital toolbox</a></div>
            </article>
            <article className="card health-card">
              <small className="section-label">COMPANY HEALTH</small>
              <div className="health-ring"><div><strong>92</strong><small>out of 100</small></div></div>
              <strong className="positive">Strong · improving</strong>
              <small className="muted">Executive confidence: 94%</small>
            </article>
          </section>

          <section id="performance" className="metric-grid">
            {metrics.map((metric) => <article className="card metric" key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.note}</span></article>)}
          </section>

          <section className="two-grid">
            <article className="card panel">
              <div className="panel-heading"><div><small className="section-label">ENTERPRISE HEALTH MODEL</small><h2>What is driving the score</h2></div><span className="panel-mark">92</span></div>
              <div className="health-list">
                {health.map((item) => <div key={item.label}><div className="health-row"><span><strong>{item.label}</strong><small>{item.note}</small></span><strong className={scoreClass(item.score)}>{item.score}</strong></div><div className="track"><div style={{ width: `${item.score}%` }} /></div></div>)}
              </div>
            </article>

            <article className="card panel">
              <div className="panel-heading"><div><small className="section-label">LEADERSHIP PRIORITIES</small><h2>Decisions that move the business</h2></div><span className="panel-mark alert">4</span></div>
              <div className="priority-list">
                {priorities.map((item) => <div className="priority-row" key={item.title}><span className={`priority ${item.level.toLowerCase()}`}>{item.level}</span><span><strong>{item.title}</strong><small>{item.owner} · {item.due}</small></span><strong className="priority-value">{item.value}</strong></div>)}
              </div>
            </article>
          </section>

          <section id="ai-workforce" className="workforce-section">
            <div className="workforce-heading"><div><small className="section-label">AI WORKFORCE</small><h2>Every digital employee earns its seat.</h2></div><span>KPIs tied to operating outcomes—not activity theater.</span></div>
            <div className="workforce-grid">
              {workforce.map((member) => <article className="card employee" key={member.name}><div className="employee-heading"><span className="employee-mark">{member.initials}</span><span><strong>{member.name}</strong><small>{member.title}</small></span><em className={member.status === "Live" ? "live" : "ready"}>{member.status}</em></div><div className="employee-kpi"><span><small>{member.kpi}</small><strong>{member.value}</strong></span><span><small>Performance</small><strong className={scoreClass(member.score)}>{member.score}</strong></span></div><div className="employee-impact">{member.impact}</div></article>)}
            </div>
          </section>

          <section className="two-grid execution-grid">
            <article className="card panel"><small className="section-label">EXECUTION VELOCITY</small><h2>Northstar is converting risk into results.</h2><div className="execution-metrics"><div><small>Actions completed</small><strong>142</strong></div><div><small>Average closure</small><strong>9.4 days</strong></div><div><small>Risks prevented</small><strong>18</strong></div><div><small>ROI multiple</small><strong>4.7x</strong></div></div></article>
            <article className="recommendation"><small>PILOT RECOMMENDATION</small><h2>Protect the customer, then unlock capacity.</h2><p>Approve the supplier containment package today. Assign Forge to the Line 3 constraint immediately afterward. Combined expected value: $126,000 in protected revenue and recoverable capacity.</p><a href="/dashboard">Open decision queue →</a></article>
          </section>

          <p className="disclaimer">Northstar Command Center v1 combines connected quality records with configurable demonstration operating data until ERP, finance, customer, workforce, and production connectors are activated. All external actions remain behind a human approval gate.</p>
        </div>
      </main>

      <style>{`
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#edf3f8}.ns-shell{min-height:100vh;background:#edf3f8;color:#12253a;font-family:Inter,Arial,sans-serif}.ns-sidebar{position:fixed;inset:0 auto 0 0;width:252px;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744);overflow:auto}.ns-brand{padding:15px 16px;border-radius:16px;color:#0c3154;background:#fff;font-size:22px;font-weight:900}.pilot-card{display:flex;align-items:center;gap:10px;margin:18px 0;padding:14px;border:1px solid #31516f;border-radius:15px;background:#102f4d}.pilot-mark,.employee-mark{display:grid;place-items:center;border-radius:12px;font-weight:900}.pilot-mark{width:40px;height:40px;background:#1d6fce}.pilot-card strong,.pilot-card small,.employee-heading strong,.employee-heading small{display:block}.pilot-card small{color:#91b4d2}.ns-sidebar nav{display:grid;gap:7px}.ns-sidebar nav a{padding:12px 13px;border-radius:11px;color:#b9d0e4;text-decoration:none;font-size:13px;font-weight:800}.ns-sidebar nav a.active{color:#fff;background:#0d4a7c}.system-status{display:grid;gap:12px;margin-top:24px;padding-top:18px;border-top:1px solid #24455f;color:#c7d9e8;font-size:11px}.system-status small{color:#78a4c8;letter-spacing:.13em;font-weight:900}.system-status span{color:#c7d9e8}.system-status span::first-letter{color:#37d39a}.ns-main{margin-left:252px}.ns-topbar{position:sticky;top:0;z-index:20;min-height:68px;display:flex;align-items:center;gap:14px;padding:0 24px;border-bottom:1px solid #d9e4ed;background:rgba(255,255,255,.95)}.ns-topbar>div:first-child{margin-right:auto}.ns-topbar small,.ns-topbar strong{display:block}.ns-topbar small{color:#6a839a;font-weight:800;letter-spacing:.1em}.periods{display:flex;gap:6px;flex-wrap:wrap}.periods button{min-height:34px;padding:0 11px;border:1px solid #d7e1ea;border-radius:9px;color:#526b82;background:#fff;font-size:11px;font-weight:800}.periods button.selected{border-color:#1769d2;color:#fff;background:#1769d2}.ns-content{max-width:1560px;margin:0 auto;padding:26px 24px 70px}.hero-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.executive-briefing{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#1769d2);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.executive-briefing h1{max-width:850px;margin:13px 0 12px;font-size:clamp(32px,4vw,58px);line-height:1.02}.executive-briefing p{max-width:900px;margin:0;color:#d4e7f7;font-size:15px;line-height:1.65}.hero-actions{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}.hero-actions a{padding:12px 16px;border-radius:11px;color:#08213a;background:#fff;text-decoration:none;font-weight:900}.hero-actions a.outline{border:1px solid #6facdf;color:#fff;background:transparent}.card{border:1px solid #dce6ef;border-radius:20px;background:#fff;box-shadow:0 12px 34px rgba(24,55,83,.08)}.health-card{padding:24px;display:grid;align-content:center;text-align:center}.section-label{color:#71869a;letter-spacing:.11em;font-weight:900}.health-ring{width:172px;height:172px;margin:17px auto;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#1769d2 331deg,#e5edf4 0)}.health-ring>div{width:132px;height:132px;display:grid;place-items:center;border-radius:50%;background:#fff}.health-ring strong,.health-ring small{display:block}.health-ring strong{font-size:48px;line-height:1}.health-ring small,.muted{color:#71869a;font-weight:800}.positive{color:#16835a}.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:13px;margin-top:18px}.metric{padding:18px}.metric small,.metric strong,.metric span{display:block}.metric small{color:#70859a;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.metric strong{margin-top:8px;font-size:27px}.metric span{margin-top:4px;color:#16835a;font-size:11px;font-weight:800}.two-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.panel{padding:22px}.panel h2{margin:5px 0 0}.panel-heading{display:flex;justify-content:space-between;gap:12px}.panel-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#1769d2;background:#eaf4ff;font-weight:900}.panel-mark.alert{color:#a55b00;background:#fff4df}.health-list{display:grid;gap:14px;margin-top:20px}.health-row{display:flex;justify-content:space-between;gap:10px}.health-row span strong,.health-row span small{display:block}.health-row span small{margin-top:2px;color:#7a8ea1}.excellent{color:#16835a}.strong{color:#1769d2}.watch{color:#b36b00}.track{height:8px;margin-top:8px;overflow:hidden;border-radius:999px;background:#e8eef4}.track>div{height:100%;border-radius:999px;background:#1769d2}.priority-list{margin-top:14px}.priority-row{display:grid;grid-template-columns:86px 1fr auto;gap:12px;padding:14px 0;border-top:1px solid #e6edf3;align-items:center}.priority{padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;text-align:center}.priority.critical{color:#a52d39;background:#fff0f2}.priority.high,.priority.medium{color:#96600b;background:#fff7e8}.priority-row span strong,.priority-row span small{display:block}.priority-row span strong{font-size:13px}.priority-row span small{color:#74899d}.priority-value{color:#1769d2;font-size:11px}.workforce-section{margin-top:18px}.workforce-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}.workforce-heading h2{margin:5px 0 0;font-size:26px}.workforce-heading>span{color:#657d92;font-size:12px}.workforce-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.employee{padding:18px}.employee-heading{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:12px}.employee-mark{width:48px;height:48px;color:#1769d2;background:#eaf4ff}.employee-heading small{color:#71869a}.employee-heading em{font-size:10px;font-style:normal;font-weight:900;text-transform:uppercase}.employee-heading em.live{color:#16835a}.employee-heading em.ready{color:#1769d2}.employee-kpi{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:17px;padding-top:15px;border-top:1px solid #e6edf3}.employee-kpi span:last-child{text-align:right}.employee-kpi small,.employee-kpi strong{display:block}.employee-kpi small{color:#71869a}.employee-kpi strong{margin-top:4px;font-size:22px}.employee-impact{margin-top:12px;padding:9px 11px;border-radius:10px;color:#31536d;background:#f3f7fa;font-size:11px;font-weight:800}.execution-grid{grid-template-columns:1.2fr .8fr}.execution-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.execution-metrics>div{padding:14px;border-radius:13px;background:#f4f8fb}.execution-metrics small,.execution-metrics strong{display:block}.execution-metrics small{color:#71869a}.execution-metrics strong{margin-top:5px;font-size:20px}.recommendation{padding:22px;border-radius:20px;color:#fff;background:linear-gradient(145deg,#0c3153,#1769d2);box-shadow:0 12px 34px rgba(24,55,83,.16)}.recommendation small{color:#a9d7ff;font-weight:900}.recommendation h2{margin:13px 0 9px}.recommendation p{margin:0;color:#d7e9f8;line-height:1.6;font-size:13px}.recommendation a{display:inline-block;margin-top:17px;color:#fff;font-weight:900;text-decoration:none}.disclaimer{margin:18px 2px 0;color:#71869a;font-size:10px;line-height:1.5}@media(max-width:1000px){.ns-sidebar{position:static;width:auto}.ns-main{margin-left:0}.hero-grid,.two-grid{grid-template-columns:1fr}.execution-metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.ns-topbar{align-items:flex-start;padding:12px 14px}.ns-content{padding:18px 14px 50px}.periods{max-width:220px}.executive-briefing{padding:24px}.priority-row{grid-template-columns:70px 1fr}.priority-value{grid-column:2}.workforce-heading{display:block}.workforce-heading>span{display:block;margin-top:8px}.execution-metrics{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
