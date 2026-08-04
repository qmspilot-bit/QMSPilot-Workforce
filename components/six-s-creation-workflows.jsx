"use client";

import {
  BarChart3,
  BrushCleaning,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Eye,
  FolderOpen,
  ImagePlus,
  Lightbulb,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "qmspilot:northstar:6s-created-workflows";
const AREAS = [
  "Final Assembly",
  "Electrical Test",
  "Machine Shop",
  "Foam Operations",
  "Packaging",
  "Warehouse & Receiving",
];

const WORKFLOW_CONFIG = {
  visual: {
    label: "Create Visual Standard",
    eyebrow: "SET IN ORDER · CONTROLLED VISUAL STANDARD",
    title: "Define the correct condition so anyone can recognize normal versus abnormal.",
    icon: ImagePlus,
    tab: "Set in Order & Visuals",
  },
  routine: {
    label: "Add Cleaning & Inspection Routine",
    eyebrow: "SHINE · CLEANING AS INSPECTION",
    title: "Create a repeatable routine that restores the area and exposes abnormalities.",
    icon: BrushCleaning,
    tab: "Shine & Safety",
  },
  improvement: {
    label: "Add 6S Improvement",
    eyebrow: "KAIZEN · VERIFIED IMPROVEMENT",
    title: "Turn an observed problem into owned, verified, and sustained improvement.",
    icon: Lightbulb,
    tab: "Actions & Kaizen",
  },
};

function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function blankForm(type) {
  if (type === "visual") {
    return {
      area: "Final Assembly",
      name: "",
      controlType: "Point-of-use location",
      exactLocation: "",
      owner: "",
      requiredQuantity: "",
      labelText: "",
      normalCondition: "",
      abnormalResponse: "",
      revision: "A",
      approver: "Operations Manager",
      review: isoDate(90),
      currentPhoto: "",
      targetPhoto: "",
    };
  }
  if (type === "routine") {
    return {
      area: "Machine Shop",
      task: "",
      frequency: "Daily",
      owner: "",
      acceptanceCriteria: "",
      inspectionPoints: "",
      tools: "",
      ppe: "Safety glasses",
      abnormalResponse: "Create corrective action",
      maintenanceHandoff: false,
      correctiveAction: true,
      next: isoDate(1),
      evidencePhoto: "",
    };
  }
  return {
    area: "Warehouse & Receiving",
    title: "",
    source: "Employee observation",
    problem: "",
    proposed: "",
    owner: "",
    priority: "Moderate",
    due: isoDate(14),
    expectedImpact: "",
    verification: "Before/after photo and area-owner approval",
    sustainCheck: isoDate(30),
    estimatedSavings: "",
    recoveredSpace: "",
    beforePhoto: "",
    afterPhoto: "",
  };
}

function readAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type.startsWith("image/")) return reject(new Error("Select an image file."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The image could not be processed."));
      image.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.76));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function textCell(primary, secondary = "") {
  const td = document.createElement("td");
  const strong = document.createElement("strong");
  strong.textContent = String(primary ?? "");
  td.appendChild(strong);
  if (secondary) {
    const small = document.createElement("small");
    small.textContent = String(secondary);
    td.appendChild(small);
  }
  return td;
}

function simpleCell(value) {
  const td = document.createElement("td");
  td.textContent = String(value ?? "");
  return td;
}

function tagCell(value, tone = "blue") {
  const td = document.createElement("td");
  const span = document.createElement("span");
  span.className = `six-tag ${tone}`;
  span.textContent = value;
  td.appendChild(span);
  return td;
}

function actionCell(record, openDetail) {
  const td = document.createElement("td");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "View";
  button.title = "View controlled record";
  button.addEventListener("click", () => openDetail(record));
  td.appendChild(button);
  return td;
}

function findRegister(marker) {
  const heading = [...document.querySelectorAll(".six-section-title small")].find((node) =>
    node.textContent?.toLowerCase().includes(marker.toLowerCase())
  );
  return heading?.closest(".section-card")?.querySelector("tbody") || null;
}

