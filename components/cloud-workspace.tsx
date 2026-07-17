"use client";

import { CheckCircle2, Cloud, LogOut, Mail, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import type { ClosureEvidence, ClosureReview, PilotAnalysis, WorkProduct } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";
import { createClient, isCloudConfigured } from "@/lib/supabase/client";

export type CloudBoardItem = {
  status: "proposed" | "approved" | "in-progress" | "ready-for-review" | "implementation" | "evidence-review" | "blocked" | "done";
  owner: string;
  dueDate: string;
  note: string;
  workProduct: WorkProduct | null;
  workProductGeneratedAt: string;
  workProductReviewedAt: string;
  workProductReviewedBy: string;
  closureEvidence: ClosureEvidence[];
  closureReview: ClosureReview | null;
  closureReviewedAt: string;
  closureReviewRequestedBy: string;
  closureNote: string;
  closedAt: string;
  closedBy: string;
};

export type CloudDecisionItem = {
  status: "pending" | "approved" | "deferred";
  note: string;
};

type CloudWorkspaceValue = {
  configured: boolean;
  status: "unconfigured" | "loading" | "signed-out" | "ready" | "error";
  user: User | null;
  organizationId: string | null;
  organizationName: string;
  lastSync: string;
  syncError: string;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  ensureAnalysis: (analysis: PilotAnalysis) => Promise<string | null>;
  loadWorkboard: (analysisId: string) => Promise<{
    actions: Record<string, CloudBoardItem>;
    decisions: Record<string, CloudDecisionItem>;
  } | null>;
  saveWorkboard: (
    analysisId: string,
    analysis: PilotAnalysis,
    actions: Record<string, CloudBoardItem>,
    decisions: Record<string, CloudDecisionItem>,
  ) => Promise<void>;
  uploadClosureEvidence: (
    analysisId: string,
    actionKey: string,
    files: File[],
    note: string,
  ) => Promise<ClosureEvidence[]>;
};

const CloudWorkspaceContext = createContext<CloudWorkspaceValue | null>(null);

function cloudAnalysisKey(generatedAt: string) {
  return "qmspilot:cloud-analysis:" + generatedAt;
}

function toDatabaseActionStatus(status: CloudBoardItem["status"]) {
  if (status === "in-progress") return "in_progress" as const;
  if (status === "ready-for-review") return "ready_for_review" as const;
  if (status === "evidence-review") return "evidence_review" as const;
  return status;
}

function fromDatabaseActionStatus(
  status: "proposed" | "approved" | "in_progress" | "ready_for_review" | "implementation" | "evidence_review" | "blocked" | "done",
) {
  if (status === "in_progress") return "in-progress" as const;
  if (status === "ready_for_review") return "ready-for-review" as const;
  if (status === "evidence_review") return "evidence-review" as const;
  return status;
}

function closureEvidenceMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return types[extension ?? ""] ?? "application/octet-stream";
}

function safeStorageFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "evidence";
}

