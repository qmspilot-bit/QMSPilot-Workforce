"use client";

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const people = [
  {
    id: "EMP-014",
    name: "Maria Torres",
    role: "Assembly Technician",
    department: "Operations",
    area: "Final Assembly",
    readiness: "Training required",
    coverage: "3 of 5",
    continuity: "Backup available",
    continuityNote: "2 qualified backups",
    nextDue: "2026-08-06",
    owner: "Assembly Lead",
    skills: [
      ["Fan Assembly", "Training"],
      ["Final Inspection", "Supervised"],
      ["Packaging", "Qualified"],
      ["Electrical Test", "N/A"],
      ["Foam Setup", "N/A"],
    ],
  },
  {
    id: "EMP-021",
    name: "Andre Lewis",
    role: "Test Technician",
    department: "Quality",
    area: "Electrical Test",
    readiness: "Expired",
    coverage: "4 of 5",
    continuity: "No backup",
    continuityNote: "Single-point capability",
    nextDue: "Overdue",
    owner: "Quality Supervisor",
    skills: [
      ["Electrical Test", "Expired"],
      ["Final Inspection", "Qualified"],
      ["Fan Assembly", "Qualified"],
      ["Packaging", "Qualified"],
      ["Foam Setup", "N/A"],
    ],
  },
  {
    id: "EMP-027",
    name: "James Cole",
    role: "Test Technician",
    department: "Quality",
    area: "Electrical Test",
    readiness: "Expired",
    coverage: "4 of 5",
    continuity: "No backup",
    continuityNote: "Single-point capability",
    nextDue: "Overdue",
    owner: "Quality Supervisor",
    skills: [
      ["Electrical Test", "Expired"],
      ["Final Inspection", "Qualified"],
      ["Fan Assembly", "Qualified"],
      ["Packaging", "Qualified"],
      ["Foam Setup", "N/A"],
    ],
  },
  {
    id: "EMP-032",
    name: "Sofia Reed",
    role: "Foam Operator",
    department: "Operations",
    area: "Foam Operations",
    readiness: "Training required",
    coverage: "2 of 4",
    continuity: "Backup available",
    continuityNote: "1 qualified backup",
    nextDue: "2026-08-09",
    owner: "Production Supervisor",
    skills: [
      ["Foam Setup", "Training"],
      ["Final Inspection", "Supervised"],
      ["Packaging", "Qualified"],
      ["Fan Assembly", "N/A"],
      ["Electrical Test", "N/A"],
    ],
  },
  {
    id: "EMP-036",
    name: "Caleb Young",
    role: "Foam Operator",
    department: "Operations",
    area: "Foam Operations",
    readiness: "Ready",
    coverage: "4 of 4",
    continuity: "Backup available",
    continuityNote: "2 qualified backups",
    nextDue: "2027-03-10",
    owner: "Production Supervisor",
    skills: [
      ["Foam Setup", "Qualified"],
      ["Final Inspection", "Supervised"],
      ["Packaging", "Qualified"],
      ["Fan Assembly", "N/A"],
      ["Electrical Test", "N/A"],
    ],
  },
  {
    id: "EMP-041",
    name: "Emily Chen",
    role: "Quality Technician",
    department: "Quality",
    area: "Final Inspection",
    readiness: "Ready",
    coverage: "5 of 5",
    continuity: "Backup available",
    continuityNote: "3 qualified backups",
    nextDue: "2027-02-18",
    owner: "Quality Manager",
    skills: [
      ["Final Inspection", "Qualified"],
      ["Electrical Test", "Qualified"],
      ["Fan Assembly", "Supervised"],
      ["Packaging", "Qualified"],
      ["Foam Setup", "N/A"],
    ],
  },
];