function syncRegister(records, openDetail) {
  const ids = new Set([
    ...records.visual.map((item) => item.id),
    ...records.routine.map((item) => item.id),
    ...records.improvement.map((item) => item.id),
  ]);
  document.querySelectorAll("tr[data-qmsp-created-id]").forEach((row) => {
    if (!ids.has(row.dataset.qmspCreatedId)) row.remove();
  });

  const configs = [
    ["04 · set in order", records.visual, (record) => {
      const row = document.createElement("tr");
      row.append(
        textCell(record.name, `${record.area} · ${record.id}`),
        simpleCell(record.controlType),
        simpleCell(record.owner),
        simpleCell(record.revision),
        simpleCell(record.review),
        tagCell(record.status, "warn"),
        actionCell(record, openDetail)
      );
      return row;
    }],
    ["05 · shine", records.routine, (record) => {
      const row = document.createElement("tr");
      row.append(
        textCell(record.task, record.area),
        simpleCell(record.frequency),
        simpleCell(record.owner),
        simpleCell("Not yet completed"),
        simpleCell(record.next),
        textCell("0", "Acceptance criteria defined"),
        tagCell(record.status, "warn"),
        actionCell(record, openDetail)
      );
      return row;
    }],
    ["07 · actions", records.improvement, (record) => {
      const row = document.createElement("tr");
      const priorityTone = record.priority === "Critical" ? "bad" : record.priority === "High" ? "warn" : "blue";
      row.append(
        textCell(record.title, `${record.id} · ${record.source}`),
        simpleCell(record.area),
        simpleCell(record.owner),
        simpleCell(record.due),
        tagCell(record.priority, priorityTone),
        tagCell(record.status, "blue"),
        simpleCell(record.verification),
        tagCell("First occurrence", "blue"),
        actionCell(record, openDetail)
      );
      return row;
    }],
  ];

  configs.forEach(([marker, items, buildRow]) => {
    const body = findRegister(marker);
    if (!body) return;
    [...items].reverse().forEach((record) => {
      if (body.querySelector(`tr[data-qmsp-created-id="${record.id}"]`)) return;
      const row = buildRow(record);
      row.dataset.qmspCreatedId = record.id;
      row.dataset.qmspCreated = "true";
      body.insertBefore(row, body.firstChild);
    });
  });
}

function PhotoField({ label, value, onChange, help }) {
  const [busy, setBusy] = useState(false);
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await readAndCompressImage(file));
    } catch (error) {
      window.alert(error.message || "The image could not be added.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };
  return (
    <div className="creation-photo-field">
      <span>{label}</span>
      {value ? (
        <div className="creation-photo-preview">
          <img src={value} alt={label} />
          <button type="button" onClick={() => onChange("")}><Trash2 size={14} /> Remove</button>
        </div>
      ) : (
        <label className="creation-photo-upload">
          <Camera size={19} />
          <strong>{busy ? "Processing image…" : "Take or upload photo"}</strong>
          <small>{help}</small>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} disabled={busy} />
        </label>
      )}
    </div>
  );
}

function Field({ label, children, full = false }) {
  return <label className={full ? "creation-field full" : "creation-field"}><span>{label}</span>{children}</label>;
}

