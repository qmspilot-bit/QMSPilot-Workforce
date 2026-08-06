"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

const TABLE = "northstar_workspace_state";
const META_PREFIX = "__northstar_sync_meta__:";
const MAX_STATE_BYTES = 900_000;
const LOCAL_SCAN_MS = 1_500;
const REMOTE_SCAN_MS = 10_000;

const EXCLUDED_KEYS = new Set([
  "qmspilot:northstar:smart-branch-records",
]);

const EXCLUDED_PREFIXES = [
  "qmspilot:smart-branch:",
  "qmspilot:delivery-assurance:",
  "qmspilot:6s:",
  "qmspilot:process-assurance:",
];

type StateScope = "organization" | "user";

type RemoteStateRow = {
  state_key: string;
  scope: StateScope;
  scope_id: string;
  state_type: string;
  payload: unknown;
  payload_hash: string;
  updated_at: string;
};

type LocalState = {
  key: string;
  scope: StateScope;
  stateType: string;
  payload: unknown;
  raw: string;
  hash: string;
};

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function isJsonState(value: unknown): value is Record<string, unknown> | unknown[] {
  return Boolean(value && typeof value === "object");
}

function parseState(raw: string | null) {
  if (!raw || raw.length > MAX_STATE_BYTES) return null;
  try {
    const payload = JSON.parse(raw) as unknown;
    return isJsonState(payload) ? payload : null;
  } catch {
    return null;
  }
}

function shouldSyncKey(key: string) {
  if (!key.startsWith("qmspilot:")) return false;
  if (EXCLUDED_KEYS.has(key)) return false;
  return !EXCLUDED_PREFIXES.some(prefix => key.startsWith(prefix));
}

function scopeForKey(key: string): StateScope {
  if (key.startsWith("qmspilot:guided:")) return "user";
  if (/(^|:)draft(:|$)/i.test(key)) return "user";
  return "organization";
}

function stateTypeForKey(key: string) {
  if (/(^|:)draft(:|$)/i.test(key) || key.startsWith("qmspilot:guided:")) return "draft";
  if (/record/i.test(key)) return "records";
  if (/action/i.test(key)) return "actions";
  if (/summary/i.test(key)) return "summary";
  if (/workspace/i.test(key)) return "workspace";
  return "state";
}

function readLocalStates() {
  const states = new Map<string, LocalState>();
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !shouldSyncKey(key)) continue;
    const raw = window.localStorage.getItem(key);
    const payload = parseState(raw);
    if (!raw || !payload) continue;
    states.set(key, {
      key,
      scope: scopeForKey(key),
      stateType: stateTypeForKey(key),
      payload,
      raw,
      hash: hashText(raw),
    });
  }
  return states;
}

function localModifiedAt(key: string) {
  const value = Number(window.localStorage.getItem(`${META_PREFIX}${key}`) || 0);
  return Number.isFinite(value) ? value : 0;
}

function markLocalModified(key: string, value = Date.now()) {
  window.localStorage.setItem(`${META_PREFIX}${key}`, String(value));
}

function clearLocalModified(key: string) {
  window.localStorage.removeItem(`${META_PREFIX}${key}`);
}

function itemIdentity(item: unknown, index: number) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const record = item as Record<string, unknown>;
    const identity = record.recordId
      || record.id
      || record.record_id
      || record.actionKey
      || record.action_key
      || record.workOrderNumber
      || record.ncrNumber
      || record.sourceRecord;
    if (identity) return String(identity);
  }
  return `${index}:${hashText(JSON.stringify(item))}`;
}

function mergeArrays(remote: unknown[], local: unknown[]) {
  const merged = new Map<string, unknown>();
  remote.forEach((item, index) => merged.set(itemIdentity(item, index), item));
  local.forEach((item, index) => merged.set(itemIdentity(item, index), item));
  return Array.from(merged.values());
}

function serialize(payload: unknown) {
  return JSON.stringify(payload);
}

function writeLocalState(key: string, payload: unknown, updatedAt: string) {
  const raw = serialize(payload);
  window.localStorage.setItem(key, raw);
  markLocalModified(key, Date.parse(updatedAt) || Date.now());
  return hashText(raw);
}

