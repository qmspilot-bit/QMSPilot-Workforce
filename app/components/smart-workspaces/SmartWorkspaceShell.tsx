"use client";

import { ArrowLeft, ArrowRight, BarChart3, ClipboardCheck, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";
import { smartEnterpriseConfigs } from "@/lib/smart-enterprise-configs";
import type { WorkflowTool } from "@/lib/smart-workflow-config";
import { GuidedWorkflow } from "./GuidedWorkflow";
import { iconMap } from "./shared";
import { smartWorkspaceStyles } from "./styles";

export default function SmartDisciplineWorkspace({ discipline }: { discipline: string }) {
  const config = smartEnterpriseConfigs[discipline];
  const [selected, setSelected] = useState<WorkflowTool | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  if (!config) return <main style={{ padding: 40, fontFamily: "Arial" }}>Workspace configuration not found.</main>;

  const groups = ["All", ...Array.from(new Set(config.tools.map(tool => tool.group)))];
  const filtered = config.tools.filter(tool =>
    (group === "All" || tool.group === group)
    && `${tool.name} ${tool.description} ${tool.procedure.title}`.toLowerCase().includes(query.toLowerCase()),
  );
  const startTool = config.tools.find(tool => tool.id === config.startToolId) ?? config.tools[0];

  return (
    <main className="smart-shell">
      <aside className="smart-sidebar">
        <div className="smart-logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="smart-northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <nav>
          <a href="/">Command Center</a>
          <a href="/executive-intelligence">Executive Intelligence</a>
          <a href="/workforce-operations">AI Workforce Operations</a>
          <a href="/entity-graph">Entity Graph</a>
          <a href="/dashboard">Accountability</a>
          <a href="/toolbox">Workspaces</a>
          <a className="active" href={`/${config.slug}`}>{config.name}</a>
        </nav>
        <div className="smart-status">
          <small>{config.name.toUpperCase()} STATUS</small>
          <span>● {config.tools.length} purpose-built workflows online</span>
          <span>● Specialized calculations enabled</span>
          <span>● Rich evidence capture enabled</span>
          <span>● Human approval gates enforced</span>
        </div>
      </aside>

      <section className="smart-main">
        <header className="smart-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>{config.name}</strong></div>
          <a href="/toolbox"><ArrowLeft size={15} /> Workspaces</a>
          <span>Purpose-built discipline engine</span>
        </header>

        <div className="smart-content">
          {selected ? (
            <GuidedWorkflow key={selected.id} config={config} tool={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <section className="smart-hero">
                <div>
                  <small>{config.tag}</small>
                  <h1>{config.description}</h1>
                  <p>Every application now mirrors the actual work performed by qualified employees, supervisors, technical specialists, managers, and release authorities. Fields, controlled selections, calculations, escalation logic, evidence expectations, approvals, and closure gates are specific to the activity—not inherited from a generic form.</p>
                  <div className="smart-hero-actions">
                    <button onClick={() => setSelected(startTool)}>Start {startTool.name} <ArrowRight size={16} /></button>
                    <button className="outline" onClick={() => document.getElementById("smart-tools")?.scrollIntoView({ behavior: "smooth" })}>Browse purpose-built workflows <ClipboardCheck size={16} /></button>
                  </div>
                </div>
                <div className="smart-health">
                  <small>{config.name.toUpperCase()} HEALTH</small>
                  <div className="smart-ring"><div><strong>{config.health}</strong><span>out of 100</span></div></div>
                  <b>{config.healthText}</b>
                  <em>{config.attention}</em>
                </div>
              </section>

              <section className="smart-metrics">
                {config.metrics.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
              </section>

              <section className="smart-two">
                <article className="smart-panel">
                  <div className="smart-heading"><div><small>AI OPERATIONAL INSIGHTS</small><h2>What leadership needs to know now</h2></div><Sparkles /></div>
                  <div className="smart-insights">{config.insights.map(([agent, text, level]) => <div key={text}><span>{agent}</span><p>{text}</p><em className={level.toLowerCase()}>{level}</em></div>)}</div>
                </article>
                <article className="smart-panel">
                  <div className="smart-heading"><div><small>EXECUTION FLOW</small><h2>Current controlled queues</h2></div><BarChart3 /></div>
                  <div className="smart-queues">{config.queues.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><em>{note}</em></div>)}</div>
                </article>
              </section>

              <section className="discipline-standard">
                <div><Workflow size={25} /><span><small>FORTUNE 500 DISCIPLINE STANDARD</small><strong>The workflow performs the operational job—not merely documents it.</strong></span></div>
                <div className="discipline-standard-grid">
                  <span><b>Controlled inputs</b> guide the user through the correct sequence.</span>
                  <span><b>Conditional logic</b> reveals only the questions the condition requires.</span>
                  <span><b>Live signals</b> calculate risk, variance, aging, readiness, cost, or compliance.</span>
                  <span><b>Objective evidence</b> proves condition, action, verification, and approval.</span>
                  <span><b>Escalation rules</b> route conditions that cannot wait.</span>
                  <span><b>Human authority</b> controls acceptance, release, safety, and closure.</span>
                </div>
              </section>

              <section className="workflow-standard">
                <div><ShieldCheck size={24} /><span><small>CONTROLLED WORKFLOW STANDARD</small><strong>Guided by procedure. Proven by evidence. Closed by authority.</strong></span></div>
                <p>The enterprise baseline reflects disciplined manufacturing practice and applicable ISO-aligned controls. Company terminology, procedures, dropdowns, calculations, authorities, thresholds, integrations, numbering, and retention remain configurable by customer and site.</p>
              </section>

              <section id="smart-tools" className="smart-tool-section">
                <div className="smart-section-head"><div><small>{config.name.toUpperCase()} WORKFLOWS</small><h2>Purpose-built manufacturing applications</h2></div><span>{filtered.length} workflows available</span></div>
                <div className="smart-filters">
                  <label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${config.name.toLowerCase()} workflows, procedures, calculations, or tasks`} /></label>
                  <select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(item => <option key={item}>{item}</option>)}</select>
                </div>
                <div className="smart-tool-grid">
                  {filtered.map(tool => {
                    const Icon = iconMap[tool.icon] ?? ClipboardCheck;
                    return <button className="smart-tool" onClick={() => setSelected(tool)} key={tool.id}>
                      <div><span><Icon size={22} /></span><em>{tool.group}</em></div>
                      <h3>{tool.name}</h3>
                      <p>{tool.description}</p>
                      <div className="tool-control-row"><small>{tool.procedure.id}</small><small>{tool.fields.filter(field => field.required).length} required inputs</small><small>{tool.evidenceRequired ? "Evidence required" : "Evidence available"}</small><small>Specialized function</small></div>
                      <b>Open purpose-built workflow <ArrowRight size={15} /></b>
                    </button>;
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </section>

      <style>{smartWorkspaceStyles}</style>
      <style>{`
        .discipline-standard{margin-top:18px;padding:19px;border:1px solid #83b9e4;border-radius:18px;background:linear-gradient(135deg,#e9f5ff,#fff);box-shadow:0 11px 28px rgba(24,83,131,.08)}
        .discipline-standard>div:first-child{display:flex;align-items:center;gap:11px}.discipline-standard>div:first-child>svg{color:#0a66ff}.discipline-standard small,.discipline-standard strong{display:block}.discipline-standard small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.discipline-standard strong{margin-top:4px;color:#10263a}
        .discipline-standard-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.discipline-standard-grid span{padding:11px;border:1px solid #d3e3ef;border-radius:11px;color:#587185;background:#fff;font-size:9px;line-height:1.45}.discipline-standard-grid b{color:#174f7c}
        .smart-tool .tool-control-row{gap:5px}.smart-tool .tool-control-row small:last-child{color:#176747;background:#e4f8ef}
        @media(max-width:900px){.discipline-standard-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.discipline-standard-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
