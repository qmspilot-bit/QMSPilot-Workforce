"use client";

import {
  AlertTriangle, ArrowLeft, Barcode, BookOpenCheck, Camera, CheckCircle2, ClipboardCheck,
  FileText, LocateFixed, MapPin, Mic, PenLine, Play, Printer, RotateCcw, Save, Send,
  ShieldCheck, Sparkles, Square, Target, Trash2, Upload, Users, Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";
import { ScannerModal, SignatureModal } from "./CaptureModals";
import { EnterpriseFunctionPanel, deriveEnterpriseMetrics } from "./EnterpriseFunctionPanel";
import {
  bytes, iconMap, makeRecordId, otherSelected, today, uid, visible,
  type Evidence, type RecordMeta, type ScanResult, type SubmissionRecord,
} from "./shared";

export function GuidedWorkflow({ config, tool, onBack }: { config: WorkspaceConfig; tool: WorkflowTool; onBack: () => void }) {
  const Icon = iconMap[tool.icon] ?? ClipboardCheck;
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const visionRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audio = useRef<Blob[]>([]);

  const blank = Object.fromEntries(tool.fields.map(field => [field.key, ""]));
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [meta, setMeta] = useState<RecordMeta>({ organization: "QMSPilot Design Partner", site: "Primary Site", recordId: makeRecordId(config, tool), eventDate: today() });
  const [priority, setPriority] = useState("Normal");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>(Object.fromEntries(tool.controls.map(control => [control, false])));
  const [role, setRole] = useState(tool.approvalRoles[0] || "Authorized Approver");
  const [approver, setApprover] = useState("");
  const [decision, setDecision] = useState("");
  const [conditions, setConditions] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [notice, setNotice] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<SubmissionRecord | null>(null);
  const [scanner, setScanner] = useState(false);
  const [signature, setSignature] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stage, setStage] = useState(0);

  const key = `qmspilot:guided:${config.discipline}:${tool.id}:specialized`;
  const fields = useMemo(() => tool.fields.filter(field => visible(field, values)), [tool.fields, values]);
  const sections = ["Record Context", "Evaluation", "Response & Action", "Closure"] as const;

  const completion = useMemo(() => {
    const items = [
      ...fields.filter(field => field.required).map(field => Boolean(values[field.key]?.trim())),
      ...tool.controls.map(control => Boolean(checks[control])),
      Boolean(meta.organization), Boolean(meta.site), Boolean(meta.recordId), Boolean(meta.eventDate),
      Boolean(owner), Boolean(due), Boolean(approver), Boolean(decision),
      ...(tool.evidenceRequired ? [evidence.length > 0] : []),
    ];
    return Math.round(items.filter(Boolean).length / Math.max(items.length, 1) * 100);
  }, [fields, values, tool.controls, tool.evidenceRequired, checks, meta, owner, due, approver, decision, evidence.length]);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(key) || "null");
      if (!draft) return;
      setValues({ ...blank, ...draft.values });
      setMeta(draft.meta || meta);
      setPriority(draft.priority || "Normal");
      setOwner(draft.owner || "");
      setDue(draft.due || "");
      setChecks(draft.checks || checks);
      setRole(draft.role || role);
      setApprover(draft.approver || "");
      setDecision(draft.decision || "");
      setConditions(draft.conditions || "");
      setEvidence((draft.evidence || []).map((item: Evidence) => ({ ...item, url: undefined })));
      setNotice("Saved specialized draft restored. Reattach source files when working from another browser session.");
    } catch {
      localStorage.removeItem(key);
    }
  }, []);

  useEffect(() => () => {
    evidence.forEach(item => item.url && URL.revokeObjectURL(item.url));
  }, []);

  const setValue = (fieldKey: string, value: string) => {
    setValues(current => ({ ...current, [fieldKey]: value }));
    setIssues([]);
    setSubmitted(null);
  };

  const addEvidence = (kind: Evidence["kind"], files: FileList | null, note?: string) => {
    if (!files?.length) return;
    const added = Array.from(files).map(file => ({
      id: uid(), kind, name: file.name, size: file.size,
      url: file.type.startsWith("image/") || kind === "video" || kind === "audio" ? URL.createObjectURL(file) : undefined,
      note,
    }));
    setEvidence(current => [...current, ...added]);
    setNotice(`${added.length} evidence item${added.length === 1 ? "" : "s"} attached.`);
  };

  const applyScan = (result: ScanResult) => {
    const next = { ...values };
    const normalized = Object.fromEntries(Object.entries(result.fields).map(([name, value]) => [name.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
    fields.forEach(field => {
      const searchable = `${field.key}${field.label}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = Object.keys(normalized).find(name => searchable.includes(name) || name.includes(field.key.replace(/_/g, "")));
      if (match && !next[field.key]) next[field.key] = normalized[match];
    });
    if (!Object.keys(result.fields).length && fields[0]) next[fields[0].key] = result.raw;
    setValues(next);
    setEvidence(current => [...current, { id: uid(), kind: "scan", name: "Barcode / QR capture", size: result.raw.length, note: result.raw }]);
    setScanner(false);
    setNotice("Scan captured and matching specialized fields populated.");
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audio.current = [];
      recorder.ondataavailable = event => event.data.size && audio.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(audio.current, { type: recorder.mimeType || "audio/webm" });
        setEvidence(current => [...current, { id: uid(), kind: "audio", name: `${config.discipline}-voice-note-${Date.now()}.webm`, size: blob.size, url: URL.createObjectURL(blob) }]);
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setNotice("Voice-note evidence attached.");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setNotice("Microphone access was unavailable.");
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) return setNotice("Location capture is not supported on this device.");
    navigator.geolocation.getCurrentPosition(position => {
      const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} · ±${Math.round(position.coords.accuracy)} m`;
      setEvidence(current => [...current, { id: uid(), kind: "location", name: "Verified work location", size: location.length, note: location }]);
      setNotice("Location evidence captured.");
    }, () => setNotice("Location permission was not granted."));
  };

  const saveDraft = () => {
    localStorage.setItem(key, JSON.stringify({ values, meta, priority, owner, due, checks, role, approver, decision, conditions, evidence: evidence.map(({ url, ...item }) => item) }));
    setNotice(`${config.name} draft saved in this browser.`);
  };

  const validate = () => {
    const blocked: string[] = [];
    if (!meta.organization) blocked.push("Organization");
    if (!meta.site) blocked.push("Site");
    if (!meta.recordId) blocked.push("Record ID");
    if (!meta.eventDate) blocked.push("Date");
    fields.filter(field => field.required).forEach(field => {
      if (!values[field.key]?.trim()) blocked.push(field.label);
      if (otherSelected(values[field.key] || "") && !values[`${field.key}_other`]?.trim()) blocked.push(`${field.label} detail`);
    });
    if (!owner) blocked.push("Accountable owner");
    if (!due) blocked.push("Due / review date");
    tool.controls.forEach(control => !checks[control] && blocked.push(control));
    if (tool.evidenceRequired && !evidence.length) blocked.push("Required objective evidence");
    if (!approver) blocked.push("Approver");
    if (!decision) blocked.push("Approval decision");
    if (decision === "Approved with conditions" && !conditions) blocked.push("Approval conditions");
    setIssues(blocked);
    return blocked;
  };

  const submit = () => {
    if (validate().length) {
      setNotice("Submission blocked until specialized fields, required evidence, closure gates, and approval are complete.");
      return;
    }
    const derived = deriveEnterpriseMetrics(config.discipline, tool.id, values, due, evidence.length);
    const record: SubmissionRecord = {
      schema: `qmspilot.northstar.smart-${config.discipline}.v4`,
      workspace: config.name,
      toolId: tool.id,
      toolName: tool.name,
      recordMeta: meta,
      procedure: tool.procedure,
      values: { ...values, ...Object.fromEntries(Object.entries(derived).map(([name, value]) => [`calculated_${name}`, value])) },
      priority,
      owner,
      dueDate: due,
      controls: checks,
      approval: { role, name: approver, decision, conditions },
      evidence: evidence.map(({ url, ...item }) => item),
      status: decision.startsWith("Approved") ? "Submitted / approved" : "Submitted / returned",
      submittedAt: new Date().toISOString(),
    };
    const records = JSON.parse(localStorage.getItem("qmspilot:northstar:guided-records") || "[]");
    localStorage.setItem("qmspilot:northstar:guided-records", JSON.stringify([record, ...records].slice(0, 500)));
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("qmspilot:record-submitted", { detail: record }));
    setSubmitted(record);
    setNotice(`Specialized ${config.name} record submitted to Northstar.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const assignAction = () => {
    if (!owner || !due) return setNotice("Enter an accountable owner and due date first.");
    const action = { id: `ACT-${uid()}`, sourceRecord: meta.recordId, sourceTool: tool.name, workspace: config.name, owner, dueDate: due, priority, status: "Open", createdAt: new Date().toISOString() };
    const actions = JSON.parse(localStorage.getItem("qmspilot:northstar:assigned-actions") || "[]");
    localStorage.setItem("qmspilot:northstar:assigned-actions", JSON.stringify([action, ...actions].slice(0, 500)));
    setNotice(`Action assigned to ${owner}.`);
  };

  const newRecord = () => {
    localStorage.removeItem(key);
    setValues(blank);
    setMeta({ organization: "QMSPilot Design Partner", site: "Primary Site", recordId: makeRecordId(config, tool), eventDate: today() });
    setPriority("Normal"); setOwner(""); setDue(""); setChecks(Object.fromEntries(tool.controls.map(control => [control, false])));
    setRole(tool.approvalRoles[0] || "Authorized Approver"); setApprover(""); setDecision(""); setConditions("");
    evidence.forEach(item => item.url && URL.revokeObjectURL(item.url));
    setEvidence([]); setIssues([]); setSubmitted(null); setStage(0); setNotice(`New ${tool.name} record started.`);
  };

  const guidance = priority === "Critical"
    ? "Critical priority requires immediate containment, visible escalation, and leadership acknowledgement."
    : tool.evidenceRequired && !evidence.length
      ? "Capture objective evidence at the point of work before closure."
      : completion < 50
        ? "Complete the facts and controlled selections before deciding the response."
        : "Verify the calculated operating signal, closure gates, and authorized approval before submission.";

  return (
    <section className="guided-workflow">
      <button className="guided-back" onClick={onBack}><ArrowLeft size={16} /> Back to {config.name}</button>
      <div className="guided-head">
        <span><Icon /></span>
        <div><small>{tool.group.toUpperCase()}</small><h1>{tool.name}</h1><p>{tool.description}</p></div>
        <div className="completion"><strong>{completion}%</strong><small>record readiness</small><div><i style={{ width: `${completion}%` }} /></div></div>
      </div>

      {notice && <div className="guided-notice"><Sparkles size={17} />{notice}</div>}
      {submitted && <div className="guided-success"><CheckCircle2 /><div><strong>Submitted to Northstar</strong><span>{submitted.recordMeta.recordId} · {submitted.status}</span></div></div>}

      <section className="procedure-banner">
        <div><BookOpenCheck /><span><small>APPLICABLE CONTROLLED PROCEDURE</small><strong>{tool.procedure.id} · {tool.procedure.title}</strong><em>{tool.procedure.revision} · Owner: {tool.procedure.owner}</em></span></div>
        <div className="standard-tags">{tool.procedure.standards.map(standard => <span key={standard}>{standard}</span>)}</div>
        <p>QMSPilot enterprise baseline. Customer procedure IDs, terminology, options, authorities, risk thresholds, numbering, integrations, and retention rules remain configurable.</p>
      </section>

      <section className="stage-strip">{tool.stages.map((item, index) => <button key={item} className={index === stage ? "active" : index < stage ? "complete" : ""} onClick={() => setStage(index)}><span>{index < stage ? "✓" : index + 1}</span><strong>{item}</strong></button>)}</section>

      <EnterpriseFunctionPanel discipline={config.discipline} toolId={tool.id} values={values} dueDate={due} evidenceCount={evidence.length} setValue={setValue} />

      <div className="guided-layout">
        <div className="guided-form-column">
          <article className="guided-card">
            <div className="guided-title"><div><small>RECORD CONTROL</small><h2>Identity, context, and accountability</h2></div><FileText /></div>
            <div className="record-grid">
              <label>Organization *<input value={meta.organization} onChange={event => setMeta({ ...meta, organization: event.target.value })} /></label>
              <label>Site *<input value={meta.site} onChange={event => setMeta({ ...meta, site: event.target.value })} /></label>
              <label>Record ID *<input value={meta.recordId} onChange={event => setMeta({ ...meta, recordId: event.target.value })} /></label>
              <label>Date *<input type="date" value={meta.eventDate} onChange={event => setMeta({ ...meta, eventDate: event.target.value })} /></label>
              <label>Priority<select value={priority} onChange={event => setPriority(event.target.value)}><option>Normal</option><option>High</option><option>Critical</option></select></label>
              <label>Accountable owner *<input value={owner} onChange={event => setOwner(event.target.value)} /></label>
              <label>Due / review date *<input type="date" value={due} onChange={event => setDue(event.target.value)} /></label>
            </div>
          </article>

          {sections.map(section => {
            const list = fields.filter(field => field.section === section);
            return list.length ? <article className="guided-card" key={section}>
              <div className="guided-title"><div><small>{section.toUpperCase()}</small><h2>{section}</h2></div><ClipboardCheck /></div>
              <div className="field-grid">{list.map(field => <Field key={field.key} field={field} value={values[field.key] || ""} other={values[`${field.key}_other`] || ""} change={value => setValue(field.key, value)} otherChange={value => setValue(`${field.key}_other`, value)} />)}</div>
            </article> : null;
          })}
        </div>

        <aside className="guided-side">
          <article className="guided-card evidence-card">
            <div className="guided-title"><div><small>OBJECTIVE EVIDENCE</small><h2>{evidence.length} captured</h2></div><Camera /></div>
            <div className={`evidence-requirement ${tool.evidenceRequired ? "required" : "optional"}`}><strong>{tool.evidenceRequired ? "Required before submission" : "Available when needed"}</strong><span>Prove the condition, decision, action, verification, or approval.</span></div>
            <div className="evidence-guidance">{tool.evidenceGuidance.map(item => <span key={item}>• {item}</span>)}</div>
            <div className="evidence-buttons rich">
              <button onClick={() => photoRef.current?.click()}><Camera size={16} />Photos</button>
              <button onClick={() => docRef.current?.click()}><Upload size={16} />Documents</button>
              <button onClick={() => videoRef.current?.click()}><Video size={16} />Video</button>
              <button onClick={() => visionRef.current?.click()}><Sparkles size={16} />AI Vision</button>
              <button onClick={() => setScanner(true)}><Barcode size={16} />Barcode / QR</button>
              <button onClick={recording ? () => recorderRef.current?.stop() : startAudio}>{recording ? <Square size={16} /> : <Mic size={16} />}Voice note</button>
              <button onClick={captureLocation}><LocateFixed size={16} />Location</button>
              <button onClick={() => setSignature(true)}><PenLine size={16} />Signature</button>
              <input hidden ref={photoRef} type="file" accept="image/*" multiple capture="environment" onChange={(event: ChangeEvent<HTMLInputElement>) => addEvidence("photo", event.target.files)} />
              <input hidden ref={docRef} type="file" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => addEvidence("document", event.target.files)} />
              <input hidden ref={videoRef} type="file" accept="video/*" capture="environment" onChange={(event: ChangeEvent<HTMLInputElement>) => addEvidence("video", event.target.files)} />
              <input hidden ref={visionRef} type="file" accept="image/*" capture="environment" onChange={(event: ChangeEvent<HTMLInputElement>) => addEvidence("vision", event.target.files, "AI-assisted review queued; qualified human verification required")} />
            </div>
            {evidence.length > 0 && <div className="evidence-list">{evidence.map(item => <div key={item.id}>
              {item.url && ["photo", "vision", "signature"].includes(item.kind) ? <img src={item.url} alt="Evidence" /> : <span>{item.kind === "video" ? <Video /> : item.kind === "audio" ? <Play /> : item.kind === "location" ? <MapPin /> : item.kind === "scan" ? <Barcode /> : <FileText />}</span>}
              <p><strong>{item.name}</strong><small>{item.kind.toUpperCase()} · {bytes(item.size)}</small>{item.note && <em>{item.note}</em>}</p>
              <button onClick={() => setEvidence(current => current.filter(candidate => candidate.id !== item.id))}><Trash2 /></button>
            </div>)}</div>}
          </article>

          <article className="guided-card gate-card">
            <div className="guided-title"><div><small>CLOSURE GATES</small><h2>Required controls</h2></div><ShieldCheck /></div>
            {tool.controls.map(control => <label key={control}><input type="checkbox" checked={Boolean(checks[control])} onChange={event => setChecks({ ...checks, [control]: event.target.checked })} /><span>{control}</span></label>)}
          </article>

          <article className="guided-card approval-card">
            <div className="guided-title"><div><small>HUMAN AUTHORITY</small><h2>Approval decision</h2></div><Users /></div>
            <label>Role *<select value={role} onChange={event => setRole(event.target.value)}>{tool.approvalRoles.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Approver *<input value={approver} onChange={event => setApprover(event.target.value)} /></label>
            <label>Decision *<select value={decision} onChange={event => setDecision(event.target.value)}><option value="">Select</option><option>Approved</option><option>Approved with conditions</option><option>Returned / rejected</option></select></label>
            {decision === "Approved with conditions" && <label>Approval conditions *<textarea value={conditions} onChange={event => setConditions(event.target.value)} /></label>}
          </article>

          <article className="guided-card ai-card"><div className="guided-title"><div><small>PILOT WORKFLOW COACHING</small><h2>Next-best control</h2></div><Sparkles /></div><p>{guidance}</p><small>AI may assist with review, trends, summaries, and suggested actions. Qualified people retain authority for acceptance, release, safety, technical, customer, and compliance decisions.</small></article>

          <article className="guided-card escalation-card"><div className="guided-title"><div><small>ESCALATION ROUTING</small><h2>Conditions that cannot wait</h2></div><AlertTriangle /></div>{tool.escalations.map(item => <div key={item.when}><strong>{item.when}</strong><span>{item.route}</span></div>)}</article>
        </aside>
      </div>

      {issues.length > 0 && <section className="validation-box"><AlertTriangle /><div><strong>Submission blocked.</strong><p>{issues.slice(0, 12).join(" · ")}</p></div></section>}
      <div className="guided-actions">
        <button className="secondary" onClick={saveDraft}><Save />Save draft</button>
        <button className="secondary" onClick={() => window.print()}><Printer />PDF / Print</button>
        <button className="secondary" onClick={assignAction}><Target />Assign action</button>
        <button className="secondary danger" onClick={newRecord}><RotateCcw />New record</button>
        <button className="primary" onClick={submit}><Send />Submit to Northstar</button>
      </div>

      {scanner && <ScannerModal onClose={() => setScanner(false)} onResult={applyScan} />}
      {signature && <SignatureModal onClose={() => setSignature(false)} onSave={(url, size) => { setEvidence(current => [...current, { id: uid(), kind: "signature", name: `signature-${today()}.png`, size, url }]); setSignature(false); }} />}
    </section>
  );
}

function Field({ field, value, other, change, otherChange }: { field: FieldDef; value: string; other: string; change: (value: string) => void; otherChange: (value: string) => void }) {
  const type = (field as FieldDef & { type: string }).type;
  return <label className={type === "textarea" ? "wide" : ""}>
    <span>{field.label}{field.required ? " *" : ""}</span>
    {type === "select"
      ? <select value={value} onChange={event => change(event.target.value)}><option value="">Select an option</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select>
      : type === "textarea"
        ? <textarea value={value} onChange={event => change(event.target.value)} placeholder={field.placeholder} />
        : <input type={type} value={value} onChange={event => change(event.target.value)} placeholder={field.placeholder} />}
    {field.help && <small>{field.help}</small>}
    {otherSelected(value) && <textarea className="other-detail" value={other} onChange={event => otherChange(event.target.value)} placeholder="Enter customer-defined detail *" />}
  </label>;
}
