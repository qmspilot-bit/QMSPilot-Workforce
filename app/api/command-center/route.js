import { NextResponse } from "next/server";
import { resolveNorthstarUser } from "@/lib/northstar-server-auth";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { supabase, organizationId, organizationName } = await resolveNorthstarUser(request);
    const responses = await Promise.all([
      supabase.from("northstar_intelligence_events").select("id,event_title,source_tool,source_record_key,source_path,severity,summary,financial_exposure,revenue_exposure,event_status").eq("organization_id", organizationId).order("source_submitted_at", { ascending: false }).limit(100),
      supabase.from("northstar_agent_assignments").select("agent_code,assignment_status").eq("organization_id", organizationId).order("assigned_at", { ascending: false }).limit(500),
      supabase.from("northstar_agent_recommendations").select("recommendation_status").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(300),
      supabase.from("northstar_workforce_actions").select("action_status").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(300),
      supabase.from("northstar_writeback_requests").select("writeback_status").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(300),
      supabase.from("northstar_executive_briefs").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("value_ledger_snapshots").select("verified_realized_value,net_realized_value,qmspilot_roi").eq("organization_id", organizationId).order("submitted_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const failed = responses.find((response) => response.error);
    if (failed?.error) throw failed.error;
    const [eventResult, assignmentResult, recommendationResult, actionResult, writebackResult, briefResult, valueResult] = responses;
    return NextResponse.json({
      organizationName,
      events: (eventResult.data || []).filter((event) => !["closed", "dismissed"].includes(event.event_status)),
      assignments: assignmentResult.data || [],
      recommendations: recommendationResult.data || [],
      actions: actionResult.data || [],
      writebacks: writebackResult.data || [],
      brief: briefResult.data || null,
      value: valueResult.data || {},
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Command Center data could not be loaded." }, { status: 401 });
  }
}
