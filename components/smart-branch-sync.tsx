"use client";

import { useEffect, useRef } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

const RECORDS_KEY = "qmspilot:northstar:smart-branch-records";
const TOOL_IDS = ["01.01", "02.01", "03.01", "04.01", "05.01", "06.01", "07.01", "08.01"] as const;

const draftKey = (toolId: string) => `qmspilot:smart-branch:draft:${toolId}`;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readRecords(): Record<string, unknown>[] {
  const value = parseJson<unknown>(window.localStorage.getItem(RECORDS_KEY), []);
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
}

function readDraft(toolId: string): Record<string, unknown> | null {
  const value = parseJson<unknown>(window.localStorage.getItem(draftKey(toolId)), null);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stableHash(value: unknown) {
  return JSON.stringify(value);
}

function recordIdOf(record: Record<string, unknown>) {
  return String(record.recordId || "").trim();
}

function submittedAtOf(record: Record<string, unknown>) {
  return String(record.submittedAt || new Date().toISOString());
}

function mergeRecords(remote: Record<string, unknown>[], local: Record<string, unknown>[]) {
  const merged = new Map<string, Record<string, unknown>>();
  for (const record of remote) {
    const id = recordIdOf(record);
    if (id) merged.set(id, record);
  }
  for (const record of local) {
    const id = recordIdOf(record);
    if (id) merged.set(id, record);
  }
  return Array.from(merged.values()).sort((a, b) => submittedAtOf(b).localeCompare(submittedAtOf(a)));
}

function notifyLocalReaders() {
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("qmspilot:smart-branch-record-submitted"));
}

