import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outputDir = path.join(root, "public", "scenarios", "northstar");
const renderDir = path.join(root, "tmp", "rendered-xlsx");
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(renderDir, { recursive: true });

const C = {
  navy: "#0B2545",
  blue: "#1457C9",
  paleBlue: "#E8F0FB",
  pale: "#F4F7FB",
  white: "#FFFFFF",
  ink: "#182033",
  muted: "#66758E",
  gold: "#C68619",
  paleGold: "#FFF5DE",
  green: "#158365",
  paleGreen: "#E8F7F1",
  red: "#B42318",
  paleRed: "#FCECEA",
  rule: "#D7E0EC",
};

function titleBand(sheet, title, subtitle, endCol) {
  sheet.mergeCells(`A1:${endCol}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = {
    fill: C.navy,
    font: { name: "Aptos Display", size: 20, bold: true, color: C.white },
    verticalAlignment: "center",
  };
  sheet.getRange("A1").format.rowHeight = 34;
  sheet.mergeCells(`A2:${endCol}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = {
    fill: C.paleBlue,
    font: { name: "Aptos", size: 10, italic: true, color: C.muted },
    verticalAlignment: "center",
  };
  sheet.getRange("A2").format.rowHeight = 26;
  sheet.mergeCells(`A3:${endCol}3`);
  sheet.getRange("A3").values = [["SYNTHETIC VALIDATION EVIDENCE • Fictional company • No real customer or employee data"]];
  sheet.getRange("A3").format = {
    font: { name: "Aptos", size: 8, bold: true, color: C.gold },
    verticalAlignment: "center",
  };
  sheet.getRange("A3").format.rowHeight = 20;
}

function styleHeader(range) {
  range.format = {
    fill: C.blue,
    font: { name: "Aptos", size: 9, bold: true, color: C.white },
    wrapText: true,
    verticalAlignment: "center",
    horizontalAlignment: "left",
    borders: { preset: "outside", style: "thin", color: C.navy },
  };
  range.format.rowHeight = 30;
}

function styleBody(range) {
  range.format = {
    font: { name: "Aptos", size: 9, color: C.ink },
    wrapText: true,
    verticalAlignment: "top",
    borders: {
      insideHorizontal: { style: "thin", color: C.rule },
      bottom: { style: "thin", color: C.rule },
    },
  };
}

function addStatusFormatting(range) {
  range.conditionalFormats.add("containsText", { text: "Overdue", format: { fill: C.paleRed, font: { color: C.red, bold: true } } });
  range.conditionalFormats.add("containsText", { text: "Current", format: { fill: C.paleGreen, font: { color: C.green, bold: true } } });
  range.conditionalFormats.add("containsText", { text: "Closed", format: { fill: C.paleGreen, font: { color: C.green, bold: true } } });
  range.conditionalFormats.add("containsText", { text: "Open", format: { fill: C.paleGold, font: { color: C.gold, bold: true } } });
}

function setWidths(sheet, widths) {
  for (const [col, width] of Object.entries(widths)) {
    sheet.getRange(`${col}:${col}`).format.columnWidth = width;
  }
}

async function renderAll(workbook, workbookName) {
  for (const sheet of workbook.worksheets.items) {
    const preview = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1, format: "png" });
    const safe = sheet.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await fs.writeFile(path.join(renderDir, `${workbookName}-${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
  }
}

async function saveWorkbook(workbook, filename) {
  const inspection = await workbook.inspect({ kind: "sheet,formula", maxChars: 8000, options: { maxResults: 200 } });
  await fs.writeFile(path.join(renderDir, `${filename}.inspect.txt`), inspection.ndjson ?? JSON.stringify(inspection, null, 2));
  const exported = await SpreadsheetFile.exportXlsx(workbook);
  await exported.save(path.join(outputDir, filename));
  await renderAll(workbook, filename.replace(/\.xlsx$/i, ""));
}

async function buildCapa() {
  const wb = Workbook.create();
  const summary = wb.worksheets.add("Leadership Summary");
  const register = wb.worksheets.add("CAPA Register");
  const lists = wb.worksheets.add("Lists");
  [summary, register, lists].forEach((s) => { s.showGridLines = false; });

  titleBand(summary, "Northstar Corrective Action — Leadership Summary", "Status date: 16 July 2026 • Source of truth: CAPA Register tab", "J");
  summary.getRange("A5:B5").values = [["Metric", "Value"]];
  styleHeader(summary.getRange("A5:B5"));
  summary.getRange("A6:A10").values = [["Total CAPA"], ["Open"], ["Overdue open"], ["High-risk open"], ["Closed effective"]];
  summary.getRange("B6").formulas = [["=COUNTA('CAPA Register'!A7:A200)"]];
  summary.getRange("B7").formulas = [["=COUNTIF('CAPA Register'!G7:G200,\"Open\")"]];
  summary.getRange("B8").formulas = [["=COUNTIF('CAPA Register'!Q7:Q200,\">0\")"]];
  summary.getRange("B9").formulas = [["=COUNTIFS('CAPA Register'!E7:E200,\"High\",'CAPA Register'!G7:G200,\"Open\")"]];
  summary.getRange("B10").formulas = [["=COUNTIFS('CAPA Register'!G7:G200,\"Closed\",'CAPA Register'!N7:N200,\"Effective\")"]];
  styleBody(summary.getRange("A6:B10"));
  summary.getRange("B6:B10").format = { fill: C.paleBlue, font: { name: "Aptos Display", size: 16, bold: true, color: C.navy }, horizontalAlignment: "center" };
  summary.getRange("D5:J5").merge();
  summary.getRange("D5").values = [["Leadership note"]];
  styleHeader(summary.getRange("D5:J5"));
  summary.getRange("D6:J10").merge();
  summary.getRange("D6").values = [["The management-review minutes reported two overdue items. The live register should be used to confirm the actual count and to identify actions lacking closure evidence or an effectiveness plan."]];
  summary.getRange("D6:J10").format = { fill: C.paleGold, font: { name: "Aptos", size: 11, color: C.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: C.gold } };
  summary.getRange("A12:J12").merge();
  summary.getRange("A12").values = [["This workbook is synthetic validation evidence. Its formulas and status colors are intentionally live so future edits update the summary."]];
  summary.getRange("A12").format = { font: { name: "Aptos", size: 9, italic: true, color: C.muted } };
  setWidths(summary, { A: 24, B: 14, C: 3, D: 15, E: 15, F: 15, G: 15, H: 15, I: 15, J: 15 });

  titleBand(register, "CAPA Action Register", "Status date: 16 July 2026 • Edit categorical fields using the drop-downs", "Q");
  register.getRange("A5:Q5").merge();
  register.getRange("A5").values = [["Register owner: Quality Systems Manager • Review cadence: every two weeks • Dates are YYYY-MM-DD"]];
  register.getRange("A5").format = { fill: C.pale, font: { name: "Aptos", size: 9, color: C.muted } };
  const headers = ["CAPA ID", "Source", "Opened", "Issue / problem", "Risk", "Accountable owner", "Status", "Immediate containment", "Root cause", "Due date", "Correction / corrective action", "Closure evidence", "Effectiveness plan", "Effectiveness result", "Closed date", "Related records", "Days overdue"];
  register.getRange("A6:Q6").values = [headers];
  styleHeader(register.getRange("A6:Q6"));
  const rows = [
    ["C-021", "Internal process", new Date("2026-02-03"), "Incorrect label template used on internal transfer bins.", "Medium", "Warehouse Manager", "Closed", "Affected bins relabeled before use.", "Template selected by description instead of controlled part number.", new Date("2026-04-15"), "Key templates to part number; remove obsolete templates; retrain affected users.", "CR-2026-041, access log, and 12 training records attached.", "Review 240 labels over 60 days; zero recurrence required.", "Effective", new Date("2026-06-13"), "Clean Evidence Packet, Record 2", null],
    ["C-022", "Customer feedback", new Date("2026-03-10"), "Packing-list contact field occasionally omitted.", "Low", "Customer Service Manager", "Closed", "Manual review added for open shipments.", "Optional ERP field not included in release checklist.", new Date("2026-05-08"), "Make field mandatory and add release check.", "ERP change EC-1182 and checklist revision attached.", "Sample 50 orders over 30 days; zero omissions.", "Effective", new Date("2026-05-30"), "ERP EC-1182", null],
    ["C-023", "Process metric", new Date("2026-06-02"), "Scrap on HX-320 exceeds monthly target.", "Medium", "Machining Manager", "Open", "Daily tool-life review started.", "Tool-change interval may not reflect revised alloy hardness.", new Date("2026-07-25"), "Run tool-life study and revise interval if supported.", "", "Compare scrap rate for four weeks after change; target <=2.5%.", "Pending", null, "Scrap dashboard June 2026", null],
    ["C-024", "Supplier SCAR", new Date("2026-06-18"), "Repeat burr on HX-410 coolant-port sealing surface.", "High", "Supply Chain Manager", "Open", "Lot quarantined; 100% sort for three shipments.", "Supplier states operator inconsistency; supporting analysis not supplied.", new Date("2026-07-05"), "Obtain verified cause, control-plan change, implementation evidence, and escalation decision.", "Containment logs only.", "No approved sampling duration or acceptance criterion.", "Not started", null, "SCAR-2026-007; prior SCAR-2026-002", null],
    ["C-025", "Training review", new Date("2026-06-20"), "Revision C training not confirmed for all affected M-14 personnel.", "High", "HR Manager", "Open", "Supervisors asked to pair unverified personnel with qualified staff.", "Affected-population reconciliation was not completed after revision release.", new Date("2026-07-08"), "Confirm assignment list; train or formally restrict unqualified personnel.", "Partial roster; two required completions blank.", "Observe three independent jobs per affected person after training.", "Not started", null, "Training Matrix; WI-410 Rev C", null],
    ["C-026", "Internal audit IA-26-14", new Date("2026-06-24"), "Obsolete HX-410 drawing Rev B found at M-14 point of use.", "High", "Quality Systems Manager", "Open", "Rev B packet removed; lot L26-0619 placed under review.", "Shared-drive archive access and shift revision checks not yet fully investigated.", new Date("2026-07-10"), "Block archive retrieval, complete impact review, verify all points of use, and retrain supervisors.", "Rev B removal note only; product-impact decision absent.", "Audit all production points weekly for four weeks; zero obsolete copies.", "Not started", null, "IA-26-14; CC-2026-014; lot L26-0619", null],
    ["C-027", "Internal audit IA-26-15", new Date("2026-06-24"), "No completion or approved deferral evidence for PM on HF-1500 and HF-2600.", "High", "Maintenance Manager", "Open", "Operators completed visual checks before continued use.", "CMMS migration cited; whether maintenance occurred is unverified.", new Date("2026-07-12"), "Reconstruct records, inspect assets, decide disposition, and establish migration reconciliation control.", "No work order, service record, or approved deferral attached.", "Review all migrated PM work orders for two cycles; no missing completions.", "Not started", null, "IA-26-15; PM Records", null],
    ["C-028", "Customer complaint", new Date("2026-06-22"), "Titan Thermal reported seal leakage on HX-410 lot L26-0619.", "High", "Customer Quality Manager", "Open", "Finished goods held; 100% visual inspection; replacements shipped.", "Investigation open; possible supplier burr, drawing revision, or other contributing factors.", new Date("2026-07-29"), "Complete controlled cause analysis, product-impact review, and final customer response.", "Containment and returned-unit photos attached; final cause absent.", "Verify three subsequent lots and customer acceptance; criteria not yet approved.", "Pending", null, "CC-2026-014; SCAR-2026-007; IA-26-14", null],
  ];
  register.getRange(`A7:Q${6 + rows.length}`).values = rows;
  register.getRange("Q7").formulas = [["=IF(OR(G7=\"Closed\",J7=\"\"),0,MAX(0,DATE(2026,7,16)-J7))"]];
  register.getRange(`Q7:Q${6 + rows.length}`).fillDown();
  styleBody(register.getRange(`A7:Q${6 + rows.length}`));
  register.getRange(`C7:C${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  register.getRange(`J7:J${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  register.getRange(`O7:O${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  register.getRange(`E7:E200`).dataValidation = { rule: { type: "list", values: ["High", "Medium", "Low"] } };
  register.getRange(`G7:G200`).dataValidation = { rule: { type: "list", values: ["Open", "Closed", "On Hold"] } };
  register.getRange(`N7:N200`).dataValidation = { rule: { type: "list", values: ["Not started", "Pending", "Effective", "Ineffective"] } };
  addStatusFormatting(register.getRange(`G7:G200`));
  register.getRange(`Q7:Q200`).conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.paleRed, font: { color: C.red, bold: true } } });
  register.freezePanes.freezeRows(6);
  register.freezePanes.freezeColumns(2);
  setWidths(register, { A: 11, B: 18, C: 12, D: 34, E: 10, F: 22, G: 11, H: 33, I: 35, J: 12, K: 38, L: 34, M: 35, N: 16, O: 12, P: 32, Q: 12 });
  register.getRange(`A7:Q${6 + rows.length}`).format.rowHeight = 64;

  lists.getRange("A1:C6").values = [["Risk", "Status", "Effectiveness"], ["High", "Open", "Not started"], ["Medium", "Closed", "Pending"], ["Low", "On Hold", "Effective"], [null, null, "Ineffective"], [null, null, null]];
  styleHeader(lists.getRange("A1:C1"));
  styleBody(lists.getRange("A2:C6"));
  setWidths(lists, { A: 18, B: 18, C: 20 });

  await saveWorkbook(wb, "04_CAPA_Action_Register.xlsx");
}

async function buildTraining() {
  const wb = Workbook.create();
  const summary = wb.worksheets.add("Summary");
  const matrix = wb.worksheets.add("Training Matrix");
  const requirements = wb.worksheets.add("Requirements");
  [summary, matrix, requirements].forEach((s) => { s.showGridLines = false; });

  titleBand(summary, "Northstar Competence and Training Summary", "Affected-population detail for WI-410 Revision C • Status date: 16 July 2026", "H");
  summary.getRange("A5:B5").values = [["Metric", "Value"]];
  styleHeader(summary.getRange("A5:B5"));
  summary.getRange("A6:A9").values = [["Required assignments"], ["Current"], ["Overdue"], ["Completion rate"]];
  summary.getRange("B6").formulas = [["=COUNTA('Training Matrix'!A7:A200)"]];
  summary.getRange("B7").formulas = [["=COUNTIF('Training Matrix'!J7:J200,\"Current\")"]];
  summary.getRange("B8").formulas = [["=COUNTIF('Training Matrix'!J7:J200,\"Overdue\")"]];
  summary.getRange("B9").formulas = [["=IF(B6=0,0,B7/B6)"]];
  styleBody(summary.getRange("A6:B9"));
  summary.getRange("B9").setNumberFormat("0.0%");
  summary.getRange("D5:H5").merge();
  summary.getRange("D5").values = [["Reconciliation note"]];
  styleHeader(summary.getRange("D5:H5"));
  summary.getRange("D6:H9").merge();
  summary.getRange("D6").values = [["Management review reported 98% completion. This workbook is the affected-population detail for WI-410 Revision C and should be reconciled to the dashboard before leadership relies on that percentage."]];
  summary.getRange("D6:H9").format = { fill: C.paleGold, font: { name: "Aptos", size: 11, color: C.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: C.gold } };
  setWidths(summary, { A: 24, B: 16, C: 3, D: 18, E: 18, F: 18, G: 18, H: 18 });

  titleBand(matrix, "Training Matrix — WI-410 Revision C", "Affected personnel assigned to HX-410 production and inspection • Status date: 16 July 2026", "K");
  matrix.getRange("A5:K5").merge();
  matrix.getRange("A5").values = [["Requirement: complete training before independent use; supervisors record qualification evidence and any work restriction."]];
  matrix.getRange("A5").format = { fill: C.pale, font: { name: "Aptos", size: 9, color: C.muted } };
  const headers = ["Employee ID", "Employee", "Role", "Shift", "Assigned work area", "Requirement", "Required by", "Completed", "Qualification evidence", "Status", "Restriction / note"];
  matrix.getRange("A6:K6").values = [headers];
  styleHeader(matrix.getRange("A6:K6"));
  const rows = [
    ["E-1042", "A. Flores", "Machine Operator", "2", "M-14 / HX-410", "WI-410 Rev C", new Date("2026-06-10"), null, "", null, "Assigned to lot L26-0619; no restriction recorded."],
    ["E-1188", "J. Kim", "Quality Inspector", "2", "Final inspection / HX-410", "WI-410 Rev C", new Date("2026-06-10"), null, "", null, "Performed final inspection on lot L26-0619."],
    ["E-0991", "M. Santos", "Machine Operator", "1", "M-14 / HX-410", "WI-410 Rev C", new Date("2026-06-10"), new Date("2026-06-12"), "Observation QL-410-77", null, "Qualified after supervised run."],
    ["E-0874", "R. Patel", "Line Supervisor", "1", "M-14 / HX-410", "NPS-PR-004 Rev C", new Date("2026-05-01"), new Date("2026-04-28"), "Acknowledgement TR-260428", null, "Current."],
    ["E-1120", "S. Reed", "Line Supervisor", "2", "M-14 / HX-410", "NPS-PR-004 Rev C", new Date("2026-05-01"), new Date("2026-04-29"), "Acknowledgement TR-260429", null, "Current."],
    ["E-1213", "L. Nguyen", "Quality Inspector", "1", "Final inspection / HX-410", "WI-410 Rev C", new Date("2026-06-10"), new Date("2026-06-08"), "Observation QL-410-72", null, "Current."],
    ["E-1066", "K. Webb", "Machine Operator", "2", "M-14 / HX-410", "WI-410 Rev C", new Date("2026-06-10"), new Date("2026-06-09"), "Observation QL-410-73", null, "Current."],
    ["E-1154", "D. Okafor", "Maintenance Technician", "1", "HF-series assets", "PM-STD-12 Rev B", new Date("2026-05-15"), new Date("2026-05-12"), "Qualification MT-551", null, "Current."],
  ];
  matrix.getRange(`A7:K${6 + rows.length}`).values = rows;
  matrix.getRange("J7").formulas = [["=IF(H7<>\"\",\"Current\",IF(DATE(2026,7,16)>G7,\"Overdue\",\"Due\"))"]];
  matrix.getRange(`J7:J${6 + rows.length}`).fillDown();
  styleBody(matrix.getRange(`A7:K${6 + rows.length}`));
  matrix.getRange(`G7:H${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  addStatusFormatting(matrix.getRange("J7:J200"));
  matrix.freezePanes.freezeRows(6);
  matrix.freezePanes.freezeColumns(2);
  matrix.getRange(`A7:K${6 + rows.length}`).format.rowHeight = 46;
  setWidths(matrix, { A: 13, B: 18, C: 20, D: 8, E: 24, F: 20, G: 12, H: 12, I: 26, J: 12, K: 35 });

  titleBand(requirements, "Training Requirements", "Controlled requirements represented in the detailed matrix", "F");
  requirements.getRange("A5:F5").values = [["Requirement", "Revision", "Applies to", "Competence method", "Effective", "Record retention"]];
  styleHeader(requirements.getRange("A5:F5"));
  requirements.getRange("A6:F7").values = [
    ["WI-410 HX-410 machining and inspection", "C", "Operators and inspectors performing HX-410 work", "Read-and-understand plus observed independent job", new Date("2026-06-10"), "Employment + 3 years"],
    ["NPS-PR-004 Document and Data Control", "C", "Document owners, supervisors, Quality Systems", "Read-and-understand acknowledgement", new Date("2026-05-01"), "Employment + 3 years"],
  ];
  styleBody(requirements.getRange("A6:F7"));
  requirements.getRange("E6:E7").setNumberFormat("yyyy-mm-dd");
  setWidths(requirements, { A: 38, B: 10, C: 35, D: 38, E: 13, F: 20 });

  await saveWorkbook(wb, "06_Training_Matrix.xlsx");
}

async function buildAssets() {
  const wb = Workbook.create();
  const summary = wb.worksheets.add("Summary");
  const assets = wb.worksheets.add("Asset Records");
  const usage = wb.worksheets.add("Usage Log");
  [summary, assets, usage].forEach((s) => { s.showGridLines = false; });

  titleBand(summary, "Maintenance and Calibration Summary", "Status date: 16 July 2026 • Preventive-maintenance and measurement-equipment status", "H");
  summary.getRange("A5:B5").values = [["Metric", "Value"]];
  styleHeader(summary.getRange("A5:B5"));
  summary.getRange("A6:A9").values = [["Assets sampled"], ["Current"], ["Overdue / evidence missing"], ["Overdue item with recorded use"]];
  summary.getRange("B6").formulas = [["=COUNTA('Asset Records'!A7:A200)"]];
  summary.getRange("B7").formulas = [["=COUNTIF('Asset Records'!K7:K200,\"Current\")"]];
  summary.getRange("B8").formulas = [["=COUNTIF('Asset Records'!K7:K200,\"Overdue\")"]];
  summary.getRange("B9").formulas = [["=COUNTIFS('Asset Records'!K7:K200,\"Overdue\",'Asset Records'!L7:L200,\"Yes\")"]];
  styleBody(summary.getRange("A6:B9"));
  summary.getRange("D5:H5").merge();
  summary.getRange("D5").values = [["Evidence interpretation"]];
  styleHeader(summary.getRange("D5:H5"));
  summary.getRange("D6:H9").merge();
  summary.getRange("D6").values = [["A blank completion record does not prove that maintenance was not performed. It does mean Northstar cannot demonstrate completion or an approved deferral. Product and equipment risk still require a qualified human decision."]];
  summary.getRange("D6:H9").format = { fill: C.paleGold, font: { name: "Aptos", size: 11, color: C.ink }, wrapText: true, verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: C.gold } };
  setWidths(summary, { A: 30, B: 16, C: 3, D: 18, E: 18, F: 18, G: 18, H: 18 });

  titleBand(assets, "Asset Records", "Preventive maintenance and calibration detail • Status date: 16 July 2026", "M");
  assets.getRange("A5:M5").merge();
  assets.getRange("A5").values = [["Status is formula-driven from required date and recorded completion; 'Used after due?' references the Usage Log."]];
  assets.getRange("A5").format = { fill: C.pale, font: { name: "Aptos", size: 9, color: C.muted } };
  const headers = ["Asset ID", "Asset / instrument", "Control type", "Area", "Required date", "Expected record", "Recorded completion", "Result / disposition", "Next due", "Approved deferral", "Status", "Used after due?", "Evidence note"];
  assets.getRange("A6:M6").values = [headers];
  styleHeader(assets.getRange("A6:M6"));
  const rows = [
    ["HF-1500", "Höfler Rapid 1500", "Preventive maintenance", "M-14", new Date("2026-05-31"), "WO-PM-260531", null, "", null, "No", null, "Yes", "Asset operated on 3, 10, 17, and 21 June; no migrated work order or deferral located."],
    ["HF-2600", "Höfler Rapid 2600", "Preventive maintenance", "M-14", new Date("2026-06-07"), "WO-PM-260607", null, "", null, "No", null, "Yes", "Asset operated on 12 and 20 June; no migrated work order or deferral located."],
    ["CMM-3", "Coordinate measuring machine", "Preventive maintenance", "Quality Lab", new Date("2026-06-30"), "WO-PM-260630", new Date("2026-06-28"), "Completed; no adverse condition", new Date("2026-12-30"), "N/A", null, "No", "Service report SR-6618 attached in CMMS."],
    ["AC-2", "Plant air compressor 2", "Preventive maintenance", "Utilities", new Date("2026-07-05"), "WO-PM-260705", new Date("2026-07-03"), "Completed; filters replaced", new Date("2026-10-05"), "N/A", null, "No", "Work order signed by maintenance lead."],
    ["GR-882", "Digital bore gauge", "Calibration", "Final Inspection", new Date("2026-06-18"), "CAL-26-188", new Date("2026-06-18"), "Within specification", new Date("2026-12-18"), "N/A", null, "No", "Traceability and certificate included in Clean Evidence Packet."],
    ["TW-118", "Digital torque wrench", "Calibration", "Final Inspection", new Date("2026-06-15"), "CAL-26-205", null, "", null, "No", null, "Yes", "Usage Log records fixture setup for lot L26-0619 on 20 June after calibration due date."],
    ["GA-884", "Thread plug gauge M12", "Calibration", "Final Inspection", new Date("2026-07-01"), "CAL-26-219", new Date("2026-06-29"), "Within specification", new Date("2026-12-29"), "N/A", null, "No", "Certificate CAL-26-219 reviewed and approved."],
  ];
  assets.getRange(`A7:M${6 + rows.length}`).values = rows;
  assets.getRange("K7").formulas = [["=IF(G7<>\"\",\"Current\",IF(DATE(2026,7,16)>E7,\"Overdue\",\"Due\"))"]];
  assets.getRange(`K7:K${6 + rows.length}`).fillDown();
  styleBody(assets.getRange(`A7:M${6 + rows.length}`));
  assets.getRange(`E7:E${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  assets.getRange(`G7:G${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  assets.getRange(`I7:I${6 + rows.length}`).setNumberFormat("yyyy-mm-dd");
  addStatusFormatting(assets.getRange("K7:K200"));
  assets.getRange("J7:J200").dataValidation = { rule: { type: "list", values: ["Yes", "No", "N/A"] } };
  assets.getRange("L7:L200").dataValidation = { rule: { type: "list", values: ["Yes", "No"] } };
  assets.freezePanes.freezeRows(6);
  assets.freezePanes.freezeColumns(2);
  assets.getRange(`A7:M${6 + rows.length}`).format.rowHeight = 52;
  setWidths(assets, { A: 12, B: 28, C: 23, D: 18, E: 13, F: 19, G: 15, H: 24, I: 13, J: 16, K: 12, L: 14, M: 42 });

  titleBand(usage, "Controlled Equipment Usage Log", "Sampled records relevant to the asset-status review", "H");
  usage.getRange("A5:H5").values = [["Date", "Asset ID", "Area", "Purpose", "Lot / work order", "User", "Result", "Record reference"]];
  styleHeader(usage.getRange("A5:H5"));
  const useRows = [
    [new Date("2026-06-20"), "TW-118", "Final Inspection", "Fixture setup torque verification", "L26-0619", "J. Kim", "Accepted", "FI-410-260620"],
    [new Date("2026-06-21"), "HF-1500", "M-14", "HX-410 machining", "L26-0619", "A. Flores", "Run completed", "TRV-L26-0619"],
    [new Date("2026-06-20"), "HF-2600", "M-14", "HX-410 finishing", "L26-0618", "K. Webb", "Run completed", "TRV-L26-0618"],
    [new Date("2026-06-22"), "GR-882", "Final Inspection", "Bore measurement", "L26-0622", "L. Nguyen", "Accepted", "FI-410-260622"],
    [new Date("2026-07-02"), "GA-884", "Final Inspection", "Thread verification", "L26-0702", "L. Nguyen", "Accepted", "FI-320-260702"],
  ];
  usage.getRange(`A6:H${5 + useRows.length}`).values = useRows;
  styleBody(usage.getRange(`A6:H${5 + useRows.length}`));
  usage.getRange(`A6:A${5 + useRows.length}`).setNumberFormat("yyyy-mm-dd");
  usage.freezePanes.freezeRows(5);
  setWidths(usage, { A: 13, B: 12, C: 20, D: 32, E: 18, F: 16, G: 16, H: 22 });

  await saveWorkbook(wb, "07_PM_and_Calibration_Records.xlsx");
}

await buildCapa();
await buildTraining();
await buildAssets();
console.log("Generated Northstar spreadsheet evidence.");
