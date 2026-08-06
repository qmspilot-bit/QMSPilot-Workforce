"use client";

import { AlertTriangle, CheckCircle2, Cloud, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RECORDS_KEY = "qmspilot:northstar:smart-branch-records";
const TOOL_IDS = ["01.01", "02.01", "03.01", "04.01", "05.01", "06.01", "07.01", "08.01"] as const;
const draftKey = (toolId: string) => `qmspilot:smart-branch:draft:${toolId}`;

type BranchRecord = Record<string, unknown>;
type SyncState = "checking" | "ready" | "syncing" | "success" | "empty" | "signed-out" | "error";

function parseObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readRecords(): BranchRecord[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECORDS_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is BranchRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)))
      : [];
  } catch {
    return [];
  }
}

function recordId(record: BranchRecord) {
  return String(record.recordId || "").trim();
}

function submittedAt(record: BranchRecord) {
  return String(record.submittedAt || "");
}

function mergeRecords(remote: BranchRecord[], local: BranchRecord[]) {
  const merged = new Map<string, BranchRecord>();
  for (const item of remote) {
    const id = recordId(item);
    if (id) merged.set(id, item);
  }
  for (const item of local) {
    const id = recordId(item);
    if (id) merged.set(id, item);
  }
  return Array.from(merged.values()).sort((a, b) => submittedAt(b).localeCompare(submittedAt(a)));
}

function notifyDashboards() {
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("qmspilot:smart-branch-record-submitted"));
}

