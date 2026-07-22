"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  FileDown,
  FileSpreadsheet,
  Gauge,
  History,
  ImagePlus,
  ListChecks,
  PackageSearch,
  Pencil,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Trash2,
  Upload,
  UploadCloud,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const draftKey = "qmspilot:asset-reliability:draft";
const recordsKey = "qmspilot:asset-reliability:records";
const evidenceBucket = "asset-reliability-evidence";

const criticalityMeta = {
  low: { label: "Low", score: 25 },
  moderate: { label: "Moderate", score: 50 },
  high: { label: "High", score: 75 },
  business_critical: { label: "Business Critical", score: 100 },
};

const assetStatusMeta = {
  available: "Available",
  restricted: "Operating with restrictions",
  down: "Down",
  retired: "Retired",
};

const workStatusMeta = {
  open: "Open",
  in_progress: "In progress",
  awaiting_parts: "Awaiting parts",
  verification: "Verification",
  closed: "Closed",
};

const priorityMeta = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

function nowLocal() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRecordId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `NAR-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createWorkOrderNumber() {
  return `WO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function blankPmPlan() {
  return {
    id: crypto.randomUUID(),
    title: "",
    triggerType: "calendar",
    frequencyValue: 1,
    frequencyUnit: "months",
    owner: "",
    lastCompleted: "",
    nextDue: "",
    checklistText: "",
    status: "active",
  };
}

function blankAsset() {
  return {
    id: crypto.randomUUID(),
    assetCode: "",
    name: "",
    category: "Production equipment",
    department: "",
    area: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    installDate: "",
    assetOwner: "",
    maintenanceOwner: "",
    criticality: "moderate",
    status: "available",
    backupAvailable: false,
    replacementLeadDays: 0,
    hourlyCapacityValue: 0,
    photoName: "",
    photoDataUrl: "",
    manualNames: [],
    pmPlans: [],
    history: [],
  };
}

function blankWorkOrder(assetId = "") {
  return {
    id: crypto.randomUUID(),
    workOrderNumber: createWorkOrderNumber(),
    assetId,
    type: "corrective",
    priority: "moderate",
    status: "open",
    description: "",
    reportedBy: "",
    assignedTo: "",
    openedAt: nowLocal(),
    estimatedReturn: "",
    failureMode: "",
    safetyRisk: false,
    qualityRisk: false,
    productionImpact: "",
    customerOrders: "",
    quantityAtRisk: 0,
    downtimeStart: "",
    downtimeEnd: "",
    downtimeHours: 0,
    laborHours: 0,
    partsCost: 0,
    externalCost: 0,
    repairAction: "",
    rootCause: "",
    verification: "",
    maintenanceApproved: false,
    operationsApproved: false,
    qualityApproved: false,
    returnedToServiceAt: "",
    recommendedHandoff: "Local reliability action",
    evidenceNames: [],
    history: [],
  };
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
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function safeFileName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "evidence";
}

function workOrderDowntimeHours(workOrder) {
  if (Number(workOrder.downtimeHours) > 0) return Number(workOrder.downtimeHours);
  if (!workOrder.downtimeStart) return 0;
  const end = workOrder.downtimeEnd ? new Date(workOrder.downtimeEnd) : new Date();
  const start = new Date(workOrder.downtimeStart);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
}

function nextDueDate(lastCompleted, value, unit) {
  if (!lastCompleted || !["days", "weeks", "months"].includes(unit)) return "";
  const date = new Date(`${lastCompleted}T12:00:00`);
  if (unit === "days") date.setDate(date.getDate() + Number(value));
  if (unit === "weeks") date.setDate(date.getDate() + Number(value) * 7);
  if (unit === "months") date.setMonth(date.getMonth() + Number(value));
  return date.toISOString().slice(0, 10);
}

function demoData() {
  const hofer = blankAsset();
  Object.assign(hofer, {
    id: "asset-hoefler",
    assetCode: "MCH-HOF-1500",
    name: "Höfler Rapid 1500/2600",
    category: "Gear manufacturing",
    department: "Machine Shop",
    area: "Gear Grinding",
    manufacturer: "Klingelnberg Höfler",
    model: "Rapid 1500/2600",
    serialNumber: "DEMO-HOF-001",
    installDate: "2017-04-18",
    assetOwner: "Machine Shop Manager",
    maintenanceOwner: "Maintenance Lead",
    criticality: "business_critical",
    status: "available",
    backupAvailable: false,
    replacementLeadDays: 270,
    hourlyCapacityValue: 1850,
    manualNames: ["Rapid_1500_2600_Manual.pdf"],
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Asset", detail: "Business-critical asset profile loaded.", actor: "Northstar Demo" }],
  });
  hofer.pmPlans = [
    { ...blankPmPlan(), id: "pm-hof-monthly", title: "Monthly lubrication and safety inspection", frequencyValue: 1, frequencyUnit: "months", owner: "Maintenance Lead", lastCompleted: dateFromToday(-38), nextDue: dateFromToday(-8), checklistText: "Verify lubrication system\nInspect guarding and interlocks\nCheck coolant condition\nReview alarms", status: "active" },
    { ...blankPmPlan(), id: "pm-hof-annual", title: "Annual OEM precision service", frequencyValue: 12, frequencyUnit: "months", owner: "OEM Service Provider", lastCompleted: dateFromToday(-330), nextDue: dateFromToday(35), checklistText: "Axis verification\nSpindle condition\nGeometry and precision report", status: "active" },
  ];

  const samsung = blankAsset();
  Object.assign(samsung, {
    id: "asset-samsung",
    assetCode: "CNC-SL65",
    name: "Samsung SL65 CNC Lathe",
    category: "CNC machining",
    department: "Machine Shop",
    area: "Turning",
    manufacturer: "Samsung",
    model: "SL65",
    serialNumber: "DEMO-SL65-002",
    installDate: "2019-09-12",
    assetOwner: "Operations Manager",
    maintenanceOwner: "Maintenance Technician",
    criticality: "high",
    status: "available",
    backupAvailable: true,
    replacementLeadDays: 180,
    hourlyCapacityValue: 925,
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Asset", detail: "Asset profile loaded.", actor: "Northstar Demo" }],
  });
  samsung.pmPlans = [{ ...blankPmPlan(), id: "pm-sl65-weekly", title: "Weekly operator condition check", frequencyValue: 1, frequencyUnit: "weeks", owner: "Area Supervisor", lastCompleted: dateFromToday(-5), nextDue: dateFromToday(2), checklistText: "Check way lubrication\nInspect chip conveyor\nVerify coolant concentration", status: "active" }];

  const puma = blankAsset();
  Object.assign(puma, {
    id: "asset-puma",
    assetCode: "CNC-VT1100M",
    name: "PUMA VT1100M",
    category: "CNC machining",
    department: "Machine Shop",
    area: "Vertical Turning",
    manufacturer: "DN Solutions",
    model: "PUMA VT1100M",
    serialNumber: "DEMO-VT-003",
    installDate: "2022-02-07",
    assetOwner: "Operations Manager",
    maintenanceOwner: "Maintenance Lead",
    criticality: "high",
    status: "restricted",
    backupAvailable: false,
    replacementLeadDays: 210,
    hourlyCapacityValue: 1200,
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Restriction", detail: "Operating restriction established pending spindle-temperature verification.", actor: "Operations Manager" }],
  });
  puma.pmPlans = [{ ...blankPmPlan(), id: "pm-vt-monthly", title: "Monthly spindle and hydraulic inspection", frequencyValue: 1, frequencyUnit: "months", owner: "Maintenance Lead", lastCompleted: dateFromToday(-24), nextDue: dateFromToday(7), checklistText: "Review spindle temperature trend\nInspect hydraulic leaks\nVerify chuck pressure", status: "active" }];

  const testStand = blankAsset();
  Object.assign(testStand, {
    id: "asset-teststand",
    assetCode: "TST-GBX-01",
    name: "Gearbox Final Test Stand",
    category: "Final testing",
    department: "Quality",
    area: "Test Bay",
    manufacturer: "Custom",
    model: "Northstar Test Cell",
    serialNumber: "DEMO-TST-004",
    installDate: "2025-11-10",
    assetOwner: "Quality Manager",
    maintenanceOwner: "Controls Engineer",
    criticality: "business_critical",
    status: "available",
    backupAvailable: false,
    replacementLeadDays: 240,
    hourlyCapacityValue: 2500,
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Asset", detail: "Final-test asset profile loaded.", actor: "Northstar Demo" }],
  });
  testStand.pmPlans = [{ ...blankPmPlan(), id: "pm-test-quarterly", title: "Quarterly sensor and safety verification", frequencyValue: 3, frequencyUnit: "months", owner: "Controls Engineer", lastCompleted: dateFromToday(-65), nextDue: dateFromToday(25), checklistText: "Verify tachometer\nVerify probes and RTDs\nConfirm emergency stop\nReview sampling rate", status: "active" }];

  const blast = blankAsset();
  Object.assign(blast, {
    id: "asset-blast",
    assetCode: "BLT-CAB-01",
    name: "Blast Cabinet",
    category: "Surface preparation",
    department: "Operations",
    area: "Blast and Paint",
    manufacturer: "Industrial Systems",
    model: "BC-72",
    serialNumber: "DEMO-BLT-005",
    installDate: "2014-06-15",
    assetOwner: "Operations Supervisor",
    maintenanceOwner: "Maintenance Technician",
    criticality: "moderate",
    status: "down",
    backupAvailable: true,
    replacementLeadDays: 90,
    hourlyCapacityValue: 650,
    history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Breakdown", detail: "Dust-collector fan failure stopped production.", actor: "Operations Supervisor" }],
  });
  blast.pmPlans = [{ ...blankPmPlan(), id: "pm-blast-weekly", title: "Weekly dust collection inspection", frequencyValue: 1, frequencyUnit: "weeks", owner: "Maintenance Technician", lastCompleted: dateFromToday(-12), nextDue: dateFromToday(-5), checklistText: "Inspect filters\nCheck fan vibration\nVerify differential pressure", status: "active" }];

  const workOrders = [
    {
      ...blankWorkOrder("asset-puma"),
      id: "wo-puma",
      workOrderNumber: "WO-2026-VT1100",
      type: "corrective",
      priority: "high",
      status: "in_progress",
      description: "Investigate intermittent spindle-temperature alarm and confirm safe operating envelope.",
      reportedBy: "Night Supervisor",
      assignedTo: "Maintenance Lead",
      openedAt: dateFromToday(-1) + "T18:10",
      estimatedReturn: dateFromToday(1) + "T12:00",
      failureMode: "Spindle temperature exceeds normal trend during extended cycle.",
      qualityRisk: true,
      productionImpact: "Restricted to short-cycle work. Two long-cycle jobs moved to alternate routing.",
      customerOrders: "RGA-4179",
      quantityAtRisk: 2,
      downtimeStart: dateFromToday(-1) + "T18:10",
      downtimeEnd: dateFromToday(-1) + "T22:40",
      downtimeHours: 4.5,
      laborHours: 6,
      partsCost: 850,
      externalCost: 0,
      repairAction: "Inspection underway; temperature probe and lubrication flow being verified.",
      rootCause: "Pending verification.",
      verification: "",
      recommendedHandoff: "Connect NCR for product-impact review",
      history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Work order", detail: "Corrective work order opened from operating restriction.", actor: "Night Supervisor" }],
    },
    {
      ...blankWorkOrder("asset-blast"),
      id: "wo-blast",
      workOrderNumber: "WO-2026-BLAST",
      type: "emergency",
      priority: "critical",
      status: "awaiting_parts",
      description: "Dust-collector fan motor failed during production.",
      reportedBy: "Operations Supervisor",
      assignedTo: "Maintenance Technician",
      openedAt: dateFromToday(-2) + "T09:20",
      estimatedReturn: dateFromToday(1) + "T15:00",
      failureMode: "Fan motor bearing seizure.",
      safetyRisk: true,
      productionImpact: "Blast preparation stopped. Work diverted to backup equipment with reduced throughput.",
      downtimeStart: dateFromToday(-2) + "T09:20",
      downtimeHours: 22,
      laborHours: 8,
      partsCost: 2200,
      externalCost: 450,
      repairAction: "Replacement motor ordered. Temporary containment prevents use of affected cabinet.",
      rootCause: "Repeat bearing degradation; lubrication interval and filter loading under review.",
      recommendedHandoff: "Escalate repeat failure to CAPA",
      history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Breakdown", detail: "Emergency work order created and asset locked out.", actor: "Operations Supervisor" }],
    },
  ];

  return { assets: [hofer, samsung, puma, testStand, blast], workOrders };
}

