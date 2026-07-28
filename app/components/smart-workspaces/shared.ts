import {
  AlertTriangle, BarChart3, Barcode, BookOpenCheck, Boxes, Camera, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, FileSearch, FileText, Forklift, Gauge,
  GraduationCap, HardHat, History, ListChecks, LocateFixed, MapPin, Mic,
  Microscope, PackageCheck, PackageOpen, PackageSearch, RefreshCw, Scale,
  ScanLine, Search, Settings, ShieldAlert, ShieldCheck, Target, Truck, Users,
  Warehouse, Wrench, type LucideIcon,
} from "lucide-react";
import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";

export type EvidenceKind = "photo" | "document" | "video" | "audio" | "signature" | "vision" | "location" | "scan";
export type Evidence = { id: string; name: string; kind: EvidenceKind; size: number; url?: string; note?: string };
export type ScanResult = { raw: string; fields: Record<string, string> };
export type RecordMeta = { organization: string; site: string; recordId: string; eventDate: string };
export type SubmissionRecord = {
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

export const iconMap: Record<string, LucideIcon> = {
  AlertTriangle, BarChart3, Barcode, BookOpenCheck, Boxes, Camera, CheckCircle2,
  ClipboardCheck, Clock3, FileCheck2, FileSearch, FileText, Forklift, Gauge,
  GraduationCap, HardHat, History, ListChecks, LocateFixed, MapPin, Mic,
  Microscope, PackageCheck, PackageOpen, PackageSearch, RefreshCw, Scale,
  ScanLine, Search, Settings, ShieldAlert, ShieldCheck, Target, Truck, Users,
  Warehouse, Wrench,
};

export const bytes = (value: number) => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1048576).toFixed(1)} MB`;
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const today = () => new Date().toISOString().slice(0, 10);

export function makeRecordId(config: WorkspaceConfig, tool: WorkflowTool) {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${config.discipline.slice(0, 3).toUpperCase()}-${tool.id.slice(0, 4).toUpperCase()}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function visible(field: FieldDef, values: Record<string, string>) {
  if (!field.showWhen) return true;
  const actual = values[field.showWhen.field] ?? "";
  const expected = Array.isArray(field.showWhen.equals) ? field.showWhen.equals : [field.showWhen.equals];
  return expected.includes(actual);
}

export function otherSelected(value: string) {
  return value === "Other / customer-defined" || value === "Other controlled work";
}
