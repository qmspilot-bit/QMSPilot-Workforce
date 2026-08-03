"use client";

import {
  ArrowLeft,
  Barcode,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LocateFixed,
  Mic,
  PenLine,
  Save,
  Send,
  Sparkles,
  Square,
  Trash2,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";
import { ScannerModal, SignatureModal } from "./CaptureModals";
import {
  bytes,
  iconMap,
  makeRecordId,
  today,
  uid,
  type Evidence,
  type ScanResult,
} from "./shared";

type BranchSubmission = {
  schema: string;
  workspace: string;
  toolId: string;
  toolName: string;
  recordId: string;
  title: string;
  customer?: string;
  organization: string;
  site: string;
  eventDate: string;
  values: Record<string, string>;
  owner: string;
  dueDate: string;
  priority: string;
  status: "Open";
  evidence: Omit<Evidence, "url">[];
  submittedAt: string;
};

const recordLabel = (toolName: string) => {
  const labels: Record<string, string> = {
    "Customer Promise Tracker": "Customer Promise",
    "Receiving Workflow": "Receiving Record",
    "Inventory Exception Workflow": "Inventory Exception",
    "Counter Sales Follow-Up": "Customer Follow-Up",
    "VMI Route Manager": "VMI Visit",
    "Employee Task Manager": "Employee Task",
    "Safety & Facility": "Safety / Facility Record",
    "Vendor Performance": "Vendor Review",
  };
  return labels[toolName] ?? toolName;
};

const deriveTitle = (tool: WorkflowTool, values: Record<string, string>) => {
  const candidates = ["promise", "shipment", "item", "task", "vendor", "type", "route", "customer"];
  const value = candidates.map(key => values[key]).find(Boolean);
  return value || recordLabel(tool.name);
};

export function BranchGuidedWorkflow({
  config,
  tool,
  onBack,
}: {
  config: WorkspaceConfig;
  tool: WorkflowTool;
  onBack: () => void;
}) {
  const Icon = iconMap[tool.icon] ?? ClipboardCheck;
  const blank = Object.fromEntries(tool.fields.map(field => [field.key, ""]));
  const key = `qmspilot:smart-branch:draft:${tool.id}`;
  const photoRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const visionRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [values, setValues] = useState<Record<string, string>>(blank);
  const [organization, setOrganization] = useState("QMSPilot Design Partner");
  const [site, setSite] = useState("Primary Branch");
  const [recordId, setRecordId] = useState(makeRecordId(config, tool));
  const [eventDate, setEventDate] = useState(today());
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [notice, setNotice] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<BranchSubmission | null>(null);
  const [scanner, setScanner] = useState(false);
  const [signature, setSignature] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setValues({ ...blank, ...draft.values });
      setOrganization(draft.organization || "QMSPilot Design Partner");
      setSite(draft.site || "Primary Branch");
      setRecordId(draft.recordId || makeRecordId(config, tool));
      setEventDate(draft.eventDate || today());
      setOwner(draft.owner || "");
      setDue(draft.due || "");
      setPriority(draft.priority || "Medium");
      setEvidence((draft.evidence || []).map((item: Evidence) => ({ ...item, url: undefined })));
      setNotice("Saved Smart Branch draft restored.");
    } catch {
      localStorage.removeItem(key);
    }
  }, [key]);

  useEffect(() => () => {
    evidence.forEach(item => item.url && URL.revokeObjectURL(item.url));
  }, []);

  const required = useMemo(() => tool.fields.filter(field => field.required), [tool.fields]);
  const completeCount = [organization, site, recordId, eventDate, owner, due, ...required.map(field => values[field.key])]
    .filter(value => String(value || "").trim()).length;
  const completion = Math.round(completeCount / Math.max(6 + required.length, 1) * 100);
  const label = recordLabel(tool.name);

  const setValue = (fieldKey: string, value: string) => {
    setValues(current => ({ ...current, [fieldKey]: value }));
    setIssues([]);
    setSubmitted(null);
  };

  const saveDraft = () => {
    localStorage.setItem(key, JSON.stringify({
      values,
      organization,
      site,
      recordId,
      eventDate,
      owner,
      due,
      priority,
      evidence: evidence.map(({ url, ...item }) => item),
    }));
    setNotice(`${label} draft saved in this browser.`);
  };

  const addEvidence = (kind: Evidence["kind"], files: FileList | null, note?: string) => {
    if (!files?.length) return;
    const added = Array.from(files).map(file => ({
      id: uid(),
      kind,
      name: file.name,
      size: file.size,
      url: file.type.startsWith("image/") || kind === "video" || kind === "audio" || kind === "vision"
        ? URL.createObjectURL(file)
        : undefined,
      note,
    }));
    setEvidence(current => [...current, ...added]);
    setNotice(`${added.length} evidence item${added.length === 1 ? "" : "s"} attached.`);
  };

  const applyScan = (result: ScanResult) => {
    const next = { ...values };
    const normalized = Object.fromEntries(
      Object.entries(result.fields).map(([name, value]) => [name.toLowerCase().replace(/[^a-z0-9]/g, ""), value]),
    );
    tool.fields.forEach(field => {
      const searchable = `${field.key}${field.label}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = Object.keys(normalized).find(name => searchable.includes(name) || name.includes(field.key.replace(/_/g, "")));
      if (match && !next[field.key]) next[field.key] = normalized[match];
    });
    setValues(next);
    setEvidence(current => [...current, {
      id: uid(),
      kind: "scan",
      name: "Barcode / QR capture",
      size: result.raw.length,
      note: result.raw,
    }]);
    setScanner(false);
    setNotice("Code captured and matching fields populated.");
  };

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = event => event.data.size && audioChunks.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType || "audio/webm" });
        setEvidence(current => [...current, {
          id: uid(),
          kind: "audio",
          name: `branch-voice-note-${Date.now()}.webm`,
          size: blob.size,
          url: URL.createObjectURL(blob),
        }]);
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setNotice("Voice note attached.");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setNotice("Microphone access was unavailable.");
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setNotice("Location capture is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      const location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} · ±${Math.round(position.coords.accuracy)} m`;
      setEvidence(current => [...current, {
        id: uid(),
        kind: "location",
        name: "Verified branch location",
        size: location.length,
        note: location,
      }]);
      setNotice("Location evidence captured.");
    }, () => setNotice("Location permission was not granted."));
  };

  const validate = () => {
    const blocked: string[] = [];
    if (!organization.trim()) blocked.push("Organization");
    if (!site.trim()) blocked.push("Branch / site");
    if (!recordId.trim()) blocked.push("Record ID");
    if (!eventDate) blocked.push("Record date");
    if (!owner.trim()) blocked.push("Accountable owner");
    if (!due) blocked.push("Due date");
    required.forEach(field => {
      if (!String(values[field.key] || "").trim()) blocked.push(field.label);
    });
    setIssues(blocked);
    return blocked;
  };

  const saveToDashboard = () => {
    if (validate().length) {
      setNotice("Complete the required creation fields shown below, then save again.");
      return;
    }
    const record: BranchSubmission = {
      schema: "qmspilot.northstar.smart-branch.v2",
      workspace: config.name,
      toolId: tool.id,
      toolName: tool.name,
      recordId,
      title: deriveTitle(tool, values),
      customer: values.customer || undefined,
      organization,
      site,
      eventDate,
      values,
      owner,
      dueDate: due,
      priority,
      status: "Open",
      evidence: evidence.map(({ url, ...item }) => item),
      submittedAt: new Date().toISOString(),
    };
    const records = JSON.parse(localStorage.getItem("qmspilot:northstar:smart-branch-records") || "[]");
    localStorage.setItem("qmspilot:northstar:smart-branch-records", JSON.stringify([record, ...records].slice(0, 500)));
    const all = JSON.parse(localStorage.getItem("qmspilot:northstar:guided-records") || "[]");
    localStorage.setItem("qmspilot:northstar:guided-records", JSON.stringify([record, ...all].slice(0, 500)));
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("qmspilot:smart-branch-record-submitted", { detail: record }));
    setSubmitted(record);
    setNotice(`${label} saved and added to the correct Smart Branch dashboard queue.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newRecord = () => {
    localStorage.removeItem(key);
    setValues(blank);
    setRecordId(makeRecordId(config, tool));
    setEventDate(today());
    setOwner("");
    setDue("");
    setPriority("Medium");
    evidence.forEach(item => item.url && URL.revokeObjectURL(item.url));
    setEvidence([]);
    setIssues([]);
    setSubmitted(null);
    setNotice(`New ${label} started.`);
  };

  return <section className="guided-workflow">
    <button className="guided-back" onClick={onBack}><ArrowLeft size={16} /> Back to Smart Branch dashboard</button>
    <div className="guided-head">
      <span><Icon /></span>
      <div><small>{tool.group.toUpperCase()}</small><h1>Create New {label}</h1><p>{tool.description}</p></div>
      <div className="completion"><strong>{completion}%</strong><small>ready to save</small><div><i style={{ width: `${completion}%` }} /></div></div>
    </div>

    {notice && <div className="guided-notice"><Sparkles size={17} />{notice}</div>}
    {submitted && <div className="guided-success"><CheckCircle2 /><div><strong>{label} added to Smart Branch</strong><span>{submitted.recordId} · now visible in the correct dashboard queue</span></div></div>}
    {issues.length > 0 && <div className="guided-errors"><strong>Complete these creation fields</strong><div>{issues.map(item => <span key={item}>{item}</span>)}</div></div>}

    <div className="branch-save-bar">
      <div><strong>Create it once. Track it automatically.</strong><span>Saving adds this record to the proper Smart Branch dashboard and Northstar operating history.</span></div>
      <button className="guided-secondary" onClick={saveDraft}><Save size={16} /> Save draft</button>
      <button className="guided-primary" onClick={saveToDashboard}><Send size={16} /> Save {label} to Dashboard</button>
    </div>

    <section className="procedure-banner">
      <div><ClipboardCheck /><span><small>CONTROLLED BRANCH WORKFLOW</small><strong>{tool.procedure.id} · {tool.procedure.title}</strong><em>{tool.procedure.revision} · Owner: {tool.procedure.owner}</em></span></div>
      <p>Creation captures the commitment or issue now. Updates, evidence, verification, and closure continue through the same dashboard record.</p>
    </section>

    <section className="stage-strip">{tool.stages.map((name, index) => <button key={name} className={index === 0 ? "active" : ""}><span>{index + 1}</span><strong>{name}</strong></button>)}</section>

    <div className="guided-layout">
      <div className="guided-form-column">
        <article className="guided-card">
          <div className="guided-title"><div><small>RECORD CONTROL</small><h2>Who owns it and when is it due?</h2></div><ClipboardCheck /></div>
          <div className="record-grid">
            <label>Organization *<input value={organization} onChange={event => setOrganization(event.target.value)} /></label>
            <label>Branch / site *<input value={site} onChange={event => setSite(event.target.value)} /></label>
            <label>Record ID *<input value={recordId} onChange={event => setRecordId(event.target.value)} /></label>
            <label>Record date *<input type="date" value={eventDate} onChange={event => setEventDate(event.target.value)} /></label>
            <label>Accountable owner *<input value={owner} onChange={event => setOwner(event.target.value)} /></label>
            <label>Due date *<input type="date" value={due} onChange={event => setDue(event.target.value)} /></label>
            <label>Priority<select value={priority} onChange={event => setPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
          </div>
        </article>

        {(["Record Context", "Evaluation", "Response & Action", "Closure"] as const).map(section => {
          const fields = tool.fields.filter(field => field.section === section);
          return fields.length ? <article className="guided-card" key={section}>
            <div className="guided-title"><div><small>{section.toUpperCase()}</small><h2>{section}</h2></div><ClipboardCheck /></div>
            <div className="field-grid">{fields.map(field => <BranchField key={field.key} field={field} value={values[field.key] || ""} change={value => setValue(field.key, value)} />)}</div>
          </article> : null;
        })}
      </div>

      <aside className="guided-side">
        <article className="guided-card">
          <div className="guided-title"><div><small>OBJECTIVE EVIDENCE</small><h2>{evidence.length} captured</h2></div><Camera /></div>
          <div className="evidence-requirement optional"><strong>Available when it strengthens the record</strong><span>Capture the actual condition, customer communication, material, location, signature, or completion proof.</span></div>
          <div className="evidence-buttons">
            <button onClick={() => photoRef.current?.click()}><Camera size={15} /> Photos</button>
            <button onClick={() => documentRef.current?.click()}><FileText size={15} /> Documents</button>
            <button onClick={() => videoRef.current?.click()}><Video size={15} /> Video</button>
            <button onClick={() => visionRef.current?.click()}><Sparkles size={15} /> AI Vision</button>
            <button onClick={() => setScanner(true)}><Barcode size={15} /> Barcode / QR</button>
            <button onClick={() => recording ? recorderRef.current?.stop() : startAudio()}>{recording ? <Square size={15} /> : <Mic size={15} />} {recording ? "Stop recording" : "Voice note"}</button>
            <button onClick={captureLocation}><LocateFixed size={15} /> Location</button>
            <button onClick={() => setSignature(true)}><PenLine size={15} /> Signature</button>
          </div>
          <input ref={photoRef} hidden multiple type="file" accept="image/*" capture="environment" onChange={event => { addEvidence("photo", event.target.files); event.target.value = ""; }} />
          <input ref={documentRef} hidden multiple type="file" onChange={event => { addEvidence("document", event.target.files); event.target.value = ""; }} />
          <input ref={videoRef} hidden multiple type="file" accept="video/*" capture="environment" onChange={event => { addEvidence("video", event.target.files); event.target.value = ""; }} />
          <input ref={visionRef} hidden multiple type="file" accept="image/*" onChange={event => { addEvidence("vision", event.target.files, "Queued for AI-assisted visual review"); event.target.value = ""; }} />
          <div className="evidence-list">{evidence.length ? evidence.map(item => <div key={item.id}>
            {item.url && item.kind !== "video" && item.kind !== "audio" ? <img src={item.url} alt="Evidence preview" /> : <span>{item.kind.slice(0, 2).toUpperCase()}</span>}
            <p><strong>{item.name}</strong><small>{item.kind} · {bytes(item.size)}{item.note ? ` · ${item.note}` : ""}</small></p>
            <button onClick={() => setEvidence(current => current.filter(evidenceItem => evidenceItem.id !== item.id))}><Trash2 size={15} /></button>
          </div>) : <p>No evidence attached yet.</p>}</div>
        </article>

        <article className="guided-card branch-action-card">
          <div className="guided-title"><div><small>ONE-CLICK ROUTING</small><h2>Save and place it where it belongs</h2></div><Send /></div>
          <p>The main save button creates an open tracked record, routes it to the correct workflow queue, and updates the General Manager view.</p>
          <button className="guided-primary" onClick={saveToDashboard}><Send size={16} /> Save {label} to Dashboard</button>
          <button className="guided-secondary" onClick={saveDraft}><Save size={16} /> Save draft only</button>
          {submitted && <><button className="guided-secondary" onClick={newRecord}>Create another {label}</button><button className="guided-secondary" onClick={onBack}>View Smart Branch Dashboard</button></>}
        </article>
      </aside>
    </div>

    {scanner && <ScannerModal onClose={() => setScanner(false)} onResult={applyScan} />}
    {signature && <SignatureModal onClose={() => setSignature(false)} onSave={(url, size) => {
      setEvidence(current => [...current, { id: uid(), kind: "signature", name: "Electronic signature", size, url }]);
      setSignature(false);
      setNotice("Signature attached.");
    }} />}

    <style>{`
      .branch-save-bar{position:sticky;top:8px;z-index:12;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:9px;margin-top:12px;padding:12px 14px;border:1px solid #8fc3ed;border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 12px 30px rgba(24,83,131,.13)}
      .branch-save-bar strong,.branch-save-bar span{display:block}.branch-save-bar strong{color:#123d60;font-size:11px}.branch-save-bar span{margin-top:3px;color:#61798d;font-size:9px}.guided-primary,.guided-secondary{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:41px;padding:0 13px;border-radius:10px;font-size:10px;font-weight:900;cursor:pointer}.guided-primary{border:1px solid #0a66ff;color:#fff;background:#0a66ff}.guided-secondary{border:1px solid #c6d6e2;color:#285674;background:#fff}.branch-action-card>p{color:#60788c;font-size:10px;line-height:1.55}.branch-action-card>button{width:100%;margin-top:8px}.guided-errors{margin-top:12px;padding:13px;border:1px solid #e7a6ad;border-radius:12px;color:#8e2734;background:#fff0f2}.guided-errors strong{display:block;font-size:10px}.guided-errors>div{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.guided-errors span{padding:5px 7px;border-radius:999px;background:#fff;font-size:8px;font-weight:800}
      @media(max-width:850px){.branch-save-bar{position:static;grid-template-columns:1fr}.branch-save-bar button{width:100%}}
    `}</style>
  </section>;
}

function BranchField({ field, value, change }: { field: FieldDef; value: string; change: (value: string) => void }) {
  const common = {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => change(event.target.value),
  };
  return <label className={field.type === "textarea" ? "wide" : ""}>
    {field.label}{field.required ? " *" : ""}
    {field.type === "textarea"
      ? <textarea {...common} placeholder={field.placeholder} />
      : field.type === "select"
        ? <select {...common}><option value="">Select...</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select>
        : <input {...common} type={field.type} placeholder={field.placeholder} />}
    {field.help && <small>{field.help}</small>}
  </label>;
}
