"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileClock,
  FilePlus2,
  GraduationCap,
  LayoutDashboard,
  Plus,
  QrCode,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

const STORAGE_KEY = "qmspilot:northstar:workforce-readiness-workspace";
const SUMMARY_KEY = "qmspilot:northstar:workforce-readiness-summary";

const initialDocuments = [
  { id: "WI-ASM-006", title: "Fan Motor Assembly", type: "Work Instruction", department: "Operations", workCenter: "Final Assembly", revision: "B", owner: "Manufacturing Engineering", status: "Active", training: "Practical demonstration", review: "2027-02-01" },
  { id: "WI-TEST-014", title: "Electrical Functional Test", type: "Work Instruction", department: "Quality", workCenter: "Electrical Test", revision: "C", owner: "Quality Engineering", status: "Under Review", training: "Competency revalidation", review: "2027-01-15" },
  { id: "WI-FOAM-009", title: "Foam Fixture Setup", type: "Work Instruction", department: "Operations", workCenter: "Foam Operations", revision: "D", owner: "Process Engineering", status: "Under Review", training: "Awareness + observation", review: "2027-03-10" },
  { id: "SOP-OPS-003", title: "Production Startup and Shutdown", type: "SOP", department: "Operations", workCenter: "All Operations", revision: "B", owner: "Operations Manager", status: "Under Review", training: "Awareness", review: "2027-04-01" },
  { id: "SOP-QA-002", title: "Final Inspection Control", type: "SOP", department: "Quality", workCenter: "Final Inspection", revision: "A", owner: "Quality Manager", status: "Active", training: "Practical demonstration", review: "2026-11-18" },
  { id: "WI-PKG-004", title: "Finished Product Packaging", type: "Work Instruction", department: "Operations", workCenter: "Packaging", revision: "C", owner: "Packaging Lead", status: "Active", training: "Practical demonstration", review: "2027-05-09" },
];

const initialAssignments = [
  { id: 1, employee: "Maria Torres", role: "Assembly Technician", document: "WI-ASM-006 Rev B", requirement: "Practical demonstration", due: "Aug 6", status: "Viewed" },
  { id: 2, employee: "Andre Lewis", role: "Test Technician", document: "WI-TEST-014 Rev C", requirement: "Revalidation", due: "Aug 8", status: "Assigned" },
  { id: 3, employee: "James Cole", role: "Test Technician", document: "WI-TEST-014 Rev C", requirement: "Revalidation", due: "Aug 8", status: "Assigned" },
  { id: 4, employee: "Sofia Reed", role: "Foam Operator", document: "WI-FOAM-009 Rev D", requirement: "Awareness + observation", due: "Aug 9", status: "Assigned" },
  { id: 5, employee: "Caleb Young", role: "Foam Operator", document: "WI-FOAM-009 Rev D", requirement: "Awareness + observation", due: "Aug 9", status: "In Progress" },
  { id: 6, employee: "Emily Chen", role: "Quality Technician", document: "SOP-QA-002 Rev A", requirement: "Practical demonstration", due: "Aug 11", status: "Complete" },
  { id: 7, employee: "Marcus Hill", role: "Assembly Lead", document: "SOP-OPS-003 Rev B", requirement: "Awareness", due: "Aug 12", status: "Assigned" },
];

const matrixRows = [
  { name: "Maria Torres", role: "Assembly Technician", skills: ["Training", "N/A", "N/A", "Supervised", "Qualified"] },
  { name: "Andre Lewis", role: "Test Technician", skills: ["Qualified", "Expired", "N/A", "Qualified", "Qualified"] },
  { name: "James Cole", role: "Test Technician", skills: ["Qualified", "Expired", "N/A", "Qualified", "Qualified"] },
  { name: "Sofia Reed", role: "Foam Operator", skills: ["N/A", "N/A", "Training", "Supervised", "Qualified"] },
  { name: "Caleb Young", role: "Foam Operator", skills: ["N/A", "N/A", "Qualified", "Supervised", "Qualified"] },
  { name: "Emily Chen", role: "Quality Technician", skills: ["Supervised", "Qualified", "N/A", "Qualified", "Qualified"] },
];

const tabs = [
  ["dashboard", "Executive Dashboard", LayoutDashboard],
  ["library", "Document Library", BookOpenCheck],
  ["builder", "Instruction Builder", FilePlus2],
  ["approvals", "Approvals & Revisions", FileClock],
  ["training", "Training Assignments", GraduationCap],
  ["competency", "Competency Signoff", UserRoundCheck],
  ["matrix", "Readiness Matrix", BarChart3],
  ["shopfloor", "Shop-Floor Access", QrCode],
];

function statusClass(value) {
  if (["Active", "Complete", "Qualified", "Approved"].includes(value)) return "good";
  if (["Under Review", "Viewed", "In Progress", "Training", "Supervised"].includes(value)) return "warn";
  if (["Expired"].includes(value)) return "bad";
  return "blue";
}

