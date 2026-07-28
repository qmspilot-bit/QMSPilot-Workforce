"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Barcode,
  BookOpenCheck,
  Boxes,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileSearch,
  FileText,
  Forklift,
  Gauge,
  GraduationCap,
  HardHat,
  History,
  ListChecks,
  MapPin,
  Microscope,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  ScanLine,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Truck,
  Upload,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";
import {
  smartWorkspaceConfigs,
  type FieldDef,
  type WorkflowTool,
  type WorkspaceConfig,
} from "@/lib/smart-workflow-config";

type Evidence = { id: string; name: string; kind: "photo" | "document"; size: number; url?: string };
type RecordMeta = { organization: string; site: string; recordId: string; eventDate: string };
type SubmissionRecord = {
  schema: string;
  workspace: string;
  toolId: string;
  toolName: string;
  recordMeta: RecordMeta;
  procedure: WorkflowTool["procedure"];
  values: Record<string, string>;
  priority: string;
  owner: string;
  dueDate: string;
  controls: Record<string, boolean>;
  approval: { role: string; name: string; decision: string; conditions: string };
  evidence: Omit<Evidence, "url">[];
  status: string;
  submittedAt: string;
};

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle, BarChart3, Barcode, BookOpenCheck, Boxes, Camera, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, FileSearch, FileText, Forklift, Gauge,
  GraduationCap, HardHat, History, ListChecks, MapPin, Microscope, PackageCheck,
  PackageOpen, PackageSearch, RefreshCw, Scale, ScanLine, Search, Settings,
  ShieldAlert, ShieldCheck, Target, Truck, Users, Warehouse, Wrench,
};

const bytes = (value: number) => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => new Date().toISOString().slice(0, 10);

function makeRecordId(config: WorkspaceConfig, tool: WorkflowTool) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${config.discipline.slice(0, 3).toUpperCase()}-${tool.id.slice(0, 4).toUpperCase()}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function visible(field: FieldDef, values: Record<string, string>) {
  if (!field.showWhen) return true;
  const actual = values[field.showWhen.field] ?? "";
  const expected = Array.isArray(field.showWhen.equals) ? field.showWhen.equals : [field.showWhen.equals];
  return expected.includes(actual);
}

function otherSelected(value: string) {
  return value === "Other / customer-defined" || value === "Other controlled work";
}

export default function SmartDisciplineWorkspace({ discipline }: { discipline: string }) {
  const config = smartWorkspaceConfigs[discipline];
  const [selected, setSelected] = useState<WorkflowTool | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  if (!config) return <main style={{ padding: 40, fontFamily: "Arial" }}>Workspace configuration not found.</main>;

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
      <style>{styles}</style>
    </main>
  );
}

