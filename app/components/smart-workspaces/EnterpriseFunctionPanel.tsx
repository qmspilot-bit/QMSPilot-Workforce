"use client";

import { Activity, CalendarClock, CheckCircle2, Gauge, Play, ShieldCheck, Square, Target } from "lucide-react";

const n = (value?: string) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const pct = (value: number) => Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";
const dec = (value: number, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : "—";
const money = (value: number) => Number.isFinite(value) ? value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";
const nowLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const today = () => nowLocal().slice(0, 10);
const daysFromNow = (date?: string) => date ? Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000) : 0;
const daysBetween = (a?: string, b?: string) => a && b ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)) : 0;
const minutesBetween = (a?: string, b?: string) => a ? Math.max(0, Math.round(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 60000)) : 0;
const passCount = (values: Record<string, string>) => Object.values(values).filter(value => value === "Pass" || value === "Yes" || value === "Acceptable" || value === "Current / acceptable").length;
const failCount = (values: Record<string, string>) => Object.values(values).filter(value => value === "Fail" || value === "No" || value === "Rejected" || value === "Out of tolerance" || value === "Unable to verify").length;
const statusSignal = (value?: string) => value || "Pending controlled decision";

export type MetricMap = Record<string, string>;

export function deriveEnterpriseMetrics(
  discipline: string,
  toolId: string,
  values: Record<string, string>,
  dueDate = "",
  evidenceCount = 0,
): MetricMap {
  const m: MetricMap = {};

  if (discipline === "quality") {
    if (toolId === "ncr") {
      const inspected = n(values.qty_inspected), affected = n(values.qty_affected);
      m.affected_rate = inspected > 0 ? pct(affected / inspected * 100) : "Not calculated";
      m.customer_escape_signal = values.shipped === "Yes" ? "Customer / field review required" : "No shipped exposure recorded";
      m.disposition_status = statusSignal(values.disposition);
      m.release_signal = statusSignal(values.release_status);
    } else if (toolId === "capa") {
      m.effectiveness_due = values.effectiveness_date ? `${daysFromNow(values.effectiveness_date)} day(s)` : "Not scheduled";
      m.effectiveness_status = statusSignal(values.effectiveness_result);
      m.systemic_depth = values.systemic_cause && values.escape_cause ? "Occurrence, escape, and systemic causes addressed" : "Cause structure incomplete";
      m.action_readiness = values.corrective_action && values.escape_action ? "Action package defined" : "Actions incomplete";
    } else if (toolId === "fivewhy") {
      const depth = [1, 2, 3, 4, 5].filter(i => values[`why${i}`] && values[`why${i}_evidence`]).length;
      m.validated_why_depth = `${depth} of 5`;
      m.cause_status = values.verified_cause ? "Verified cause recorded" : "Cause not verified";
      m.escape_point = values.escape_point ? "Detection escape addressed" : "Escape point missing";
      m.action_link = statusSignal(values.action_link);
    } else if (toolId === "audit") {
      m.finding_class = statusSignal(values.result);
      m.response_due = values.response_due ? `${daysFromNow(values.response_due)} day(s)` : "Not scheduled";
      m.corrective_action = values.capa_required === "Yes" ? "CAPA required" : "Local correction / no CAPA";
      m.closure = statusSignal(values.closure_result);
    } else if (toolId === "lpa") {
      const planned = n(values.checks_planned), good = n(values.checks_conforming), bad = n(values.checks_nonconforming);
      m.conformance = planned > 0 ? pct(good / planned * 100) : "Not calculated";
      m.failed_checks = String(bad);
      m.repeat_signal = values.repeat_issue === "Yes" ? "Systemic escalation required" : "No repeat signal";
      m.audit_result = statusSignal(values.result);
    } else if (toolId === "inspection") {
      const accepted = n(values.qty_accepted), rejected = n(values.qty_rejected);
      m.acceptance_rate = accepted + rejected > 0 ? pct(accepted / (accepted + rejected) * 100) : "Not calculated";
      m.rejected_quantity = dec(rejected, 0);
      m.gage_signal = statusSignal(values.gage_status);
      m.release = statusSignal(values.release);
    } else if (toolId === "firstarticle") {
      const total = n(values.characteristics_total), pass = n(values.characteristics_passed), fail = n(values.characteristics_failed);
      m.characteristic_completion = total > 0 ? pct((pass + fail) / total * 100) : "Not calculated";
      m.characteristic_acceptance = total > 0 ? pct(pass / total * 100) : "Not calculated";
      m.failed_characteristics = dec(fail, 0);
      m.production_release = statusSignal(values.production_release);
    } else if (toolId === "calibration") {
      m.days_to_due = values.next_due ? `${daysFromNow(values.next_due)} day(s)` : "Not scheduled";
      m.calibration_result = statusSignal(values.result);
      m.product_impact = values.impact_required === "Yes" ? "Impact evaluation required" : "No impact evaluation required";
      m.final_status = statusSignal(values.final_status);
    } else if (toolId === "msa") {
      m.grr_result = values.grr_percent ? pct(n(values.grr_percent)) : "Not entered";
      m.ndc = values.ndc || "Not entered";
      m.system_decision = statusSignal(values.result);
      m.authorization = statusSignal(values.approval);
    } else if (toolId === "supplier") {
      const received = n(values.qty_received), affected = n(values.qty_affected);
      m.defect_rate = received > 0 ? pct(affected / received * 100) : "Not calculated";
      m.response_due = values.response_due ? `${daysFromNow(values.response_due)} day(s)` : "Not scheduled";
      m.disposition = statusSignal(values.disposition);
      m.issue_status = statusSignal(values.status);
    } else if (toolId === "scorecard") {
      const score = n(values.otd) * .35 + Math.max(0, 100 - n(values.ppm) / 100) * .35 + n(values.response_score) * .2 + n(values.audit_score) * .1;
      m.weighted_score = pct(score);
      m.ppm = values.ppm || "Not entered";
      m.cost_exposure = money(n(values.cost_impact));
      m.supplier_status = statusSignal(values.status);
    } else if (toolId === "complaint") {
      m.days_open = values.received_date ? `${daysBetween(values.received_date, values.customer_response || today())} day(s)` : "Not calculated";
      m.severity = statusSignal(values.severity);
      m.response_due = values.response_due ? `${daysFromNow(values.response_due)} day(s)` : "Not scheduled";
      m.recovery = statusSignal(values.customer_acceptance);
    } else if (toolId === "warranty") {
      m.claim_exposure = money(n(values.claim_value));
      m.coverage = statusSignal(values.coverage);
      m.responsibility = statusSignal(values.responsibility);
      m.claim_status = statusSignal(values.closure);
    } else if (toolId === "documents") {
      m.release_readiness = values.obsolete_control === "Yes" && values.system_release ? "Ready for effective release" : "Release controls incomplete";
      m.change_risk = statusSignal(values.risk);
      m.training_signal = values.training_required === "Yes" ? "Training required" : "No training required";
      m.effective_date = values.effective_date || "Not scheduled";
    } else if (toolId === "training") {
      m.qualification = statusSignal(values.result);
      m.days_to_expiry = values.expiration ? `${daysFromNow(values.expiration)} day(s)` : "No expiration set";
      m.authorization = values.authorization_scope ? "Scope defined" : "Authorization scope missing";
      m.evidence_items = String(evidenceCount);
    } else if (toolId === "risk") {
      m.initial_rpn = String(n(values.severity) * n(values.occurrence) * n(values.detection));
      m.residual_rpn = String(n(values.residual_severity) * n(values.residual_occurrence) * n(values.residual_detection));
      m.initial_class = statusSignal(values.risk_class);
      m.residual_class = statusSignal(values.residual_class);
    } else if (toolId === "change") {
      m.change_risk = statusSignal(values.risk);
      m.customer_approval = statusSignal(values.customer_approval);
      m.validation = statusSignal(values.validation_result);
      m.implementation = values.implementation_date || "Not scheduled";
    }
  }

  if (discipline === "warehouse") {
    if (toolId === "receiving") {
      m.quantity_variance = dec(n(values.qty_received) - n(values.qty_expected), 0);
      m.receipt_status = statusSignal(values.status);
      m.inspection_signal = values.inspection_required === "Yes" ? "Inspection queue required" : "Direct routing allowed";
      m.next_route = statusSignal(values.routing);
    } else if (toolId === "inspection") {
      const pass = n(values.qty_passed), fail = n(values.qty_failed);
      m.sample_acceptance = pass + fail > 0 ? pct(pass / (pass + fail) * 100) : "Not calculated";
      m.failed_sample = dec(fail, 0);
      m.result = statusSignal(values.result);
      m.disposition = statusSignal(values.disposition);
    } else if (toolId === "damage") {
      m.damaged_quantity = values.qty_damaged || "0";
      m.claim_exposure = money(n(values.claim_value));
      m.risk = statusSignal(values.risk);
      m.recovery_status = statusSignal(values.closure);
    } else if (toolId === "putaway") {
      m.quantity_variance = dec(n(values.quantity_confirmed) - n(values.quantity), 0);
      m.material_status = statusSignal(values.material_status);
      m.location_check = statusSignal(values.capacity_check);
      m.system_sync = values.system_update ? "System updated" : "System transaction missing";
    } else if (toolId === "lookup") {
      m.inventory_status = statusSignal(values.status);
      m.location_match = statusSignal(values.match);
      m.quantity_on_hand = values.quantity_on_hand || "0";
      m.allocation = values.allocation || "Unallocated";
    } else if (toolId === "transfer") {
      m.pick_variance = dec(n(values.picked_qty) - n(values.quantity), 0);
      m.receipt_variance = dec(n(values.received_qty) - n(values.quantity), 0);
      m.reconciliation = values.reconciled === "Yes" ? "Reconciled" : "Variance open";
      m.material_status = statusSignal(values.status);
    } else if (toolId === "cycle") {
      const finalCount = n(values.second_count || values.first_count);
      m.count_variance = dec(finalCount - n(values.system_qty), 0);
      m.adjustment = dec(n(values.approved_qty) - n(values.system_qty), 0);
      m.variance_reason = statusSignal(values.variance_reason);
      m.verification = statusSignal(values.verified);
    } else if (toolId === "request") {
      const fill = n(values.quantity) > 0 ? n(values.received_qty) / n(values.quantity) * 100 : 0;
      m.fill_rate = n(values.quantity) > 0 ? pct(fill) : "Not calculated";
      m.need_by = values.need_by ? `${minutesBetween(values.need_by) * -1} min relative` : "Not scheduled";
      m.availability = statusSignal(values.allocation_status);
      m.request_status = statusSignal(values.status);
    } else if (toolId === "kit") {
      const required = n(values.required_lines), complete = n(values.complete_lines);
      m.kit_completeness = required > 0 ? pct(complete / required * 100) : "Not calculated";
      m.short_lines = values.short_lines || "0";
      m.traceability = values.lot_serial_control === "Yes" ? "Verified" : "Not verified";
      m.kit_status = statusSignal(values.kit_status);
    } else if (toolId === "quarantine") {
      m.hold_age = values.hold_date ? `${daysBetween(values.hold_date, today())} day(s)` : "Not calculated";
      m.held_value = money(n(values.estimated_value));
      m.quantity_on_hold = values.quantity || "0";
      m.status = statusSignal(values.status);
    } else if (toolId === "fifo") {
      m.days_to_expiry = values.selected_date ? `${daysFromNow(values.selected_date)} day(s)` : "Not calculated";
      m.rotation_rule = statusSignal(values.rotation_rule);
      m.verification = statusSignal(values.rotation_result);
      m.release = statusSignal(values.pick_release);
    } else if (toolId === "shipment") {
      m.quantity_variance = dec(n(values.qty_loaded) - n(values.qty_required), 0);
      m.failed_controls = String(failCount(values));
      m.release = statusSignal(values.release);
      m.shipment_confirmation = values.ship_confirmation ? "Confirmed" : "Missing";
    } else if (toolId === "photos") {
      const required = ["product_views", "packaging_views", "label_views", "securement_views", "trailer_views"];
      const complete = required.filter(key => values[key] === "Yes").length;
      m.view_completion = pct(complete / required.length * 100);
      m.evidence_items = String(evidenceCount);
      m.review = statusSignal(values.review_result);
      m.report = values.file_reference || "Not published";
    } else if (toolId === "forklift") {
      m.failed_checks = String(failCount(values));
      m.out_of_service = values.out_of_service === "Yes" ? "Removed from service" : "Not removed";
      m.operating_decision = statusSignal(values.decision);
      m.evidence_items = String(evidenceCount);
    } else if (toolId === "rack") {
      m.failed_checks = String(failCount(values));
      m.risk_class = statusSignal(values.risk);
      m.work_order = values.work_order || "No action reference";
      m.verification = values.verification ? "Recorded" : "Pending";
    }
  }

  if (discipline === "maintenance") {
    if (toolId === "workorder") {
      m.work_duration = values.work_start ? `${minutesBetween(values.work_start, values.work_end)} min` : "Not started";
      m.priority = statusSignal(values.priority);
      m.plan_status = statusSignal(values.planning_status);
      m.asset_status = statusSignal(values.final_status);
    } else if (toolId === "pm") {
      const required = n(values.tasks_required), complete = n(values.tasks_completed);
      m.task_completion = required > 0 ? pct(complete / required * 100) : "Not calculated";
      m.days_to_due = values.due_date ? `${daysFromNow(values.due_date)} day(s)` : "Not scheduled";
      m.asset_condition = statusSignal(values.condition);
      m.release = statusSignal(values.release);
    } else if (toolId === "breakdown") {
      m.downtime = values.failure_start ? `${minutesBetween(values.failure_start, values.restored_time)} min` : "Not calculated";
      m.impact = statusSignal(values.impact);
      m.repeat_signal = values.repeat === "Yes" ? "RCA required" : "No repeat signal";
      m.asset_status = statusSignal(values.status);
    } else if (toolId === "history") {
      m.asset_criticality = statusSignal(values.criticality);
      m.current_condition = statusSignal(values.condition);
      m.days_to_next_action = values.next_due ? `${daysFromNow(values.next_due)} day(s)` : "Not scheduled";
      m.event_type = statusSignal(values.event_type);
    } else if (toolId === "inspection") {
      m.failed_checks = String(failCount(values));
      m.condition_risk = statusSignal(values.risk);
      m.operating_status = statusSignal(values.status);
      m.work_order = values.work_order || "No follow-up work order";
    } else if (toolId === "lubrication") {
      m.point_condition = statusSignal(values.condition_before);
      m.task_result = statusSignal(values.result);
      m.next_due = values.next_due || "Not scheduled";
      m.follow_up = values.work_order || "No corrective work";
    } else if (toolId === "spares") {
      const available = n(values.final_available || values.on_hand) - n(values.reserved);
      m.available_quantity = dec(available, 0);
      m.minimum_gap = dec(available - n(values.minimum), 0);
      m.stock_status = statusSignal(values.status);
      m.lead_time = values.lead_time_days ? `${values.lead_time_days} day(s)` : "Not entered";
    } else if (toolId === "predictive") {
      m.trend = statusSignal(values.trend);
      m.action_window = values.remaining_life || "Not estimated";
      m.follow_up = values.follow_up_date ? `${daysFromNow(values.follow_up_date)} day(s)` : "Not scheduled";
      m.work_order = values.work_order || "No work order";
    } else if (toolId === "permit") {
      m.permit_type = statusSignal(values.permit_type);
      m.zero_energy = values.zero_energy ? "Verification recorded" : "Verification missing";
      m.restoration = statusSignal(values.guards_restored);
      m.permit_status = statusSignal(values.permit_status);
    } else if (toolId === "contractor") {
      m.qualification = statusSignal(values.qualification);
      m.orientation = statusSignal(values.orientation);
      m.acceptance_test = statusSignal(values.inspection);
      m.work_acceptance = statusSignal(values.acceptance);
    } else if (toolId === "technical") {
      m.impact = statusSignal(values.impact);
      m.need_by = values.need_by ? `${minutesBetween(values.need_by) * -1} min relative` : "Not scheduled";
      m.specialist = values.assigned_to || "Unassigned";
      m.request_status = statusSignal(values.status);
    } else if (toolId === "rootcause") {
      m.trigger = statusSignal(values.trigger);
      m.cause_depth = values.physical_cause && values.latent_cause && values.escape_cause ? "Physical, latent, and escape causes addressed" : "Cause structure incomplete";
      m.effectiveness_due = values.review_date ? `${daysFromNow(values.review_date)} day(s)` : "Not scheduled";
      m.effectiveness = statusSignal(values.result);
    }
  }

  if (discipline === "safety") {
    if (toolId === "observation") {
      m.observation_type = statusSignal(values.observation_type);
      m.potential = statusSignal(values.potential);
      m.stop_work = values.work_stopped === "Yes" ? "Work stopped" : "Work continued";
      m.outcome = statusSignal(values.closure);
    } else if (toolId === "hazard") {
      m.initial_risk_score = String(n(values.severity) * n(values.likelihood));
      m.residual_risk_score = String(n(values.residual_severity) * n(values.residual_likelihood));
      m.control_level = statusSignal(values.control_hierarchy);
      m.status = statusSignal(values.status);
    } else if (toolId === "incident") {
      m.actual_severity = statusSignal(values.actual_severity);
      m.potential_severity = statusSignal(values.potential_severity);
      m.regulatory_status = statusSignal(values.regulatory);
      m.investigation_status = statusSignal(values.closure);
    } else if (toolId === "nearmiss") {
      m.potential = statusSignal(values.potential);
      m.barrier_status = values.barrier_failure ? "Barrier gap documented" : "Barrier analysis missing";
      m.learning_status = values.shared_learning ? "Learning shared" : "Learning not shared";
      m.status = statusSignal(values.status);
    } else if (toolId === "ppe") {
      m.failed_checks = String(failCount(values));
      m.respiratory = statusSignal(values.respiratory);
      m.training_fit = statusSignal(values.training);
      m.task_authorization = statusSignal(values.task_status);
    } else if (toolId === "jha") {
      m.initial_risk = statusSignal(values.initial_risk);
      m.residual_risk = statusSignal(values.residual_risk);
      m.crew_briefed = values.crew_briefed === "Yes" ? "Crew acknowledged" : "Acknowledgement missing";
      m.authorization = statusSignal(values.authorization);
    } else if (toolId === "audit") {
      const checks = n(values.checks), conforming = n(values.conforming);
      m.conformance = checks > 0 ? pct(conforming / checks * 100) : "Not calculated";
      m.findings = values.findings || "0";
      m.critical_findings = values.critical_findings || "0";
      m.closure = statusSignal(values.closure);
    } else if (toolId === "forklift") {
      m.failed_checks = String(failCount(values));
      m.removal_status = values.removed === "Yes" ? "Out of service" : "Not removed";
      m.operating_decision = statusSignal(values.decision);
      m.operator = values.operator || "Not identified";
    } else if (toolId === "permit") {
      m.permit_type = statusSignal(values.permit_type);
      m.conditions_changed = values.conditions_changed === "Yes" ? "Revalidation required" : "No change recorded";
      m.restoration = statusSignal(values.systems_restored);
      m.permit_status = statusSignal(values.permit_status);
    } else if (toolId === "emergency") {
      m.accountability = statusSignal(values.accountability);
      m.communications = statusSignal(values.communications);
      m.equipment = statusSignal(values.equipment);
      m.drill_result = statusSignal(values.result);
    } else if (toolId === "training") {
      m.qualification = statusSignal(values.result);
      m.days_to_expiry = values.expiration ? `${daysFromNow(values.expiration)} day(s)` : "No expiration set";
      m.authorization = values.authorization ? "Scope defined" : "Scope missing";
      m.evidence_items = String(evidenceCount);
    } else if (toolId === "chemical") {
      m.approval = statusSignal(values.approval);
      m.sds_status = values.sds_revision ? "SDS identified" : "SDS missing";
      m.labeling = statusSignal(values.labeling);
      m.review_due = values.review_date ? `${daysFromNow(values.review_date)} day(s)` : "Not scheduled";
    }
  }

  if (discipline === "supplier") {
    if (toolId === "approval") {
      m.criticality = statusSignal(values.criticality);
      m.audit_signal = values.audit_required === "Yes" ? "Audit required" : "No audit required";
      m.risk = statusSignal(values.risk);
      m.approval_status = statusSignal(values.status);
    } else if (toolId === "risk") {
      const dimensions = ["quality_risk", "delivery_risk", "capacity_risk", "financial_risk", "geographic_risk", "compliance_risk"];
      m.average_dimension_score = dec(dimensions.reduce((sum, key) => sum + n(values[key]), 0) / dimensions.length, 1);
      m.single_source = values.single_source === "Yes" ? "Single / sole source" : "Alternative source recorded";
      m.initial_risk = statusSignal(values.risk);
      m.residual_risk = statusSignal(values.residual_risk);
    } else if (toolId === "scorecard") {
      const score = n(values.otd) * .35 + Math.max(0, 100 - n(values.ppm) / 100) * .35 + n(values.response) * .2 + n(values.audit) * .1;
      m.weighted_score = pct(score);
      m.ppm = values.ppm || "Not entered";
      m.copq = money(n(values.copq));
      m.status = statusSignal(values.status);
    } else if (toolId === "scar") {
      m.containment_due = values.containment_due ? `${daysFromNow(values.containment_due)} day(s)` : "Not scheduled";
      m.response_due = values.root_cause_due ? `${daysFromNow(values.root_cause_due)} day(s)` : "Not scheduled";
      m.effectiveness = statusSignal(values.effectiveness_result);
      m.scar_status = statusSignal(values.status);
    } else if (toolId === "audit") {
      m.audit_score = values.score ? pct(n(values.score)) : "Not entered";
      m.highest_finding = statusSignal(values.finding_class);
      m.response_due = values.response_due ? `${daysFromNow(values.response_due)} day(s)` : "Not scheduled";
      m.supplier_status = statusSignal(values.status);
    } else if (toolId === "incoming") {
      const received = n(values.qty_received), affected = n(values.qty_affected);
      m.defect_rate = received > 0 ? pct(affected / received * 100) : "Not calculated";
      m.risk = statusSignal(values.risk);
      m.disposition = statusSignal(values.disposition);
      m.issue_status = statusSignal(values.status);
    } else if (toolId === "ppap") {
      const keys = ["design_record", "process_flow", "msa", "dimensional", "material_performance", "capability", "samples", "psw"];
      const passed = keys.filter(key => values[key] === "Pass" || values[key] === "Not applicable").length;
      m.element_completion = pct(passed / keys.length * 100);
      m.failed_elements = String(keys.filter(key => values[key] === "Fail").length);
      m.approval_result = statusSignal(values.result);
      m.interim_expiry = values.interim_expiration ? `${daysFromNow(values.interim_expiration)} day(s)` : "Not applicable";
    } else if (toolId === "avl") {
      m.avl_status = statusSignal(values.status);
      m.supplier_risk = statusSignal(values.risk);
      m.certification_due = values.certification_expiration ? `${daysFromNow(values.certification_expiration)} day(s)` : "Not entered";
      m.next_review = values.review_date ? `${daysFromNow(values.review_date)} day(s)` : "Not scheduled";
    } else if (toolId === "change") {
      m.change_risk = statusSignal(values.risk);
      m.customer_approval = statusSignal(values.customer_approval);
      m.decision = statusSignal(values.decision);
      m.planned_date = values.planned_date || "Not scheduled";
    } else if (toolId === "development") {
      m.priority = statusSignal(values.priority);
      m.progress = statusSignal(values.performance_result);
      m.ownership = values.supplier_owner && values.internal_owner ? "Dual ownership established" : "Ownership incomplete";
      m.sustainment = values.sustainment ? "Defined" : "Not defined";
    } else if (toolId === "exception") {
      m.quantity_gap = dec(n(values.qty_confirmed) - n(values.qty_required), 0);
      m.days_from_required = values.required_date && values.committed_date ? `${daysBetween(values.required_date, values.committed_date)} day(s)` : "Not calculated";
      m.impact = statusSignal(values.impact);
      m.exception_status = statusSignal(values.status);
    } else if (toolId === "review") {
      m.relationship_status = statusSignal(values.relationship_status);
      m.next_review = values.next_review ? `${daysFromNow(values.next_review)} day(s)` : "Not scheduled";
      m.commitments = values.new_commitments ? "New commitments recorded" : "No commitments recorded";
      m.executive_support = values.executive_support ? "Support requested" : "No support request";
    }
  }

  if (discipline === "delivery") {
    if (toolId === "verify") {
      m.quantity_variance = dec(n(values.qty_loaded) - n(values.qty_required), 0);
      m.failed_controls = String(failCount(values));
      m.release = statusSignal(values.release);
      m.departure = values.actual_departure || "Not departed";
    } else if (toolId === "photos") {
      const keys = ["identity_views", "packaging_views", "label_views", "securement_views", "vehicle_views"];
      const done = keys.filter(key => values[key] === "Yes").length;
      m.view_completion = pct(done / keys.length * 100);
      m.evidence_items = String(evidenceCount);
      m.review = statusSignal(values.review_result);
      m.customer_release = values.released_to_customer === "Yes" ? "Released" : "Not released";
    } else if (toolId === "packaging") {
      m.failed_controls = String(failCount(values));
      m.transport_mode = statusSignal(values.mode);
      m.packaging_result = statusSignal(values.verification);
      m.weight_dimensions = values.weight_dimensions || "Not entered";
    } else if (toolId === "documents") {
      m.failed_documents = String(failCount(values));
      m.data_match = statusSignal(values.data_match);
      m.release = statusSignal(values.release);
      m.archive = values.archive ? "Archived" : "Archive missing";
    } else if (toolId === "release") {
      m.failed_controls = String(failCount(values));
      m.hold_status = statusSignal(values.ncr_holds);
      m.customer_approval = statusSignal(values.customer_approval);
      m.release_status = statusSignal(values.release_status);
    } else if (toolId === "exception") {
      m.forecast_slip = values.original_commit && values.current_forecast ? `${minutesBetween(values.original_commit, values.current_forecast)} min` : "Not calculated";
      m.impact = statusSignal(values.impact);
      m.premium_cost = money(n(values.premium_cost));
      m.exception_status = statusSignal(values.status);
    } else if (toolId === "damage") {
      m.damaged_quantity = values.qty_damaged || "0";
      m.claim_exposure = money(n(values.claim_value));
      m.responsibility = statusSignal(values.responsibility);
      m.claim_status = statusSignal(values.status);
    } else if (toolId === "carrier") {
      const score = n(values.on_time_delivery) * .4 + n(values.on_time_pickup) * .2 + n(values.tracking_score) * .15 + n(values.response_score) * .15 + n(values.invoice_accuracy) * .1;
      m.weighted_score = pct(score);
      m.claims = values.damage_claims || "0";
      m.cost_exposure = money(n(values.claim_value) + n(values.premium_cost));
      m.carrier_status = statusSignal(values.status);
    } else if (toolId === "pod") {
      m.delivery_variance = values.scheduled_delivery && values.actual_delivery ? `${minutesBetween(values.scheduled_delivery, values.actual_delivery)} min` : "Not calculated";
      m.delivery_condition = statusSignal(values.condition);
      m.billing_release = statusSignal(values.invoice_release);
      m.pod_status = statusSignal(values.status);
    } else if (toolId === "export") {
      m.party_screening = statusSignal(values.party_screening);
      m.license_status = statusSignal(values.license);
      m.export_release = statusSignal(values.release);
      m.record_status = values.record_location ? "Retained" : "Retention location missing";
    } else if (toolId === "appointment") {
      m.appointment_risk = statusSignal(values.risk);
      m.confirmation = values.confirmation || "Not confirmed";
      m.arrival = values.check_in || "Not checked in";
      m.status = statusSignal(values.status);
    } else if (toolId === "return") {
      m.receipt_variance = dec(n(values.qty_received) - n(values.qty_authorized), 0);
      m.authorization = statusSignal(values.authorization_status);
      m.disposition = statusSignal(values.disposition);
      m.rma_status = statusSignal(values.status);
    }
  }

  if (!Object.keys(m).length) {
    m.required_controls = String(passCount(values));
    m.open_exceptions = String(failCount(values));
    m.due_status = dueDate ? `${daysFromNow(dueDate)} day(s)` : "Not scheduled";
    m.evidence_items = String(evidenceCount);
  }
  return m;
}