function VisualForm({ form, setForm }) {
  return <div className="creation-form-grid">
    <Field label="Area"><select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{AREAS.map((area) => <option key={area}>{area}</option>)}</select></Field>
    <Field label="Visual standard name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Torque tool shadow board" /></Field>
    <Field label="Control type"><select value={form.controlType} onChange={(e) => setForm({ ...form, controlType: e.target.value })}><option>Point-of-use location</option><option>Shadow board</option><option>Floor marking</option><option>Visual flow</option><option>Min / max control</option><option>Status identification</option><option>Safety visual control</option></select></Field>
    <Field label="Exact location"><input value={form.exactLocation} onChange={(e) => setForm({ ...form, exactLocation: e.target.value })} placeholder="Work center, station, rack, or zone" /></Field>
    <Field label="Accountable owner"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Area owner" /></Field>
    <Field label="Required quantity / min-max"><input value={form.requiredQuantity} onChange={(e) => setForm({ ...form, requiredQuantity: e.target.value })} placeholder="Example: 2 tools; min 4 / max 10" /></Field>
    <Field label="Label or identifier"><input value={form.labelText} onChange={(e) => setForm({ ...form, labelText: e.target.value })} placeholder="Exact label, color, symbol, or asset ID" /></Field>
    <Field label="Revision"><input value={form.revision} onChange={(e) => setForm({ ...form, revision: e.target.value })} /></Field>
    <Field label="Approved normal condition" full><textarea value={form.normalCondition} onChange={(e) => setForm({ ...form, normalCondition: e.target.value })} placeholder="Describe what belongs, where it belongs, how much is required, and what the correct condition looks like." /></Field>
    <Field label="Required response when abnormal" full><textarea value={form.abnormalResponse} onChange={(e) => setForm({ ...form, abnormalResponse: e.target.value })} placeholder="Example: Restore immediately; notify the area owner; create a finding when the condition cannot be restored." /></Field>
    <PhotoField label="Current-condition photo" value={form.currentPhoto} onChange={(value) => setForm({ ...form, currentPhoto: value })} help="Show the condition before the visual standard is implemented." />
    <PhotoField label="Approved-condition photo" value={form.targetPhoto} onChange={(value) => setForm({ ...form, targetPhoto: value })} help="Show the expected point-of-use arrangement or visual condition." />
    <Field label="Approver"><input value={form.approver} onChange={(e) => setForm({ ...form, approver: e.target.value })} /></Field>
    <Field label="Review date"><div className="creation-date"><input type="date" value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} /></div></Field>
  </div>;
}

function RoutineForm({ form, setForm }) {
  return <div className="creation-form-grid">
    <Field label="Area"><select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{AREAS.map((area) => <option key={area}>{area}</option>)}</select></Field>
    <Field label="Routine name"><input value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="Example: Inspect and clean chip-control zones" /></Field>
    <Field label="Frequency"><select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option>Start of shift</option><option>End of shift</option><option>Each shift</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></Field>
    <Field label="Accountable owner"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Role or named owner" /></Field>
    <Field label="Tools and supplies"><input value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="Cleaning tools, inspection aids, supplies" /></Field>
    <Field label="Required PPE"><input value={form.ppe} onChange={(e) => setForm({ ...form, ppe: e.target.value })} /></Field>
    <Field label="Acceptance criteria" full><textarea value={form.acceptanceCriteria} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} placeholder="Define the restored condition and what must be true before the routine is considered complete." /></Field>
    <Field label="Inspection points and abnormalities" full><textarea value={form.inspectionPoints} onChange={(e) => setForm({ ...form, inspectionPoints: e.target.value })} placeholder="Leaks, loose hardware, guarding, damage, contamination, labels, blocked access, unusual wear, electrical condition…" /></Field>
    <Field label="Abnormality response"><select value={form.abnormalResponse} onChange={(e) => setForm({ ...form, abnormalResponse: e.target.value })}><option>Restore immediately</option><option>Create corrective action</option><option>Create maintenance handoff</option><option>Stop work and escalate</option><option>Supervisor review</option></select></Field>
    <Field label="Next due"><div className="creation-date"><input type="date" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></div></Field>
    <label className="creation-check"><input type="checkbox" checked={form.maintenanceHandoff} onChange={(e) => setForm({ ...form, maintenanceHandoff: e.target.checked })} /><span><Wrench size={16} /><b>Route equipment abnormalities to Maintenance</b></span></label>
    <label className="creation-check"><input type="checkbox" checked={form.correctiveAction} onChange={(e) => setForm({ ...form, correctiveAction: e.target.checked })} /><span><ShieldCheck size={16} /><b>Allow corrective action from the routine</b></span></label>
    <div className="full"><PhotoField label="Reference or acceptance photo" value={form.evidencePhoto} onChange={(value) => setForm({ ...form, evidencePhoto: value })} help="Show the expected clean, safe, and inspectable condition." /></div>
  </div>;
}

