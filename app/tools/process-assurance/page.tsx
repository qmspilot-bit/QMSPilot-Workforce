"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  Gauge,
  Layers3,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type Answer = "" | "yes" | "no" | "na";
type Severity = "low" | "medium" | "high" | "critical";
type AuditLayer = "layer-1" | "layer-2" | "layer-3";

type AuditQuestion = {
  id: string;
  category: string;
  question: string;
  reference: string;
  answer: Answer;
  note: string;
  severity: Severity;
  containment: string;
  owner: string;
  dueDate: string;
  evidenceNames: string[];
};

type AuditSetup = {
  organization: string;
  site: string;
  department: string;
  process: string;
  shift: string;
  auditor: string;
  auditDate: string;
  layer: AuditLayer;
  standardReference: string;
  leadershipNote: string;
};

const draftKey = "qmspilot:process-assurance:draft";
const recordsKey = "qmspilot:process-assurance:records";

const layerLabels: Record<AuditLayer, string> = {
  "layer-1": "Layer 1 · Supervisor / Team Lead",
  "layer-2": "Layer 2 · Operations / Quality Manager",
  "layer-3": "Layer 3 · Plant Manager / Executive",
};

const baseQuestions: Array<Omit<AuditQuestion, "answer" | "note" | "severity" | "containment" | "owner" | "dueDate" | "evidenceNames">> = [
  { id: "PA-01", category: "Controlled work", question: "Is the current controlled work instruction available at the point of use and being followed?", reference: "ISO 9001:2015 · 7.5 / 8.5.1" },
  { id: "PA-02", category: "Drawings & specifications", question: "Are the correct released drawing, revision, specifications, and customer requirements being used?", reference: "ISO 9001:2015 · 8.5.1" },
  { id: "PA-03", category: "Tooling & setup", question: "Are required tooling, fixtures, programs, setup parameters, and acceptance criteria correct and verified?", reference: "Process control plan" },
  { id: "PA-04", category: "Inspection execution", question: "Are required in-process and final inspections completed at the defined frequency with objective evidence?", reference: "ISO 9001:2015 · 8.6" },
  { id: "PA-05", category: "Measurement assurance", question: "Is measuring and test equipment suitable, identified, protected, and within calibration?", reference: "ISO 9001:2015 · 7.1.5" },
  { id: "PA-06", category: "Identification & traceability", question: "Are material, product status, customer property, and traceability controls maintained throughout the process?", reference: "ISO 9001:2015 · 8.5.2 / 8.5.3" },
  { id: "PA-07", category: "Records & accountability", question: "Are production, inspection, training, maintenance, and approval records complete, legible, and attributable?", reference: "ISO 9001:2015 · 7.5.3" },
  { id: "PA-08", category: "Safety & 6S", question: "Are required PPE, safe-work controls, housekeeping, visual standards, and abnormal-condition responses maintained?", reference: "Site safety and 6S standard" },
  { id: "PA-09", category: "Competence", question: "Are employees performing the work trained, authorized, and able to explain critical quality and safety points?", reference: "ISO 9001:2015 · 7.2" },
  { id: "PA-10", category: "Sustained effectiveness", question: "Do previous corrective actions, containment controls, and improvement changes remain effective with no repeat failure?", reference: "ISO 9001:2015 · 10.2" },
];

