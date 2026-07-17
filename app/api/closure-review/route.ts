import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ClosureReview } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  analysisId: z.string().uuid(),
  action: z.object({ id: z.string().min(1).max(80) }),
  evidenceIds: z.array(z.string().uuid()).min(1).max(8),
});

async function authenticatedWorkspace(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!url || !publishableKey) {
    return { error: "Secure cloud is not configured.", status: 503 } as const;
  }
  if (!token) {
    return { error: "Sign in to Secure cloud before requesting an evidence review.", status: 401 } as const;
  }

  const supabase = createSupabaseClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Your secure session has expired. Sign in again and retry.", status: 401 } as const;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) {
    return { error: "Your secure QMSPilot workspace is not available.", status: 403 } as const;
  }

  return {
    user: data.user,
    organizationId: membership.organization_id,
    supabase,
  } as const;
}

export async function POST(request: Request) {
  try {
    const authentication = await authenticatedWorkspace(request);
    if ("error" in authentication) {
      return NextResponse.json({ error: authentication.error }, { status: authentication.status });
    }

    const payload = requestSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json({ error: "The closure-review packet is incomplete or invalid." }, { status: 400 });
    }

    const { analysisId, action, evidenceIds } = payload.data;
    const uniqueEvidenceIds = [...new Set(evidenceIds)];
    const { supabase, organizationId, user } = authentication;

    const { data: workItem, error: workItemError } = await supabase
      .from("work_items")
      .select("id, verification")
      .eq("organization_id", organizationId)
      .eq("analysis_id", analysisId)
      .eq("action_key", action.id)
      .maybeSingle();
    if (workItemError) throw workItemError;
    if (!workItem) {
      return NextResponse.json({ error: "The secure action record could not be found." }, { status: 404 });
    }

    const { data: evidenceRecords, error: evidenceError } = await supabase
      .from("closure_evidence")
      .select("id, file_name")
      .eq("organization_id", organizationId)
      .eq("work_item_id", workItem.id)
      .in("id", uniqueEvidenceIds);
    if (evidenceError) throw evidenceError;
    if (evidenceRecords.length !== uniqueEvidenceIds.length) {
      return NextResponse.json({ error: "One or more closure-evidence files are unavailable." }, { status: 400 });
    }

    const fileNames = evidenceRecords.map((evidence) => evidence.file_name);
    const review: ClosureReview = {
      conclusion: "partial",
      summary: "The evidence is securely retained, but Atlas content inspection is not enabled. An authorized human must review the files against the closure criterion before deciding.",
      criteriaAssessment: [{
        criterion: workItem.verification,
        result: "partial",
        rationale: "File retention is confirmed. The contents have not been sent outside the QMSPilot vault or evaluated by an AI model.",
        evidence: fileNames,
      }],
      evidenceReviewed: fileNames,
      gaps: ["Complete a qualified human review, or explicitly authorize Atlas to inspect retained closure evidence."],
      recommendation: "Do not close solely because files are present. Verify the objective evidence against the definition of done.",
      confidence: "high",
      reviewedBy: "Atlas",
    };

    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("work_items")
      .update({
        status: "evidence_review",
        closure_review: review,
        closure_reviewed_at: reviewedAt,
        closure_review_requested_by: user.id,
        closed_at: null,
        closed_by: null,
        closure_note: "",
      })
      .eq("organization_id", organizationId)
      .eq("id", workItem.id);
    if (updateError) throw updateError;

    return NextResponse.json(review);
  } catch (error) {
    console.error("Closure evidence gate failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The closure evidence gate could not be recorded." },
      { status: 500 },
    );
  }
}