export default function SmartBranchSync() {
  const cloud = useCloudWorkspace();
  const initialized = useRef(false);
  const applyingRemote = useRef(false);
  const lastRecordsHash = useRef("");
  const lastDraftHashes = useRef(new Map<string, string>());
  const busy = useRef(false);

  useEffect(() => {
    if (cloud.status !== "ready" || !cloud.user || !cloud.organizationId) return;
    const supabase = createClient();
    if (!supabase) return;

    const db = supabase as any;
    const userId = cloud.user.id;
    const organizationId = cloud.organizationId;
    let active = true;

    async function fetchRemoteRecords() {
      const { data, error } = await db
        .from("smart_branch_records")
        .select("payload, updated_at")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || [])
        .map((row: { payload?: unknown }) => row.payload)
        .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
    }

    async function pushRecords(records: Record<string, unknown>[]) {
      const rows = records
        .map(record => {
          const recordId = recordIdOf(record);
          if (!recordId) return null;
          return {
            organization_id: organizationId,
            record_id: recordId,
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
            submitted_at: submittedAtOf(record),
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);
      if (!rows.length) return;
      const { error } = await db
        .from("smart_branch_records")
        .upsert(rows, { onConflict: "organization_id,record_id" });
      if (error) throw error;
    }

    async function fetchRemoteDrafts() {
      const { data, error } = await db
        .from("smart_branch_drafts")
        .select("tool_id, payload, updated_at")
        .eq("organization_id", organizationId)
        .eq("created_by", userId);
      if (error) throw error;
      return new Map<string, Record<string, unknown>>(
        (data || [])
          .filter((row: { tool_id?: string; payload?: unknown }) => row.tool_id && row.payload && typeof row.payload === "object")
          .map((row: { tool_id: string; payload: Record<string, unknown> }) => [row.tool_id, row.payload]),
      );
    }

    async function pushDraft(toolId: string, payload: Record<string, unknown>) {
      const { error } = await db.from("smart_branch_drafts").upsert({
        organization_id: organizationId,
        created_by: userId,
        tool_id: toolId,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id,created_by,tool_id" });
      if (error) throw error;
    }

    async function deleteDraft(toolId: string) {
      const { error } = await db
        .from("smart_branch_drafts")
        .delete()
        .eq("organization_id", organizationId)
        .eq("created_by", userId)
        .eq("tool_id", toolId);
      if (error) throw error;
    }

    async function initialize() {
      try {
        busy.current = true;
        const [remoteRecords, remoteDrafts] = await Promise.all([
          fetchRemoteRecords(),
          fetchRemoteDrafts(),
        ]);
        if (!active) return;

        const localRecords = readRecords();
        const merged = mergeRecords(remoteRecords, localRecords);
        if (stableHash(merged) !== stableHash(localRecords)) {
          applyingRemote.current = true;
          window.localStorage.setItem(RECORDS_KEY, JSON.stringify(merged));
          notifyLocalReaders();
          applyingRemote.current = false;
        }
        if (localRecords.length) await pushRecords(merged);
        lastRecordsHash.current = stableHash(merged);

        for (const toolId of TOOL_IDS) {
          const local = readDraft(toolId);
          const remote = remoteDrafts.get(toolId) || null;
          if (local) {
            await pushDraft(toolId, local);
            lastDraftHashes.current.set(toolId, stableHash(local));
          } else if (remote) {
            applyingRemote.current = true;
            window.localStorage.setItem(draftKey(toolId), JSON.stringify(remote));
            applyingRemote.current = false;
            lastDraftHashes.current.set(toolId, stableHash(remote));
          } else {
            lastDraftHashes.current.set(toolId, "");
          }
        }
        initialized.current = true;
      } catch (error) {
        console.error("Smart Branch initial cloud sync failed", error);
      } finally {
        busy.current = false;
      }
    }

    async function pushLocalChanges() {
      if (!initialized.current || applyingRemote.current || busy.current) return;
      busy.current = true;
      try {
        const records = readRecords();
        const recordHash = stableHash(records);
        if (recordHash !== lastRecordsHash.current) {
          await pushRecords(records);
          lastRecordsHash.current = recordHash;
        }

        for (const toolId of TOOL_IDS) {
          const draft = readDraft(toolId);
          const hash = draft ? stableHash(draft) : "";
          const previous = lastDraftHashes.current.get(toolId) || "";
          if (hash === previous) continue;
          if (draft) await pushDraft(toolId, draft);
          else if (previous) await deleteDraft(toolId);
          lastDraftHashes.current.set(toolId, hash);
        }
      } catch (error) {
        console.error("Smart Branch local changes could not be synced", error);
      } finally {
        busy.current = false;
      }
    }

    async function pullCloudChanges() {
      if (!initialized.current || busy.current) return;
      busy.current = true;
      try {
        const [remoteRecords, remoteDrafts] = await Promise.all([
          fetchRemoteRecords(),
          fetchRemoteDrafts(),
        ]);
        if (!active) return;

        const recordHash = stableHash(remoteRecords);
        if (recordHash !== lastRecordsHash.current) {
          applyingRemote.current = true;
          window.localStorage.setItem(RECORDS_KEY, JSON.stringify(remoteRecords));
          lastRecordsHash.current = recordHash;
          notifyLocalReaders();
          applyingRemote.current = false;
        }

        for (const toolId of TOOL_IDS) {
          const remote = remoteDrafts.get(toolId) || null;
          const hash = remote ? stableHash(remote) : "";
          const previous = lastDraftHashes.current.get(toolId) || "";
          if (hash === previous) continue;
          applyingRemote.current = true;
          if (remote) window.localStorage.setItem(draftKey(toolId), JSON.stringify(remote));
          else window.localStorage.removeItem(draftKey(toolId));
          lastDraftHashes.current.set(toolId, hash);
          applyingRemote.current = false;
        }
      } catch (error) {
        console.error("Smart Branch cloud changes could not be loaded", error);
      } finally {
        busy.current = false;
      }
    }

    const syncNow = () => void pushLocalChanges();
    void initialize();
    const localTimer = window.setInterval(() => void pushLocalChanges(), 700);
    const cloudTimer = window.setInterval(() => void pullCloudChanges(), 7000);
    window.addEventListener("qmspilot:smart-branch-record-submitted", syncNow);
    window.addEventListener("storage", syncNow);
    document.addEventListener("visibilitychange", syncNow);

    return () => {
      active = false;
      initialized.current = false;
      window.clearInterval(localTimer);
      window.clearInterval(cloudTimer);
      window.removeEventListener("qmspilot:smart-branch-record-submitted", syncNow);
      window.removeEventListener("storage", syncNow);
      document.removeEventListener("visibilitychange", syncNow);
    };
  }, [cloud.organizationId, cloud.status, cloud.user]);

  return null;
}
