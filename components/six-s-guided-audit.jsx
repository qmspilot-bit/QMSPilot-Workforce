"use client";

import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileImage,
  Flag,
  HardHat,
  ImagePlus,
  ListChecks,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "qmspilot:northstar:6s-workplace-excellence";
const SUMMARY_KEY = "qmspilot:northstar:6s-summary";
const DRAFT_KEY = "qmspilot:northstar:6s-guided-audit-draft";

const pillars = ["Sort", "Set in Order", "Shine", "Standardize", "Sustain", "Safety"];

const pillarWeights = {
  Sort: 15,
  "Set in Order": 20,
  Shine: 15,
  Standardize: 15,
  Sustain: 15,
  Safety: 20,
};

const questions = [
  { id: "SORT-01", pillar: "Sort", weight: 4, prompt: "Are unnecessary tools, materials, containers, documents, and equipment removed from the work area?", guidance: "Confirm that only items needed for current work remain. Check benches, cabinets, drawers, racks, and floor space." },
  { id: "SORT-02", pillar: "Sort", weight: 4, prompt: "Are questionable or unnecessary items identified through a controlled red-tag process?", guidance: "Look for tag number, owner, date, reason, disposition, due date, and a controlled holding location." },
  { id: "SORT-03", pillar: "Sort", weight: 4, prompt: "Are point-of-use quantities limited to what is actually required?", guidance: "Verify excess stock, duplicate tooling, obsolete fixtures, and uncontrolled personal storage have been addressed." },
  { id: "SORT-04", pillar: "Sort", weight: 3, prompt: "Are obsolete, expired, damaged, or unidentified items dispositioned without delay?", guidance: "Check scrap, return-to-stock, repair, hazardous-waste, document-obsolescence, and quarantine controls." },

  { id: "SET-01", pillar: "Set in Order", weight: 5, prompt: "Does every required item have a clearly defined and labeled location?", guidance: "A person unfamiliar with the area should be able to locate and return an item correctly." },
  { id: "SET-02", pillar: "Set in Order", weight: 5, prompt: "Are frequently used tools and materials positioned at the point of use?", guidance: "Evaluate travel, reaching, searching, lifting, and unnecessary motion during normal work." },
  { id: "SET-03", pillar: "Set in Order", weight: 5, prompt: "Are aisles, staging lanes, storage zones, work-in-process locations, and status areas visually controlled?", guidance: "Verify floor markings, labels, boundaries, flow direction, quarantine, and finished-goods controls." },
  { id: "SET-04", pillar: "Set in Order", weight: 5, prompt: "Are minimum, maximum, reorder, and quantity controls visible and consistently followed?", guidance: "Look for empty-bin signals, Kanban controls, calibrated quantities, and material replenishment discipline." },

  { id: "SHINE-01", pillar: "Shine", weight: 4, prompt: "Is the area clean to an established condition standard rather than simply appearing acceptable?", guidance: "Compare the actual condition to a photo standard, checklist, or defined clean-and-inspect requirement." },
  { id: "SHINE-02", pillar: "Shine", weight: 4, prompt: "Are sources of leaks, debris, contamination, dust, chips, spills, and recurring disorder being corrected?", guidance: "Cleaning should expose causes and abnormal conditions, not repeatedly hide them." },
  { id: "SHINE-03", pillar: "Shine", weight: 4, prompt: "Is cleaning used as an inspection of equipment, tooling, utilities, guards, and workplace condition?", guidance: "Confirm abnormalities are identified, tagged, escalated, and connected to maintenance or corrective action." },
  { id: "SHINE-04", pillar: "Shine", weight: 3, prompt: "Are cleaning materials, tools, responsibilities, and frequencies defined at the point of use?", guidance: "Verify ownership, storage, chemical compatibility, inspection frequency, and completion evidence." },

  { id: "STD-01", pillar: "Standardize", weight: 4, prompt: "Is there a current visual standard showing the expected 6S condition for the area?", guidance: "Check revision, approval, area identity, photographs, location rules, color coding, and abnormal-condition examples." },
  { id: "STD-02", pillar: "Standardize", weight: 4, prompt: "Are daily, weekly, and periodic 6S responsibilities clearly assigned by role?", guidance: "Confirm the standard identifies who performs, who verifies, and who owns unresolved conditions." },
  { id: "STD-03", pillar: "Standardize", weight: 4, prompt: "Are labels, floor markings, status colors, shadow boards, and signage applied consistently?", guidance: "The same visual signal should mean the same thing across areas wherever practical." },
  { id: "STD-04", pillar: "Standardize", weight: 3, prompt: "Does the documented standard match the safest and most efficient way the work is actually performed?", guidance: "Identify outdated standards, workarounds, tribal knowledge, or visual controls that conflict with the process." },

  { id: "SUS-01", pillar: "Sustain", weight: 4, prompt: "Are required daily checks and layered 6S audits completed at the planned frequency?", guidance: "Review completion, missed audits, late audits, audit quality, and supervisor follow-up." },
  { id: "SUS-02", pillar: "Sustain", weight: 4, prompt: "Are prior findings verified for effectiveness and protected from recurrence?", guidance: "Sample closed actions and confirm the condition remains corrected. Repeated findings require escalation." },
  { id: "SUS-03", pillar: "Sustain", weight: 4, prompt: "Are employees trained and able to explain their 6S responsibilities and abnormality-escalation process?", guidance: "Interview employees. Verify they know the area standard, red-tag process, action ownership, and safety escalation." },
  { id: "SUS-04", pillar: "Sustain", weight: 3, prompt: "Do leaders coach, recognize improvement, remove barriers, and review 6S performance as part of normal operations?", guidance: "Look for leader presence, recognition, resource decisions, trend review, and integration into daily management." },

  { id: "SAFE-01", pillar: "Safety", weight: 5, criticalSafety: true, prompt: "Are aisles, exits, fire equipment, emergency equipment, electrical panels, and access routes unobstructed?", guidance: "Any blocked emergency route or required access point is a critical safety finding." },
  { id: "SAFE-02", pillar: "Safety", weight: 5, criticalSafety: true, prompt: "Are cords, plugs, guards, tools, machines, energy-isolation points, and temporary repairs in safe condition?", guidance: "Remove unsafe equipment from service. Do not score a hazardous temporary repair as acceptable." },
  { id: "SAFE-03", pillar: "Safety", weight: 5, criticalSafety: true, prompt: "Are chemicals labeled, closed, compatible, properly stored, and transferred using approved containers and methods?", guidance: "Check secondary containers, flammable storage, spill control, SDS access, expiration, and waste handling." },
  { id: "SAFE-04", pillar: "Safety", weight: 5, criticalSafety: true, prompt: "Are PPE, ergonomics, lifting, stacking, sharp edges, trip hazards, and other workplace hazards effectively controlled?", guidance: "Verify controls are suitable for the actual task and that unsafe conditions are immediately contained." },
];

