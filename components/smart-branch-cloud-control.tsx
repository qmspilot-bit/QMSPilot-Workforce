"use client";

import { AlertTriangle, CheckCircle2, Cloud, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RECORDS_KEY = "qmspilot:northstar:smart-branch-records";
const TOOL_IDS = ["01.01", "02.01", "03.01", "04.01", "05.01", "06.01", "07.01", "08.01"] as const;
const draftKey = (toolId: string) => `qmspilot:smart-branch:draft:${toolId}`;

type BranchRecord = Record<string, unknown>;
type SyncState = "checking" | "ready" | "syncing" | "success" | "empty" | "signed-out" | "error";

function parseObject(value: string | null): BranchRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as BranchRecord : null;
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

function readDrafts() {
  return TOOL_IDS
    .map(toolId => ({ toolId, payload: parseObject(window.localStorage.getItem(draftKey(toolId))) }))
    .filter((item): item is { toolId: typeof TOOL_IDS[number]; payload: BranchRecord } => Boolean(item.payload));
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

function refreshLocalDashboards() {
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("qmspilot:smart-branch-cloud-refreshed"));
}

export default function SmartBranchCloudControl() {
  const [state, setState] = useState<SyncState>("checking");
  const [message, setMessage] = useState("Checking this device…");
  const running = useRef(false);

  useEffect(() => {
    let active = true;

    async function inspect() {
      const supabase = createClient();
      if (!supabase) {
        if (active) {
          setState("error");
          setMessage("Northstar Secure is not configured.");
        }
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        setState("signed-out");
        setMessage("Sign in to Northstar before syncing Smart Branch.");
        return;
      }

      const localRecordCount = readRecords().length;
      const localDraftCount = readDrafts().length;
      setState(localRecordCount || localDraftCount ? "ready" : "empty");
      setMessage(
        localRecordCount || localDraftCount
          ? `This device has ${localRecordCount} dashboard record${localRecordCount === 1 ? "" : "s"} and ${localDraftCount} draft${localDraftCount === 1 ? "" : "s"} ready to sync.`
          : "No Smart Branch records or drafts are stored on this device."
      );
    }

    void inspect();
    return () => { active = false; };
  }, []);

  const syncNow = useCallback(async () => {
    if (running.current) return;
    running.current = true;

    const supabase = createClient();
    if (!supabase) {
      setState("error");
      setMessage("Northstar Secure is not configured.");
      running.current = false;
      return;
    }

    setState("syncing");
    setMessage("Synchronizing Smart Branch once…");

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

      const localRecords = readRecords();
      const localDrafts = readDrafts();

      if (localRecords.length) {
        const rows = localRecords
          .filter(record => Boolean(recordId(record)))
          .map(record => ({
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

        if (rows.length) {
          const { error } = await db
            .from("smart_branch_records")
            .upsert(rows, { onConflict: "organization_id,record_id" });
          if (error) throw error;
        }
      }

      for (const draft of localDrafts) {
        const { error } = await db.from("smart_branch_drafts").upsert({
          organization_id: organizationId,
          created_by: userId,
          tool_id: draft.toolId,
          payload: draft.payload,
          updated_at: new Date().toISOString(),
        }, { onConflict: "organization_id,created_by,tool_id" });
        if (error) throw error;
      }

      const [recordResult, draftResult] = await Promise.all([
        db.from("smart_branch_records").select("payload").eq("organization_id", organizationId),
        db.from("smart_branch_drafts").select("tool_id,payload").eq("organization_id", organizationId).eq("created_by", userId),
      ]);

      if (recordResult.error) throw recordResult.error;
      if (draftResult.error) throw draftResult.error;

      const remoteRecords = (recordResult.data || [])
        .map((row: { payload?: unknown }) => row.payload)
        .filter((item: unknown): item is BranchRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)));
      const mergedRecords = mergeRecords(remoteRecords, localRecords);
      window.localStorage.setItem(RECORDS_KEY, JSON.stringify(mergedRecords));

      for (const row of draftResult.data || []) {
        if (row.tool_id && row.payload && typeof row.payload === "object") {
          window.localStorage.setItem(draftKey(String(row.tool_id)), JSON.stringify(row.payload));
        }
      }

      refreshLocalDashboards();

      const recordCount = mergedRecords.length;
      const draftCount = (draftResult.data || []).length;
      if (!recordCount && !draftCount) {
        setState("empty");
        setMessage("No Smart Branch records or drafts were found on this device or in Northstar Secure.");
      } else {
        setState("success");
        setMessage(`${recordCount} dashboard record${recordCount === 1 ? "" : "s"} and ${draftCount} draft${draftCount === 1 ? "" : "s"} synchronized successfully.`);
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Smart Branch synchronization failed.");
    } finally {
      running.current = false;
    }
  }, []);

  const Icon = state === "success" ? CheckCircle2 : state === "error" || state === "signed-out" ? AlertTriangle : Cloud;

  return (
    <aside className={`smart-branch-cloud-control ${state}`} aria-live="polite">
      <div><Icon size={18} /><span><small>SMART BRANCH CLOUD</small><strong>{message}</strong></span></div>
      <button type="button" onClick={() => void syncNow()} disabled={state === "syncing"}>
        <RefreshCw size={15} className={state === "syncing" ? "spin" : ""} />
        {state === "syncing" ? "Syncing once…" : "Sync Smart Branch now"}
      </button>
      <style>{`
        .smart-branch-cloud-control{position:fixed;right:14px;bottom:72px;z-index:490;width:min(430px,calc(100vw - 28px));padding:12px;border:1px solid #9fc5e5;border-radius:14px;background:rgba(246,251,255,.98);box-shadow:0 18px 48px rgba(12,53,88,.25);font-family:Inter,Arial,sans-serif}.smart-branch-cloud-control>div{display:flex;align-items:center;gap:9px;color:#174d78}.smart-branch-cloud-control span{min-width:0}.smart-branch-cloud-control small,.smart-branch-cloud-control strong{display:block}.smart-branch-cloud-control small{font-size:8px;font-weight:950;letter-spacing:.12em}.smart-branch-cloud-control strong{margin-top:3px;font-size:10px;line-height:1.35}.smart-branch-cloud-control button{width:100%;min-height:38px;display:flex;align-items:center;justify-content:center;gap:7px;margin-top:9px;border:0;border-radius:9px;color:#fff;background:#0a66ff;font-size:9px;font-weight:900;cursor:pointer}.smart-branch-cloud-control button:disabled{opacity:.65}.smart-branch-cloud-control.success{border-color:#8bc7aa;background:rgba(241,255,248,.98)}.smart-branch-cloud-control.success>div{color:#176747}.smart-branch-cloud-control.error,.smart-branch-cloud-control.signed-out{border-color:#e2a2aa;background:rgba(255,246,247,.98)}.smart-branch-cloud-control.error>div,.smart-branch-cloud-control.signed-out>div{color:#8f2936}.smart-branch-cloud-control.empty{border-color:#e2bf78;background:rgba(255,251,240,.98)}.smart-branch-cloud-control.empty>div{color:#80540c}.spin{animation:smartBranchSpin 1s linear infinite}@keyframes smartBranchSpin{to{transform:rotate(360deg)}}@media(max-width:700px){.smart-branch-cloud-control{right:10px;bottom:76px;width:calc(100vw - 20px)}}
      `}</style>
    </aside>
  );
}