function ImprovementForm({ form, setForm }) {
  return <div className="creation-form-grid">
    <Field label="Area"><select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>{AREAS.map((area) => <option key={area}>{area}</option>)}</select></Field>
    <Field label="Improvement title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="State the improvement in clear action language" /></Field>
    <Field label="Source"><select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option>Employee observation</option><option>6S audit finding</option><option>Red tag review</option><option>Safety finding</option><option>Daily condition check</option><option>Leadership review</option></select></Field>
    <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></Field>
    <Field label="Accountable owner"><input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Person responsible for completion" /></Field>
    <Field label="Due date"><div className="creation-date"><input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></div></Field>
    <Field label="Problem / current condition" full><textarea value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Describe the observed condition, risk, waste, or recurring difficulty using objective evidence." /></Field>
    <Field label="Proposed improvement" full><textarea value={form.proposed} onChange={(e) => setForm({ ...form, proposed: e.target.value })} placeholder="Describe the change, who it helps, and how the expected condition will be controlled." /></Field>
    <Field label="Expected impact"><input value={form.expectedImpact} onChange={(e) => setForm({ ...form, expectedImpact: e.target.value })} placeholder="Safety, quality, time, space, flow, cost, morale" /></Field>
    <Field label="Verification method"><input value={form.verification} onChange={(e) => setForm({ ...form, verification: e.target.value })} /></Field>
    <Field label="Sustainment check"><div className="creation-date"><input type="date" value={form.sustainCheck} onChange={(e) => setForm({ ...form, sustainCheck: e.target.value })} /></div></Field>
    <Field label="Estimated savings"><input type="number" min="0" value={form.estimatedSavings} onChange={(e) => setForm({ ...form, estimatedSavings: e.target.value })} placeholder="Do not count until verified" /></Field>
    <Field label="Recovered space (ft²)"><input type="number" min="0" value={form.recoveredSpace} onChange={(e) => setForm({ ...form, recoveredSpace: e.target.value })} /></Field>
    <div />
    <PhotoField label="Before photo" value={form.beforePhoto} onChange={(value) => setForm({ ...form, beforePhoto: value })} help="Capture the current condition and visible problem." />
    <PhotoField label="After photo" value={form.afterPhoto} onChange={(value) => setForm({ ...form, afterPhoto: value })} help="Add now or later when the improvement is implemented." />
  </div>;
}

function RecordDetail({ record, onClose }) {
  const type = record.recordType;
  const title = type === "visual" ? record.name : type === "routine" ? record.task : record.title;
  const photos = type === "visual" ? [record.currentPhoto, record.targetPhoto] : type === "routine" ? [record.evidencePhoto] : [record.beforePhoto, record.afterPhoto];
  const entries = type === "visual" ? [
    ["Control type", record.controlType], ["Exact location", record.exactLocation], ["Required quantity", record.requiredQuantity], ["Label", record.labelText], ["Normal condition", record.normalCondition], ["Abnormal response", record.abnormalResponse], ["Approver", record.approver], ["Review", record.review],
  ] : type === "routine" ? [
    ["Frequency", record.frequency], ["Acceptance criteria", record.acceptanceCriteria], ["Inspection points", record.inspectionPoints], ["Tools", record.tools], ["PPE", record.ppe], ["Abnormality response", record.abnormalResponse], ["Maintenance routing", record.maintenanceHandoff ? "Enabled" : "Not enabled"], ["Corrective action", record.correctiveAction ? "Enabled" : "Not enabled"],
  ] : [
    ["Source", record.source], ["Priority", record.priority], ["Problem", record.problem], ["Proposed improvement", record.proposed], ["Expected impact", record.expectedImpact], ["Verification", record.verification], ["Sustainment check", record.sustainCheck], ["Estimated savings", record.estimatedSavings ? `$${Number(record.estimatedSavings).toLocaleString()}` : "Not claimed"], ["Recovered space", record.recoveredSpace ? `${record.recoveredSpace} ft²` : "Not claimed"],
  ];
  return <div className="creation-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="creation-modal detail-modal">
      <div className="creation-head"><div><small>CONTROLLED 6S RECORD · {record.id}</small><h2>{title}</h2><p>{record.area} · Owner: {record.owner} · {record.status}</p></div><button type="button" onClick={onClose}><X size={19} /></button></div>
      <div className="creation-detail-grid">{entries.map(([label, value]) => value ? <div key={label}><small>{label}</small><strong>{value}</strong></div> : null)}</div>
      {photos.filter(Boolean).length > 0 && <div className="creation-detail-photos">{photos.filter(Boolean).map((photo, index) => <img key={index} src={photo} alt={`${title} evidence ${index + 1}`} />)}</div>}
      <div className="creation-control-strip"><CheckCircle2 size={17} /><span>This browser-persistent demonstration record is linked to the appropriate 6S register and remains available from the 6S Records Center.</span></div>
      <div className="creation-actions"><button type="button" onClick={onClose}>Close record</button></div>
    </section>
  </div>;
}