export function CloudWorkspaceProvider({ children }: { children: ReactNode }) {
  const configured = isCloudConfigured();
  const [status, setStatus] = useState<CloudWorkspaceValue["status"]>(
    configured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setUser(null);
        setStatus("signed-out");
        return;
      }
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setOrganizationId(null);
        setOrganizationName("");
        setStatus("signed-out");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;

    const activeClient = supabase;
    const activeUser = user;

    let active = true;

    async function prepareWorkspace() {
      setStatus("loading");
      setSyncError("");

      const { data: membership, error: membershipError } = await activeClient
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", activeUser.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) throw membershipError;

      const nextOrganizationId = membership?.organization_id;
      if (!nextOrganizationId) {
        throw new Error("Your secure QMSPilot workspace is not available yet.");
      }

      const { data: organization, error: organizationError } = await activeClient
        .from("organizations")
        .select("name")
        .eq("id", nextOrganizationId)
        .single();

      if (organizationError) throw organizationError;
      if (!active) return;

      setOrganizationId(nextOrganizationId);
      setOrganizationName(organization.name);
      setStatus("ready");
    }

    prepareWorkspace().catch((error: unknown) => {
      if (!active) return;
      setSyncError(error instanceof Error ? error.message : "Cloud workspace could not be prepared.");
      setStatus("error");
    });

    return () => {
      active = false;
    };
  }, [user]);

  const sendMagicLink = useCallback(async (email: string) => {
    const supabase = createClient();
    if (!supabase) throw new Error("Cloud workspace is not configured.");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const getAccessToken = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token ?? null;
  }, []);

  const ensureAnalysis = useCallback(async (analysis: PilotAnalysis) => {
    const supabase = createClient();
    if (!supabase || !user || !organizationId) return null;

    const storageKey = cloudAnalysisKey(analysis.generatedAt);
    let analysisId = window.localStorage.getItem(storageKey);
    if (!analysisId) {
      analysisId = crypto.randomUUID();
      window.localStorage.setItem(storageKey, analysisId);
    }

    const { error } = await supabase.from("analyses").upsert({
      id: analysisId,
      organization_id: organizationId,
      created_by: user.id,
      assignment_title: analysis.title,
      business_context: analysis.sourceOverview,
      result: analysis as unknown as Json,
      generated_at: analysis.generatedAt,
    }, { onConflict: "id" });

    if (error) throw error;
    return analysisId;
  }, [organizationId, user]);

  const loadWorkboard = useCallback(async (analysisId: string) => {
    const supabase = createClient();
    if (!supabase || !organizationId) return null;

    const [actionsResult, decisionsResult] = await Promise.all([
      supabase
        .from("work_items")
        .select("id, action_key, owner_name, status, due_date, progress_note, work_product, work_product_generated_at, work_product_reviewed_at, work_product_reviewed_by, closure_review, closure_reviewed_at, closure_review_requested_by, closure_note, closed_at, closed_by")
        .eq("organization_id", organizationId)
        .eq("analysis_id", analysisId),
      supabase
        .from("decision_records")
        .select("decision_key, status, note")
        .eq("organization_id", organizationId)
        .eq("analysis_id", analysisId),
    ]);

    if (actionsResult.error) throw actionsResult.error;
    if (decisionsResult.error) throw decisionsResult.error;

    const workItemIds = actionsResult.data.map((item) => item.id);
    const evidenceResult = workItemIds.length > 0
      ? await supabase
        .from("closure_evidence")
        .select("id, work_item_id, file_name, storage_path, mime_type, size_bytes, evidence_note, uploaded_at, uploaded_by")
        .eq("organization_id", organizationId)
        .in("work_item_id", workItemIds)
        .order("uploaded_at", { ascending: true })
      : { data: [], error: null };

    if (evidenceResult.error) throw evidenceResult.error;

    const evidenceByWorkItem = new Map<string, ClosureEvidence[]>();
    for (const evidence of evidenceResult.data) {
      const current = evidenceByWorkItem.get(evidence.work_item_id) ?? [];
      current.push({
        id: evidence.id,
        fileName: evidence.file_name,
        storagePath: evidence.storage_path,
        mimeType: evidence.mime_type,
        sizeBytes: evidence.size_bytes,
        note: evidence.evidence_note,
        uploadedAt: evidence.uploaded_at,
        uploadedBy: evidence.uploaded_by,
      });
      evidenceByWorkItem.set(evidence.work_item_id, current);
    }

    const actions = Object.fromEntries(
      actionsResult.data.map((item) => [
        item.action_key,
        {
          status: fromDatabaseActionStatus(item.status),
          owner: item.owner_name,
          dueDate: item.due_date ?? "",
          note: item.progress_note,
          workProduct: item.work_product as unknown as WorkProduct | null,
          workProductGeneratedAt: item.work_product_generated_at ?? "",
          workProductReviewedAt: item.work_product_reviewed_at ?? "",
          workProductReviewedBy: item.work_product_reviewed_by ?? "",
          closureEvidence: evidenceByWorkItem.get(item.id) ?? [],
          closureReview: item.closure_review as unknown as ClosureReview | null,
          closureReviewedAt: item.closure_reviewed_at ?? "",
          closureReviewRequestedBy: item.closure_review_requested_by ?? "",
          closureNote: item.closure_note,
          closedAt: item.closed_at ?? "",
          closedBy: item.closed_by ?? "",
        },
      ]),
    );

    const decisions = Object.fromEntries(
      decisionsResult.data.map((item) => [
        item.decision_key,
        { status: item.status, note: item.note },
      ]),
    );

    return { actions, decisions };
  }, [organizationId]);

  const saveWorkboard = useCallback(async (
    analysisId: string,
    analysis: PilotAnalysis,
    actions: Record<string, CloudBoardItem>,
    decisions: Record<string, CloudDecisionItem>,
  ) => {
    const supabase = createClient();
    if (!supabase || !user || !organizationId) return;

    setSyncError("");

    const workItemRows = analysis.actions.map((action) => {
      const item = actions[action.id];
      return {
        organization_id: organizationId,
        analysis_id: analysisId,
        action_key: action.id,
        title: action.title,
        owner_name: item?.owner ?? action.owner,
        status: toDatabaseActionStatus(item?.status ?? "proposed"),
        priority: action.priority,
        due_date: item?.dueDate || action.dueDate || null,
        progress_note: item?.note ?? "",
        recommended_agent: action.recommendedAgent,
        rationale: action.rationale,
        verification: action.verification,
        work_product: item?.workProduct ? item.workProduct as unknown as Json : null,
        work_product_generated_at: item?.workProductGeneratedAt || null,
        work_product_reviewed_at: item?.workProductReviewedAt || null,
        work_product_reviewed_by: item?.workProductReviewedBy || null,
        closure_review: item?.closureReview ? item.closureReview as unknown as Json : null,
        closure_reviewed_at: item?.closureReviewedAt || null,
        closure_review_requested_by: item?.closureReviewRequestedBy || null,
        closure_note: item?.closureNote ?? "",
        closed_at: item?.closedAt || null,
        closed_by: item?.closedBy || null,
        created_by: user.id,
      };
    });

    const decisionRows = analysis.decisionsNeeded.map((decision, position) => {
      const item = decisions[decision] ?? { status: "pending" as const, note: "" };
      const decided = item.status !== "pending";
      return {
        organization_id: organizationId,
        analysis_id: analysisId,
        decision_key: decision,
        position,
        status: item.status,
        note: item.note,
        decided_by: decided ? user.id : null,
        decided_at: decided ? new Date().toISOString() : null,
        created_by: user.id,
      };
    });

    const [actionsResult, decisionsResult] = await Promise.all([
      supabase.from("work_items").upsert(workItemRows, {
        onConflict: "analysis_id,action_key",
      }),
      supabase.from("decision_records").upsert(decisionRows, {
        onConflict: "analysis_id,decision_key",
      }),
    ]);

    if (actionsResult.error) throw actionsResult.error;
    if (decisionsResult.error) throw decisionsResult.error;

    setLastSync(new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date()));
  }, [organizationId, user]);

  const uploadClosureEvidence = useCallback(async (
    analysisId: string,
    actionKey: string,
    files: File[],
    note: string,
  ) => {
    const supabase = createClient();
    if (!supabase || !user || !organizationId) {
      throw new Error("Connect Secure cloud before uploading closure evidence.");
    }

    const { data: workItem, error: workItemError } = await supabase
      .from("work_items")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("analysis_id", analysisId)
      .eq("action_key", actionKey)
      .maybeSingle();

    if (workItemError) throw workItemError;
    if (!workItem) throw new Error("Save the action to Secure cloud before uploading evidence.");

    const uploaded: ClosureEvidence[] = [];
    for (const file of files) {
      const evidenceId = crypto.randomUUID();
      const mimeType = closureEvidenceMimeType(file);
      const storagePath = [
        organizationId,
        workItem.id,
        `${evidenceId}-${safeStorageFileName(file.name)}`,
      ].join("/");

      const { error: uploadError } = await supabase.storage
        .from("closure-evidence")
        .upload(storagePath, file, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: evidence, error: evidenceError } = await supabase
        .from("closure_evidence")
        .insert({
          id: evidenceId,
          organization_id: organizationId,
          work_item_id: workItem.id,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: mimeType,
          size_bytes: file.size,
          evidence_note: note.trim(),
          uploaded_by: user.id,
        })
        .select("id, file_name, storage_path, mime_type, size_bytes, evidence_note, uploaded_at, uploaded_by")
        .single();

      if (evidenceError) throw evidenceError;
      uploaded.push({
        id: evidence.id,
        fileName: evidence.file_name,
        storagePath: evidence.storage_path,
        mimeType: evidence.mime_type,
        sizeBytes: evidence.size_bytes,
        note: evidence.evidence_note,
        uploadedAt: evidence.uploaded_at,
        uploadedBy: evidence.uploaded_by,
      });
    }

    setLastSync(new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date()));
    return uploaded;
  }, [organizationId, user]);

  const value = useMemo<CloudWorkspaceValue>(() => ({
    configured,
    status,
    user,
    organizationId,
    organizationName,
    lastSync,
    syncError,
    sendMagicLink,
    signOut,
    getAccessToken,
    ensureAnalysis,
    loadWorkboard,
    saveWorkboard,
    uploadClosureEvidence,
  }), [
    configured, ensureAnalysis, getAccessToken, lastSync, loadWorkboard, organizationId,
    organizationName, saveWorkboard, sendMagicLink, signOut, status, syncError,
    uploadClosureEvidence, user,
  ]);

  return (
    <CloudWorkspaceContext.Provider value={value}>
      {children}
    </CloudWorkspaceContext.Provider>
  );
}