const ratingOptions = [
  { value: 0, label: "0", title: "Not in place", description: "Requirement is absent or ineffective." },
  { value: 1, label: "1", title: "Major gap", description: "Limited evidence; significant correction required." },
  { value: 2, label: "2", title: "Partially effective", description: "Some controls exist, but application is inconsistent." },
  { value: 3, label: "3", title: "Mostly effective", description: "Requirement is generally met with a minor gap." },
  { value: 4, label: "4", title: "Fully effective", description: "Requirement is controlled, evident, and sustained." },
  { value: -1, label: "N/A", title: "Not applicable", description: "Excluded from the applicable weighted denominator." },
];

const fallbackAreas = [
  { id: "6S-FA-01", name: "Final Assembly", department: "Operations", owner: "Maria Torres", sponsor: "Operations Manager", phase: "Sustain", auditCadence: "Weekly", scores: [88, 92, 90, 86, 82, 96], lastAudit: "2026-07-31", nextAudit: "2026-08-07", openFindings: 3, criticalFindings: 0, redTags: 2, status: "Controlled" },
  { id: "6S-ET-02", name: "Electrical Test", department: "Quality", owner: "Andre Lewis", sponsor: "Quality Manager", phase: "Standardize", auditCadence: "Weekly", scores: [82, 79, 86, 76, 68, 78], lastAudit: "2026-07-30", nextAudit: "2026-08-06", openFindings: 6, criticalFindings: 1, redTags: 4, status: "Action Required" },
  { id: "6S-MS-03", name: "Machine Shop", department: "Operations", owner: "James Cole", sponsor: "Plant Manager", phase: "Set in Order", auditCadence: "Weekly", scores: [76, 71, 83, 66, 62, 88], lastAudit: "2026-07-29", nextAudit: "2026-08-05", openFindings: 7, criticalFindings: 0, redTags: 5, status: "Improving" },
  { id: "6S-FO-04", name: "Foam Operations", department: "Operations", owner: "Sofia Reed", sponsor: "Operations Manager", phase: "Sustain", auditCadence: "Weekly", scores: [91, 89, 94, 88, 85, 93], lastAudit: "2026-08-01", nextAudit: "2026-08-08", openFindings: 2, criticalFindings: 0, redTags: 1, status: "Controlled" },
  { id: "6S-PK-05", name: "Packaging", department: "Delivery", owner: "Caleb Young", sponsor: "Delivery Manager", phase: "Standardize", auditCadence: "Biweekly", scores: [86, 84, 89, 81, 74, 92], lastAudit: "2026-07-25", nextAudit: "2026-08-08", openFindings: 4, criticalFindings: 0, redTags: 1, status: "Improving" },
  { id: "6S-WH-06", name: "Warehouse & Receiving", department: "Warehouse", owner: "Emily Chen", sponsor: "Supply Chain Manager", phase: "Sort", auditCadence: "Weekly", scores: [68, 63, 72, 59, 54, 84], lastAudit: "2026-07-28", nextAudit: "2026-08-04", openFindings: 9, criticalFindings: 0, redTags: 8, status: "Launch" },
];

const fallbackActions = [
  { id: "A-6S-101", source: "Safety finding", area: "Electrical Test", title: "Replace damaged extension cord and verify electrical inspection", owner: "Maintenance Lead", due: "2026-08-04", priority: "Critical", status: "Open", verification: "Safety verification required", repeat: false },
  { id: "A-6S-102", source: "Weekly audit", area: "Machine Shop", title: "Establish labeled point-of-use locations for changeover tooling", owner: "James Cole", due: "2026-08-09", priority: "High", status: "In Progress", verification: "Before/after photo", repeat: true },
  { id: "A-6S-103", source: "Red tag", area: "Warehouse & Receiving", title: "Disposition obsolete packaging fixtures", owner: "Emily Chen", due: "2026-08-08", priority: "Moderate", status: "Open", verification: "Disposition approval", repeat: false },
  { id: "A-6S-104", source: "Standard review", area: "Packaging", title: "Update visual standard for finished-goods staging lanes", owner: "Caleb Young", due: "2026-08-12", priority: "Moderate", status: "Open", verification: "Area-owner approval", repeat: false },
  { id: "A-6S-105", source: "Daily check", area: "Final Assembly", title: "Restore missing torque-tool location label", owner: "Maria Torres", due: "2026-08-05", priority: "Low", status: "Open", verification: "Supervisor check", repeat: false },
];