function GuidedWorkflow({ config, tool, onBack }: { config: WorkspaceConfig; tool: WorkflowTool; onBack: () => void }) {
  const Icon = iconMap[tool.icon] ?? ClipboardCheck;
  const photoRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const initialValues = Object.fromEntries(tool.fields.map((field) => [field.key, ""]));
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [recordMeta, setRecordMeta] = useState<RecordMeta>({ organization: "QMSPilot Design Partner", site: "Primary Site", recordId: makeRecordId(config, tool), eventDate: today() });
  const [priority, setPriority] = useState("Normal");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [controls, setControls] = useState<Record<string, boolean>>(Object.fromEntries(tool.controls.map((control) => [control, false])));
  const [approvalRole, setApprovalRole] = useState(tool.approvalRoles[0] ?? "Authorized Approver");
  const [approverName, setApproverName] = useState("");
  const [approvalDecision, setApprovalDecision] = useState("");
  const [approvalConditions, setApprovalConditions] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [notice, setNotice] = useState("");
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<SubmissionRecord | null>(null);
  const draftKey = `qmspilot:guided:${config.discipline}:${tool.id}`;

  const visibleFields = useMemo(() => tool.fields.filter((field) => visible(field, values)), [tool.fields, values]);
  const sections = ["Record Context", "Evaluation", "Response & Action", "Closure"] as const;

  const completion = useMemo(() => {
    const requiredChecks = visibleFields.filter((field) => field.required).map((field) => Boolean(values[field.key]?.trim()));
    const otherChecks = visibleFields.filter((field) => otherSelected(values[field.key] ?? "")).map((field) => Boolean(values[`${field.key}_other`]?.trim()));
    const governance = [Boolean(recordMeta.organization.trim()), Boolean(recordMeta.site.trim()), Boolean(recordMeta.recordId.trim()), Boolean(recordMeta.eventDate), Boolean(owner.trim()), Boolean(dueDate), Boolean(approverName.trim()), Boolean(approvalDecision)];
    const controlChecks = tool.controls.map((control) => Boolean(controls[control]));
    const evidenceCheck = tool.evidenceRequired ? [evidence.length > 0] : [];
    const all = [...requiredChecks, ...otherChecks, ...governance, ...controlChecks, ...evidenceCheck];
    return all.length ? Math.round((all.filter(Boolean).length / all.length) * 100) : 0;
  }, [visibleFields, values, recordMeta, owner, dueDate, approverName, approvalDecision, tool.controls, controls, tool.evidenceRequired, evidence.length]);

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as {
        values?: Record<string, string>; recordMeta?: RecordMeta; priority?: string; owner?: string; dueDate?: string;
        controls?: Record<string, boolean>; approvalRole?: string; approverName?: string; approvalDecision?: string;
        approvalConditions?: string; evidence?: Omit<Evidence, "url">[];
      };
      if (draft.values) setValues({ ...initialValues, ...draft.values });
      if (draft.recordMeta) setRecordMeta(draft.recordMeta);
      if (draft.priority) setPriority(draft.priority);
      if (draft.owner) setOwner(draft.owner);
      if (draft.dueDate) setDueDate(draft.dueDate);
      if (draft.controls) setControls(draft.controls);
      if (draft.approvalRole) setApprovalRole(draft.approvalRole);
      if (draft.approverName) setApproverName(draft.approverName);
      if (draft.approvalDecision) setApprovalDecision(draft.approvalDecision);
      if (draft.approvalConditions) setApprovalConditions(draft.approvalConditions);
      if (draft.evidence) setEvidence(draft.evidence.map((item) => ({ ...item })));
      setNotice("Saved draft restored. Attached file names were restored; reattach files before final submission if the browser session changed.");
    } catch { window.localStorage.removeItem(draftKey); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSubmitted(null);
    setValidationIssues([]);
  };

  const addFiles = (kind: Evidence["kind"], files: FileList | null) => {
    if (!files?.length) return;
    const additions = Array.from(files).map((file) => ({
      id: uid(), name: file.name, kind, size: file.size,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setEvidence((current) => [...current, ...additions]);
    setNotice(`${additions.length} evidence file${additions.length === 1 ? "" : "s"} attached.`);
  };

  const saveDraft = () => {
    const draft = { values, recordMeta, priority, owner, dueDate, controls, approvalRole, approverName, approvalDecision, approvalConditions, evidence: evidence.map(({ url: _url, ...item }) => item), savedAt: new Date().toISOString() };
    window.localStorage.setItem(draftKey, JSON.stringify(draft));
    setNotice("Guided workflow draft saved in this browser.");
  };

  const clearRecord = () => {
    setValues(initialValues);
    setRecordMeta({ organization: "QMSPilot Design Partner", site: "Primary Site", recordId: makeRecordId(config, tool), eventDate: today() });
    setPriority("Normal"); setOwner(""); setDueDate("");
    setControls(Object.fromEntries(tool.controls.map((control) => [control, false])));
    setApprovalRole(tool.approvalRoles[0] ?? "Authorized Approver"); setApproverName(""); setApprovalDecision(""); setApprovalConditions("");
    setEvidence([]); setValidationIssues([]); setSubmitted(null); window.localStorage.removeItem(draftKey); setNotice("New controlled record started.");
  };

  const validate = () => {
    const issues: string[] = [];
    if (!recordMeta.organization.trim()) issues.push("Organization");
    if (!recordMeta.site.trim()) issues.push("Site");
    if (!recordMeta.recordId.trim()) issues.push("Record ID");
    if (!recordMeta.eventDate) issues.push("Event / record date");
    visibleFields.filter((field) => field.required).forEach((field) => {
      if (!values[field.key]?.trim()) issues.push(field.label);
      if (otherSelected(values[field.key] ?? "") && !values[`${field.key}_other`]?.trim()) issues.push(`${field.label} - customer-defined detail`);
    });
    if (!owner.trim()) issues.push("Accountable owner");
    if (!dueDate) issues.push("Due / review date");
    tool.controls.forEach((control) => { if (!controls[control]) issues.push(control); });
    if (tool.evidenceRequired && evidence.length === 0) issues.push("Required objective evidence");
    if (!approverName.trim()) issues.push("Approver name");
    if (!approvalDecision) issues.push("Approval decision");
    if (approvalDecision === "Approved with conditions" && !approvalConditions.trim()) issues.push("Approval conditions");
    setValidationIssues(issues);
    return issues;
  };

  const buildRecord = (): SubmissionRecord => ({
    schema: "qmspilot.northstar.guided-workflow.v2", workspace: config.name, toolId: tool.id, toolName: tool.name,
    recordMeta, procedure: tool.procedure, values, priority, owner, dueDate, controls,
    approval: { role: approvalRole, name: approverName, decision: approvalDecision, conditions: approvalConditions },
    evidence: evidence.map(({ url: _url, ...item }) => item),
    status: approvalDecision === "Approved" || approvalDecision === "Approved with conditions" ? "Submitted / approved" : "Submitted / returned",
    submittedAt: new Date().toISOString(),
  });

  const submitToNorthstar = () => {
    const issues = validate();
    if (issues.length) { setNotice(`Submission blocked: ${issues.length} required item${issues.length === 1 ? " is" : "s are"} incomplete.`); return; }
    const record = buildRecord();
    const recordsKey = "qmspilot:northstar:guided-records";
    const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]") as SubmissionRecord[];
    window.localStorage.setItem(recordsKey, JSON.stringify([record, ...records].slice(0, 250)));
    window.localStorage.removeItem(draftKey);
    window.dispatchEvent(new CustomEvent("qmspilot:record-submitted", { detail: record }));
    setSubmitted(record);
    setNotice("Controlled record, approvals, evidence manifest, and audit context submitted to Northstar.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const assignAction = () => {
    if (!owner.trim() || !dueDate) { setNotice("Enter an accountable owner and due date before assigning the action."); return; }
    const action = { id: `ACT-${uid()}`, sourceRecord: recordMeta.recordId, sourceTool: tool.name, owner, dueDate, priority, status: "Open", createdAt: new Date().toISOString() };
    const key = "qmspilot:northstar:assigned-actions";
    const actions = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
    window.localStorage.setItem(key, JSON.stringify([action, ...actions].slice(0, 250)));
    window.dispatchEvent(new CustomEvent("qmspilot:action-assigned", { detail: action }));
    setNotice(`Action assigned to ${owner} with a due date of ${dueDate}.`);
  };

  const guidance = useMemo(() => {
    const messages: string[] = [];
    if (completion < 35) messages.push("Start with record context and the requirement or expected condition before selecting a response.");
    if (priority === "Critical") messages.push("Critical priority requires immediate leadership escalation and documented containment before routine processing continues.");
    if (visibleFields.some((field) => field.key === "shipped" && values[field.key] === "Yes")) messages.push("Potential customer escape detected: complete the customer-impact evaluation and obtain authorized communication approval.");
    if (tool.evidenceRequired && evidence.length === 0) messages.push("Objective evidence is required for this workflow. Attach photographs, records, measurements, or approval evidence before submission.");
    if (approvalDecision === "Approved with conditions" && !approvalConditions.trim()) messages.push("Document the conditions, restrictions, or follow-up required by the approver.");
    if (!messages.length) messages.push("The record is progressing correctly. Complete closure controls and authorized approval before submitting to Northstar.");
    return messages.slice(0, 3);
  }, [completion, priority, visibleFields, values, tool.evidenceRequired, evidence.length, approvalDecision, approvalConditions]);

  return (
    <section className="guided-workflow">
      <button className="guided-back" onClick={onBack}><ArrowLeft size={16} /> Back to {config.name}</button>
      <div className="guided-head">
        <span><Icon size={29} /></span>
        <div><small>{tool.group.toUpperCase()}</small><h1>{tool.name}</h1><p>{tool.description}</p></div>
        <div className="completion"><strong>{completion}%</strong><small>record readiness</small><div><i style={{ width: `${completion}%` }} /></div></div>
      </div>
      {notice && <div className="guided-notice"><Sparkles size={17} /><span>{notice}</span></div>}
      {submitted && <div className="guided-success"><CheckCircle2 size={24} /><div><strong>Submitted to Northstar</strong><span>{submitted.recordMeta.recordId} · {submitted.status} · {new Date(submitted.submittedAt).toLocaleString()}</span></div></div>}

      <section className="procedure-banner">
        <div><BookOpenCheck size={25} /><span><small>APPLICABLE CONTROLLED PROCEDURE</small><strong>{tool.procedure.id} · {tool.procedure.title}</strong><em>{tool.procedure.revision} · Owner: {tool.procedure.owner}</em></span></div>
        <div className="standard-tags">{tool.procedure.standards.map((standard) => <span key={standard}>{standard}</span>)}</div>
        <p>This is the QMSPilot baseline workflow. During customer onboarding, procedure ID, revision, terminology, options, approval authority, risk thresholds, and retention rules can be configured without changing the operating experience.</p>
      </section>

      <section className="stage-strip">
        {tool.stages.map((stage, index) => <button className={index === currentStage ? "active" : index < currentStage ? "complete" : ""} onClick={() => setCurrentStage(index)} key={stage}><span>{index < currentStage ? "✓" : index + 1}</span><strong>{stage}</strong></button>)}
      </section>

      <div className="guided-layout">
        <div className="guided-form-column">
          <article className="guided-card control-card">
            <div className="guided-title"><div><small>RECORD CONTROL</small><h2>Identity, context, and accountability</h2></div><FileText /></div>
            <div className="record-grid">
              <label>Organization *<input value={recordMeta.organization} onChange={(event) => setRecordMeta((current) => ({ ...current, organization: event.target.value }))} /></label>
              <label>Site *<input value={recordMeta.site} onChange={(event) => setRecordMeta((current) => ({ ...current, site: event.target.value }))} /></label>
              <label>Record ID *<input value={recordMeta.recordId} onChange={(event) => setRecordMeta((current) => ({ ...current, recordId: event.target.value }))} /></label>
              <label>Event / record date *<input type="date" value={recordMeta.eventDate} onChange={(event) => setRecordMeta((current) => ({ ...current, eventDate: event.target.value }))} /></label>
              <label>Priority / risk routing<select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Normal</option><option>High</option><option>Critical</option></select></label>
              <label>Accountable owner *<input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Named person or accountable role" /></label>
              <label>Due / review date *<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            </div>
          </article>

          {sections.map((section) => {
            const fields = visibleFields.filter((field) => field.section === section);
            if (!fields.length) return null;
            return (
              <article className="guided-card" key={section}>
                <div className="guided-title"><div><small>{section.toUpperCase()}</small><h2>{section === "Record Context" ? "Define the controlled activity" : section === "Evaluation" ? "Evaluate facts, requirements, and risk" : section === "Response & Action" ? "Control the response and assigned action" : "Verify results and closure conditions"}</h2></div><ClipboardCheck /></div>
                <div className="field-grid">
                  {fields.map((field) => <GuidedField key={field.key} field={field} value={values[field.key] ?? ""} otherValue={values[`${field.key}_other`] ?? ""} onChange={(value) => updateValue(field.key, value)} onOtherChange={(value) => updateValue(`${field.key}_other`, value)} />)}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="guided-side">
          <article className="guided-card evidence-card">
            <div className="guided-title"><div><small>OBJECTIVE EVIDENCE</small><h2>{evidence.length} file{evidence.length === 1 ? "" : "s"} attached</h2></div><Camera /></div>
            <div className={`evidence-requirement ${tool.evidenceRequired ? "required" : "optional"}`}><strong>{tool.evidenceRequired ? "Required before submission" : "Available when needed"}</strong><span>Attach records that prove the condition, decision, action, verification, or approval.</span></div>
            <div className="evidence-guidance">{tool.evidenceGuidance.map((item) => <span key={item}>• {item}</span>)}</div>
            <div className="evidence-buttons">
              <button onClick={() => photoRef.current?.click()}><Camera size={16} /> Attach photos</button>
              <button onClick={() => documentRef.current?.click()}><Upload size={16} /> Attach documents</button>
              <input hidden ref={photoRef} type="file" accept="image/*" multiple capture="environment" onChange={(event: ChangeEvent<HTMLInputElement>) => addFiles("photo", event.target.files)} />
              <input hidden ref={documentRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,image/*" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => addFiles("document", event.target.files)} />
            </div>
            {evidence.length > 0 && <div className="evidence-list">{evidence.map((item) => <div key={item.id}>{item.url ? <img src={item.url} alt="Evidence preview" /> : <span><FileText size={17} /></span>}<p><strong>{item.name}</strong><small>{item.kind.toUpperCase()} · {bytes(item.size)}</small></p><button onClick={() => setEvidence((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={14} /></button></div>)}</div>}
          </article>

          <article className="guided-card gate-card">
            <div className="guided-title"><div><small>CLOSURE GATES</small><h2>Required process controls</h2></div><ShieldCheck /></div>
            {tool.controls.map((control) => <label key={control}><input type="checkbox" checked={Boolean(controls[control])} onChange={(event) => setControls((current) => ({ ...current, [control]: event.target.checked }))} /><span>{control}</span></label>)}
          </article>

          <article className="guided-card approval-card">
            <div className="guided-title"><div><small>HUMAN AUTHORITY</small><h2>Approval and closure decision</h2></div><Users /></div>
            <label>Approval role *<select value={approvalRole} onChange={(event) => setApprovalRole(event.target.value)}>{tool.approvalRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label>Approver name *<input value={approverName} onChange={(event) => setApproverName(event.target.value)} placeholder="Named authorized person" /></label>
            <label>Decision *<select value={approvalDecision} onChange={(event) => setApprovalDecision(event.target.value)}><option value="">Select decision</option><option>Approved</option><option>Approved with conditions</option><option>Rejected</option><option>Returned for revision</option></select></label>
            {(approvalDecision === "Approved with conditions" || approvalDecision === "Returned for revision" || approvalDecision === "Rejected") && <label>Conditions / reason *<textarea value={approvalConditions} onChange={(event) => setApprovalConditions(event.target.value)} placeholder="Document restrictions, conditions, rejection reason, or required revision" /></label>}
          </article>

          <article className="guided-card ai-card">
            <div className="guided-title"><div><small>PILOT GUIDANCE</small><h2>Workflow coaching</h2></div><Sparkles /></div>
            {guidance.map((message) => <p key={message}>{message}</p>)}
            <small>AI guidance supports the process. Qualified humans retain authority for disposition, release, customer commitments, regulatory decisions, and closure.</small>
          </article>

          <article className="guided-card escalation-card">
            <div className="guided-title"><div><small>ESCALATION LOGIC</small><h2>Conditions that require routing</h2></div><AlertTriangle /></div>
            {tool.escalations.map((rule) => <div key={rule.when}><strong>{rule.when}</strong><span>{rule.route}</span></div>)}
          </article>
        </aside>
      </div>

      {validationIssues.length > 0 && <section className="validation-box"><AlertTriangle size={20} /><div><strong>Submission is blocked until the required controls are complete.</strong><p>{validationIssues.slice(0, 8).join(" · ")}{validationIssues.length > 8 ? ` · +${validationIssues.length - 8} more` : ""}</p></div></section>}

      <div className="guided-actions">
        <button className="secondary" onClick={saveDraft}><Save size={16} /> Save draft</button>
        <button className="secondary" onClick={() => window.print()}><Printer size={16} /> Generate PDF / Print</button>
        <button className="secondary" onClick={assignAction}><Target size={16} /> Assign action</button>
        <button className="secondary danger" onClick={clearRecord}><RotateCcw size={16} /> New record</button>
        <button className="primary" onClick={submitToNorthstar}><Send size={16} /> Submit to Northstar</button>
      </div>
    </section>
  );
}

function GuidedField({ field, value, otherValue, onChange, onOtherChange }: { field: FieldDef; value: string; otherValue: string; onChange: (value: string) => void; onOtherChange: (value: string) => void }) {
  const required = field.required ? " *" : "";
  return (
    <label className={field.type === "textarea" ? "wide" : ""}>
      <span>{field.label}{required}</span>
      {field.type === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select an option</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
      ) : field.type === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`} />
      ) : (
        <input type={field.type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder ?? (field.type === "date" ? undefined : `Enter ${field.label.toLowerCase()}`)} />
      )}
      {field.help && <small>{field.help}</small>}
      {otherSelected(value) && <textarea className="other-detail" value={otherValue} onChange={(event) => onOtherChange(event.target.value)} placeholder="Enter the customer-defined value and any required explanation *" />}
    </label>
  );
}

const styles = `
*{box-sizing:border-box}body{margin:0;background:#edf3f8}.smart-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.smart-sidebar{position:fixed;inset:0 auto 0 0;width:258px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744)}.smart-logo,.smart-northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.smart-northstar{margin-top:8px;background:#020914}.smart-logo img,.smart-northstar img{max-width:190px;max-height:48px}.smart-sidebar nav{display:grid;gap:6px;margin-top:18px}.smart-sidebar nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.smart-sidebar nav a.active{color:#fff;background:#0d4a7c}.smart-status{display:grid;gap:10px;margin-top:22px;padding-top:17px;border-top:1px solid #28475f;color:#c6d9e8;font-size:10px}.smart-status small{color:#7fa9ca;letter-spacing:.12em;font-weight:900}.smart-main{margin-left:258px}.smart-topbar{min-height:68px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.smart-topbar>div{margin-right:auto}.smart-topbar small,.smart-topbar strong{display:block}.smart-topbar small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.smart-topbar a{display:flex;align-items:center;gap:6px;color:#315f80;text-decoration:none;font-size:10px;font-weight:850}.smart-topbar>span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.smart-content{max-width:1540px;margin:0 auto;padding:24px 24px 80px}.smart-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}.smart-hero>div:first-child{padding:30px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.22)}.smart-hero small,.smart-heading small,.smart-section-head small,.guided-title small,.guided-head small,.procedure-banner small{color:#5baeff;font-size:9px;font-weight:900;letter-spacing:.12em}.smart-hero h1{max-width:950px;margin:14px 0 12px;font-size:clamp(31px,4vw,54px);line-height:1.03}.smart-hero p{max-width:960px;margin:0;color:#d6e8f6;line-height:1.65}.smart-hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:21px}.smart-hero-actions button,.guided-back,.guided-actions button,.evidence-buttons button{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 13px;border:1px solid #c6d6e2;border-radius:10px;color:#09223b;background:#fff;font-size:11px;font-weight:850;cursor:pointer}.smart-hero-actions .outline{border-color:#72afe1;color:#fff;background:transparent}.smart-health{display:grid;place-items:center;align-content:center;padding:24px;border:1px solid #d8e4ed;border-radius:22px;background:#fff;text-align:center}.smart-health>small{color:#71879a}.smart-ring{width:170px;height:170px;display:grid;place-items:center;margin:16px 0;border-radius:50%;background:conic-gradient(#0a66ff 313deg,#dce7ef 0)}.smart-ring>div{width:130px;height:130px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.smart-ring strong,.smart-ring span{display:block}.smart-ring strong{font-size:48px;line-height:1}.smart-ring span{color:#74899b;font-size:10px}.smart-health b{color:#176747}.smart-health em{margin-top:5px;color:#71869a;font-size:9px;font-style:normal}.smart-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:12px;margin-top:16px}.smart-metrics article,.smart-panel,.smart-tool,.guided-card{border:1px solid #dbe5ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.smart-metrics article{padding:16px}.smart-metrics small,.smart-metrics strong,.smart-metrics span{display:block}.smart-metrics small{color:#70869a;font-size:9px;font-weight:900;text-transform:uppercase}.smart-metrics strong{margin-top:7px;font-size:27px}.smart-metrics span{margin-top:4px;color:#60788c;font-size:9px}.smart-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:17px;margin-top:17px}.smart-panel{padding:19px}.smart-heading,.smart-section-head,.guided-title{display:flex;align-items:center;justify-content:space-between;gap:10px}.smart-heading h2,.smart-section-head h2,.guided-title h2{margin:5px 0 0}.smart-insights,.smart-queues{display:grid;gap:9px;margin-top:15px}.smart-insights>div{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:11px;border:1px solid #dce5ed;border-radius:12px}.smart-insights span{font-weight:900;color:#0a66ff}.smart-insights p{margin:0;font-size:11px;line-height:1.5}.smart-insights em{padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900;font-style:normal}.smart-insights .high{color:#8f1f2c;background:#ffe7ea}.smart-insights .medium{color:#85520a;background:#fff0d5}.smart-queues>div{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:11px;border-bottom:1px solid #e3ebf1}.smart-queues strong{font-size:18px}.smart-queues em{grid-column:1/3;color:#71879a;font-size:9px;font-style:normal}.workflow-standard{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:center;margin-top:18px;padding:18px;border:1px solid #9dc9ed;border-radius:17px;background:linear-gradient(135deg,#eaf5ff,#fff)}.workflow-standard>div{display:flex;align-items:center;gap:11px}.workflow-standard span small,.workflow-standard span strong{display:block}.workflow-standard span small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.workflow-standard p{margin:0;color:#557086;font-size:10px;line-height:1.6}.smart-section-head{align-items:end;margin:25px 0 12px}.smart-section-head>span{color:#61798d;font-size:10px}.smart-filters{display:grid;grid-template-columns:1fr 250px;gap:10px;margin-bottom:13px}.smart-filters label{display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid #ccdce8;border-radius:11px;background:#fff}.smart-filters input,.smart-filters select{width:100%;min-height:44px;border:0;outline:0;background:transparent}.smart-filters>select{padding:0 11px;border:1px solid #ccdce8;border-radius:11px;background:#fff}.smart-tool-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:14px}.smart-tool{min-height:310px;display:flex;flex-direction:column;padding:18px;text-align:left;cursor:pointer}.smart-tool:hover{transform:translateY(-2px);border-color:#8fc3ed}.smart-tool>div:first-child{display:flex;align-items:center;justify-content:space-between}.smart-tool>div:first-child span{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;color:#0a66ff;background:#e8f3ff}.smart-tool em{color:#60788c;font-size:9px;font-style:normal;font-weight:900;text-transform:uppercase}.smart-tool h3{margin:16px 0 7px}.smart-tool p{margin:0;color:#60788c;font-size:11px;line-height:1.58}.tool-control-row{display:flex!important;flex-wrap:wrap!important;justify-content:flex-start!important;gap:6px;margin-top:14px}.tool-control-row small{padding:5px 7px;border-radius:999px;color:#315f80;background:#edf5fb;font-size:8px;font-weight:850}.smart-tool b{display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:17px;color:#0a66ff;font-size:10px}.guided-back{margin-bottom:12px;color:#315f80}.guided-head{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:23px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 64%,#0a66ff)}.guided-head>span{width:58px;height:58px;display:grid;place-items:center;border-radius:16px;background:rgba(255,255,255,.13)}.guided-head h1{margin:5px 0;font-size:31px}.guided-head p{margin:0;color:#d8e9f6;font-size:11px;line-height:1.55}.completion{min-width:150px;text-align:right}.completion strong,.completion small{display:block}.completion strong{font-size:31px}.completion small{color:#b9d9ee}.completion>div{height:7px;margin-top:8px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden}.completion i{display:block;height:100%;border-radius:999px;background:#fff}.guided-notice,.guided-success{display:flex;align-items:center;gap:10px;margin-top:12px;padding:12px 14px;border-radius:12px}.guided-notice{color:#174d78;background:#e9f5ff;border:1px solid #9cc7e9;font-size:11px;font-weight:800}.guided-success{color:#176747;background:#e4f8ef;border:1px solid #9ccfb9}.guided-success strong,.guided-success span{display:block}.guided-success span{margin-top:3px;font-size:9px}.procedure-banner{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-top:14px;padding:18px;border:1px solid #c8ddea;border-radius:17px;background:#fff}.procedure-banner>div:first-child{display:flex;align-items:center;gap:11px}.procedure-banner span strong,.procedure-banner span em,.procedure-banner span small{display:block}.procedure-banner span em{margin-top:3px;color:#6c8396;font-size:9px;font-style:normal}.standard-tags{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.standard-tags span{padding:6px 8px;border-radius:999px;color:#315f80;background:#edf5fb;font-size:8px;font-weight:850}.procedure-banner>p{grid-column:1/3;margin:0;padding-top:11px;border-top:1px solid #e4ebf1;color:#5a7286;font-size:10px;line-height:1.55}.stage-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:7px;margin-top:13px}.stage-strip button{display:flex;align-items:center;gap:8px;min-height:48px;padding:8px;border:1px solid #d4e1ea;border-radius:11px;color:#577087;background:#fff;text-align:left;cursor:pointer}.stage-strip button span{width:26px;height:26px;display:grid;place-items:center;flex:0 0 auto;border-radius:8px;background:#edf3f7;font-size:9px;font-weight:950}.stage-strip button strong{font-size:9px}.stage-strip button.active{border-color:#0a66ff;color:#0a5cac;background:#edf6ff}.stage-strip button.active span,.stage-strip button.complete span{color:#fff;background:#0a66ff}.guided-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.65fr);gap:15px;margin-top:15px}.guided-form-column,.guided-side{display:grid;align-content:start;gap:14px}.guided-card{padding:18px}.guided-title{margin-bottom:14px}.guided-title svg{color:#0a66ff}.record-grid,.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.record-grid label,.field-grid label,.approval-card label{display:grid;gap:6px;color:#425e73;font-size:9px;font-weight:900}.field-grid label.wide{grid-column:1/3}.record-grid input,.record-grid select,.field-grid input,.field-grid select,.field-grid textarea,.approval-card input,.approval-card select,.approval-card textarea{width:100%;min-height:43px;padding:10px 11px;border:1px solid #cbdbe7;border-radius:10px;color:#10263a;background:#fbfdff;font:inherit;font-size:11px;font-weight:500;outline:none}.field-grid textarea,.approval-card textarea{min-height:92px;resize:vertical}.field-grid label>small{color:#7890a2;font-size:8px;font-weight:600;line-height:1.4}.other-detail{margin-top:5px;border-color:#f0bd65!important;background:#fffaf0!important}.evidence-requirement{display:grid;gap:4px;padding:11px;border-radius:11px}.evidence-requirement.required{color:#8a3e18;background:#fff0e4}.evidence-requirement.optional{color:#176747;background:#e6f7ef}.evidence-requirement span{font-size:9px;line-height:1.4}.evidence-guidance{display:grid;gap:5px;margin:11px 0;color:#5e768a;font-size:9px}.evidence-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}.evidence-buttons button{justify-content:center;color:#174d78;background:#eef7ff}.evidence-list{display:grid;gap:7px;margin-top:10px}.evidence-list>div{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:8px;border:1px solid #dce6ed;border-radius:10px}.evidence-list img,.evidence-list>div>span{width:39px;height:39px;display:grid;place-items:center;border-radius:8px;object-fit:cover;background:#edf3f7}.evidence-list p{min-width:0;margin:0}.evidence-list strong,.evidence-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.evidence-list strong{font-size:9px}.evidence-list small{margin-top:3px;color:#71869a;font-size:7px}.evidence-list button{border:0;color:#9b3440;background:transparent;cursor:pointer}.gate-card>label{display:flex;align-items:flex-start;gap:9px;padding:10px 0;border-bottom:1px solid #e8eef3;color:#405d73;font-size:10px;line-height:1.45}.gate-card input{margin-top:2px}.approval-card{display:grid;gap:10px}.approval-card .guided-title{margin-bottom:4px}.ai-card{color:#174d78;background:linear-gradient(145deg,#e9f5ff,#fff)}.ai-card p{margin:7px 0;padding-left:10px;border-left:3px solid #0a66ff;font-size:10px;line-height:1.5}.ai-card>small{display:block;margin-top:10px;color:#688197;font-size:8px;line-height:1.5}.escalation-card>div:not(.guided-title){display:grid;gap:4px;padding:10px 0;border-bottom:1px solid #e8eef3}.escalation-card strong{font-size:9px}.escalation-card span{color:#647c90;font-size:8px;line-height:1.4}.validation-box{display:flex;gap:11px;margin-top:14px;padding:15px;border:1px solid #e7a6ad;border-radius:13px;color:#8e2734;background:#fff0f2}.validation-box p{margin:5px 0 0;font-size:9px;line-height:1.5}.guided-actions{position:sticky;bottom:0;z-index:10;display:flex;gap:8px;flex-wrap:wrap;margin-top:15px;padding:13px;border:1px solid #cedde8;border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 -10px 30px rgba(22,52,76,.1);backdrop-filter:blur(8px)}.guided-actions button.secondary{color:#315f80}.guided-actions button.danger{color:#94323e}.guided-actions button.primary{margin-left:auto;border-color:#0a66ff;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8)}@media(max-width:1000px){.guided-layout{grid-template-columns:1fr}.guided-side{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:820px){.smart-sidebar{position:static;width:auto;height:auto}.smart-main{margin-left:0}.smart-hero{grid-template-columns:1fr}.smart-two{grid-template-columns:1fr}.smart-filters{grid-template-columns:1fr}.guided-head{grid-template-columns:auto 1fr}.completion{grid-column:1/3;text-align:left}.procedure-banner{grid-template-columns:1fr}.procedure-banner>p{grid-column:1}.standard-tags{justify-content:flex-start}.record-grid,.field-grid{grid-template-columns:1fr}.field-grid label.wide{grid-column:1}.guided-side{grid-template-columns:1fr}.guided-actions{position:static}.guided-actions button.primary{margin-left:0}}@media print{.smart-sidebar,.smart-topbar,.guided-back,.guided-actions,.evidence-buttons{display:none!important}.smart-main{margin-left:0}.smart-content{padding:0}.guided-layout{grid-template-columns:1fr}.guided-card,.procedure-banner,.guided-head{box-shadow:none;break-inside:avoid}}
`;