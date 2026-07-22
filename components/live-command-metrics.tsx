"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";

type CommandEvent = {
  severity?: string;
  financial_exposure?: number | string | null;
  revenue_exposure?: number | string | null;
};

type CommandAction = { action_status?: string };
type CommandRecommendation = { recommendation_status?: string };
type CommandWriteback = { writeback_status?: string };
type CommandValue = {
  verified_realized_value?: number | string | null;
  net_realized_value?: number | string | null;
  qmspilot_roi?: number | string | null;
};

type CommandPayload = {
  events?: CommandEvent[];
  actions?: CommandAction[];
  recommendations?: CommandRecommendation[];
  writebacks?: CommandWriteback[];
  value?: CommandValue;
  error?: string;
};

function money(value: unknown) {
  return Number(value || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const demonstration: CommandPayload = {
  events: [
    { severity: "critical", financial_exposure: 28200, revenue_exposure: 180000 },
    { severity: "critical", financial_exposure: 5600, revenue_exposure: 306000 },
    { severity: "critical", financial_exposure: 62000, revenue_exposure: 180000 },
  ],
  actions: [{ action_status: "in_progress" }, { action_status: "blocked" }],
  recommendations: [{ recommendation_status: "pending_approval" }],
  writebacks: [{ writeback_status: "awaiting_human" }],
  value: { verified_realized_value: 18375, net_realized_value: 6675, qmspilot_roi: 0.12 },
};

export function LiveCommandMetrics() {
  const cloud = useCloudWorkspace();
  const [payload, setPayload] = useState<CommandPayload>(demonstration);
  const [mode, setMode] = useState<"demo" | "secure">("demo");
  const [notice, setNotice] = useState("Design-partner connected operating scenario loaded.");
  const [busy, setBusy] = useState(false);

  async function synchronize() {
    const token = await cloud.getAccessToken();
    if (!token) {
      setNotice("Sign in to Northstar Secure to activate live executive metrics.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/command-center", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json() as CommandPayload;
      if (!response.ok) throw new Error(result.error || "Command Center data could not be loaded.");
      if (!result.events?.length) {
        setNotice("Northstar Secure is connected. Submit a controlled tool record to create live executive intelligence.");
        return;
      }
      setPayload(result);
      setMode("secure");
      setNotice(`${result.events.length} live operating events synchronized from Northstar Secure.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Command Center synchronization failed.");
    } finally {
      setBusy(false);
    }
  }

  const events = payload.events || [];
  const actions = payload.actions || [];
  const recommendations = payload.recommendations || [];
  const writebacks = payload.writebacks || [];
  const critical = events.filter((event) => event.severity === "critical").length;
  const high = events.filter((event) => event.severity === "high").length;
  const revenue = events.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const financial = events.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const openActions = actions.filter((action) => !["done", "rejected"].includes(action.action_status || "")).length;
  const blocked = actions.filter((action) => action.action_status === "blocked").length;
  const decisions = recommendations.filter((item) => item.recommendation_status === "pending_approval").length;
  const pendingWritebacks = writebacks.filter((item) => !["executed", "rejected"].includes(item.writeback_status || "")).length;

  const metrics: Array<[string, string | number, string]> = [
    ["Critical events", critical, `${high} additional high priority`],
    ["Revenue exposure", money(revenue), "Never counted as savings"],
    ["Financial exposure", money(financial), "Connected operating loss and risk"],
    ["Open actions", openActions, `${blocked} blocked`],
    ["Human decisions", decisions, "Recommendations awaiting approval"],
    ["Writebacks", pendingWritebacks, "Awaiting target-tool execution"],
    ["Verified value", money(payload.value?.verified_realized_value), `${money(payload.value?.net_realized_value)} net realized`],
    ["QMSPilot ROI", `${Number(payload.value?.qmspilot_roi || 0).toFixed(2)}x`, "Value Ledger basis"],
  ];

  return (
    <section className="live-command-block">
      <div className="live-command-toolbar">
        <button type="button" onClick={synchronize} disabled={busy}>
          <RefreshCw size={16} /> {busy ? "Synchronizing..." : "Sync live Northstar data"}
        </button>
        <span className={`live-mode ${mode}`}>{mode === "secure" ? "Live Northstar Secure" : "Design-partner demonstration"}</span>
      </div>
      <div className="live-command-notice"><Activity size={17} />{notice}</div>
      <div className="live-metric-grid">
        {metrics.map(([label, value, note]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