const qualificationControls = [
  {
    employee: "Andre Lewis",
    process: "Electrical Functional Test",
    trigger: "revision change",
    frequency: "WI-TEST-014 Rev C",
    owner: "Quality Supervisor",
    lastCompleted: "2025-08-03",
    nextDue: "Overdue",
    status: "Expired",
  },
  {
    employee: "James Cole",
    process: "Electrical Functional Test",
    trigger: "annual",
    frequency: "Every 12 months",
    owner: "Quality Supervisor",
    lastCompleted: "2025-08-04",
    nextDue: "Overdue",
    status: "Expired",
  },
  {
    employee: "Maria Torres",
    process: "Fan Motor Assembly",
    trigger: "new qualification",
    frequency: "Practical demonstration",
    owner: "Assembly Lead",
    lastCompleted: "Awareness complete",
    nextDue: "2026-08-06",
    status: "Evaluation due",
  },
  {
    employee: "Sofia Reed",
    process: "Foam Fixture Setup",
    trigger: "revision change",
    frequency: "WI-FOAM-009 Rev D",
    owner: "Production Supervisor",
    lastCompleted: "2026-03-10",
    nextDue: "2026-08-09",
    status: "Training open",
  },
  {
    employee: "Caleb Young",
    process: "Foam Fixture Setup",
    trigger: "annual",
    frequency: "Every 12 months",
    owner: "Production Supervisor",
    lastCompleted: "2026-03-10",
    nextDue: "2027-03-10",
    status: "Controlled",
  },
];

function badgeClass(value) {
  if (["Ready", "Qualified", "Controlled"].includes(value)) return "good";
  if (["Training required", "Training", "Training open", "Supervised", "Evaluation due"].includes(value)) return "warn";
  if (["Expired", "Overdue"].includes(value)) return "bad";
  return "blue";
}

function clickWorkspaceTab(label) {
  const button = Array.from(document.querySelectorAll(".wr-sidebar nav button")).find((node) => node.textContent?.includes(label));
  button?.click();
}

