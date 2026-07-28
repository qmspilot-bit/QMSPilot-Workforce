"use client";

import { Activity, AlarmClock, BarChart3, CheckCircle2, Clock3, Gauge, Play, Square, Target, Users } from "lucide-react";

const number = (value?: string) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const percent = (value: number) => Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";
const decimal = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "—";
const currency = (value: number) => Number.isFinite(value) ? value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";
const localStamp = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const minutesBetween = (start?: string, end?: string) => {
  if (!start) return 0;
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? Math.round((b - a) / 60000) : 0;
};
const daysBetween = (date?: string) => {
  if (!date) return 0;
  const target = new Date(`${date}T23:59:59`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
};

export function deriveOperationalMetrics(toolId: string, values: Record<string, string>, dueDate = "") {
  const metrics: Record<string, string> = {};

  if (toolId === "handoff") {
    const blocked = [
      values.production_state === "Stopped",
      ["Product hold / quarantine", "Open NCR", "Customer concern / escape risk"].includes(values.quality_status),
      ["Down", "PM / maintenance in progress"].includes(values.equipment_status),
      ["Shortage stopping work", "Inspection / quality hold"].includes(values.material_status),
      ["Headcount gap", "Critical skill gap"].includes(values.staffing_status),
      ["Incident response active", "Stop-work condition"].includes(values.safety_status),
    ].filter(Boolean).length;
    const plan = number(values.planned_output);
    const actual = number(values.actual_output);
    metrics.handoff_blockers = String(blocked);
    metrics.shift_attainment = plan > 0 ? percent((actual / plan) * 100) : "Not calculated";
    metrics.readiness_signal = blocked > 0 ? "Escalation required" : values.shift_readiness || "Pending readiness decision";
  }

  if (toolId === "production") {
    const plan = number(values.planned_quantity);
    const good = number(values.actual_good_quantity);
    const scrap = number(values.scrap_quantity);
    const rework = number(values.rework_quantity);
    const runtime = number(values.actual_runtime_minutes);
    metrics.schedule_attainment = plan > 0 ? percent((good / plan) * 100) : "Not calculated";
    metrics.first_pass_yield = good + scrap + rework > 0 ? percent((good / (good + scrap + rework)) * 100) : "Not calculated";
    metrics.actual_rate_per_hour = runtime > 0 ? decimal(good / (runtime / 60)) : "Not calculated";
    metrics.quantity_variance = decimal(good - plan, 0);
  }

  if (toolId === "downtime") {
    const duration = minutesBetween(values.event_start, values.event_end);
    const lost = duration / 60 * number(values.production_rate_hour);
    const cost = duration / 60 * number(values.estimated_cost_hour);
    metrics.downtime_minutes = String(duration);
    metrics.estimated_lost_units = decimal(lost, 1);
    metrics.estimated_downtime_cost = currency(cost);
    metrics.repeat_loss_signal = values.repeat_event === "Yes" ? "Reliability review required" : "No repeat signal recorded";
  }

  if (toolId === "andon") {
    const elapsed = minutesBetween(values.raised_at, values.resolved_at);
    const response = values.acknowledged_at ? minutesBetween(values.raised_at, values.acknowledged_at) : elapsed;
    const target = number(values.target_response_minutes);
    metrics.andon_elapsed_minutes = String(elapsed);
    metrics.acknowledgement_minutes = String(response);
    metrics.response_sla = target > 0 ? (response <= target ? "Within SLA" : `Exceeded SLA by ${response - target} min`) : "SLA not set";
    metrics.escalation_signal = values.severity === "Level 4 - stop work / emergency" || (target > 0 && response > target) ? "Escalate now" : "Current route acceptable";
  }

  if (toolId === "leader") {
    const routines = ["pre_shift_review", "safety_walk", "quality_review", "production_review", "material_review", "skills_review", "action_review", "coaching_completed", "process_confirmation"];
    const required = routines.filter(key => values[key] !== "Not required");
    const complete = required.filter(key => values[key] === "Completed");
    const missed = required.filter(key => values[key] === "Missed / incomplete");
    metrics.routine_completion = required.length ? percent((complete.length / required.length) * 100) : "Not calculated";
    metrics.missed_routines = String(missed.length);
    metrics.leader_rhythm_signal = missed.length ? "Follow-up required" : "Routine on track";
  }

  if (toolId === "accountability") {
    const remaining = daysBetween(dueDate);
    const complete = number(values.percent_complete);
    metrics.days_to_due = dueDate ? (remaining >= 0 ? `${remaining} day(s) remaining` : `${Math.abs(remaining)} day(s) overdue`) : "Due date not set";
    metrics.percent_complete = percent(complete);
    metrics.action_health = values.action_status === "Complete" ? "Complete - verify closure" : remaining < 0 ? "Overdue" : values.action_status === "Blocked" ? "Blocked - escalate" : remaining <= 1 && complete < 100 ? "Due-date risk" : "On track";
  }

  if (toolId === "meeting" || toolId === "visual") {
    const statuses = [values.safety_status, values.quality_status, values.delivery_status, values.cost_status, values.people_status];
    const reds = statuses.filter(value => value?.startsWith("Red")).length;
    const yellows = statuses.filter(value => value?.startsWith("Yellow")).length;
    const greens = statuses.filter(value => value?.startsWith("Green")).length;
    metrics.sqdcp_red = String(reds);
    metrics.sqdcp_yellow = String(yellows);
    metrics.sqdcp_green = String(greens);
    metrics.sqdcp_signal = reds ? `${reds} red condition(s) require escalation` : yellows ? `${yellows} yellow condition(s) require action` : greens === 5 ? "All SQDCP categories green" : "Complete remaining status data";
  }

  if (toolId === "bottleneck") {
    const demand = number(values.demand_rate_hour);
    const capacity = number(values.demonstrated_capacity_hour);
    const targetCycle = number(values.target_cycle_seconds);
    const actualCycle = number(values.actual_cycle_seconds);
    metrics.capacity_gap_per_hour = decimal(capacity - demand, 1);
    metrics.capacity_coverage = demand > 0 ? percent((capacity / demand) * 100) : "Not calculated";
    metrics.cycle_time_variance = targetCycle > 0 ? percent(((actualCycle - targetCycle) / targetCycle) * 100) : "Not calculated";
    metrics.constraint_signal = capacity < demand ? "Demonstrated capacity below demand" : "Capacity currently covers demand";
  }

  if (toolId === "labor") {
    const required = number(values.required_headcount);
    const available = number(values.available_headcount);
    const critical = number(values.critical_positions_required);
    const covered = number(values.critical_positions_covered);
    metrics.headcount_gap = String(available - required);
    metrics.headcount_coverage = required > 0 ? percent((available / required) * 100) : "Not calculated";
    metrics.critical_skill_coverage = critical > 0 ? percent((covered / critical) * 100) : "Not calculated";
    metrics.workforce_signal = covered < critical ? "Critical skill gap" : available < required ? "Headcount gap" : "Staffing plan covered";
  }

  if (toolId === "changeover") {
    const duration = minutesBetween(values.changeover_start, values.changeover_end);
    const target = number(values.target_minutes);
    metrics.actual_changeover_minutes = String(duration);
    metrics.changeover_variance_minutes = target > 0 ? String(duration - target) : "Not calculated";
    metrics.changeover_performance = target > 0 ? percent((duration / target) * 100) : "Not calculated";
    metrics.release_signal = values.release_status || (values.first_piece_result === "Accepted" ? "Ready for release decision" : "Release not ready");
  }

  if (toolId === "resource") {
    const hours = values.needed_from ? (new Date(values.needed_from).getTime() - Date.now()) / 3600000 : 0;
    metrics.hours_to_need = values.needed_from ? `${decimal(hours, 1)} hours` : "Need-by time not set";
    metrics.fulfillment_signal = values.fulfillment_status || "Not submitted";
    metrics.resource_risk = hours < 0 && !["Fulfilled", "Declined"].includes(values.fulfillment_status) ? "Need-by time missed" : hours <= 2 && !["Committed", "Fulfilled"].includes(values.fulfillment_status) ? "Immediate commitment required" : values.impact_level || "Pending impact assessment";
  }

  return metrics;
}

function metricEntries(toolId: string, values: Record<string, string>, dueDate: string) {
  return Object.entries(deriveOperationalMetrics(toolId, values, dueDate)).slice(0, 4).map(([key, value]) => ({
    label: key.replaceAll("_", " "),
    value,
  }));
}

export function OperationsFunctionPanel({
  toolId,
  values,
  dueDate,
  setValue,
}: {
  toolId: string;
  values: Record<string, string>;
  dueDate: string;
  setValue: (key: string, value: string) => void;
}) {
  const metrics = metricEntries(toolId, values, dueDate);
  const timedTool = ["downtime", "andon", "changeover"].includes(toolId);

  const start = () => {
    const stamp = localStamp();
    if (toolId === "downtime") setValue("event_start", stamp);
    if (toolId === "andon") setValue("raised_at", stamp);
    if (toolId === "changeover") setValue("changeover_start", stamp);
  };
  const acknowledge = () => toolId === "andon" && setValue("acknowledged_at", localStamp());
  const stop = () => {
    const stamp = localStamp();
    if (toolId === "downtime") setValue("event_end", stamp);
    if (toolId === "andon") setValue("resolved_at", stamp);
    if (toolId === "changeover") setValue("changeover_end", stamp);
  };

  return (
    <section className="ops-function-panel">
      <div className="ops-function-head">
        <span><Activity size={20} /></span>
        <div>
          <small>PURPOSE-BUILT OPERATIONAL FUNCTION</small>
          <strong>{toolId === "production" ? "Live production mathematics" : toolId === "downtime" ? "Downtime loss calculator" : toolId === "andon" ? "Response SLA clock" : toolId === "bottleneck" ? "Capacity constraint analysis" : toolId === "labor" ? "Workforce coverage analysis" : toolId === "changeover" ? "Changeover performance clock" : toolId === "leader" ? "Leader-rhythm completion" : toolId === "meeting" || toolId === "visual" ? "SQDCP condition board" : toolId === "accountability" ? "Action health and aging" : toolId === "resource" ? "Need-by and fulfillment risk" : "Shift-readiness analysis"}</strong>
        </div>
      </div>
      <div className="ops-function-metrics">
        {metrics.map(metric => <article key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong></article>)}
      </div>
      <div className="ops-function-actions">
        {timedTool && <button type="button" onClick={start}><Play size={15} /> Set start now</button>}
        {toolId === "andon" && <button type="button" onClick={acknowledge}><CheckCircle2 size={15} /> Acknowledge now</button>}
        {timedTool && <button type="button" onClick={stop}><Square size={15} /> Set completion now</button>}
        {toolId === "accountability" && <button type="button" onClick={() => { setValue("action_status", "Complete"); setValue("percent_complete", "100"); }}><Target size={15} /> Mark ready to verify</button>}
        {toolId === "resource" && <button type="button" onClick={() => setValue("fulfillment_status", "Acknowledged")}><Users size={15} /> Mark acknowledged</button>}
        {!timedTool && !["accountability", "resource"].includes(toolId) && <span><Gauge size={15} /> Metrics update automatically from the controlled fields below.</span>}
      </div>
      <style>{`
        .ops-function-panel{margin-top:14px;padding:17px;border:1px solid #8fc0e8;border-radius:16px;background:linear-gradient(135deg,#eaf5ff,#fff);box-shadow:0 10px 28px rgba(27,88,138,.08)}
        .ops-function-head{display:flex;align-items:center;gap:11px}.ops-function-head>span{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8)}
        .ops-function-head small,.ops-function-head strong{display:block}.ops-function-head small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.ops-function-head strong{margin-top:4px;color:#10263a;font-size:15px}
        .ops-function-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin-top:13px}.ops-function-metrics article{padding:11px;border:1px solid #d1e2ef;border-radius:11px;background:#fff}.ops-function-metrics small,.ops-function-metrics strong{display:block}.ops-function-metrics small{color:#6c8294;font-size:7px;font-weight:900;text-transform:uppercase}.ops-function-metrics strong{margin-top:5px;color:#113b60;font-size:14px;line-height:1.3}
        .ops-function-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:11px}.ops-function-actions button{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 11px;border:1px solid #9dc5e4;border-radius:9px;color:#164d78;background:#fff;font-size:9px;font-weight:900;cursor:pointer}.ops-function-actions>span{display:flex;align-items:center;gap:6px;color:#587287;font-size:9px}
      `}</style>
    </section>
  );
}