export default function WorkforceReadinessApp() {
  const [tab, setTab] = useState("dashboard");
  const [documents, setDocuments] = useState(initialDocuments);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [authorizedCount, setAuthorizedCount] = useState(22);
  const [expiredCount, setExpiredCount] = useState(2);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [notice, setNotice] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [builder, setBuilder] = useState({ id: "", title: "", type: "", department: "Operations", workCenter: "", purpose: "", role: "Assembly Technician" });
  const [documentIntent, setDocumentIntent] = useState({ purpose: "", scope: "" });
  const [steps, setSteps] = useState([{ instruction: "", tool: "", safety: "", quality: "", result: "" }]);

  const configuredDocumentType = documentIntent.purpose && documentIntent.scope
    ? documentIntent.purpose === "task" && documentIntent.scope === "single"
      ? "Work Instruction"
      : "SOP"
    : "";
  const hasMixedDocumentIntent = Boolean(
    configuredDocumentType
    && ((documentIntent.purpose === "task") !== (documentIntent.scope === "single"))
  );
  const isSopWorkflow = configuredDocumentType === "SOP";

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (Array.isArray(saved.documents)) setDocuments(saved.documents);
      if (Array.isArray(saved.assignments)) setAssignments(saved.assignments);
      if (Number.isFinite(saved.authorizedCount)) setAuthorizedCount(saved.authorizedCount);
      if (Number.isFinite(saved.expiredCount)) setExpiredCount(saved.expiredCount);
    } catch {}
  }, []);

  const readiness = Math.round((authorizedCount / 24) * 100);
  const activeDocuments = documents.filter((item) => item.status === "Active").length;
  const awaitingApproval = documents.filter((item) => item.status === "Under Review").length;
  const trainingRequired = assignments.filter((item) => item.status !== "Complete").length;

  const summary = useMemo(() => ({
    company: "Davicorp",
    readinessPercent: readiness,
    activeDocuments,
    awaitingApproval,
    trainingRequired,
    fullyAuthorized: authorizedCount,
    totalEmployees: 24,
    expiredQualifications: expiredCount,
    criticalGaps: expiredCount,
    workCenters: [
      { name: "Final Assembly", readiness: 96 },
      { name: "Foam Operations", readiness: 91 },
      { name: "Electrical Test", readiness: expiredCount ? 88 : 96 },
      { name: "Packaging", readiness: 100 },
    ],
    source: "Controlled Work Instructions & Workforce Readiness",
    sourcePath: "/tools/workforce-readiness",
    updatedAt: new Date().toISOString(),
  }), [readiness, activeDocuments, awaitingApproval, trainingRequired, authorizedCount, expiredCount]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ documents, assignments, authorizedCount, expiredCount }));
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
    window.dispatchEvent(new CustomEvent("qmspilot:workforce-readiness-updated", { detail: summary }));
  }, [documents, assignments, authorizedCount, expiredCount, summary]);

  const filteredDocuments = documents.filter((item) => {
    const matchesQuery = `${item.id} ${item.title} ${item.workCenter} ${item.owner}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (department === "All" || item.department === department);
  });

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const approveDocument = (id) => {
    setDocuments((current) => current.map((item) => item.id === id ? { ...item, status: "Active" } : item));
    flash(`${id} approved. Training-impacting release routed to Davicorp employees.`);
  };

  const submitInstruction = () => {
    if (!configuredDocumentType) {
      flash("Answer the two document-fit questions before building the controlled document.");
      return;
    }
    if (!builder.id.trim() || !builder.title.trim() || !builder.workCenter.trim() || !steps[0]?.instruction.trim()) {
      flash(`Add a document number, title, ${isSopWorkflow ? "process or area" : "work center"}, and at least one ${isSopWorkflow ? "process section" : "instruction step"}.`);
      return;
    }
    setDocuments((current) => [{
      id: builder.id.trim().toUpperCase(),
      title: builder.title.trim(),
      type: configuredDocumentType,
      department: builder.department,
      workCenter: builder.workCenter.trim(),
      revision: "A",
      owner: "Davicorp Process Owner",
      status: "Under Review",
      training: isSopWorkflow ? "Awareness + knowledge confirmation" : "Practical demonstration",
      review: "2027-08-04",
    }, ...current]);
    setBuilder({ id: "", title: "", type: "", department: "Operations", workCenter: "", purpose: "", role: "Assembly Technician" });
    setDocumentIntent({ purpose: "", scope: "" });
    setSteps([{ instruction: "", tool: "", safety: "", quality: "", result: "" }]);
    setTab("approvals");
    flash(`${configuredDocumentType} submitted for approval and revision-impact review.`);
  };

  const completeTraining = (id) => {
    setAssignments((current) => current.map((item) => item.id === id ? { ...item, status: "Complete" } : item));
    flash("Training evidence recorded. Practical authorization remains controlled by competency signoff.");
  };

  const completeEvaluation = () => {
    if (!evaluation) return;
    setAssignments((current) => current.map((item) => item.employee === evaluation.employee ? { ...item, status: "Complete" } : item));
    setAuthorizedCount((count) => Math.min(24, count + 1));
    setExpiredCount((count) => Math.max(0, count - 1));
    setEvaluation(null);
    flash("Competency verified. Davicorp authorization and Executive Intelligence readiness updated.");
  };

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify({ summary, documents, assignments }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Davicorp-Workforce-Readiness-Demo.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="wr-shell">
      <aside className="wr-sidebar">
        <div className="wr-brand wr-qms"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="wr-brand wr-northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        <div className="wr-company"><small>DEMONSTRATION TENANT</small><strong>Davicorp</strong><span>Controlled manufacturing workspace</span></div>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon size={17} /><span>{label}</span><ChevronRight size={14} />
            </button>
          ))}
        </nav>
        <div className="wr-side-footer">
          <small>CONNECTED ARCHITECTURE</small>
          <span><CheckCircle2 size={13} /> Workspace owns records</span>
          <span><BarChart3 size={13} /> Executive Intelligence consumes results</span>
          <a href="/executive-intelligence">View Executive Intelligence <ArrowRight size={14} /></a>
        </div>
      </aside>

      <section className="wr-main">
        <header className="wr-topbar">
          <div><small>QMSPILOT NORTHSTAR · OUR WORKFORCE</small><strong>Controlled Work Instructions & Workforce Readiness</strong></div>
          <div className="wr-top-actions"><span>Design-partner demonstration</span><button onClick={exportSnapshot}><Download size={15} /> Export</button></div>
        </header>

        <div className="wr-content">
          {notice && <div className="wr-notice"><Sparkles size={17} />{notice}</div>}

          {tab === "dashboard" && <>
            <section className="wr-hero">
              <div>
                <small>RIGHT INSTRUCTION · RIGHT PERSON · RIGHT REVISION</small>
                <h1>Control the work, prove competency, and know who is ready.</h1>
                <p>Davicorp uses one connected flow from approved SOPs and work instructions through training, demonstrated competency, authorization, and executive visibility.</p>
                <div className="wr-hero-actions"><button onClick={() => setTab("builder")}><Plus size={16} /> Create Instruction</button><a href="/executive-intelligence">Open Executive Readiness View <ArrowRight size={16} /></a></div>
              </div>
              <div className="wr-readiness-card">
                <small>DAVICORP WORKFORCE READINESS</small>
                <div className="wr-ring" style={{ "--score": `${readiness * 3.6}deg` }}><div><strong>{readiness}%</strong><span>{authorizedCount} of 24 authorized</span></div></div>
                <b>{expiredCount ? "Focused action required" : "Workforce ready"}</b>
                <em>Feeds Executive Intelligence automatically</em>
              </div>
            </section>

            <section className="wr-metrics">
              {[
                ["Active documents", activeDocuments, "Current controlled source", FileCheck2],
                ["Awaiting approval", awaitingApproval, "Revision decisions pending", FileClock],
                ["Training required", trainingRequired, "Open employee assignments", GraduationCap],
                ["Fully authorized", authorizedCount, "Employees approved independently", BadgeCheck],
                ["Expired qualifications", expiredCount, "Immediate supervisor action", AlertTriangle],
                ["Executive feed", "Live", "Operational data summarized", BarChart3],
              ].map(([label, value, note, Icon]) => <article key={label}><span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><em>{note}</em></article>)}
            </section>

            <section className="wr-grid-two">
              <article className="wr-panel">
                <div className="wr-heading"><div><small>CONNECTED CONTROL FLOW</small><h2>From controlled requirement to authorized employee</h2></div><ShieldCheck /></div>
                <div className="wr-flow">{[
                  ["01", "Create", "Build visual work instruction"],
                  ["02", "Approve", "Control revision and impact"],
                  ["03", "Release", "Expose only active revision"],
                  ["04", "Train", "Route by role and work center"],
                  ["05", "Verify", "Observe practical performance"],
                  ["06", "Authorize", "Update readiness intelligence"],
                ].map(([number, title, note]) => <div key={number}><span>{number}</span><strong>{title}</strong><small>{note}</small></div>)}</div>
              </article>
              <article className="wr-panel">
                <div className="wr-heading"><div><small>READINESS BY WORK CENTER</small><h2>Where Davicorp can execute confidently</h2></div><Users /></div>
                <div className="wr-bars">{summary.workCenters.map((item) => <div key={item.name}><span><strong>{item.name}</strong><em>{item.readiness}%</em></span><i><b style={{ width: `${item.readiness}%` }} /></i></div>)}</div>
              </article>
            </section>

            <section className="wr-grid-two">
              <article className="wr-panel">
                <div className="wr-heading"><div><small>PRIORITY ACTIONS</small><h2>What supervisors need to close</h2></div><AlertTriangle /></div>
                <div className="wr-action-list">
                  <div><span className="bad">Critical</span><strong>Revalidate two electrical-test qualifications</strong><small>Owner: Quality Supervisor · Due Aug 8</small></div>
                  <div><span className="warn">High</span><strong>Approve WI-TEST-014 Rev C</strong><small>Owner: Operations Manager · Due Aug 5</small></div>
                  <div><span className="blue">Planned</span><strong>Complete practical signoff for Maria Torres</strong><small>Owner: Assembly Lead · Due Aug 6</small></div>
                </div>
              </article>
              <article className="wr-panel">
                <div className="wr-heading"><div><small>EXECUTIVE INTELLIGENCE FEED</small><h2>What leadership receives</h2></div><Sparkles /></div>
                <div className="wr-feed">
                  <div><strong>{readiness}% readiness</strong><span>Enterprise and work-center rollup</span></div>
                  <div><strong>{expiredCount} critical gaps</strong><span>Expired or single-point qualifications</span></div>
                  <div><strong>{trainingRequired} open assignments</strong><span>Training exposure and due-date risk</span></div>
                  <div><strong>{awaitingApproval} pending revisions</strong><span>Documents capable of triggering retraining</span></div>
                </div>
                <a className="wr-link" href="/executive-intelligence">Open leadership view <ArrowRight size={15} /></a>
              </article>
            </section>
          </>}

          {tab === "library" && <section className="wr-panel">
            <div className="wr-heading"><div><small>CONTROLLED SOURCE OF TRUTH</small><h2>Document Library</h2><p>Only approved and active revisions are available through shop-floor access.</p></div><button className="wr-primary" onClick={() => setTab("builder")}><Plus size={15} /> New Controlled Document</button></div>
            <div className="wr-filters"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search document, process, owner..." /></label><select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All</option><option>Operations</option><option>Quality</option></select></div>
            <div className="wr-table"><table><thead><tr><th>Document</th><th>Title</th><th>Type</th><th>Work Center</th><th>Rev</th><th>Owner</th><th>Status</th><th>Training Impact</th></tr></thead><tbody>{filteredDocuments.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.title}</td><td>{item.type}</td><td>{item.workCenter}</td><td>{item.revision}</td><td>{item.owner}</td><td><span className={`wr-tag ${statusClass(item.status)}`}>{item.status}</span></td><td>{item.training}</td></tr>)}</tbody></table></div>
          </section>}

          {tab === "builder" && <>
            <section className="wr-panel">
              <div className="wr-heading"><div><small>VISUAL STANDARD WORK</small><h2>Instruction Builder</h2><p>Create controlled content that employees can use at the point of work.</p></div><div className="wr-button-row"><button disabled={!configuredDocumentType} onClick={() => flash("Draft saved in this Davicorp demonstration browser.")}><Save size={15} /> Save Draft</button><button className="wr-primary" disabled={!configuredDocumentType} onClick={submitInstruction}><Send size={15} /> Submit for Approval</button></div></div>

              <div className="wr-document-fit">
                <div className="wr-document-fit-heading">
                  <div><small>DOCUMENT FIT CHECK</small><strong>First, confirm what you are creating.</strong><p>A Work Instruction explains how one person performs a specific task. An SOP controls how a broader process operates across responsibilities, decisions, and handoffs.</p></div>
                  <ShieldCheck size={20} />
                </div>
                <div className="wr-intent-grid">
                  <label>1. What is the document's primary purpose?
                    <select value={documentIntent.purpose} onChange={(event) => setDocumentIntent({ ...documentIntent, purpose: event.target.value })}>
                      <option value="">Select the best answer</option>
                      <option value="task">Teach a person exactly how to perform one task</option>
                      <option value="process">Define how a broader process is controlled</option>
                    </select>
                  </label>
                  <label>2. What scope does the document cover?
                    <select value={documentIntent.scope} onChange={(event) => setDocumentIntent({ ...documentIntent, scope: event.target.value })}>
                      <option value="">Select the best answer</option>
                      <option value="single">One role or workstation with observable steps</option>
                      <option value="multi">Multiple roles, decisions, controls, or handoffs</option>
                    </select>
                  </label>
                </div>
                {configuredDocumentType ? (
                  <div className="wr-document-result good">
                    <CheckCircle2 size={17} />
                    <div><strong>Northstar configured: {configuredDocumentType}</strong><span>{isSopWorkflow ? (hasMixedDocumentIntent ? "Your answers include process-level control, so this is configured as an SOP. Use linked Work Instructions for detailed task steps." : "The builder now captures responsibilities, process controls, records, and handoffs.") : "The builder now captures task steps, tooling, safety, quality checkpoints, and the expected result."}</span></div>
                  </div>
                ) : (
                  <div className="wr-document-result blue">
                    <FileCheck2 size={17} />
                    <div><strong>Answer both questions to continue</strong><span>Northstar will open the correct controlled-document workflow automatically.</span></div>
                  </div>
                )}
              </div>

              {configuredDocumentType && <div className="wr-form-grid">
                <label>Document Number<input value={builder.id} onChange={(event) => setBuilder({ ...builder, id: event.target.value })} placeholder={isSopWorkflow ? "SOP-OPS-004" : "WI-ASM-007"} /></label>
                <label>Title<input value={builder.title} onChange={(event) => setBuilder({ ...builder, title: event.target.value })} placeholder={isSopWorkflow ? "Production startup and shutdown" : "Install fan motor assembly"} /></label>
                <label>Configured Document Type<input value={configuredDocumentType} readOnly aria-live="polite" /></label>
                <label>Department<select value={builder.department} onChange={(event) => setBuilder({ ...builder, department: event.target.value })}><option>Operations</option><option>Quality</option><option>Maintenance</option></select></label>
                <label>{isSopWorkflow ? "Process / Area" : "Work Center"}<input value={builder.workCenter} onChange={(event) => setBuilder({ ...builder, workCenter: event.target.value })} placeholder={isSopWorkflow ? "Production Operations" : "Final Assembly"} /></label>
                <label>{isSopWorkflow ? "Process Owner / Responsible Role" : "Affected Role"}<input value={builder.role} onChange={(event) => setBuilder({ ...builder, role: event.target.value })} /></label>
                <label className="full">Purpose and Scope<textarea value={builder.purpose} onChange={(event) => setBuilder({ ...builder, purpose: event.target.value })} placeholder={isSopWorkflow ? "Define the process purpose, boundaries, inputs, outputs, responsibilities, and applicable controls." : "Define what the task controls, where it applies, who performs it, and the expected result."} /></label>
              </div>}
            </section>
            {configuredDocumentType && <section className="wr-panel">
              <div className="wr-heading"><div><small>{isSopWorkflow ? "PROCESS GOVERNANCE" : "POINT-OF-WORK CONTENT"}</small><h2>{isSopWorkflow ? "SOP Process & Controls" : "Instruction Steps"}</h2><p>{isSopWorkflow ? "Define the controlled process sequence, ownership, evidence, and handoffs." : "Define the observable task sequence employees will follow at the point of work."}</p></div><button onClick={() => setSteps((current) => [...current, { instruction: "", tool: "", safety: "", quality: "", result: "" }])}><Plus size={15} /> {isSopWorkflow ? "Add Process Section" : "Add Step"}</button></div>
              <div className="wr-step-list">{steps.map((step, index) => <article key={index}><div className="wr-step-number">{index + 1}</div><div className="wr-form-grid"><label className="full">{isSopWorkflow ? "Process Requirement / Procedure Section" : "Instruction"}<textarea value={step.instruction} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, instruction: event.target.value } : item))} placeholder={isSopWorkflow ? "Describe the required process activity, decision, or control." : "Describe the action in clear, observable language."} /></label><label>{isSopWorkflow ? "Responsible Role / Function" : "Required Tooling"}<input value={step.tool} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, tool: event.target.value } : item))} /></label><label>{isSopWorkflow ? "Control / Risk" : "PPE / Safety"}<input value={step.safety} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, safety: event.target.value } : item))} /></label><label>{isSopWorkflow ? "Record / Evidence" : "Quality Checkpoint"}<input value={step.quality} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quality: event.target.value } : item))} /></label><label>{isSopWorkflow ? "Outcome / Next Handoff" : "Expected Result"}<input value={step.result} onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, result: event.target.value } : item))} /></label></div></article>)}</div>
            </section>}
          </>}

          {tab === "approvals" && <section className="wr-panel">
            <div className="wr-heading"><div><small>DOCUMENT CHANGE CONTROL</small><h2>Approvals & Revision Impact</h2><p>A revision is not released until its operational and training impact is understood.</p></div><ShieldCheck /></div>
            <div className="wr-table"><table><thead><tr><th>Document</th><th>Change</th><th>Affected Area</th><th>Training Decision</th><th>Status</th><th>Decision</th></tr></thead><tbody>{documents.filter((item) => item.status === "Under Review").map((item) => <tr key={item.id}><td><strong>{item.id} Rev {item.revision}</strong></td><td>Controlled content and visual sequence updated</td><td>{item.workCenter}</td><td>{item.training}</td><td><span className="wr-tag warn">Pending</span></td><td><button className="wr-primary" onClick={() => approveDocument(item.id)}><CheckCircle2 size={14} /> Approve</button></td></tr>)}</tbody></table></div>
            <div className="wr-impact"><ClipboardCheck /><div><strong>Required revision-impact questions</strong><p>What changed? Why? Which work centers, roles, employees, WIP, safety controls, quality checks, tooling, inspection criteria, or customer requirements are affected? Is retraining or competency revalidation required?</p></div></div>
          </section>}

          {tab === "training" && <section className="wr-panel">
            <div className="wr-heading"><div><small>ROLE-BASED ROUTING</small><h2>Training Assignments</h2><p>Assignments originate from approved revision-impact decisions.</p></div><GraduationCap /></div>
            <div className="wr-table"><table><thead><tr><th>Employee</th><th>Role</th><th>Controlled Document</th><th>Requirement</th><th>Due</th><th>Status</th><th>Evidence</th></tr></thead><tbody>{assignments.map((item) => <tr key={item.id}><td><strong>{item.employee}</strong></td><td>{item.role}</td><td>{item.document}</td><td>{item.requirement}</td><td>{item.due}</td><td><span className={`wr-tag ${statusClass(item.status)}`}>{item.status}</span></td><td>{item.status === "Complete" ? <span className="wr-tag good">Recorded</span> : <button onClick={() => completeTraining(item.id)}>Mark Training Complete</button>}</td></tr>)}</tbody></table></div>
          </section>}

          {tab === "competency" && <section className="wr-grid-two">
            <article className="wr-panel"><div className="wr-heading"><div><small>DEMONSTRATED ABILITY</small><h2>Pending Practical Evaluations</h2></div><UserRoundCheck /></div><div className="wr-evaluations">{[
              ["Maria Torres", "Fan Motor Assembly", "Assembly Lead"],
              ["Andre Lewis", "Electrical Functional Test", "Quality Supervisor"],
              ["Sofia Reed", "Foam Fixture Setup", "Production Supervisor"],
            ].map(([employee, process, trainer]) => <div key={employee}><span><strong>{employee}</strong><small>{process} · Trainer: {trainer}</small></span><button className="wr-primary" onClick={() => setEvaluation({ employee, process, trainer })}>Evaluate</button></div>)}</div></article>
            <article className="wr-panel"><div className="wr-heading"><div><small>QUALIFICATION MODEL</small><h2>Four controlled levels</h2></div><BadgeCheck /></div><div className="wr-levels"><div><span>1</span><strong>Awareness</strong><small>Reviewed current document</small></div><div><span>2</span><strong>Understanding</strong><small>Confirmed comprehension</small></div><div><span>3</span><strong>Demonstrated Competency</strong><small>Observed completing task correctly</small></div><div><span>4</span><strong>Authorized</strong><small>Approved for independent work</small></div></div></article>
          </section>}

          {tab === "matrix" && <section className="wr-panel">
            <div className="wr-heading"><div><small>AT-A-GLANCE CAPABILITY</small><h2>Workforce Readiness Matrix</h2><p>Operational detail remains here; the leadership rollup feeds Executive Intelligence.</p></div><a className="wr-primary" href="/executive-intelligence">View Executive Rollup <ArrowRight size={14} /></a></div>
            <div className="wr-table"><table className="wr-matrix"><thead><tr><th>Employee</th>{["Fan Assembly", "Electrical Test", "Foam Setup", "Final Inspection", "Packaging"].map((skill) => <th key={skill}>{skill}</th>)}</tr></thead><tbody>{matrixRows.map((person) => <tr key={person.name}><td><strong>{person.name}</strong><small>{person.role}</small></td>{person.skills.map((skill, index) => <td key={index}><span className={`wr-cell ${statusClass(skill)}`}>{skill === "Qualified" ? "Q" : skill === "Training" ? "T" : skill === "Expired" ? "E" : skill === "Supervised" ? "S" : "—"}</span></td>)}</tr>)}</tbody></table></div>
            <div className="wr-legend"><span><i className="good">Q</i>Qualified</span><span><i className="warn">T</i>Training</span><span><i className="bad">E</i>Expired</span><span><i className="warn">S</i>Supervised</span><span><i className="blue">—</i>Not applicable</span></div>
          </section>}

          {tab === "shopfloor" && <section className="wr-grid-two">
            <article className="wr-panel"><div className="wr-heading"><div><small>POINT-OF-USE ACCESS</small><h2>Scan or Search</h2></div><QrCode /></div><div className="wr-qr"><QrCode size={78} /><strong>Davicorp Machine QR · FA-04</strong><span>Opens only the latest approved instruction for this work center.</span></div><label className="wr-search"><Search size={15} /><input placeholder="Search machine, part, process, or document" /></label></article>
            <article className="wr-panel"><div className="wr-heading"><div><small>LATEST APPROVED REVISION</small><h2>WI-ASM-006 Rev B · Fan Motor Assembly</h2><p>Effective August 1, 2026 · Davicorp Final Assembly</p></div><FileCheck2 /></div><div className="wr-floor-steps"><div><span>01</span><strong>Verify components</strong><p>Confirm motor, fasteners, harness, and mounting plate match the traveler.</p><em className="warn">Quality checkpoint</em></div><div><span>02</span><strong>Install motor</strong><p>Orient the harness toward the cable channel and install four fasteners finger-tight.</p><em className="blue">Tool: torque driver</em></div><div><span>03</span><strong>Torque and verify</strong><p>Torque in cross pattern to the listed value and record completion.</p><em className="good">Verification required</em></div></div><div className="wr-button-row"><button className="wr-primary" onClick={() => flash("Current revision acknowledged by Davicorp employee.")}><CheckCircle2 size={15} /> Acknowledge Revision</button><button onClick={() => flash("Improvement feedback routed to the document owner.")}><Wrench size={15} /> Report an Issue</button></div></article>
          </section>}
        </div>
      </section>

      {evaluation && <div className="wr-modal-backdrop" onClick={() => setEvaluation(null)}><section className="wr-modal" onClick={(event) => event.stopPropagation()}><div className="wr-heading"><div><small>PRACTICAL COMPETENCY EVALUATION</small><h2>{evaluation.employee}</h2><p>{evaluation.process} · Trainer: {evaluation.trainer}</p></div><BadgeCheck /></div><div className="wr-form-grid"><label>Evaluation Result<select><option>Competent — authorize independent work</option><option>Competent with supervision</option><option>Additional training required</option></select></label><label>Qualification Expiration<input type="date" defaultValue="2027-08-04" /></label><label className="full">Objective Evidence<textarea placeholder="Record the observed task, acceptance criteria, and evidence reference." /></label></div><div className="wr-button-row"><button onClick={() => setEvaluation(null)}>Cancel</button><button className="wr-primary" onClick={completeEvaluation}><ShieldCheck size={15} /> Complete Signoff</button></div></section></div>}

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8}.wr-shell{min-height:100vh;color:#10263a;background:#edf3f8;font-family:Inter,Arial,sans-serif}.wr-sidebar{position:fixed;inset:0 auto 0 0;width:270px;height:100vh;overflow:auto;padding:18px;color:#fff;background:linear-gradient(180deg,#061729,#0a2744 70%,#0b3155)}.wr-brand{height:58px;display:flex;align-items:center;justify-content:center;padding:7px;border-radius:13px;background:#fff}.wr-brand img{max-width:205px;max-height:45px}.wr-northstar{margin-top:8px;background:#020914}.wr-company{display:grid;gap:4px;margin:18px 0;padding:14px;border:1px solid #31536f;border-radius:13px;background:#0b2b4a}.wr-company small,.wr-side-footer small{color:#86b4da;font-size:8px;font-weight:900;letter-spacing:.13em}.wr-company strong{font-size:18px}.wr-company span{color:#bfd3e4;font-size:9px}.wr-sidebar nav{display:grid;gap:5px}.wr-sidebar nav button{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:11px;border:1px solid transparent;border-radius:10px;color:#bfd2e3;background:transparent;text-align:left;font-size:10px;font-weight:850}.wr-sidebar nav button:hover,.wr-sidebar nav button.active{color:#fff;border-color:#315777;background:#0d4a7c}.wr-side-footer{display:grid;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid #2a4b66;color:#c4d7e7;font-size:9px}.wr-side-footer span,.wr-side-footer a{display:flex;align-items:center;gap:7px}.wr-side-footer a{margin-top:5px;padding:10px;border-radius:9px;color:#fff;background:#0a66ff;text-decoration:none;font-weight:900}.wr-main{margin-left:270px}.wr-topbar{min-height:70px;display:flex;align-items:center;padding:0 24px;border-bottom:1px solid #d6e2eb;background:#fff}.wr-topbar>div:first-child{margin-right:auto}.wr-topbar small,.wr-topbar strong{display:block}.wr-topbar small{color:#698196;font-size:8px;font-weight:900;letter-spacing:.12em}.wr-topbar strong{font-size:17px}.wr-top-actions{display:flex;align-items:center;gap:9px}.wr-top-actions span{padding:7px 10px;border-radius:999px;color:#765313;background:#fff0cd;font-size:9px;font-weight:900}.wr-top-actions button,.wr-button-row button,.wr-heading button,.wr-table button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 11px;border:1px solid #bfd0df;border-radius:9px;color:#153c5f;background:#fff;font-size:9px;font-weight:900;cursor:pointer}.wr-content{max-width:1580px;margin:0 auto;padding:23px 24px 70px}.wr-notice{position:sticky;top:8px;z-index:20;display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:12px 14px;border:1px solid #7cb9ec;border-radius:12px;color:#0b4d85;background:#e9f5ff;box-shadow:0 12px 35px rgba(26,74,112,.15);font-size:10px;font-weight:850}.wr-hero{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.6fr);gap:17px}.wr-hero>div:first-child{padding:30px;border-radius:23px;color:#fff;background:radial-gradient(circle at 95% 0%,rgba(68,211,255,.26),transparent 32%),linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(8,47,82,.22)}.wr-hero small,.wr-heading small{color:#8ecbff;font-size:8px;font-weight:900;letter-spacing:.13em}.wr-hero h1{max-width:900px;margin:13px 0 12px;font-size:clamp(31px,4vw,54px);line-height:1.02}.wr-hero p{max-width:900px;margin:0;color:#d6e8f6;line-height:1.65}.wr-hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}.wr-hero-actions button,.wr-hero-actions a,.wr-primary,.wr-link{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;min-height:39px;padding:0 13px!important;border:1px solid #95c4eb!important;border-radius:10px!important;color:#fff!important;background:#0a66ff!important;text-decoration:none;font-size:10px!important;font-weight:900!important;cursor:pointer}.wr-hero-actions a{color:#0d3558!important;background:#fff!important}.wr-readiness-card{display:grid;place-items:center;align-content:center;padding:22px;border:1px solid #d6e3ec;border-radius:22px;background:#fff;text-align:center}.wr-readiness-card>small{color:#6b8295}.wr-ring{width:170px;height:170px;display:grid;place-items:center;margin:15px 0;border-radius:50%;background:conic-gradient(#0a66ff var(--score),#dbe7ef 0)}.wr-ring>div{width:132px;height:132px;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff}.wr-ring strong,.wr-ring span{display:block}.wr-ring strong{font-size:41px}.wr-ring span{color:#6c8397;font-size:9px}.wr-readiness-card b{color:#a5670b}.wr-readiness-card em{margin-top:5px;color:#687f93;font-size:8px}.wr-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:11px;margin-top:15px}.wr-metrics article,.wr-panel{border:1px solid #d9e4ed;border-radius:17px;background:#fff;box-shadow:0 11px 28px rgba(24,53,77,.07)}.wr-metrics article{position:relative;padding:16px}.wr-metrics article>span{position:absolute;right:14px;top:14px;width:36px;height:36px;display:grid;place-items:center;border-radius:11px;color:#0a66ff;background:#e8f2ff}.wr-metrics small,.wr-metrics strong,.wr-metrics em{display:block}.wr-metrics small{color:#6e8598;font-size:8px;font-weight:900;text-transform:uppercase}.wr-metrics strong{margin-top:8px;font-size:27px}.wr-metrics em{margin-top:4px;color:#657c90;font-size:8px}.wr-grid-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.wr-panel{padding:19px;margin-bottom:16px}.wr-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px}.wr-heading h2{margin:5px 0 0}.wr-heading p{margin:5px 0 0;color:#62798d;font-size:10px;line-height:1.5}.wr-heading>svg{color:#0a66ff}.wr-button-row{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}.wr-flow{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.wr-flow div{position:relative;min-height:112px;padding:12px;border:1px solid #d8e4ed;border-radius:13px;background:#f8fbfd}.wr-flow div:after{content:'›';position:absolute;right:-8px;top:42%;z-index:2;color:#0a66ff;font-size:22px;font-weight:900}.wr-flow div:last-child:after{display:none}.wr-flow span,.wr-flow strong,.wr-flow small{display:block}.wr-flow span{color:#0a66ff;font-weight:950}.wr-flow strong{margin-top:8px}.wr-flow small{margin-top:5px;color:#657d91;font-size:8px;line-height:1.45}.wr-bars{display:grid;gap:13px}.wr-bars>div>span{display:flex;justify-content:space-between;font-size:10px}.wr-bars em{font-style:normal;font-weight:900}.wr-bars i{height:10px;display:block;margin-top:6px;overflow:hidden;border-radius:999px;background:#e3edf4}.wr-bars b{height:100%;display:block;border-radius:999px;background:linear-gradient(90deg,#0a66ff,#45cfff)}.wr-action-list,.wr-feed,.wr-evaluations,.wr-levels{display:grid;gap:9px}.wr-action-list>div{display:grid;grid-template-columns:auto 1fr;gap:4px 9px;padding:11px;border-bottom:1px solid #e3ebf1}.wr-action-list span{grid-row:1/3;align-self:center;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900}.wr-action-list small{color:#6c8295;font-size:8px}.good{color:#176748!important;background:#e4f7ee!important}.warn{color:#85540b!important;background:#fff0d4!important}.bad{color:#922d3a!important;background:#ffe5e9!important}.blue{color:#175c91!important;background:#e7f3fc!important}.wr-feed{grid-template-columns:repeat(2,1fr)}.wr-feed>div{padding:13px;border:1px solid #dbe6ee;border-radius:12px;background:#f8fbfd}.wr-feed strong,.wr-feed span{display:block}.wr-feed span{margin-top:4px;color:#687f93;font-size:8px}.wr-link{margin-top:13px}.wr-filters{display:grid;grid-template-columns:minmax(260px,1fr) 220px;gap:10px;margin-bottom:13px}.wr-filters label,.wr-search{display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid #c9d8e4;border-radius:10px;background:#fff}.wr-filters input,.wr-search input{border:0!important;padding-left:0!important}.wr-document-fit{display:grid;gap:13px;margin-bottom:16px;padding:15px;border:1px solid #c9dbea;border-radius:14px;background:#f7fbfe}.wr-document-fit-heading{display:flex;align-items:flex-start;gap:12px}.wr-document-fit-heading>div{margin-right:auto}.wr-document-fit-heading small,.wr-document-fit-heading strong,.wr-document-fit-heading p{display:block}.wr-document-fit-heading small{color:#0a66ff;font-size:8px;font-weight:950;letter-spacing:.12em}.wr-document-fit-heading strong{margin-top:5px;font-size:13px}.wr-document-fit-heading p{margin:5px 0 0;color:#62798d;font-size:9px;line-height:1.5}.wr-document-fit-heading>svg{color:#0a66ff}.wr-intent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.wr-intent-grid label{display:grid;gap:6px;color:#49657c;font-size:9px;font-weight:850}.wr-document-result{display:flex;align-items:flex-start;gap:9px;padding:11px 12px;border-radius:11px}.wr-document-result svg{flex:0 0 auto}.wr-document-result strong,.wr-document-result span{display:block}.wr-document-result span{margin-top:3px;font-size:8px;line-height:1.5}.wr-button-row button:disabled{cursor:not-allowed;opacity:.45}.wr-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.wr-form-grid label{display:grid;gap:6px;color:#49657c;font-size:9px;font-weight:850}.wr-form-grid .full{grid-column:1/-1}input,select,textarea{width:100%;padding:10px 11px;border:1px solid #c7d7e3;border-radius:9px;color:#153149;background:#fff;font:inherit;outline:none}textarea{min-height:88px;resize:vertical}input:focus,select:focus,textarea:focus{border-color:#0a66ff;box-shadow:0 0 0 3px rgba(10,102,255,.11)}.wr-table{overflow:auto;border:1px solid #d8e4ed;border-radius:13px}.wr-table table{width:100%;border-collapse:collapse;min-width:900px}.wr-table th,.wr-table td{padding:10px;border-bottom:1px solid #e2eaf0;text-align:left;font-size:9px}.wr-table th{color:#526d82;background:#f2f7fb;font-size:8px;text-transform:uppercase}.wr-tag{display:inline-flex;padding:5px 7px;border-radius:999px;font-size:8px;font-weight:900}.wr-impact{display:flex;gap:12px;margin-top:15px;padding:14px;border-left:4px solid #0a66ff;border-radius:11px;color:#174d78;background:#e9f5ff}.wr-impact p{margin:5px 0 0;font-size:9px;line-height:1.55}.wr-step-list{display:grid;gap:12px}.wr-step-list article{display:grid;grid-template-columns:44px 1fr;gap:12px;padding:14px;border:1px solid #d8e4ed;border-radius:14px;background:#f8fbfd}.wr-step-number{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;color:#fff;background:#0a66ff;font-weight:950}.wr-evaluations>div{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #dce6ed;border-radius:12px}.wr-evaluations span{margin-right:auto}.wr-evaluations strong,.wr-evaluations small{display:block}.wr-evaluations small{margin-top:4px;color:#6b8194;font-size:8px}.wr-levels>div{display:grid;grid-template-columns:38px 1fr;gap:3px 10px;padding:10px;border-bottom:1px solid #e3ebf1}.wr-levels span{grid-row:1/3;width:34px;height:34px;display:grid;place-items:center;border-radius:9px;color:#fff;background:#0a66ff;font-weight:950}.wr-levels small{color:#6a8093;font-size:8px}.wr-matrix th:not(:first-child),.wr-matrix td:not(:first-child){text-align:center}.wr-matrix td:first-child strong,.wr-matrix td:first-child small{display:block}.wr-matrix td:first-child small{margin-top:3px;color:#71879a}.wr-cell{width:32px;height:32px;display:inline-grid;place-items:center;border-radius:9px;font-weight:950}.wr-legend{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.wr-legend span{display:flex;align-items:center;gap:6px;color:#5e778b;font-size:8px}.wr-legend i{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;font-style:normal;font-weight:900}.wr-qr{display:grid;place-items:center;gap:8px;padding:28px;border:2px dashed #a9c3d8;border-radius:15px;color:#0a66ff;background:#f5faff;text-align:center}.wr-qr span{color:#657d91;font-size:9px}.wr-search{margin-top:12px}.wr-floor-steps{display:grid;gap:10px}.wr-floor-steps>div{position:relative;padding:13px 13px 13px 52px;border:1px solid #dce6ed;border-radius:12px}.wr-floor-steps>div>span{position:absolute;left:12px;top:12px;width:30px;height:30px;display:grid;place-items:center;border-radius:8px;color:#fff;background:#0a66ff;font-weight:950}.wr-floor-steps p{margin:5px 0;color:#60788c;font-size:9px;line-height:1.5}.wr-floor-steps em{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-style:normal;font-weight:900}.wr-modal-backdrop{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:18px;background:rgba(3,15,27,.76);backdrop-filter:blur(8px)}.wr-modal{width:min(720px,96vw);padding:21px;border:1px solid #d4e1eb;border-radius:20px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.38)}@media(max-width:1100px){.wr-flow{grid-template-columns:repeat(3,1fr)}.wr-flow div:nth-child(3):after{display:none}}@media(max-width:850px){.wr-sidebar{position:static;width:auto;height:auto}.wr-main{margin-left:0}.wr-sidebar nav{grid-template-columns:repeat(2,1fr)}.wr-side-footer{display:none}.wr-hero,.wr-grid-two{grid-template-columns:1fr}.wr-intent-grid,.wr-form-grid{grid-template-columns:1fr}.wr-form-grid .full{grid-column:auto}.wr-topbar{align-items:flex-start;gap:10px;padding:14px;flex-direction:column}.wr-top-actions{width:100%;justify-content:space-between}.wr-content{padding:14px}.wr-flow{grid-template-columns:1fr}.wr-flow div:after{display:none}.wr-filters{grid-template-columns:1fr}.wr-feed{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