export default function WorkforceReadinessExperienceEnhancer() {
  const [portalTarget, setPortalTarget] = useState(null);
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [status, setStatus] = useState("All readiness states");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const content = document.querySelector(".wr-content");
    if (content) setPortalTarget(content);

    const syncNativePanel = () => {
      const matrixPanel = Array.from(document.querySelectorAll(".wr-content .wr-panel")).find((panel) => panel.querySelector("h2")?.textContent?.includes("Workforce Readiness Matrix"));
      if (matrixPanel) matrixPanel.style.display = active ? "none" : "";
    };

    const buttons = Array.from(document.querySelectorAll(".wr-sidebar nav button"));
    const listeners = [];
    buttons.forEach((button) => {
      const handler = () => {
        const isMatrix = button.textContent?.includes("Readiness Matrix");
        setActive(Boolean(isMatrix));
      };
      button.addEventListener("click", handler);
      listeners.push([button, handler]);
    });

    const observer = new MutationObserver(syncNativePanel);
    observer.observe(document.body, { childList: true, subtree: true });
    syncNativePanel();

    return () => {
      observer.disconnect();
      listeners.forEach(([button, handler]) => button.removeEventListener("click", handler));
      const matrixPanel = Array.from(document.querySelectorAll(".wr-content .wr-panel")).find((panel) => panel.querySelector("h2")?.textContent?.includes("Workforce Readiness Matrix"));
      if (matrixPanel) matrixPanel.style.display = "";
    };
  }, [active]);

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return people.filter((person) => {
      const matchesQuery = !normalized || `${person.name} ${person.id} ${person.role} ${person.area}`.toLowerCase().includes(normalized);
      const matchesDepartment = department === "All departments" || person.department === department;
      const matchesStatus = status === "All readiness states" || person.readiness === status;
      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [query, department, status]);

  const exportCsv = () => {
    const header = ["Employee", "Employee ID", "Role", "Department", "Work Center", "Readiness", "Coverage", "Continuity", "Next Due", "Owner"];
    const rows = filteredPeople.map((person) => [person.name, person.id, person.role, person.department, person.area, person.readiness, person.coverage, person.continuity, person.nextDue, person.owner]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Davicorp-Workforce-Readiness.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!portalTarget || !active) return null;

  return createPortal(
    <>
      <div className="wr-restored-stack">
        <section className="wr-register-card">
          <header className="wr-register-heading">
            <div>
              <small>07 · WORKFORCE READINESS REGISTER</small>
              <h2>Know who is qualified, where gaps exist, and what must happen next</h2>
              <p>Search the workforce, review coverage and continuity, open qualification evidence, and route the next controlled action.</p>
            </div>
            <SlidersHorizontal size={20} />
          </header>

          <div className="wr-register-toolbar">
            <button className="primary" onClick={() => clickWorkspaceTab("Competency Signoff")}><UserPlus size={15} /> Add employee</button>
            <button onClick={() => clickWorkspaceTab("Training Assignments")}><GraduationCap size={15} /> Assign training</button>
            <button onClick={exportCsv}><Download size={15} /> Download matrix</button>
            <a href="/executive-intelligence"><ArrowRight size={15} /> Executive readiness</a>
          </div>

          <div className="wr-register-filters">
            <label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee, role, work center, or employee ID" /></label>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
              <option>All departments</option>
              <option>Operations</option>
              <option>Quality</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by readiness state">
              <option>All readiness states</option>
              <option>Ready</option>
              <option>Training required</option>
              <option>Expired</option>
            </select>
          </div>

          <div className="wr-register-table-wrap">
            <table className="wr-register-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Area</th>
                  <th>Coverage</th>
                  <th>Readiness</th>
                  <th>Next control</th>
                  <th>Continuity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="wr-person-cell">
                        <span><Users size={17} /></span>
                        <div><strong>{person.name}</strong><small>{person.id} · {person.role}</small></div>
                      </div>
                    </td>
                    <td><strong>{person.department}</strong><small>{person.area}</small></td>
                    <td><strong>{person.coverage} qualified</strong><small>Required capabilities</small></td>
                    <td><span className={`wr-register-badge ${badgeClass(person.readiness)}`}>{person.readiness}</span></td>
                    <td><strong className={person.nextDue === "Overdue" ? "is-overdue" : ""}>{person.nextDue}</strong><small>{person.owner}</small></td>
                    <td><strong>{person.continuity}</strong><small>{person.continuityNote}</small></td>
                    <td>
                      <div className="wr-register-actions">
                        <button aria-label={`View ${person.name} qualification details`} onClick={() => setSelected(person)}><Eye size={14} /></button>
                        <button aria-label={`Edit ${person.name}`} onClick={() => clickWorkspaceTab("Competency Signoff")}><Pencil size={14} /></button>
                        <button aria-label={`Assign training to ${person.name}`} onClick={() => clickWorkspaceTab("Training Assignments")}><GraduationCap size={14} /></button>
                        <button aria-label={`Review controlled documents for ${person.name}`} onClick={() => clickWorkspaceTab("Document Library")}><BookOpenCheck size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="wr-register-card">
          <header className="wr-register-heading">
            <div>
              <small>08 · TRAINING & QUALIFICATION CONTROL</small>
              <h2>Convert competency requirements into accountable schedules</h2>
              <p>Each open item has a trigger, owner, due date, evidence expectation, and controlled status.</p>
            </div>
            <ClipboardCheck size={20} />
          </header>

          <div className="wr-register-table-wrap">
            <table className="wr-register-table wr-control-table">
              <thead>
                <tr>
                  <th>Employee / Process</th>
                  <th>Trigger</th>
                  <th>Owner</th>
                  <th>Last completed</th>
                  <th>Next due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {qualificationControls.map((item) => (
                  <tr key={`${item.employee}-${item.process}`}>
                    <td><strong>{item.process}</strong><small>{item.employee}</small></td>
                    <td><strong>{item.trigger}</strong><small>{item.frequency}</small></td>
                    <td><strong>{item.owner}</strong></td>
                    <td><strong>{item.lastCompleted}</strong></td>
                    <td><strong className={item.nextDue === "Overdue" ? "is-overdue" : ""}>{item.nextDue}</strong></td>
                    <td><span className={`wr-register-badge ${badgeClass(item.status)}`}>{item.status}</span></td>
                    <td>
                      <div className="wr-register-actions">
                        <button aria-label="Open qualification control" onClick={() => clickWorkspaceTab("Training Assignments")}><Eye size={14} /></button>
                        <button aria-label="Edit qualification control" onClick={() => clickWorkspaceTab("Competency Signoff")}><Pencil size={14} /></button>
                        <button aria-label="Revalidate qualification" onClick={() => clickWorkspaceTab("Competency Signoff")}><RefreshCw size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected && (
        <div className="wr-register-modal-backdrop" onClick={() => setSelected(null)}>
          <aside className="wr-register-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><small>EMPLOYEE QUALIFICATION RECORD</small><h2>{selected.name}</h2><p>{selected.id} · {selected.role} · {selected.area}</p></div>
              <button aria-label="Close employee details" onClick={() => setSelected(null)}><X size={18} /></button>
            </header>

            <div className="wr-person-summary">
              <div><span><UserRoundCheck size={19} /></span><small>Readiness</small><strong>{selected.readiness}</strong></div>
              <div><span><BadgeCheck size={19} /></span><small>Coverage</small><strong>{selected.coverage}</strong></div>
              <div><span><ShieldCheck size={19} /></span><small>Continuity</small><strong>{selected.continuity}</strong></div>
            </div>

            <section className="wr-qualification-list">
              <div className="wr-modal-section-title"><div><small>PROCESS QUALIFICATIONS</small><h3>Current capability evidence</h3></div><FileText size={18} /></div>
              {selected.skills.map(([skill, state]) => (
                <div key={skill}>
                  <span className={`wr-skill-icon ${badgeClass(state)}`}>
                    {state === "Qualified" ? <CheckCircle2 size={15} /> : state === "Expired" ? <AlertTriangle size={15} /> : state === "N/A" ? <X size={15} /> : <Clock3 size={15} />}
                  </span>
                  <span><strong>{skill}</strong><small>{state === "Qualified" ? "Current controlled evidence on file" : state === "Expired" ? "Independent work restricted until revalidation" : state === "Training" ? "Training and practical signoff remain open" : state === "Supervised" ? "Work permitted only with defined oversight" : "Not required for current role"}</small></span>
                  <em className={`wr-register-badge ${badgeClass(state)}`}>{state}</em>
                </div>
              ))}
            </section>

            <div className="wr-modal-actions">
              <button onClick={() => { setSelected(null); clickWorkspaceTab("Training Assignments"); }}><GraduationCap size={15} /> Open training</button>
              <button onClick={() => { setSelected(null); clickWorkspaceTab("Competency Signoff"); }}><ShieldCheck size={15} /> Competency signoff</button>
              <a href="/executive-intelligence">Executive rollup <ArrowRight size={15} /></a>
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        .wr-restored-stack{display:grid;gap:16px;animation:wrRegisterIn 260ms var(--ns-ease-emphasis,cubic-bezier(.16,1,.3,1)) both}.wr-register-card{padding:18px;border:1px solid #d6e2eb;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(24,53,77,.07)}.wr-register-heading{display:flex;align-items:flex-start;gap:14px;padding-bottom:13px;border-bottom:1px solid #dce6ee}.wr-register-heading>div{margin-right:auto}.wr-register-heading small{color:#5d7ea1;font-size:9px;font-weight:950;letter-spacing:.14em}.wr-register-heading h2{margin:5px 0 4px;color:#10263a;font-size:19px}.wr-register-heading p{margin:0;color:#647b8f;font-size:10px;line-height:1.55}.wr-register-heading>svg{color:#143a60}.wr-register-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.wr-register-toolbar button,.wr-register-toolbar a{min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 11px;border:1px solid #c3d4e2;border-radius:9px;color:#153b5e;background:#fff;text-decoration:none;font-size:10px;font-weight:900;cursor:pointer}.wr-register-toolbar .primary{border-color:#0b59ca;color:#fff;background:#174fc2}.wr-register-filters{display:grid;grid-template-columns:minmax(320px,1fr) 165px 175px;gap:8px;margin-bottom:12px}.wr-register-filters label{display:flex;align-items:center;gap:7px;padding:0 10px;border:1px solid #c6d6e2;border-radius:9px;background:#fff}.wr-register-filters input{border:0!important;box-shadow:none!important;padding-left:0!important}.wr-register-filters select{min-height:34px;padding:0 9px;border:1px solid #c6d6e2;border-radius:9px;color:#183a59;background:#fff;font-size:10px}.wr-register-table-wrap{overflow:auto;border:1px solid #d2dfe9;border-radius:12px}.wr-register-table{width:100%;min-width:1040px;border-collapse:collapse}.wr-register-table th{padding:8px 9px;border-bottom:1px solid #cfdae5;color:#355675;background:#eef4f8;text-align:left;font-size:8px;font-weight:950;letter-spacing:.04em;text-transform:uppercase}.wr-register-table td{padding:8px 9px;border-bottom:1px solid #dbe4ec;color:#10263a;font-size:10px;vertical-align:middle}.wr-register-table tbody tr:last-child td{border-bottom:0}.wr-register-table tbody tr{transition:background 160ms ease}.wr-register-table tbody tr:hover{background:#f5f9fd}.wr-register-table td strong,.wr-register-table td small{display:block}.wr-register-table td strong{font-size:10px}.wr-register-table td small{margin-top:3px;color:#6a8094;font-size:8px}.wr-person-cell{display:flex;align-items:center;gap:9px}.wr-person-cell>span{width:32px;height:32px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:#fff;background:linear-gradient(135deg,#1661ee,#315cff)}.wr-register-badge{display:inline-flex!important;width:max-content;padding:4px 7px;border-radius:999px;font-size:7px!important;font-style:normal;font-weight:950;white-space:nowrap}.wr-register-actions{display:flex;gap:4px;white-space:nowrap}.wr-register-actions button{width:29px;height:29px;display:inline-grid;place-items:center;padding:0;border:1px solid #c9d9e5;border-radius:8px;color:#285677;background:#fff;cursor:pointer;transition:transform 150ms ease,border-color 150ms ease,background 150ms ease}.wr-register-actions button:hover{transform:translateY(-1px);border-color:#77a8d3;background:#eef6fd}.wr-register-table .is-overdue{color:#b31f35}.wr-control-table td{height:47px}.wr-register-modal-backdrop{position:fixed;inset:0;z-index:760;display:flex;justify-content:flex-end;padding:18px;background:rgba(5,18,31,.64);backdrop-filter:blur(7px);animation:wrBackdropIn 180ms ease both}.wr-register-modal{width:min(520px,96vw);height:100%;overflow:auto;padding:21px;border:1px solid #365b7a;border-radius:20px;color:#eaf4ff;background:radial-gradient(circle at 100% 0%,rgba(58,169,255,.17),transparent 32%),linear-gradient(180deg,#071a30,#0a2948);box-shadow:0 34px 90px rgba(0,0,0,.42);animation:wrDrawerIn 320ms var(--ns-ease-emphasis,cubic-bezier(.16,1,.3,1)) both}.wr-register-modal>header{display:flex;gap:12px;padding-bottom:16px;border-bottom:1px solid #31516d}.wr-register-modal>header>div{margin-right:auto}.wr-register-modal header small,.wr-modal-section-title small{color:#88c6fa;font-size:8px;font-weight:950;letter-spacing:.13em}.wr-register-modal h2{margin:6px 0 3px}.wr-register-modal header p{margin:0;color:#9fb6c9;font-size:9px}.wr-register-modal header button{width:36px;height:36px;display:grid;place-items:center;border:1px solid #426582;border-radius:9px;color:#fff;background:#102e4d}.wr-person-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:16px 0}.wr-person-summary>div{display:grid;gap:4px;padding:12px;border:1px solid #365a77;border-radius:12px;background:rgba(255,255,255,.045)}.wr-person-summary span{color:#78bdf6}.wr-person-summary small{color:#8ca7bd;font-size:8px}.wr-person-summary strong{font-size:10px}.wr-qualification-list{display:grid;gap:7px}.wr-modal-section-title{display:flex;align-items:center;gap:10px;margin-bottom:4px}.wr-modal-section-title>div{margin-right:auto}.wr-modal-section-title h3{margin:4px 0 0}.wr-qualification-list>div:not(.wr-modal-section-title){display:grid;grid-template-columns:34px 1fr auto;gap:9px;align-items:center;padding:10px;border:1px solid #31526d;border-radius:11px;background:rgba(255,255,255,.035)}.wr-qualification-list strong,.wr-qualification-list small{display:block}.wr-qualification-list strong{font-size:10px}.wr-qualification-list small{margin-top:3px;color:#92aabd;font-size:8px;line-height:1.45}.wr-skill-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:9px}.wr-modal-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:16px;padding-top:15px;border-top:1px solid #31516d}.wr-modal-actions button,.wr-modal-actions a{min-height:36px;display:inline-flex;align-items:center;gap:6px;padding:0 10px;border:1px solid #4e7392;border-radius:9px;color:#fff;background:#123b63;text-decoration:none;font-size:9px;font-weight:900}.wr-modal-actions a{margin-left:auto;background:#1764c5}@keyframes wrRegisterIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes wrBackdropIn{from{opacity:0}to{opacity:1}}@keyframes wrDrawerIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}@media(max-width:900px){.wr-register-filters{grid-template-columns:1fr}.wr-person-summary{grid-template-columns:1fr}.wr-register-modal-backdrop{padding:8px}}@media(prefers-reduced-motion:reduce){.wr-restored-stack,.wr-register-modal-backdrop,.wr-register-modal{animation:none!important}.wr-register-actions button{transition:none!important}}
      `}</style>
    </>,
    portalTarget,
  );
}
