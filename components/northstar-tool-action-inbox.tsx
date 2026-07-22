"use client";

import { AlertTriangle, CheckCircle2, ClipboardCheck, Play, RefreshCw, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

const evidenceBucket = "workforce-operations-evidence";

const pathToTool: Record<string, string> = {
  "/tools/asset-reliability": "asset-reliability",
  "/tools/controlled-change": "controlled-change",
  "/tools/customer-assurance": "customer-assurance",
  "/tools/daily-operations": "daily-operations",
  "/tools/delivery-assurance": "delivery-assurance",
  "/tools/measurement-assurance": "measurement-assurance",
  "/tools/process-assurance": "process-assurance",
  "/tools/supplier-assurance": "supplier-assurance",
  "/tools/value-ledger": "value-ledger",
  "/tools/workforce-readiness": "workforce-readiness",
};

type ToolAction = {
  id: string;
  source_action_id: string;
  title: string;
  target_record: string;
  owner_name: string;
  due_date: string | null;
  priority: "urgent" | "high" | "normal" | "low";
  action_status: "approved" | "in_progress" | "evidence_review" | "blocked" | "done" | "rejected";
  verification_required: string;
  progress_note: string;
  evidence_names: string[];
};

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "evidence";
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function NorthstarToolActionInbox() {
  const cloud = useCloudWorkspace();
  const fileMap = useRef(new Map<string, File[]>());
  const [tool, setTool] = useState("");
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<ToolAction[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setTool(pathToTool[window.location.pathname] || "");
  }, []);

  const openCount = useMemo(() => actions.filter((item) => !["done", "rejected"].includes(item.action_status)).length, [actions]);

  useEffect(() => {
    if (!tool || cloud.status !== "ready" || !cloud.organizationId) return;
    loadActions(false);
    const timer = window.setInterval(() => loadActions(false), 30000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, cloud.status, cloud.organizationId]);

  async function loadActions(showNotice = true) {
    if (!tool || !cloud.organizationId) return;
    const supabase = createClient();
    if (!supabase) return;
    setBusy("refresh");
    const { data, error } = await supabase
      .from("northstar_tool_actions" as never)
      .select("*")
      .eq("organization_id", cloud.organizationId)
      .eq("target_tool", tool)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    setBusy("");
    if (error) {
      if (showNotice) setNotice(error.message);
      return;
    }
    setActions((data || []) as unknown as ToolAction[]);
    if (showNotice) setNotice(`${data?.length || 0} closed-loop action${data?.length === 1 ? "" : "s"} synchronized.`);
  }

  async function updateAction(action: ToolAction, status: ToolAction["action_status"]) {
    const promptText = status === "done"
      ? "Document objective completion and effectiveness verification:"
      : status === "blocked"
        ? "Document the blocker and required escalation:"
        : "Add a controlled progress note:";
    const note = window.prompt(promptText, status === "done" ? "Verification completed and objective evidence reviewed." : action.progress_note || "");
    if (!note?.trim()) return;
    if (status === "done" && !action.verification_required.trim()) {
      setNotice("Closure is blocked because objective verification is not defined.");
      return;
    }

    const supabase = createClient();
    if (!supabase || !cloud.organizationId || !cloud.user) return;
    setBusy(action.id);
    try {
      const files = fileMap.current.get(action.id) || [];
      const evidenceNames = [...(action.evidence_names || [])];
      for (const file of files) {
        const evidenceId = crypto.randomUUID();
        const path = `${cloud.organizationId}/${action.source_action_id}/${evidenceId}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(evidenceBucket).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        const { error: evidenceError } = await supabase.from("northstar_workforce_action_evidence" as never).insert({
          id: evidenceId,
          organization_id: cloud.organizationId,
          action_id: action.source_action_id,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          uploaded_by: cloud.user.id,
        } as never);
        if (evidenceError) throw evidenceError;
        evidenceNames.push(file.name);
      }

      const patch = status === "done"
        ? {
            action_status: status,
            progress_note: note,
            closure_note: note,
            evidence_names: evidenceNames,
            closed_by: cloud.user.id,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            action_status: status,
            progress_note: note,
            evidence_names: evidenceNames,
            updated_at: new Date().toISOString(),
          };
      const { error } = await supabase.from("northstar_tool_actions" as never).update(patch as never).eq("id", action.id);
      if (error) throw error;
      fileMap.current.delete(action.id);
      await loadActions(false);
      setNotice(status === "done" ? "Action closed and synchronized back to Atlas and the Intelligence Bus." : `Action moved to ${titleCase(status)}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The closed-loop action could not be updated.");
    } finally {
      setBusy("");
    }
  }

  if (!tool || cloud.status !== "ready") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); loadActions(false); }}
        aria-label="Open Northstar closed-loop actions"
        style={{ position: "fixed", right: 22, bottom: 22, zIndex: 240, minHeight: 48, display: "inline-flex", alignItems: "center", gap: 9, padding: "0 16px", border: "1px solid #80b7e8", borderRadius: 999, color: "white", background: "linear-gradient(135deg,#071c34,#0a66ff)", boxShadow: "0 18px 46px rgba(5,48,91,.34)", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
      >
        <ClipboardCheck size={18} /> Closed-loop actions <span style={{ minWidth: 22, height: 22, display: "grid", placeItems: "center", borderRadius: 999, background: openCount ? "#ffbf47" : "#2bd576", color: "#071522" }}>{openCount}</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 600, display: "grid", placeItems: "center", padding: 18, background: "rgba(3,15,29,.82)", backdropFilter: "blur(10px)" }}>
          <section style={{ width: "min(920px,100%)", maxHeight: "92vh", overflow: "auto", border: "1px solid #315b80", borderRadius: 22, background: "#f5f9fc", boxShadow: "0 34px 110px rgba(0,0,0,.52)" }}>
            <header style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", color: "white", background: "linear-gradient(135deg,#06172b,#0b4c86)" }}>
              <ShieldCheck size={22} />
              <div style={{ marginRight: "auto" }}><small style={{ display: "block", color: "#9cc8eb", letterSpacing: ".12em", fontWeight: 900 }}>NORTHSTAR CLOSED-LOOP EXECUTION</small><strong>{titleCase(tool)} action inbox</strong></div>
              <button type="button" onClick={() => loadActions()} style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #4a7193", borderRadius: 10, color: "white", background: "#0c2e4d", cursor: "pointer" }}><RefreshCw size={17} className={busy === "refresh" ? "spin" : ""} /></button>
              <button type="button" onClick={() => setOpen(false)} style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #4a7193", borderRadius: 10, color: "white", background: "#0c2e4d", cursor: "pointer" }}><X size={18} /></button>
            </header>

            <div style={{ padding: 22 }}>
              <p style={{ margin: "0 0 14px", color: "#536b82", lineHeight: 1.6 }}>These actions were recommended by the supervised AI workforce, approved by a human, and written into this controlled application. Progress and closure synchronize back to Atlas and the originating Intelligence Bus event.</p>
              {notice && <div style={{ marginBottom: 14, padding: 11, border: "1px solid #9bc5e8", borderRadius: 11, color: "#174d79", background: "#eaf5ff", fontSize: 12, fontWeight: 750 }}>{notice}</div>}
              {!actions.length && <div style={{ padding: 28, border: "1px dashed #b5c8d8", borderRadius: 16, color: "#6c8193", textAlign: "center" }}>No closed-loop actions have been written into this application.</div>}
              <div style={{ display: "grid", gap: 13 }}>
                {actions.map((action) => (
                  <article key={action.id} style={{ padding: 17, border: action.action_status === "done" ? "1px solid #a9d8c5" : "1px solid #cfdae4", borderRadius: 16, background: action.action_status === "done" ? "#f0fbf6" : "white", boxShadow: "0 10px 25px rgba(25,53,77,.07)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ padding: "5px 8px", borderRadius: 999, color: action.priority === "urgent" ? "#8b1f2b" : "#1c537f", background: action.priority === "urgent" ? "#ffe9ec" : "#eaf4fd", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{action.priority}</span>
                      <div style={{ flex: 1 }}><strong style={{ display: "block", color: "#10263a", fontSize: 15 }}>{action.title}</strong><small style={{ display: "block", marginTop: 5, color: "#6c8193" }}>{action.target_record || "Portfolio-level action"} · {action.owner_name || "Owner pending"} · {action.due_date || "No due date"}</small></div>
                      <span style={{ color: action.action_status === "done" ? "#16835a" : "#6d7f90", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{titleCase(action.action_status)}</span>
                    </div>
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 11, color: "#344f66", background: "#f1f5f8", fontSize: 12, lineHeight: 1.55 }}><strong>Verification:</strong> {action.verification_required || "Not defined"}</div>
                    {action.progress_note && <p style={{ margin: "11px 0 0", color: "#526b80", fontSize: 12, lineHeight: 1.55 }}>{action.progress_note}</p>}
                    {!!action.evidence_names?.length && <small style={{ display: "block", marginTop: 9, color: "#16835a", fontWeight: 800 }}>{action.evidence_names.length} evidence file{action.evidence_names.length === 1 ? "" : "s"} attached</small>}
                    {!["done", "rejected"].includes(action.action_status) && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 13 }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 11px", border: "1px solid #c7d5e1", borderRadius: 9, color: "#3d607c", background: "#f8fbfd", fontSize: 10, fontWeight: 850, cursor: "pointer" }}><UploadCloud size={15} />Evidence<input type="file" multiple hidden onChange={(event) => fileMap.current.set(action.id, Array.from(event.target.files || []))} /></label>
                        <button type="button" onClick={() => updateAction(action, "in_progress")} disabled={busy === action.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 11px", border: 0, borderRadius: 9, color: "white", background: "#1769c9", fontSize: 10, fontWeight: 850, cursor: "pointer" }}><Play size={14} />Start / update</button>
                        <button type="button" onClick={() => updateAction(action, "blocked")} disabled={busy === action.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 11px", border: 0, borderRadius: 9, color: "white", background: "#9a6415", fontSize: 10, fontWeight: 850, cursor: "pointer" }}><AlertTriangle size={14} />Block</button>
                        <button type="button" onClick={() => updateAction(action, "done")} disabled={busy === action.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 11px", border: 0, borderRadius: 9, color: "white", background: "#16835a", fontSize: 10, fontWeight: 850, cursor: "pointer" }}><CheckCircle2 size={14} />Verify & close</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
