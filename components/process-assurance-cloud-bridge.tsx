"use client";

import { CheckCircle2, Cloud, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

type ProcessAssurancePayload = {
  schema: string;
  recordId: string;
  submittedAt: string;
  setup: {
    organization: string;
    site: string;
    department: string;
    process: string;
    shift: string;
    auditor: string;
    auditDate: string;
    layer: "layer-1" | "layer-2" | "layer-3";
    standardReference: string;
    leadershipNote: string;
  };
  metrics: {
    score: number;
    answered: number;
    findings: number;
    highRisk: number;
    status: "Audit in progress" | "Leadership attention" | "Controlled with actions" | "Process assured";
  };
  findings: Array<{
    id: string;
    category: string;
    requirement: string;
    reference: string;
    severity: "low" | "medium" | "high" | "critical";
    observation: string;
    containment: string;
    owner: string;
    dueDate: string;
    evidenceNames: string[];
    recommendedHandoff: string;
  }>;
  questions: Array<{ answer: "" | "yes" | "no" | "na" }>;
};

type BridgeNotice = { tone: "success" | "error"; message: string } | null;

export function ProcessAssuranceCloudBridge() {
  const cloud = useCloudWorkspace();
  const [notice, setNotice] = useState<BridgeNotice>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const organizationId = cloud.organizationId;
    const organizationName = cloud.organizationName;
    const user = cloud.user;
    const cloudReady = cloud.status === "ready" && Boolean(organizationId && user);

    async function persist(event: Event) {
      const payload = (event as CustomEvent<ProcessAssurancePayload>).detail;
      if (!payload || payload.schema !== "qmspilot.northstar.process-assurance.v1") return;
      if (!cloudReady || !organizationId || !user) return;

      const supabase = createClient() as any;
      if (!supabase) return;

      try {
        const applicable = payload.questions.filter((item) => item.answer === "yes" || item.answer === "no").length;
        const { data: audit, error: auditError } = await supabase
          .from("process_assurance_audits")
          .upsert({
            record_id: payload.recordId,
            organization_id: organizationId,
            created_by: user.id,
            organization_name: payload.setup.organization || organizationName,
            site: payload.setup.site,
            department: payload.setup.department,
            process_name: payload.setup.process,
            shift_name: payload.setup.shift,
            auditor_name: payload.setup.auditor,
            audit_date: payload.setup.auditDate,
            audit_layer: payload.setup.layer,
            standard_reference: payload.setup.standardReference,
            leadership_note: payload.setup.leadershipNote,
            score: payload.metrics.score,
            answered_count: payload.metrics.answered,
            applicable_count: applicable,
            finding_count: payload.metrics.findings,
            high_risk_count: payload.metrics.highRisk,
            assurance_status: payload.metrics.status,
            payload,
            submitted_at: payload.submittedAt,
            updated_at: new Date().toISOString(),
          }, { onConflict: "record_id" })
          .select("id")
          .single();

        if (auditError) throw auditError;
        if (!audit?.id) throw new Error("Northstar did not return the Process Assurance record ID.");

        if (payload.findings.length > 0) {
          const findingRows = payload.findings.map((finding) => ({
            organization_id: organizationId,
            audit_id: audit.id,
            question_id: finding.id,
            category: finding.category,
            requirement: finding.requirement,
            requirement_reference: finding.reference,
            severity: finding.severity,
            observation: finding.observation,
            containment: finding.containment,
            owner_name: finding.owner,
            due_date: finding.dueDate,
            recommended_handoff: finding.recommendedHandoff,
            status: "open",
            created_by: user.id,
            updated_at: new Date().toISOString(),
          }));
          const { error: findingsError } = await supabase
            .from("process_assurance_findings")
            .upsert(findingRows, { onConflict: "audit_id,question_id" });
          if (findingsError) throw findingsError;
        }

        const syncedAt = new Date().toISOString();
        window.localStorage.setItem("qmspilot:process-assurance:last-cloud-sync", JSON.stringify({
          recordId: payload.recordId,
          auditId: audit.id,
          syncedAt,
        }));
        window.dispatchEvent(new CustomEvent("qmspilot:northstar-submit-result", {
          detail: { recordId: payload.recordId, auditId: audit.id, status: "cloud-saved", syncedAt },
        }));
        setNotice({ tone: "success", message: `${payload.recordId} is protected in the Northstar cloud workspace.` });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Process Assurance could not sync to Secure cloud.";
        window.dispatchEvent(new CustomEvent("qmspilot:northstar-submit-result", {
          detail: { recordId: payload.recordId, status: "cloud-error", message },
        }));
        setNotice({ tone: "error", message });
      }

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setNotice(null), 6500);
    }

    window.addEventListener("qmspilot:northstar-submit", persist);
    return () => {
      window.removeEventListener("qmspilot:northstar-submit", persist);
      if (timeout) clearTimeout(timeout);
    };
  }, [cloud.organizationId, cloud.organizationName, cloud.status, cloud.user]);

  if (!notice) return null;
  return (
    <div style={{
      position: "fixed", right: 20, bottom: 20, zIndex: 900, width: "min(430px,calc(100vw - 40px))",
      display: "flex", alignItems: "flex-start", gap: 10, padding: 15, borderRadius: 14,
      border: notice.tone === "success" ? "1px solid #8fd0b3" : "1px solid #e4a4ad",
      color: notice.tone === "success" ? "#155f45" : "#8e2634",
      background: notice.tone === "success" ? "#effbf6" : "#fff2f4",
      boxShadow: "0 18px 48px rgba(8,34,58,.2)", fontSize: 12, fontWeight: 800,
    }}>
      {notice.tone === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
      <span style={{ flex: 1 }}><Cloud size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />{notice.message}</span>
      <button onClick={() => setNotice(null)} aria-label="Dismiss" style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 18 }}>×</button>
    </div>
  );
}