const fallbackAudits = [
  { id: "AUD-6S-241", area: "Final Assembly", type: "Weekly supervisor", auditor: "Operations Supervisor", date: "2026-07-31", score: 89, safety: 96, findings: 3, status: "Complete" },
  { id: "AUD-6S-242", area: "Electrical Test", type: "Weekly supervisor", auditor: "Quality Supervisor", date: "2026-07-30", score: 78, safety: 78, findings: 6, status: "Action Required" },
  { id: "AUD-6S-243", area: "Foam Operations", type: "Cross-functional", auditor: "6S Steering Team", date: "2026-08-01", score: 90, safety: 93, findings: 2, status: "Complete" },
  { id: "AUD-6S-244", area: "Warehouse & Receiving", type: "Baseline", auditor: "6S Leader", date: "2026-07-28", score: 67, safety: 84, findings: 9, status: "Action Required" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function createId(prefix) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function blankAnswer() {
  return {
    rating: null,
    notes: "",
    photos: [],
    corrective: {
      enabled: false,
      title: "",
      owner: "",
      due: addDays(today(), 7),
      priority: "Moderate",
      verification: "Before/after photo and area-owner verification",
    },
  };
}

function normalizeAnswers(saved = {}) {
  return Object.fromEntries(questions.map((question) => [question.id, { ...blankAnswer(), ...(saved[question.id] || {}), corrective: { ...blankAnswer().corrective, ...(saved[question.id]?.corrective || {}) } }]));
}

function average(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function scoreAnswers(answers, subset = questions) {
  const applicable = subset.filter((question) => answers[question.id]?.rating !== null && answers[question.id]?.rating !== -1);
  const possible = applicable.reduce((sum, question) => sum + question.weight, 0);
  const earned = applicable.reduce((sum, question) => sum + question.weight * (answers[question.id].rating / 4), 0);
  return possible ? Math.round((earned / possible) * 100) : 0;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only image files can be attached."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The image could not be processed."));
      image.onload = () => {
        const maximum = 1400;
        const scale = Math.min(1, maximum / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        resolve({ id: crypto.randomUUID(), name: file.name, dataUrl, capturedAt: new Date().toISOString() });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function statusFromScore(score, criticalCount) {
  if (criticalCount > 0) return "Action Required";
  if (score >= 85) return "Controlled";
  if (score >= 70) return "Improving";
  return "Action Required";
}

export default function SixSGuidedAudit() {
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [areaId, setAreaId] = useState("6S-FA-01");
  const [auditor, setAuditor] = useState("");
  const [auditType, setAuditType] = useState("Weekly supervisor");
  const [auditDate, setAuditDate] = useState(today());
  const [answers, setAnswers] = useState(() => normalizeAnswers());
  const [notice, setNotice] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [areaOptions, setAreaOptions] = useState(fallbackAreas);

  useEffect(() => {
    try {
      const workspace = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(workspace?.areas) && workspace.areas.length) setAreaOptions(workspace.areas);
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (draft) {
        setAreaId(draft.areaId || "6S-FA-01");
        setAuditor(draft.auditor || "");
        setAuditType(draft.auditType || "Weekly supervisor");
        setAuditDate(draft.auditDate || today());
        setCurrentIndex(Number.isInteger(draft.currentIndex) ? draft.currentIndex : 0);
        setAnswers(normalizeAnswers(draft.answers));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const interceptExistingAuditButton = (event) => {
      const button = event.target?.closest?.("button");
      if (!button || !button.textContent?.includes("Start 6S Audit")) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      setOpen(true);
      setSaved(false);
    };
    document.addEventListener("click", interceptExistingAuditButton, true);
    return () => document.removeEventListener("click", interceptExistingAuditButton, true);
  }, []);

  useEffect(() => {
    if (!open || saved) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ areaId, auditor, auditType, auditDate, currentIndex, answers }));
      } catch {
        setNotice("The browser could not save the full draft. Remove one or more photos before continuing.");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, saved, areaId, auditor, auditType, auditDate, currentIndex, answers]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const reviewMode = currentIndex >= questions.length;
  const answeredCount = questions.filter((question) => answers[question.id]?.rating !== null).length;
  const overallScore = scoreAnswers(answers);
  const pillarScores = useMemo(() => Object.fromEntries(pillars.map((pillar) => [pillar, scoreAnswers(answers, questions.filter((question) => question.pillar === pillar))])), [answers]);
  const findings = questions.filter((question) => {
    const rating = answers[question.id]?.rating;
    return rating !== null && rating !== -1 && rating < 3;
  });
  const criticalFailures = questions.filter((question) => {
    const rating = answers[question.id]?.rating;
    return question.criticalSafety && rating !== null && rating !== -1 && rating < 2;
  });
  const actionCount = questions.filter((question) => answers[question.id]?.corrective?.enabled).length;
  const missingMandatoryActions = questions.filter((question) => {
    const answer = answers[question.id];
    if (answer.rating === null || answer.rating === -1) return false;
    const mandatory = answer.rating <= 1 || (question.criticalSafety && answer.rating < 4);
    return mandatory && !answer.corrective.enabled;
  });

  function updateAnswer(questionId, updater) {
    setAnswers((current) => ({ ...current, [questionId]: typeof updater === "function" ? updater(current[questionId]) : { ...current[questionId], ...updater } }));
  }

  function chooseRating(value) {
    if (!currentQuestion) return;
    updateAnswer(currentQuestion.id, (answer) => {
      const needsAction = value !== -1 && (value <= 1 || (currentQuestion.criticalSafety && value < 4));
      const actionTitle = answer.corrective.title || `Correct 6S finding: ${currentQuestion.prompt.replace(/\?$/, "")}`;
      return {
        ...answer,
        rating: value,
        corrective: {
          ...answer.corrective,
          enabled: needsAction ? true : answer.corrective.enabled,
          title: needsAction ? actionTitle : answer.corrective.title,
          priority: currentQuestion.criticalSafety && value < 4 ? "Critical" : value <= 1 ? "High" : answer.corrective.priority,
          verification: currentQuestion.criticalSafety ? "Safety verification and after-photo required before closure" : answer.corrective.verification,
        },
      };
    });
    setNotice("");
  }

  async function addPhotos(files) {
    if (!currentQuestion || !files?.length) return;
    const available = Math.max(0, 3 - currentAnswer.photos.length);
    if (!available) {
      setNotice("This question already has the maximum of three photos.");
      return;
    }
    setPhotoBusy(true);
    try {
      const selected = Array.from(files).slice(0, available);
      const processed = [];
      for (const file of selected) processed.push(await compressImage(file));
      updateAnswer(currentQuestion.id, (answer) => ({ ...answer, photos: [...answer.photos, ...processed] }));
      setNotice(`${processed.length} photo${processed.length === 1 ? "" : "s"} attached to this question.`);
    } catch (error) {
      setNotice(error.message || "The photo could not be attached.");
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(photoId) {
    updateAnswer(currentQuestion.id, (answer) => ({ ...answer, photos: answer.photos.filter((photo) => photo.id !== photoId) }));
  }

  function goNext() {
    if (currentAnswer?.rating === null) {
      setNotice("Select a rating or N/A before continuing.");
      return;
    }
    setNotice("");
    setCurrentIndex((index) => Math.min(questions.length, index + 1));
  }

  function startNewAudit() {
    setSaved(false);
    setCurrentIndex(0);
    setAreaId(areaOptions[0]?.id || "6S-FA-01");
    setAuditor("");
    setAuditType("Weekly supervisor");
    setAuditDate(today());
    setAnswers(normalizeAnswers());
    setNotice("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function saveAudit() {
    if (!auditor.trim()) {
      setNotice("Enter the auditor's name before saving the audit.");
      return;
    }
    const unanswered = questions.filter((question) => answers[question.id].rating === null);
    if (unanswered.length) {
      setNotice(`${unanswered.length} question${unanswered.length === 1 ? " is" : "s are"} unanswered.`);
      setCurrentIndex(questions.indexOf(unanswered[0]));
      return;
    }
    if (missingMandatoryActions.length) {
      setNotice(`${missingMandatoryActions.length} major or safety finding${missingMandatoryActions.length === 1 ? " requires" : "s require"} a corrective action before the audit can close.`);
      setCurrentIndex(questions.indexOf(missingMandatoryActions[0]));
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
      const workspace = {
        ...existing,
        areas: Array.isArray(existing.areas) && existing.areas.length ? existing.areas : fallbackAreas,
        actions: Array.isArray(existing.actions) ? existing.actions : fallbackActions,
        audits: Array.isArray(existing.audits) ? existing.audits : fallbackAudits,
      };
      const selectedArea = workspace.areas.find((area) => area.id === areaId) || areaOptions.find((area) => area.id === areaId) || fallbackAreas[0];
      const auditId = createId("AUD-6S");
      const actionRecords = questions
        .filter((question) => answers[question.id].corrective.enabled)
        .map((question) => {
          const answer = answers[question.id];
          return {
            id: createId("A-6S"),
            source: `Guided audit ${auditId} · ${question.id}`,
            sourceAuditId: auditId,
            questionId: question.id,
            area: selectedArea.name,
            areaId,
            title: answer.corrective.title,
            owner: answer.corrective.owner || selectedArea.owner || "Area Owner",
            due: answer.corrective.due,
            priority: answer.corrective.priority,
            status: "Open",
            verification: answer.corrective.verification,
            repeat: false,
            evidencePhotos: answer.photos,
          };
        });
      const answerRecords = questions.map((question) => ({
        questionId: question.id,
        pillar: question.pillar,
        prompt: question.prompt,
        weight: question.weight,
        criticalSafety: Boolean(question.criticalSafety),
        rating: answers[question.id].rating,
        notes: answers[question.id].notes,
        photos: answers[question.id].photos,
        correctiveActionCreated: answers[question.id].corrective.enabled,
      }));
      const auditRecord = {
        id: auditId,
        area: selectedArea.name,
        areaId,
        type: auditType,
        auditor: auditor.trim(),
        date: auditDate,
        score: overallScore,
        weightedScore: overallScore,
        safety: pillarScores.Safety,
        pillarScores,
        findings: findings.length,
        criticalFindings: criticalFailures.length,
        correctiveActions: actionRecords.length,
        photoCount: answerRecords.reduce((sum, answer) => sum + answer.photos.length, 0),
        status: criticalFailures.length || overallScore < 85 ? "Action Required" : "Complete",
        scoringMethod: "Applicable weighted score: rating 0-4 multiplied by question weight; N/A excluded from denominator",
        answers: answerRecords,
        completedAt: new Date().toISOString(),
      };

      workspace.audits = [auditRecord, ...workspace.audits];
      workspace.actions = [...actionRecords, ...workspace.actions];
      workspace.areas = workspace.areas.map((area) => area.id === areaId ? {
        ...area,
        scores: pillars.map((pillar) => pillarScores[pillar]),
        lastAudit: auditDate,
        nextAudit: addDays(auditDate, area.auditCadence === "Biweekly" ? 14 : 7),
        openFindings: findings.length,
        criticalFindings: criticalFailures.length,
        status: statusFromScore(overallScore, criticalFailures.length),
      } : area);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));

      const updatedAreaScores = workspace.areas.map((area) => average(area.scores || []));
      const updatedSafetyScores = workspace.areas.map((area) => Number(area.scores?.[5] || 0));
      const previousSummary = JSON.parse(localStorage.getItem(SUMMARY_KEY) || "null") || {};
      const summary = {
        ...previousSummary,
        enterpriseScore: average(updatedAreaScores),
        safetyScore: average(updatedSafetyScores),
        criticalSafety: workspace.actions.filter((action) => action.priority === "Critical" && action.status !== "Closed").length,
        openRedTags: previousSummary.openRedTags ?? (Array.isArray(workspace.redTags) ? workspace.redTags.filter((tag) => !["Disposed", "Closed"].includes(tag.status)).length : 5),
        areasAtTarget: workspace.areas.filter((area) => average(area.scores || []) >= 85 && Number(area.scores?.[5] || 0) >= 80 && Number(area.criticalFindings || 0) === 0).length,
        totalAreas: workspace.areas.length,
        recoveredSpace: previousSummary.recoveredSpace ?? 610,
        recoveredValue: previousSummary.recoveredValue ?? 42750,
        source: "Guided weighted 6S audits",
        sourcePath: "/tools/6s-workplace-excellence",
        lastAuditId: auditId,
      };
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
      localStorage.removeItem(DRAFT_KEY);
      window.dispatchEvent(new CustomEvent("qmspilot:6s-summary-updated", { detail: summary }));
      window.dispatchEvent(new CustomEvent("qmspilot:6s-audit-completed", { detail: auditRecord }));
      setSaved(true);
      setNotice("");
    } catch (error) {
      setNotice(error?.name === "QuotaExceededError" ? "The audit contains more photo data than this browser can store. Remove some photos and save again." : "The audit could not be saved. Review the entries and try again.");
    }
  }

  const selectedAreaName = areaOptions.find((area) => area.id === areaId)?.name || "Selected area";

  return (
    <>
      <button className="guided-6s-launcher" type="button" onClick={() => { setOpen(true); setSaved(false); }}>
        <ClipboardCheck size={17}/> Guided 6S Audit
      </button>

      {open && (
        <div className="guided-6s-overlay" role="dialog" aria-modal="true" aria-label="Guided weighted 6S audit">
          <section className="guided-6s-shell">
            <header className="guided-6s-header">
              <div className="guided-6s-header-icon"><ListChecks size={23}/></div>
              <div><small>QMSPILOT NORTHSTAR · 6S WORKPLACE EXCELLENCE</small><strong>Guided Weighted Audit</strong></div>
              <span>{answeredCount}/{questions.length} questions</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close guided audit"><X size={19}/></button>
            </header>

            {saved ? (
              <div className="guided-6s-complete">
                <div className="complete-icon"><CheckCircle2 size={42}/></div>
                <small>AUDIT SAVED AND ROUTED</small>
                <h2>{selectedAreaName} · {overallScore}% weighted score</h2>
                <p>The audit, question-level photo evidence, pillar scores, and {actionCount} corrective action{actionCount === 1 ? "" : "s"} were written into the 6S workspace.</p>
                <div className="complete-metrics">
                  <div><strong>{pillarScores.Safety}%</strong><span>Safety</span></div>
                  <div><strong>{findings.length}</strong><span>Findings</span></div>
                  <div><strong>{criticalFailures.length}</strong><span>Critical</span></div>
                  <div><strong>{questions.reduce((sum, question) => sum + answers[question.id].photos.length, 0)}</strong><span>Photos</span></div>
                </div>
                <div className="complete-actions">
                  <button type="button" onClick={() => window.location.reload()}><Sparkles size={16}/> Return to updated 6S dashboard</button>
                  <button type="button" className="secondary" onClick={startNewAudit}>Start another audit</button>
                </div>
              </div>
            ) : (
              <div className="guided-6s-body">
                <main className="guided-6s-work">
                  <section className="audit-context">
                    <label><span>Area being audited</span><select value={areaId} onChange={(event) => setAreaId(event.target.value)}>{areaOptions.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select></label>
                    <label><span>Auditor</span><input value={auditor} onChange={(event) => setAuditor(event.target.value)} placeholder="Auditor name"/></label>
                    <label><span>Audit type</span><select value={auditType} onChange={(event) => setAuditType(event.target.value)}><option>Daily area-owner check</option><option>Weekly supervisor</option><option>Cross-functional calibration</option><option>Monthly leadership</option><option>Baseline implementation</option></select></label>
                    <label><span>Audit date</span><input type="date" value={auditDate} onChange={(event) => setAuditDate(event.target.value)}/></label>
                  </section>

                  {!reviewMode ? (
                    <section className="guided-question-card">
                      <div className="question-progress"><span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}/></div>
                      <div className="question-meta">
                        <div><small>{currentQuestion.pillar.toUpperCase()} · QUESTION {currentIndex + 1} OF {questions.length}</small><span>{currentQuestion.weight}% weight</span>{currentQuestion.criticalSafety && <em><HardHat size={13}/> Critical safety question</em>}</div>
                        <strong>{pillarWeights[currentQuestion.pillar]}% pillar weight</strong>
                      </div>
                      <h2>{currentQuestion.prompt}</h2>
                      <p className="question-guidance">{currentQuestion.guidance}</p>

                      <div className="rating-grid">
                        {ratingOptions.map((option) => (
                          <button type="button" className={currentAnswer.rating === option.value ? `selected rating-${option.value}` : ""} onClick={() => chooseRating(option.value)} key={option.value}>
                            <b>{option.label}</b><span>{option.title}</span><small>{option.description}</small>
                          </button>
                        ))}
                      </div>

                      <div className="evidence-grid">
                        <label className="notes-field"><span>Auditor notes and objective evidence</span><textarea value={currentAnswer.notes} onChange={(event) => updateAnswer(currentQuestion.id, { notes: event.target.value })} placeholder="Describe what was observed, where it was found, and the evidence used to support the rating."/></label>
                        <div className="photo-field">
                          <div><span>Photo evidence</span><small>Up to three compressed photos per question</small></div>
                          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(event) => addPhotos(event.target.files)}/>
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoBusy || currentAnswer.photos.length >= 3}><Camera size={16}/>{photoBusy ? "Processing..." : "Add photos"}</button>
                          <div className="photo-strip">
                            {currentAnswer.photos.length ? currentAnswer.photos.map((photo) => <figure key={photo.id}><img src={photo.dataUrl} alt={photo.name}/><figcaption><span>{photo.name}</span><button type="button" onClick={() => removePhoto(photo.id)} aria-label={`Remove ${photo.name}`}><Trash2 size={13}/></button></figcaption></figure>) : <div className="photo-empty"><ImagePlus size={25}/><span>No photos attached</span></div>}
                          </div>
                        </div>
                      </div>

                      <section className={currentAnswer.corrective.enabled ? "corrective-panel enabled" : "corrective-panel"}>
                        <div className="corrective-toggle">
                          <div><Flag size={18}/><span><strong>Create corrective action from this question</strong><small>Link ownership, due date, priority, verification, notes, and photos to the audit finding.</small></span></div>
                          <button type="button" onClick={() => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, enabled: !answer.corrective.enabled, title: answer.corrective.title || `Correct 6S finding: ${currentQuestion.prompt.replace(/\?$/, "")}` } }))}>{currentAnswer.corrective.enabled ? "Action enabled" : "Add action"}</button>
                        </div>
                        {currentAnswer.corrective.enabled && <div className="corrective-fields">
                          <label className="full"><span>Corrective action</span><input value={currentAnswer.corrective.title} onChange={(event) => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, title: event.target.value } }))}/></label>
                          <label><span>Owner</span><input value={currentAnswer.corrective.owner} onChange={(event) => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, owner: event.target.value } }))} placeholder={areaOptions.find((area) => area.id === areaId)?.owner || "Area owner"}/></label>
                          <label><span>Due date</span><input type="date" value={currentAnswer.corrective.due} onChange={(event) => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, due: event.target.value } }))}/></label>
                          <label><span>Priority</span><select value={currentAnswer.corrective.priority} onChange={(event) => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, priority: event.target.value } }))}><option>Low</option><option>Moderate</option><option>High</option><option>Critical</option></select></label>
                          <label><span>Closure verification</span><input value={currentAnswer.corrective.verification} onChange={(event) => updateAnswer(currentQuestion.id, (answer) => ({ ...answer, corrective: { ...answer.corrective, verification: event.target.value } }))}/></label>
                        </div>}
                      </section>
                    </section>
                  ) : (
                    <section className="audit-review">
                      <div className="review-heading"><div><small>FINAL AUDIT REVIEW</small><h2>Confirm the weighted result and action routing</h2><p>N/A questions are excluded from the applicable denominator. Major gaps and incomplete critical-safety controls require corrective action.</p></div><div className={criticalFailures.length ? "review-score blocked" : "review-score"}><strong>{overallScore}%</strong><span>Weighted score</span></div></div>
                      {criticalFailures.length > 0 && <div className="safety-block"><ShieldAlert size={20}/><div><strong>Safety release gate is blocked</strong><p>{criticalFailures.length} critical safety question{criticalFailures.length === 1 ? " is" : "s are"} rated below partially effective. The area cannot be classified as controlled.</p></div></div>}
                      <div className="review-pillars">{pillars.map((pillar) => <div key={pillar}><span><strong>{pillar}</strong><em>{pillarScores[pillar]}%</em></span><i><b style={{ width: `${pillarScores[pillar]}%` }}/></i><small>{pillarWeights[pillar]}% of total audit weight</small></div>)}</div>
                      <div className="review-summary-grid"><div><strong>{findings.length}</strong><span>Ratings below 3</span></div><div><strong>{actionCount}</strong><span>Corrective actions</span></div><div><strong>{criticalFailures.length}</strong><span>Critical safety failures</span></div><div><strong>{questions.reduce((sum, question) => sum + answers[question.id].photos.length, 0)}</strong><span>Evidence photos</span></div></div>
                      <div className="review-findings">
                        <h3>Findings and action decisions</h3>
                        {findings.length ? findings.map((question) => <button type="button" onClick={() => setCurrentIndex(questions.indexOf(question))} key={question.id}><span className={`review-rating r${answers[question.id].rating}`}>{answers[question.id].rating}</span><div><strong>{question.id} · {question.pillar}</strong><p>{question.prompt}</p><small>{answers[question.id].corrective.enabled ? `Corrective action: ${answers[question.id].corrective.title}` : "No corrective action added"} · {answers[question.id].photos.length} photo{answers[question.id].photos.length === 1 ? "" : "s"}</small></div><ChevronRight size={16}/></button>) : <div className="no-findings"><CheckCircle2 size={22}/><span>No question was rated below mostly effective.</span></div>}
                      </div>
                    </section>
                  )}

                  {notice && <div className="guided-notice"><ShieldAlert size={16}/><span>{notice}</span></div>}

                  <footer className="guided-footer">
                    <button type="button" className="secondary" disabled={currentIndex === 0} onClick={() => { setNotice(""); setCurrentIndex((index) => Math.max(0, index - 1)); }}><ChevronLeft size={16}/> Previous</button>
                    <span>Draft saves automatically in this browser</span>
                    {!reviewMode ? <button type="button" onClick={goNext}>{currentIndex === questions.length - 1 ? "Review audit" : "Next question"}<ChevronRight size={16}/></button> : <button type="button" onClick={saveAudit}><Save size={16}/> Save audit and actions</button>}
                  </footer>
                </main>

                <aside className="guided-6s-score-rail">
                  <div className="live-score"><small>LIVE WEIGHTED SCORE</small><strong>{overallScore}%</strong><span>{answeredCount} of {questions.length} answered</span></div>
                  <div className="weight-explainer"><Sparkles size={16}/><p>Each 0-4 rating is multiplied by the question weight. N/A removes that weight from the applicable denominator.</p></div>
                  <div className="rail-pillars">{pillars.map((pillar) => {
                    const answered = questions.filter((question) => question.pillar === pillar && answers[question.id].rating !== null).length;
                    const total = questions.filter((question) => question.pillar === pillar).length;
                    return <button type="button" onClick={() => setCurrentIndex(questions.findIndex((question) => question.pillar === pillar && answers[question.id].rating === null) >= 0 ? questions.findIndex((question) => question.pillar === pillar && answers[question.id].rating === null) : questions.findIndex((question) => question.pillar === pillar))} key={pillar}><span><strong>{pillar}</strong><em>{pillarScores[pillar]}%</em></span><i><b style={{ width: `${pillarScores[pillar]}%` }}/></i><small>{answered}/{total} answered · {pillarWeights[pillar]}% weight</small></button>;
                  })}</div>
                  <div className="rail-status"><div><FileImage size={16}/><span><strong>{questions.reduce((sum, question) => sum + answers[question.id].photos.length, 0)}</strong> photos</span></div><div><Flag size={16}/><span><strong>{actionCount}</strong> actions</span></div><div><HardHat size={16}/><span><strong>{criticalFailures.length}</strong> critical failures</span></div></div>
                </aside>
              </div>
            )}
          </section>
        </div>
      )}

      <style jsx global>{`
        .guided-6s-launcher{position:fixed;right:20px;bottom:20px;z-index:245;display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 17px;border:1px solid #8fcbb2;border-radius:999px;color:#fff;background:linear-gradient(135deg,#116746,#1b9a68);box-shadow:0 16px 40px rgba(19,113,76,.28);font:850 11px Inter,Arial,sans-serif;cursor:pointer}.guided-6s-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:rgba(3,15,27,.82);backdrop-filter:blur(10px);font-family:Inter,Arial,sans-serif}.guided-6s-shell{width:min(1440px,100%);height:min(930px,96vh);display:flex;flex-direction:column;overflow:hidden;border:1px solid #355b79;border-radius:22px;background:#edf3f8;box-shadow:0 35px 110px rgba(0,0,0,.55)}.guided-6s-header{min-height:68px;display:flex;align-items:center;gap:12px;padding:0 18px;color:#fff;background:linear-gradient(135deg,#061729,#0d477c)}.guided-6s-header-icon{width:42px;height:42px;display:grid;place-items:center;border:1px solid #4e7595;border-radius:12px;background:#0c3152}.guided-6s-header>div:nth-child(2){margin-right:auto}.guided-6s-header small,.guided-6s-header strong{display:block}.guided-6s-header small{color:#91c4e9;font-size:8px;font-weight:900;letter-spacing:.13em}.guided-6s-header strong{margin-top:3px;font-size:18px}.guided-6s-header>span{padding:7px 10px;border:1px solid #4e7595;border-radius:999px;color:#d7e8f5;font-size:9px;font-weight:900}.guided-6s-header>button{width:38px;height:38px;display:grid;place-items:center;border:1px solid #4e7595;border-radius:10px;color:#fff;background:#102f4c;cursor:pointer}.guided-6s-body{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 285px;flex:1}.guided-6s-work{min-width:0;overflow:auto;padding:18px}.audit-context{display:grid;grid-template-columns:1.25fr 1fr 1fr 160px;gap:9px;margin-bottom:12px;padding:12px;border:1px solid #d4e1ea;border-radius:14px;background:#fff}.audit-context label,.notes-field,.corrective-fields label{display:grid;gap:5px;color:#4c667c;font-size:8px;font-weight:900}.audit-context input,.audit-context select,.guided-question-card textarea,.corrective-fields input,.corrective-fields select{width:100%;padding:9px 10px;border:1px solid #c7d7e3;border-radius:8px;color:#173149;background:#fff;font:inherit;outline:none}.audit-context input:focus,.audit-context select:focus,.guided-question-card textarea:focus,.corrective-fields input:focus,.corrective-fields select:focus{border-color:#0a66ff;box-shadow:0 0 0 3px rgba(10,102,255,.1)}.guided-question-card,.audit-review{position:relative;padding:20px;border:1px solid #d4e1eb;border-radius:18px;background:#fff;box-shadow:0 12px 30px rgba(24,53,77,.07)}.question-progress{height:5px;margin:-20px -20px 18px;overflow:hidden;border-radius:18px 18px 0 0;background:#dfeaf2}.question-progress span{height:100%;display:block;background:linear-gradient(90deg,#0a66ff,#2ac788)}.question-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.question-meta>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.question-meta small{color:#0a66ff;font-size:8px;font-weight:950;letter-spacing:.11em}.question-meta span,.question-meta>strong{padding:5px 7px;border-radius:999px;color:#135f44;background:#e6f7ef;font-size:8px;font-weight:900}.question-meta em{display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:999px;color:#8b2936;background:#ffe7eb;font-size:8px;font-style:normal;font-weight:900}.guided-question-card h2{max-width:1050px;margin:14px 0 8px;color:#10263a;font-size:clamp(20px,2.2vw,30px);line-height:1.22}.question-guidance{margin:0;color:#60798d;font-size:10px;line-height:1.6}.rating-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:16px}.rating-grid button{min-height:126px;display:flex;flex-direction:column;align-items:flex-start;padding:12px;border:1px solid #d0dce6;border-radius:13px;color:#173149;background:#f8fbfd;text-align:left;cursor:pointer;transition:.15s}.rating-grid button:hover{transform:translateY(-2px);border-color:#8db6d7}.rating-grid button.selected{border:2px solid #0a66ff;background:#edf6ff;box-shadow:0 8px 22px rgba(10,102,255,.12)}.rating-grid button.selected.rating-0,.rating-grid button.selected.rating-1{border-color:#c63849;background:#fff0f2}.rating-grid b{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;color:#0a66ff;background:#e5f1ff;font-size:15px}.rating-grid button.selected.rating-0 b,.rating-grid button.selected.rating-1 b{color:#9d2838;background:#ffe0e5}.rating-grid span{margin-top:9px;font-size:10px;font-weight:900}.rating-grid small{margin-top:5px;color:#687f92;font-size:8px;line-height:1.45}.evidence-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.notes-field textarea{min-height:145px;resize:vertical}.photo-field{padding:12px;border:1px solid #d4e1ea;border-radius:12px;background:#f8fbfd}.photo-field>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.photo-field>div:first-child span{color:#4c667c;font-size:8px;font-weight:900}.photo-field>div:first-child small{color:#71879a;font-size:8px}.photo-field>button{display:inline-flex;align-items:center;gap:6px;min-height:34px;margin-top:9px;padding:0 10px;border:1px solid #8ab7dc;border-radius:8px;color:#0c578f;background:#eaf5ff;font-size:8px;font-weight:900;cursor:pointer}.photo-field>button:disabled{opacity:.5}.photo-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:9px}.photo-strip figure{min-width:0;margin:0;overflow:hidden;border:1px solid #d2e0ea;border-radius:9px;background:#fff}.photo-strip img{width:100%;height:82px;display:block;object-fit:cover}.photo-strip figcaption{display:flex;align-items:center;gap:4px;padding:5px}.photo-strip figcaption span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#60778a;font-size:7px}.photo-strip figcaption button{width:24px;height:24px;display:grid;place-items:center;margin-left:auto;border:0;border-radius:6px;color:#9b2c3a;background:#ffe8ec;cursor:pointer}.photo-empty{grid-column:1/-1;min-height:105px;display:grid;place-items:center;align-content:center;gap:6px;border:1px dashed #b9cad7;border-radius:9px;color:#71879a;font-size:8px}.corrective-panel{margin-top:14px;padding:13px;border:1px solid #d7e3eb;border-radius:13px;background:#f8fbfd}.corrective-panel.enabled{border-color:#87c6aa;background:#f1fbf6}.corrective-toggle{display:flex;align-items:center;gap:12px}.corrective-toggle>div{display:flex;align-items:center;gap:9px;margin-right:auto}.corrective-toggle svg{color:#178258}.corrective-toggle span strong,.corrective-toggle span small{display:block}.corrective-toggle span strong{font-size:10px}.corrective-toggle span small{margin-top:3px;color:#678094;font-size:8px}.corrective-toggle>button{min-height:34px;padding:0 10px;border:1px solid #9ccab8;border-radius:8px;color:#176649;background:#e5f7ee;font-size:8px;font-weight:900;cursor:pointer}.corrective-fields{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:9px;margin-top:12px;padding-top:12px;border-top:1px solid #cee1d8}.corrective-fields .full{grid-column:1/-1}.guided-notice{display:flex;align-items:center;gap:8px;margin-top:10px;padding:10px 12px;border:1px solid #e0a5ad;border-radius:10px;color:#852b38;background:#fff0f2;font-size:9px;font-weight:850}.guided-footer{position:sticky;bottom:-18px;z-index:4;display:flex;align-items:center;gap:10px;margin:12px -18px -18px;padding:12px 18px;border-top:1px solid #d5e1ea;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}.guided-footer>span{margin:auto;color:#6c8396;font-size:8px}.guided-footer button,.complete-actions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 13px;border:1px solid #0a66ff;border-radius:9px;color:#fff;background:#0a66ff;font-size:9px;font-weight:900;cursor:pointer}.guided-footer button.secondary,.complete-actions button.secondary{border-color:#bdcedb;color:#294a64;background:#fff}.guided-footer button:disabled{opacity:.45;cursor:not-allowed}.guided-6s-score-rail{overflow:auto;padding:16px;border-left:1px solid #cedce6;background:#f7fafc}.live-score{display:grid;place-items:center;padding:18px;border:1px solid #cee0eb;border-radius:16px;background:#fff;text-align:center}.live-score small{color:#688095;font-size:8px;font-weight:900;letter-spacing:.12em}.live-score strong{margin-top:8px;color:#0a66ff;font-size:47px;line-height:1}.live-score span{margin-top:6px;color:#698094;font-size:8px}.weight-explainer{display:flex;gap:8px;margin-top:10px;padding:11px;border-left:3px solid #0a66ff;border-radius:9px;color:#174d78;background:#e9f5ff}.weight-explainer p{margin:0;font-size:8px;line-height:1.5}.rail-pillars{display:grid;gap:8px;margin-top:12px}.rail-pillars button{padding:10px;border:1px solid #d6e2ea;border-radius:11px;background:#fff;text-align:left;cursor:pointer}.rail-pillars button>span{display:flex;justify-content:space-between;font-size:9px}.rail-pillars em{font-style:normal;font-weight:900}.rail-pillars i,.review-pillars i{height:7px;display:block;margin-top:5px;overflow:hidden;border-radius:999px;background:#e2ebf1}.rail-pillars i b,.review-pillars i b{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#2ac788)}.rail-pillars small{display:block;margin-top:5px;color:#71879a;font-size:7px}.rail-status{display:grid;gap:7px;margin-top:12px}.rail-status>div{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #d8e3eb;border-radius:9px;background:#fff;color:#587186;font-size:8px}.rail-status svg{color:#0a66ff}.rail-status strong{color:#16344d}.review-heading{display:flex;align-items:center;gap:18px}.review-heading>div:first-child{margin-right:auto}.review-heading small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.review-heading h2{margin:6px 0}.review-heading p{max-width:780px;margin:0;color:#61798d;font-size:9px;line-height:1.5}.review-score{min-width:145px;padding:15px;border-radius:14px;color:#176748;background:#e5f7ee;text-align:center}.review-score.blocked{color:#922d3a;background:#ffe6ea}.review-score strong,.review-score span{display:block}.review-score strong{font-size:34px}.review-score span{font-size:8px}.safety-block{display:flex;gap:10px;margin-top:13px;padding:13px;border-left:4px solid #c5394b;border-radius:10px;color:#822c38;background:#fff0f2}.safety-block p{margin:4px 0 0;font-size:9px}.review-pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px}.review-pillars>div{padding:11px;border:1px solid #d8e3eb;border-radius:11px;background:#f8fbfd}.review-pillars>div>span{display:flex;justify-content:space-between;font-size:9px}.review-pillars em{font-style:normal;font-weight:900}.review-pillars small{display:block;margin-top:5px;color:#71879a;font-size:7px}.review-summary-grid,.complete-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:13px}.review-summary-grid>div,.complete-metrics>div{padding:12px;border:1px solid #d8e3eb;border-radius:11px;background:#fff;text-align:center}.review-summary-grid strong,.review-summary-grid span,.complete-metrics strong,.complete-metrics span{display:block}.review-summary-grid strong,.complete-metrics strong{font-size:21px}.review-summary-grid span,.complete-metrics span{margin-top:3px;color:#6b8295;font-size:8px}.review-findings{margin-top:15px}.review-findings h3{margin:0 0 9px}.review-findings>button{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:10px;border:0;border-bottom:1px solid #e1e9ef;background:#fff;text-align:left;cursor:pointer}.review-findings>button:hover{background:#f6faff}.review-rating{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;color:#8d2b39;background:#ffe5e9;font-weight:950}.review-rating.r2{color:#80520d;background:#fff0d4}.review-findings strong{font-size:9px}.review-findings p{margin:3px 0;color:#4e687d;font-size:9px}.review-findings small{color:#71879a;font-size:7px}.no-findings{display:flex;align-items:center;gap:8px;padding:13px;border-radius:10px;color:#176748;background:#e5f7ee;font-size:9px;font-weight:850}.guided-6s-complete{max-width:760px;display:grid;place-items:center;align-content:center;flex:1;margin:auto;padding:35px;text-align:center}.complete-icon{width:82px;height:82px;display:grid;place-items:center;border-radius:50%;color:#fff;background:linear-gradient(135deg,#158157,#2ac788);box-shadow:0 18px 45px rgba(24,139,92,.25)}.guided-6s-complete>small{margin-top:18px;color:#168157;font-size:8px;font-weight:950;letter-spacing:.13em}.guided-6s-complete h2{margin:8px 0 7px;font-size:29px}.guided-6s-complete>p{max-width:650px;margin:0;color:#60798d;font-size:10px;line-height:1.6}.complete-metrics{width:100%;margin-top:18px}.complete-actions{display:flex;gap:9px;margin-top:18px}@media(max-width:1050px){.guided-6s-body{grid-template-columns:1fr}.guided-6s-score-rail{display:none}.rating-grid{grid-template-columns:repeat(3,1fr)}.audit-context{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.guided-6s-overlay{padding:0}.guided-6s-shell{height:100vh;border-radius:0}.guided-6s-header>span{display:none}.guided-6s-work{padding:10px}.audit-context,.evidence-grid,.corrective-fields,.review-pillars,.review-summary-grid,.complete-metrics{grid-template-columns:1fr}.corrective-fields .full{grid-column:auto}.rating-grid{grid-template-columns:repeat(2,1fr)}.rating-grid button{min-height:110px}.question-meta{flex-direction:column}.guided-question-card,.audit-review{padding:15px}.question-progress{margin:-15px -15px 15px}.guided-footer{bottom:-10px;margin:10px -10px -10px;padding:10px}.guided-footer>span{display:none}.guided-footer button{flex:1}.corrective-toggle{align-items:flex-start;flex-direction:column}.corrective-toggle>button{width:100%}.review-heading{align-items:stretch;flex-direction:column}.complete-actions{width:100%;flex-direction:column}.guided-6s-launcher{right:12px;bottom:12px}}
      `}</style>
    </>
  );
}