function titleFor(discipline: string, toolId: string) {
  const titles: Record<string, string> = {
    "quality:ncr": "Nonconformance exposure and release", "quality:capa": "Corrective-action effectiveness", "quality:inspection": "Inspection and acceptance mathematics", "quality:risk": "Quality risk calculation",
    "warehouse:receiving": "Receipt reconciliation", "warehouse:cycle": "Inventory variance analysis", "warehouse:kit": "Kit-completeness analysis", "warehouse:quarantine": "Held inventory aging and value",
    "maintenance:workorder": "Work execution and asset status", "maintenance:pm": "PM compliance and task completion", "maintenance:breakdown": "Breakdown duration and repeat-loss signal", "maintenance:spares": "Critical-spare coverage",
    "safety:hazard": "Initial and residual hazard risk", "safety:incident": "Incident severity and reporting", "safety:audit": "Safety conformance", "safety:training": "Qualification and expiration",
    "supplier:scorecard": "Supplier weighted performance", "supplier:scar": "SCAR response and effectiveness", "supplier:ppap": "PPAP element readiness", "supplier:exception": "Supply recovery exposure",
    "delivery:verify": "Shipment readiness and quantity reconciliation", "delivery:exception": "Delivery slip and recovery cost", "delivery:carrier": "Carrier weighted performance", "delivery:pod": "Delivery confirmation and billing release",
  };
  return titles[`${discipline}:${toolId}`] || "Purpose-built operating signal";
}

