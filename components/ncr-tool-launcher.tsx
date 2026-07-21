"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  FileWarning,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const MANAGEMENT_ENDPOINT = "https://mcdxriothpcadqcaarui.supabase.co/functions/v1/northstar-ncr-ingest";

type NcrRecord = {
  recordId: string;
  ncrNumber: string;
  status: string;
  organizationName: string;
  site: string;
  submittedBy: string;
  recordOwner: string;
  severity: string;
  recurrence: string;
  description: string;
  part: string;
  partNumber: string;
  customer: string;
  qtyAffected: number;
  qtyInspected: number;
  containmentStatus: string;
  disposition: string;
  dispositionOwner: string;
  dispositionDueDate: string;
  netCopq: number;
  scheduleImpactDays: number;
  actionCount: number;
  openActionCount: number;
  overdueActionCount: number;
  effectivenessResult: string;
  effectivenessTargetDate: string;
  sourceApp: string;
  createdAt: string;
  updatedAt: string;
};

type ManagementResponse = {
  ok?: boolean;
  generatedAt?: string;
  records?: NcrRecord[];
  error?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function dateLabel(value: string) {
  if (!value) return "Not set";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function timeLabel(value: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isClosed(status: string) {
  return ["closed", "cancelled", "complete", "completed"].includes(status.trim().toLowerCase());
}

function severityColors(severity: string) {
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("high")) {
    return { background: "#ffe6e8", color: "#a22632", border: "#f2b8be" };
  }
  if (normalized.includes("medium")) {
    return { background: "#fff2d8", color: "#8a5600", border: "#edd19b" };
  }
  return { background: "#e8f3ff", color: "#0b5caf", border: "#c5ddf6" };
}

function statusColors(status: string) {
  if (isClosed(status)) return { background: "#dcf7eb", color: "#0b6947" };
  if (status.toLowerCase().includes("progress")) return { background: "#e7f2ff", color: "#0758b8" };
  return { background: "#fff2d8", color: "#8a5600" };
}

export function NcrToolLauncher() {
  const pathname = usePathname();
  const [records, setRecords] = useState<NcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [expanded, setExpanded] = useState(true);

  const loadRecords = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(MANAGEMENT_ENDPOINT, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      });
      const payload = await response.json() as ManagementResponse;
      if (!response.ok) throw new Error(payload.error || `Northstar returned HTTP ${response.status}`);
      setRecords(Array.isArray(payload.records) ? payload.records : []);
      setLastSync(payload.generatedAt || new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "NCR records could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    void loadRecords();
    const interval = window.setInterval(() => void loadRecords(), 30_000);
    return () => window.clearInterval(interval);
  }, [loadRecords, pathname]);

  const metrics = useMemo(() => {
    const active = records.filter((record) => !isClosed(record.status));
    const highRisk = active.filter((record) => {
      const severity = record.severity.toLowerCase();
      return severity.includes("high") || severity.includes("critical");
    });
    return {
      open: active.length,
      highRisk: highRisk.length,
      overdue: active.reduce((sum, record) => sum + record.overdueActionCount, 0),
      copq: records.reduce((sum, record) => sum + record.netCopq, 0),
    };
  }, [records]);

  if (pathname !== "/") return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Open NCR management dashboard"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 15px",
          border: "1px solid rgba(116,181,255,.45)",
          borderRadius: 14,
          background: "linear-gradient(135deg,#071d35,#0b4f91)",
          color: "white",
          boxShadow: "0 18px 42px rgba(7,29,53,.3)",
          fontWeight: 850,
        }}
      >
        <FileWarning size={20} />
        NCR Management
        <span style={{ minWidth: 25, padding: "3px 7px", borderRadius: 999, background: "rgba(255,255,255,.14)", fontSize: 11 }}>{metrics.open}</span>
        <ChevronUp size={17} />
      </button>
    );
  }

  return (
    <section
      aria-label="Northstar NCR management dashboard"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 60,
        width: "min(410px, calc(100vw - 24px))",
        maxHeight: "min(760px, calc(100vh - 40px))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(116,181,255,.42)",
        borderRadius: 18,
        background: "#f7faff",
        color: "#111827",
        boxShadow: "0 24px 64px rgba(7,29,53,.34)",
      }}
    >
      <header style={{ padding: "16px 17px 14px", color: "white", background: "linear-gradient(135deg,#071d35,#0b4f91)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "rgba(255,255,255,.12)" }}>
              <ShieldCheck size={23} />
            </span>
            <span>
              <small style={{ display: "block", marginBottom: 3, color: "#9fc9f4", fontSize: 9, fontWeight: 900, letterSpacing: ".11em", textTransform: "uppercase" }}>Management view</small>
              <strong style={{ display: "block", fontSize: 16 }}>Northstar NCR Dashboard</strong>
              <small style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#c4dcf5", fontSize: 10 }}>
                <i style={{ width: 7, height: 7, borderRadius: "50%", background: error ? "#f1a03f" : "#45d49f", boxShadow: `0 0 0 4px ${error ? "rgba(241,160,63,.13)" : "rgba(69,212,159,.13)"}` }} />
                {error ? "Connection needs attention" : "Live Northstar records"}
              </small>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Collapse NCR dashboard"
            style={{ width: 32, height: 32, display: "grid", placeItems: "center", border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, background: "rgba(255,255,255,.08)", color: "white" }}
          >
            <ChevronDown size={17} />
          </button>
        </div>
      </header>

      <div style={{ overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", borderBottom: "1px solid #dbe5ef", background: "white" }}>
          {[
            ["Open", metrics.open, FileWarning, "#0b5fc6"],
            ["High risk", metrics.highRisk, AlertTriangle, "#b93843"],
            ["Overdue", metrics.overdue, Clock3, "#a66a00"],
            ["COPQ", money(metrics.copq), CircleDollarSign, "#137a5a"],
          ].map(([label, value, Icon, color]) => {
            const MetricIcon = Icon as typeof FileWarning;
            return (
              <div key={label as string} style={{ minWidth: 0, padding: "12px 8px", textAlign: "center", borderRight: label === "COPQ" ? 0 : "1px solid #e3eaf2" }}>
                <MetricIcon size={16} style={{ margin: "0 auto 5px", color: color as string }} />
                <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", fontSize: typeof value === "string" && value.length > 6 ? 12 : 17, color: "#173a5d" }}>{value as string | number}</strong>
                <span style={{ display: "block", marginTop: 2, color: "#6b7f94", fontSize: 8, fontWeight: 800, textTransform: "uppercase" }}>{label as string}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "13px 14px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 9 }}>
            <div>
              <strong style={{ display: "block", fontSize: 12 }}>Current NCR records</strong>
              <small style={{ display: "block", marginTop: 3, color: "#6b7f94", fontSize: 9 }}>Newest activity first · refreshes every 30 seconds</small>
            </div>
            <button
              type="button"
              onClick={() => void loadRecords(true)}
              disabled={refreshing}
              aria-label="Refresh NCR records"
              style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid #cbd8e5", borderRadius: 9, background: "white", color: "#31506e" }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : undefined }} />
            </button>
          </div>

          {error && (
            <div role="alert" style={{ marginBottom: 9, padding: "10px 11px", border: "1px solid #efc5a8", borderRadius: 10, background: "#fff5eb", color: "#8b4b17", fontSize: 10, lineHeight: 1.45 }}>
              <strong style={{ display: "block", marginBottom: 3 }}>Dashboard could not refresh</strong>
              {error}
            </div>
          )}

          {loading && records.length === 0 ? (
            <div style={{ padding: "24px 12px", color: "#64788d", textAlign: "center", fontSize: 11 }}>Loading live Northstar NCR records…</div>
          ) : records.length === 0 ? (
            <div style={{ padding: "24px 12px", color: "#64788d", textAlign: "center", fontSize: 11 }}>No NCR records have been submitted yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 9 }}>
              {records.slice(0, 5).map((record) => {
                const severity = severityColors(record.severity);
                const status = statusColors(record.status);
                return (
                  <article key={record.recordId} style={{ overflow: "hidden", border: "1px solid #d5e0eb", borderRadius: 12, background: "white", boxShadow: "0 5px 15px rgba(25,50,75,.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "11px 12px 9px", borderBottom: "1px solid #edf1f5" }}>
                      <div style={{ minWidth: 0 }}>
                        <small style={{ display: "block", color: "#0b5fc6", fontSize: 9, fontWeight: 900 }}>{record.recordId}</small>
                        <strong style={{ display: "block", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{record.ncrNumber}</strong>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                        <span style={{ padding: "5px 7px", borderRadius: 999, background: severity.background, color: severity.color, border: `1px solid ${severity.border}`, fontSize: 8, fontWeight: 900 }}>{record.severity.split(" - ")[0]}</span>
                        <span style={{ padding: "5px 7px", borderRadius: 999, background: status.background, color: status.color, fontSize: 8, fontWeight: 900 }}>{record.status}</span>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#243c54", fontSize: 11 }}>{record.part || "Nonconforming output"}{record.partNumber ? ` · ${record.partNumber}` : ""}</strong>
                      <p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: "6px 0 9px", color: "#66798d", fontSize: 9, lineHeight: 1.45 }}>{record.description || "No issue summary provided."}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 7 }}>
                        <span style={{ minWidth: 0, padding: "7px", borderRadius: 8, background: "#f5f8fb" }}><small style={{ display: "block", color: "#728499", fontSize: 7, fontWeight: 850, textTransform: "uppercase" }}>Owner</small><strong style={{ display: "block", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 9 }}>{record.recordOwner}</strong></span>
                        <span style={{ minWidth: 0, padding: "7px", borderRadius: 8, background: record.overdueActionCount ? "#fff3e5" : "#f5f8fb" }}><small style={{ display: "block", color: "#728499", fontSize: 7, fontWeight: 850, textTransform: "uppercase" }}>Actions</small><strong style={{ display: "block", marginTop: 3, fontSize: 9 }}>{record.openActionCount} open{record.overdueActionCount ? ` · ${record.overdueActionCount} late` : ""}</strong></span>
                        <span style={{ minWidth: 0, padding: "7px", borderRadius: 8, background: "#f5f8fb" }}><small style={{ display: "block", color: "#728499", fontSize: 7, fontWeight: 850, textTransform: "uppercase" }}>COPQ</small><strong style={{ display: "block", marginTop: 3, fontSize: 9 }}>{money(record.netCopq)}</strong></span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8, color: "#718397", fontSize: 8 }}>
                        <span>Disposition: <strong style={{ color: "#425a70" }}>{record.disposition}</strong>{record.dispositionDueDate ? ` · due ${dateLabel(record.dispositionDueDate)}` : ""}</span>
                        <span>Updated {timeLabel(record.updatedAt)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "11px 14px 13px", borderTop: "1px solid #dbe5ef", background: "white" }}>
        <a
          href="/tools/ncr"
          target="_blank"
          rel="noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 39, padding: "0 12px", borderRadius: 10, background: "linear-gradient(135deg,#0b5fc6,#0b4f91)", color: "white", textDecoration: "none", fontSize: 10, fontWeight: 850 }}
        >
          <FileWarning size={16} />Open NCR Microtool<ExternalLink size={14} />
        </a>
        <span style={{ alignSelf: "center", color: "#7a8da1", fontSize: 8, textAlign: "right" }}>Last sync<br /><strong>{timeLabel(lastSync)}</strong></span>
      </footer>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
