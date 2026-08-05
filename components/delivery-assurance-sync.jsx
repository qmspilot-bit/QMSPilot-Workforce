"use client";

import { useEffect, useRef } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

const DRAFT_KEY = "qmspilot:delivery-assurance:draft";
const SYNC_INTERVAL_MS = 900;
const PULL_INTERVAL_MS = 12000;

function parseDraft(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDraft(draft, savedAt = new Date().toISOString()) {
  return {
    ...draft,
    kind: "delivery-assurance-draft",
    syncVersion: 1,
    savedAt,
  };
}

function draftRecordId(userId) {
  return `NDA-DRAFT-${userId}`.slice(0, 48);
}

function summarizeDraft(draft) {
  const activeOrders = Array.isArray(draft.orders)
    ? draft.orders.filter((order) => !order?.archived)
    : [];
  const readinessValues = activeOrders.map((order) => {
    const readiness = order?.readiness || {};
    const values = ["material", "workforce", "equipment", "documents", "quality"]
      .map((key) => Number(readiness[key] || 0));
    return values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;
  });
  const averageReadiness = readinessValues.length
    ? Math.round(readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length)
    : 0;
  const openBlockers = Array.isArray(draft.blockers)
    ? draft.blockers.filter((blocker) => blocker?.status !== "closed").length
    : 0;
  const revenueScheduled = activeOrders.reduce(
    (sum, order) => sum + Number(order?.orderValue || 0),
    0,
  );

  return {
    activeOrders: activeOrders.length,
    averageReadiness: Math.max(0, Math.min(100, averageReadiness)),
    openBlockers,
    revenueScheduled: Math.max(0, revenueScheduled),
  };
}

export default function DeliveryAssuranceSync() {
  const cloud = useCloudWorkspace();
  const lastLocalValue = useRef(null);
  const initialized = useRef(false);
  const writing = useRef(false);

  useEffect(() => {
    if (cloud.status !== "ready" || !cloud.organizationId || !cloud.user?.id) return undefined;

    const supabase = createClient();
    if (!supabase) return undefined;

    let cancelled = false;
    const recordId = draftRecordId(cloud.user.id);

    async function pushDraft(draft) {
      if (!draft || writing.current) return;
      writing.current = true;
      const summary = summarizeDraft(draft);
      const now = draft.savedAt || new Date().toISOString();

      try {
        const { error } = await supabase
          .from("delivery_assurance_snapshots")
          .upsert({
            record_id: recordId,
            organization_id: cloud.organizationId,
            created_by: cloud.user.id,
            organization_name: draft.setup?.organization || cloud.organizationName || "QMSPilot Organization",
            site: draft.setup?.site || "Northstar Secure Draft",
            assurance_date: now.slice(0, 10),
            assurance_score: summary.averageReadiness,
            active_orders: summary.activeOrders,
            orders_at_risk: 0,
            late_orders: 0,
            revenue_scheduled: summary.revenueScheduled,
            revenue_at_risk: 0,
            average_readiness: summary.averageReadiness,
            open_blockers: summary.openBlockers,
            payload: draft,
            submitted_at: now,
            updated_at: now,
          }, { onConflict: "record_id" });

        if (error) console.error("Delivery Assurance cloud draft sync failed", error);
      } finally {
        writing.current = false;
      }
    }

    async function pullDraft({ allowReload = true } = {}) {
      const { data, error } = await supabase
        .from("delivery_assurance_snapshots")
        .select("payload, updated_at")
        .eq("organization_id", cloud.organizationId)
        .eq("created_by", cloud.user.id)
        .eq("record_id", recordId)
        .maybeSingle();

      if (cancelled || error || !data?.payload) return false;

      const localRaw = window.localStorage.getItem(DRAFT_KEY);
      const localDraft = parseDraft(localRaw);
      const cloudDraft = data.payload;
      const localTime = timestamp(localDraft?.savedAt);
      const cloudTime = timestamp(cloudDraft?.savedAt || data.updated_at);

      if (!localDraft || (localTime > 0 && cloudTime > localTime)) {
        const restored = normalizeDraft(cloudDraft, cloudDraft.savedAt || data.updated_at);
        const restoredRaw = JSON.stringify(restored);
        lastLocalValue.current = restoredRaw;
        window.localStorage.setItem(DRAFT_KEY, restoredRaw);
        if (allowReload) window.location.reload();
        return true;
      }

      return false;
    }

    async function reconcile() {
      const localRaw = window.localStorage.getItem(DRAFT_KEY);
      const localDraft = parseDraft(localRaw);
      const restored = await pullDraft({ allowReload: true });
      if (cancelled || restored) return;

      if (localDraft) {
        const normalized = localDraft.savedAt
          ? localDraft
          : normalizeDraft(localDraft);
        const normalizedRaw = JSON.stringify(normalized);
        lastLocalValue.current = normalizedRaw;
        if (normalizedRaw !== localRaw) window.localStorage.setItem(DRAFT_KEY, normalizedRaw);
        await pushDraft(normalized);
      } else {
        lastLocalValue.current = null;
      }

      initialized.current = true;
    }

    void reconcile();

    const localTimer = window.setInterval(() => {
      if (!initialized.current || writing.current) return;
      const localRaw = window.localStorage.getItem(DRAFT_KEY);
      if (!localRaw || localRaw === lastLocalValue.current) return;

      const localDraft = parseDraft(localRaw);
      if (!localDraft) return;

      const normalized = normalizeDraft(localDraft);
      const normalizedRaw = JSON.stringify(normalized);
      lastLocalValue.current = normalizedRaw;
      window.localStorage.setItem(DRAFT_KEY, normalizedRaw);
      void pushDraft(normalized);
    }, SYNC_INTERVAL_MS);

    const cloudTimer = window.setInterval(() => {
      if (!initialized.current || writing.current || document.visibilityState !== "visible") return;
      void pullDraft({ allowReload: true });
    }, PULL_INTERVAL_MS);

    const handleFocus = () => {
      if (initialized.current && !writing.current) void pullDraft({ allowReload: true });
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(localTimer);
      window.clearInterval(cloudTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [cloud.status, cloud.organizationId, cloud.organizationName, cloud.user?.id]);

  return null;
}