export default function SixSCreationWorkflows() {
  const [records, setRecords] = useState({ visual: [], routine: [], improvement: [] });
  const [workflow, setWorkflow] = useState(null);
  const [form, setForm] = useState(blankForm("visual"));
  const [detail, setDetail] = useState(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.visual && saved?.routine && saved?.improvement) setRecords(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
  }, [records]);

  const allRecords = useMemo(() => [
    ...records.visual.map((item) => ({ ...item, recordType: "visual" })),
    ...records.routine.map((item) => ({ ...item, recordType: "routine" })),
    ...records.improvement.map((item) => ({ ...item, recordType: "improvement" })),
  ].sort((a, b) => String(b.created).localeCompare(String(a.created))), [records]);

  const openWorkflow = (type) => {
    setForm(blankForm(type));
    setWorkflow(type);
    setNotice("");
  };

  useEffect(() => {
    const intercept = (event) => {
      const control = event.target?.closest?.("button, a, [role='button']");
      if (!control || !control.closest(".six-shell") || control.closest(".creation-overlay")) return;
      const label = `${control.textContent || ""} ${control.getAttribute("title") || ""}`.replace(/\s+/g, " ").trim().toLowerCase();
      const type = label.includes("create visual standard") ? "visual" : label.includes("add routine") ? "routine" : label.includes("add improvement") ? "improvement" : null;
      if (!type) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openWorkflow(type);
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, []);

  useEffect(() => {
    let scheduled = false;
    const run = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        syncRegister(records, (record) => setDetail(record));
      });
    };
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    run();
    return () => observer.disconnect();
  }, [records]);

  const switchToRegister = (type) => {
    const label = WORKFLOW_CONFIG[type].tab;
    window.setTimeout(() => {
      const button = [...document.querySelectorAll(".six-sidebar nav button")].find((node) => node.textContent?.includes(label));
      button?.click();
    }, 100);
  };

  const saveRecord = () => {
    if (workflow === "visual" && (!form.name.trim() || !form.owner.trim() || !form.normalCondition.trim())) {
      setNotice("Enter the visual standard name, accountable owner, and approved normal condition.");
      return;
    }
    if (workflow === "routine" && (!form.task.trim() || !form.owner.trim() || !form.acceptanceCriteria.trim())) {
      setNotice("Enter the routine name, accountable owner, and acceptance criteria.");
      return;
    }
    if (workflow === "improvement" && (!form.title.trim() || !form.owner.trim() || !form.problem.trim() || !form.proposed.trim())) {
      setNotice("Enter the improvement title, owner, problem, and proposed improvement.");
      return;
    }

    const created = new Date().toISOString();
    const base = { ...form, created, recordType: workflow };
    const record = workflow === "visual"
      ? { ...base, id: makeId("VS-6S"), status: "Pending Approval" }
      : workflow === "routine"
        ? { ...base, id: makeId("RTN-6S"), status: "Due" }
        : { ...base, id: makeId("IMP-6S"), status: "Open" };

    setRecords((current) => ({ ...current, [workflow]: [record, ...current[workflow]] }));
    setWorkflow(null);
    setDetail(record);
    switchToRegister(record.recordType);
  };

  const deleteRecord = (record) => {
    setRecords((current) => ({ ...current, [record.recordType]: current[record.recordType].filter((item) => item.id !== record.id) }));
    if (detail?.id === record.id) setDetail(null);
  };

  const config = workflow ? WORKFLOW_CONFIG[workflow] : null;
  const WorkflowIcon = config?.icon;

  return <>
    <button type="button" className="creation-records-launcher" onClick={() => setRecordsOpen(true)}><FolderOpen size={17} /> 6S Records <span>{allRecords.length}</span></button>

    {workflow && <div className="creation-overlay" onMouseDown={(e) => e.target === e.currentTarget && setWorkflow(null)}>
      <section className="creation-modal workflow-modal">
        <div className="creation-head"><div className="creation-head-icon"><WorkflowIcon size={21} /></div><div><small>{config.eyebrow}</small><h2>{config.label}</h2><p>{config.title}</p></div><button type="button" onClick={() => setWorkflow(null)}><X size={19} /></button></div>
        {notice && <div className="creation-notice"><ShieldCheck size={17} />{notice}</div>}
        {workflow === "visual" && <VisualForm form={form} setForm={setForm} />}
        {workflow === "routine" && <RoutineForm form={form} setForm={setForm} />}
        {workflow === "improvement" && <ImprovementForm form={form} setForm={setForm} />}
        <div className="creation-footer"><div><BarChart3 size={16} /><span>Saving updates the appropriate Northstar 6S register in this browser demonstration.</span></div><div><button type="button" onClick={() => setWorkflow(null)}>Cancel</button><button type="button" className="primary" onClick={saveRecord}><Save size={15} /> Save controlled record</button></div></div>
      </section>
    </div>}

    {recordsOpen && <div className="creation-overlay" onMouseDown={(e) => e.target === e.currentTarget && setRecordsOpen(false)}>
      <section className="creation-modal records-modal">
        <div className="creation-head"><div className="creation-head-icon"><FolderOpen size={21} /></div><div><small>DAVICORP · BROWSER-PERSISTENT DEMONSTRATION</small><h2>6S Records Center</h2><p>Visual standards, cleaning and inspection routines, and improvements created through the live workspace.</p></div><button type="button" onClick={() => setRecordsOpen(false)}><X size={19} /></button></div>
        <div className="records-summary"><div><ImagePlus /><small>Visual standards</small><strong>{records.visual.length}</strong></div><div><BrushCleaning /><small>Routines</small><strong>{records.routine.length}</strong></div><div><Lightbulb /><small>Improvements</small><strong>{records.improvement.length}</strong></div></div>
        <div className="records-list">{allRecords.length === 0 ? <div className="records-empty"><Plus size={22} /><strong>No new records created yet</strong><span>Use Create Visual Standard, Add Routine, or Add Improvement in the 6S workspace.</span></div> : allRecords.map((record) => {
          const title = record.recordType === "visual" ? record.name : record.recordType === "routine" ? record.task : record.title;
          const Icon = WORKFLOW_CONFIG[record.recordType].icon;
          return <article key={record.id}><span><Icon size={17} /></span><div><small>{WORKFLOW_CONFIG[record.recordType].label.toUpperCase()}</small><strong>{title}</strong><em>{record.area} · {record.owner} · {record.status}</em></div><button type="button" onClick={() => setDetail(record)}><Eye size={15} /> View</button><button type="button" className="delete" onClick={() => deleteRecord(record)}><Trash2 size={15} /></button></article>;
        })}</div>
        <div className="creation-actions"><button type="button" onClick={() => setRecordsOpen(false)}>Close</button></div>
      </section>
    </div>}

    {detail && <RecordDetail record={detail} onClose={() => setDetail(null)} />}

    <style jsx global>{`
      .creation-records-launcher{position:fixed;right:190px;bottom:22px;z-index:735;display:inline-flex;align-items:center;gap:8px;min-height:43px;padding:0 13px;border:1px solid #8ebbe3;border-radius:999px;color:#fff;background:linear-gradient(135deg,#0b345d,#176fc0);box-shadow:0 14px 34px rgba(8,49,88,.27);font:850 10px Inter,Arial,sans-serif;cursor:pointer}.creation-records-launcher span{min-width:23px;height:23px;display:grid;place-items:center;border-radius:999px;color:#0d487a;background:#fff}.creation-overlay{position:fixed;inset:0;z-index:920;display:grid;place-items:center;padding:18px;background:rgba(3,16,29,.78);backdrop-filter:blur(9px);font-family:Inter,Arial,sans-serif}.creation-modal{width:min(980px,97vw);max-height:94vh;overflow:auto;padding:21px;border:1px solid #cfdeea;border-radius:21px;color:#132b40;background:#f7fafc;box-shadow:0 34px 100px rgba(0,0,0,.42)}.workflow-modal{width:min(1060px,97vw)}.records-modal{width:min(900px,97vw)}.detail-modal{width:min(880px,97vw)}.creation-head{display:flex;align-items:flex-start;gap:12px;padding-bottom:15px;border-bottom:1px solid #d7e3ec}.creation-head>div:nth-child(2){margin-right:auto}.creation-head-icon{width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;color:#fff;background:linear-gradient(135deg,#0a66ff,#34b8e8)}.creation-head small{color:#0c68ba;font-size:8px;font-weight:950;letter-spacing:.13em}.creation-head h2{margin:5px 0 4px;font-size:24px}.creation-head p{max-width:760px;margin:0;color:#60798e;font-size:10px;line-height:1.55}.creation-head>button{width:37px;height:37px;display:grid;place-items:center;border:1px solid #c7d7e4;border-radius:10px;color:#36556d;background:#fff;cursor:pointer}.creation-notice{display:flex;align-items:center;gap:8px;margin-top:13px;padding:11px 13px;border:1px solid #f0be73;border-radius:11px;color:#744b0b;background:#fff4dc;font-size:10px;font-weight:850}.creation-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:17px}.creation-field{display:grid;gap:6px;color:#48647a;font-size:9px;font-weight:900}.creation-field.full,.creation-form-grid>.full{grid-column:1/-1}.creation-field input,.creation-field select,.creation-field textarea{width:100%;padding:11px;border:1px solid #c6d7e4;border-radius:10px;color:#153249;background:#fff;font:inherit;outline:none}.creation-field textarea{min-height:88px;resize:vertical}.creation-field input:focus,.creation-field select:focus,.creation-field textarea:focus{border-color:#0a66ff;box-shadow:0 0 0 3px rgba(10,102,255,.11)}.creation-date{width:100%;padding:10px 11px;border:1px solid #c6d7e4;border-radius:10px;background:#fff}.creation-date input{display:block;width:100%;min-width:0;padding:0;border:0;box-shadow:none}.creation-photo-field{display:grid;gap:7px}.creation-photo-field>span{color:#48647a;font-size:9px;font-weight:900}.creation-photo-upload{min-height:138px;display:grid;place-items:center;align-content:center;gap:5px;padding:15px;border:1px dashed #7caed6;border-radius:13px;color:#185b91;background:#edf7ff;text-align:center;cursor:pointer}.creation-photo-upload small{color:#647f95;font-size:8px}.creation-photo-upload input{display:none}.creation-photo-preview{position:relative;min-height:138px;overflow:hidden;border:1px solid #c9d8e4;border-radius:13px;background:#eaf1f6}.creation-photo-preview img{width:100%;height:190px;display:block;object-fit:cover}.creation-photo-preview button{position:absolute;right:9px;bottom:9px;display:flex;align-items:center;gap:5px;padding:8px 9px;border:1px solid #f3c2c8;border-radius:8px;color:#8b2936;background:#fff;font-size:8px;font-weight:900;cursor:pointer}.creation-check{display:flex;align-items:center;gap:9px;padding:12px;border:1px solid #d1dfe9;border-radius:11px;background:#fff;cursor:pointer}.creation-check input{width:auto}.creation-check span{display:flex;align-items:center;gap:7px;color:#244c69;font-size:9px}.creation-footer{display:flex;align-items:center;gap:12px;margin-top:17px;padding-top:15px;border-top:1px solid #d8e4ed}.creation-footer>div:first-child{display:flex;align-items:center;gap:7px;margin-right:auto;color:#607a8e;font-size:9px}.creation-footer>div:last-child,.creation-actions{display:flex;justify-content:flex-end;gap:8px}.creation-footer button,.creation-actions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 13px;border:1px solid #bfd1df;border-radius:9px;color:#16446c;background:#fff;font-size:9px;font-weight:900;cursor:pointer}.creation-footer .primary{border-color:#0a66ff;color:#fff;background:#0a66ff}.records-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.records-summary>div{position:relative;padding:14px;border:1px solid #d6e3ec;border-radius:13px;background:#fff}.records-summary svg{position:absolute;right:13px;top:13px;color:#0a66ff}.records-summary small,.records-summary strong{display:block}.records-summary small{color:#6d8397;font-size:8px;font-weight:900;text-transform:uppercase}.records-summary strong{margin-top:8px;font-size:25px}.records-list{display:grid;gap:8px}.records-list article{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;padding:12px;border:1px solid #d7e3ec;border-radius:12px;background:#fff}.records-list article>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#e8f3ff}.records-list small,.records-list strong,.records-list em{display:block}.records-list small{color:#0a66a5;font-size:7px;font-weight:950;letter-spacing:.08em}.records-list strong{margin:3px 0}.records-list em{color:#6d8396;font-size:8px;font-style:normal}.records-list button{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:0 10px;border:1px solid #c5d7e5;border-radius:8px;color:#16517e;background:#fff;font-size:8px;font-weight:900;cursor:pointer}.records-list .delete{width:34px;padding:0;color:#962f3b;border-color:#f0c6cb}.records-empty{display:grid;place-items:center;gap:6px;padding:38px;border:1px dashed #b9cedd;border-radius:14px;color:#58758c;background:#f8fbfd;text-align:center}.records-empty span{font-size:9px}.creation-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:16px}.creation-detail-grid>div{padding:12px;border:1px solid #d8e4ed;border-radius:11px;background:#fff}.creation-detail-grid small,.creation-detail-grid strong{display:block}.creation-detail-grid small{color:#71889a;font-size:8px;font-weight:900;text-transform:uppercase}.creation-detail-grid strong{margin-top:5px;white-space:pre-wrap;font-size:10px;line-height:1.55}.creation-detail-photos{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.creation-detail-photos img{width:100%;height:240px;object-fit:cover;border:1px solid #cbdbe6;border-radius:12px}.creation-control-strip{display:flex;align-items:center;gap:9px;margin:13px 0;padding:12px;border-left:4px solid #16855e;border-radius:10px;color:#195b46;background:#e9f8f1;font-size:9px;line-height:1.5}@media(max-width:780px){.creation-records-launcher{right:14px;bottom:72px}.creation-overlay{padding:7px}.creation-modal{padding:15px}.creation-form-grid,.creation-detail-grid,.creation-detail-photos,.records-summary{grid-template-columns:1fr}.creation-field.full,.creation-form-grid>.full{grid-column:auto}.creation-footer{align-items:flex-start;flex-direction:column}.creation-footer>div:last-child{width:100%}.creation-footer button{flex:1}.records-list article{grid-template-columns:auto 1fr auto}.records-list .delete{grid-column:3}.creation-photo-preview img{height:170px}}
    `}</style>
  </>;
}
