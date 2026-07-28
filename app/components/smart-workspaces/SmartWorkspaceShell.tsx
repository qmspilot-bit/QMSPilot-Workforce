"use client";

import { ArrowLeft, ArrowRight, BarChart3, ClipboardCheck, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";
import { smartWorkspaceConfigs, type WorkflowTool } from "@/lib/smart-workflow-config";
import { GuidedWorkflow } from "./GuidedWorkflow";
import { iconMap } from "./shared";
import { smartWorkspaceStyles } from "./styles";

export default function SmartDisciplineWorkspace({ discipline }: { discipline: string }) {
  const config = smartWorkspaceConfigs[discipline];
  const [selected, setSelected] = useState<WorkflowTool | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  if (!config) {
    return <main style={{ padding: 40, fontFamily: "Arial" }}>Workspace configuration not found.</main>;
  }

  const groups = ["All", ...Array.from(new Set(config.tools.map((tool) => tool.group)))];
  const filtered = config.tools.filter((tool) =>
    (group === "All" || tool.group === group)
    && `${tool.name} ${tool.description} ${tool.procedure.title}`.toLowerCase().includes(query.toLowerCase()),
  );
  const startTool = config.tools.find((tool) => tool.id === config.startToolId) ?? config.tools[0];

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
          <span>● Guided workflows online</span>
          <span>● Evidence capture enabled</span>
          <span>● Approval gates enforced</span>
          <span>● Customer configuration ready</span>
        </div>
      </aside>

      <section className="smart-main">
        <header className="smart-topbar">
          <div><small>QMSPILOT NORTHSTAR</small><strong>{config.name}</strong></div>
          <a href="/toolbox"><ArrowLeft size={15} /> Workspaces</a>
          <span>Controlled workflow engine</span>
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
                  <p>Each application now guides the user through controlled selections, conditional questions, evidence requirements, procedure references, accountable ownership, approvals, and verified closure. Customer-specific terminology and rules can be configured during onboarding.</p>
                  <div className="smart-hero-actions">
                    <button onClick={() => setSelected(startTool)}>Start {startTool.name} <ArrowRight size={16} /></button>
                    <button className="outline" onClick={() => document.getElementById("smart-tools")?.scrollIntoView({ behavior: "smooth" })}>Browse guided workflows <ClipboardCheck size={16} /></button>
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

              <section className="workflow-standard">
                <div><ShieldCheck size={24} /><span><small>CONTROLLED WORKFLOW STANDARD</small><strong>Guided by procedure. Proven by evidence. Closed by authority.</strong></span></div>
                <p>The baseline is ISO-aligned and built for disciplined manufacturing execution. It is not a claim that every organization uses identical procedures; company-specific values, approval roles, risk thresholds, numbering, retention, and escalation logic remain configurable.</p>
              </section>

              <section id="smart-tools" className="smart-tool-section">
                <div className="smart-section-head"><div><small>{config.name.toUpperCase()} WORKFLOWS</small><h2>Guided operational applications</h2></div><span>{filtered.length} workflows available</span></div>
                <div className="smart-filters">
                  <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.name.toLowerCase()} workflows, procedures, or tasks`} /></label>
                  <select value={group} onChange={(event) => setGroup(event.target.value)}>{groups.map((item) => <option key={item}>{item}</option>)}</select>
                </div>
                <div className="smart-tool-grid">
                  {filtered.map((tool) => {
                    const Icon = iconMap[tool.icon] ?? ClipboardCheck;
                    return (
                      <button className="smart-tool" onClick={() => setSelected(tool)} key={tool.id}>
                        <div><span><Icon size={22} /></span><em>{tool.group}</em></div>
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                        <div className="tool-control-row"><small>{tool.procedure.id}</small><small>{tool.fields.filter((field) => field.required).length} required inputs</small><small>{tool.evidenceRequired ? "Evidence required" : "Evidence available"}</small></div>
                        <b>Open guided workflow <ArrowRight size={15} /></b>
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
    </main>
  );
}