export function EnterpriseFunctionPanel({
  discipline,
  toolId,
  values,
  dueDate,
  evidenceCount,
  setValue,
}: {
  discipline: string;
  toolId: string;
  values: Record<string, string>;
  dueDate: string;
  evidenceCount: number;
  setValue: (key: string, value: string) => void;
}) {
  const metrics = Object.entries(deriveEnterpriseMetrics(discipline, toolId, values, dueDate, evidenceCount)).slice(0, 4);
  const action = () => {
    const stamp = nowLocal();
    const date = today();
    if (discipline === "quality" && toolId === "ncr") { setValue("containment", values.containment || "Immediate containment completed and verified."); setValue("release_status", values.release_status || "Held pending approval"); }
    else if (discipline === "quality" && toolId === "capa") setValue("implementation_date", date);
    else if (discipline === "warehouse" && toolId === "receiving") setValue("qty_received", values.qty_received || values.qty_expected || "0");
    else if (discipline === "warehouse" && toolId === "shipment") setValue("release", "Released to ship");
    else if (discipline === "maintenance" && toolId === "workorder") setValue(values.work_start ? "work_end" : "work_start", stamp);
    else if (discipline === "maintenance" && toolId === "breakdown") setValue(values.failure_start ? "restored_time" : "failure_start", stamp);
    else if (discipline === "maintenance" && toolId === "pm") setValue("tasks_completed", values.tasks_required || "0");
    else if (discipline === "safety" && toolId === "hazard") setValue("immediate_control", values.immediate_control || "Immediate control applied and verified.");
    else if (discipline === "safety" && toolId === "incident") setValue("notifications", values.notifications || "Required internal notifications completed.");
    else if (discipline === "safety" && toolId === "permit") setValue("permit_status", "Closed");
    else if (discipline === "supplier" && toolId === "scar") setValue("containment", values.containment || "Supplier containment response received and under review.");
    else if (discipline === "supplier" && toolId === "ppap") setValue("result", "Approved");
    else if (discipline === "delivery" && toolId === "verify") setValue("actual_departure", stamp);
    else if (discipline === "delivery" && toolId === "appointment") setValue("check_in", stamp);
    else if (discipline === "delivery" && toolId === "pod") setValue("actual_delivery", stamp);
    else setValue("specialized_review_date", date);
  };

  return (
    <section className="enterprise-function-panel">
      <div className="enterprise-function-head">
        <span><Activity size={20} /></span>
        <div><small>PURPOSE-BUILT SMART FUNCTION</small><strong>{titleFor(discipline, toolId)}</strong></div>
      </div>
      <div className="enterprise-function-metrics">
        {metrics.map(([label, value]) => <article key={label}><small>{label.replaceAll("_", " ")}</small><strong>{value}</strong></article>)}
      </div>
      <div className="enterprise-function-actions">
        <button type="button" onClick={action}>{["workorder", "breakdown"].includes(toolId) ? (values.work_start || values.failure_start ? <Square size={15} /> : <Play size={15} />) : <CheckCircle2 size={15} />} Apply workflow action</button>
        <span><Gauge size={15} /> Signals update automatically from the controlled fields and evidence.</span>
      </div>
      <style>{`
        .enterprise-function-panel{margin-top:14px;padding:17px;border:1px solid #8fc0e8;border-radius:16px;background:linear-gradient(135deg,#eaf5ff,#fff);box-shadow:0 10px 28px rgba(27,88,138,.08)}
        .enterprise-function-head{display:flex;align-items:center;gap:11px}.enterprise-function-head>span{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#fff;background:linear-gradient(135deg,#0d315c,#1f67c8)}
        .enterprise-function-head small,.enterprise-function-head strong{display:block}.enterprise-function-head small{color:#0a66ff;font-size:8px;font-weight:900;letter-spacing:.12em}.enterprise-function-head strong{margin-top:4px;color:#10263a;font-size:15px}
        .enterprise-function-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin-top:13px}.enterprise-function-metrics article{padding:11px;border:1px solid #d1e2ef;border-radius:11px;background:#fff}.enterprise-function-metrics small,.enterprise-function-metrics strong{display:block}.enterprise-function-metrics small{color:#6c8294;font-size:7px;font-weight:900;text-transform:uppercase}.enterprise-function-metrics strong{margin-top:5px;color:#113b60;font-size:14px;line-height:1.3}
        .enterprise-function-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:11px}.enterprise-function-actions button{min-height:38px;display:inline-flex;align-items:center;gap:7px;padding:0 12px;border:1px solid #9fc8e8;border-radius:9px;color:#0d4f83;background:#fff;font-size:9px;font-weight:900;cursor:pointer}.enterprise-function-actions span{display:flex;align-items:center;gap:6px;color:#60798d;font-size:8px}
      `}</style>
    </section>
  );
}