export default function SmartBranchCloudControl() {
  const [state, setState] = useState<SyncState>("checking");
  const [message, setMessage] = useState("Checking Northstar Secure…");

  const syncNow = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setState("error");
      setMessage("Northstar Secure is not configured.");
      return;
    }

    setState("syncing");
    setMessage("Synchronizing Smart Branch…");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setState("signed-out");
        setMessage("Sign in to Northstar before syncing Smart Branch.");
        return;
      }

      const db = supabase as any;
      const userId = userData.user.id;
      const { data: membership, error: membershipError } = await db
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership?.organization_id) throw new Error("No Northstar organization is assigned to this account.");
      const organizationId = membership.organization_id as string;

      const [recordResult, draftResult] = await Promise.all([
        db.from("smart_branch_records").select("payload").eq("organization_id", organizationId),
        db.from("smart_branch_drafts").select("tool_id,payload").eq("organization_id", organizationId).eq("created_by", userId),
      ]);
      if (recordResult.error) throw recordResult.error;
      if (draftResult.error) throw draftResult.error;

      const remoteRecords = (recordResult.data || [])
        .map((row: { payload?: unknown }) => row.payload)
        .filter((item: unknown): item is BranchRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
      const localRecords = readRecords();
      const mergedRecords = mergeRecords(remoteRecords, localRecords);

      if (mergedRecords.length) {
        const rows = mergedRecords.map(record => ({
          organization_id: organizationId,
          record_id: recordId(record),
          tool_id: String(record.toolId || ""),
          tool_name: String(record.toolName || ""),
          title: String(record.title || ""),
          customer: String(record.customer || ""),
          owner_name: String(record.owner || ""),
          due_date: record.dueDate ? String(record.dueDate) : null,
          priority: String(record.priority || "Medium"),
          status: String(record.status || "Open"),
          payload: record,
          created_by: userId,
          submitted_at: submittedAt(record) || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        const { error } = await db.from("smart_branch_records").upsert(rows, { onConflict: "organization_id,record_id" });
        if (error) throw error;
        window.localStorage.setItem(RECORDS_KEY, JSON.stringify(mergedRecords));
      }

      const remoteDrafts = new Map<string, BranchRecord>(
        (draftResult.data || [])
          .filter((row: { tool_id?: string; payload?: unknown }) => row.tool_id && row.payload && typeof row.payload === "object")
          .map((row: { tool_id: string; payload: BranchRecord }) => [row.tool_id, row.payload]),
      );
      let localDraftCount = 0;
      let restoredDraftCount = 0;
      for (const toolId of TOOL_IDS) {
        const localDraft = parseObject(window.localStorage.getItem(draftKey(toolId)));
        const remoteDraft = remoteDrafts.get(toolId) || null;
        if (localDraft) {
          localDraftCount += 1;
          const { error } = await db.from("smart_branch_drafts").upsert({
            organization_id: organizationId,
            created_by: userId,
            tool_id: toolId,
            payload: localDraft,
            updated_at: new Date().toISOString(),
          }, { onConflict: "organization_id,created_by,tool_id" });
          if (error) throw error;
        } else if (remoteDraft) {
          restoredDraftCount += 1;
          window.localStorage.setItem(draftKey(toolId), JSON.stringify(remoteDraft));
        }
      }

      notifyDashboards();
      const recordCount = mergedRecords.length;
      const draftCount = Math.max(localDraftCount, remoteDrafts.size, restoredDraftCount);
      if (!recordCount && !draftCount) {
        setState("empty");
        setMessage("No Smart Branch records or drafts were found on this device or in Northstar Secure.");
      } else {
        setState("success");
        setMessage(`${recordCount} dashboard record${recordCount === 1 ? "" : "s"} and ${draftCount} draft${draftCount === 1 ? "" : "s"} synchronized.`);
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Smart Branch synchronization failed.");
    }
  }, []);

  useEffect(() => {
    void syncNow();
    const afterSave = () => window.setTimeout(() => void syncNow(), 100);
    window.addEventListener("qmspilot:smart-branch-record-submitted", afterSave);
    return () => window.removeEventListener("qmspilot:smart-branch-record-submitted", afterSave);
  }, [syncNow]);

  const Icon = state === "success" ? CheckCircle2 : state === "error" || state === "signed-out" ? AlertTriangle : Cloud;
  return (
    <aside className={`smart-branch-cloud-control ${state}`} aria-live="polite">
      <div><Icon size={18} /><span><small>SMART BRANCH CLOUD</small><strong>{message}</strong></span></div>
      <button type="button" onClick={() => void syncNow()} disabled={state === "syncing"}>
        <RefreshCw size={15} className={state === "syncing" ? "spin" : ""} />
        {state === "syncing" ? "Syncing…" : "Sync Smart Branch now"}
      </button>
      <style>{`
        .smart-branch-cloud-control{position:fixed;right:14px;bottom:72px;z-index:490;width:min(430px,calc(100vw - 28px));padding:12px;border:1px solid #9fc5e5;border-radius:14px;background:rgba(246,251,255,.98);box-shadow:0 18px 48px rgba(12,53,88,.25);font-family:Inter,Arial,sans-serif}.smart-branch-cloud-control>div{display:flex;align-items:center;gap:9px;color:#174d78}.smart-branch-cloud-control span{min-width:0}.smart-branch-cloud-control small,.smart-branch-cloud-control strong{display:block}.smart-branch-cloud-control small{font-size:8px;font-weight:950;letter-spacing:.12em}.smart-branch-cloud-control strong{margin-top:3px;font-size:10px;line-height:1.35}.smart-branch-cloud-control button{width:100%;min-height:38px;display:flex;align-items:center;justify-content:center;gap:7px;margin-top:9px;border:0;border-radius:9px;color:#fff;background:#0a66ff;font-size:9px;font-weight:900;cursor:pointer}.smart-branch-cloud-control button:disabled{opacity:.65}.smart-branch-cloud-control.success{border-color:#8bc7aa;background:rgba(241,255,248,.98)}.smart-branch-cloud-control.success>div{color:#176747}.smart-branch-cloud-control.error,.smart-branch-cloud-control.signed-out{border-color:#e2a2aa;background:rgba(255,246,247,.98)}.smart-branch-cloud-control.error>div,.smart-branch-cloud-control.signed-out>div{color:#8f2936}.smart-branch-cloud-control.empty{border-color:#e2bf78;background:rgba(255,251,240,.98)}.smart-branch-cloud-control.empty>div{color:#80540c}.spin{animation:smartBranchSpin 1s linear infinite}@keyframes smartBranchSpin{to{transform:rotate(360deg)}}@media(max-width:700px){.smart-branch-cloud-control{right:10px;bottom:76px;width:calc(100vw - 20px)}}
      `}</style>
    </aside>
  );
}