function newQuestions(): AuditQuestion[] {
  return baseQuestions.map((question) => ({
    ...question,
    answer: "",
    note: "",
    severity: "medium",
    containment: "",
    owner: "",
    dueDate: "",
    evidenceNames: [],
  }));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createRecordId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `NPA-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function escalationFor(severity: Severity) {
  if (severity === "critical" || severity === "high") return "CAPA / Executive escalation";
  if (severity === "medium") return "NCR / Accountability action";
  return "Local accountability action";
}

export default function ProcessAssurancePage() {
  const [setup, setSetup] = useState<AuditSetup>({
    organization: "QMSPilot Design Partner",
    site: "",
    department: "Operations",
    process: "",
    shift: "Day",
    auditor: "",
    auditDate: today(),
    layer: "layer-1",
    standardReference: "",
    leadershipNote: "",
  });
  const [questions, setQuestions] = useState<AuditQuestion[]>(newQuestions);
  const [recordId, setRecordId] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as { setup?: AuditSetup; questions?: AuditQuestion[]; recordId?: string };
      if (draft.setup) setSetup(draft.setup);
      if (draft.questions?.length) setQuestions(draft.questions);
      if (draft.recordId) setRecordId(draft.recordId);
      setNotice("Saved draft restored.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  const metrics = useMemo(() => {
    const answered = questions.filter((item) => item.answer !== "").length;
    const applicable = questions.filter((item) => item.answer === "yes" || item.answer === "no").length;
    const passed = questions.filter((item) => item.answer === "yes").length;
    const findings = questions.filter((item) => item.answer === "no");
    const critical = findings.filter((item) => item.severity === "critical" || item.severity === "high").length;
    const score = applicable ? Math.round((passed / applicable) * 100) : 0;
    const complete = answered === questions.length;
    const actionsReady = findings.every((item) => item.containment.trim() && item.owner.trim() && item.dueDate);
    return { answered, applicable, passed, findings, critical, score, complete, actionsReady };
  }, [questions]);

  const assuranceStatus = useMemo(() => {
    if (!metrics.complete) return { label: "Audit in progress", tone: "neutral", message: "Complete every observable requirement before submission." };
    if (metrics.critical > 0 || metrics.score < 80) return { label: "Leadership attention", tone: "danger", message: "Containment and senior review are required before normal operation continues." };
    if (metrics.findings.length > 0 || metrics.score < 95) return { label: "Controlled with actions", tone: "warning", message: "The process may continue only with documented ownership, due dates, and verification." };
    return { label: "Process assured", tone: "success", message: "Observed controls are working as intended. Continue layered verification." };
  }, [metrics]);

  function updateSetup<K extends keyof AuditSetup>(key: K, value: AuditSetup[K]) {
    setSetup((current) => ({ ...current, [key]: value }));
    setSubmitted(false);
  }

  function updateQuestion(id: string, patch: Partial<AuditQuestion>) {
    setQuestions((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    setSubmitted(false);
  }

  function answerQuestion(id: string, answer: Answer) {
    setQuestions((current) => current.map((item) => {
      if (item.id !== id) return item;
      if (answer !== "no") {
        return { ...item, answer, severity: "medium", containment: "", owner: "", dueDate: "" };
      }
      return { ...item, answer };
    }));
    setSubmitted(false);
  }

  function attachEvidence(id: string, event: ChangeEvent<HTMLInputElement>) {
    const names = Array.from(event.target.files ?? []).map((file) => file.name);
    updateQuestion(id, { evidenceNames: names });
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify({ setup, questions, recordId }));
    setNotice("Draft saved on this device.");
  }

  function loadDemo() {
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 7);
    const due = nextDue.toISOString().slice(0, 10);
    setSetup({
      organization: "Northstar Precision Systems",
      site: "Lufkin Operations",
      department: "Pressing Operations",
      process: "Gearbox Pressing & Verification",
      shift: "Day",
      auditor: "Plant Operations Manager",
      auditDate: today(),
      layer: "layer-2",
      standardReference: "Pressing Operations Dozuki · Rev 4",
      leadershipNote: "Verify control discipline before increasing production demand.",
    });
    setQuestions(newQuestions().map((item, index) => {
      if (index === 4) return { ...item, answer: "no", severity: "high", note: "Torque wrench ID TW-044 showed an expired calibration status at point of use.", containment: "Remove TW-044 from service, identify affected work, and verify with a calibrated replacement.", owner: "Quality Manager", dueDate: due, evidenceNames: ["TW-044_calibration_label.jpg"] };
      if (index === 9) return { ...item, answer: "no", severity: "medium", note: "Previous PM action for the press fixture has no documented effectiveness check.", containment: "Confirm fixture condition before the next production run and complete the effectiveness review.", owner: "Maintenance Manager", dueDate: due, evidenceNames: ["fixture_PM_record.pdf"] };
      return { ...item, answer: index === 7 ? "na" : "yes", note: index === 7 ? "Safety verification completed under the separate daily safety walk." : "Observed and verified at point of use." };
    }));
    setRecordId("");
    setSubmitted(false);
    setNotice("Design-partner demonstration loaded.");
  }

  function clearAudit() {
    setSetup({ organization: "QMSPilot Design Partner", site: "", department: "Operations", process: "", shift: "Day", auditor: "", auditDate: today(), layer: "layer-1", standardReference: "", leadershipNote: "" });
    setQuestions(newQuestions());
    setRecordId("");
    setSubmitted(false);
    setNotice("New Process Assurance audit started.");
    window.localStorage.removeItem(draftKey);
  }

  function buildPayload(id: string) {
    return {
      schema: "qmspilot.northstar.process-assurance.v1",
      recordId: id,
      toolId: "QMSP-PA-001",
      version: "1.0.0",
      submittedAt: new Date().toISOString(),
      setup,
      metrics: {
        score: metrics.score,
        answered: metrics.answered,
        findings: metrics.findings.length,
        highRisk: metrics.critical,
        status: assuranceStatus.label,
      },
      findings: metrics.findings.map((item) => ({
        id: item.id,
        category: item.category,
        requirement: item.question,
        reference: item.reference,
        severity: item.severity,
        observation: item.note,
        containment: item.containment,
        owner: item.owner,
        dueDate: item.dueDate,
        evidenceNames: item.evidenceNames,
        recommendedHandoff: escalationFor(item.severity),
      })),
      questions,
      governance: {
        humanApprovalRequired: true,
        closureEvidenceRequired: metrics.findings.length > 0,
        source: "Northstar Process Assurance",
      },
    };
  }

  function validate() {
    if (!setup.organization.trim() || !setup.site.trim() || !setup.process.trim() || !setup.auditor.trim()) {
      setNotice("Complete organization, site, process, and auditor before submission.");
      return false;
    }
    if (!metrics.complete) {
      setNotice("Answer every verification question with Yes, No, or N/A.");
      return false;
    }
    if (!metrics.actionsReady) {
      setNotice("Every No response requires containment, an accountable owner, and a due date.");
      return false;
    }
    return true;
  }

  function submitToNorthstar() {
    if (!validate()) return;
    const id = recordId || createRecordId();
    const payload = buildPayload(id);
    const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]") as unknown[];
    window.localStorage.setItem(recordsKey, JSON.stringify([payload, ...records].slice(0, 100)));
    window.localStorage.removeItem(draftKey);
    window.dispatchEvent(new CustomEvent("qmspilot:northstar-submit", { detail: payload }));
    setRecordId(id);
    setSubmitted(true);
    setNotice(`${id} submitted to the Northstar demo workspace. Human closure authority remains active.`);
  }

  function exportRecord() {
    const id = recordId || createRecordId();
    if (!recordId) setRecordId(id);
    const blob = new Blob([JSON.stringify(buildPayload(id), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}-process-assurance.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="pa-shell">
      <header className="pa-header">
        <a href="/" className="back" aria-label="Return to Northstar"><ArrowLeft size={18} /></a>
        <div className="qms-brand"><span className="qms-mark">✓</span><strong>QMSPilot</strong></div>
        <div className="northstar-brand" aria-label="Northstar"><span>NORTHST</span><b>✦</b><span>R</span></div>
        <div className="header-meta"><small>Northstar-connected production tool</small><strong>Process Assurance</strong></div>
        <div className="header-status"><span className="status-dot" />Human supervised</div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow"><Layers3 size={16} /> LAYERED PROCESS AUDIT & VERIFICATION</div>
          <h1>Verify that the process works the way leadership believes it works.</h1>
          <p>Turn observable shop-floor conditions into accountable containment, verified actions, and executive operating intelligence.</p>
          <div className="chips"><span>Tool ID QMSP-PA-001</span><span>Version 1.0.0</span><span>Northstar Ready</span><span>ISO 9001 aligned</span></div>
        </div>
        <div className={`assurance ${assuranceStatus.tone}`}>
          <small>PROCESS ASSURANCE STATUS</small>
          <strong>{assuranceStatus.label}</strong>
          <p>{assuranceStatus.message}</p>
          <div className="assurance-score"><Gauge size={20} /><span>{metrics.score}%</span></div>
        </div>
      </section>

      <section className="toolbar no-print">
        <button onClick={loadDemo}><Sparkles size={17} />Load design-partner demo</button>
        <button onClick={saveDraft}><Save size={17} />Save draft</button>
        <button onClick={() => window.print()}><Printer size={17} />Customer report</button>
        <button onClick={exportRecord}><Download size={17} />Export record</button>
        <button onClick={clearAudit}><RotateCcw size={17} />New audit</button>
        <button className="submit" onClick={submitToNorthstar}><Send size={17} />Submit to Northstar</button>
      </section>

      {notice && <div className={`notice ${submitted ? "submitted" : ""}`}>{submitted ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{notice}</div>}

      <section className="metrics">
        <article><small>Assurance score</small><strong>{metrics.score}%</strong><span>{metrics.applicable} applicable checks</span></article>
        <article><small>Verification complete</small><strong>{metrics.answered}/{questions.length}</strong><span>{metrics.complete ? "Ready for review" : "Audit in progress"}</span></article>
        <article><small>Open findings</small><strong>{metrics.findings.length}</strong><span>{metrics.findings.length ? "Actions required" : "No failures observed"}</span></article>
        <article><small>High-risk exposure</small><strong>{metrics.critical}</strong><span>{metrics.critical ? "Leadership review required" : "No high-risk findings"}</span></article>
        <article><small>Northstar record</small><strong className="record-id">{recordId || "DRAFT"}</strong><span>{submitted ? "Submitted" : "Not submitted"}</span></article>
      </section>

      <section className="panel setup-panel">
        <div className="panel-title"><div><small>01 · AUDIT SETUP</small><h2>Define the operating context</h2></div><Users size={24} /></div>
        <div className="form-grid">
          <label>Organization<input value={setup.organization} onChange={(event) => updateSetup("organization", event.target.value)} /></label>
          <label>Site / facility<input value={setup.site} onChange={(event) => updateSetup("site", event.target.value)} placeholder="Required" /></label>
          <label>Department<input value={setup.department} onChange={(event) => updateSetup("department", event.target.value)} /></label>
          <label>Process being verified<input value={setup.process} onChange={(event) => updateSetup("process", event.target.value)} placeholder="Required" /></label>
          <label>Audit layer<select value={setup.layer} onChange={(event) => updateSetup("layer", event.target.value as AuditLayer)}>{Object.entries(layerLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Auditor<input value={setup.auditor} onChange={(event) => updateSetup("auditor", event.target.value)} placeholder="Required" /></label>
          <label>Audit date<input type="date" value={setup.auditDate} onChange={(event) => updateSetup("auditDate", event.target.value)} /></label>
          <label>Shift<select value={setup.shift} onChange={(event) => updateSetup("shift", event.target.value)}><option>Day</option><option>Night</option><option>Weekend</option><option>Other</option></select></label>
          <label className="wide">Controlled standard / work instruction<input value={setup.standardReference} onChange={(event) => updateSetup("standardReference", event.target.value)} placeholder="Document ID and revision" /></label>
          <label className="wide">Leadership intent<textarea value={setup.leadershipNote} onChange={(event) => updateSetup("leadershipNote", event.target.value)} placeholder="What leadership needs this verification to confirm" /></label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><div><small>02 · PROCESS VERIFICATION</small><h2>Observe the work. Do not audit from a conference room.</h2></div><ClipboardCheck size={24} /></div>
        <div className="layer-banner"><strong>{layerLabels[setup.layer]}</strong><span>Observable evidence · five-to-ten-minute operating verification · human decision authority</span></div>
        <div className="question-list">
          {questions.map((item, index) => (
            <article className={`question ${item.answer === "no" ? "failed" : item.answer === "yes" ? "passed" : ""}`} key={item.id}>
              <div className="question-heading">
                <span className="question-number">{String(index + 1).padStart(2, "0")}</span>
                <div><small>{item.category} · {item.id}</small><h3>{item.question}</h3><p>{item.reference}</p></div>
                <div className="answer-group no-print" aria-label={`Answer ${item.id}`}>
                  <button className={item.answer === "yes" ? "selected yes" : ""} onClick={() => answerQuestion(item.id, "yes")}><CheckCircle2 size={16} />Yes</button>
                  <button className={item.answer === "no" ? "selected no" : ""} onClick={() => answerQuestion(item.id, "no")}><XCircle size={16} />No</button>
                  <button className={item.answer === "na" ? "selected na" : ""} onClick={() => answerQuestion(item.id, "na")}>N/A</button>
                </div>
                <div className="print-answer">{item.answer ? item.answer.toUpperCase() : "UNANSWERED"}</div>
              </div>
              <label className="observation">Observed evidence / note<textarea value={item.note} onChange={(event) => updateQuestion(item.id, { note: event.target.value })} placeholder="Record what was observed, including objective identifiers, dates, revisions, equipment IDs, and employee explanation." /></label>

              {item.answer === "no" && (
                <div className="finding-block">
                  <div className="finding-heading"><AlertTriangle size={20} /><div><strong>Failed verification requires action</strong><span>Immediate containment and accountable follow-through are mandatory.</span></div><em>{escalationFor(item.severity)}</em></div>
                  <div className="form-grid finding-grid">
                    <label>Risk severity<select value={item.severity} onChange={(event) => updateQuestion(item.id, { severity: event.target.value as Severity })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
                    <label>Accountable owner<input value={item.owner} onChange={(event) => updateQuestion(item.id, { owner: event.target.value })} placeholder="Required" /></label>
                    <label>Due date<input type="date" value={item.dueDate} onChange={(event) => updateQuestion(item.id, { dueDate: event.target.value })} /></label>
                    <label className="evidence-upload no-print"><Camera size={17} />Attach photo, video, or record<input type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv" onChange={(event) => attachEvidence(item.id, event)} /></label>
                    <label className="wide">Immediate containment and required response<textarea value={item.containment} onChange={(event) => updateQuestion(item.id, { containment: event.target.value })} placeholder="Required: protect the customer, employee, product, and process before closure." /></label>
                  </div>
                  {item.evidenceNames.length > 0 && <div className="evidence-list"><UploadCloud size={16} />{item.evidenceNames.map((name) => <span key={name}>{name}</span>)}</div>}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="review-grid">
        <article className="panel">
          <div className="panel-title"><div><small>03 · EXECUTIVE REVIEW</small><h2>What Northstar should know</h2></div><ShieldCheck size={24} /></div>
          <div className="executive-summary">
            <div><span>Operating result</span><strong>{assuranceStatus.label}</strong></div>
            <div><span>Process assurance score</span><strong>{metrics.score}%</strong></div>
            <div><span>Findings requiring ownership</span><strong>{metrics.findings.length}</strong></div>
            <div><span>High-risk escalations</span><strong>{metrics.critical}</strong></div>
          </div>
          <p className="pilot-brief"><Sparkles size={18} /><span><strong>Pilot briefing:</strong> {metrics.complete ? metrics.findings.length ? `The ${setup.process || "selected process"} has ${metrics.findings.length} failed verification${metrics.findings.length === 1 ? "" : "s"}. Confirm containment, owner acceptance, and due dates before leadership approval.` : `The ${setup.process || "selected process"} passed all applicable checks. Continue the layered audit rhythm and verify sustained effectiveness.` : "The audit remains incomplete. No executive conclusion should be issued until all requirements are observed."}</span></p>
        </article>

        <article className="panel governance-panel">
          <div className="panel-title"><div><small>04 · GOVERNANCE</small><h2>Human authority remains in control</h2></div><FileCheck2 size={24} /></div>
          <ul>
            <li><CheckCircle2 size={17} />Northstar receives the complete audit record, score, evidence names, owners, and due dates.</li>
            <li><CheckCircle2 size={17} />Critical and high-risk failures recommend CAPA or executive escalation.</li>
            <li><CheckCircle2 size={17} />Medium failures recommend NCR and Accountability Board follow-through.</li>
            <li><CheckCircle2 size={17} />No AI agent may close a finding without authorized human review and objective closure evidence.</li>
          </ul>
          <button className="final-submit no-print" onClick={submitToNorthstar}><Send size={18} />Submit controlled record to Northstar</button>
        </article>
      </section>

      <footer className="pa-footer"><span>QMSPilot Northstar · Process Assurance</span><span>Fortune 500 operating discipline without enterprise complexity.</span></footer>

      <style>{`
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#eaf1f7;color:#10253b}.pa-shell{min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.pa-header{position:sticky;top:0;z-index:50;min-height:72px;display:flex;align-items:center;gap:16px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#061526,#0a3158 65%,#0a66ff);box-shadow:0 10px 28px rgba(2,20,38,.25)}.back{width:40px;height:40px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:11px;color:#fff;background:rgba(255,255,255,.06)}.qms-brand{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:12px;color:#102b49;background:#fff}.qms-mark{width:27px;height:27px;display:grid;place-items:center;border:3px solid #0a66ff;border-radius:50%;color:#0a66ff;font-size:18px;font-weight:1000}.qms-brand strong{font-size:18px}.northstar-brand{display:flex;align-items:center;gap:1px;padding:7px 12px;border-left:1px solid rgba(255,255,255,.2);font-size:18px;font-weight:1000;letter-spacing:.1em;background:linear-gradient(180deg,#fff,#98a7b6);-webkit-background-clip:text;background-clip:text;color:transparent}.northstar-brand b{color:#7fdbff;-webkit-text-fill-color:#7fdbff;text-shadow:0 0 16px #7fdbff}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#a8d5ff;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.header-meta strong{font-size:18px}.header-status{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(93,229,175,.35);border-radius:999px;color:#c9f8e7;background:rgba(38,156,111,.18);font-size:10px;font-weight:850}.status-dot{width:8px;height:8px;border-radius:50%;background:#49d59d;box-shadow:0 0 0 4px rgba(73,213,157,.14)}.hero{display:grid;grid-template-columns:1.45fr .55fr;gap:18px;max-width:1540px;margin:0 auto;padding:30px 24px 18px}.hero>div:first-child{padding:32px;border-radius:24px;color:#fff;background:radial-gradient(circle at 85% 15%,rgba(127,219,255,.24),transparent 30%),linear-gradient(135deg,#061526,#0b3f73 62%,#0a66ff);box-shadow:0 22px 55px rgba(11,54,94,.25)}.eyebrow{display:flex;align-items:center;gap:8px;color:#9dd6ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:15px 0 12px;font-size:clamp(32px,4vw,58px);line-height:1.02}.hero p{max-width:920px;margin:0;color:#d4e7f7;font-size:15px;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:22px}.chips span{padding:7px 9px;border:1px solid rgba(157,214,255,.35);border-radius:999px;color:#dff1ff;background:rgba(255,255,255,.07);font-size:10px;font-weight:800}.assurance{padding:24px;border:1px solid #d7e2ec;border-radius:24px;background:#fff;box-shadow:0 15px 40px rgba(26,61,92,.1)}.assurance small{color:#71869a;font-weight:900;letter-spacing:.11em}.assurance>strong{display:block;margin-top:12px;font-size:29px}.assurance p{margin-top:10px;color:#5d7184;font-size:13px}.assurance-score{display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:14px;border-radius:14px;background:#eef5fb}.assurance-score span{font-size:26px;font-weight:950}.assurance.success>strong,.assurance.success .assurance-score{color:#16835a}.assurance.warning>strong,.assurance.warning .assurance-score{color:#a66a09}.assurance.danger>strong,.assurance.danger .assurance-score{color:#bd3142}.assurance.neutral>strong,.assurance.neutral .assurance-score{color:#1769d2}.toolbar{position:sticky;top:72px;z-index:40;max-width:1492px;margin:0 auto 16px;padding:10px 12px;display:flex;gap:8px;flex-wrap:wrap;border:1px solid #d6e1eb;border-radius:15px;background:rgba(255,255,255,.96);box-shadow:0 10px 28px rgba(17,48,76,.1);backdrop-filter:blur(12px)}.toolbar button,.final-submit{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 13px;border:1px solid #ccd9e5;border-radius:10px;color:#27445f;background:#fff;font-weight:850;cursor:pointer}.toolbar button.submit,.final-submit{margin-left:auto;border-color:#0a66ff;color:#fff;background:linear-gradient(135deg,#0c3e72,#0a66ff)}.notice{max-width:1492px;margin:0 auto 16px;padding:13px 15px;display:flex;align-items:center;gap:9px;border:1px solid #e6c987;border-radius:12px;color:#754d08;background:#fff8e7;font-size:12px;font-weight:750}.notice.submitted{border-color:#9ed6bf;color:#176d4c;background:#effbf6}.metrics{max-width:1492px;margin:0 auto 18px;display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.metrics article{padding:17px;border:1px solid #d9e4ed;border-radius:16px;background:#fff;box-shadow:0 10px 28px rgba(24,55,83,.07)}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#71869a;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.metrics strong{margin-top:8px;font-size:27px}.metrics span{margin-top:4px;color:#647b90;font-size:10px}.metrics .record-id{font-size:17px}.panel{max-width:1492px;margin:0 auto 18px;padding:24px;border:1px solid #d9e4ed;border-radius:20px;background:#fff;box-shadow:0 12px 34px rgba(24,55,83,.08)}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:16px;border-bottom:1px solid #e5edf4}.panel-title small{color:#1769d2;font-size:10px;font-weight:900;letter-spacing:.12em}.panel-title h2{margin:5px 0 0;font-size:25px}.panel-title svg{color:#1769d2}.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}.form-grid label,.observation{display:grid;gap:7px;color:#456078;font-size:10px;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.form-grid input,.form-grid select,.form-grid textarea,.observation textarea{width:100%;min-height:42px;padding:10px 11px;border:1px solid #cddae5;border-radius:10px;color:#142b40;background:#fbfdff;font:inherit;font-size:12px;font-weight:650;letter-spacing:0;text-transform:none;outline:none}.form-grid textarea,.observation textarea{min-height:78px;resize:vertical;line-height:1.45}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.observation textarea:focus{border-color:#0a66ff;box-shadow:0 0 0 3px rgba(10,102,255,.1)}.wide{grid-column:span 2}.layer-banner{display:flex;justify-content:space-between;gap:14px;margin-top:18px;padding:13px 15px;border:1px solid #a8ccee;border-radius:12px;color:#164a78;background:#edf7ff}.layer-banner strong{font-size:13px}.layer-banner span{font-size:11px}.question-list{display:grid;gap:14px;margin-top:18px}.question{padding:18px;border:1px solid #d8e3ed;border-radius:16px;background:#fbfdff}.question.passed{border-color:#a9d9c5;background:#f7fffb}.question.failed{border-color:#efb3bb;background:#fffafb}.question-heading{display:grid;grid-template-columns:48px 1fr auto;gap:14px;align-items:start}.question-number{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;color:#1769d2;background:#eaf4ff;font-size:15px;font-weight:950}.question-heading small{color:#1769d2;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.question-heading h3{margin:5px 0 6px;font-size:16px;line-height:1.4}.question-heading p{margin:0;color:#71869a;font-size:10px}.answer-group{display:flex;gap:6px}.answer-group button{min-height:36px;display:inline-flex;align-items:center;gap:5px;padding:0 10px;border:1px solid #cfdce7;border-radius:9px;color:#536d83;background:#fff;font-size:10px;font-weight:850;cursor:pointer}.answer-group button.selected.yes{border-color:#239366;color:#fff;background:#239366}.answer-group button.selected.no{border-color:#bf3445;color:#fff;background:#bf3445}.answer-group button.selected.na{border-color:#637b91;color:#fff;background:#637b91}.print-answer{display:none}.observation{margin-top:14px}.finding-block{margin-top:16px;padding:16px;border:1px solid #efb3bb;border-radius:14px;background:#fff}.finding-heading{display:flex;align-items:center;gap:10px;color:#8c2936}.finding-heading>div{margin-right:auto}.finding-heading strong,.finding-heading span{display:block}.finding-heading span{margin-top:3px;color:#7b5960;font-size:10px}.finding-heading em{padding:7px 9px;border-radius:999px;color:#8c2936;background:#fff0f2;font-size:9px;font-style:normal;font-weight:900;text-transform:uppercase}.finding-grid{grid-template-columns:repeat(4,1fr)}.evidence-upload{min-height:42px;display:flex!important;align-items:center;justify-content:center;gap:7px;padding:9px;border:1px dashed #8fb9df;border-radius:10px;color:#1769d2!important;background:#edf7ff;cursor:pointer}.evidence-upload input{display:none}.evidence-list{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;color:#456078;font-size:10px}.evidence-list span{padding:5px 8px;border-radius:999px;background:#eef3f7}.review-grid{max-width:1492px;margin:0 auto;display:grid;grid-template-columns:1.15fr .85fr;gap:18px}.review-grid .panel{margin:0}.executive-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}.executive-summary div{padding:14px;border-radius:12px;background:#f1f6fa}.executive-summary span,.executive-summary strong{display:block}.executive-summary span{color:#71869a;font-size:10px}.executive-summary strong{margin-top:5px;font-size:18px}.pilot-brief{display:flex;gap:10px;margin:16px 0 0;padding:15px;border:1px solid #a8ccee;border-radius:13px;color:#244b6c;background:#edf7ff;font-size:12px;line-height:1.55}.pilot-brief svg{flex:0 0 auto;color:#1769d2}.governance-panel ul{display:grid;gap:12px;margin:18px 0;padding:0;list-style:none}.governance-panel li{display:flex;gap:9px;color:#526b80;font-size:12px;line-height:1.5}.governance-panel li svg{flex:0 0 auto;color:#16835a}.final-submit{width:100%;margin-top:8px}.pa-footer{max-width:1492px;margin:18px auto 0;padding:18px 24px;display:flex;justify-content:space-between;gap:16px;color:#8eabc2;background:#071a2c;font-size:10px}.pa-footer span:first-child{color:#7fdbff;font-weight:900}.pa-footer+*{display:none}@media(max-width:1100px){.hero{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}.form-grid,.finding-grid{grid-template-columns:repeat(2,1fr)}.review-grid{grid-template-columns:1fr}.header-meta{display:none}}@media(max-width:720px){.pa-header{gap:8px;padding:9px}.northstar-brand{display:none}.qms-brand{padding:7px}.header-status{display:none}.hero{padding:18px 12px 12px}.hero>div:first-child{padding:24px}.toolbar{top:63px;margin:0 12px 14px}.toolbar button{flex:1}.toolbar button.submit{margin-left:0}.metrics{margin:0 12px 14px;grid-template-columns:1fr 1fr}.panel{margin:0 12px 14px;padding:17px}.form-grid,.finding-grid{grid-template-columns:1fr}.wide{grid-column:auto}.question-heading{grid-template-columns:42px 1fr}.answer-group{grid-column:1/-1}.layer-banner{display:block}.layer-banner span{display:block;margin-top:5px}.review-grid{margin:0 12px}.executive-summary{grid-template-columns:1fr}.pa-footer{margin-top:14px;display:block}.pa-footer span{display:block;margin-top:5px}}@media print{body{background:#fff}.no-print,.pa-header .back,.header-status{display:none!important}.pa-header{position:static;box-shadow:none;background:#071a2c}.hero{padding:18px 0}.hero>div:first-child{box-shadow:none}.metrics,.panel,.review-grid,.pa-footer{max-width:none}.panel,.metrics article{box-shadow:none;break-inside:avoid}.question{break-inside:avoid}.question-heading{grid-template-columns:40px 1fr auto}.print-answer{display:block;padding:6px 8px;border-radius:8px;background:#eef3f7;font-size:10px;font-weight:900}.answer-group{display:none}.review-grid{grid-template-columns:1fr}.pa-footer{color:#10253b;background:#fff;border-top:1px solid #ccd9e5}.pa-footer span:first-child{color:#1769d2}}
      `}</style>
    </main>
  );
}
