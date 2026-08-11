"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, ListChecks, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { NorthstarPrimaryRail } from "@/components/northstar-primary-rail";
import { createClient } from "@/lib/supabase/client";

type ActionRow = {
  source: "workforce" | "tool";
  id: string;
  title: string;
  owner_name: string;
  due_date: string | null;
  priority: string;
  action_status: string;
  target_tool: string;
  target_record: string;
  verification_required: string;
  progress_note: string;
};

const toolPaths: Record<string, string> = {
  "asset-reliability": "/tools/asset-reliability",
  "controlled-change": "/tools/controlled-change",
  "customer-assurance": "/tools/customer-assurance",
  "daily-operations": "/tools/daily-operations",
  "delivery-assurance": "/tools/delivery-assurance",
  "measurement-assurance": "/tools/measurement-assurance",
  "process-assurance": "/tools/process-assurance",
  "supplier-assurance": "/tools/supplier-assurance",
  "value-ledger": "/tools/value-ledger",
  "workforce-readiness": "/tools/workforce-readiness",
  "smart-branch": "/smart-branch",
  "smart-operations": "/smart-operations",
  "smart-quality": "/smart-quality",
  "smart-maintenance": "/smart-maintenance",
  "smart-safety": "/smart-safety",
  "smart-supplier": "/smart-supplier",
  "smart-warehouse": "/smart-warehouse",
  "smart-delivery": "/smart-delivery",
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function openStatus(value: string) {
  return !["done", "closed", "complete", "completed", "rejected", "cancelled"].includes(normalize(value).replaceAll(" ", "_"));
}

function overdue(due: string | null, status: string) {
  return Boolean(due && openStatus(status) && due < new Date().toISOString().slice(0, 10));
}

function actionPath(action: ActionRow) {
  return toolPaths[normalize(action.target_tool).replaceAll(" ", "-")] || "/toolbox";
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function MyActionsPage() {
  const cloud = useCloudWorkspace();
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fullName = useMemo(() => {
    const user = cloud.user;
    if (!user) return "";
    const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
    const metadataAlt = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
    return metadataName || metadataAlt || user.email?.split("@")[0] || "Northstar User";
  }, [cloud.user]);

  useEffect(() => {
    if (cloud.status !== "ready" || !cloud.organizationId) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      const supabase = createClient();
      if (!supabase) {
        setError("Northstar Secure is unavailable.");
        setLoading(false);
        return;
      }
      const db = supabase as any;
      const fields = "id,title,owner_name,due_date,priority,action_status,target_tool,target_record,verification_required,progress_note";
      const [workforce, tool] = await Promise.all([
        db.from("northstar_workforce_actions").select(fields).eq("organization_id", cloud.organizationId),
        db.from("northstar_tool_actions").select(fields).eq("organization_id", cloud.organizationId),
      ]);
      if (!active) return;
      if (workforce.error || tool.error) {
        setError(workforce.error?.message || tool.error?.message || "Actions could not be loaded.");
        setLoading(false);
        return;
      }
      const merged: ActionRow[] = [
        ...(workforce.data || []).map((item: Omit<ActionRow, "source">) => ({ ...item, source: "workforce" as const })),
        ...(tool.data || []).map((item: Omit<ActionRow, "source">) => ({ ...item, source: "tool" as const })),
      ];
      merged.sort((a, b) => {
        const aOpen = openStatus(a.action_status) ? 0 : 1;
        const bOpen = openStatus(b.action_status) ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        if (overdue(a.due_date, a.action_status) !== overdue(b.due_date, b.action_status)) return overdue(a.due_date, a.action_status) ? -1 : 1;
        return String(a.due_date || "9999-12-31").localeCompare(String(b.due_date || "9999-12-31"));
      });
      setActions(merged);
      setLoading(false);
    }

    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [cloud.status, cloud.organizationId]);

  const mine = useMemo(() => actions.filter(action => normalize(action.owner_name) === normalize(fullName)), [actions, fullName]);
  const mineOpen = mine.filter(action => openStatus(action.action_status));
  const mineOverdue = mine.filter(action => overdue(action.due_date, action.action_status));
  const teamOpen = actions.filter(action => openStatus(action.action_status));

  return (
    <main className="actions-shell">
      <NorthstarPrimaryRail active="actions" />
      <section className="actions-main">
        <header className="actions-topbar">
          <div><small>NORTHSTAR / MY ACTIONS</small><strong>Personal Work Queue</strong></div>
          <span>{fullName || "Signed-in user"}</span>
        </header>

        <div className="actions-content">
          <section className="queue-summary">
            <div><small>YOUR COMMITMENTS</small><h1>Work that needs your ownership.</h1><p>Actions remain connected to the source workspace. Use this queue to prioritize; complete the work where it belongs.</p></div>
            <div className="summary-state"><ListChecks size={20}/><strong>{loading ? "—" : mineOpen.length}</strong><span>open</span></div>
          </section>

          <section className="metrics">
            <Metric icon={ListChecks} label="My open" value={loading ? "—" : mineOpen.length} note="Assigned to your profile" />
            <Metric icon={AlertTriangle} label="My overdue" value={loading ? "—" : mineOverdue.length} note="Past due and still open" risk={mineOverdue.length > 0} />
            <Metric icon={Users} label="Team open" value={loading ? "—" : teamOpen.length} note="Organization visibility" />
            <Metric icon={CheckCircle2} label="My closed" value={loading ? "—" : mine.length - mineOpen.length} note="Verified or completed" />
          </section>

          {error && <div className="notice error"><AlertTriangle size={16}/>{error}</div>}
          {!error && !loading && !mine.length && <div className="notice"><Clock3 size={16}/>No actions are currently assigned exactly to <strong>{fullName}</strong>. Team actions remain visible below.</div>}

          <section className="queue-panel">
            <div className="queue-panel-head"><div><small>ASSIGNED TO ME</small><h2>My work queue</h2></div><span>{mine.length} total</span></div>
            <div className="queue-columns"><span>Priority</span><span>Action</span><span>Owner / Due</span><span>Status</span><span>Source</span><span /></div>
            <div className="queue-body">
              {loading ? <div className="empty">Loading your actions…</div> : mine.length ? mine.map(action => <ActionRowView action={action} key={`${action.source}:${action.id}`} />) : <div className="empty">Nothing is currently assigned to your signed-in profile.</div>}
            </div>
          </section>

          <section className="queue-panel team-panel">
            <div className="queue-panel-head"><div><small>ORGANIZATION VISIBILITY</small><h2>Team open actions</h2></div><span>{teamOpen.length} open</span></div>
            <div className="queue-columns"><span>Priority</span><span>Action</span><span>Owner / Due</span><span>Status</span><span>Source</span><span /></div>
            <div className="queue-body">
              {loading ? <div className="empty">Loading team actions…</div> : teamOpen.length ? teamOpen.slice(0, 20).map(action => <ActionRowView action={action} key={`team:${action.source}:${action.id}`} />) : <div className="empty">No open team actions.</div>}
            </div>
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#eef2f6}.actions-shell{min-height:100vh;color:#14283b;background:#eef2f6;font-family:Inter,Arial,sans-serif}.actions-main{margin-left:236px}.actions-topbar{min-height:64px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e0e8;background:#fff}.actions-topbar>div{margin-right:auto}.actions-topbar small,.actions-topbar strong{display:block}.actions-topbar small{color:#71869a;font-size:8px;font-weight:900;letter-spacing:.14em}.actions-topbar strong{margin-top:3px;color:#18344d;font-size:13px}.actions-topbar>span{margin-right:300px;padding:6px 9px;border:1px solid #d7e1e9;border-radius:7px;color:#48677f;background:#f8fafc;font-size:8px;font-weight:850}.actions-content{max-width:1540px;margin:0 auto;padding:20px 22px 58px}.queue-summary{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;padding:16px 18px;border:1px solid #d5e0e8;border-radius:10px;background:#fff}.queue-summary small,.queue-panel-head small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.13em}.queue-summary h1{margin:4px 0;font-size:18px}.queue-summary p{margin:0;color:#6c8294;font-size:9px;line-height:1.5}.summary-state{display:flex;align-items:baseline;gap:6px;padding-left:18px;border-left:1px solid #e1e7ec;color:#0a66b7}.summary-state svg{align-self:center}.summary-state strong{font-size:30px}.summary-state span{color:#718699;font-size:8px;font-weight:850;text-transform:uppercase}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:10px}.metric-card{display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;padding:11px 12px;border:1px solid #d7e1e9;border-radius:9px;background:#fff;box-shadow:0 4px 14px rgba(20,48,72,.04)}.metric-card.risk{border-color:#dfb873;background:#fffaf3}.metric-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:7px;color:#0a66b7;background:#edf4fa}.metric-card.risk .metric-icon{color:#9c650e;background:#fff0d8}.metric-copy strong,.metric-copy small{display:block}.metric-copy strong{font-size:8px;text-transform:uppercase;letter-spacing:.05em}.metric-copy small{margin-top:3px;color:#7b8e9e;font-size:7px}.metric-card>b{font-size:22px}.notice{display:flex;align-items:center;gap:7px;margin-top:10px;padding:10px 12px;border:1px solid #b8d3e7;border-radius:8px;color:#245a7e;background:#f1f7fb;font-size:8px}.notice.error{border-color:#e2b4b9;color:#8b2c35;background:#fff2f4}.queue-panel{margin-top:17px;border:1px solid #d4dfe8;border-radius:10px;background:#fff;overflow:hidden;box-shadow:0 4px 16px rgba(20,48,72,.04)}.team-panel{margin-top:14px}.queue-panel-head{display:flex;align-items:end;justify-content:space-between;padding:13px 14px;border-bottom:1px solid #e4eaef;background:#fbfcfd}.queue-panel-head h2{margin:4px 0 0;font-size:13px}.queue-panel-head>span{color:#74899a;font-size:8px}.queue-columns,.action-row{display:grid;grid-template-columns:70px minmax(260px,1.5fr) minmax(150px,.75fr) 100px minmax(120px,.6fr) 88px;gap:10px;align-items:center}.queue-columns{min-height:34px;padding:0 13px;color:#7b8e9e;background:#f3f6f8;font-size:6px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.action-row{min-height:68px;padding:9px 13px;border-top:1px solid #edf1f4}.action-row:first-child{border-top:0}.action-row.overdue{background:#fffaf3}.priority{justify-self:start;padding:4px 6px;border-radius:5px;color:#275f88;background:#eaf3fa;font-size:6px;font-weight:950;text-transform:uppercase}.priority.urgent,.priority.critical{color:#8d2631;background:#fde9ec}.action-primary strong,.action-primary small,.action-owner strong,.action-owner small,.action-source strong,.action-source small{display:block}.action-primary strong{font-size:9px}.action-primary small{margin-top:3px;color:#74899b;font-size:7px;line-height:1.35}.action-owner strong,.action-source strong{font-size:8px}.action-owner small,.action-source small{margin-top:3px;color:#7b8e9f;font-size:7px}.status-chip{justify-self:start;padding:4px 6px;border-radius:5px;color:#49677e;background:#eef3f6;font-size:6px;font-weight:900;text-transform:uppercase}.status-chip.done,.status-chip.closed,.status-chip.completed{color:#2f7358;background:#eaf6f0}.action-row>a{display:flex;align-items:center;justify-content:center;gap:5px;min-height:30px;border:1px solid #cbd9e4;border-radius:7px;color:#0a66b7;text-decoration:none;font-size:7px;font-weight:900}.empty{padding:22px;color:#778b9b;text-align:center;font-size:9px}@media(max-width:1180px){.metrics{grid-template-columns:repeat(2,1fr)}.queue-columns{display:none}.action-row{grid-template-columns:62px 1fr 130px 82px}.action-source{display:none}.actions-topbar>span{margin-right:72px}}@media(max-width:820px){.actions-main{margin-left:0}.actions-topbar{padding:0 14px}.actions-content{padding:14px}.queue-summary{grid-template-columns:1fr}.summary-state{border-left:0;border-top:1px solid #e1e7ec;padding:10px 0 0}.action-row{grid-template-columns:58px 1fr 78px}.action-owner{display:none}}@media(max-width:560px){.metrics{grid-template-columns:1fr}.action-row{grid-template-columns:1fr}.priority,.status-chip{justify-self:start}}
      `}</style>
    </main>
  );
}

function Metric({ icon: Icon, label, value, note, risk = false }: { icon: typeof ListChecks; label: string; value: string | number; note: string; risk?: boolean }) {
  return <article className={`metric-card ${risk ? "risk" : ""}`}><span className="metric-icon"><Icon size={16}/></span><span className="metric-copy"><strong>{label}</strong><small>{note}</small></span><b>{value}</b></article>;
}

function ActionRowView({ action }: { action: ActionRow }) {
  const isOverdue = overdue(action.due_date, action.action_status);
  const normalizedStatus = normalize(action.action_status).replaceAll(" ", "_");
  return (
    <article className={`action-row ${isOverdue ? "overdue" : ""}`}>
      <span className={`priority ${normalize(action.priority)}`}>{action.priority || "Normal"}</span>
      <div className="action-primary"><strong>{action.title}</strong><small>{action.target_record || action.verification_required || "Controlled Northstar action"}</small></div>
      <div className="action-owner"><strong>{action.owner_name || "Owner pending"}</strong><small>{action.due_date || "No due date"}{isOverdue ? " · OVERDUE" : ""}</small></div>
      <span className={`status-chip ${normalizedStatus}`}>{statusLabel(action.action_status)}</span>
      <div className="action-source"><strong>{action.target_tool || "Northstar"}</strong><small>{action.source === "workforce" ? "AI workforce" : "Tool action"}</small></div>
      <a href={actionPath(action)}>Open <ArrowRight size={12}/></a>
    </article>
  );
}