function notifyConsumers(keys: string[]) {
  if (!keys.length) return;
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("qmspilot:northstar-persistence-updated", {
    detail: { keys },
  }));
  if (keys.some(key => key.includes("workforce-readiness"))) {
    window.dispatchEvent(new CustomEvent("qmspilot:workforce-readiness-updated"));
  }
}

function isBypassPath(pathname: string) {
  return pathname === "/login" || pathname === "/reset-password";
}

export default function NorthstarPersistenceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const cloud = useCloudWorkspace();
  const bypass = isBypassPath(pathname);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [syncError, setSyncError] = useState("");
  const running = useRef(false);
  const lastLocalHashes = useRef(new Map<string, string>());
  const lastRemoteHashes = useRef(new Map<string, string>());

  const loadRemoteStates = useCallback(async () => {
    if (!cloud.organizationId || !cloud.user) return [] as RemoteStateRow[];
    const supabase = createClient();
    if (!supabase) throw new Error("Northstar Secure is unavailable.");
    const db = supabase as any;

    const [organizationResult, userResult] = await Promise.all([
      db
        .from(TABLE)
        .select("state_key,scope,scope_id,state_type,payload,payload_hash,updated_at")
        .eq("organization_id", cloud.organizationId)
        .eq("scope", "organization")
        .eq("scope_id", cloud.organizationId),
      db
        .from(TABLE)
        .select("state_key,scope,scope_id,state_type,payload,payload_hash,updated_at")
        .eq("organization_id", cloud.organizationId)
        .eq("scope", "user")
        .eq("scope_id", cloud.user.id),
    ]);

    if (organizationResult.error) throw organizationResult.error;
    if (userResult.error) throw userResult.error;
    return [...(organizationResult.data || []), ...(userResult.data || [])] as RemoteStateRow[];
  }, [cloud.organizationId, cloud.user]);

  const pushLocalState = useCallback(async (state: LocalState) => {
    if (!cloud.organizationId || !cloud.user) return;
    const supabase = createClient();
    if (!supabase) throw new Error("Northstar Secure is unavailable.");
    const scopeId = state.scope === "organization" ? cloud.organizationId : cloud.user.id;
    const updatedAt = new Date().toISOString();
    const { error } = await (supabase as any).from(TABLE).upsert({
      organization_id: cloud.organizationId,
      scope: state.scope,
      scope_id: scopeId,
      state_key: state.key,
      state_type: state.stateType,
      payload: state.payload,
      payload_hash: state.hash,
      updated_by: cloud.user.id,
      updated_at: updatedAt,
    }, { onConflict: "organization_id,scope,scope_id,state_key" });
    if (error) throw error;
    markLocalModified(state.key, Date.parse(updatedAt));
    lastLocalHashes.current.set(state.key, state.hash);
    lastRemoteHashes.current.set(state.key, state.hash);
  }, [cloud.organizationId, cloud.user]);

  const deleteRemoteState = useCallback(async (key: string) => {
    if (!cloud.organizationId || !cloud.user) return;
    const scope = scopeForKey(key);
    const scopeId = scope === "organization" ? cloud.organizationId : cloud.user.id;
    const supabase = createClient();
    if (!supabase) throw new Error("Northstar Secure is unavailable.");
    const { error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .eq("organization_id", cloud.organizationId)
      .eq("scope", scope)
      .eq("scope_id", scopeId)
      .eq("state_key", key);
    if (error) throw error;
    clearLocalModified(key);
    lastLocalHashes.current.delete(key);
    lastRemoteHashes.current.delete(key);
  }, [cloud.organizationId, cloud.user]);

  const bootstrap = useCallback(async () => {
    if (running.current || !cloud.organizationId || !cloud.user) return;
    running.current = true;
    setSyncError("");

    try {
      const localStates = readLocalStates();
      const remoteRows = await loadRemoteStates();
      const remoteByKey = new Map(remoteRows.map(row => [row.state_key, row]));
      const allKeys = new Set([...localStates.keys(), ...remoteByKey.keys()]);
      const changedKeys: string[] = [];

      for (const key of allKeys) {
        const local = localStates.get(key);
        const remote = remoteByKey.get(key);

        if (local && !remote) {
          await pushLocalState(local);
          continue;
        }

        if (!local && remote) {
          const nextHash = writeLocalState(key, remote.payload, remote.updated_at);
          lastLocalHashes.current.set(key, nextHash);
          lastRemoteHashes.current.set(key, remote.payload_hash || nextHash);
          changedKeys.push(key);
          continue;
        }

        if (!local || !remote) continue;
        const remoteRaw = serialize(remote.payload);
        const remoteHash = remote.payload_hash || hashText(remoteRaw);
        if (local.hash === remoteHash) {
          lastLocalHashes.current.set(key, local.hash);
          lastRemoteHashes.current.set(key, remoteHash);
          markLocalModified(key, Date.parse(remote.updated_at) || Date.now());
          continue;
        }

        if (Array.isArray(local.payload) && Array.isArray(remote.payload)) {
          const mergedPayload = mergeArrays(remote.payload, local.payload);
          const mergedRaw = serialize(mergedPayload);
          const mergedState: LocalState = {
            ...local,
            payload: mergedPayload,
            raw: mergedRaw,
            hash: hashText(mergedRaw),
          };
          window.localStorage.setItem(key, mergedRaw);
          await pushLocalState(mergedState);
          changedKeys.push(key);
          continue;
        }

        const remoteTime = Date.parse(remote.updated_at) || 0;
        if (localModifiedAt(key) > remoteTime) {
          await pushLocalState(local);
        } else {
          const nextHash = writeLocalState(key, remote.payload, remote.updated_at);
          lastLocalHashes.current.set(key, nextHash);
          lastRemoteHashes.current.set(key, remoteHash);
          changedKeys.push(key);
        }
      }

      const finalLocal = readLocalStates();
      for (const [key, state] of finalLocal) {
        if (!lastLocalHashes.current.has(key)) lastLocalHashes.current.set(key, state.hash);
      }
      notifyConsumers(changedKeys);
      setBootstrapped(true);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Northstar persistence could not start.");
      setBootstrapped(true);
    } finally {
      running.current = false;
    }
  }, [cloud.organizationId, cloud.user, loadRemoteStates, pushLocalState]);

  const scanLocalChanges = useCallback(async () => {
    if (running.current || !cloud.organizationId || !cloud.user) return;
    running.current = true;

    try {
      const current = readLocalStates();
      for (const [key, state] of current) {
        const previousHash = lastLocalHashes.current.get(key);
        if (previousHash === state.hash) continue;
        markLocalModified(key);
        await pushLocalState(state);
      }

      for (const key of Array.from(lastLocalHashes.current.keys())) {
        if (current.has(key)) continue;
        await deleteRemoteState(key);
      }
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Northstar could not save a workspace change.");
    } finally {
      running.current = false;
    }
  }, [cloud.organizationId, cloud.user, deleteRemoteState, pushLocalState]);

  const pullRemoteChanges = useCallback(async () => {
    if (running.current || !cloud.organizationId || !cloud.user) return;
    running.current = true;

    try {
      const remoteRows = await loadRemoteStates();
      const remoteByKey = new Map(remoteRows.map(row => [row.state_key, row]));
      const localStates = readLocalStates();
      const changedKeys: string[] = [];

      for (const [key, remote] of remoteByKey) {
        const remoteRaw = serialize(remote.payload);
        const remoteHash = remote.payload_hash || hashText(remoteRaw);
        if (lastRemoteHashes.current.get(key) === remoteHash) continue;

        const local = localStates.get(key);
        const remoteTime = Date.parse(remote.updated_at) || 0;
        if (local && localModifiedAt(key) > remoteTime) {
          await pushLocalState(local);
          continue;
        }

        if (local && Array.isArray(local.payload) && Array.isArray(remote.payload)) {
          const mergedPayload = mergeArrays(remote.payload, local.payload);
          const mergedRaw = serialize(mergedPayload);
          const mergedHash = hashText(mergedRaw);
          if (mergedHash !== remoteHash) {
            const mergedState: LocalState = {
              ...local,
              payload: mergedPayload,
              raw: mergedRaw,
              hash: mergedHash,
            };
            window.localStorage.setItem(key, mergedRaw);
            await pushLocalState(mergedState);
          } else {
            writeLocalState(key, remote.payload, remote.updated_at);
            lastLocalHashes.current.set(key, remoteHash);
            lastRemoteHashes.current.set(key, remoteHash);
          }
          changedKeys.push(key);
          continue;
        }

        const nextHash = writeLocalState(key, remote.payload, remote.updated_at);
        lastLocalHashes.current.set(key, nextHash);
        lastRemoteHashes.current.set(key, remoteHash);
        changedKeys.push(key);
      }

      for (const key of Array.from(lastRemoteHashes.current.keys())) {
        if (remoteByKey.has(key)) continue;
        const local = localStates.get(key);
        if (local && local.hash !== lastRemoteHashes.current.get(key)) {
          await pushLocalState(local);
          continue;
        }
        window.localStorage.removeItem(key);
        clearLocalModified(key);
        lastLocalHashes.current.delete(key);
        lastRemoteHashes.current.delete(key);
        changedKeys.push(key);
      }

      notifyConsumers(changedKeys);
      setSyncError("");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Northstar could not retrieve workspace changes.");
    } finally {
      running.current = false;
    }
  }, [cloud.organizationId, cloud.user, loadRemoteStates, pushLocalState]);

  useEffect(() => {
    if (bypass) {
      setBootstrapped(true);
      return;
    }
    if (cloud.status === "ready" && cloud.organizationId && cloud.user) {
      setBootstrapped(false);
      void bootstrap();
      return;
    }
    if (["signed-out", "unconfigured", "error"].includes(cloud.status)) {
      setBootstrapped(true);
    }
  }, [bootstrap, bypass, cloud.organizationId, cloud.status, cloud.user]);

  useEffect(() => {
    if (!bootstrapped || bypass || cloud.status !== "ready") return;

    const localTimer = window.setInterval(() => void scanLocalChanges(), LOCAL_SCAN_MS);
    const remoteTimer = window.setInterval(() => void pullRemoteChanges(), REMOTE_SCAN_MS);
    const refresh = () => void pullRemoteChanges();
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);

    return () => {
      window.clearInterval(localTimer);
      window.clearInterval(remoteTimer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [bootstrapped, bypass, cloud.status, pullRemoteChanges, scanLocalChanges]);

  if (!bypass && !bootstrapped && ["loading", "ready"].includes(cloud.status)) {
    return (
      <main className="northstar-persistence-loading" aria-live="polite">
        <RefreshCw className="spin" size={24} />
        <strong>Loading Northstar Secure</strong>
        <span>Restoring the latest authorized workspace data…</span>
        <style>{`
          .northstar-persistence-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:10px;color:#174d78;background:#edf3f8;font-family:Inter,Arial,sans-serif}.northstar-persistence-loading strong{font-size:15px}.northstar-persistence-loading span{color:#6a8296;font-size:10px}.northstar-persistence-loading .spin{animation:northstarPersistenceSpin 1s linear infinite}@keyframes northstarPersistenceSpin{to{transform:rotate(360deg)}}
        `}</style>
      </main>
    );
  }

  return (
    <>
      {children}
      {syncError && cloud.status === "ready" && (
        <aside className="northstar-persistence-error" role="alert">
          <AlertTriangle size={16} />
          <span><strong>Northstar sync needs attention</strong><small>{syncError}</small></span>
          <button type="button" onClick={() => void pullRemoteChanges()}>Retry</button>
          <style>{`
            .northstar-persistence-error{position:fixed;left:14px;bottom:14px;z-index:990;display:flex;align-items:center;gap:9px;max-width:min(520px,calc(100vw - 28px));padding:10px 12px;border:1px solid #e2a2aa;border-radius:12px;color:#8f2936;background:rgba(255,246,247,.98);box-shadow:0 16px 38px rgba(70,20,28,.18);font-family:Inter,Arial,sans-serif}.northstar-persistence-error span{min-width:0;flex:1}.northstar-persistence-error strong,.northstar-persistence-error small{display:block}.northstar-persistence-error strong{font-size:9px}.northstar-persistence-error small{margin-top:2px;font-size:8px;line-height:1.35}.northstar-persistence-error button{min-height:32px;padding:0 10px;border:0;border-radius:8px;color:#fff;background:#9f3040;font-size:8px;font-weight:900;cursor:pointer}
          `}</style>
        </aside>
      )}
    </>
  );
}
