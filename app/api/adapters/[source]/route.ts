import { NextResponse } from "next/server";
import { adapterCorsHeaders, resolveNorthstarUser } from "@/lib/northstar-server-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function text(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number !== 0) return number;
  }
  return 0;
}

function normalizeSeverity(value: unknown, riskScore: number) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("critical") || normalized.includes("severe")) return "critical";
  if (normalized.includes("high") || normalized.includes("major")) return "high";
  if (normalized.includes("low") || normalized.includes("minor")) return "low";
  if (riskScore >= 16) return "critical";
  if (riskScore >= 9) return "high";
  if (riskScore > 0 && riskScore <= 3) return "low";
  return "medium";
}

function validDate(value: unknown) {
  const candidate = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: adapterCorsHeaders });
}

export async function POST(request: Request, context: { params: Promise<{ source: string }> }) {
  try {
    const { source } = await context.params;
    const sourceTool = source.toLowerCase();
    if (!new Set(["ncr", "capa"]).has(sourceTool)) {
      return NextResponse.json({ error: "Unsupported Northstar quality adapter." }, { status: 404, headers: adapterCorsHeaders });
    }

    const payload = await request.json();
    const { supabase, user, organizationId, organizationName } = await resolveNorthstarUser(request, payload);
    const record = payload?.record && typeof payload.record === "object"
      ? payload.record
      : payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload;

    const riskScore = numberValue(record.riskScore, record.rpn, record.riskRating, record.riskPriorityNumber);
    const sourceRecordKey = text(
      sourceTool === "capa" ? record.capaNumber : record.ncrNumber,
      record.reportNumber,
      record.recordNumber,
      record.recordId,
      record.id,
      `${sourceTool.toUpperCase()}-${Date.now()}`,
    ).slice(0, 180);

    const primaryDescription = text(
      record.problemStatement,
      record.nonconformanceDescription,
      record.problemDescription,
      record.description,
      record.issueDescription,
      record.title,
    );
    const title = text(
      record.title,
      sourceTool === "capa" ? `CAPA · ${sourceRecordKey}` : `NCR · ${sourceRecordKey}`,
    ).slice(0, 320);
    const summary = text(
      primaryDescription,
      `${sourceTool.toUpperCase()} submitted to the Northstar Intelligence Bus.`,
    ).slice(0, 16000);

    const calculatedCost = numberValue(
      record.totalCost,
      record.copq,
      record.costOfPoorQuality,
      Number(record.scrapCost || 0) + Number(record.reworkCost || 0) + Number(record.laborCost || 0) + Number(record.customerCost || 0) + Number(record.otherCost || 0),
    );

    const row = {
      organization_id: organizationId,
      source_tool: sourceTool,
      source_record_key: sourceRecordKey,
      title,
      summary,
      severity: normalizeSeverity(record.severity || record.riskLevel || record.classification, riskScore),
      record_status: text(record.finalStatus, record.status, record.dispositionStatus, "open").slice(0, 120),
      organization_name: organizationName,
      site: text(record.site, record.location, record.facility).slice(0, 180),
      department: text(record.department, record.processArea, record.responsibleDepartment).slice(0, 180),
      customer_name: text(record.customer, record.customerName, record.customerAccount).slice(0, 240),
      supplier_name: text(record.supplier, record.supplierName).slice(0, 240),
      product_name: text(record.product, record.productName, record.itemDescription).slice(0, 320),
      part_number: text(record.partNumber, record.itemNumber, record.productCode).slice(0, 180),
      order_number: text(record.orderNumber, record.salesOrder, record.workOrder, record.purchaseOrder).slice(0, 180),
      owner_name: text(record.owner, record.capaOwner, record.responsibleOwner, record.assignedTo).slice(0, 180),
      due_date: validDate(record.dueDate || record.targetCompletionDate || record.requiredResponseDate),
      financial_exposure: calculatedCost,
      revenue_exposure: numberValue(record.revenueExposure, record.revenueAtRisk, record.orderValue),
      payload,
      created_by: user.id,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await supabase
      .from("northstar_external_quality_records")
      .upsert(row, { onConflict: "organization_id,source_tool,source_record_key" })
      .select("id,source_record_key")
      .single();
    if (error) throw error;

    const { data: event } = await supabase
      .from("northstar_intelligence_events")
      .select("id,event_status,severity")
      .eq("event_key", `external-quality:${saved.id}`)
      .maybeSingle();

    return NextResponse.json({
      accepted: true,
      recordId: saved.source_record_key,
      adapterRecordId: saved.id,
      intelligenceEventId: event?.id || null,
      eventStatus: event?.event_status || "new",
      severity: event?.severity || row.severity,
      message: `${sourceTool.toUpperCase()} accepted by the Northstar Closed-Loop Execution Engine.`,
    }, { headers: adapterCorsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Northstar could not ingest the quality record.";
    const status = /session|required|assigned/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status, headers: adapterCorsHeaders });
  }
}
