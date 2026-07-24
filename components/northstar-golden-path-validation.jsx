"use client";

import {
  AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, Cloud,
  Download, ExternalLink, FileCheck2, FileWarning, Flag, FlaskConical, Gauge,
  Network, Play, Printer, RefreshCw, RotateCcw, ShieldCheck, UserCheck, XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const demoSteps = [
  [1, "scenario-load", "Scenario Setup", "Load the controlled customer-recovery scenario", "/golden-path", "system"],
  [2, "intelligence-ingestion", "Detection", "Verify Intelligence Bus ingestion", "/workforce-operations", "system"],
  [3, "agent-routing", "Detection", "Verify digital workforce routing", "/workforce-operations", "system"],
  [4, "recommendation-review", "Human Decision", "Review the Pilot recovery recommendation", "/workforce-operations", "human"],
  [5, "controlled-actions", "Execution", "Create accountable recovery actions", "/workforce-operations", "human"],
  [6, "native-writeback", "Execution", "Execute native target-tool writeback", "/workforce-operations", "human"],
  [7, "target-tool-work", "Execution", "Perform work in the receiving Northstar tool", "/toolbox", "system"],
  [8, "evidence-verification", "Verification", "Attach evidence and verify effectiveness", "/workforce-operations", "human"],
  [9, "atlas-closure-sync", "Verification", "Verify Atlas and event closure synchronization", "/dashboard", "system"],
  [10, "command-center-metrics", "Leadership", "Validate Command Center metrics", "/", "reporting"],
  [11, "entity-graph", "Leadership", "Validate Entity Graph context", "/entity-graph", "system"],
  [12, "tenant-security", "Security", "Validate tenant isolation and role permissions", "/golden-path", "security"],
  [13, "customer-report", "Release", "Generate the customer-facing validation report", "/golden-path", "reporting"],
].map(([sequence_number, step_key, phase, title, linked_route, gate_type]) => ({
  id: `demo-${step_key}`,
  sequence_number,
  step_key,
  phase,
  title,
  linked_route,
  gate_type,
  step_status: "not_started",
  responsible_role: gate_type === "human" ? "Qualified Human Reviewer" : "Validation Team",
  objective: "Validate the deployed Golden Path behavior against the controlled scenario and record the actual result.",
  expected_result: "The step completes with source traceability, human authority, and no unexplained data movement.",
  evidence_required: "Record reference, screenshot, decision note, or audit entry.",
  actual_result: "",
  evidence_refs: [],
}));

const demoWorkspace = {
  session: {
    id: "demo-session",
    scenario_name: "Closed-Loop Customer Recovery",
    scenario_version: "1.0",
    design_partner_name: "North Ridge Cooling Systems",
    site: "East Texas Manufacturing Center",
    facilitator_name: "QMSPilot Facilitator",
    session_status: "planning",
    started_at: null,
    scenario_payload: {
      customer: "North Ridge Cooling Systems",
      orderNumber: "SO-10482",
      product: "PAC2K36HPVS",
      partNumber: "BRKT-4472",
      instrument: "BG-214",
      supplier: "Precision Alloy Supply",
      complaint: "Customer reports intermittent shaft interference during final installation.",
    },
  },
  steps: demoSteps,
  findings: [],
  signoffs: ["QMSPilot Product Owner", "Quality & Compliance Reviewer", "Design Partner Sponsor"].map((signoff_role, index) => ({ id: `demo-signoff-${index}`, signoff_role, signer_name: "", decision: "pending", note: "" })),
  telemetry: {
    events: 0, assignments: 0, agents: [], recommendations: 0, approvedRecommendations: 0,
    actions: 0, completedActions: 0, writebacks: 0, executedWritebacks: 0,
    toolActions: 0, evidence: 0, auditEntries: 0, passedSteps: 0, failedSteps: 0,
    blockedSteps: 0, openFindings: 0, criticalFindings: 0, approvedSignoffs: 0,
    releaseRecommendation: "NOT READY", signals: {},
  },
};

const statusOptions = ["not_started", "in_progress", "passed", "failed", "blocked", "not_applicable"];
const statusLabels = {
  not_started: "Not started", in_progress: "In progress", passed: "Passed",
  failed: "Failed", blocked: "Blocked", not_applicable: "N/A",
};

function statusIcon(status) {
  if (status === "passed") return <CheckCircle2 size={18} />;
  if (status === "failed") return <XCircle size={18} />;
  if (status === "blocked") return <AlertTriangle size={18} />;
  if (status === "in_progress") return <Play size={18} />;
  return <ClipboardCheck size={18} />;
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString();
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NorthstarGoldenPathValidation() {
  const cloud = useCloudWorkspace();
  const [workspace, setWorkspace] = useState(demoWorkspace);
  const [mode, setMode] = useState("demo");
  const [notice, setNotice] = useState("Preview mode loaded. Sign in to create a tenant-protected validation run.");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [setup, setSetup] = useState({ designPartnerName: "North Ridge Cooling Systems", site: "East Texas Manufacturing Center", facilitatorName: "" });
  const [stepDrafts, setStepDrafts] = useState({});
  const [findingDraft, setFindingDraft] = useState({ severity: "medium", category: "functional", title: "", description: "", affectedRoute: "", ownerName: "", stepId: "" });
  const [signoffDrafts, setSignoffDrafts] = useState({});

  const telemetry = workspace.telemetry || demoWorkspace.telemetry;
  const steps = workspace.steps || [];
  const findings = workspace.findings || [];
  const signoffs = workspace.signoffs || [];
  const session = workspace.session || demoWorkspace.session;

  const groupedSteps = useMemo(() => {
    const groups = {};
    for (const step of steps) {
      if (!groups[step.phase]) groups[step.phase] = [];
      groups[step.phase].push(step);
    }
    return groups;
  }, [steps]);

  const requiredSteps = steps.filter((step) => step.step_status !== "not_applicable").length;
  const completion = requiredSteps ? Math.round((telemetry.passedSteps / requiredSteps) * 100) : 0;
  const releaseTone = telemetry.releaseRecommendation === "GO" ? "go" : telemetry.releaseRecommendation === "GO WITH CONDITIONS" ? "conditions" : "hold";

  useEffect(() => {
    if (cloud.status === "ready") synchronize();
  }, [cloud.status]);

  useEffect(() => {
    const next = {};
    for (const step of steps) next[step.id] = { status: step.step_status, actualResult: step.actual_result || "", evidenceRefs: step.evidence_refs || [] };
    setStepDrafts(next);
  }, [steps]);

  useEffect(() => {
    const next = {};
    for (const signoff of signoffs) next[signoff.id] = { signerName: signoff.signer_name || "", decision: signoff.decision || "pending", note: signoff.note || "" };
    setSignoffDrafts(next);
  }, [signoffs]);

  async function request(method, body) {
    const token = await cloud.getAccessToken();
    if (!token) throw new Error("Sign in to Northstar Secure before changing the validation workspace.");
    const response = await fetch("/api/golden-path", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Golden Path request failed.");
    return result;
  }

  async function synchronize() {
    if (cloud.status !== "ready") return;
    setBusy(true);
    try {
      const result = await request("GET");
      if (result.session) {
        setWorkspace(result);
        setMode("secure");
        setNotice(`${result.organizationName || cloud.organizationName} Golden Path validation synchronized.`);
      } else {
        setWorkspace(demoWorkspace);
        setMode("secure-empty");
        setNotice("Northstar Secure is connected. Load the controlled scenario to begin validation.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Synchronization failed.");
    } finally {
      setBusy(false);
    }
  }

  async function loadScenario(action = "seed") {
    setBusy(true);
    try {
      const result = await request("POST", { action, ...setup });
      setWorkspace(result);
      setMode("secure");
      setNotice(action === "reset" ? "Golden Path scenario reset to a clean baseline." : "Controlled customer-recovery scenario loaded into Northstar Secure.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Scenario could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStep(step) {
    const draft = stepDrafts[step.id] || {};
    if (mode !== "secure") {
      setWorkspace((current) => ({
        ...current,
        steps: current.steps.map((item) => item.id === step.id ? { ...item, step_status: draft.status, actual_result: draft.actualResult } : item),
        telemetry: { ...current.telemetry, passedSteps: current.steps.filter((item) => (item.id === step.id ? draft.status : item.step_status) === "passed").length },
      }));
      setNotice("Preview validation updated locally. Secure validation requires sign-in.");
      return;
    }
    setBusy(true);
    try {
      const result = await request("PATCH", { action: "update_step", stepId: step.id, status: draft.status, actualResult: draft.actualResult, evidenceRefs: draft.evidenceRefs || [] });
      setWorkspace(result);
      setNotice(`Validation result saved for step ${step.sequence_number}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Step could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function addFinding(event) {
    event.preventDefault();
    if (!findingDraft.title.trim()) {
      setNotice("Enter a finding title before saving.");
      return;
    }
    if (mode !== "secure") {
      const finding = { id: `demo-finding-${Date.now()}`, finding_key: `GP-F-${Date.now().toString().slice(-6)}`, finding_status: "open", created_at: new Date().toISOString(), ...findingDraft };
      setWorkspace((current) => ({ ...current, findings: [finding, ...current.findings], telemetry: { ...current.telemetry, openFindings: current.telemetry.openFindings + 1, criticalFindings: current.telemetry.criticalFindings + (finding.severity === "critical" ? 1 : 0) } }));
      setFindingDraft({ severity: "medium", category: "functional", title: "", description: "", affectedRoute: "", ownerName: "", stepId: "" });
      setNotice("Preview finding recorded locally.");
      return;
    }
    setBusy(true);
    try {
      const result = await request("POST", { action: "add_finding", ...findingDraft });
      setWorkspace(result.workspace);
      setFindingDraft({ severity: "medium", category: "functional", title: "", description: "", affectedRoute: "", ownerName: "", stepId: "" });
      setNotice("Validation finding added to the controlled defect log.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Finding could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function updateFinding(finding, status) {
    if (mode !== "secure") {
      setWorkspace((current) => ({ ...current, findings: current.findings.map((item) => item.id === finding.id ? { ...item, finding_status: status } : item) }));
      return;
    }
    setBusy(true);
    try {
      const result = await request("PATCH", { action: "update_finding", findingId: finding.id, status, ownerName: finding.owner_name || finding.ownerName || "", dueDate: finding.due_date || null, resolutionNote: finding.resolution_note || "" });
      setWorkspace(result);
      setNotice(`${finding.finding_key} updated to ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Finding could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSignoff(signoff) {
    const draft = signoffDrafts[signoff.id] || {};
    if (mode !== "secure") {
      setWorkspace((current) => ({ ...current, signoffs: current.signoffs.map((item) => item.id === signoff.id ? { ...item, signer_name: draft.signerName, decision: draft.decision, note: draft.note } : item) }));
      setNotice("Preview signoff updated locally.");
      return;
    }
    setBusy(true);
    try {
      const result = await request("PATCH", { action: "signoff", signoffId: signoff.id, signerName: draft.signerName, decision: draft.decision, note: draft.note });
      setWorkspace(result);
      setNotice(`${signoff.signoff_role} decision saved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Signoff could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function completeSession() {
    if (mode !== "secure") {
      setNotice("A secure validation session is required before issuing a release recommendation.");
      return;
    }
    setBusy(true);
    try {
      const result = await request("PATCH", { action: "complete_session", approvalNote: `Golden Path release recommendation: ${telemetry.releaseRecommendation}` });
      setWorkspace(result);
      setNotice(`Validation session completed with recommendation: ${result.telemetry.releaseRecommendation}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Session could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink(event) {
    event.preventDefault();
    try {
      await cloud.sendMagicLink(email);
      setNotice(`Secure sign-in link sent to ${email}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign-in link could not be sent.");
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    organization: cloud.organizationName || "QMSPilot Design-Partner Demonstration",
    session,
    telemetry,
    steps,
    findings,
    signoffs,
    operatingBoundary: "Northstar provides supervised intelligence and controlled workflow. Qualified humans retain authority for product release, customer commitments, financial validation, corrective-action closure, and management decisions.",
  };

  return (
    <main className="gp-shell">
      <header className="gp-header">
        <div className="gp-brand"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/><img className="northstar" src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar"/></div>
        <div className="gp-header-copy"><small>QMSPILOT NORTHSTAR</small><strong>Golden Path Validation & Design-Partner Demo</strong></div>
        <nav><a href="/">Command Center</a><a href="/workforce-operations">AI Workforce</a><a href="/entity-graph">Entity Graph</a><a href="/?toolbox=open">Toolbox</a></nav>
      </header>

      <section className="gp-hero">
        <div>
          <span className="eyebrow"><FlaskConical size={17}/> CONTROLLED RELEASE VALIDATION</span>
          <h1>Prove Northstar works from detection through verified closure.</h1>
          <p>This console turns the customer-recovery story into a repeatable validation run, captures defects and evidence, preserves human decisions, and produces a design-partner report.</p>
        </div>
        <article className={`release-card ${releaseTone}`}>
          <small>RELEASE RECOMMENDATION</small>
          <strong>{telemetry.releaseRecommendation}</strong>
          <span>{completion}% of required validation steps passed</span>
        </article>
      </section>

      <section className="gp-controls no-print">
        <div className="setup-fields">
          <label>Design partner<input value={setup.designPartnerName} onChange={(event) => setSetup({ ...setup, designPartnerName: event.target.value })}/></label>
          <label>Validation site<input value={setup.site} onChange={(event) => setSetup({ ...setup, site: event.target.value })}/></label>
          <label>Facilitator<input value={setup.facilitatorName} placeholder={cloud.user?.email || "Facilitator name"} onChange={(event) => setSetup({ ...setup, facilitatorName: event.target.value })}/></label>
        </div>
        <div className="control-buttons">
          <button onClick={() => loadScenario("seed")} disabled={busy || cloud.status !== "ready"}><Play size={16}/> Load controlled scenario</button>
          <button className="secondary" onClick={() => loadScenario("reset")} disabled={busy || cloud.status !== "ready"}><RotateCcw size={16}/> Reset demo</button>
          <button className="secondary" onClick={synchronize} disabled={busy || cloud.status !== "ready"}><RefreshCw size={16}/> Refresh telemetry</button>
          <button className="secondary" onClick={() => window.print()}><Printer size={16}/> Print report</button>
          <button className="secondary" onClick={() => downloadJson(`northstar-golden-path-${new Date().toISOString().slice(0, 10)}.json`, report)}><Download size={16}/> Export JSON</button>
        </div>
      </section>

      {cloud.status !== "ready" && (
        <form className="signin-card no-print" onSubmit={sendMagicLink}>
          <Cloud size={20}/><div><strong>Northstar Secure sign-in</strong><span>Use a secure workspace to seed records, preserve validation evidence, and share the run with the design-partner team.</span></div>
          <input type="email" required value={email} placeholder="you@company.com" onChange={(event) => setEmail(event.target.value)}/>
          <button type="submit">Send sign-in link</button>
        </form>
      )}

      <div className={`gp-notice ${mode}`}><Gauge size={17}/>{busy ? "Northstar is processing the validation workspace..." : notice}<span>{mode === "secure" ? "LIVE NORTHSTAR SECURE" : mode === "secure-empty" ? "SECURE · NOT SEEDED" : "PREVIEW MODE"}</span></div>

      <section className="metric-grid">
        {[
          ["Scenario events", telemetry.events, "8 expected"],
          ["Agent assignments", telemetry.assignments, `${telemetry.agents?.length || 0} specialists represented`],
          ["Human decisions", telemetry.approvedRecommendations, `${telemetry.recommendations} recommendations`],
          ["Controlled actions", telemetry.actions, `${telemetry.completedActions} completed`],
          ["Executed writebacks", telemetry.executedWritebacks, `${telemetry.toolActions} target-tool actions`],
          ["Evidence references", telemetry.evidence, `${telemetry.auditEntries} audit entries`],
          ["Open findings", telemetry.openFindings, `${telemetry.criticalFindings} critical`],
          ["Signoffs", telemetry.approvedSignoffs, `${signoffs.length} required`],
        ].map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
      </section>

      <section className="scenario-panel">
        <div className="panel-heading"><div><small>CONTROLLED SCENARIO</small><h2>{session.scenario_name}</h2></div><BadgeCheck size={26}/></div>
        <div className="context-grid">
          <div><span>Design partner</span><strong>{session.design_partner_name}</strong></div>
          <div><span>Order</span><strong>{session.scenario_payload?.orderNumber || "SO-10482"}</strong></div>
          <div><span>Product / part</span><strong>{session.scenario_payload?.product || "PAC2K36HPVS"} · {session.scenario_payload?.partNumber || "BRKT-4472"}</strong></div>
          <div><span>Instrument</span><strong>{session.scenario_payload?.instrument || "BG-214"}</strong></div>
          <div><span>Supplier</span><strong>{session.scenario_payload?.supplier || "Precision Alloy Supply"}</strong></div>
          <div><span>Session status</span><strong>{String(session.session_status || "planning").replaceAll("_", " ")}</strong></div>
        </div>
        <p><strong>Trigger:</strong> {session.scenario_payload?.complaint || "Customer reports intermittent shaft interference during final installation."}</p>
        <div className="scenario-links no-print"><a href="/tools/ncr">Open NCR <ExternalLink size={14}/></a><a href="/tools/capa">Open CAPA <ExternalLink size={14}/></a><a href="/workforce-operations">Open Intelligence Bus <ExternalLink size={14}/></a><a href="/entity-graph">Open Entity Graph <ExternalLink size={14}/></a></div>
      </section>

      <section className="validation-section">
        <div className="section-heading"><div><small>VALIDATION SCRIPT</small><h2>Thirteen release gates</h2></div><span>Automatic signals support the reviewer; they never replace the human pass/fail decision.</span></div>
        {Object.entries(groupedSteps).map(([phase, phaseSteps]) => (
          <div className="phase-block" key={phase}>
            <h3>{phase}</h3>
            <div className="step-grid">
              {phaseSteps.map((step) => {
                const draft = stepDrafts[step.id] || { status: step.step_status, actualResult: step.actual_result || "" };
                const signal = telemetry.signals?.[step.step_key];
                return (
                  <article className={`step-card ${draft.status}`} key={step.id}>
                    <div className="step-head"><span>{step.sequence_number}</span><div><small>{step.gate_type} gate · {step.responsible_role}</small><h4>{step.title}</h4></div><em className={signal ? "signal-ready" : "signal-pending"}>{signal ? "SYSTEM SIGNAL READY" : "HUMAN EVIDENCE REQUIRED"}</em></div>
                    <p>{step.objective}</p>
                    <div className="expected"><strong>Expected result</strong><span>{step.expected_result}</span></div>
                    <div className="expected"><strong>Evidence</strong><span>{step.evidence_required}</span></div>
                    <div className="step-actions no-print"><a href={step.linked_route}>Open linked area <ArrowRight size={14}/></a><select value={draft.status} onChange={(event) => setStepDrafts({ ...stepDrafts, [step.id]: { ...draft, status: event.target.value } })}>{statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div>
                    <textarea className="no-print" value={draft.actualResult} placeholder="Record what happened, the evidence reviewed, and any limitation..." onChange={(event) => setStepDrafts({ ...stepDrafts, [step.id]: { ...draft, actualResult: event.target.value } })}/>
                    <button className="save-step no-print" onClick={() => saveStep(step)} disabled={busy}>{statusIcon(draft.status)} Save validation result</button>
                    <div className="print-result"><strong>Recorded result:</strong> {step.actual_result || "No result recorded."}</div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="findings-section">
        <div className="section-heading"><div><small>DEFECT & IMPROVEMENT LOG</small><h2>Turn validation friction into controlled work.</h2></div><FileWarning size={24}/></div>
        <form className="finding-form no-print" onSubmit={addFinding}>
          <select value={findingDraft.severity} onChange={(event) => setFindingDraft({ ...findingDraft, severity: event.target.value })}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <select value={findingDraft.category} onChange={(event) => setFindingDraft({ ...findingDraft, category: event.target.value })}><option value="functional">Functional</option><option value="integration">Integration</option><option value="security">Security</option><option value="data">Data</option><option value="usability">Usability</option><option value="reporting">Reporting</option></select>
          <select value={findingDraft.stepId} onChange={(event) => setFindingDraft({ ...findingDraft, stepId: event.target.value })}><option value="">No specific step</option>{steps.map((step) => <option value={step.id} key={step.id}>Step {step.sequence_number}: {step.title}</option>)}</select>
          <input required placeholder="Finding title" value={findingDraft.title} onChange={(event) => setFindingDraft({ ...findingDraft, title: event.target.value })}/>
          <input placeholder="Affected route" value={findingDraft.affectedRoute} onChange={(event) => setFindingDraft({ ...findingDraft, affectedRoute: event.target.value })}/>
          <input placeholder="Owner" value={findingDraft.ownerName} onChange={(event) => setFindingDraft({ ...findingDraft, ownerName: event.target.value })}/>
          <textarea placeholder="Describe what happened, expected behavior, and business impact..." value={findingDraft.description} onChange={(event) => setFindingDraft({ ...findingDraft, description: event.target.value })}/>
          <button type="submit"><Flag size={16}/> Add finding</button>
        </form>
        <div className="finding-list">
          {!findings.length && <div className="empty-state"><FileCheck2 size={24}/>No validation findings recorded.</div>}
          {findings.map((finding) => <article key={finding.id}><div><span className={`finding-severity ${finding.severity}`}>{finding.severity}</span><strong>{finding.finding_key} · {finding.title}</strong><small>{finding.category} · {finding.affected_route || finding.affectedRoute || "No route specified"}</small></div><p>{finding.description}</p><div className="finding-footer"><span>Status: {String(finding.finding_status || "open").replaceAll("_", " ")}</span><span>Owner: {finding.owner_name || finding.ownerName || "Unassigned"}</span><div className="no-print"><button onClick={() => updateFinding(finding, "ready_for_retest")}>Ready for retest</button><button onClick={() => updateFinding(finding, "closed")}>Close</button></div></div></article>)}
        </div>
      </section>

      <section className="signoff-section">
        <div className="section-heading"><div><small>HUMAN RELEASE AUTHORITY</small><h2>Required signoffs</h2></div><UserCheck size={25}/></div>
        <div className="signoff-grid">
          {signoffs.map((signoff) => {
            const draft = signoffDrafts[signoff.id] || {};
            return <article key={signoff.id}><strong>{signoff.signoff_role}</strong><input className="no-print" placeholder="Signer name" value={draft.signerName || ""} onChange={(event) => setSignoffDrafts({ ...signoffDrafts, [signoff.id]: { ...draft, signerName: event.target.value } })}/><select className="no-print" value={draft.decision || "pending"} onChange={(event) => setSignoffDrafts({ ...signoffDrafts, [signoff.id]: { ...draft, decision: event.target.value } })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="approved_with_conditions">Approved with conditions</option><option value="rejected">Rejected</option></select><textarea className="no-print" placeholder="Decision note or conditions..." value={draft.note || ""} onChange={(event) => setSignoffDrafts({ ...signoffDrafts, [signoff.id]: { ...draft, note: event.target.value } })}/><button className="no-print" onClick={() => saveSignoff(signoff)} disabled={busy}><ShieldCheck size={15}/> Save signoff</button><div className="print-signoff"><span>{signoff.signer_name || "Unsigned"}</span><b>{String(signoff.decision || "pending").replaceAll("_", " ")}</b><p>{signoff.note || "No decision note."}</p></div></article>;
          })}
        </div>
        <button className="complete-button no-print" onClick={completeSession} disabled={busy}><BadgeCheck size={18}/> Complete validation and record release recommendation</button>
      </section>

      <section className="report-section">
        <div className="report-title"><div><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot"/><h2>Northstar Golden Path Validation Report</h2></div><span>{telemetry.releaseRecommendation}</span></div>
        <p><strong>Organization:</strong> {cloud.organizationName || "QMSPilot Design-Partner Demonstration"}</p>
        <p><strong>Design partner:</strong> {session.design_partner_name} · <strong>Site:</strong> {session.site}</p>
        <p><strong>Scenario:</strong> {session.scenario_name} v{session.scenario_version} · <strong>Started:</strong> {formatDate(session.started_at)}</p>
        <div className="report-summary"><div><strong>{completion}%</strong><span>Required steps passed</span></div><div><strong>{telemetry.events}</strong><span>Connected events</span></div><div><strong>{telemetry.openFindings}</strong><span>Open findings</span></div><div><strong>{telemetry.approvedSignoffs}/{signoffs.length}</strong><span>Human signoffs</span></div></div>
        <h3>Executive conclusion</h3>
        <p>Northstar was evaluated as a supervised closed-loop execution platform. The validation covered detection, Intelligence Bus routing, digital workforce recommendations, human approval, controlled writeback, target-tool execution, evidence verification, synchronized closure, leadership metrics, entity relationships, tenant security, and customer-facing reporting.</p>
        <h3>Operating boundary</h3>
        <p>Northstar provides supervised intelligence and controlled workflow. Qualified humans retain authority for product release, customer commitments, financial validation, corrective-action closure, and management decisions.</p>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.gp-shell{min-height:100vh;padding-bottom:80px;color:#13283d;background:radial-gradient(circle at top right,#dceeff 0,transparent 32%),#edf3f8;font-family:Inter,Arial,sans-serif}.gp-header{position:sticky;top:0;z-index:90;display:flex;align-items:center;gap:18px;min-height:72px;padding:10px 24px;border-bottom:1px solid #274762;color:#fff;background:rgba(5,25,45,.96);backdrop-filter:blur(12px)}.gp-brand{display:flex;align-items:center;gap:8px}.gp-brand img{width:132px;max-height:44px;padding:4px;border-radius:8px;background:#fff}.gp-brand img.northstar{width:95px;background:#020914}.gp-header-copy{margin-right:auto}.gp-header-copy small,.gp-header-copy strong{display:block}.gp-header-copy small{color:#8dc8f6;font-size:9px;font-weight:900;letter-spacing:.14em}.gp-header nav{display:flex;gap:6px;flex-wrap:wrap}.gp-header nav a{padding:8px 10px;border:1px solid #355673;border-radius:8px;color:#d9e9f6;text-decoration:none;font-size:10px;font-weight:850}.gp-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);gap:18px;max-width:1500px;margin:24px auto 0;padding:0 24px}.gp-hero>div{padding:32px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#06192d,#0b467c 66%,#0a66ff);box-shadow:0 24px 70px rgba(9,54,93,.22)}.eyebrow{display:flex;align-items:center;gap:7px;color:#9bd3ff;font-size:10px;font-weight:900;letter-spacing:.13em}.gp-hero h1{max-width:920px;margin:15px 0 12px;font-size:clamp(34px,5vw,64px);line-height:1}.gp-hero p{max-width:940px;margin:0;color:#d5e8f7;line-height:1.65}.release-card{display:grid;place-items:center;align-content:center;padding:24px;border-radius:22px;text-align:center;box-shadow:0 18px 48px rgba(29,59,84,.12)}.release-card small,.release-card strong,.release-card span{display:block}.release-card small{font-size:9px;font-weight:900;letter-spacing:.13em}.release-card strong{margin:15px 0 8px;font-size:28px}.release-card span{font-size:11px}.release-card.go{color:#176747;background:#e4f8ef}.release-card.conditions{color:#77520d;background:#fff2ce}.release-card.hold{color:#8e2936;background:#ffe7ea}.gp-controls,.gp-notice,.metric-grid,.scenario-panel,.validation-section,.findings-section,.signoff-section,.report-section,.signin-card{max-width:1500px;margin-left:auto;margin-right:auto}.gp-controls{margin-top:16px;padding:18px 24px;border:1px solid #d3e1ec;border-radius:18px;background:#fff}.setup-fields{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px}.setup-fields label{color:#657c90;font-size:9px;font-weight:900;text-transform:uppercase}.setup-fields input,.finding-form input,.finding-form select,.finding-form textarea,.step-card textarea,.step-actions select,.signoff-grid input,.signoff-grid select,.signoff-grid textarea{width:100%;margin-top:5px;padding:10px 11px;border:1px solid #c9d8e3;border-radius:9px;color:#17314a;background:#fff;font:inherit;font-size:11px}.control-buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.control-buttons button,.signin-card button,.step-actions a,.save-step,.finding-form button,.finding-footer button,.signoff-grid button,.complete-button,.scenario-links a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:0 12px;border:0;border-radius:9px;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8);font-size:10px;font-weight:900;text-decoration:none;cursor:pointer}.control-buttons button.secondary{border:1px solid #bfd0dd;color:#285674;background:#fff}.control-buttons button:disabled,.save-step:disabled{opacity:.55;cursor:not-allowed}.signin-card{display:flex;align-items:center;gap:12px;margin-top:14px;padding:15px 20px;border:1px solid #9cc7e9;border-radius:15px;color:#174d78;background:#e9f5ff}.signin-card>div{margin-right:auto}.signin-card strong,.signin-card span{display:block}.signin-card span{margin-top:3px;font-size:10px}.signin-card input{min-width:240px;padding:10px;border:1px solid #96bfe0;border-radius:8px}.gp-notice{display:flex;align-items:center;gap:8px;margin-top:14px;padding:12px 18px;border:1px solid #9cc7e9;border-radius:12px;color:#174d78;background:#e9f5ff;font-size:11px;font-weight:800}.gp-notice>span{margin-left:auto;padding:5px 8px;border-radius:999px;background:#d4eaff;font-size:8px}.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px;margin-top:14px;padding:0 24px}.metric-grid article,.scenario-panel,.step-card,.findings-section,.signoff-section,.report-section{border:1px solid #d6e2eb;border-radius:17px;background:#fff;box-shadow:0 12px 32px rgba(27,58,84,.07)}.metric-grid article{padding:16px}.metric-grid small,.metric-grid strong,.metric-grid span{display:block}.metric-grid small{color:#70869a;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.metric-grid strong{margin-top:7px;font-size:25px}.metric-grid span{margin-top:4px;color:#667f92;font-size:9px}.scenario-panel,.findings-section,.signoff-section,.report-section{margin-top:17px;padding:22px}.panel-heading,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px}.panel-heading small,.section-heading small{color:#0a66ff;font-size:9px;font-weight:900;letter-spacing:.13em}.panel-heading h2,.section-heading h2{margin:5px 0 0}.context-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:16px}.context-grid>div{padding:11px;border:1px solid #dae5ed;border-radius:11px;background:#f7fafc}.context-grid span,.context-grid strong{display:block}.context-grid span{color:#71879a;font-size:8px;font-weight:900;text-transform:uppercase}.context-grid strong{margin-top:5px;font-size:11px}.scenario-panel>p{color:#526d82;line-height:1.6}.scenario-links{display:flex;gap:8px;flex-wrap:wrap}.validation-section{margin-top:20px;padding:0 24px}.section-heading>span{color:#687f93;font-size:10px}.phase-block{margin-top:18px}.phase-block>h3{margin:0 0 10px;color:#285a7e;font-size:13px}.step-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:13px}.step-card{padding:17px;border-left:5px solid #b7c8d5}.step-card.passed{border-left-color:#25a56f}.step-card.failed{border-left-color:#d44a5c}.step-card.blocked{border-left-color:#dd8b2a}.step-card.in_progress{border-left-color:#0a66ff}.step-head{display:flex;align-items:flex-start;gap:10px}.step-head>span{width:34px;height:34px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:#0c5eaa;background:#e4f2ff;font-weight:950}.step-head>div{margin-right:auto}.step-head small,.step-head h4{display:block}.step-head small{color:#71869a;font-size:8px;text-transform:uppercase}.step-head h4{margin:4px 0 0}.step-head em{padding:5px 7px;border-radius:999px;font-size:7px;font-style:normal;font-weight:950;white-space:nowrap}.signal-ready{color:#176747;background:#e4f8ef}.signal-pending{color:#7b5714;background:#fff1cd}.step-card>p{color:#526d82;font-size:10px;line-height:1.55}.expected{display:grid;grid-template-columns:92px 1fr;gap:8px;margin-top:8px;padding:9px;border-radius:9px;background:#f4f8fb;font-size:9px;line-height:1.45}.expected strong{color:#2e5e81}.expected span{color:#5d7487}.step-actions{display:flex;align-items:center;gap:8px;margin-top:11px}.step-actions a{margin-right:auto}.step-actions select{width:auto;margin:0}.step-card textarea{min-height:76px;resize:vertical}.save-step{margin-top:8px}.print-result{display:none;margin-top:10px;font-size:9px}.finding-form{display:grid;grid-template-columns:120px 130px 1fr 1.4fr 1fr 1fr;gap:8px;margin-top:15px}.finding-form textarea{grid-column:1/-2;min-height:70px}.finding-form button{align-self:stretch}.finding-list{display:grid;gap:10px;margin-top:15px}.empty-state{display:flex;align-items:center;justify-content:center;gap:9px;padding:28px;border:1px dashed #bfd0dd;border-radius:13px;color:#6d8294}.finding-list article{padding:15px;border:1px solid #dae4ec;border-radius:13px}.finding-list article>div:first-child{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.finding-list article>div:first-child small{width:100%;color:#71869a;font-size:9px}.finding-severity{padding:5px 7px;border-radius:999px;font-size:8px;font-weight:950;text-transform:uppercase}.finding-severity.critical{color:#8e2634;background:#ffe4e8}.finding-severity.high{color:#85520a;background:#fff0d5}.finding-severity.medium{color:#1c5b8b;background:#e4f2ff}.finding-severity.low{color:#176747;background:#e4f8ef}.finding-list p{color:#526d82;font-size:10px}.finding-footer{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:#657d91;font-size:9px}.finding-footer>div{margin-left:auto;display:flex;gap:6px}.signoff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-top:15px}.signoff-grid article{padding:15px;border:1px solid #dae5ed;border-radius:13px}.signoff-grid textarea{min-height:70px}.print-signoff{display:none}.complete-button{margin-top:15px;min-height:44px}.report-section{margin-top:20px}.report-title{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #dce5ec;padding-bottom:13px}.report-title>div{display:flex;align-items:center;gap:12px}.report-title img{width:145px}.report-title h2{margin:0}.report-title>span{padding:8px 10px;border-radius:999px;color:#0a4d84;background:#e4f2ff;font-weight:950}.report-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}.report-summary>div{padding:13px;border:1px solid #dae5ed;border-radius:11px;text-align:center}.report-summary strong,.report-summary span{display:block}.report-summary strong{font-size:24px}.report-summary span{margin-top:4px;color:#687f92;font-size:9px}.report-section>p{color:#526d82;line-height:1.6}@media(max-width:900px){.gp-header{align-items:flex-start;flex-wrap:wrap}.gp-header nav{width:100%}.gp-hero{grid-template-columns:1fr}.setup-fields{grid-template-columns:1fr}.finding-form{grid-template-columns:1fr 1fr}.finding-form textarea{grid-column:1/-1}.report-summary{grid-template-columns:1fr 1fr}}@media(max-width:600px){.gp-header,.gp-hero,.gp-controls,.metric-grid,.validation-section{padding-left:12px;padding-right:12px}.gp-brand img{width:100px}.step-grid{grid-template-columns:1fr}.step-head{flex-wrap:wrap}.step-head em{width:100%}.finding-form{grid-template-columns:1fr}.report-summary{grid-template-columns:1fr}}
        @media print{body{background:#fff}.gp-header,.gp-hero,.gp-controls,.gp-notice,.signin-card,.metric-grid,.scenario-links,.no-print,.validation-section>.section-heading,.findings-section>.section-heading,.signoff-section>.section-heading,.complete-button{display:none!important}.gp-shell{padding:0;background:#fff}.scenario-panel,.validation-section,.findings-section,.signoff-section,.report-section{max-width:none;margin:0 0 14px;padding:12px;border:1px solid #bfcbd4;box-shadow:none;break-inside:avoid}.phase-block{break-inside:avoid}.step-grid{grid-template-columns:1fr 1fr}.step-card{padding:10px;box-shadow:none;break-inside:avoid}.step-card textarea,.save-step,.step-actions{display:none}.print-result,.print-signoff{display:block}.finding-list article{break-inside:avoid}.report-section{display:block}.report-title img{width:120px}.context-grid{grid-template-columns:repeat(3,1fr)}}
      `}</style>
    </main>
  );
}
