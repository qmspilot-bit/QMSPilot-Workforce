import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveNorthstarUser } from "@/lib/northstar-server-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function severityRank(value) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[value] || 0;
}

function openRecord(status) {
  return !["closed", "dismissed", "done", "rejected"].includes(String(status || ""));
}

async function runOperatingRhythm(supabase, organizationId, actorId, runType) {
  const runDate = today();
  const runId = crypto.randomUUID();

  const [eventResult, actionResult, valueResult, rhythmResult] = await Promise.all([
    supabase
      .from("northstar_intelligence_events")
      .select("*")
      .eq("organization_id", organizationId)
      .order("source_submitted_at", { ascending: false })
      .limit(100),
    supabase
      .from("northstar_workforce_actions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(200),
    supabase
      .from("value_ledger_snapshots")
      .select("verified_realized_value,net_realized_value,qmspilot_roi")
      .eq("organization_id", organizationId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("northstar_operating_rhythms")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  const queryError = [eventResult, actionResult, valueResult, rhythmResult]
    .map((result) => result.error)
    .find(Boolean);
  if (queryError) throw queryError;

  const events = (eventResult.data || [])
    .filter((event) => openRecord(event.event_status))
    .sort((left, right) => severityRank(right.severity) - severityRank(left.severity));
  const actions = (actionResult.data || []).filter((action) => openRecord(action.action_status));
  const currentDate = new Date(`${runDate}T00:00:00Z`).getTime();
  const overdue = actions.filter((action) => action.due_date && new Date(`${action.due_date}T00:00:00Z`).getTime() < currentDate);
  const blocked = actions.filter((action) => action.action_status === "blocked");
  const critical = events.filter((event) => event.severity === "critical");
  const high = events.filter((event) => event.severity === "high");
  const financialExposure = events.reduce((sum, event) => sum + Number(event.financial_exposure || 0), 0);
  const revenueExposure = events.reduce((sum, event) => sum + Number(event.revenue_exposure || 0), 0);
  const verifiedValue = Number(valueResult.data?.verified_realized_value || 0);

  const decisions = events
    .filter((event) => event.requires_decision || ["critical", "high"].includes(event.severity))
    .slice(0, 5)
    .map((event) => ({
      decision: `Approve the accountable response for ${event.event_title}.`,
      reason: event.summary || "The connected event requires leadership direction.",
      ownerRole: event.owner_name || "Executive sponsor",
      urgency: event.severity === "critical" ? "today" : "48_hours",
      eventId: event.id,
    }));

  const actionPriorities = [
    ...overdue.slice(0, 4).map((action) => ({
      title: action.title,
      ownerRole: action.owner_name || "Accountable owner",
      due: action.due_date || "Overdue",
      impact: `Overdue ${action.priority} action requires recovery and objective closure evidence.`,
      eventId: action.event_id,
    })),
    ...blocked.slice(0, 3).map((action) => ({
      title: action.title,
      ownerRole: action.owner_name || "Accountable owner",
      due: action.due_date || runDate,
      impact: "Blocked action requires escalation or a revised recovery plan.",
      eventId: action.event_id,
    })),
  ].slice(0, 6);

  const priorities = actionPriorities.length
    ? actionPriorities
    : events.slice(0, 4).map((event) => ({
        title: event.event_title,
        ownerRole: event.owner_name || "Assigned process owner",
        due: event.due_date || runDate,
        impact: event.summary || "Connected operating risk requires review.",
        eventId: event.id,
      }));

  const title = `Pilot ${runType === "weekly" ? "Weekly" : runType === "daily" ? "Daily" : "On-Demand"} Executive Brief · ${runDate}`;
  const executiveSummary = `${events.length} connected operating events are active: ${critical.length} critical and ${high.length} high priority. Atlas identified ${overdue.length} overdue and ${blocked.length} blocked actions. Leadership should resolve human decisions first, protect customer and delivery exposure, and then close verification gaps.`;
  const valueSummary = {
    financialExposure,
    revenueExposure,
    verifiedValue,
    note: "Exposure is not counted as savings. Verified value remains separated in Value Ledger.",
  };

  const { data: brief, error: briefError } = await supabase
    .from("northstar_executive_briefs")
    .insert({
      organization_id: organizationId,
      brief_type: runType === "manual" ? "on_demand" : runType,
      period_start: runDate,
      period_end: runDate,
      title,
      executive_summary: executiveSummary,
      decisions_required: decisions,
      priorities,
      watchlist: [
        `${overdue.length} overdue workforce actions`,
        `${blocked.length} blocked actions`,
        `${events.filter((event) => event.event_status === "awaiting_human").length} events awaiting human review`,
        `${events.filter((event) => Number(event.revenue_exposure || 0) > 0).length} events carrying revenue exposure`,
      ],
      value_summary: valueSummary,
      source_event_ids: events.map((event) => event.id),
      confidence: events.length ? 88 : 65,
      model_mode: "rules",
      brief_status: "awaiting_review",
      created_by: actorId,
    })
    .select("id")
    .single();
  if (briefError) throw briefError;

  const atlasSeverity = overdue.length || critical.length
    ? "critical"
    : blocked.length || high.length
      ? "high"
      : "low";
  const eventKey = `operating-rhythm:${organizationId}:${runType}:${runDate}`;
  const { data: atlasEvent, error: atlasError } = await supabase
    .from("northstar_intelligence_events")
    .upsert({
      event_key: eventKey,
      organization_id: organizationId,
      source_tool: "operating-rhythm",
      source_table: "northstar_operating_rhythm_runs",
      source_record_id: runId,
      source_record_key: `${runType}-${runDate}`,
      source_path: "/workforce-operations",
      event_type: `${runType}-operating-rhythm`,
      event_title: `Atlas accountability review · ${runDate}`,
      summary: `${overdue.length} overdue actions, ${blocked.length} blocked actions, ${critical.length} critical events, and ${decisions.length} leadership decisions require review.`,
      severity: atlasSeverity,
      event_status: "new",
      financial_exposure: financialExposure,
      revenue_exposure: revenueExposure,
      requires_decision: decisions.length > 0,
      human_authority_required: true,
      source_payload: {
        runType,
        runDate,
        overdueActionIds: overdue.map((action) => action.id),
        blockedActionIds: blocked.map((action) => action.id),
        briefId: brief.id,
      },
      routing_context: {
        criticalEvents: critical.length,
        highEvents: high.length,
        overdueActions: overdue.length,
        blockedActions: blocked.length,
      },
      evidence_refs: [],
      created_by: actorId,
      source_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "event_key" })
    .select("id")
    .single();
  if (atlasError) throw atlasError;

  const { error: runError } = await supabase
    .from("northstar_operating_rhythm_runs")
    .upsert({
      id: runId,
      organization_id: organizationId,
      rhythm_id: rhythmResult.data?.id || null,
      run_type: runType,
      run_date: runDate,
      run_status: "completed",
      source_event_count: events.length,
      overdue_action_count: overdue.length,
      brief_id: brief.id,
      atlas_event_id: atlasEvent.id,
      result: {
        criticalEvents: critical.length,
        highEvents: high.length,
        blockedActions: blocked.length,
        financialExposure,
        revenueExposure,
        verifiedValue,
      },
      created_by: actorId,
    }, { onConflict: "organization_id,run_type,run_date" });
  if (runError) throw runError;

  if (rhythmResult.data?.id && runType !== "manual") {
    const rhythmPatch = runType === "daily"
      ? { last_daily_run: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { last_weekly_run: new Date().toISOString(), updated_at: new Date().toISOString() };
    await supabase.from("northstar_operating_rhythms").update(rhythmPatch).eq("id", rhythmResult.data.id);
  }

  return {
    organizationId,
    runType,
    briefId: brief.id,
    atlasEventId: atlasEvent.id,
    activeEvents: events.length,
    overdueActions: overdue.length,
    blockedActions: blocked.length,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { supabase, user, organizationId } = await resolveNorthstarUser(request, body);
    const result = await runOperatingRhythm(supabase, organizationId, user.id, "manual");
    return NextResponse.json({
      success: true,
      result,
      message: "Pilot and Atlas completed the on-demand operating rhythm. Human review remains required.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The operating rhythm could not run." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for scheduled operating rhythms." }, { status: 503 });
    }
    const expected = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization") || "";
    if (expected && authorization !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: rhythms, error } = await supabase
      .from("northstar_operating_rhythms")
      .select("organization_id,daily_enabled")
      .eq("daily_enabled", true);
    if (error) throw error;

    const results = [];
    for (const rhythm of rhythms || []) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", rhythm.organization_id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!member?.user_id) continue;
      try {
        results.push(await runOperatingRhythm(supabase, rhythm.organization_id, member.user_id, "daily"));
      } catch (error) {
        results.push({ organizationId: rhythm.organization_id, error: error instanceof Error ? error.message : "Run failed" });
      }
    }

    return NextResponse.json({ success: true, generatedAt: new Date().toISOString(), results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduled operating rhythms failed." }, { status: 500 });
  }
}
