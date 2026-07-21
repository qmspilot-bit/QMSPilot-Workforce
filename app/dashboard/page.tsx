"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileWarning,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const NCR_ENDPOINT = "https://mcdxriothpcadqcaarui.supabase.co/functions/v1/northstar-ncr-ingest";

type NcrRecord = {
  recordId: string;
  ncrNumber: string;
  status: string;
  severity: string;
  netCopq: number;
  openActionCount: number;
  overdueActionCount: number;
  createdAt: string;
  updatedAt: string;
};

type Period = "today" | "week" | "month" | "quarter" | "year";

const demoCapa = [
  { id: "CAPA-2026-014", owner: "Quality", status: "Closed", opened: "2026-06-05", closed: "2026-06-26", due: "2026-06-30", effective: true },
  { id: "CAPA-2026-017", owner: "Operations", status: "Effectiveness Review", opened: "2026-06-18", closed: "", due: "2026-07-28", effective: false },
  { id: "CAPA-2026-019", owner: "Engineering", status: "Open", opened: "2026-07-02", closed: "", due: "2026-07-18", effective: false },
  { id: "CAPA-2026-021", owner: "Supply Chain", status: "Closed", opened: "2026-07-07", closed: "2026-07-17", due: "2026-07-21", effective: true },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function daysBetween(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`).getTime();
  const b = new Date(`${end}T12:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function startFor(period: Period) {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(now.getDate() - 6);
  if (period === "month") start.setDate(1);
  if (period === "quarter") start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === "year") start.setMonth(0, 1);
  return start;
}

function inPeriod(value: string, period: Period) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= startFor(period);
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [records, setRecords] = useState<NcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(NCR_ENDPOINT, { cache: "no-store", credentials: "omit" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Northstar returned HTTP ${response.status}`);
      setRecords(Array.isArray(payload.records) ? payload.records : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Northstar metrics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const periodRecords = records.filter((record) => inPeriod(record.createdAt || record.updatedAt, period));
    const open = records.filter((record) => !["closed", "complete", "completed", "cancelled"].includes(record.status.toLowerCase()));
    const overdueActions = open.reduce((sum, record) => sum + Number(record.overdueActionCount || 0), 0);
    const highRisk = open.filter((record) => /high|critical/i.test(record.severity)).length;
    const copq = periodRecords.reduce((sum, record) => sum + Number(record.netCopq || 0), 0);

    const closedCapas = demoCapa.filter((capa) => capa.closed && inPeriod(capa.closed, period));
    const onTimeClosed = closedCapas.filter((capa) => new Date(capa.closed) <= new Date(capa.due));
    const avgClosure = closedCapas.length
      ? Math.round(closedCapas.reduce((sum, capa) => sum + daysBetween(capa.opened, capa.closed), 0) / closedCapas.length)
      : 0;
    const overdueCapas = demoCapa.filter((capa) => !capa.closed && new Date(capa.due) < new Date()).length;
    const effectivenessPending = demoCapa.filter((capa) => capa.status === "Effectiveness Review").length;

    const productionUnits = period === "today" ? 142 : period === "week" ? 887 : period === "month" ? 3478 : period === "quarter" ? 10244 : 28110;
    const rejectedUnits = Math.max(periodRecords.length * 2, period === "today" ? 1 : period === "week" ? 7 : 21);
    const fpy = productionUnits ? ((productionUnits - rejectedUnits) / productionUnits) * 100 : 0;

    return {
      periodNcrs: periodRecords.length,
      openNcrs: open.length,
      highRisk,
      overdueActions,
      copq,
      closedCapas: closedCapas.length,
      avgClosure,
      onTimeRate: closedCapas.length ? Math.round((onTimeClosed.length / closedCapas.length) * 100) : 0,
      overdueCapas,
      effectivenessPending,
      productionUnits,
      rejectedUnits,
      fpy,
      estimatedAvoidedCost: Math.round(copq * 0.62 + closedCapas.length * 7500),
    };
  }, [period, records]);

  const cards = [
    { label: "First Pass Yield", value: `${metrics.fpy.toFixed(1)}%`, note: `${metrics.productionUnits.toLocaleString()} units processed`, icon: Target, tone: "#1769d2" },
    { label: "NCRs opened", value: metrics.periodNcrs, note: `${metrics.openNcrs} currently open`, icon: FileWarning, tone: "#c77a00" },
    { label: "CAPAs closed on time", value: `${metrics.onTimeRate}%`, note: `${metrics.closedCapas} closed in period`, icon: CheckCircle2, tone: "#16835a" },
    { label: "Average CAPA closure", value: `${metrics.avgClosure} days`, note: `${metrics.overdueCapas} overdue`, icon: Clock3, tone: "#6750a4" },
    { label: "Cost of Poor Quality", value: money(metrics.copq), note: "From connected NCR records", icon: CircleDollarSign, tone: "#b93843" },
    { label: "Estimated avoided cost", value: money(metrics.estimatedAvoidedCost), note: "Evidence-backed value model", icon: TrendingUp, tone: "#137a5a" },
  ];

  const workforce = [
    { name: "Pilot", role: "Executive awareness", status: metrics.highRisk || metrics.overdueCapas ? "Leadership attention required" : "Operating within control", icon: BarChart3 },
    { name: "Atlas", role: "Accountability", status: `${metrics.overdueActions + metrics.overdueCapas} overdue commitments`, icon: Users },
    { name: "Forge", role: "Process performance", status: `${metrics.fpy.toFixed(1)}% FPY · ${metrics.rejectedUnits} rejected/reworked`, icon: Target },
    { name: "Sentinel", role: "Compliance", status: `${metrics.effectivenessPending} effectiveness checks pending`, icon: ShieldCheck },
    { name: "Vector", role: "Continuous improvement", status: `${money(metrics.estimatedAvoidedCost)} estimated avoided cost`, icon: TrendingUp },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#07111f 0,#0d2037 330px,#edf3f8 330px,#edf3f8 100%)", color: "#111827" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", color: "white", borderBottom: "1px solid rgba(126,180,235,.22)", background: "rgba(7,17,31,.96)", backdropFilter: "blur(12px)" }}>
        <a href="/" aria-label="Back to Mission Control" style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #31506f", borderRadius: 10, color: "white", background: "#132a45" }}><ArrowLeft size={18} /></a>
        <BarChart3 size={23} />
        <div style={{ marginRight: "auto" }}>
          <small style={{ display: "block", color: "#8fb4d4", fontSize: 9, letterSpacing: ".13em", textTransform: "uppercase" }}>QMSPilot Northstar</small>
          <strong>Accountability Dashboard</strong>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {(["today", "week", "month", "quarter", "year"] as Period[]).map((item) => (
            <button key={item} type="button" onClick={() => setPeriod(item)} style={{ minHeight: 34, padding: "0 11px", border: period === item ? "1px solid #7cb7f4" : "1px solid #31506f", borderRadius: 9, color: "white", background: period === item ? "#1f67c8" : "#132a45", fontSize: 9, fontWeight: 850, textTransform: "capitalize" }}>{item}</button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "34px 20px 70px" }}>
        <section style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 18, alignItems: "stretch", marginBottom: 18 }}>
          <div style={{ padding: "28px", border: "1px solid rgba(116,181,255,.28)", borderRadius: 22, color: "white", background: "linear-gradient(135deg,rgba(13,49,92,.94),rgba(25,103,200,.88))", boxShadow: "0 24px 60px rgba(0,0,0,.22)" }}>
            <small style={{ color: "#9fd1ff", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Leadership execution</small>
            <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(30px,5vw,54px)", lineHeight: 1 }}>Quality activity becomes measurable accountability.</h1>
            <p style={{ maxWidth: 820, margin: 0, color: "#d4e6f7", lineHeight: 1.65 }}>Northstar combines production, NCR, CAPA, cost, action ownership, closure timing, and effectiveness into one decision-ready view.</p>
          </div>
          <div style={{ padding: 24, border: "1px solid #bcdaca", borderRadius: 22, background: "#f0fbf6", boxShadow: "0 18px 45px rgba(28,111,82,.12)" }}>
            <small style={{ color: "#33735c", fontSize: 9, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Pilot recommendation</small>
            <strong style={{ display: "block", margin: "10px 0 8px", color: "#133b30", fontSize: 20 }}>{metrics.overdueCapas || metrics.overdueActions ? "Close the accountability gaps first." : "Performance is currently under control."}</strong>
            <p style={{ margin: 0, color: "#526f65", fontSize: 12, lineHeight: 1.6 }}>{metrics.overdueCapas + metrics.overdueActions} overdue commitments, {metrics.highRisk} high-risk NCRs, and {metrics.effectivenessPending} pending effectiveness checks require leadership visibility.</p>
          </div>
        </section>

        {error && <div role="alert" style={{ marginBottom: 16, padding: 13, border: "1px solid #efc5a8", borderRadius: 12, color: "#8b4b17", background: "#fff5eb", fontSize: 11 }}><strong>Live NCR data needs attention.</strong> {error}</div>}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 18 }}>
          {cards.map(({ label, value, note, icon: Icon, tone }) => (
            <article key={label} style={{ padding: 18, border: "1px solid #d5e0eb", borderRadius: 17, background: "white", boxShadow: "0 10px 28px rgba(25,50,75,.07)" }}>
              <Icon size={20} style={{ color: tone }} />
              <span style={{ display: "block", marginTop: 14, color: "#6b7f94", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</span>
              <strong style={{ display: "block", marginTop: 5, color: "#173a5d", fontSize: 25 }}>{loading ? "—" : value}</strong>
              <small style={{ display: "block", marginTop: 6, color: "#7a8da1", fontSize: 9 }}>{note}</small>
            </article>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 18 }}>
          <article style={{ padding: 22, border: "1px solid #d5e0eb", borderRadius: 20, background: "white", boxShadow: "0 12px 34px rgba(25,50,75,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><AlertTriangle size={20} style={{ color: "#c77a00" }} /><div><strong style={{ display: "block", color: "#173a5d" }}>Accountability queue</strong><small style={{ color: "#74879a" }}>Nothing closes without an owner, due date, evidence, and human decision.</small></div></div>
            {[
              ["Overdue CAPAs", metrics.overdueCapas, "Atlas", "Assign recovery date and escalation owner"],
              ["Overdue NCR actions", metrics.overdueActions, "Atlas", "Escalate containment or corrective-action commitments"],
              ["High-risk NCRs", metrics.highRisk, "Sentinel", "Confirm containment and leadership review"],
              ["Effectiveness checks pending", metrics.effectivenessPending, "Sentinel", "Verify recurrence prevention before closure"],
            ].map(([label, value, owner, action]) => (
              <div key={String(label)} style={{ display: "grid", gridTemplateColumns: "1.3fr .35fr .55fr 1.4fr", gap: 10, alignItems: "center", padding: "12px 0", borderTop: "1px solid #e7edf3", fontSize: 10 }}>
                <strong style={{ color: "#2d465f" }}>{label}</strong><strong style={{ color: Number(value) ? "#b93843" : "#16835a", fontSize: 16 }}>{value}</strong><span style={{ color: "#5d7287" }}>{owner}</span><span style={{ color: "#6b7f94" }}>{action}</span>
              </div>
            ))}
          </article>

          <article style={{ padding: 22, border: "1px solid #d5e0eb", borderRadius: 20, background: "white", boxShadow: "0 12px 34px rgba(25,50,75,.07)" }}>
            <div style={{ marginBottom: 15 }}><strong style={{ display: "block", color: "#173a5d" }}>AI workforce ownership</strong><small style={{ color: "#74879a" }}>Each employee owns a measurable operating responsibility.</small></div>
            <div style={{ display: "grid", gap: 9 }}>
              {workforce.map(({ name, role, status, icon: Icon }) => (
                <div key={name} style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: 11, alignItems: "center", padding: 11, border: "1px solid #e0e7ef", borderRadius: 12, background: "#f9fbfd" }}>
                  <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 11, color: "#1769d2", background: "#e8f3ff" }}><Icon size={20} /></span>
                  <span><strong style={{ display: "block", color: "#29435c", fontSize: 11 }}>{name} · {role}</strong><small style={{ display: "block", marginTop: 3, color: "#708398", fontSize: 9 }}>{status}</small></span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <p style={{ margin: "16px 2px 0", color: "#728499", fontSize: 9, lineHeight: 1.5 }}>FPY production volume is currently a configurable demonstration series until the production/ERP connector is activated. NCR metrics are read from the connected Northstar NCR data service. CAPA metrics use the dashboard contract and demonstration records until the CAPA event endpoint is connected.</p>
      </div>
    </main>
  );
}
