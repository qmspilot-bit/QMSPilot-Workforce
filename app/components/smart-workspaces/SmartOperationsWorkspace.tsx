"use client";

import { ArrowLeft, ArrowRight, BarChart3, ClipboardCheck, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";
import { smartOperationsConfig } from "@/lib/smart-operations-specialized";
import type { WorkflowTool } from "@/lib/smart-workflow-config";
import { OperationsGuidedWorkflow } from "./OperationsGuidedWorkflow";
import { iconMap } from "./shared";
import { smartWorkspaceStyles } from "./styles";

export default function SmartOperationsWorkspace() {
  const config = smartOperationsConfig;
  const [selected, setSelected] = useState<WorkflowTool | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
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
          <a className="active" href="/smart-operations">Smart Operations</a>
        </nav>
        <div className="smart-status">
          <small>SMART OPERATIONS STATUS</small>
          <span>● 12 specialized workflows online</span>
          <span>● Live operational calculations enabled</span>
          <span>● Rich evidence capture enabled</span>
          <span>● Human approval gates enforced</span>
        </div>
      </aside>

      <section className="smart-main">
        <header className="smart-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>Smart Operations</strong></div>
          <a href="/toolbox"><ArrowLeft size={15} /> Workspaces</a>
          <span>Purpose-built operations engine</span>
        </header>

        <div className="smart-content">
          {selected ? (
            <OperationsGuidedWorkflow key={selected.id} config={config} tool={selected} onBack={() => setSelected(null)} />
          ) : (
            <>
              <section className="smart-hero">
                <div>
                  <small>{config.tag}</small>
                  <h1>{config.description}</h1>
                  <p>Each workflow now mirrors the real activity performed by operators, supervisors, planners, engineers, support teams, and plant leaders. Fields, calculations, escalation rules, closure controls, and evidence expectations are specific to the job—not inherited from a generic form.</p>
                  <div className="smart-hero-actions">
                    <button onClick={() => setSelected(startTool)}>Start {startTool.name} <ArrowRight size={16} /></button>
                    <button className="outline" onClick={() => document.getElementById("smart-tools")?.scrollIntoView({ behavior: "smooth" })}>Browse specialized workflows <ClipboardCheck size={16} /></button>
                  </div>
                </div>
                <div className="smart-health">
                  <small>SMART OPERATIONS HEALTH</small>
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
                  <div className="smart-insights">
                    {config.insights.map(([agent, text, level]) => <div key={text}><span>{agent}</span><p>{text}</p><em className={level.toLowerCase()}>{level}</em></div>)}
                  </div>
                </article>
                <article className="smart-panel">
                  <div className="smart-heading"><div><small>EXECUTION FLOW</small><h2>Current controlled queues</h2></div><BarChart3 /></div>
                  <div className="smart-queues">
                    {config.queues.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><em>{note}</em></div>)}
                  </div>
                </article>
              </section>

              <section className="operations-standard">
                <div><Workflow size={25} /><span><small>FORTUNE 500 OPERATING STANDARD</small><strong>Every workflow now performs the activity—not merely documents it.</strong></span></div>
                <div className="operations-standard-grid">
                  <span><b>Production</b> calculates attainment, FPY, rate, and variance.</span>
                  <span><b>Downtime</b> times the event and estimates lost output and cost.</span>
                  <span><b>Andon</b> tracks acknowledgement and response SLA.</span>
                  <span><b>Capacity</b> compares demand, demonstrated output, and cycle time.</span>
                  <span><b>Workforce</b> exposes headcount and critical-skill coverage.</span>
                  <span><b>Changeover</b> times setup and protects first-piece release.</span>
                </div>
              </section>

              <section className="workflow-standard">
                <div><ShieldCheck size={24} /><span><small>CONTROLLED WORKFLOW STANDARD</small><strong>Guided by procedure. Proven by evidence. Closed by authority.</strong></span></div>
                <p>The baseline reflects disciplined manufacturing operations and ISO-aligned control. Company schedules, reason codes, response times, KPIs, approval roles, procedures, and escalation thresholds remain configurable for each customer and site.</p>
              </section>

              <section id="smart-tools" className="smart-tool-section">
                <div className="smart-section-head"><div><small>SMART OPERATIONS WORKFLOWS</small><h2>Purpose-built manufacturing applications</h2></div><span>{filtered.length} workflows available</span></div>
                <div className="smart-filters">
                  <label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search operations workflows, procedures, calculations, or tasks" /></label>
                  <select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(item => <option key={item}>{item}</option>)}</select>
                </div>
                <div className="smart-tool-grid">
                  {filtered.map(tool => {
                    const Icon = iconMap[tool.icon] ?? ClipboardCheck;
                    return (
                      <button className="smart-tool" onClick={() => setSelected(tool)} key={tool.id}>
                        <div><span><Icon size={22} /></span><em>{tool.group}</em></div>
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                        <div className="tool-control-row"><small>{tool.procedure.id}</small><small>{tool.fields.filter(field => field.required).length} required inputs</small><small>{tool.evidenceRequired ? "Evidence required" : "Evidence available"}</small><small>Specialized function</small></div>
                        <b>Open purpose-built workflow <ArrowRight size={15} /></b>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </section>

      <style>{smartWorkspaceStyles}</style>
      <style>{`
        .operations-standard{margin-top:18px;padding:19px;border:1px solid #83b9e4;border-radius:18px;background:linear-gradient(135deg,#e9f5ff,#fff);box-shadow:0 11px 28px rgba(24,83,131,.08)}
        .operations-standard>div:first-child{display:flex;align-items:center;gap:11px}.operations-standard>div:first-child>svg{color:#0a66ff}.operations-standard small,.operations-standard strong{display:block}.operations-standard small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.operations-standard strong{margin-top:4px;color:#10263a}
        .operations-standard-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.operations-standard-grid span{padding:11px;border:1px solid #d3e3ef;border-radius:11px;color:#587185;background:#fff;font-size:9px;line-height:1.45}.operations-standard-grid b{color:#174f7c}
        .smart-tool .tool-control-row{gap:5px}.smart-tool .tool-control-row small:last-child{color:#176747;background:#e4f8ef}
        @media(max-width:900px){.operations-standard-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.operations-standard-grid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
