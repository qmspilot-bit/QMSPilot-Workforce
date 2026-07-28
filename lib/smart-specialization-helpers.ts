import type { FieldDef, WorkflowTool, WorkspaceConfig } from "@/lib/smart-workflow-config";

export type SpecializedFieldType = FieldDef["type"] | "time" | "datetime-local";
export type SpecializedField = Omit<FieldDef, "type"> & { type: SpecializedFieldType };
export type ToolProfile = Partial<Omit<WorkflowTool, "fields">> & { fields: SpecializedField[] };
export type ToolProfiles = Record<string, ToolProfile>;

export const YES_NO = ["No", "Yes"];
export const YES_NO_NA = ["No", "Yes", "Not applicable"];
export const RISK = ["Low", "Moderate", "High", "Critical"];
export const STATUS = ["Not started", "In progress", "At risk", "Blocked", "Complete", "On hold"];
export const RESULT = ["Pass", "Fail", "Conditional", "Not applicable", "Unable to verify"];
export const PRIORITY = ["Routine", "Normal", "High", "Critical"];

export const F = (
  key: string,
  label: string,
  type: SpecializedFieldType,
  section: SpecializedField["section"],
  required = false,
  options?: string[],
  help?: string,
  showWhen?: SpecializedField["showWhen"],
): SpecializedField => ({ key, label, type, section, required, options, help, showWhen });

export const procedure = (id: string, title: string, owner: string, standards: string[]) => ({
  id,
  title,
  revision: "Baseline Rev B",
  owner,
  standards,
});

export const escalation = (when: string, route: string) => ({ when, route });

export function specializeWorkspace(
  base: WorkspaceConfig,
  profiles: ToolProfiles,
  description: string,
  tag = base.tag,
): WorkspaceConfig {
  return {
    ...base,
    tag,
    description,
    tools: base.tools.map(tool => {
      const profile = profiles[tool.id];
      if (!profile) throw new Error(`Missing specialized workflow profile for ${base.discipline}:${tool.id}`);
      return { ...tool, ...profile, fields: profile.fields as FieldDef[] };
    }),
  };
}

export const commonContext = (subjectLabel: string): SpecializedField[] => [
  F("area", "Department / process / area", "text", "Record Context", true),
  F("subject", subjectLabel, "text", "Record Context", true),
  F("reference", "Related order, asset, lot, serial, PO, shipment, or record", "text", "Record Context"),
];
