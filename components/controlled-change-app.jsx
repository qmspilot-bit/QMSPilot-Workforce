"use client";

import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  History,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UploadCloud,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const draftKey = "qmspilot:controlled-change:draft";
const recordsKey = "qmspilot:controlled-change:records";
const evidenceBucket = "controlled-change-evidence";

const documentTypes = {
  procedure: "Procedure",
  work_instruction: "Work instruction",
  drawing: "Drawing",
  form: "Form",
  specification: "Specification",
  manual: "Manual",
  external_standard: "External standard",
  other: "Other",
};

const documentStatuses = {
  draft: "Draft",
  review: "In review",
  approved: "Approved",
  superseded: "Superseded",
  obsolete: "Obsolete",
  archived: "Archived",
};

const changeStatuses = {
  draft: "Draft",
  impact_review: "Impact review",
  approval: "Approval",
  approved: "Approved",
  implementation: "Implementation",
  released: "Released",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const priorities = { low: "Low", moderate: "Moderate", high: "High", critical: "Critical" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createRecordId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `NCC-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createChangeNumber() {
  return `CCR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function splitList(value) {
  return String(value || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function safeFileName(name) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "evidence";
}

function normalizeHeader(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
}

function parseDelimited(text) {
  const rows = [];
  const delimiter = text.includes("\t") ? "\t" : ",";
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function blankDocument() {
  return {
    id: crypto.randomUUID(),
    documentNumber: "",
    title: "",
    type: "work_instruction",
    department: "",
    process: "",
    owner: "",
    revision: "A",
    status: "approved",
    effectiveDate: today(),
    reviewDate: dateFromToday(365),
    externalControlled: false,
    customerControlled: false,
    fileName: "",
    locationsText: "",
    pointOfUseCode: "",
    history: [],
  };
}

function approvalRoute() {
  return [
    { key: "document_owner", role: "Document Owner", required: true, decision: "pending", approver: "", decisionAt: "", comments: "" },
    { key: "engineering", role: "Engineering", required: true, decision: "pending", approver: "", decisionAt: "", comments: "" },
    { key: "operations", role: "Operations", required: true, decision: "pending", approver: "", decisionAt: "", comments: "" },
    { key: "quality", role: "Quality", required: true, decision: "pending", approver: "", decisionAt: "", comments: "" },
    { key: "safety", role: "Safety", required: false, decision: "not_required", approver: "", decisionAt: "", comments: "" },
    { key: "customer", role: "Customer Approval", required: false, decision: "not_required", approver: "", decisionAt: "", comments: "" },
    { key: "executive", role: "Executive Approval", required: false, decision: "not_required", approver: "", decisionAt: "", comments: "" },
  ];
}

function blankChange(documentId = "") {
  return {
    id: crypto.randomUUID(),
    changeNumber: createChangeNumber(),
    documentId,
    title: "",
    source: "improvement",
    reason: "",
    requestor: "",
    priority: "moderate",
    status: "draft",
    requestedEffectiveDate: dateFromToday(30),
    newRevision: "",
    impact: {
      departmentsText: "",
      rolesText: "",
      assetsText: "",
      linkedDocumentsText: "",
      workInProcessDisposition: "",
      qualityImpact: false,
      safetyImpact: false,
      customerImpact: false,
      shutdownRequired: false,
      customerApprovalRequired: false,
    },
    implementation: {
      owner: "",
      effectiveDate: "",
      pointOfUseLocationsText: "",
      obsoleteCopiesRemoved: false,
      updatedFormsInUse: false,
      firstJobVerified: false,
      releaseNotes: "",
      releasedAt: "",
    },
    training: {
      required: true,
      rolesText: "",
      assignedCount: 0,
      completedCount: 0,
      handoffCreated: false,
    },
    linkedRecordsText: "",
    evidenceNames: [],
    approvals: approvalRoute(),
    history: [],
  };
}

function demoData() {
  const documents = [
    {
      ...blankDocument(),
      id: "doc-demo-1",
      documentNumber: "WI-OPS-014",
      title: "Final Inspection and Product Release",
      type: "work_instruction",
      department: "Quality",
      process: "Final Inspection",
      owner: "Quality Manager",
      revision: "C",
      status: "approved",
      effectiveDate: dateFromToday(-180),
      reviewDate: dateFromToday(185),
      fileName: "WI-OPS-014_RevC.pdf",
      locationsText: "Final inspection station, Quality office",
      pointOfUseCode: "POU-WI-OPS-014-C",
      history: [{ id: crypto.randomUUID(), date: dateFromToday(-180), type: "Release", detail: "Revision C released for production use.", actor: "Quality Manager" }],
    },
    {
      ...blankDocument(),
      id: "doc-demo-2",
      documentNumber: "WI-MFG-022",
      title: "Pressing Operation Standard Work",
      type: "work_instruction",
      department: "Operations",
      process: "Pressing",
      owner: "Operations Manager",
      revision: "B",
      status: "approved",
      effectiveDate: dateFromToday(-300),
      reviewDate: dateFromToday(-5),
      fileName: "WI-MFG-022_RevB.pdf",
      locationsText: "Pressing cell 1, Pressing cell 2",
      pointOfUseCode: "POU-WI-MFG-022-B",
      history: [{ id: crypto.randomUUID(), date: dateFromToday(-300), type: "Release", detail: "Revision B released.", actor: "Operations Manager" }],
    },
    {
      ...blankDocument(),
      id: "doc-demo-3",
      documentNumber: "PM-AR-006",
      title: "Blast Cabinet Preventive Maintenance",
      type: "procedure",
      department: "Maintenance",
      process: "Asset Reliability",
      owner: "Maintenance Lead",
      revision: "A",
      status: "approved",
      effectiveDate: dateFromToday(-90),
      reviewDate: dateFromToday(275),
      fileName: "PM-AR-006_RevA.pdf",
      locationsText: "Maintenance shop, Blast area",
      pointOfUseCode: "POU-PM-AR-006-A",
      history: [{ id: crypto.randomUUID(), date: dateFromToday(-90), type: "Release", detail: "Initial release.", actor: "Maintenance Lead" }],
    },
  ];

  const changeOne = {
    ...blankChange("doc-demo-1"),
    id: "change-demo-1",
    changeNumber: "CCR-2026-0042",
    title: "Add photo evidence and dual verification to final release",
    source: "capa",
    reason: "CAPA-2026-0017 identified inconsistent proof of final inspection completion across shifts.",
    requestor: "Quality Manager",
    priority: "high",
    status: "approval",
    requestedEffectiveDate: dateFromToday(14),
    newRevision: "D",
    impact: {
      departmentsText: "Quality, Operations, Shipping",
      rolesText: "Quality Inspector, Final Inspector, Shipping Specialist",
      assetsText: "Final inspection stations",
      linkedDocumentsText: "FRM-QA-009, WI-SHP-003",
      workInProcessDisposition: "All open orders require the new photo evidence beginning on the effective date.",
      qualityImpact: true,
      safetyImpact: false,
      customerImpact: true,
      shutdownRequired: false,
      customerApprovalRequired: false,
    },
    implementation: {
      owner: "Quality Manager",
      effectiveDate: dateFromToday(14),
      pointOfUseLocationsText: "Final inspection station, Shipping verification desk",
      obsoleteCopiesRemoved: false,
      updatedFormsInUse: false,
      firstJobVerified: false,
      releaseNotes: "Release after all shifts complete competency acknowledgment.",
      releasedAt: "",
    },
    training: { required: true, rolesText: "Quality Inspector, Shipping Specialist", assignedCount: 12, completedCount: 7, handoffCreated: true },
    linkedRecordsText: "CAPA-2026-0017, NCR-2026-0088",
    evidenceNames: ["CAPA-2026-0017.pdf", "revised_workflow.png"],
    approvals: approvalRoute().map((approval) => {
      if (["document_owner", "engineering", "quality"].includes(approval.key)) return { ...approval, decision: "approved", approver: approval.key === "quality" ? "Quality Director" : approval.role, decisionAt: new Date().toISOString(), comments: "Approved for implementation." };
      if (approval.key === "customer") return { ...approval, required: false, decision: "not_required" };
      return approval;
    }),
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Change request", detail: "Impact assessment completed and submitted for approval.", actor: "Quality Manager" }],
  };

  const changeTwo = {
    ...blankChange("doc-demo-3"),
    id: "change-demo-2",
    changeNumber: "CCR-2026-0038",
    title: "Add weekly dust-collection differential-pressure check",
    source: "asset_reliability",
    reason: "Repeat blast cabinet restriction was linked to missed filter loading indicators.",
    requestor: "Maintenance Lead",
    priority: "high",
    status: "released",
    requestedEffectiveDate: dateFromToday(-10),
    newRevision: "B",
    impact: {
      departmentsText: "Maintenance, Operations",
      rolesText: "Maintenance Technician, Blast Operator",
      assetsText: "Blast cabinet BC-01",
      linkedDocumentsText: "PM checklist AR-006-A",
      workInProcessDisposition: "No WIP impact.",
      qualityImpact: false,
      safetyImpact: true,
      customerImpact: false,
      shutdownRequired: false,
      customerApprovalRequired: false,
    },
    implementation: {
      owner: "Maintenance Lead",
      effectiveDate: dateFromToday(-10),
      pointOfUseLocationsText: "Blast cabinet BC-01, Maintenance shop",
      obsoleteCopiesRemoved: true,
      updatedFormsInUse: true,
      firstJobVerified: true,
      releaseNotes: "Revision B verified during first weekly check.",
      releasedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    },
    training: { required: true, rolesText: "Maintenance Technician, Blast Operator", assignedCount: 6, completedCount: 6, handoffCreated: true },
    linkedRecordsText: "WO-2026-BLAST1",
    evidenceNames: ["first_check_photo.jpg"],
    approvals: approvalRoute().map((approval) => ({ ...approval, required: ["document_owner", "operations", "quality", "safety"].includes(approval.key), decision: ["document_owner", "operations", "quality", "safety"].includes(approval.key) ? "approved" : "not_required", approver: ["document_owner", "operations", "quality", "safety"].includes(approval.key) ? approval.role : "", decisionAt: ["document_owner", "operations", "quality", "safety"].includes(approval.key) ? new Date(Date.now() - 12 * 86400000).toISOString() : "", comments: "Released." })),
    history: [{ id: crypto.randomUUID(), date: new Date(Date.now() - 8 * 86400000).toISOString(), type: "Release", detail: "Revision B released and point-of-use verification completed.", actor: "Maintenance Lead" }],
  };

  documents[2].revision = "B";
  documents[2].effectiveDate = dateFromToday(-10);
  documents[2].pointOfUseCode = "POU-PM-AR-006-B";
  return { documents, changes: [changeOne, changeTwo] };
}

export default function ControlledChangeApp() {
  const cloud = useCloudWorkspace();
  const documentFilesRef = useRef(new Map());
  const changeFilesRef = useRef(new Map());

  const [setup, setSetup] = useState({
    organization: "QMSPilot Design Partner",
    site: "",
    controlOwner: "",
    reviewHorizonDays: 60,
    leadershipIntent: "Ensure every approved change reaches the correct people, equipment, process, and point of use before production relies on it.",
  });
  const [documents, setDocuments] = useState([]);
  const [changes, setChanges] = useState([]);
  const [recordId, setRecordId] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [documentModal, setDocumentModal] = useState(false);
  const [documentForm, setDocumentForm] = useState(blankDocument());
  const [changeModal, setChangeModal] = useState(false);
  const [changeForm, setChangeForm] = useState(blankChange());
  const [activeChangeId, setActiveChangeId] = useState("");
  const [historyItem, setHistoryItem] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.setup) setSetup(draft.setup);
      if (Array.isArray(draft.documents)) setDocuments(draft.documents);
      if (Array.isArray(draft.changes)) setChanges(draft.changes);
      if (draft.recordId) setRecordId(draft.recordId);
      setNotice("Saved Controlled Change workspace restored.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  const departments = useMemo(() => [...new Set(documents.map((document) => document.department).filter(Boolean))].sort(), [documents]);

  const metrics = useMemo(() => {
    const currentDocuments = documents.filter((document) => !["archived", "obsolete"].includes(document.status));
    const overdueReviews = currentDocuments.filter((document) => document.reviewDate && document.reviewDate < today()).length;
    const dueReviews = currentDocuments.filter((document) => document.reviewDate && document.reviewDate <= dateFromToday(Number(setup.reviewHorizonDays) || 60)).length;
    const pendingApprovals = changes.reduce((sum, change) => sum + (change.approvals || []).filter((approval) => approval.required && approval.decision === "pending").length, 0);
    const rejectedApprovals = changes.reduce((sum, change) => sum + (change.approvals || []).filter((approval) => approval.required && approval.decision === "rejected").length, 0);
    const trainingGaps = changes.reduce((sum, change) => sum + Math.max(0, Number(change.training?.assignedCount || 0) - Number(change.training?.completedCount || 0)), 0);
    const obsoleteExposure = documents.filter((document) => ["superseded", "obsolete"].includes(document.status) && splitList(document.locationsText).length > 0).length + changes.filter((change) => change.status === "implementation" && !change.implementation?.obsoleteCopiesRemoved).length;
    const highRiskOpen = changes.filter((change) => ["high", "critical"].includes(change.priority) && !["released", "rejected", "cancelled"].includes(change.status)).length;
    const released = changes.filter((change) => change.status === "released").length;
    const pointOfUseVerified = changes.filter((change) => change.status === "released" && change.implementation?.obsoleteCopiesRemoved && change.implementation?.firstJobVerified).length;
    const pointOfUseRate = released ? Math.round((pointOfUseVerified / released) * 100) : 100;
    const score = Math.max(0, Math.min(100, 100 - overdueReviews * 5 - pendingApprovals * 2 - rejectedApprovals * 10 - trainingGaps * 1.5 - obsoleteExposure * 8 - highRiskOpen * 3));
    return { currentDocuments, overdueReviews, dueReviews, pendingApprovals, rejectedApprovals, trainingGaps, obsoleteExposure, highRiskOpen, released, pointOfUseRate, score: Math.round(score) };
  }, [documents, changes, setup.reviewHorizonDays]);

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const matchesSearch = `${document.documentNumber} ${document.title} ${document.process} ${document.owner}`.toLowerCase().includes(documentSearch.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || document.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? !["archived", "obsolete"].includes(document.status) : document.status === statusFilter);
    return matchesSearch && matchesDepartment && matchesStatus;
  }), [documents, documentSearch, departmentFilter, statusFilter]);

  const activeChange = useMemo(() => changes.find((change) => change.id === activeChangeId) || null, [changes, activeChangeId]);

  function openNewDocument(template = null) {
    const next = template ? { ...deepClone(template), id: crypto.randomUUID(), documentNumber: "", title: `${template.title} Copy`, fileName: "", revision: "A", history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Document", detail: `Profile duplicated from ${template.documentNumber}.`, actor: setup.controlOwner || "Authorized user" }] } : blankDocument();
    setDocumentForm(next);
    setDocumentModal(true);
  }

  function editDocument(document) {
    setDocumentForm(deepClone(document));
    setDocumentModal(true);
  }

  function handleDocumentFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      setNotice("Controlled document files must be 30 MB or smaller.");
      return;
    }
    setDocumentForm((current) => ({ ...current, fileName: file.name }));
    documentFilesRef.current.set(documentForm.id, [file]);
  }

  function saveDocument() {
    if (!documentForm.documentNumber.trim() || !documentForm.title.trim() || !documentForm.department.trim() || !documentForm.owner.trim()) {
      setNotice("Document number, title, department, and owner are required.");
      return;
    }
    const duplicate = documents.some((document) => document.documentNumber.toLowerCase() === documentForm.documentNumber.toLowerCase() && document.id !== documentForm.id);
    if (duplicate) {
      setNotice("Document number must be unique.");
      return;
    }
    const exists = documents.some((document) => document.id === documentForm.id);
    const pointOfUseCode = documentForm.pointOfUseCode || `POU-${documentForm.documentNumber.replace(/[^A-Za-z0-9]/g, "-")}-${documentForm.revision}`;
    const event = { id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Document update" : "Document creation", detail: exists ? "Controlled document record updated." : "Controlled document added to the register.", actor: setup.controlOwner || documentForm.owner || "Authorized user" };
    const saved = { ...documentForm, pointOfUseCode, history: [event, ...(documentForm.history || [])] };
    setDocuments((current) => exists ? current.map((document) => document.id === saved.id ? saved : document) : [...current, saved]);
    setDocumentModal(false);
    setSubmitted(false);
    setNotice(`${saved.documentNumber} saved to the controlled document register.`);
  }

  function archiveDocument(document) {
    if (!window.confirm(`Archive ${document.documentNumber}? Its revision history will remain in the controlled record.`)) return;
    setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, status: "archived", history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Archive", detail: "Document archived from active use.", actor: setup.controlOwner || "Authorized user" }, ...(item.history || [])] } : item));
    setSubmitted(false);
    setNotice(`${document.documentNumber} archived.`);
  }

  function openNewChange(documentId = "") {
    setChangeForm(blankChange(documentId));
    setChangeModal(true);
  }

  function editChange(change) {
    setChangeForm(deepClone(change));
    setChangeModal(true);
  }

  function syncApprovalRequirements(change) {
    const approvals = (change.approvals || approvalRoute()).map((approval) => {
      if (approval.key === "safety") {
        const required = Boolean(change.impact.safetyImpact);
        return { ...approval, required, decision: required && approval.decision === "not_required" ? "pending" : !required ? "not_required" : approval.decision };
      }
      if (approval.key === "customer") {
        const required = Boolean(change.impact.customerApprovalRequired);
        return { ...approval, required, decision: required && approval.decision === "not_required" ? "pending" : !required ? "not_required" : approval.decision };
      }
      if (approval.key === "executive") {
        const required = change.priority === "critical";
        return { ...approval, required, decision: required && approval.decision === "not_required" ? "pending" : !required ? "not_required" : approval.decision };
      }
      return approval;
    });
    return { ...change, approvals };
  }

  function handleChangeEvidence(event) {
    const files = Array.from(event.target.files || []);
    if (files.length > 8) {
      setNotice("A change request allows no more than 8 evidence files.");
      return;
    }
    if (files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) {
      setNotice("Change evidence must be 30 MB or smaller in total.");
      return;
    }
    setChangeForm((current) => ({ ...current, evidenceNames: files.map((file) => file.name) }));
    changeFilesRef.current.set(changeForm.id, files);
  }

  function saveChange() {
    if (!changeForm.title.trim() || !changeForm.reason.trim() || !changeForm.requestor.trim()) {
      setNotice("Change title, reason, and requestor are required.");
      return;
    }
    const exists = changes.some((change) => change.id === changeForm.id);
    const routed = syncApprovalRequirements(changeForm);
    const status = routed.status === "draft" ? "impact_review" : routed.status;
    const event = { id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Change update" : "Change request", detail: exists ? "Change package updated." : "Change request created and moved to impact review.", actor: setup.controlOwner || routed.requestor || "Authorized user" };
    const saved = { ...routed, status, history: [event, ...(routed.history || [])] };
    setChanges((current) => exists ? current.map((change) => change.id === saved.id ? saved : change) : [saved, ...current]);
    setActiveChangeId(saved.id);
    setChangeModal(false);
    setSubmitted(false);
    setNotice(`${saved.changeNumber} saved. Approval routing is ready.`);
  }

  function updateActiveChange(patch) {
    if (!activeChange) return;
    setChanges((current) => current.map((change) => change.id === activeChange.id ? { ...change, ...patch } : change));
    setSubmitted(false);
  }

  function updateApproval(approvalKey, patch) {
    if (!activeChange) return;
    const approvals = activeChange.approvals.map((approval) => approval.key !== approvalKey ? approval : {
      ...approval,
      ...patch,
      decisionAt: patch.decision && patch.decision !== "pending" && patch.decision !== "not_required" ? new Date().toISOString() : approval.decisionAt,
    });
    const rejected = approvals.some((approval) => approval.required && approval.decision === "rejected");
    const approved = approvals.filter((approval) => approval.required).every((approval) => approval.decision === "approved");
    const status = rejected ? "rejected" : approved ? "approved" : "approval";
    updateActiveChange({ approvals, status });
  }

  function createTrainingHandoff() {
    if (!activeChange) return;
    const roles = splitList(activeChange.training.rolesText || activeChange.impact.rolesText);
    const assignedCount = Math.max(Number(activeChange.training.assignedCount || 0), roles.length);
    const training = { ...activeChange.training, rolesText: roles.join(", "), assignedCount, handoffCreated: true };
    updateActiveChange({ training, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Workforce handoff", detail: `Training-impact handoff prepared for ${roles.length || 0} affected roles.`, actor: setup.controlOwner || "Authorized user" }, ...(activeChange.history || [])] });
    setNotice("Workforce Readiness training-impact handoff prepared in the controlled change package.");
  }

  function releaseChange() {
    if (!activeChange) return;
    const requiredApprovals = activeChange.approvals.filter((approval) => approval.required);
    if (!requiredApprovals.every((approval) => approval.decision === "approved")) {
      setNotice("All required approvals must be approved before release.");
      return;
    }
    if (!activeChange.newRevision.trim() || !activeChange.implementation.owner.trim() || !activeChange.implementation.effectiveDate) {
      setNotice("New revision, implementation owner, and effective date are required before release.");
      return;
    }
    if (activeChange.training.required && Number(activeChange.training.completedCount || 0) < Number(activeChange.training.assignedCount || 0)) {
      setNotice("Required training must be complete before the change can be released.");
      return;
    }
    if (!activeChange.implementation.obsoleteCopiesRemoved || !activeChange.implementation.updatedFormsInUse || !activeChange.implementation.firstJobVerified) {
      setNotice("Release requires obsolete-copy removal, updated-form verification, and first-job or first-article verification.");
      return;
    }
    const releasedAt = new Date().toISOString();
    const released = { ...activeChange, status: "released", implementation: { ...activeChange.implementation, releasedAt }, history: [{ id: crypto.randomUUID(), date: releasedAt, type: "Release", detail: `Revision ${activeChange.newRevision} released for controlled use.`, actor: activeChange.implementation.owner }, ...(activeChange.history || [])] };
    setChanges((current) => current.map((change) => change.id === released.id ? released : change));
    if (released.documentId) {
      setDocuments((current) => current.map((document) => document.id !== released.documentId ? document : {
        ...document,
        revision: released.newRevision,
        status: "approved",
        effectiveDate: released.implementation.effectiveDate,
        locationsText: released.implementation.pointOfUseLocationsText || document.locationsText,
        pointOfUseCode: `POU-${document.documentNumber.replace(/[^A-Za-z0-9]/g, "-")}-${released.newRevision}`,
        history: [{ id: crypto.randomUUID(), date: releasedAt, type: "Release", detail: `${released.changeNumber} released revision ${released.newRevision}.`, actor: released.implementation.owner }, ...(document.history || [])],
      }));
    }
    setSubmitted(false);
    setNotice(`${released.changeNumber} released. The controlled document register and point-of-use revision were updated.`);
  }

  function copyPointOfUse(document) {
    const link = `${window.location.origin}/tools/controlled-change?document=${encodeURIComponent(document.documentNumber)}&revision=${encodeURIComponent(document.revision)}&code=${encodeURIComponent(document.pointOfUseCode)}`;
    navigator.clipboard?.writeText(link);
    setNotice(`Point-of-use link copied for ${document.documentNumber} revision ${document.revision}.`);
  }

  function loadDemo() {
    const demo = demoData();
    setSetup({ organization: "Northstar Precision Systems", site: "Lufkin Operations", controlOwner: "Quality Systems Manager", reviewHorizonDays: 60, leadershipIntent: "Convert corrective, customer, engineering, and reliability decisions into approved standards, completed training, and verified point-of-use execution." });
    setDocuments(demo.documents);
    setChanges(demo.changes);
    setActiveChangeId(demo.changes[0].id);
    setRecordId("");
    setSubmitted(false);
    setNotice("Design-partner Controlled Change demonstration loaded.");
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify({ setup, documents, changes, recordId }));
    setNotice("Controlled Change workspace saved on this device.");
  }

  function clearTool() {
    if ((documents.length || changes.length) && !window.confirm("Start a new Controlled Change workspace and clear the current local draft?")) return;
    setSetup({ organization: "QMSPilot Design Partner", site: "", controlOwner: "", reviewHorizonDays: 60, leadershipIntent: "Ensure every approved change reaches the correct people, equipment, process, and point of use before production relies on it." });
    setDocuments([]);
    setChanges([]);
    setActiveChangeId("");
    setRecordId("");
    setSubmitted(false);
    setNotice("New Controlled Change workspace started.");
    window.localStorage.removeItem(draftKey);
  }

  function downloadTemplate() {
    const csv = "documentNumber,title,type,department,process,owner,revision,status,effectiveDate,reviewDate,externalControlled,customerControlled,locations\nWI-001,Controlled Work Instruction,work_instruction,Operations,Assembly,Operations Manager,A,approved,2026-07-22,2027-07-22,false,false,Assembly Cell 1\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Northstar_Controlled_Document_Register_Template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function readImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
      setNotice("For Excel, save the register as CSV or paste copied Excel rows into the import window.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(file);
  }

  function importDocuments() {
    const rows = parseDelimited(importText);
    if (rows.length < 2) {
      setNotice("No document rows were found. Use the Northstar template or paste rows copied from Excel.");
      return;
    }
    const headers = rows[0].map(normalizeHeader);
    const aliases = {
      documentnumber: ["documentnumber", "docnumber", "documentid", "docid"],
      title: ["title", "documenttitle", "name"],
      type: ["type", "documenttype"],
      department: ["department", "dept"],
      process: ["process", "processname"],
      owner: ["owner", "documentowner"],
      revision: ["revision", "rev"],
      status: ["status", "documentstatus"],
      effectivedate: ["effectivedate", "releasedate"],
      reviewdate: ["reviewdate", "nextreview"],
      externalcontrolled: ["externalcontrolled", "external"],
      customercontrolled: ["customercontrolled", "customer"],
      locations: ["locations", "distributionlocations", "pointofuse"],
    };
    const indexFor = (key) => headers.findIndex((header) => aliases[key].includes(header));
    if (["documentnumber", "title", "department", "owner"].some((key) => indexFor(key) < 0)) {
      setNotice("Import requires documentNumber, title, department, and owner columns.");
      return;
    }
    let added = 0;
    let updated = 0;
    setDocuments((current) => {
      const next = deepClone(current);
      rows.slice(1).forEach((row) => {
        const value = (key, fallback = "") => {
          const index = indexFor(key);
          return index >= 0 ? String(row[index] || "").trim() : fallback;
        };
        const documentNumber = value("documentnumber");
        const title = value("title");
        if (!documentNumber || !title) return;
        const existingIndex = next.findIndex((document) => document.documentNumber.toLowerCase() === documentNumber.toLowerCase());
        const type = Object.keys(documentTypes).includes(value("type")) ? value("type") : "work_instruction";
        const status = Object.keys(documentStatuses).includes(value("status")) ? value("status") : "approved";
        const patch = {
          documentNumber,
          title,
          type,
          department: value("department"),
          process: value("process"),
          owner: value("owner"),
          revision: value("revision", "A") || "A",
          status,
          effectiveDate: value("effectivedate"),
          reviewDate: value("reviewdate"),
          externalControlled: ["true", "yes", "1", "y"].includes(value("externalcontrolled").toLowerCase()),
          customerControlled: ["true", "yes", "1", "y"].includes(value("customercontrolled").toLowerCase()),
          locationsText: value("locations"),
        };
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...patch, pointOfUseCode: `POU-${documentNumber.replace(/[^A-Za-z0-9]/g, "-")}-${patch.revision}`, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Import", detail: "Document register fields updated by Excel/CSV import.", actor: setup.controlOwner || "Authorized user" }, ...(next[existingIndex].history || [])] };
          updated += 1;
        } else {
          const document = blankDocument();
          next.push({ ...document, ...patch, pointOfUseCode: `POU-${documentNumber.replace(/[^A-Za-z0-9]/g, "-")}-${patch.revision}`, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Import", detail: "Document added by Excel/CSV import.", actor: setup.controlOwner || "Authorized user" }] });
          added += 1;
        }
      });
      return next;
    });
    setImportModal(false);
    setImportText("");
    setSubmitted(false);
    setNotice(`Document-register import complete: ${added} added, ${updated} updated.`);
  }

  function buildPayload(id) {
    return {
      schema: "qmspilot.northstar.controlled-change.v1",
      recordId: id,
      toolId: "QMSP-CC-001",
      version: "1.0.0",
      submittedAt: new Date().toISOString(),
      setup,
      metrics: {
        changeHealthScore: metrics.score,
        activeDocuments: metrics.currentDocuments.length,
        pendingApprovals: metrics.pendingApprovals,
        trainingGaps: metrics.trainingGaps,
        overdueReviews: metrics.overdueReviews,
        obsoleteExposure: metrics.obsoleteExposure,
        highRiskOpenChanges: metrics.highRiskOpen,
        pointOfUseVerificationRate: metrics.pointOfUseRate,
      },
      documents,
      changes,
      governance: {
        humanApprovalAuthority: true,
        revisionHistoryPreserved: true,
        trainingImpactControlled: true,
        pointOfUseVerificationRequired: true,
        source: "Northstar Controlled Change",
      },
    };
  }

  async function uploadEvidence(supabase, organizationId, snapshotId, documentIds, changeIds) {
    let uploaded = 0;
    const groups = [];
    for (const [localId, files] of documentFilesRef.current.entries()) groups.push({ entityType: "document", localId, databaseId: documentIds.get(localId), files });
    for (const [localId, files] of changeFilesRef.current.entries()) groups.push({ entityType: "change_request", localId, databaseId: changeIds.get(localId), files });
    for (const group of groups) {
      if (!group.databaseId || !group.files?.length) continue;
      if (group.files.length > 8) throw new Error("Evidence allows no more than 8 files per controlled record.");
      if (group.files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) throw new Error("Evidence must be 30 MB or smaller per controlled record.");
      for (const file of group.files) {
        const evidenceId = crypto.randomUUID();
        const storagePath = `${organizationId}/${snapshotId}/${group.entityType}/${group.databaseId}/${evidenceId}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(evidenceBucket).upload(storagePath, file, { contentType: file.type || "application/octet-stream", cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: evidenceError } = await supabase.from("controlled_change_evidence").insert({
          id: evidenceId,
          organization_id: organizationId,
          snapshot_id: snapshotId,
          document_id: group.entityType === "document" ? group.databaseId : null,
          change_request_id: group.entityType === "change_request" ? group.databaseId : null,
          entity_type: group.entityType,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          uploaded_by: cloud.user.id,
        });
        if (evidenceError) throw evidenceError;
        uploaded += 1;
      }
    }
    return uploaded;
  }

  async function submitToNorthstar() {
    if (!setup.organization.trim() || !setup.site.trim() || !setup.controlOwner.trim()) {
      setNotice("Complete organization, site, and controlled-change owner before submission.");
      return;
    }
    if (!documents.length) {
      setNotice("Add or import at least one controlled document before submission.");
      return;
    }
    setSaving(true);
    const id = recordId || createRecordId();
    const payload = buildPayload(id);
    try {
      const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]");
      window.localStorage.setItem(recordsKey, JSON.stringify([payload, ...records].slice(0, 50)));
      window.localStorage.removeItem(draftKey);

      if (cloud.status === "ready" && cloud.organizationId && cloud.user) {
        const supabase = createClient();
        if (!supabase) throw new Error("Northstar Secure cloud is unavailable.");
        const { data: snapshot, error: snapshotError } = await supabase.from("controlled_change_snapshots").upsert({
          record_id: id,
          organization_id: cloud.organizationId,
          created_by: cloud.user.id,
          organization_name: setup.organization || cloud.organizationName,
          site: setup.site,
          change_health_score: metrics.score,
          pending_approvals: metrics.pendingApprovals,
          training_gaps: metrics.trainingGaps,
          overdue_reviews: metrics.overdueReviews,
          obsolete_exposure: metrics.obsoleteExposure,
          payload,
          submitted_at: payload.submittedAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "record_id" }).select("id").single();
        if (snapshotError) throw snapshotError;
        if (!snapshot?.id) throw new Error("Northstar did not return the Controlled Change record ID.");

        const documentRows = documents.map((document) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          document_key: document.id,
          document_number: document.documentNumber,
          title: document.title,
          document_type: document.type,
          department: document.department,
          process_name: document.process,
          owner_name: document.owner,
          revision: document.revision,
          document_status: document.status,
          effective_date: document.effectiveDate || null,
          review_date: document.reviewDate || null,
          external_controlled: document.externalControlled,
          customer_controlled: document.customerControlled,
          file_name: document.fileName,
          distribution_locations: splitList(document.locationsText),
          point_of_use_code: document.pointOfUseCode,
          history: document.history || [],
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        }));
        const { data: savedDocuments, error: documentError } = await supabase.from("controlled_documents").upsert(documentRows, { onConflict: "snapshot_id,document_number" }).select("id, document_key");
        if (documentError) throw documentError;
        const documentIds = new Map((savedDocuments || []).map((document) => [document.document_key, document.id]));

        const changeRows = changes.map((change) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          document_id: change.documentId ? documentIds.get(change.documentId) || null : null,
          change_key: change.id,
          change_number: change.changeNumber,
          title: change.title,
          change_source: change.source,
          reason: change.reason,
          requestor: change.requestor,
          priority: change.priority,
          change_status: change.status,
          requested_effective_date: change.requestedEffectiveDate || null,
          new_revision: change.newRevision,
          impact: change.impact,
          implementation: change.implementation,
          training: change.training,
          linked_records: splitList(change.linkedRecordsText),
          evidence_names: change.evidenceNames || [],
          history: change.history || [],
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        }));
        let savedChanges = [];
        if (changeRows.length) {
          const { data, error } = await supabase.from("controlled_change_requests").upsert(changeRows, { onConflict: "snapshot_id,change_number" }).select("id, change_key");
          if (error) throw error;
          savedChanges = data || [];
        }
        const changeIds = new Map(savedChanges.map((change) => [change.change_key, change.id]));

        const approvalRows = changes.flatMap((change) => (change.approvals || []).map((approval) => ({
          organization_id: cloud.organizationId,
          change_request_id: changeIds.get(change.id),
          approval_key: approval.key,
          role_name: approval.role,
          required: approval.required,
          decision: approval.decision,
          approver_name: approval.approver,
          decision_at: approval.decisionAt || null,
          comments: approval.comments,
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        })).filter((approval) => approval.change_request_id));
        if (approvalRows.length) {
          const { error: approvalError } = await supabase.from("controlled_change_approvals").upsert(approvalRows, { onConflict: "change_request_id,approval_key" });
          if (approvalError) throw approvalError;
        }

        const uploaded = await uploadEvidence(supabase, cloud.organizationId, snapshot.id, documentIds, changeIds);
        documentFilesRef.current.clear();
        changeFilesRef.current.clear();
        setNotice(`${id} submitted to the secure Northstar workspace with ${documents.length} documents, ${changes.length} change packages, and ${uploaded} evidence file${uploaded === 1 ? "" : "s"}.`);
      } else {
        setNotice(`${id} saved in the Northstar demonstration workspace. Sign in to Secure cloud for tenant-protected persistence.`);
      }
      setRecordId(id);
      setSubmitted(true);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Controlled Change could not submit to Northstar.");
    } finally {
      setSaving(false);
    }
  }

  function exportRecord() {
    const id = recordId || createRecordId();
    if (!recordId) setRecordId(id);
    const url = URL.createObjectURL(new Blob([JSON.stringify(buildPayload(id), null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}-controlled-change.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="cc-shell">
      <header className="cc-header">
        <a href="/" className="back" aria-label="Return to Northstar"><ArrowLeft size={18} /></a>
        <div className="brand-lockup"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar-lockup"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="header-meta"><small>Northstar-connected production tool</small><strong>Controlled Change</strong></div>
        <div className="header-status"><span />Human approval authority active</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><BookOpenCheck size={17} /> DOCUMENT CONTROL · REVISION APPROVAL · TRAINING IMPACT · POINT OF USE</div>
          <h1>Turn every approved decision into controlled execution.</h1>
          <p>Control the document register, assess operational impact, route human approvals, complete workforce training, remove obsolete information, and verify the correct revision at the point of work.</p>
          <div className="chips"><span>Tool ID QMSP-CC-001</span><span>Version 1.0.0</span><span>Northstar Connected</span><span>ISO 9001 · 7.5 aligned</span></div>
        </div>
        <article className="health-card">
          <small>CONTROLLED CHANGE HEALTH</small>
          <strong>{metrics.score}%</strong>
          <span>{metrics.score >= 90 ? "Strong control" : metrics.score >= 75 ? "Leadership attention" : "Execution exposure"}</span>
          <div className="ring" style={{ background: `conic-gradient(#0a66ff ${metrics.score * 3.6}deg,#26384d 0)` }}><div>{metrics.score}</div></div>
        </article>
      </section>

      <section className="toolbar no-print">
        <button onClick={loadDemo}><Sparkles size={17} />Load design-partner demo</button>
        <button onClick={saveDraft}><Save size={17} />Save draft</button>
        <button onClick={() => window.print()}><Printer size={17} />Executive report</button>
        <button onClick={exportRecord}><Download size={17} />Export record</button>
        <button onClick={clearTool}><RotateCcw size={17} />New workspace</button>
        <button className="submit" onClick={submitToNorthstar} disabled={saving}><Send size={17} />{saving ? "Submitting..." : "Submit to Northstar"}</button>
      </section>

      {notice && <div className={`notice ${submitted ? "submitted" : ""}`}>{submitted ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{notice}</div>}

      <section className="metrics">
        <article><small>Current documents</small><strong>{metrics.currentDocuments.length}</strong><span>{departments.length} departments</span></article>
        <article><small>Pending approvals</small><strong>{metrics.pendingApprovals}</strong><span>Human decisions required</span></article>
        <article><small>Training gaps</small><strong>{metrics.trainingGaps}</strong><span>People not complete</span></article>
        <article><small>Overdue reviews</small><strong>{metrics.overdueReviews}</strong><span>{metrics.dueReviews} due in horizon</span></article>
        <article><small>Obsolete exposure</small><strong>{metrics.obsoleteExposure}</strong><span>Point-of-use risk</span></article>
        <article><small>Northstar record</small><strong className="record-id">{recordId || "DRAFT"}</strong><span>{submitted ? "Submitted" : "Not submitted"}</span></article>
      </section>

      <section className="panel">
        <div className="panel-title"><div><small>01 · OPERATING CONTEXT</small><h2>Define the change-control responsibility</h2></div><Target size={24} /></div>
        <div className="form-grid">
          <label>Organization<input value={setup.organization} onChange={(event) => setSetup({ ...setup, organization: event.target.value })} /></label>
          <label>Site / facility<input value={setup.site} onChange={(event) => setSetup({ ...setup, site: event.target.value })} placeholder="Required" /></label>
          <label>Controlled-change owner<input value={setup.controlOwner} onChange={(event) => setSetup({ ...setup, controlOwner: event.target.value })} placeholder="Required" /></label>
          <label>Review horizon (days)<input type="number" min="1" value={setup.reviewHorizonDays} onChange={(event) => setSetup({ ...setup, reviewHorizonDays: Number(event.target.value) })} /></label>
          <label className="wide">Leadership intent<textarea value={setup.leadershipIntent} onChange={(event) => setSetup({ ...setup, leadershipIntent: event.target.value })} /></label>
        </div>
      </section>

      <section className="panel register-panel">
        <div className="panel-title"><div><small>02 · CONTROLLED DOCUMENT REGISTER</small><h2>Current standards, owners, revisions, and point-of-use locations</h2><p>Add records individually or import the customer’s existing Excel register.</p></div><FileText size={24} /></div>
        <div className="action-row no-print">
          <button className="primary" onClick={() => openNewDocument()}><Plus size={16} />Add controlled document</button>
          <button onClick={() => setImportModal(true)}><FileSpreadsheet size={16} />Import Excel / CSV</button>
          <button onClick={downloadTemplate}><FileDown size={16} />Download template</button>
        </div>
        <div className="filters">
          <input value={documentSearch} onChange={(event) => setDocumentSearch(event.target.value)} placeholder="Search document number, title, process, or owner" />
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Current documents</option><option value="approved">Approved</option><option value="review">In review</option><option value="superseded">Superseded</option><option value="obsolete">Obsolete</option><option value="archived">Archived</option><option value="all">All statuses</option></select>
        </div>
        {!filteredDocuments.length ? <div className="empty"><BookOpenCheck size={42} /><h3>No matching controlled documents</h3><p>Add a document, import the existing register, or load the design-partner demonstration.</p></div> : <div className="table-wrap"><table><thead><tr><th>Document</th><th>Department / process</th><th>Owner</th><th>Revision</th><th>Status</th><th>Review</th><th>Point of use</th><th className="no-print">Actions</th></tr></thead><tbody>{filteredDocuments.map((document) => <tr key={document.id}><td><strong>{document.documentNumber}</strong><small>{document.title}</small></td><td><strong>{document.department}</strong><small>{document.process || "Process not set"}</small></td><td><strong>{document.owner}</strong><small>{document.fileName || "Controlled file pending"}</small></td><td><b className="revision">{document.revision}</b></td><td><b className={`status-pill ${document.status}`}>{documentStatuses[document.status]}</b></td><td><strong className={document.reviewDate && document.reviewDate < today() ? "overdue" : ""}>{document.reviewDate || "Not set"}</strong><small>{document.reviewDate && document.reviewDate < today() ? "Overdue" : "Next review"}</small></td><td><strong>{document.pointOfUseCode || "Pending"}</strong><small>{splitList(document.locationsText).length} locations</small></td><td className="actions no-print"><button title="Edit" onClick={() => editDocument(document)}><Pencil size={15} /></button><button title="Create change request" onClick={() => openNewChange(document.id)}><ClipboardCheck size={15} /></button><button title="Copy point-of-use link" onClick={() => copyPointOfUse(document)}><Copy size={15} /></button><button title="History" onClick={() => setHistoryItem({ title: `${document.documentNumber} history`, events: document.history || [] })}><History size={15} /></button><button title="Duplicate profile" onClick={() => openNewDocument(document)}><FileText size={15} /></button><button className="danger" title="Archive" onClick={() => archiveDocument(document)}><Archive size={15} /></button></td></tr>)}</tbody></table></div>}
      </section>

      <section className="panel change-list-panel">
        <div className="panel-title"><div><small>03 · CHANGE REQUEST PORTFOLIO</small><h2>Decisions moving toward controlled release</h2><p>Every request carries impact, approval, training, implementation, and verification evidence.</p></div><ClipboardCheck size={24} /></div>
        <div className="action-row no-print"><button className="primary" onClick={() => openNewChange()}><Plus size={16} />New change request</button></div>
        {!changes.length ? <div className="empty"><ClipboardCheck size={42} /><h3>No change requests yet</h3><p>Create a change from the document register or open a standalone change package.</p></div> : <div className="change-cards">{changes.map((change) => {
          const required = (change.approvals || []).filter((approval) => approval.required);
          const approved = required.filter((approval) => approval.decision === "approved").length;
          const document = documents.find((item) => item.id === change.documentId);
          return <article key={change.id} className={activeChangeId === change.id ? "active" : ""}><div><b className={`priority ${change.priority}`}>{priorities[change.priority]}</b><strong>{change.changeNumber}</strong><small>{changeStatuses[change.status]}</small></div><h3>{change.title}</h3><p>{change.reason}</p><div className="change-meta"><span><FileText size={14} />{document ? document.documentNumber : "Standalone change"}</span><span><BadgeCheck size={14} />{approved}/{required.length} approvals</span><span><GraduationCap size={14} />{change.training.completedCount}/{change.training.assignedCount} trained</span><span><Clock3 size={14} />{change.requestedEffectiveDate || "No date"}</span></div><footer><button onClick={() => setActiveChangeId(change.id)}>Open workflow</button><button onClick={() => editChange(change)}><Pencil size={15} />Edit package</button><button onClick={() => setHistoryItem({ title: `${change.changeNumber} history`, events: change.history || [] })}><History size={15} />History</button></footer></article>;
        })}</div>}
      </section>

      {activeChange && <section className="panel workflow-panel">
        <div className="panel-title"><div><small>04 · CONTROLLED CHANGE WORKFLOW</small><h2>{activeChange.changeNumber} · {activeChange.title}</h2><p>{changeStatuses[activeChange.status]} · Requested by {activeChange.requestor}</p></div><ShieldCheck size={24} /></div>

        <div className="workflow-grid">
          <article><header><Users size={18} /><div><small>IMPACT ASSESSMENT</small><h3>Who and what changes</h3></div></header><dl><div><dt>Departments</dt><dd>{activeChange.impact.departmentsText || "Not assessed"}</dd></div><div><dt>Affected roles</dt><dd>{activeChange.impact.rolesText || "Not assessed"}</dd></div><div><dt>Assets / equipment</dt><dd>{activeChange.impact.assetsText || "None identified"}</dd></div><div><dt>Linked documents</dt><dd>{activeChange.impact.linkedDocumentsText || "None identified"}</dd></div><div><dt>WIP disposition</dt><dd>{activeChange.impact.workInProcessDisposition || "Not assessed"}</dd></div></dl><div className="impact-flags"><span className={activeChange.impact.qualityImpact ? "on" : ""}>Quality</span><span className={activeChange.impact.safetyImpact ? "on" : ""}>Safety</span><span className={activeChange.impact.customerImpact ? "on" : ""}>Customer</span><span className={activeChange.impact.shutdownRequired ? "on" : ""}>Shutdown</span></div></article>

          <article><header><GraduationCap size={18} /><div><small>WORKFORCE IMPACT</small><h3>Training and competency</h3></div></header><label>Affected roles<textarea value={activeChange.training.rolesText} onChange={(event) => updateActiveChange({ training: { ...activeChange.training, rolesText: event.target.value } })} /></label><div className="two-fields"><label>Assigned<input type="number" min="0" value={activeChange.training.assignedCount} onChange={(event) => updateActiveChange({ training: { ...activeChange.training, assignedCount: Number(event.target.value) } })} /></label><label>Completed<input type="number" min="0" value={activeChange.training.completedCount} onChange={(event) => updateActiveChange({ training: { ...activeChange.training, completedCount: Number(event.target.value) } })} /></label></div><label className="checkbox"><input type="checkbox" checked={activeChange.training.required} onChange={(event) => updateActiveChange({ training: { ...activeChange.training, required: event.target.checked } })} />Training required before release</label><button className="secondary" onClick={createTrainingHandoff}><GraduationCap size={16} />{activeChange.training.handoffCreated ? "Refresh Workforce handoff" : "Create Workforce handoff"}</button></article>

          <article><header><Wrench size={18} /><div><small>IMPLEMENTATION CONTROL</small><h3>Cutover and point of use</h3></div></header><label>Implementation owner<input value={activeChange.implementation.owner} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, owner: event.target.value } })} /></label><label>Effective date<input type="date" value={activeChange.implementation.effectiveDate} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, effectiveDate: event.target.value } })} /></label><label>Point-of-use locations<textarea value={activeChange.implementation.pointOfUseLocationsText} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, pointOfUseLocationsText: event.target.value } })} /></label><label className="checkbox"><input type="checkbox" checked={activeChange.implementation.obsoleteCopiesRemoved} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, obsoleteCopiesRemoved: event.target.checked } })} />Obsolete copies removed</label><label className="checkbox"><input type="checkbox" checked={activeChange.implementation.updatedFormsInUse} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, updatedFormsInUse: event.target.checked } })} />Updated forms and references in use</label><label className="checkbox"><input type="checkbox" checked={activeChange.implementation.firstJobVerified} onChange={(event) => updateActiveChange({ implementation: { ...activeChange.implementation, firstJobVerified: event.target.checked } })} />First job / first article verified</label></article>
        </div>

        <div className="approval-section"><div className="sub-title"><div><small>HUMAN APPROVAL ROUTING</small><h3>Required decisions before release</h3></div><BadgeCheck size={22} /></div><div className="approval-grid">{activeChange.approvals.map((approval) => <article key={approval.key} className={approval.decision}><header><strong>{approval.role}</strong><label className="required"><input type="checkbox" checked={approval.required} onChange={(event) => updateApproval(approval.key, { required: event.target.checked, decision: event.target.checked ? "pending" : "not_required" })} />Required</label></header><label>Decision<select value={approval.decision} onChange={(event) => updateApproval(approval.key, { decision: event.target.value })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="not_required">Not required</option></select></label><label>Approver<input value={approval.approver} onChange={(event) => updateApproval(approval.key, { approver: event.target.value })} /></label><label>Comments<textarea value={approval.comments} onChange={(event) => updateApproval(approval.key, { comments: event.target.value })} /></label>{approval.decisionAt && <small>{new Date(approval.decisionAt).toLocaleString()}</small>}</article>)}</div></div>

        <div className="release-section"><div><small>CONTROLLED RELEASE GATE</small><h3>Release revision {activeChange.newRevision || "not assigned"}</h3><p>Northstar will update the document register only after required approvals, training, obsolete-copy control, updated-form verification, and first-job verification are complete.</p></div><button className="release-button" onClick={releaseChange} disabled={activeChange.status === "released"}><ShieldCheck size={18} />{activeChange.status === "released" ? "Released" : "Release controlled revision"}</button></div>
      </section>}

      <section className="two-grid">
        <article className="panel"><div className="panel-title"><div><small>05 · LEADERSHIP EXPOSURE</small><h2>What can undermine adoption</h2></div><AlertTriangle size={24} /></div><div className="risk-list"><div><span className={metrics.highRiskOpen ? "bad" : "good"}>{metrics.highRiskOpen}</span><span><strong>High-risk open changes</strong><small>Customer, quality, safety, or business exposure</small></span></div><div><span className={metrics.pendingApprovals ? "warn" : "good"}>{metrics.pendingApprovals}</span><span><strong>Pending approval decisions</strong><small>Change packages waiting on accountable leaders</small></span></div><div><span className={metrics.trainingGaps ? "warn" : "good"}>{metrics.trainingGaps}</span><span><strong>Training completions missing</strong><small>Employees not ready for revised work</small></span></div><div><span className={metrics.obsoleteExposure ? "bad" : "good"}>{metrics.obsoleteExposure}</span><span><strong>Obsolete-copy exposure</strong><small>Locations or implementations not fully controlled</small></span></div></div></article>
        <article className="panel"><div className="panel-title"><div><small>06 · IMPLEMENTATION CONFIDENCE</small><h2>Proof the change reached the floor</h2></div><CheckCircle2 size={24} /></div><div className="confidence"><strong>{metrics.pointOfUseRate}%</strong><span>Point-of-use verification rate</span><div className="progress"><i style={{ width: `${metrics.pointOfUseRate}%` }} /></div><p>{metrics.released} released change{metrics.released === 1 ? "" : "s"}. A release counts as verified when obsolete information is removed and the first job or first article confirms the revised standard works.</p></div></article>
      </section>

      <section className="executive-summary"><div><small>PILOT EXECUTIVE INTERPRETATION</small><h2>{metrics.score >= 90 ? "Controlled decisions are reaching execution." : "Close the implementation gap before relying on the change."}</h2><p>{metrics.score >= 90 ? "Document ownership, approval routing, training impact, and point-of-use verification are under control. Continue periodic review discipline." : `${metrics.pendingApprovals} approval decisions, ${metrics.trainingGaps} training completions, ${metrics.overdueReviews} overdue reviews, and ${metrics.obsoleteExposure} obsolete-information exposures require leadership attention.`}</p></div><button onClick={submitToNorthstar} disabled={saving}><Send size={18} />Submit controlled-change portfolio</button></section>

      <p className="disclaimer">Northstar Controlled Change preserves human approval authority and controlled revision history. Point-of-use links identify the current release record; customer environments should connect authenticated document delivery and workforce assignment services before broad production rollout.</p>

      {documentModal && <div className="modal-backdrop"><div className="modal"><header><div><small>{documents.some((document) => document.id === documentForm.id) ? "EDIT CONTROLLED DOCUMENT" : "ADD CONTROLLED DOCUMENT"}</small><h2>{documentForm.documentNumber || "Create document record"}</h2></div><button onClick={() => setDocumentModal(false)}><X /></button></header><div className="modal-body form-grid"><label>Document number<input value={documentForm.documentNumber} onChange={(event) => setDocumentForm({ ...documentForm, documentNumber: event.target.value })} /></label><label>Title<input value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} /></label><label>Type<select value={documentForm.type} onChange={(event) => setDocumentForm({ ...documentForm, type: event.target.value })}>{Object.entries(documentTypes).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Department<input value={documentForm.department} onChange={(event) => setDocumentForm({ ...documentForm, department: event.target.value })} /></label><label>Process<input value={documentForm.process} onChange={(event) => setDocumentForm({ ...documentForm, process: event.target.value })} /></label><label>Document owner<input value={documentForm.owner} onChange={(event) => setDocumentForm({ ...documentForm, owner: event.target.value })} /></label><label>Current revision<input value={documentForm.revision} onChange={(event) => setDocumentForm({ ...documentForm, revision: event.target.value })} /></label><label>Status<select value={documentForm.status} onChange={(event) => setDocumentForm({ ...documentForm, status: event.target.value })}>{Object.entries(documentStatuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Effective date<input type="date" value={documentForm.effectiveDate} onChange={(event) => setDocumentForm({ ...documentForm, effectiveDate: event.target.value })} /></label><label>Review date<input type="date" value={documentForm.reviewDate} onChange={(event) => setDocumentForm({ ...documentForm, reviewDate: event.target.value })} /></label><label className="checkbox"><input type="checkbox" checked={documentForm.externalControlled} onChange={(event) => setDocumentForm({ ...documentForm, externalControlled: event.target.checked })} />External-controlled document</label><label className="checkbox"><input type="checkbox" checked={documentForm.customerControlled} onChange={(event) => setDocumentForm({ ...documentForm, customerControlled: event.target.checked })} />Customer-controlled document</label><label className="wide">Distribution and point-of-use locations<textarea value={documentForm.locationsText} onChange={(event) => setDocumentForm({ ...documentForm, locationsText: event.target.value })} placeholder="Assembly Cell 1, Quality office, Shipping desk" /></label><label className="wide upload-box"><UploadCloud size={20} /><span><strong>Upload current controlled file</strong><small>{documentForm.fileName || "PDF, Office document, drawing, image, or text file"}</small></span><input type="file" onChange={handleDocumentFile} /></label></div><footer><button onClick={() => setDocumentModal(false)}>Cancel</button><button className="primary" onClick={saveDocument}><Save size={16} />Save controlled document</button></footer></div></div>}

      {changeModal && <div className="modal-backdrop"><div className="modal large"><header><div><small>{changes.some((change) => change.id === changeForm.id) ? "EDIT CHANGE PACKAGE" : "NEW CHANGE REQUEST"}</small><h2>{changeForm.changeNumber}</h2></div><button onClick={() => setChangeModal(false)}><X /></button></header><div className="modal-body change-form"><div className="form-grid"><label>Affected document<select value={changeForm.documentId} onChange={(event) => setChangeForm({ ...changeForm, documentId: event.target.value })}><option value="">Standalone change</option>{documents.filter((document) => !["archived", "obsolete"].includes(document.status)).map((document) => <option value={document.id} key={document.id}>{document.documentNumber} · {document.title}</option>)}</select></label><label>Change source<select value={changeForm.source} onChange={(event) => setChangeForm({ ...changeForm, source: event.target.value })}><option value="ncr">NCR</option><option value="capa">CAPA</option><option value="process_assurance">Process Assurance</option><option value="asset_reliability">Asset Reliability</option><option value="customer">Customer requirement</option><option value="engineering">Engineering change</option><option value="supplier">Supplier change</option><option value="audit">Audit finding</option><option value="improvement">Improvement</option><option value="regulatory">Regulatory update</option></select></label><label>Priority<select value={changeForm.priority} onChange={(event) => setChangeForm({ ...changeForm, priority: event.target.value })}>{Object.entries(priorities).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Requested effective date<input type="date" value={changeForm.requestedEffectiveDate} onChange={(event) => setChangeForm({ ...changeForm, requestedEffectiveDate: event.target.value })} /></label><label className="wide">Change title<input value={changeForm.title} onChange={(event) => setChangeForm({ ...changeForm, title: event.target.value })} /></label><label>Requestor<input value={changeForm.requestor} onChange={(event) => setChangeForm({ ...changeForm, requestor: event.target.value })} /></label><label>Proposed revision<input value={changeForm.newRevision} onChange={(event) => setChangeForm({ ...changeForm, newRevision: event.target.value })} /></label><label className="wide">Reason and business need<textarea value={changeForm.reason} onChange={(event) => setChangeForm({ ...changeForm, reason: event.target.value })} /></label></div><h3>Operational impact assessment</h3><div className="form-grid"><label>Affected departments<textarea value={changeForm.impact.departmentsText} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, departmentsText: event.target.value } })} /></label><label>Affected job roles<textarea value={changeForm.impact.rolesText} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, rolesText: event.target.value } })} /></label><label>Affected assets / equipment<textarea value={changeForm.impact.assetsText} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, assetsText: event.target.value } })} /></label><label>Linked documents<textarea value={changeForm.impact.linkedDocumentsText} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, linkedDocumentsText: event.target.value } })} /></label><label className="wide">Inventory and work-in-process disposition<textarea value={changeForm.impact.workInProcessDisposition} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, workInProcessDisposition: event.target.value } })} /></label><label className="checkbox"><input type="checkbox" checked={changeForm.impact.qualityImpact} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, qualityImpact: event.target.checked } })} />Quality impact</label><label className="checkbox"><input type="checkbox" checked={changeForm.impact.safetyImpact} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, safetyImpact: event.target.checked } })} />Safety impact</label><label className="checkbox"><input type="checkbox" checked={changeForm.impact.customerImpact} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, customerImpact: event.target.checked } })} />Customer impact</label><label className="checkbox"><input type="checkbox" checked={changeForm.impact.shutdownRequired} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, shutdownRequired: event.target.checked } })} />Production shutdown required</label><label className="checkbox"><input type="checkbox" checked={changeForm.impact.customerApprovalRequired} onChange={(event) => setChangeForm({ ...changeForm, impact: { ...changeForm.impact, customerApprovalRequired: event.target.checked } })} />Customer approval required</label><label className="wide">Linked Northstar records<input value={changeForm.linkedRecordsText} onChange={(event) => setChangeForm({ ...changeForm, linkedRecordsText: event.target.value })} placeholder="CAPA-2026-0017, NCR-2026-0088" /></label><label className="wide upload-box"><UploadCloud size={20} /><span><strong>Attach supporting evidence</strong><small>{changeForm.evidenceNames.length ? changeForm.evidenceNames.join(", ") : "Analysis, customer requirements, drawings, photos, or approvals"}</small></span><input type="file" multiple onChange={handleChangeEvidence} /></label></div></div><footer><button onClick={() => setChangeModal(false)}>Cancel</button><button className="primary" onClick={saveChange}><Save size={16} />Save change package</button></footer></div></div>}

      {importModal && <div className="modal-backdrop"><div className="modal"><header><div><small>EXCEL / CSV REGISTER IMPORT</small><h2>Bring the current document register into Northstar</h2></div><button onClick={() => setImportModal(false)}><X /></button></header><div className="import-body"><p>Upload a CSV exported from Excel or paste copied Excel rows. Matching document numbers are updated; new numbers are added.</p><div className="import-grid"><label className="dropzone"><FileSpreadsheet size={30} /><strong>Choose CSV file</strong><small>Excel: Save As → CSV UTF-8</small><input type="file" accept=".csv,.txt,text/csv" onChange={readImportFile} /></label><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="documentNumber,title,type,department,process,owner,revision,status,effectiveDate,reviewDate" /></div></div><footer><button onClick={downloadTemplate}><FileDown size={16} />Download template</button><button onClick={() => setImportModal(false)}>Cancel</button><button className="primary" onClick={importDocuments}><Upload size={16} />Import register</button></footer></div></div>}

      {historyItem && <div className="modal-backdrop"><div className="modal history-modal"><header><div><small>CONTROLLED HISTORY</small><h2>{historyItem.title}</h2></div><button onClick={() => setHistoryItem(null)}><X /></button></header><div className="history-list">{historyItem.events?.length ? historyItem.events.map((event) => <article key={event.id}><span><History size={16} /></span><div><strong>{event.type}</strong><p>{event.detail}</p><small>{new Date(event.date).toLocaleString()} · {event.actor}</small></div></article>) : <div className="empty"><History size={36} /><h3>No history recorded yet</h3></div>}</div><footer><button className="primary" onClick={() => setHistoryItem(null)}>Done</button></footer></div></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#12253a;font-family:Inter,Arial,sans-serif}.cc-shell{min-height:100vh;padding-bottom:70px}.cc-header{min-height:74px;display:flex;align-items:center;gap:14px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#061729,#0b3158);border-bottom:1px solid #24547d}.back{width:38px;height:38px;display:grid;place-items:center;border:1px solid #365c7d;border-radius:11px;color:#fff}.brand-lockup{width:172px;padding:8px 10px;border-radius:12px;background:#fff}.brand-lockup img,.northstar-lockup img{display:block;width:100%;height:auto}.northstar-lockup{width:220px;padding:4px 8px;border:1px solid #314d67;border-radius:10px;background:#050b12}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#8fb5d6;text-transform:uppercase;letter-spacing:.1em}.header-status{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #2b6d5a;border-radius:999px;color:#c9f3e5;background:#0d3a31;font-size:11px;font-weight:800}.header-status span{width:8px;height:8px;border-radius:50%;background:#45d39d}.hero{max-width:1540px;margin:0 auto;display:grid;grid-template-columns:1.45fr .55fr;gap:18px;padding:28px 24px}.hero-copy{padding:32px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{display:flex;align-items:center;gap:8px;color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:14px 0 12px;font-size:clamp(34px,4vw,62px);line-height:1.02}.hero p{max-width:900px;color:#d4e7f7;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:7px 10px;border:1px solid #5f9fd3;border-radius:999px;color:#d9ecfb;font-size:10px;font-weight:800}.health-card{display:grid;place-items:center;padding:24px;border:1px solid #dce6ef;border-radius:24px;background:#fff;box-shadow:0 16px 38px rgba(24,55,83,.1);text-align:center}.health-card>small{color:#71869a;font-weight:900;letter-spacing:.12em}.health-card>strong{font-size:52px}.health-card>span{color:#16835a;font-weight:800}.ring{width:150px;height:150px;display:grid;place-items:center;margin-top:12px;border-radius:50%}.ring div{width:112px;height:112px;display:grid;place-items:center;border-radius:50%;background:#fff;font-size:34px;font-weight:900}.toolbar{max-width:1540px;margin:0 auto;padding:0 24px;display:flex;gap:9px;flex-wrap:wrap}.toolbar button,.action-row button,.modal button,.change-cards footer button,.release-button,.secondary,.executive-summary button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid #cddbe7;border-radius:11px;color:#21405d;background:#fff;font-weight:850;cursor:pointer}.toolbar button.submit,.primary,.release-button,.executive-summary button{border-color:#0a66ff!important;color:#fff!important;background:linear-gradient(135deg,#0d315c,#0a66ff)!important}.toolbar button.submit{margin-left:auto}button:disabled{opacity:.55;cursor:not-allowed}.notice{max-width:1492px;margin:14px auto 0;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid #e7c66c;border-radius:12px;color:#765408;background:#fff9e8;font-weight:800}.notice.submitted{border-color:#8fd0b3;color:#155f45;background:#effbf6}.metrics{max-width:1540px;margin:18px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.metrics article{padding:17px;border:1px solid #dce6ef;border-radius:17px;background:#fff}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70859a;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.metrics strong{margin-top:6px;font-size:28px}.metrics span{margin-top:3px;color:#16835a;font-size:11px;font-weight:800}.record-id{font-size:16px!important}.panel{max-width:1492px;margin:18px auto 0;padding:22px;border:1px solid #dce6ef;border-radius:20px;background:#fff;box-shadow:0 12px 32px rgba(24,55,83,.07)}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:1px solid #e2eaf1}.panel-title small,.sub-title small,.release-section small{color:#71869a;font-weight:900;letter-spacing:.1em}.panel-title h2,.sub-title h3,.release-section h3{margin:5px 0 0}.panel-title p{margin:6px 0 0;color:#6d8194;font-size:12px}.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:18px}.form-grid label,.workflow-grid label,.approval-grid label{display:grid;gap:6px;color:#526a80;font-size:11px;font-weight:850}.form-grid input,.form-grid select,.form-grid textarea,.filters input,.filters select,.workflow-grid input,.workflow-grid select,.workflow-grid textarea,.approval-grid input,.approval-grid select,.approval-grid textarea{width:100%;min-height:42px;padding:10px;border:1px solid #cad9e6;border-radius:10px;color:#12253a;background:#fbfdff;font:inherit}.form-grid textarea,.workflow-grid textarea,.approval-grid textarea{min-height:74px;resize:vertical}.wide{grid-column:1/-1}.checkbox{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center!important;gap:8px!important;min-height:42px}.checkbox input,.required input{width:auto!important;min-height:0!important}.action-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.filters{display:grid;grid-template-columns:1fr 220px 200px;gap:10px;margin-top:14px}.table-wrap{overflow:auto;margin-top:16px;border:1px solid #dce6ef;border-radius:14px}table{width:100%;border-collapse:collapse;min-width:1180px}th,td{padding:12px;border-bottom:1px solid #e1e9f0;text-align:left;vertical-align:middle}th{background:#f2f7fb;color:#526a80;font-size:10px;text-transform:uppercase;letter-spacing:.05em}td small,td strong{display:block}td small{margin-top:3px;color:#71869a}.revision{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;color:#fff;background:#0a66ff}.status-pill,.priority{display:inline-flex;padding:6px 9px;border-radius:999px;text-transform:capitalize;font-size:9px}.status-pill.approved,.status-pill.released{color:#146145;background:#e9f8f1}.status-pill.review,.status-pill.draft{color:#845d00;background:#fff5dc}.status-pill.superseded,.status-pill.obsolete,.status-pill.archived{color:#6b7885;background:#edf1f4}.overdue{color:#a43848}.actions{display:flex;gap:5px}.actions button{width:33px;height:33px;display:grid;place-items:center;border:1px solid #d6e1ea;border-radius:9px;background:#fff;color:#31516e;cursor:pointer}.actions button.danger{color:#a43848}.empty{padding:42px;text-align:center;color:#6c8296}.change-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px;margin-top:16px}.change-cards>article{padding:17px;border:1px solid #dce6ef;border-radius:16px;background:#fbfdff}.change-cards>article.active{border-color:#0a66ff;box-shadow:0 0 0 3px #dcebff}.change-cards>article>div:first-child{display:flex;align-items:center;gap:8px}.change-cards>article>div:first-child small{margin-left:auto;color:#71869a;font-weight:800}.priority.low{color:#315b49;background:#e9f8f1}.priority.moderate{color:#795600;background:#fff5dc}.priority.high{color:#8d4f00;background:#fff0dc}.priority.critical{color:#a02739;background:#ffecef}.change-cards h3{margin:14px 0 7px}.change-cards p{min-height:46px;color:#5d7387;font-size:12px;line-height:1.5}.change-meta{display:flex;gap:10px;flex-wrap:wrap}.change-meta span{display:flex;align-items:center;gap:5px;padding:6px 8px;border-radius:8px;color:#49647d;background:#eef5fa;font-size:10px;font-weight:800}.change-cards footer{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px}.change-cards footer button{min-height:36px;padding:0 10px;font-size:10px}.workflow-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:18px}.workflow-grid>article{padding:17px;border:1px solid #dbe6ef;border-radius:16px;background:#fbfdff}.workflow-grid>article>header{display:flex;align-items:flex-start;gap:10px;padding-bottom:12px;border-bottom:1px solid #e2eaf1}.workflow-grid header small{color:#6d8296;font-size:9px;font-weight:900;letter-spacing:.1em}.workflow-grid header h3{margin:3px 0 0}.workflow-grid dl{margin:12px 0}.workflow-grid dl>div{padding:8px 0;border-bottom:1px solid #e5edf3}.workflow-grid dt{color:#71869a;font-size:9px;font-weight:900;text-transform:uppercase}.workflow-grid dd{margin:4px 0 0;font-size:12px}.impact-flags{display:flex;gap:6px;flex-wrap:wrap}.impact-flags span{padding:6px 8px;border-radius:999px;color:#71869a;background:#edf2f6;font-size:9px;font-weight:900}.impact-flags span.on{color:#fff;background:#0a66ff}.workflow-grid label{margin-top:10px}.two-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.secondary{width:100%;margin-top:12px}.approval-section{margin-top:18px;padding-top:18px;border-top:1px solid #dfe8ef}.sub-title{display:flex;align-items:flex-start;justify-content:space-between}.approval-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}.approval-grid article{padding:14px;border:1px solid #dbe6ef;border-radius:14px;background:#fbfdff}.approval-grid article.approved{border-color:#8fd0b3;background:#f3fbf7}.approval-grid article.rejected{border-color:#e4a4ad;background:#fff4f5}.approval-grid article>header{display:flex;align-items:center;gap:8px}.approval-grid article>header strong{margin-right:auto}.required{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center!important}.approval-grid label{margin-top:9px}.approval-grid article>small{display:block;margin-top:8px;color:#71869a}.release-section{display:flex;align-items:center;gap:18px;margin-top:18px;padding:18px;border-radius:16px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.release-section>div{margin-right:auto}.release-section small{color:#8fc9f7}.release-section p{max-width:900px;margin:6px 0 0;color:#d4e7f7;font-size:12px;line-height:1.5}.release-button{min-width:230px}.two-grid{max-width:1492px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:18px}.two-grid .panel{margin-top:18px}.risk-list{display:grid;margin-top:14px}.risk-list>div{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #e2eaf1}.risk-list>div>span:first-child{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#fff;font-weight:900}.risk-list strong,.risk-list small{display:block}.risk-list small{margin-top:3px;color:#71869a}.good{background:#16835a}.warn{background:#b87b19}.bad{background:#a83e4d}.confidence{padding:25px 0;text-align:center}.confidence>strong{display:block;font-size:54px}.confidence>span{color:#60768a;font-weight:850}.progress{height:10px;margin:18px 0;border-radius:999px;background:#e6edf3;overflow:hidden}.progress i{display:block;height:100%;background:#0a66ff}.confidence p{color:#63798d;line-height:1.6}.executive-summary{max-width:1492px;margin:18px auto 0;display:flex;align-items:center;gap:20px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.executive-summary>div{margin-right:auto}.executive-summary small{color:#8fc9f7;font-weight:900;letter-spacing:.1em}.executive-summary h2{margin:6px 0}.executive-summary p{max-width:950px;margin:0;color:#d2e6f5;line-height:1.55}.disclaimer{max-width:1492px;margin:18px auto 0;color:#6b7f91;font-size:10px;line-height:1.5}.modal-backdrop{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:18px;background:rgba(3,15,28,.82);backdrop-filter:blur(9px)}.modal{width:min(900px,100%);max-height:92vh;overflow:auto;border:1px solid #345b7c;border-radius:22px;background:#f8fbfe;box-shadow:0 30px 90px rgba(0,0,0,.45)}.modal.large{width:min(1180px,100%)}.modal header,.modal footer{display:flex;align-items:center;gap:12px;padding:16px 18px}.modal header{position:sticky;top:0;z-index:2;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.modal header>div{margin-right:auto}.modal header small{color:#9ecbf1;font-weight:900;letter-spacing:.1em}.modal header h2{margin:4px 0 0}.modal header button{width:38px;padding:0;color:#fff;background:#123a60;border-color:#476a88}.modal footer{justify-content:flex-end;border-top:1px solid #dbe6ee;background:#fff}.modal-body{padding:4px 22px 22px}.change-form>h3{margin:24px 0 0;padding-top:18px;border-top:1px solid #dfe8ef}.upload-box{display:flex!important;grid-template-columns:auto 1fr auto!important;align-items:center;padding:15px;border:1px dashed #7db2df;border-radius:13px;background:#f2f8fd;cursor:pointer}.upload-box span strong,.upload-box span small{display:block}.upload-box input{max-width:260px}.import-body{padding:0 22px}.import-body p{color:#60768b}.import-grid{display:grid;grid-template-columns:240px 1fr;gap:16px;padding:10px 0 22px}.dropzone{min-height:190px;display:grid;place-items:center;align-content:center;gap:7px;padding:18px;border:2px dashed #79acd6;border-radius:16px;color:#285a80;background:#eef7ff;text-align:center;cursor:pointer}.dropzone small{color:#70869a}.dropzone input{display:none}.import-grid textarea{min-height:230px;padding:12px;border:1px solid #cbdbe8;border-radius:14px;font:12px ui-monospace,monospace}.history-list{display:grid;padding:18px}.history-list article{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #dfe8ef}.history-list article>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#eaf4ff}.history-list p{margin:4px 0;color:#51687d}.history-list small{color:#8192a1}@media(max-width:1050px){.hero,.two-grid{grid-template-columns:1fr}.workflow-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr 1fr}.filters{grid-template-columns:1fr}.cc-header{flex-wrap:wrap}.header-meta{order:5;width:100%}.release-section,.executive-summary{align-items:flex-start;flex-direction:column}.release-button{width:100%}.import-grid{grid-template-columns:1fr}}@media(max-width:650px){.hero{padding:18px 12px}.toolbar,.metrics{padding-left:12px;padding-right:12px}.panel,.notice,.executive-summary,.disclaimer{margin-left:12px;margin-right:12px}.form-grid{grid-template-columns:1fr}.brand-lockup{width:125px}.northstar-lockup{width:160px}.header-status{display:none}.hero-copy{padding:23px}.hero h1{font-size:36px}.two-grid{display:block}.toolbar button.submit{margin-left:0}.executive-summary button{width:100%}.upload-box{grid-template-columns:1fr!important}.approval-grid{grid-template-columns:1fr}}@media print{body{background:#fff}.no-print,.back,.header-status,.modal-backdrop{display:none!important}.panel,.health-card,.metrics article{box-shadow:none}.table-wrap{overflow:visible}table{font-size:8px}.disclaimer{display:block}}
      `}</style>
    </main>
  );
}