export function useCloudWorkspace() {
  const context = useContext(CloudWorkspaceContext);
  if (!context) throw new Error("useCloudWorkspace must be used inside CloudWorkspaceProvider.");
  return context;
}

export function CloudAccount() {
  const cloud = useCloudWorkspace();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function sendLink() {
    if (!email.trim() || sending) return;
    setSending(true);
    setMessage("");
    setError("");

    try {
      await cloud.sendMagicLink(email);
      setMessage("Secure sign-in link sent. Check your email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The sign-in link could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (cloud.status === "unconfigured") {
    return <span className="cloud-chip cloud-chip-local"><Cloud size={14} />Browser save</span>;
  }

  if (cloud.status === "loading") {
    return <span className="cloud-chip"><RefreshCw className="spin" size={14} />Connecting cloud</span>;
  }

  if (cloud.status === "ready") {
    return (
      <div className="cloud-account-wrap">
        <button className="cloud-chip cloud-chip-ready" onClick={() => setOpen((value) => !value)}>
          <CheckCircle2 size={14} />Cloud protected
        </button>
        {open && (
          <div className="cloud-popover">
            <button className="cloud-close" onClick={() => setOpen(false)} aria-label="Close cloud account"><X /></button>
            <ShieldCheck className="cloud-popover-icon" />
            <p className="eyebrow">Secure workspace</p>
            <h3>{cloud.organizationName || "QMSPilot"}</h3>
            <p>{cloud.user?.email}</p>
            <span>Analyses, actions, decisions, and their audit history are protected by company-level access rules.</span>
            <button className="cloud-secondary" onClick={cloud.signOut}><LogOut />Sign out</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cloud-account-wrap">
      <button className="cloud-chip" onClick={() => setOpen((value) => !value)}>
        <Cloud size={14} />Secure cloud
      </button>
      {open && (
        <div className="cloud-popover">
          <button className="cloud-close" onClick={() => setOpen(false)} aria-label="Close cloud sign in"><X /></button>
          <Mail className="cloud-popover-icon" />
          <p className="eyebrow">QMSPilot account</p>
          <h3>Protect your company’s work</h3>
          <p>Enter your email. We’ll send a secure sign-in link—no password required.</p>
          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          <button className="cloud-primary" onClick={sendLink} disabled={!email.trim() || sending}>
            {sending ? <RefreshCw className="spin" /> : <Mail />}
            {sending ? "Sending..." : "Email my sign-in link"}
          </button>
          {message && <div className="cloud-message">{message}</div>}
          {(error || cloud.syncError) && <div className="cloud-error">{error || cloud.syncError}</div>}
        </div>
      )}
    </div>
  );
}