export default function AssetReliabilityApp() {
  const cloud = useCloudWorkspace();
  const assetEvidenceRef = useRef(new Map());
  const workOrderEvidenceRef = useRef(new Map());

  const [setup, setSetup] = useState({
    organization: "QMSPilot Design Partner",
    site: "",
    reliabilityOwner: "",
    scheduledHours: 720,
    laborRate: 65,
    capacityValuePerHour: 500,
    leadershipIntent: "Protect customer delivery by preventing avoidable equipment failures and controlling return-to-service decisions.",
  });
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [recordId, setRecordId] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [assetModal, setAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState(blankAsset());
  const [pmModal, setPmModal] = useState(false);
  const [pmAssetId, setPmAssetId] = useState("");
  const [pmForm, setPmForm] = useState(blankPmPlan());
  const [workOrderModal, setWorkOrderModal] = useState(false);
  const [workOrderForm, setWorkOrderForm] = useState(blankWorkOrder());
  const [historyItem, setHistoryItem] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  const [assetSearch, setAssetSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("active");
  const [workStatusFilter, setWorkStatusFilter] = useState("open");

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.setup) setSetup(draft.setup);
      if (Array.isArray(draft.assets)) setAssets(draft.assets);
      if (Array.isArray(draft.workOrders)) setWorkOrders(draft.workOrders);
      if (draft.recordId) setRecordId(draft.recordId);
      setNotice("Saved Asset Reliability workspace restored.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  const departments = useMemo(() => [...new Set(assets.map((asset) => asset.department).filter(Boolean))].sort(), [assets]);

  const metrics = useMemo(() => {
    const operatingAssets = assets.filter((asset) => asset.status !== "retired");
    const activePlans = operatingAssets.flatMap((asset) => (asset.pmPlans || []).filter((plan) => plan.status === "active").map((plan) => ({ asset, plan })));
    const overduePm = activePlans.filter(({ plan }) => plan.nextDue && plan.nextDue < today()).length;
    const duePm = activePlans.filter(({ plan }) => plan.nextDue && plan.nextDue <= dateFromToday(30)).length;
    const pmCompliance = activePlans.length ? Math.max(0, Math.round((1 - overduePm / activePlans.length) * 100)) : 100;
    const downtimeHours = workOrders.reduce((sum, workOrder) => sum + workOrderDowntimeHours(workOrder), 0);
    const scheduledHours = Math.max(0, Number(setup.scheduledHours) || 0);
    const uptime = scheduledHours ? Math.max(0, Math.min(100, ((scheduledHours - downtimeHours) / scheduledHours) * 100)) : 100;
    const workOrderCost = workOrders.reduce((sum, workOrder) => {
      const asset = assets.find((item) => item.id === workOrder.assetId);
      const capacityRate = Number(asset?.hourlyCapacityValue) || Number(setup.capacityValuePerHour) || 0;
      return sum + workOrderDowntimeHours(workOrder) * capacityRate + Number(workOrder.laborHours || 0) * Number(setup.laborRate || 0) + Number(workOrder.partsCost || 0) + Number(workOrder.externalCost || 0);
    }, 0);
    const openWorkOrders = workOrders.filter((workOrder) => workOrder.status !== "closed");
    const emergencyOpen = openWorkOrders.filter((workOrder) => workOrder.type === "emergency").length;
    const criticalAssets = operatingAssets.filter((asset) => ["high", "business_critical"].includes(asset.criticality));
    const criticalAvailable = criticalAssets.filter((asset) => asset.status === "available").length;
    const criticalAvailability = criticalAssets.length ? criticalAvailable / criticalAssets.length : 1;
    const singleAssetDependencies = operatingAssets.filter((asset) => asset.criticality === "business_critical" && !asset.backupAvailable).length;
    const criticalDown = operatingAssets.filter((asset) => asset.status === "down" && ["high", "business_critical"].includes(asset.criticality)).length;
    const closedCorrective = workOrders.filter((workOrder) => workOrder.status === "closed" && ["corrective", "emergency"].includes(workOrder.type));
    const mttr = closedCorrective.length ? closedCorrective.reduce((sum, workOrder) => sum + workOrderDowntimeHours(workOrder), 0) / closedCorrective.length : 0;
    const failures = workOrders.filter((workOrder) => ["corrective", "emergency"].includes(workOrder.type)).length;
    const mtbf = failures && scheduledHours ? scheduledHours / failures : scheduledHours;
    const verifiedClosed = workOrders.filter((workOrder) => workOrder.status === "closed" && workOrder.maintenanceApproved && workOrder.operationsApproved && (!workOrder.qualityRisk || workOrder.qualityApproved)).length;
    const closedCount = workOrders.filter((workOrder) => workOrder.status === "closed").length;
    const verificationScore = closedCount ? verifiedClosed / closedCount : 1;
    const reliabilityScore = Math.round(uptime * 0.35 + pmCompliance * 0.25 + criticalAvailability * 100 * 0.2 + verificationScore * 100 * 0.2);
    return {
      operatingAssets,
      activePlans,
      overduePm,
      duePm,
      pmCompliance,
      downtimeHours,
      uptime,
      workOrderCost,
      openWorkOrders,
      emergencyOpen,
      singleAssetDependencies,
      criticalDown,
      mttr,
      mtbf,
      reliabilityScore,
    };
  }, [assets, workOrders, setup]);

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const matchesSearch = `${asset.assetCode} ${asset.name} ${asset.manufacturer} ${asset.model} ${asset.serialNumber}`.toLowerCase().includes(assetSearch.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || asset.department === departmentFilter;
    const matchesStatus = assetStatusFilter === "all" || (assetStatusFilter === "active" ? asset.status !== "retired" : asset.status === assetStatusFilter);
    return matchesSearch && matchesDepartment && matchesStatus;
  }), [assets, assetSearch, departmentFilter, assetStatusFilter]);

  const filteredWorkOrders = useMemo(() => workOrders.filter((workOrder) => {
    if (workStatusFilter === "all") return true;
    if (workStatusFilter === "open") return workOrder.status !== "closed";
    return workOrder.status === workStatusFilter;
  }), [workOrders, workStatusFilter]);

  function assetName(assetId) {
    const asset = assets.find((item) => item.id === assetId);
    return asset ? `${asset.assetCode} · ${asset.name}` : "Asset not found";
  }

  function workOrderCost(workOrder) {
    const asset = assets.find((item) => item.id === workOrder.assetId);
    const capacityRate = Number(asset?.hourlyCapacityValue) || Number(setup.capacityValuePerHour) || 0;
    return workOrderDowntimeHours(workOrder) * capacityRate + Number(workOrder.laborHours || 0) * Number(setup.laborRate || 0) + Number(workOrder.partsCost || 0) + Number(workOrder.externalCost || 0);
  }

  function openNewAsset(template = null) {
    const next = template
      ? {
          ...deepClone(template),
          id: crypto.randomUUID(),
          assetCode: "",
          name: `${template.name} Copy`,
          serialNumber: "",
          photoName: "",
          photoDataUrl: "",
          manualNames: [],
          history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Asset", detail: `Asset profile duplicated from ${template.assetCode}.`, actor: setup.reliabilityOwner || "Authorized user" }],
        }
      : blankAsset();
    setAssetForm(next);
    setAssetModal(true);
  }

  function editAsset(asset) {
    setAssetForm(deepClone(asset));
    setAssetModal(true);
  }

  function saveAsset() {
    if (!assetForm.assetCode.trim() || !assetForm.name.trim() || !assetForm.department.trim() || !assetForm.assetOwner.trim()) {
      setNotice("Asset code, name, department, and asset owner are required.");
      return;
    }
    const duplicate = assets.some((asset) => asset.assetCode.toLowerCase() === assetForm.assetCode.toLowerCase() && asset.id !== assetForm.id);
    if (duplicate) {
      setNotice("Asset code must be unique.");
      return;
    }
    const exists = assets.some((asset) => asset.id === assetForm.id);
    const event = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: exists ? "Asset update" : "Asset creation",
      detail: exists ? "Asset master data updated." : "Asset added to the reliability register.",
      actor: setup.reliabilityOwner || "Authorized user",
    };
    const saved = { ...assetForm, history: [event, ...(assetForm.history || [])] };
    setAssets((current) => exists ? current.map((asset) => asset.id === saved.id ? saved : asset) : [...current, saved]);
    setAssetModal(false);
    setSubmitted(false);
    setNotice(`${saved.name} saved to the asset register.`);
  }

  function setAssetStatus(asset, status) {
    setAssets((current) => current.map((item) => item.id === asset.id ? {
      ...item,
      status,
      history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Status", detail: `Operating status changed to ${assetStatusMeta[status]}.`, actor: setup.reliabilityOwner || "Authorized user" }, ...(item.history || [])],
    } : item));
    setSubmitted(false);
    setNotice(`${asset.name} is now ${assetStatusMeta[status]}.`);
  }

  function deleteAsset(asset) {
    if (!window.confirm(`Permanently remove ${asset.name} and its draft PM plans and work orders from this assessment?`)) return;
    setAssets((current) => current.filter((item) => item.id !== asset.id));
    setWorkOrders((current) => current.filter((item) => item.assetId !== asset.id));
    setSubmitted(false);
    setNotice(`${asset.name} removed from this assessment.`);
  }

  function handleAssetPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setNotice("Asset photos must be 3 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAssetForm((current) => ({ ...current, photoName: file.name, photoDataUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
    const existing = assetEvidenceRef.current.get(assetForm.id) || [];
    assetEvidenceRef.current.set(assetForm.id, [...existing.filter((item) => item.kind !== "photo"), { kind: "photo", file }]);
  }

  function handleAssetManuals(event) {
    const files = Array.from(event.target.files || []);
    setAssetForm((current) => ({ ...current, manualNames: files.map((file) => file.name) }));
    const existing = assetEvidenceRef.current.get(assetForm.id) || [];
    assetEvidenceRef.current.set(assetForm.id, [...existing.filter((item) => item.kind !== "manual"), ...files.map((file) => ({ kind: "manual", file }))]);
  }

  function openPmPlan(asset, plan = null) {
    setPmAssetId(asset.id);
    setPmForm(plan ? deepClone(plan) : blankPmPlan());
    setPmModal(true);
  }

  function savePmPlan() {
    if (!pmForm.title.trim() || !pmForm.owner.trim()) {
      setNotice("PM title and owner are required.");
      return;
    }
    setAssets((current) => current.map((asset) => {
      if (asset.id !== pmAssetId) return asset;
      const exists = (asset.pmPlans || []).some((plan) => plan.id === pmForm.id);
      const plans = exists ? asset.pmPlans.map((plan) => plan.id === pmForm.id ? pmForm : plan) : [...(asset.pmPlans || []), pmForm];
      return {
        ...asset,
        pmPlans: plans,
        history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "PM plan", detail: `${exists ? "Updated" : "Added"} preventive-maintenance plan: ${pmForm.title}.`, actor: setup.reliabilityOwner || "Authorized user" }, ...(asset.history || [])],
      };
    }));
    setPmModal(false);
    setSubmitted(false);
    setNotice("Preventive-maintenance plan saved.");
  }

  function completePm(assetId, planId) {
    setAssets((current) => current.map((asset) => {
      if (asset.id !== assetId) return asset;
      const plan = asset.pmPlans.find((item) => item.id === planId);
      if (!plan) return asset;
      const completed = today();
      const nextDue = nextDueDate(completed, plan.frequencyValue, plan.frequencyUnit) || plan.nextDue;
      return {
        ...asset,
        pmPlans: asset.pmPlans.map((item) => item.id === planId ? { ...item, lastCompleted: completed, nextDue } : item),
        history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "PM completion", detail: `${plan.title} completed. Next due ${nextDue || "by condition/runtime"}.`, actor: plan.owner || setup.reliabilityOwner || "Authorized maintainer" }, ...(asset.history || [])],
      };
    }));
    setSubmitted(false);
    setNotice("PM completion recorded and next due date updated.");
  }

  function deletePmPlan(assetId, planId) {
    if (!window.confirm("Remove this PM plan from the current asset profile?")) return;
    setAssets((current) => current.map((asset) => asset.id === assetId ? { ...asset, pmPlans: (asset.pmPlans || []).filter((plan) => plan.id !== planId) } : asset));
    setSubmitted(false);
  }

  function openNewWorkOrder(assetId = "") {
    setWorkOrderForm(blankWorkOrder(assetId));
    setWorkOrderModal(true);
  }

  function editWorkOrder(workOrder) {
    setWorkOrderForm(deepClone(workOrder));
    setWorkOrderModal(true);
  }

  function startDowntime() {
    setWorkOrderForm((current) => ({ ...current, downtimeStart: current.downtimeStart || nowLocal(), downtimeEnd: "", status: "in_progress" }));
  }

  function stopDowntime() {
    setWorkOrderForm((current) => {
      const downtimeEnd = nowLocal();
      const temporary = { ...current, downtimeEnd };
      return { ...temporary, downtimeHours: Number(workOrderDowntimeHours(temporary).toFixed(2)), status: current.status === "closed" ? "closed" : "verification" };
    });
  }

  function recommendedHandoff(workOrder) {
    if (workOrder.qualityRisk) return "Create / connect NCR for product-impact review";
    if (workOrder.type === "emergency" && workOrder.rootCause.trim()) return "Escalate repeat or systemic failure to CAPA";
    if (!workOrder.assignedTo.trim()) return "Verify qualified technician in Workforce Readiness";
    return workOrder.recommendedHandoff || "Local reliability action";
  }

  function saveWorkOrder() {
    if (!workOrderForm.assetId || !workOrderForm.description.trim() || !workOrderForm.reportedBy.trim()) {
      setNotice("Asset, problem description, and reported by are required.");
      return;
    }
    if (workOrderForm.status === "closed") {
      const releaseComplete = workOrderForm.repairAction.trim() && workOrderForm.verification.trim() && workOrderForm.maintenanceApproved && workOrderForm.operationsApproved && (!workOrderForm.qualityRisk || workOrderForm.qualityApproved);
      if (!releaseComplete) {
        setNotice("Return to service requires repair action, verification, maintenance approval, operations approval, and quality approval when product risk exists.");
        return;
      }
    }
    const exists = workOrders.some((workOrder) => workOrder.id === workOrderForm.id);
    const downtimeHours = Number(workOrderDowntimeHours(workOrderForm).toFixed(2));
    const saved = {
      ...workOrderForm,
      downtimeHours,
      returnedToServiceAt: workOrderForm.status === "closed" ? workOrderForm.returnedToServiceAt || nowLocal() : workOrderForm.returnedToServiceAt,
      recommendedHandoff: recommendedHandoff(workOrderForm),
      history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: exists ? "Work order update" : "Work order creation", detail: `${workOrderForm.workOrderNumber} saved as ${workStatusMeta[workOrderForm.status]}.`, actor: setup.reliabilityOwner || workOrderForm.assignedTo || "Authorized user" }, ...(workOrderForm.history || [])],
    };
    setWorkOrders((current) => exists ? current.map((workOrder) => workOrder.id === saved.id ? saved : workOrder) : [saved, ...current]);
    setAssets((current) => current.map((asset) => {
      if (asset.id !== saved.assetId) return asset;
      const status = saved.status === "closed" ? "available" : saved.downtimeStart && !saved.downtimeEnd ? "down" : asset.status;
      return { ...asset, status, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Work order", detail: `${saved.workOrderNumber}: ${workStatusMeta[saved.status]}.`, actor: saved.assignedTo || setup.reliabilityOwner || "Authorized user" }, ...(asset.history || [])] };
    }));
    setWorkOrderModal(false);
    setSubmitted(false);
    setNotice(`${saved.workOrderNumber} saved. Estimated event cost: $${workOrderCost(saved).toLocaleString(undefined, { maximumFractionDigits: 0 })}.`);
  }

  function handleWorkOrderEvidence(event) {
    const files = Array.from(event.target.files || []);
    setWorkOrderForm((current) => ({ ...current, evidenceNames: files.map((file) => file.name) }));
    workOrderEvidenceRef.current.set(workOrderForm.id, files);
  }

  function loadDemo() {
    const demo = demoData();
    setSetup({
      organization: "Northstar Precision Systems",
      site: "Lufkin Operations",
      reliabilityOwner: "Director of Operations",
      scheduledHours: 720,
      laborRate: 68,
      capacityValuePerHour: 750,
      leadershipIntent: "Protect customer delivery by restoring the blast cabinet, eliminating repeat failures, and creating resilient coverage for business-critical gear manufacturing and final test assets.",
    });
    setAssets(demo.assets);
    setWorkOrders(demo.workOrders);
    setRecordId("");
    setSubmitted(false);
    setNotice("Design-partner Asset Reliability demonstration loaded.");
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify({ setup, assets, workOrders, recordId }));
    setNotice("Asset Reliability workspace saved on this device.");
  }

  function clearTool() {
    if ((assets.length || workOrders.length) && !window.confirm("Start a new Asset Reliability workspace and clear the current draft from this device?")) return;
    setSetup({ organization: "QMSPilot Design Partner", site: "", reliabilityOwner: "", scheduledHours: 720, laborRate: 65, capacityValuePerHour: 500, leadershipIntent: "Protect customer delivery by preventing avoidable equipment failures and controlling return-to-service decisions." });
    setAssets([]);
    setWorkOrders([]);
    setRecordId("");
    setSubmitted(false);
    setNotice("New Asset Reliability workspace started.");
    window.localStorage.removeItem(draftKey);
  }

  function downloadTemplate() {
    const csv = "assetCode,name,category,department,area,manufacturer,model,serialNumber,installDate,assetOwner,maintenanceOwner,criticality,status,backupAvailable,replacementLeadDays,hourlyCapacityValue\nMCH-001,Asset Name,Production equipment,Operations,Area 1,Manufacturer,Model,SERIAL-001,2024-01-15,Operations Manager,Maintenance Lead,high,available,false,120,750\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Northstar_Asset_Register_Template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function readImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
      setNotice("For Excel, save the asset sheet as CSV or paste copied Excel rows into the import window.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(file);
  }

  function importAssets() {
    const rows = parseDelimited(importText);
    if (rows.length < 2) {
      setNotice("No asset rows were found. Use the Northstar template or paste rows copied from Excel.");
      return;
    }
    const headers = rows[0].map(normalizeHeader);
    const aliases = {
      assetcode: ["assetcode", "assetid", "equipmentid", "tag"],
      name: ["name", "assetname", "equipmentname"],
      category: ["category", "assetcategory", "equipmenttype"],
      department: ["department", "dept"],
      area: ["area", "productionarea", "location"],
      manufacturer: ["manufacturer", "make"],
      model: ["model"],
      serialnumber: ["serialnumber", "serial", "serialno"],
      installdate: ["installdate", "commissiondate"],
      assetowner: ["assetowner", "owner", "processowner"],
      maintenanceowner: ["maintenanceowner", "maintenancelead", "maintainer"],
      criticality: ["criticality", "criticalitylevel"],
      status: ["status", "operatingstatus"],
      backupavailable: ["backupavailable", "backup", "alternateavailable"],
      replacementleaddays: ["replacementleaddays", "replacementleadtime", "leaddays"],
      hourlycapacityvalue: ["hourlycapacityvalue", "capacityvalueperhour", "hourlyvalue"],
    };
    const indexFor = (key) => headers.findIndex((header) => aliases[key].includes(header));
    if (["assetcode", "name", "department", "assetowner"].some((key) => indexFor(key) < 0)) {
      setNotice("Import requires assetCode, name, department, and assetOwner columns.");
      return;
    }
    let added = 0;
    let updated = 0;
    setAssets((current) => {
      const next = deepClone(current);
      rows.slice(1).forEach((row) => {
        const value = (key, fallback = "") => {
          const index = indexFor(key);
          return index >= 0 ? String(row[index] || "").trim() : fallback;
        };
        const assetCode = value("assetcode");
        const name = value("name");
        if (!assetCode || !name) return;
        const existingIndex = next.findIndex((asset) => asset.assetCode.toLowerCase() === assetCode.toLowerCase());
        const criticality = Object.keys(criticalityMeta).includes(value("criticality").toLowerCase().replace(/\s+/g, "_")) ? value("criticality").toLowerCase().replace(/\s+/g, "_") : "moderate";
        const status = Object.keys(assetStatusMeta).includes(value("status").toLowerCase().replace(/\s+/g, "_")) ? value("status").toLowerCase().replace(/\s+/g, "_") : "available";
        const patch = {
          assetCode,
          name,
          category: value("category", "Production equipment"),
          department: value("department"),
          area: value("area"),
          manufacturer: value("manufacturer"),
          model: value("model"),
          serialNumber: value("serialnumber"),
          installDate: value("installdate"),
          assetOwner: value("assetowner"),
          maintenanceOwner: value("maintenanceowner"),
          criticality,
          status,
          backupAvailable: ["true", "yes", "1", "y"].includes(value("backupavailable").toLowerCase()),
          replacementLeadDays: Number(value("replacementleaddays")) || 0,
          hourlyCapacityValue: Number(value("hourlycapacityvalue")) || 0,
        };
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...patch, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Import", detail: "Asset master data updated by Excel/CSV import.", actor: setup.reliabilityOwner || "Authorized user" }, ...(next[existingIndex].history || [])] };
          updated += 1;
        } else {
          const asset = blankAsset();
          next.push({ ...asset, ...patch, history: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: "Import", detail: "Asset created by Excel/CSV import.", actor: setup.reliabilityOwner || "Authorized user" }] });
          added += 1;
        }
      });
      return next;
    });
    setImportModal(false);
    setImportText("");
    setSubmitted(false);
    setNotice(`Asset import complete: ${added} added, ${updated} updated.`);
  }

  function sanitizedAssets() {
    return assets.map(({ photoDataUrl, ...asset }) => asset);
  }

  function buildPayload(id) {
    return {
      schema: "qmspilot.northstar.asset-reliability.v1",
      recordId: id,
      toolId: "QMSP-AR-001",
      version: "1.0.0",
      submittedAt: new Date().toISOString(),
      setup,
      metrics: {
        reliabilityScore: metrics.reliabilityScore,
        uptimePercent: Number(metrics.uptime.toFixed(2)),
        pmCompliancePercent: metrics.pmCompliance,
        downtimeHours: Number(metrics.downtimeHours.toFixed(2)),
        downtimeCost: Number(metrics.workOrderCost.toFixed(2)),
        openWorkOrders: metrics.openWorkOrders.length,
        overduePm: metrics.overduePm,
        criticalDown: metrics.criticalDown,
        singleAssetDependencies: metrics.singleAssetDependencies,
        mttrHours: Number(metrics.mttr.toFixed(2)),
        mtbfHours: Number(metrics.mtbf.toFixed(2)),
      },
      assets: sanitizedAssets(),
      workOrders,
      governance: {
        humanReturnToServiceAuthority: true,
        evidenceTraceability: true,
        source: "Northstar Asset Reliability",
      },
    };
  }

  async function uploadEvidence(supabase, organizationId, snapshotId, assetIds, workOrderIds) {
    let uploaded = 0;
    const uploadGroup = async (entityType, localId, databaseId, entries, assetDatabaseId = null) => {
      const files = entries.map((entry) => entry.file || entry).filter(Boolean);
      if (!databaseId || !files.length) return;
      if (files.length > 8) throw new Error(`${entityType} evidence allows no more than 8 files per record.`);
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > 30 * 1024 * 1024) throw new Error(`${entityType} evidence must be 30 MB or smaller in total.`);
      for (const file of files) {
        const evidenceId = crypto.randomUUID();
        const path = `${organizationId}/${snapshotId}/${entityType}/${databaseId}/${evidenceId}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(evidenceBucket).upload(path, file, { contentType: file.type || "application/octet-stream", cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { error: evidenceError } = await supabase.from("asset_reliability_evidence").insert({
          id: evidenceId,
          organization_id: organizationId,
          snapshot_id: snapshotId,
          asset_id: entityType === "asset" ? databaseId : assetDatabaseId,
          work_order_id: entityType === "work_order" ? databaseId : null,
          entity_type: entityType,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          uploaded_by: cloud.user.id,
        });
        if (evidenceError) throw evidenceError;
        uploaded += 1;
      }
    };

    for (const [localId, entries] of assetEvidenceRef.current.entries()) {
      await uploadGroup("asset", localId, assetIds.get(localId), entries);
    }
    for (const [localId, entries] of workOrderEvidenceRef.current.entries()) {
      const workOrder = workOrders.find((item) => item.id === localId);
      await uploadGroup("work_order", localId, workOrderIds.get(localId), entries, workOrder ? assetIds.get(workOrder.assetId) : null);
    }
    return uploaded;
  }

  async function submitToNorthstar() {
    if (!setup.organization.trim() || !setup.site.trim() || !setup.reliabilityOwner.trim()) {
      setNotice("Complete organization, site, and reliability owner before submission.");
      return;
    }
    if (!assets.length) {
      setNotice("Add or import assets before submission.");
      return;
    }
    setSaving(true);
    const id = recordId || createRecordId();
    const payload = buildPayload(id);

    try {
      const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]");
      window.localStorage.setItem(recordsKey, JSON.stringify([payload, ...records].slice(0, 30)));
      window.localStorage.removeItem(draftKey);

      if (cloud.status === "ready" && cloud.organizationId && cloud.user) {
        const supabase = createClient();
        if (!supabase) throw new Error("Northstar Secure cloud is unavailable.");

        const { data: snapshot, error: snapshotError } = await supabase
          .from("asset_reliability_snapshots")
          .upsert({
            record_id: id,
            organization_id: cloud.organizationId,
            created_by: cloud.user.id,
            organization_name: setup.organization || cloud.organizationName,
            site: setup.site,
            reliability_score: metrics.reliabilityScore,
            uptime_percent: Number(metrics.uptime.toFixed(2)),
            pm_compliance_percent: metrics.pmCompliance,
            downtime_hours: Number(metrics.downtimeHours.toFixed(2)),
            downtime_cost: Number(metrics.workOrderCost.toFixed(2)),
            open_work_orders: metrics.openWorkOrders.length,
            overdue_pm: metrics.overduePm,
            payload,
            submitted_at: payload.submittedAt,
            updated_at: new Date().toISOString(),
          }, { onConflict: "record_id" })
          .select("id")
          .single();
        if (snapshotError) throw snapshotError;
        if (!snapshot?.id) throw new Error("Northstar did not return the Asset Reliability record ID.");

        const assetRows = assets.map((asset) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          asset_code: asset.assetCode,
          asset_name: asset.name,
          category: asset.category,
          department: asset.department,
          production_area: asset.area,
          manufacturer: asset.manufacturer,
          model: asset.model,
          serial_number: asset.serialNumber,
          install_date: asset.installDate || null,
          asset_owner: asset.assetOwner,
          maintenance_owner: asset.maintenanceOwner,
          criticality: asset.criticality,
          operating_status: asset.status,
          backup_available: asset.backupAvailable,
          replacement_lead_days: Number(asset.replacementLeadDays) || 0,
          hourly_capacity_value: Number(asset.hourlyCapacityValue) || 0,
          photo_name: asset.photoName || "",
          manual_names: asset.manualNames || [],
          history: asset.history || [],
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        }));
        const { data: savedAssets, error: assetError } = await supabase
          .from("asset_reliability_assets")
          .upsert(assetRows, { onConflict: "snapshot_id,asset_code" })
          .select("id, asset_code");
        if (assetError) throw assetError;
        const assetDatabaseByCode = new Map((savedAssets || []).map((asset) => [asset.asset_code, asset.id]));
        const assetIds = new Map(assets.map((asset) => [asset.id, assetDatabaseByCode.get(asset.assetCode)]));

        const pmRows = assets.flatMap((asset) => (asset.pmPlans || []).map((plan) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          asset_id: assetIds.get(asset.id),
          plan_key: plan.id,
          title: plan.title,
          trigger_type: plan.triggerType,
          frequency_value: Number(plan.frequencyValue) || 1,
          frequency_unit: plan.frequencyUnit,
          owner_name: plan.owner,
          last_completed: plan.lastCompleted || null,
          next_due: plan.nextDue || null,
          checklist: plan.checklistText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          plan_status: plan.status,
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        })));
        if (pmRows.length) {
          const { error: pmError } = await supabase.from("asset_reliability_pm_plans").upsert(pmRows, { onConflict: "snapshot_id,asset_id,plan_key" });
          if (pmError) throw pmError;
        }

        const workOrderRows = workOrders.map((workOrder) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          asset_id: assetIds.get(workOrder.assetId),
          work_order_number: workOrder.workOrderNumber,
          work_type: workOrder.type,
          priority: workOrder.priority,
          work_status: workOrder.status,
          description: workOrder.description,
          reported_by: workOrder.reportedBy,
          assigned_to: workOrder.assignedTo,
          opened_at: workOrder.openedAt || null,
          estimated_return: workOrder.estimatedReturn || null,
          failure_mode: workOrder.failureMode,
          safety_risk: workOrder.safetyRisk,
          quality_risk: workOrder.qualityRisk,
          production_impact: workOrder.productionImpact,
          customer_orders: workOrder.customerOrders,
          quantity_at_risk: Number(workOrder.quantityAtRisk) || 0,
          downtime_start: workOrder.downtimeStart || null,
          downtime_end: workOrder.downtimeEnd || null,
          downtime_hours: Number(workOrderDowntimeHours(workOrder).toFixed(2)),
          labor_hours: Number(workOrder.laborHours) || 0,
          parts_cost: Number(workOrder.partsCost) || 0,
          external_cost: Number(workOrder.externalCost) || 0,
          estimated_total_cost: Number(workOrderCost(workOrder).toFixed(2)),
          repair_action: workOrder.repairAction,
          root_cause: workOrder.rootCause,
          verification: workOrder.verification,
          maintenance_approved: workOrder.maintenanceApproved,
          operations_approved: workOrder.operationsApproved,
          quality_approved: workOrder.qualityApproved,
          returned_to_service_at: workOrder.returnedToServiceAt || null,
          recommended_handoff: workOrder.recommendedHandoff,
          evidence_names: workOrder.evidenceNames || [],
          history: workOrder.history || [],
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        }));
        let savedWorkOrders = [];
        if (workOrderRows.length) {
          const { data, error: workOrderError } = await supabase
            .from("asset_reliability_work_orders")
            .upsert(workOrderRows, { onConflict: "snapshot_id,work_order_number" })
            .select("id, work_order_number");
          if (workOrderError) throw workOrderError;
          savedWorkOrders = data || [];
        }
        const workOrderDatabaseByNumber = new Map(savedWorkOrders.map((workOrder) => [workOrder.work_order_number, workOrder.id]));
        const workOrderIds = new Map(workOrders.map((workOrder) => [workOrder.id, workOrderDatabaseByNumber.get(workOrder.workOrderNumber)]));
        const uploaded = await uploadEvidence(supabase, cloud.organizationId, snapshot.id, assetIds, workOrderIds);
        setNotice(`${id} submitted to the secure Northstar workspace with ${assets.length} assets, ${workOrders.length} work orders${uploaded ? `, and ${uploaded} evidence files` : ""}.`);
      } else {
        setNotice(`${id} saved in the Northstar demonstration workspace. Sign in to Secure cloud for tenant-protected persistence and evidence upload.`);
      }

      setRecordId(id);
      setSubmitted(true);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Asset Reliability could not submit to Northstar.");
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
    anchor.download = `${id}-asset-reliability.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="ar-shell">
      <header className="ar-header">
        <a href="/" className="back" aria-label="Return to Northstar"><ArrowLeft size={18} /></a>
        <div className="qms-lockup"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar-lockup"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="header-meta"><small>Northstar-connected production tool</small><strong>Asset Reliability</strong></div>
        <div className="header-status"><span />Human release authority</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Wrench size={17} /> PREVENTIVE MAINTENANCE · WORK ORDERS · DOWNTIME · CAPACITY PROTECTION</div>
          <h1>Protect customer delivery by keeping critical equipment available, capable, and controlled.</h1>
          <p>Build the asset register, schedule preventive maintenance, control breakdown response, calculate downtime exposure, and verify every return-to-service decision.</p>
          <div className="chips"><span>Tool ID QMSP-AR-001</span><span>Version 1.0.0</span><span>Northstar Connected</span><span>ISO 9001 · 7.1.3 aligned</span></div>
        </div>
        <article className="reliability-card">
          <small>ASSET RELIABILITY</small>
          <strong>{metrics.reliabilityScore}%</strong>
          <span>{metrics.criticalDown ? "Critical equipment attention required" : "Capacity protection active"}</span>
          <div className="ring" style={{ background: `conic-gradient(#0a66ff ${metrics.reliabilityScore * 3.6}deg,#26384d 0)` }}><div>{metrics.reliabilityScore}</div></div>
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
        <article><small>Reliability score</small><strong>{metrics.reliabilityScore}%</strong><span>Weighted operating health</span></article>
        <article><small>Estimated uptime</small><strong>{metrics.uptime.toFixed(1)}%</strong><span>{metrics.downtimeHours.toFixed(1)} downtime hours</span></article>
        <article><small>PM compliance</small><strong>{metrics.pmCompliance}%</strong><span>{metrics.overduePm} overdue · {metrics.duePm} due in 30 days</span></article>
        <article><small>Open work orders</small><strong>{metrics.openWorkOrders.length}</strong><span>{metrics.emergencyOpen} emergency</span></article>
        <article><small>Downtime exposure</small><strong>${Math.round(metrics.workOrderCost / 1000)}K</strong><span>Capacity, labor, parts, vendors</span></article>
        <article><small>Critical dependencies</small><strong>{metrics.singleAssetDependencies}</strong><span>{metrics.criticalDown} critical assets down</span></article>
        <article><small>MTTR</small><strong>{metrics.mttr.toFixed(1)}h</strong><span>Average verified repair</span></article>
        <article><small>Northstar record</small><strong className="record-id">{recordId || "DRAFT"}</strong><span>{submitted ? "Submitted" : "Not submitted"}</span></article>
      </section>

      <section className="panel">
        <div className="panel-title"><div><small>01 · OPERATING CONTEXT</small><h2>Define the reliability decision</h2></div><Target size={24} /></div>
        <div className="form-grid">
          <label>Organization<input value={setup.organization} onChange={(event) => setSetup({ ...setup, organization: event.target.value })} /></label>
          <label>Site / facility<input value={setup.site} onChange={(event) => setSetup({ ...setup, site: event.target.value })} placeholder="Required" /></label>
          <label>Reliability owner<input value={setup.reliabilityOwner} onChange={(event) => setSetup({ ...setup, reliabilityOwner: event.target.value })} placeholder="Required" /></label>
          <label>Scheduled operating hours<input type="number" min="0" value={setup.scheduledHours} onChange={(event) => setSetup({ ...setup, scheduledHours: event.target.value })} /></label>
          <label>Loaded labor rate / hour<input type="number" min="0" value={setup.laborRate} onChange={(event) => setSetup({ ...setup, laborRate: event.target.value })} /></label>
          <label>Default capacity value / hour<input type="number" min="0" value={setup.capacityValuePerHour} onChange={(event) => setSetup({ ...setup, capacityValuePerHour: event.target.value })} /></label>
          <label className="wide">Leadership intent<textarea value={setup.leadershipIntent} onChange={(event) => setSetup({ ...setup, leadershipIntent: event.target.value })} /></label>
        </div>
      </section>

      <section className="panel asset-panel">
        <div className="panel-title"><div><small>02 · ASSET REGISTER</small><h2>Control the equipment that protects quality and delivery</h2><p>Add equipment individually, import an existing spreadsheet, attach manuals, define business criticality, and assign ownership.</p></div><Settings2 size={24} /></div>
        <div className="section-actions no-print">
          <button className="primary" onClick={() => openNewAsset()}><Plus size={16} />Add asset</button>
          <button onClick={() => setImportModal(true)}><FileSpreadsheet size={16} />Import Excel / CSV</button>
          <button onClick={downloadTemplate}><FileDown size={16} />Download template</button>
          <button onClick={() => openNewWorkOrder()} disabled={!assets.length}><Wrench size={16} />Create work order</button>
        </div>
        <div className="filters">
          <input value={assetSearch} onChange={(event) => setAssetSearch(event.target.value)} placeholder="Search tag, asset, manufacturer, model, or serial" />
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option>{departments.map((department) => <option key={department}>{department}</option>)}</select>
          <select value={assetStatusFilter} onChange={(event) => setAssetStatusFilter(event.target.value)}><option value="active">Active assets</option><option value="available">Available</option><option value="restricted">Restricted</option><option value="down">Down</option><option value="retired">Retired</option><option value="all">All statuses</option></select>
        </div>
        {!filteredAssets.length ? <div className="empty"><Settings2 size={42} /><h3>No matching assets</h3><p>Add an asset, import the current equipment list, or load the design-partner demonstration.</p></div> : (
          <div className="table-wrap asset-table"><table><thead><tr><th>Asset</th><th>Department / area</th><th>Criticality</th><th>Status</th><th>PM health</th><th>Continuity</th><th className="no-print">Actions</th></tr></thead><tbody>{filteredAssets.map((asset) => {
            const activePlans = (asset.pmPlans || []).filter((plan) => plan.status === "active");
            const overdue = activePlans.filter((plan) => plan.nextDue && plan.nextDue < today()).length;
            return <tr key={asset.id}><td><div className="asset-cell">{asset.photoDataUrl ? <img src={asset.photoDataUrl} alt="" /> : <span><Settings2 size={19} /></span>}<div><strong>{asset.name}</strong><small>{asset.assetCode} · {asset.manufacturer || "Manufacturer not set"} {asset.model}</small></div></div></td><td><strong>{asset.department}</strong><small>{asset.area || "Area not set"}</small></td><td><b className={`criticality ${asset.criticality}`}>{criticalityMeta[asset.criticality].label}</b><small>{asset.hourlyCapacityValue ? `$${Number(asset.hourlyCapacityValue).toLocaleString()}/hr exposure` : "Hourly value not set"}</small></td><td><b className={`status ${asset.status}`}>{assetStatusMeta[asset.status]}</b></td><td><strong>{activePlans.length} active</strong><small className={overdue ? "text-bad" : "text-good"}>{overdue ? `${overdue} overdue` : "Current"}</small></td><td><strong>{asset.backupAvailable ? "Backup available" : "No backup"}</strong><small>{asset.replacementLeadDays || 0} day replacement lead</small></td><td className="row-actions no-print"><button title="Edit asset" onClick={() => editAsset(asset)}><Pencil size={15} /></button><button title="Add PM plan" onClick={() => openPmPlan(asset)}><ListChecks size={15} /></button><button title="Create work order" onClick={() => openNewWorkOrder(asset.id)}><Wrench size={15} /></button><button title="History" onClick={() => setHistoryItem({ type: "asset", item: asset })}><History size={15} /></button><button title="Duplicate asset profile" onClick={() => openNewAsset(asset)}><Copy size={15} /></button><button title={asset.status === "retired" ? "Reactivate" : "Retire"} onClick={() => setAssetStatus(asset, asset.status === "retired" ? "available" : "retired")}><RotateCcw size={15} /></button><button className="danger" title="Delete" onClick={() => deleteAsset(asset)}><Trash2 size={15} /></button></td></tr>;
          })}</tbody></table></div>
        )}
      </section>

      <section className="panel pm-panel">
        <div className="panel-title"><div><small>03 · PREVENTIVE MAINTENANCE CONTROL</small><h2>Convert maintenance requirements into accountable schedules</h2></div><ClipboardCheck size={24} /></div>
        {!metrics.activePlans.length ? <div className="empty"><ClipboardCheck size={42} /><h3>No active PM plans</h3><p>Open an asset and add calendar, runtime, cycle, or condition-based maintenance.</p></div> : <div className="table-wrap"><table><thead><tr><th>Asset / plan</th><th>Trigger</th><th>Owner</th><th>Last completed</th><th>Next due</th><th>Status</th><th className="no-print">Actions</th></tr></thead><tbody>{metrics.activePlans.map(({ asset, plan }) => {
          const overdue = plan.nextDue && plan.nextDue < today();
          return <tr key={`${asset.id}-${plan.id}`}><td><strong>{plan.title}</strong><small>{asset.assetCode} · {asset.name}</small></td><td><strong>{plan.triggerType}</strong><small>Every {plan.frequencyValue} {plan.frequencyUnit}</small></td><td>{plan.owner || "Owner not set"}</td><td>{plan.lastCompleted || "Not recorded"}</td><td><strong className={overdue ? "text-bad" : ""}>{plan.nextDue || "By runtime / condition"}</strong></td><td><b className={`pm-status ${overdue ? "overdue" : "current"}`}>{overdue ? "OVERDUE" : "CONTROLLED"}</b></td><td className="row-actions no-print"><button title="Complete PM" onClick={() => completePm(asset.id, plan.id)}><CheckCircle2 size={15} /></button><button title="Edit plan" onClick={() => openPmPlan(asset, plan)}><Pencil size={15} /></button><button className="danger" title="Remove plan" onClick={() => deletePmPlan(asset.id, plan.id)}><Trash2 size={15} /></button></td></tr>;
        })}</tbody></table></div>}
      </section>

      <section className="panel work-panel">
        <div className="panel-title"><div><small>04 · WORK ORDER COMMAND CENTER</small><h2>Control breakdown response, cost, and return to service</h2></div><Wrench size={24} /></div>
        <div className="section-actions no-print"><button className="primary" onClick={() => openNewWorkOrder()} disabled={!assets.length}><Plus size={16} />New work order</button><select value={workStatusFilter} onChange={(event) => setWorkStatusFilter(event.target.value)}><option value="open">All open work</option><option value="open">Open and active</option><option value="in_progress">In progress</option><option value="awaiting_parts">Awaiting parts</option><option value="verification">Verification</option><option value="closed">Closed</option><option value="all">All work orders</option></select></div>
        {!filteredWorkOrders.length ? <div className="empty"><Wrench size={42} /><h3>No matching work orders</h3><p>Create preventive, corrective, emergency, or inspection work.</p></div> : <div className="table-wrap"><table><thead><tr><th>Work order</th><th>Asset</th><th>Priority / status</th><th>Downtime</th><th>Estimated exposure</th><th>Return to service</th><th>Northstar handoff</th><th className="no-print">Actions</th></tr></thead><tbody>{filteredWorkOrders.map((workOrder) => {
          const releaseComplete = workOrder.maintenanceApproved && workOrder.operationsApproved && (!workOrder.qualityRisk || workOrder.qualityApproved);
          return <tr key={workOrder.id}><td><strong>{workOrder.workOrderNumber}</strong><small>{workOrder.type} · {workOrder.description}</small></td><td><strong>{assetName(workOrder.assetId)}</strong><small>{workOrder.assignedTo || "Unassigned"}</small></td><td><b className={`priority ${workOrder.priority}`}>{priorityMeta[workOrder.priority]}</b><small>{workStatusMeta[workOrder.status]}</small></td><td><strong>{workOrderDowntimeHours(workOrder).toFixed(1)} h</strong><small>{workOrder.downtimeStart ? "Downtime recorded" : "No downtime"}</small></td><td><strong>${Math.round(workOrderCost(workOrder)).toLocaleString()}</strong><small>Capacity + repair cost</small></td><td><b className={`release ${workOrder.status === "closed" && releaseComplete ? "released" : "pending"}`}>{workOrder.status === "closed" && releaseComplete ? "VERIFIED" : "PENDING"}</b></td><td><small>{workOrder.recommendedHandoff}</small></td><td className="row-actions no-print"><button title="Edit work order" onClick={() => editWorkOrder(workOrder)}><Pencil size={15} /></button><button title="History" onClick={() => setHistoryItem({ type: "work_order", item: workOrder })}><History size={15} /></button></td></tr>;
        })}</tbody></table></div>}
      </section>

      <section className="two-grid">
        <article className="panel risk-panel"><div className="panel-title"><div><small>05 · EXECUTIVE EQUIPMENT RISK</small><h2>What can stop the business</h2></div><Gauge size={24} /></div><div className="risk-list">{metrics.operatingAssets.sort((a, b) => criticalityMeta[b.criticality].score - criticalityMeta[a.criticality].score).slice(0, 6).map((asset) => {
          const exposure = workOrders.filter((workOrder) => workOrder.assetId === asset.id && workOrder.status !== "closed").reduce((sum, workOrder) => sum + workOrderCost(workOrder), 0);
          const tone = asset.status === "down" ? "bad" : asset.status === "restricted" || (asset.criticality === "business_critical" && !asset.backupAvailable) ? "warn" : "good";
          return <div key={asset.id}><span className={tone}>{criticalityMeta[asset.criticality].score}</span><span><strong>{asset.assetCode} · {asset.name}</strong><small>{assetStatusMeta[asset.status]} · {asset.backupAvailable ? "Backup available" : "No backup"} · ${Math.round(exposure).toLocaleString()} active exposure</small></span></div>;
        })}</div></article>
        <article className="panel plan-panel"><div className="panel-title"><div><small>06 · LEADERSHIP PRIORITIES</small><h2>Decisions that protect capacity</h2></div><BarChart3 size={24} /></div><div className="priority-list">
          {metrics.criticalDown > 0 && <div><b className="critical">Critical</b><span><strong>Restore critical equipment or authorize alternate capacity</strong><small>{metrics.criticalDown} high-criticality assets are down.</small></span></div>}
          {metrics.overduePm > 0 && <div><b className="high">High</b><span><strong>Recover overdue preventive maintenance</strong><small>{metrics.overduePm} plans are overdue and require owner commitment.</small></span></div>}
          {metrics.singleAssetDependencies > 0 && <div><b className="high">High</b><span><strong>Mitigate single-asset dependencies</strong><small>{metrics.singleAssetDependencies} business-critical assets have no backup.</small></span></div>}
          {metrics.openWorkOrders.filter((workOrder) => workOrder.qualityRisk).length > 0 && <div><b className="medium">Medium</b><span><strong>Complete product-impact reviews</strong><small>Quality-risk work orders should connect to NCR containment.</small></span></div>}
          {!metrics.criticalDown && !metrics.overduePm && !metrics.singleAssetDependencies && <div className="success-state"><CheckCircle2 /><span><strong>Critical asset controls are stable.</strong><small>Continue PM discipline, condition monitoring, and verified return-to-service decisions.</small></span></div>}
        </div></article>
      </section>

      <section className="executive-summary">
        <div><small>PILOT EXECUTIVE INTERPRETATION</small><h2>{metrics.criticalDown || metrics.overduePm ? "Protect capacity before accepting additional operating risk." : "The current asset base can support the operating plan."}</h2><p>{metrics.criticalDown || metrics.overduePm ? `Northstar identified ${metrics.criticalDown} critical assets down, ${metrics.overduePm} overdue PM plans, and approximately $${Math.round(metrics.workOrderCost).toLocaleString()} in active downtime and repair exposure. Leadership should assign owners and recovery dates before relying on additional demand.` : `Estimated uptime is ${metrics.uptime.toFixed(1)}% with ${metrics.pmCompliance}% PM compliance. Maintain verification discipline and address ${metrics.singleAssetDependencies} single-asset dependencies through backup capacity, spares, or replacement planning.`}</p></div>
        <button onClick={submitToNorthstar} disabled={saving}><Send size={18} />Submit controlled reliability record</button>
      </section>

      <p className="disclaimer">Northstar Asset Reliability supports direct asset entry, Excel-compatible import, preventive-maintenance planning, controlled work orders, downtime costing, evidence upload, and human return-to-service approval. Estimates depend on customer-entered operating hours, capacity values, labor rates, and work-order data.</p>

      {assetModal && <div className="modal-backdrop"><div className="modal large-modal"><header><div><small>{assets.some((asset) => asset.id === assetForm.id) ? "EDIT ASSET" : "ADD ASSET"}</small><h2>{assetForm.name || "Create controlled equipment record"}</h2></div><button onClick={() => setAssetModal(false)}><X /></button></header><div className="asset-form"><div className="asset-photo">{assetForm.photoDataUrl ? <img src={assetForm.photoDataUrl} alt="Asset preview" /> : <span><Settings2 size={46} /></span>}<label><ImagePlus size={16} />Optional equipment photo<input type="file" accept="image/*" onChange={handleAssetPhoto} /></label><label><UploadCloud size={16} />Manuals and drawings<input type="file" multiple onChange={handleAssetManuals} /></label><small>{assetForm.manualNames.length ? assetForm.manualNames.join(", ") : "No manuals selected"}</small></div><div className="modal-grid"><label>Asset code / tag<input value={assetForm.assetCode} onChange={(event) => setAssetForm({ ...assetForm, assetCode: event.target.value })} /></label><label>Asset name<input value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} /></label><label>Category<input value={assetForm.category} onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })} /></label><label>Department<input value={assetForm.department} onChange={(event) => setAssetForm({ ...assetForm, department: event.target.value })} /></label><label>Production area / location<input value={assetForm.area} onChange={(event) => setAssetForm({ ...assetForm, area: event.target.value })} /></label><label>Manufacturer<input value={assetForm.manufacturer} onChange={(event) => setAssetForm({ ...assetForm, manufacturer: event.target.value })} /></label><label>Model<input value={assetForm.model} onChange={(event) => setAssetForm({ ...assetForm, model: event.target.value })} /></label><label>Serial number<input value={assetForm.serialNumber} onChange={(event) => setAssetForm({ ...assetForm, serialNumber: event.target.value })} /></label><label>Installation date<input type="date" value={assetForm.installDate} onChange={(event) => setAssetForm({ ...assetForm, installDate: event.target.value })} /></label><label>Asset owner<input value={assetForm.assetOwner} onChange={(event) => setAssetForm({ ...assetForm, assetOwner: event.target.value })} /></label><label>Maintenance owner<input value={assetForm.maintenanceOwner} onChange={(event) => setAssetForm({ ...assetForm, maintenanceOwner: event.target.value })} /></label><label>Criticality<select value={assetForm.criticality} onChange={(event) => setAssetForm({ ...assetForm, criticality: event.target.value })}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="business_critical">Business Critical</option></select></label><label>Operating status<select value={assetForm.status} onChange={(event) => setAssetForm({ ...assetForm, status: event.target.value })}><option value="available">Available</option><option value="restricted">Operating with restrictions</option><option value="down">Down</option><option value="retired">Retired</option></select></label><label>Replacement lead time (days)<input type="number" min="0" value={assetForm.replacementLeadDays} onChange={(event) => setAssetForm({ ...assetForm, replacementLeadDays: event.target.value })} /></label><label>Capacity value / operating hour<input type="number" min="0" value={assetForm.hourlyCapacityValue} onChange={(event) => setAssetForm({ ...assetForm, hourlyCapacityValue: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={assetForm.backupAvailable} onChange={(event) => setAssetForm({ ...assetForm, backupAvailable: event.target.checked })} />Backup or alternate capacity is available</label></div></div><footer><button onClick={() => setAssetModal(false)}>Cancel</button><button className="primary" onClick={saveAsset}><Save size={16} />Save asset</button></footer></div></div>}

      {pmModal && <div className="modal-backdrop"><div className="modal"><header><div><small>PREVENTIVE MAINTENANCE PLAN</small><h2>{assetName(pmAssetId)}</h2></div><button onClick={() => setPmModal(false)}><X /></button></header><div className="modal-body modal-grid"><label className="wide">Plan title<input value={pmForm.title} onChange={(event) => setPmForm({ ...pmForm, title: event.target.value })} /></label><label>Trigger type<select value={pmForm.triggerType} onChange={(event) => setPmForm({ ...pmForm, triggerType: event.target.value, frequencyUnit: event.target.value === "calendar" ? "months" : event.target.value === "runtime" ? "hours" : event.target.value === "cycles" ? "cycles" : "condition" })}><option value="calendar">Calendar</option><option value="runtime">Runtime</option><option value="cycles">Cycles</option><option value="condition">Condition based</option></select></label><label>Frequency value<input type="number" min="0.1" step="0.1" value={pmForm.frequencyValue} onChange={(event) => setPmForm({ ...pmForm, frequencyValue: event.target.value })} /></label><label>Frequency unit<select value={pmForm.frequencyUnit} onChange={(event) => setPmForm({ ...pmForm, frequencyUnit: event.target.value })}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="hours">Runtime hours</option><option value="cycles">Cycles</option><option value="condition">Condition trigger</option></select></label><label>Responsible owner<input value={pmForm.owner} onChange={(event) => setPmForm({ ...pmForm, owner: event.target.value })} /></label><label>Last completed<input type="date" value={pmForm.lastCompleted} onChange={(event) => setPmForm({ ...pmForm, lastCompleted: event.target.value, nextDue: nextDueDate(event.target.value, pmForm.frequencyValue, pmForm.frequencyUnit) || pmForm.nextDue })} /></label><label>Next due<input type="date" value={pmForm.nextDue} onChange={(event) => setPmForm({ ...pmForm, nextDue: event.target.value })} /></label><label>Plan status<select value={pmForm.status} onChange={(event) => setPmForm({ ...pmForm, status: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="wide">Controlled checklist<textarea value={pmForm.checklistText} onChange={(event) => setPmForm({ ...pmForm, checklistText: event.target.value })} placeholder="One observable maintenance requirement per line" /></label></div><footer><button onClick={() => setPmModal(false)}>Cancel</button><button className="primary" onClick={savePmPlan}><Save size={16} />Save PM plan</button></footer></div></div>}

      {workOrderModal && <div className="modal-backdrop"><div className="modal work-modal"><header><div><small>CONTROLLED WORK ORDER</small><h2>{workOrderForm.workOrderNumber}</h2></div><button onClick={() => setWorkOrderModal(false)}><X /></button></header><div className="modal-body"><div className="wo-grid"><label>Asset<select value={workOrderForm.assetId} onChange={(event) => setWorkOrderForm({ ...workOrderForm, assetId: event.target.value })}><option value="">Select asset</option>{assets.filter((asset) => asset.status !== "retired").map((asset) => <option key={asset.id} value={asset.id}>{asset.assetCode} · {asset.name}</option>)}</select></label><label>Work type<select value={workOrderForm.type} onChange={(event) => setWorkOrderForm({ ...workOrderForm, type: event.target.value })}><option value="preventive">Preventive</option><option value="corrective">Corrective</option><option value="emergency">Emergency</option><option value="inspection">Inspection</option></select></label><label>Priority<select value={workOrderForm.priority} onChange={(event) => setWorkOrderForm({ ...workOrderForm, priority: event.target.value })}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label><label>Status<select value={workOrderForm.status} onChange={(event) => setWorkOrderForm({ ...workOrderForm, status: event.target.value })}><option value="open">Open</option><option value="in_progress">In progress</option><option value="awaiting_parts">Awaiting parts</option><option value="verification">Verification</option><option value="closed">Closed</option></select></label><label>Reported by<input value={workOrderForm.reportedBy} onChange={(event) => setWorkOrderForm({ ...workOrderForm, reportedBy: event.target.value })} /></label><label>Assigned technician / owner<input value={workOrderForm.assignedTo} onChange={(event) => setWorkOrderForm({ ...workOrderForm, assignedTo: event.target.value })} /></label><label>Opened at<input type="datetime-local" value={workOrderForm.openedAt} onChange={(event) => setWorkOrderForm({ ...workOrderForm, openedAt: event.target.value })} /></label><label>Estimated return<input type="datetime-local" value={workOrderForm.estimatedReturn} onChange={(event) => setWorkOrderForm({ ...workOrderForm, estimatedReturn: event.target.value })} /></label><label className="wide">Problem description<textarea value={workOrderForm.description} onChange={(event) => setWorkOrderForm({ ...workOrderForm, description: event.target.value })} /></label><label className="wide">Failure mode / condition observed<textarea value={workOrderForm.failureMode} onChange={(event) => setWorkOrderForm({ ...workOrderForm, failureMode: event.target.value })} /></label><label className="wide">Production and delivery impact<textarea value={workOrderForm.productionImpact} onChange={(event) => setWorkOrderForm({ ...workOrderForm, productionImpact: event.target.value })} /></label><label>Customer orders at risk<input value={workOrderForm.customerOrders} onChange={(event) => setWorkOrderForm({ ...workOrderForm, customerOrders: event.target.value })} /></label><label>Quantity at risk<input type="number" min="0" value={workOrderForm.quantityAtRisk} onChange={(event) => setWorkOrderForm({ ...workOrderForm, quantityAtRisk: event.target.value })} /></label><label className="check-label"><input type="checkbox" checked={workOrderForm.safetyRisk} onChange={(event) => setWorkOrderForm({ ...workOrderForm, safetyRisk: event.target.checked })} />Safety risk exists</label><label className="check-label"><input type="checkbox" checked={workOrderForm.qualityRisk} onChange={(event) => setWorkOrderForm({ ...workOrderForm, qualityRisk: event.target.checked })} />Product or quality risk exists</label></div>
        <section className="modal-section"><div className="section-heading"><div><small>DOWNTIME & COST CONTROL</small><h3>Measure the business interruption</h3></div><div className="timer-actions"><button onClick={startDowntime}><Play size={15} />Start downtime</button><button onClick={stopDowntime}><Square size={15} />Stop downtime</button></div></div><div className="wo-grid"><label>Downtime start<input type="datetime-local" value={workOrderForm.downtimeStart} onChange={(event) => setWorkOrderForm({ ...workOrderForm, downtimeStart: event.target.value })} /></label><label>Downtime end<input type="datetime-local" value={workOrderForm.downtimeEnd} onChange={(event) => setWorkOrderForm({ ...workOrderForm, downtimeEnd: event.target.value })} /></label><label>Downtime hours<input type="number" min="0" step="0.1" value={workOrderForm.downtimeHours} onChange={(event) => setWorkOrderForm({ ...workOrderForm, downtimeHours: event.target.value })} /></label><label>Labor hours<input type="number" min="0" step="0.1" value={workOrderForm.laborHours} onChange={(event) => setWorkOrderForm({ ...workOrderForm, laborHours: event.target.value })} /></label><label>Parts cost<input type="number" min="0" value={workOrderForm.partsCost} onChange={(event) => setWorkOrderForm({ ...workOrderForm, partsCost: event.target.value })} /></label><label>External / vendor cost<input type="number" min="0" value={workOrderForm.externalCost} onChange={(event) => setWorkOrderForm({ ...workOrderForm, externalCost: event.target.value })} /></label><div className="cost-card"><small>Estimated event exposure</small><strong>${Math.round(workOrderCost(workOrderForm)).toLocaleString()}</strong></div></div></section>
        <section className="modal-section"><div className="section-heading"><div><small>REPAIR & RETURN TO SERVICE</small><h3>Do not mark equipment fixed without proof</h3></div><ShieldCheck size={22} /></div><div className="wo-grid"><label className="wide">Repair action performed<textarea value={workOrderForm.repairAction} onChange={(event) => setWorkOrderForm({ ...workOrderForm, repairAction: event.target.value })} /></label><label className="wide">Root cause / failure analysis<textarea value={workOrderForm.rootCause} onChange={(event) => setWorkOrderForm({ ...workOrderForm, rootCause: event.target.value })} /></label><label className="wide">Trial run, safety, quality, and first-piece verification<textarea value={workOrderForm.verification} onChange={(event) => setWorkOrderForm({ ...workOrderForm, verification: event.target.value })} /></label><label className="approval"><input type="checkbox" checked={workOrderForm.maintenanceApproved} onChange={(event) => setWorkOrderForm({ ...workOrderForm, maintenanceApproved: event.target.checked })} /><BadgeCheck size={17} /><span><strong>Maintenance approval</strong><small>Repair complete and technically acceptable</small></span></label><label className="approval"><input type="checkbox" checked={workOrderForm.operationsApproved} onChange={(event) => setWorkOrderForm({ ...workOrderForm, operationsApproved: event.target.checked })} /><BadgeCheck size={17} /><span><strong>Operations approval</strong><small>Capacity and operating controls verified</small></span></label><label className="approval"><input type="checkbox" checked={workOrderForm.qualityApproved} onChange={(event) => setWorkOrderForm({ ...workOrderForm, qualityApproved: event.target.checked })} /><BadgeCheck size={17} /><span><strong>Quality approval</strong><small>Required when product impact exists</small></span></label><label className="wide evidence"><UploadCloud size={20} /><span><strong>Attach evidence</strong><small>{workOrderForm.evidenceNames.length ? workOrderForm.evidenceNames.join(", ") : "Photos, repair reports, invoices, test results, or videos"}</small></span><input type="file" multiple onChange={handleWorkOrderEvidence} /></label><label className="wide">Recommended Northstar handoff<input value={recommendedHandoff(workOrderForm)} readOnly /></label></div></section>
        </div><footer><button onClick={() => setWorkOrderModal(false)}>Cancel</button><button className="primary" onClick={saveWorkOrder}><Save size={16} />Save controlled work order</button></footer></div></div>}

      {importModal && <div className="modal-backdrop"><div className="modal"><header><div><small>EXCEL / CSV ASSET IMPORT</small><h2>Bring the existing asset list into Northstar</h2></div><button onClick={() => setImportModal(false)}><X /></button></header><div className="import-content"><p>Upload a CSV exported from Excel, or copy rows from Excel and paste them below. Existing asset codes are updated; new asset codes are added.</p><div className="import-grid"><label className="dropzone"><FileSpreadsheet size={30} /><strong>Choose CSV file</strong><small>Excel: Save As → CSV UTF-8</small><input type="file" accept=".csv,.txt,text/csv" onChange={readImportFile} /></label><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="assetCode,name,category,department,area,manufacturer,model,serialNumber..." /></div></div><footer><button onClick={downloadTemplate}><FileDown size={16} />Download template</button><button onClick={() => setImportModal(false)}>Cancel</button><button className="primary" onClick={importAssets}><Upload size={16} />Import assets</button></footer></div></div>}

      {historyItem && <div className="modal-backdrop"><div className="modal"><header><div><small>CONTROLLED HISTORY</small><h2>{historyItem.type === "asset" ? historyItem.item.name : historyItem.item.workOrderNumber}</h2></div><button onClick={() => setHistoryItem(null)}><X /></button></header><div className="history-list">{historyItem.item.history?.length ? historyItem.item.history.map((event) => <article key={event.id}><span><History size={16} /></span><div><strong>{event.type}</strong><p>{event.detail}</p><small>{new Date(event.date).toLocaleString()} · {event.actor}</small></div></article>) : <div className="empty"><History size={36} /><h3>No history recorded yet</h3></div>}</div><footer><button className="primary" onClick={() => setHistoryItem(null)}>Done</button></footer></div></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#12253a;font-family:Inter,Arial,sans-serif}.ar-shell{min-height:100vh;padding-bottom:70px}.ar-header{min-height:74px;display:flex;align-items:center;gap:14px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#061729,#0b3158);border-bottom:1px solid #24547d}.back{width:38px;height:38px;display:grid;place-items:center;border:1px solid #365c7d;border-radius:11px;color:#fff}.qms-lockup{width:172px;padding:8px 10px;border-radius:12px;background:#fff}.qms-lockup img,.northstar-lockup img{display:block;width:100%;height:auto}.northstar-lockup{width:230px;padding:5px 9px;border:1px solid #314d67;border-radius:10px;background:#050b12}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#8fb5d6;text-transform:uppercase;letter-spacing:.1em}.header-status{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #2b6d5a;border-radius:999px;color:#c9f3e5;background:#0d3a31;font-size:11px;font-weight:800}.header-status span{width:8px;height:8px;border-radius:50%;background:#45d39d}.hero{max-width:1540px;margin:0 auto;display:grid;grid-template-columns:1.45fr .55fr;gap:18px;padding:28px 24px}.hero-copy{padding:32px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{display:flex;align-items:center;gap:8px;color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:14px 0 12px;font-size:clamp(34px,4vw,62px);line-height:1.02}.hero p{max-width:900px;color:#d4e7f7;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:7px 10px;border:1px solid #5f9fd3;border-radius:999px;color:#d9ecfb;font-size:10px;font-weight:800}.reliability-card{display:grid;place-items:center;padding:24px;border:1px solid #dce6ef;border-radius:24px;background:#fff;box-shadow:0 16px 38px rgba(24,55,83,.1);text-align:center}.reliability-card>small{color:#71869a;font-weight:900;letter-spacing:.12em}.reliability-card>strong{font-size:52px}.reliability-card>span{color:#16835a;font-weight:800}.ring{width:150px;height:150px;display:grid;place-items:center;margin-top:12px;border-radius:50%}.ring div{width:112px;height:112px;display:grid;place-items:center;border-radius:50%;background:#fff;font-size:34px;font-weight:900}.toolbar{max-width:1540px;margin:0 auto;padding:0 24px;display:flex;gap:9px;flex-wrap:wrap}.toolbar button,.section-actions button,.modal button,.executive-summary button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid #cddbe7;border-radius:11px;color:#21405d;background:#fff;font-weight:850;cursor:pointer}.toolbar button.submit,.primary,.executive-summary button{border-color:#0a66ff!important;color:#fff!important;background:linear-gradient(135deg,#0d315c,#0a66ff)!important}.toolbar button.submit{margin-left:auto}button:disabled{opacity:.55;cursor:not-allowed}.notice{max-width:1492px;margin:14px auto 0;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid #e7c66c;border-radius:12px;color:#765408;background:#fff9e8;font-weight:800}.notice.submitted{border-color:#8fd0b3;color:#155f45;background:#effbf6}.metrics{max-width:1540px;margin:18px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.metrics article{padding:17px;border:1px solid #dce6ef;border-radius:17px;background:#fff}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70859a;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.metrics strong{margin-top:6px;font-size:27px}.metrics span{margin-top:3px;color:#16835a;font-size:11px;font-weight:800}.record-id{font-size:15px!important}.panel{max-width:1492px;margin:18px auto 0;padding:22px;border:1px solid #dce6ef;border-radius:20px;background:#fff;box-shadow:0 12px 32px rgba(24,55,83,.07)}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:1px solid #e2eaf1}.panel-title small{color:#71869a;font-weight:900;letter-spacing:.1em}.panel-title h2{margin:5px 0 0}.panel-title p{margin:6px 0 0;color:#6d8194;font-size:12px}.form-grid,.modal-grid,.wo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:18px}.form-grid label,.modal-grid label,.wo-grid label{display:grid;gap:6px;color:#526a80;font-size:11px;font-weight:850}.form-grid input,.form-grid select,.form-grid textarea,.modal-grid input,.modal-grid select,.modal-grid textarea,.wo-grid input,.wo-grid select,.wo-grid textarea,.filters input,.filters select,.section-actions select{width:100%;min-height:42px;padding:10px;border:1px solid #cad9e6;border-radius:10px;color:#12253a;background:#fbfdff;font:inherit}.form-grid textarea,.modal-grid textarea,.wo-grid textarea{min-height:78px;resize:vertical}.wide{grid-column:1/-1}.section-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.section-actions select{width:auto;min-width:190px}.filters{display:grid;grid-template-columns:1fr 220px 190px;gap:10px;margin-top:14px}.table-wrap{overflow:auto;margin-top:16px;border:1px solid #dce6ef;border-radius:14px}table{width:100%;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #e1e9f0;text-align:left;vertical-align:middle}th{background:#f2f7fb;color:#526a80;font-size:10px;text-transform:uppercase;letter-spacing:.05em}td small,td strong{display:block}td small{margin-top:3px;color:#71869a}.asset-cell{display:flex;align-items:center;gap:10px;min-width:250px}.asset-cell>span,.asset-cell>img{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:#0a66ff;color:#fff;object-fit:cover}.criticality,.status,.priority,.pm-status,.release{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:9px}.criticality.low{color:#53677d;background:#eef2f5}.criticality.moderate{color:#845d00;background:#fff5dc}.criticality.high{color:#9c2031;background:#ffecef}.criticality.business_critical{color:#fff;background:#9c2031}.status.available{color:#146145;background:#e9f8f1}.status.restricted{color:#845d00;background:#fff5dc}.status.down{color:#9c2031;background:#ffecef}.status.retired{color:#697785;background:#edf1f4}.priority.low{color:#53677d;background:#eef2f5}.priority.moderate{color:#845d00;background:#fff5dc}.priority.high{color:#9c2031;background:#ffecef}.priority.critical{color:#fff;background:#9c2031}.pm-status.current,.release.released{color:#146145;background:#e9f8f1}.pm-status.overdue,.release.pending{color:#9c2031;background:#ffecef}.row-actions{display:flex;gap:5px;min-width:275px}.row-actions button{width:33px;height:33px;display:grid;place-items:center;border:1px solid #d6e1ea;border-radius:9px;background:#fff;color:#31516e;cursor:pointer}.row-actions button.danger{color:#a43848}.text-bad{color:#a43848!important}.text-good{color:#16835a!important}.empty{padding:42px;text-align:center;color:#6c8296}.two-grid{max-width:1492px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:18px}.two-grid .panel{margin-top:18px}.risk-list,.priority-list{display:grid;margin-top:14px}.risk-list>div,.priority-list>div{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #e2eaf1}.risk-list>div>span:first-child{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;color:#fff;font-weight:900}.risk-list strong,.risk-list small,.priority-list strong,.priority-list small{display:block}.risk-list small,.priority-list small{margin-top:3px;color:#71869a}.good{background:#16835a}.warn{background:#b87b19}.bad{background:#a83e4d}.priority-list b{min-width:62px;padding:6px 8px;border-radius:999px;text-align:center;font-size:9px}.priority-list .critical{color:#fff;background:#9c2031}.priority-list .high{color:#8a5b00;background:#fff4dc}.priority-list .medium{color:#275d89;background:#e9f4ff}.success-state svg{color:#16835a}.executive-summary{max-width:1492px;margin:18px auto 0;display:flex;align-items:center;gap:20px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.executive-summary>div{margin-right:auto}.executive-summary small{color:#8fc9f7;font-weight:900;letter-spacing:.1em}.executive-summary h2{margin:6px 0}.executive-summary p{max-width:950px;margin:0;color:#d2e6f5;line-height:1.55}.disclaimer{max-width:1492px;margin:18px auto 0;color:#6b7f91;font-size:10px;line-height:1.5}.modal-backdrop{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:18px;background:rgba(3,15,28,.82);backdrop-filter:blur(9px)}.modal{width:min(900px,100%);max-height:92vh;overflow:auto;border:1px solid #345b7c;border-radius:22px;background:#f8fbfe;box-shadow:0 30px 90px rgba(0,0,0,.45)}.large-modal,.work-modal{width:min(1120px,100%)}.modal header,.modal footer{display:flex;align-items:center;gap:12px;padding:16px 18px}.modal header{position:sticky;top:0;z-index:3;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.modal header>div{margin-right:auto}.modal header small{color:#9ecbf1;font-weight:900;letter-spacing:.1em}.modal header h2{margin:4px 0 0}.modal header button{width:38px;padding:0;color:#fff;background:#123a60;border-color:#476a88}.modal footer{position:sticky;bottom:0;justify-content:flex-end;border-top:1px solid #dbe6ee;background:#fff}.modal-body,.import-content{padding:20px}.asset-form{display:grid;grid-template-columns:210px 1fr;gap:18px;padding:22px}.asset-photo{display:grid;align-content:start;gap:11px}.asset-photo>span,.asset-photo>img{width:180px;height:145px;display:grid;place-items:center;border-radius:20px;background:linear-gradient(135deg,#0d315c,#0a66ff);color:#fff;object-fit:cover}.asset-photo label{display:flex;align-items:center;gap:7px;padding:10px;border:1px dashed #78abd5;border-radius:10px;color:#245475;background:#eef7ff;font-size:11px;font-weight:850;cursor:pointer}.asset-photo input,.dropzone input{display:none}.asset-photo small{color:#71869a;line-height:1.4}.check-label{display:flex!important;align-items:center!important;grid-template-columns:auto 1fr!important;gap:9px!important;padding:12px;border:1px solid #d8e4ed;border-radius:11px;background:#f7fbfe}.check-label input{width:auto!important;min-height:auto!important}.modal-section{margin-top:18px;padding-top:18px;border-top:1px solid #dce6ef}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.section-heading small{color:#71869a;font-weight:900;letter-spacing:.1em}.section-heading h3{margin:4px 0 0}.timer-actions{display:flex;gap:7px}.timer-actions button{min-height:36px}.cost-card{display:grid;align-content:center;padding:12px;border-radius:12px;color:#fff;background:linear-gradient(135deg,#0d315c,#0a66ff)}.cost-card small,.cost-card strong{display:block}.cost-card strong{margin-top:4px;font-size:23px}.approval{display:flex!important;grid-template-columns:auto auto 1fr!important;align-items:center!important;gap:9px!important;padding:12px;border:1px solid #cfe0eb;border-radius:12px;background:#fff}.approval input{width:auto!important;min-height:auto!important}.approval span strong,.approval span small{display:block}.approval span small{color:#71869a}.evidence{display:flex!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;padding:15px;border:1px dashed #7db2df!important;border-radius:13px;background:#f2f8fd;cursor:pointer}.evidence span strong,.evidence span small{display:block}.evidence input{max-width:260px}.import-content p{color:#60768b}.import-grid{display:grid;grid-template-columns:240px 1fr;gap:16px}.dropzone{min-height:190px;display:grid;place-items:center;align-content:center;gap:7px;padding:18px;border:2px dashed #79acd6;border-radius:16px;color:#285a80;background:#eef7ff;text-align:center;cursor:pointer}.import-grid textarea{min-height:230px;padding:12px;border:1px solid #cbdbe8;border-radius:14px;font:12px ui-monospace,monospace}.history-list{display:grid;padding:18px}.history-list article{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #dfe8ef}.history-list article>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#0a66ff;background:#eaf4ff}.history-list p{margin:4px 0;color:#51687d}.history-list small{color:#8192a1}@media(max-width:1100px){.hero,.two-grid{grid-template-columns:1fr}.form-grid,.modal-grid,.wo-grid{grid-template-columns:1fr 1fr}.ar-header{flex-wrap:wrap}.header-meta{order:5;width:100%}.filters{grid-template-columns:1fr}.asset-form,.import-grid{grid-template-columns:1fr}.asset-photo{justify-items:center}.executive-summary{align-items:flex-start;flex-direction:column}}@media(max-width:680px){.hero{padding:18px 12px}.toolbar,.metrics{padding-left:12px;padding-right:12px}.panel,.notice,.executive-summary,.disclaimer{margin-left:12px;margin-right:12px}.form-grid,.modal-grid,.wo-grid{grid-template-columns:1fr}.qms-lockup{width:125px}.northstar-lockup{width:165px}.header-status{display:none}.hero-copy{padding:23px}.hero h1{font-size:36px}.two-grid{display:block}.toolbar button.submit{margin-left:0}.executive-summary button{width:100%}.row-actions{min-width:275px}.evidence{grid-template-columns:1fr!important}}@media print{body{background:#fff}.no-print,.back,.header-status,.modal-backdrop{display:none!important}.panel,.reliability-card,.metrics article{box-shadow:none}.table-wrap{overflow:visible}table{font-size:8px}.disclaimer{display:block}}
      `}</style>
    </main>
  );
}
