"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, ListChecks, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

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
        const message = workforce.error?.message || tool.error?.message || "Actions could not be loaded.";
        setError(message);
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
      <aside>
        <div className="logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <nav><a href="/">Home</a><a href="/toolbox">Work</a><a className="active" href="/my-actions">My Actions</a><a href="/executive-intelligence">Leadership</a></nav>
        <div className="boundary"><ShieldCheck size={18}/><span>Actions stay connected to the workspace where the work happens. This page is your starting point, not a second workflow.</span></div>
      </aside>

      <section className="main">
        <header><div><small>QMSPILOT NORTHSTAR</small><strong>My Actions</strong></div><span>{fullName || "Signed-in user"}</span></header>
        <div className="content">
          <section className="hero">
            <div><small>YOUR COMMITMENTS</small><h1>Know what you own before you decide where to go.</h1><p>Northstar brings assigned work, due dates, priority, verification requirements, and the source workspace into one view.</p></div>
            <div className="hero-card"><ListChecks size={25}/><strong>{loading ? "—" : mineOpen.length}</strong><span>open actions assigned to you</span></div>
          </section>

          <section className="metrics">
            <article><ListChecks/><small>My open actions</small><strong>{loading ? "—" : mineOpen.length}</strong><span>Assigned to your signed-in profile</span></article>
            <article className={mineOverdue.length ? "risk" : ""}><AlertTriangle/><small>My overdue</small><strong>{loading ? "—" : mineOverdue.length}</strong><span>Past due and still open</span></article>
            <article><Users/><small>Team open actions</small><strong>{loading ? "—" : teamOpen.length}</strong><span>Visible within your organization</span></article>
            <article><CheckCircle2/><small>My closed</small><strong>{loading ? "—" : mine.length - mineOpen.length}</strong><span>Verified or completed actions</span></article>
          </section>

          {error && <div className="notice error"><AlertTriangle size={17}/>{error}</div>}
          {!error && !loading && !mine.length && <div className="notice"><Clock3 size={17}/>No actions are currently assigned exactly to <strong>{fullName}</strong>. Team actions remain visible below so ownership can be corrected at the source if needed.</div>}

          <section className="section-head"><div><small>ASSIGNED TO ME</small><h2>My work queue</h2></div><span>{mine.length} total</span></section>
          <section className="action-list">
            {loading ? <div className="empty">Loading your actions…</div> : mine.length ? mine.map(action => <ActionCard action={action} key={`${action.source}:${action.id}`} />) : <div className="empty">Nothing is currently assigned to your signed-in profile.</div>}
          </section>

          <section className="section-head team-head"><div><small>ORGANIZATION VISIBILITY</small><h2>Team open actions</h2></div><span>{teamOpen.length} open</span></section>
          <section className="action-list">
            {loading ? <div className="empty">Loading team actions…</div> : teamOpen.length ? teamOpen.slice(0, 20).map(action => <ActionCard action={action} key={`team:${action.source}:${action.id}`} />) : <div className="empty">No open team actions.</div>}
          </section>
        </div>
      </section>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.actions-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.actions-shell>aside{position:fixed;inset:0 auto 0 0;width:258px;padding:18px;background:linear-gradient(180deg,#061729,#0a2744);color:white;height:100vh;overflow:auto}.logo,.northstar{height:58px;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:13px;background:#fff}.northstar{margin-top:8px;background:#020914}.logo img,.northstar img{max-width:190px;max-height:48px}.actions-shell nav{display:grid;gap:6px;margin-top:20px}.actions-shell nav a{padding:11px 12px;border-radius:10px;color:#bed2e4;text-decoration:none;font-size:12px;font-weight:850}.actions-shell nav a.active{color:#fff;background:#0d4a7c}.boundary{display:flex;gap:9px;margin-top:24px;padding:14px;border:1px solid #31516f;border-radius:13px;color:#bcd2e4;font-size:10px;line-height:1.5}.main{margin-left:258px}.main>header{min-height:68px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d7e3ec;background:#fff}.main>header div{margin-right:auto}.main>header small,.main>header strong{display:block}.main>header small{color:#6b8296;font-size:9px;font-weight:900;letter-spacing:.12em}.main>header span{padding:8px 11px;border-radius:999px;color:#176747;background:#e4f8ef;font-size:10px;font-weight:900}.content{max-width:1460px;margin:0 auto;padding:24px 24px 70px}.hero{display:grid;grid-template-columns:1.35fr .65fr;gap:18px;align-items:stretch}.hero>div:first-child{padding:28px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 65%,#0a66ff)}.hero small,.section-head small{font-size:9px;font-weight:900;letter-spacing:.12em}.hero>div:first-child small{color:#9ed6ff}.hero h1{max-width:850px;margin:10px 0;font-size:clamp(31px,4vw,52px);line-height:1.03}.hero p{max-width:850px;margin:0;color:#d6e8f6;line-height:1.65}.hero-card{display:grid;place-items:center;align-content:center;padding:22px;border:1px solid #d7e2eb;border-radius:20px;background:#fff;text-align:center}.hero-card>svg{color:#0a66ff}.hero-card strong{margin-top:8px;font-size:46px}.hero-card span{color:#657d91;font-size:10px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}.metrics article{padding:16px;border:1px solid #d8e4ed;border-radius:16px;background:#fff;box-shadow:0 9px 24px rgba(24,53,77,.06)}.metrics article>svg{color:#0a66ff}.metrics article.risk>svg{color:#b06b10}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{margin-top:10px;color:#6f8598;font-size:8px;font-weight:900;text-transform:uppercase}.metrics strong{margin-top:5px;font-size:28px}.metrics span{margin-top:4px;color:#7b8fa1;font-size:8px}.notice{display:flex;align-items:center;gap:8px;margin-top:15px;padding:12px 14px;border:1px solid #9bc5e8;border-radius:11px;color:#174d79;background:#eaf5ff;font-size:10px}.notice.error{border-color:#e4b5ba;color:#8d2b35;background:#fff1f3}.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:24px 0 11px}.section-head small{color:#0a66ff}.section-head h2{margin:5px 0 0}.section-head>span{color:#6d8294;font-size:9px}.team-head{margin-top:30px}.action-list{display:grid;gap:10px}.action-card{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:14px 15px;border:1px solid #d8e3ec;border-radius:14px;background:#fff;box-shadow:0 8px 22px rgba(24,53,77,.05)}.action-card.overdue{border-color:#e5b06a;background:#fffaf2}.priority{padding:5px 7px;border-radius:999px;color:#1b5c8b;background:#e8f3fc;font-size:8px;font-weight:950;text-transform:uppercase}.priority.urgent,.priority.critical{color:#8d2631;background:#ffe9ec}.action-card h3{margin:0;font-size:13px}.action-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:5px;color:#71869a;font-size:8px}.action-note{margin:6px 0 0;color:#536d82;font-size:9px;line-height:1.45}.action-card a{display:flex;align-items:center;gap:6px;padding:9px 10px;border:1px solid #bfd3e3;border-radius:9px;color:#0a66ff;text-decoration:none;font-size:9px;font-weight:900}.empty{padding:22px;border:1px dashed #b9cbd9;border-radius:14px;color:#71869a;background:#f8fbfd;text-align:center}@media(max-width:1050px){.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.hero{grid-template-columns:1fr}.action-card{grid-template-columns:1fr}.action-card a{justify-self:start}}@media(max-width:820px){.actions-shell>aside{position:static;width:auto;height:auto}.main{margin-left:0}.boundary{display:none}}@media(max-width:600px){.metrics{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}

function ActionCard({ action }: { action: ActionRow }) {
  const isOverdue = overdue(action.due_date, action.action_status);
  return (
    <article className={`action-card ${isOverdue ? "overdue" : ""}`}>
      <span className={`priority ${normalize(action.priority)}`}>{action.priority || "Normal"}</span>
      <div>
        <h3>{action.title}</h3>
        <div className="action-meta"><span>{action.owner_name || "Owner pending"}</span><span>{action.due_date || "No due date"}</span><span>{statusLabel(action.action_status)}</span><span>{action.target_tool || "Northstar"}</span></div>
        {(action.progress_note || action.verification_required) && <p className="action-note">{action.progress_note || `Verification: ${action.verification_required}`}</p>}
      </div>
      <a href={actionPath(action)}>Open source <ArrowRight size={14}/></a>
    </article>
  );
}
