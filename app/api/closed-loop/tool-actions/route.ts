import { NextResponse } from "next/server";
import { adapterCorsHeaders, resolveNorthstarUser } from "@/lib/northstar-server-auth";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: adapterCorsHeaders });
}

export async function GET(request: Request) {
  try {
    const { supabase, organizationId } = await resolveNorthstarUser(request);
    const url = new URL(request.url);
    const tool = String(url.searchParams.get("tool") || "").trim();
    const record = String(url.searchParams.get("record") || "").trim();
    if (!tool) return NextResponse.json({ error: "Target tool is required." }, { status: 400, headers: adapterCorsHeaders });

    let query = supabase
      .from("northstar_tool_actions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("target_tool", tool)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (record) query = query.eq("target_record", record);
    const { data, error } = await query.limit(100);
    if (error) throw error;

    return NextResponse.json({ actions: data || [] }, { headers: adapterCorsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Northstar tool actions could not be loaded.";
    return NextResponse.json({ error: message }, { status: 401, headers: adapterCorsHeaders });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { supabase, user, organizationId } = await resolveNorthstarUser(request, body);
    const actionId = String(body?.id || "").trim();
    const actionStatus = String(body?.status || "").trim();
    const note = String(body?.note || "").trim();
    if (!actionId || !new Set(["approved", "in_progress", "evidence_review", "blocked", "done", "rejected"]).has(actionStatus)) {
      return NextResponse.json({ error: "A valid action and status are required." }, { status: 400, headers: adapterCorsHeaders });
    }
    if (!note) return NextResponse.json({ error: "A controlled progress or closure note is required." }, { status: 400, headers: adapterCorsHeaders });

    const { data: current, error: readError } = await supabase
      .from("northstar_tool_actions")
      .select("id,verification_required")
      .eq("id", actionId)
      .eq("organization_id", organizationId)
      .single();
    if (readError) throw readError;
    if (actionStatus === "done" && !String(current.verification_required || "").trim()) {
      return NextResponse.json({ error: "Closure is blocked because objective verification is not defined." }, { status: 409, headers: adapterCorsHeaders });
    }

    const patch = actionStatus === "done"
      ? {
          action_status: actionStatus,
          progress_note: note,
          closure_note: note,
          closed_by: user.id,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : {
          action_status: actionStatus,
          progress_note: note,
          updated_at: new Date().toISOString(),
        };

    const { data, error } = await supabase
      .from("northstar_tool_actions")
      .update(patch)
      .eq("id", actionId)
      .eq("organization_id", organizationId)
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ action: data, message: "Target-tool action synchronized through the closed loop." }, { headers: adapterCorsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Northstar tool action could not be updated.";
    return NextResponse.json({ error: message }, { status: 401, headers: adapterCorsHeaders });
  }
}
