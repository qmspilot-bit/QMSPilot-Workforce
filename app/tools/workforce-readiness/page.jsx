"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Download,
  GraduationCap,
  Printer,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCloudWorkspace } from "@/components/cloud-workspace";
import { createClient } from "@/lib/supabase/client";

const draftKey = "qmspilot:workforce-readiness:draft";
const recordsKey = "qmspilot:workforce-readiness:records";

const levelMeta = {
  0: { label: "Not assigned", status: "not_assigned" },
  1: { label: "Training required", status: "training_required" },
  2: { label: "In training", status: "in_training" },
  3: { label: "Qualified with supervision", status: "qualified_supervised" },
  4: { label: "Fully qualified", status: "fully_qualified" },
  5: { label: "Trainer / subject-matter expert", status: "trainer" },
};

const capabilities = [
  { key: "cnc", name: "CNC setup & operation", category: "Production", critical: true },
  { key: "press", name: "Pressing & fit verification", category: "Production", critical: true },
  { key: "inspection", name: "Final inspection release", category: "Quality", critical: true },
  { key: "measurement", name: "Precision measurement", category: "Quality", critical: true },
  { key: "shipping", name: "Shipping verification", category: "Fulfillment", critical: false },
  { key: "forklift", name: "Forklift authorization", category: "Safety", critical: false },
];

function blankQualification(level = 0) {
  return { level, evaluator: "", effectiveDate: "", reviewDate: "", restriction: "", evidenceNote: "", evidenceNames: [] };
}

function qualificationMap(levels) {
  return Object.fromEntries(capabilities.map((capability, index) => [capability.key, blankQualification(levels[index] || 0)]));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createRecordId() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `NWR-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function demoPeople() {
  const people = [
    { id: "p1", employeeCode: "EMP-101", name: "Maria Torres", department: "Operations", role: "Senior Technician", shift: "Day", supervisor: "Operations Manager", hireDate: "2021-03-15", qualifications: qualificationMap([5, 5, 3, 4, 4, 4]) },
    { id: "p2", employeeCode: "EMP-102", name: "James Cole", department: "Operations", role: "Machinist", shift: "Day", supervisor: "Operations Manager", hireDate: "2022-08-08", qualifications: qualificationMap([4, 2, 1, 3, 3, 4]) },
    { id: "p3", employeeCode: "EMP-103", name: "Alicia Reed", department: "Quality", role: "Quality Inspector", shift: "Day", supervisor: "Quality Manager", hireDate: "2020-11-02", qualifications: qualificationMap([1, 2, 5, 5, 3, 3]) },
    { id: "p4", employeeCode: "EMP-104", name: "Marcus Hill", department: "Operations", role: "Technician", shift: "Night", supervisor: "Night Supervisor", hireDate: "2024-01-22", qualifications: qualificationMap([3, 4, 1, 2, 2, 4]) },
    { id: "p5", employeeCode: "EMP-105", name: "Emily Chen", department: "Quality", role: "Quality Technician", shift: "Night", supervisor: "Quality Manager", hireDate: "2023-06-19", qualifications: qualificationMap([1, 1, 4, 4, 2, 3]) },
    { id: "p6", employeeCode: "EMP-106", name: "Derek Owens", department: "Logistics", role: "Shipping Specialist", shift: "Day", supervisor: "Logistics Manager", hireDate: "2022-04-04", qualifications: qualificationMap([0, 0, 2, 2, 5, 5]) },
  ];
  people[0].qualifications.press.reviewDate = dateFromToday(42);
  people[0].qualifications.press.evaluator = "Plant Manager";
  people[2].qualifications.inspection.reviewDate = dateFromToday(75);
  people[2].qualifications.inspection.evaluator = "Quality Manager";
  people[3].qualifications.press.evaluator = "Maria Torres";
  people[3].qualifications.press.effectiveDate = today();
  people[3].qualifications.press.evidenceNote = "Three observed production cycles completed without coaching.";
  people[3].qualifications.press.evidenceNames = ["pressing_signoff.pdf"];
  return people;
}

export default function WorkforceReadinessPage() {
  const cloud = useCloudWorkspace();
  const [setup, setSetup] = useState({
    organization: "QMSPilot Design Partner",
    site: "",
    readinessOwner: "",
    planningHorizon: "90 days",
    leadershipIntent: "Build qualified coverage for every critical process without relying on a single individual.",
  });
  const [people, setPeople] = useState([]);
  const [selection, setSelection] = useState(null);
  const [recordId, setRecordId] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.setup) setSetup(draft.setup);
      if (Array.isArray(draft.people)) setPeople(draft.people);
      if (draft.recordId) setRecordId(draft.recordId);
      setNotice("Saved Workforce Readiness draft restored.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  const metrics = useMemo(() => {
    const qualifications = people.flatMap((person) => capabilities.map((capability) => ({
      person,
      capability,
      qualification: person.qualifications[capability.key] || blankQualification(),
    })));
    const readinessScore = qualifications.length
      ? Math.round((qualifications.reduce((sum, item) => sum + item.qualification.level, 0) / (qualifications.length * 5)) * 100)
      : 0;
    const criticalCoverage = capabilities.filter((capability) => capability.critical).map((capability) => ({
      capability,
      qualified: people.filter((person) => (person.qualifications[capability.key]?.level || 0) >= 4),
    }));
    const criticalGaps = criticalCoverage.filter((item) => item.qualified.length < 2);
    const singlePointDependencies = criticalCoverage.filter((item) => item.qualified.length === 1);
    const inTraining = qualifications.filter((item) => item.qualification.level === 2).length;
    const expiring = qualifications.filter((item) => {
      if (!item.qualification.reviewDate) return false;
      const days = (new Date(item.qualification.reviewDate).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 90;
    }).length;
    const fullyQualified = qualifications.filter((item) => item.qualification.level >= 4).length;
    const trainers = qualifications.filter((item) => item.qualification.level === 5).length;
    return { readinessScore, criticalGaps, singlePointDependencies, inTraining, expiring, fullyQualified, trainers };
  }, [people]);

  const selected = useMemo(() => {
    if (!selection) return null;
    const person = people.find((item) => item.id === selection.personId);
    const capability = capabilities.find((item) => item.key === selection.capabilityKey);
    if (!person || !capability) return null;
    return { person, capability, qualification: person.qualifications[capability.key] || blankQualification() };
  }, [people, selection]);

  const recommendations = useMemo(() => metrics.criticalGaps.map((gap) => {
    const candidate = people
      .filter((person) => (person.qualifications[gap.capability.key]?.level || 0) < 4)
      .sort((a, b) => (b.qualifications[gap.capability.key]?.level || 0) - (a.qualifications[gap.capability.key]?.level || 0))[0];
    return {
      capability: gap.capability.name,
      coverage: gap.qualified.length,
      candidate: candidate?.name || "Assign candidate",
      currentLevel: candidate?.qualifications[gap.capability.key]?.level || 0,
      priority: gap.qualified.length === 0 ? "Critical" : "High",
    };
  }), [metrics.criticalGaps, people]);

  function updateQualification(personId, capabilityKey, patch) {
    setPeople((current) => current.map((person) => person.id !== personId ? person : {
      ...person,
      qualifications: {
        ...person.qualifications,
        [capabilityKey]: { ...(person.qualifications[capabilityKey] || blankQualification()), ...patch },
      },
    }));
    setSubmitted(false);
  }

  function attachEvidence(event) {
    if (!selected) return;
    const evidenceNames = Array.from(event.target.files || []).map((file) => file.name);
    updateQualification(selected.person.id, selected.capability.key, { evidenceNames });
  }

  function loadDemo() {
    setSetup({
      organization: "Northstar Precision Systems",
      site: "Lufkin Operations",
      readinessOwner: "Director of Operations",
      planningHorizon: "90 days",
      leadershipIntent: "Protect customer delivery by eliminating single-person dependencies in final inspection, precision measurement, and pressing operations.",
    });
    const demo = demoPeople();
    setPeople(demo);
    setSelection({ personId: demo[0].id, capabilityKey: capabilities[0].key });
    setRecordId("");
    setSubmitted(false);
    setNotice("Design-partner Workforce Readiness demonstration loaded.");
  }

  function saveDraft() {
    window.localStorage.setItem(draftKey, JSON.stringify({ setup, people, recordId }));
    setNotice("Workforce Readiness draft saved on this device.");
  }

  function clearTool() {
    setSetup({ organization: "QMSPilot Design Partner", site: "", readinessOwner: "", planningHorizon: "90 days", leadershipIntent: "Build qualified coverage for every critical process without relying on a single individual." });
    setPeople([]);
    setSelection(null);
    setRecordId("");
    setSubmitted(false);
    setNotice("New Workforce Readiness assessment started.");
    window.localStorage.removeItem(draftKey);
  }

  function buildPayload(id) {
    return {
      schema: "qmspilot.northstar.workforce-readiness.v1",
      recordId: id,
      toolId: "QMSP-WR-001",
      version: "1.0.0",
      submittedAt: new Date().toISOString(),
      setup,
      metrics: {
        readinessScore: metrics.readinessScore,
        criticalSkillGaps: metrics.criticalGaps.length,
        singlePointDependencies: metrics.singlePointDependencies.length,
        expiringQualifications: metrics.expiring,
        trainingInProgress: metrics.inTraining,
        fullyQualifiedAssignments: metrics.fullyQualified,
        trainers: metrics.trainers,
      },
      capabilities,
      people,
      recommendations,
      governance: { humanQualificationAuthority: true, objectiveEvidenceRequired: true, source: "Northstar Workforce Readiness" },
    };
  }

  async function submitToNorthstar() {
    if (!setup.organization.trim() || !setup.site.trim() || !setup.readinessOwner.trim()) {
      setNotice("Complete organization, site, and readiness owner before submission.");
      return;
    }
    if (!people.length) {
      setNotice("Add or load workforce records before submission.");
      return;
    }

    setSaving(true);
    const id = recordId || createRecordId();
    const payload = buildPayload(id);
    try {
      const records = JSON.parse(window.localStorage.getItem(recordsKey) || "[]");
      window.localStorage.setItem(recordsKey, JSON.stringify([payload, ...records].slice(0, 50)));
      window.localStorage.removeItem(draftKey);

      if (cloud.status === "ready" && cloud.organizationId && cloud.user) {
        const supabase = createClient();
        if (!supabase) throw new Error("Northstar Secure cloud is unavailable.");
        const { data: snapshot, error: snapshotError } = await supabase
          .from("workforce_readiness_snapshots")
          .upsert({
            record_id: id,
            organization_id: cloud.organizationId,
            created_by: cloud.user.id,
            organization_name: setup.organization || cloud.organizationName,
            site: setup.site,
            readiness_score: metrics.readinessScore,
            critical_skill_gaps: metrics.criticalGaps.length,
            single_point_dependencies: metrics.singlePointDependencies.length,
            expiring_qualifications: metrics.expiring,
            training_in_progress: metrics.inTraining,
            payload,
            submitted_at: payload.submittedAt,
            updated_at: new Date().toISOString(),
          }, { onConflict: "record_id" })
          .select("id")
          .single();
        if (snapshotError) throw snapshotError;
        if (!snapshot?.id) throw new Error("Northstar did not return the Workforce Readiness record ID.");

        const personRows = people.map((person) => ({
          organization_id: cloud.organizationId,
          snapshot_id: snapshot.id,
          employee_code: person.employeeCode,
          full_name: person.name,
          department: person.department,
          role_name: person.role,
          shift_name: person.shift,
          supervisor_name: person.supervisor,
          employment_status: "active",
          hire_date: person.hireDate || null,
          created_by: cloud.user.id,
          updated_at: new Date().toISOString(),
        }));
        const { data: savedPeople, error: peopleError } = await supabase
          .from("workforce_readiness_people")
          .upsert(personRows, { onConflict: "snapshot_id,employee_code" })
          .select("id, employee_code");
        if (peopleError) throw peopleError;
        const personIds = new Map((savedPeople || []).map((person) => [person.employee_code, person.id]));

        const qualificationRows = people.flatMap((person) => capabilities.map((capability) => {
          const qualification = person.qualifications[capability.key] || blankQualification();
          const personId = personIds.get(person.employeeCode);
          if (!personId) throw new Error(`Northstar could not resolve ${person.employeeCode}.`);
          return {
            organization_id: cloud.organizationId,
            snapshot_id: snapshot.id,
            person_id: personId,
            capability_key: capability.key,
            capability_name: capability.name,
            capability_category: capability.category,
            critical: capability.critical,
            qualification_level: qualification.level,
            qualification_status: levelMeta[qualification.level].status,
            evaluator_name: qualification.evaluator,
            effective_date: qualification.effectiveDate || null,
            review_date: qualification.reviewDate || null,
            restriction_note: qualification.restriction,
            evidence_note: qualification.evidenceNote,
            evidence_names: qualification.evidenceNames,
            created_by: cloud.user.id,
            updated_at: new Date().toISOString(),
          };
        }));
        const { error: qualificationsError } = await supabase
          .from("workforce_readiness_qualifications")
          .upsert(qualificationRows, { onConflict: "snapshot_id,person_id,capability_key" });
        if (qualificationsError) throw qualificationsError;
        setNotice(`${id} submitted to the secure Northstar workspace. Human qualification authority remains active.`);
      } else {
        setNotice(`${id} saved in the Northstar demonstration workspace. Sign in to Secure cloud for tenant-protected persistence.`);
      }

      setRecordId(id);
      setSubmitted(true);
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Workforce Readiness could not submit to Northstar.");
    } finally {
      setSaving(false);
    }
  }

  function exportRecord() {
    const id = recordId || createRecordId();
    if (!recordId) setRecordId(id);
    const blob = new Blob([JSON.stringify(buildPayload(id), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}-workforce-readiness.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="wr-shell">
      <header className="wr-header">
        <a href="/" className="back" aria-label="Return to Northstar"><ArrowLeft size={18} /></a>
        <div className="qms-brand"><span className="qms-mark">✓</span><strong>QMSPilot</strong></div>
        <div className="northstar-brand"><span>NORTHST</span><b>✦</b><span>R</span></div>
        <div className="header-meta"><small>Northstar-connected production tool</small><strong>Workforce Readiness</strong></div>
        <div className="header-status"><span />Human supervised</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><GraduationCap size={17} /> SKILLS MATRIX · QUALIFICATION CONTROL · CAPACITY RISK</div>
          <h1>Know whether your workforce can safely deliver what the business has promised.</h1>
          <p>Convert training records into operational readiness, cross-training priorities, qualification evidence, and executive capacity confidence.</p>
          <div className="chips"><span>Tool ID QMSP-WR-001</span><span>Version 1.0.0</span><span>Northstar Ready</span><span>ISO 9001 · 7.2 aligned</span></div>
        </div>
        <article className="readiness-card">
          <small>WORKFORCE READINESS</small>
          <strong>{metrics.readinessScore}%</strong>
          <span>{metrics.criticalGaps.length ? "Leadership action required" : "Critical coverage controlled"}</span>
          <div className="ring" style={{ background: `conic-gradient(#0a66ff ${metrics.readinessScore * 3.6}deg,#26384d 0)` }}><div>{metrics.readinessScore}</div></div>
        </article>
      </section>

      <section className="toolbar no-print">
        <button onClick={loadDemo}><Sparkles size={17} />Load design-partner demo</button>
        <button onClick={saveDraft}><Save size={17} />Save draft</button>
        <button onClick={() => window.print()}><Printer size={17} />Executive report</button>
        <button onClick={exportRecord}><Download size={17} />Export record</button>
        <button onClick={clearTool}><RotateCcw size={17} />New assessment</button>
        <button className="submit" onClick={submitToNorthstar} disabled={saving}><Send size={17} />{saving ? "Submitting..." : "Submit to Northstar"}</button>
      </section>

      {notice && <div className={`notice ${submitted ? "submitted" : ""}`}>{submitted ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{notice}</div>}

      <section className="metrics">
        <article><small>Critical skill gaps</small><strong>{metrics.criticalGaps.length}</strong><span>Need two qualified people</span></article>
        <article><small>Single-person dependencies</small><strong>{metrics.singlePointDependencies.length}</strong><span>Continuity exposure</span></article>
        <article><small>Training in progress</small><strong>{metrics.inTraining}</strong><span>Active development</span></article>
        <article><small>Expiring in 90 days</small><strong>{metrics.expiring}</strong><span>Renewal attention</span></article>
        <article><small>Trainer assignments</small><strong>{metrics.trainers}</strong><span>Internal capability</span></article>
        <article><small>Northstar record</small><strong className="record-id">{recordId || "DRAFT"}</strong><span>{submitted ? "Submitted" : "Not submitted"}</span></article>
      </section>

      <section className="panel setup-panel">
        <div className="panel-title"><div><small>01 · OPERATING CONTEXT</small><h2>Define the workforce decision</h2></div><Target size={24} /></div>
        <div className="form-grid">
          <label>Organization<input value={setup.organization} onChange={(event) => setSetup({ ...setup, organization: event.target.value })} /></label>
          <label>Site / facility<input value={setup.site} onChange={(event) => setSetup({ ...setup, site: event.target.value })} placeholder="Required" /></label>
          <label>Readiness owner<input value={setup.readinessOwner} onChange={(event) => setSetup({ ...setup, readinessOwner: event.target.value })} placeholder="Required" /></label>
          <label>Planning horizon<select value={setup.planningHorizon} onChange={(event) => setSetup({ ...setup, planningHorizon: event.target.value })}><option>30 days</option><option>60 days</option><option>90 days</option><option>12 months</option></select></label>
          <label className="wide">Leadership intent<textarea value={setup.leadershipIntent} onChange={(event) => setSetup({ ...setup, leadershipIntent: event.target.value })} /></label>
        </div>
      </section>

      <section className="panel matrix-panel">
        <div className="panel-title"><div><small>02 · CONTROLLED SKILLS MATRIX</small><h2>Qualification coverage by person and capability</h2></div><Users size={24} /></div>
        {!people.length ? <div className="empty"><UserRoundCheck size={42} /><h3>No workforce records loaded</h3><p>Load the design-partner demonstration to explore the full operating workflow.</p></div> : (
          <div className="matrix-wrap">
            <table>
              <thead><tr><th>Employee</th>{capabilities.map((capability) => <th key={capability.key}><span>{capability.name}</span><small>{capability.critical ? "CRITICAL" : capability.category}</small></th>)}</tr></thead>
              <tbody>{people.map((person) => <tr key={person.id}><td><strong>{person.name}</strong><small>{person.role} · {person.shift}</small></td>{capabilities.map((capability) => {
                const qualification = person.qualifications[capability.key] || blankQualification();
                return <td key={capability.key}><button className={`level level-${qualification.level}`} onClick={() => setSelection({ personId: person.id, capabilityKey: capability.key })}>{qualification.level}</button><select value={qualification.level} onChange={(event) => updateQualification(person.id, capability.key, { level: Number(event.target.value) })}>{[0,1,2,3,4,5].map((level) => <option value={level} key={level}>{level} · {levelMeta[level].label}</option>)}</select></td>;
              })}</tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="legend">{[0,1,2,3,4,5].map((level) => <span key={level}><b className={`level-dot level-${level}`}>{level}</b>{levelMeta[level].label}</span>)}</div>
      </section>

      {selected && <section className="panel qualification-panel">
        <div className="panel-title"><div><small>03 · QUALIFICATION CONTROL</small><h2>{selected.person.name} · {selected.capability.name}</h2></div><BadgeCheck size={24} /></div>
        <div className="qualification-grid">
          <label>Qualification level<select value={selected.qualification.level} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { level: Number(event.target.value) })}>{[0,1,2,3,4,5].map((level) => <option value={level} key={level}>{level} · {levelMeta[level].label}</option>)}</select></label>
          <label>Evaluator / qualification authority<input value={selected.qualification.evaluator} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { evaluator: event.target.value })} /></label>
          <label>Effective date<input type="date" value={selected.qualification.effectiveDate} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { effectiveDate: event.target.value })} /></label>
          <label>Review / expiration date<input type="date" value={selected.qualification.reviewDate} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { reviewDate: event.target.value })} /></label>
          <label className="wide">Restrictions or required supervision<textarea value={selected.qualification.restriction} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { restriction: event.target.value })} /></label>
          <label className="wide">Objective evidence / evaluator note<textarea value={selected.qualification.evidenceNote} onChange={(event) => updateQualification(selected.person.id, selected.capability.key, { evidenceNote: event.target.value })} /></label>
          <label className="wide evidence"><UploadCloud size={20} /><span><strong>Attach qualification evidence</strong><small>{selected.qualification.evidenceNames.length ? selected.qualification.evidenceNames.join(", ") : "Photos, checklists, test results, videos, or signoff records"}</small></span><input type="file" multiple onChange={attachEvidence} /></label>
        </div>
        <div className="authority"><ShieldCheck size={20} /><span><strong>Human qualification authority</strong><small>Northstar records evidence and readiness intelligence. An authorized human evaluator remains the only authority who can grant or revoke qualification.</small></span></div>
      </section>}

      <section className="two-grid">
        <article className="panel risk-panel">
          <div className="panel-title"><div><small>04 · CAPACITY RISK</small><h2>What can stop the operation</h2></div><BarChart3 size={24} /></div>
          <div className="risk-list">{capabilities.filter((item) => item.critical).map((capability) => {
            const qualified = people.filter((person) => (person.qualifications[capability.key]?.level || 0) >= 4);
            const tone = qualified.length >= 2 ? "good" : qualified.length === 1 ? "warn" : "bad";
            return <div key={capability.key}><span className={tone}>{qualified.length}</span><span><strong>{capability.name}</strong><small>{qualified.length >= 2 ? "Resilient coverage" : qualified.length === 1 ? "Single-person dependency" : "No fully qualified coverage"}</small></span></div>;
          })}</div>
        </article>

        <article className="panel plan-panel">
          <div className="panel-title"><div><small>05 · CROSS-TRAINING PRIORITIES</small><h2>Where the next training hour matters most</h2></div><GraduationCap size={24} /></div>
          <div className="plan-list">{recommendations.length ? recommendations.map((item) => <div key={item.capability}><span className={item.priority.toLowerCase()}>{item.priority}</span><span><strong>{item.capability}</strong><small>Develop {item.candidate} from level {item.currentLevel} · Current full coverage: {item.coverage}</small></span></div>) : <div className="success-state"><CheckCircle2 /><span><strong>Critical coverage is controlled.</strong><small>Continue planned qualification renewals and succession development.</small></span></div>}</div>
        </article>
      </section>

      <section className="executive-summary">
        <div><small>PILOT EXECUTIVE INTERPRETATION</small><h2>{metrics.criticalGaps.length ? "Protect continuity before adding demand." : "The workforce can support the current operating plan."}</h2><p>{metrics.criticalGaps.length ? `${metrics.criticalGaps.length} critical capabilities do not yet have two fully qualified people. Leadership should approve the cross-training priorities before relying on overtime or additional production demand.` : "Critical processes have resilient qualified coverage. Maintain renewal discipline and continue developing trainer capacity."}</p></div>
        <button onClick={submitToNorthstar} disabled={saving}><Send size={18} />Submit controlled readiness record</button>
      </section>

      <p className="disclaimer">Northstar Workforce Readiness combines controlled qualification records with configurable demonstration data until HRIS, ERP, scheduling, and learning-system connectors are activated. Qualification decisions remain subject to company procedures and authorized human approval.</p>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#edf3f8;color:#12253a;font-family:Inter,Arial,sans-serif}.wr-shell{min-height:100vh;padding-bottom:70px}.wr-header{min-height:72px;display:flex;align-items:center;gap:15px;padding:10px 22px;color:#fff;background:linear-gradient(90deg,#061729,#0b3158);border-bottom:1px solid #24547d}.back{width:38px;height:38px;display:grid;place-items:center;border:1px solid #365c7d;border-radius:11px;color:#fff}.qms-brand{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;color:#102f4d;background:#fff;font-size:18px}.qms-mark{width:28px;height:28px;display:grid;place-items:center;border:3px solid #0a66ff;border-radius:50%;color:#0a66ff;font-weight:900}.northstar-brand{padding:8px 14px;border:1px solid #344b63;border-radius:10px;color:#e6e8ed;background:#07111d;font-weight:950;letter-spacing:.13em}.northstar-brand b{color:#7fdbff}.header-meta{margin-right:auto}.header-meta small,.header-meta strong{display:block}.header-meta small{color:#8fb5d6;text-transform:uppercase;letter-spacing:.1em}.header-status{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #2b6d5a;border-radius:999px;color:#c9f3e5;background:#0d3a31;font-size:11px;font-weight:800}.header-status span{width:8px;height:8px;border-radius:50%;background:#45d39d}.hero{max-width:1540px;margin:0 auto;display:grid;grid-template-columns:1.45fr .55fr;gap:18px;padding:28px 24px}.hero-copy{padding:32px;border-radius:24px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c 62%,#0a66ff);box-shadow:0 24px 60px rgba(9,48,83,.25)}.eyebrow{display:flex;align-items:center;gap:8px;color:#9fd3ff;font-size:11px;font-weight:900;letter-spacing:.12em}.hero h1{max-width:1000px;margin:14px 0 12px;font-size:clamp(34px,4vw,62px);line-height:1.02}.hero p{max-width:900px;color:#d4e7f7;line-height:1.65}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.chips span{padding:7px 10px;border:1px solid #5f9fd3;border-radius:999px;color:#d9ecfb;font-size:10px;font-weight:800}.readiness-card{display:grid;place-items:center;padding:24px;border:1px solid #dce6ef;border-radius:24px;background:#fff;box-shadow:0 16px 38px rgba(24,55,83,.1);text-align:center}.readiness-card>small{color:#71869a;font-weight:900;letter-spacing:.12em}.readiness-card>strong{font-size:52px}.readiness-card>span{color:#16835a;font-weight:800}.ring{width:150px;height:150px;display:grid;place-items:center;margin-top:12px;border-radius:50%}.ring div{width:112px;height:112px;display:grid;place-items:center;border-radius:50%;background:#fff;font-size:34px;font-weight:900}.toolbar{max-width:1540px;margin:0 auto;padding:0 24px;display:flex;gap:9px;flex-wrap:wrap}.toolbar button,.executive-summary button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid #cddbe7;border-radius:11px;color:#21405d;background:#fff;font-weight:850;cursor:pointer}.toolbar button.submit,.executive-summary button{margin-left:auto;border-color:#0a66ff;color:#fff;background:linear-gradient(135deg,#0d315c,#0a66ff)}button:disabled{opacity:.55;cursor:not-allowed}.notice{max-width:1492px;margin:14px auto 0;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid #e7c66c;border-radius:12px;color:#765408;background:#fff9e8;font-weight:800}.notice.submitted{border-color:#8fd0b3;color:#155f45;background:#effbf6}.metrics{max-width:1540px;margin:18px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metrics article{padding:17px;border:1px solid #dce6ef;border-radius:17px;background:#fff}.metrics small,.metrics strong,.metrics span{display:block}.metrics small{color:#70859a;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.metrics strong{margin-top:6px;font-size:28px}.metrics span{margin-top:3px;color:#16835a;font-size:11px;font-weight:800}.record-id{font-size:16px!important}.panel{max-width:1492px;margin:18px auto 0;padding:22px;border:1px solid #dce6ef;border-radius:20px;background:#fff;box-shadow:0 12px 32px rgba(24,55,83,.07)}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:1px solid #e2eaf1}.panel-title small{color:#71869a;font-weight:900;letter-spacing:.1em}.panel-title h2{margin:5px 0 0}.form-grid,.qualification-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:18px}.form-grid label,.qualification-grid label{display:grid;gap:6px;color:#526a80;font-size:11px;font-weight:850}.form-grid input,.form-grid select,.form-grid textarea,.qualification-grid input,.qualification-grid select,.qualification-grid textarea{width:100%;min-height:42px;padding:10px;border:1px solid #cad9e6;border-radius:10px;color:#12253a;background:#fbfdff;font:inherit}.form-grid textarea,.qualification-grid textarea{min-height:76px;resize:vertical}.wide{grid-column:1/-1}.matrix-wrap{overflow:auto;margin-top:18px;border:1px solid #dce6ef;border-radius:14px}table{width:100%;min-width:1180px;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #e1e9f0;border-right:1px solid #e1e9f0;text-align:center}th{position:sticky;top:0;background:#f2f7fb;color:#526a80;font-size:11px}th span,th small,td:first-child strong,td:first-child small{display:block}th small{margin-top:5px;color:#0a66ff;font-size:9px}td:first-child{position:sticky;left:0;z-index:2;text-align:left;background:#fff;min-width:210px}td:first-child small{margin-top:4px;color:#71869a}.level{width:42px;height:42px;border:0;border-radius:12px;color:#fff;cursor:pointer;font-size:18px;font-weight:900}.level-0{background:#788a99}.level-1{background:#a85a64}.level-2{background:#b87b19}.level-3{background:#3d7eaf}.level-4{background:#16835a}.level-5{background:#6b3da0}.matrix-wrap select{display:block;width:100%;margin-top:7px;padding:6px;border:1px solid #d4e0e9;border-radius:7px;font-size:10px}.legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:15px}.legend span{display:flex;align-items:center;gap:6px;color:#526a80;font-size:11px}.level-dot{width:25px;height:25px;display:grid;place-items:center;border-radius:7px;color:#fff}.empty{padding:42px;text-align:center;color:#6c8296}.evidence{display:flex!important;grid-template-columns:auto 1fr auto!important;align-items:center;padding:15px;border:1px dashed #7db2df;border-radius:13px;background:#f2f8fd;cursor:pointer}.evidence span strong,.evidence span small{display:block}.evidence input{max-width:260px}.authority{display:flex;align-items:flex-start;gap:10px;margin-top:15px;padding:14px;border-radius:13px;color:#155f45;background:#effbf6}.authority span strong,.authority span small{display:block}.authority small{margin-top:4px;color:#527267}.two-grid{max-width:1492px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:18px}.two-grid .panel{margin-top:18px}.risk-list,.plan-list{display:grid;margin-top:14px}.risk-list>div,.plan-list>div{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #e2eaf1}.risk-list>div>span:first-child{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:#fff;font-weight:900}.risk-list strong,.risk-list small,.plan-list strong,.plan-list small{display:block}.risk-list small,.plan-list small{margin-top:3px;color:#71869a}.good{background:#16835a}.warn{background:#b87b19}.bad{background:#a83e4d}.plan-list>div>span:first-child{min-width:62px;padding:6px 8px;border-radius:999px;text-align:center;font-size:9px;font-weight:900}.critical{color:#9c2031;background:#ffecef}.high{color:#8a5b00;background:#fff4dc}.success-state svg{color:#16835a}.executive-summary{max-width:1492px;margin:18px auto 0;display:flex;align-items:center;gap:20px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#07192c,#0b477c)}.executive-summary>div{margin-right:auto}.executive-summary small{color:#8fc9f7;font-weight:900;letter-spacing:.1em}.executive-summary h2{margin:6px 0}.executive-summary p{max-width:950px;margin:0;color:#d2e6f5;line-height:1.55}.executive-summary button{margin-left:0;background:#0a66ff}.disclaimer{max-width:1492px;margin:18px auto 0;padding:0 4px;color:#6b7f91;font-size:10px;line-height:1.5}@media(max-width:980px){.hero,.two-grid{grid-template-columns:1fr}.form-grid,.qualification-grid{grid-template-columns:1fr 1fr}.wr-header{flex-wrap:wrap}.header-meta{order:5;width:100%}.executive-summary{align-items:flex-start;flex-direction:column}}@media(max-width:620px){.hero{padding:18px 12px}.toolbar,.metrics{padding-left:12px;padding-right:12px}.panel,.notice,.executive-summary,.disclaimer{margin-left:12px;margin-right:12px}.form-grid,.qualification-grid{grid-template-columns:1fr}.qms-brand{font-size:14px}.northstar-brand{font-size:11px}.header-status{display:none}.hero-copy{padding:23px}.hero h1{font-size:36px}.evidence{grid-template-columns:1fr!important}.two-grid{display:block}.toolbar button.submit{margin-left:0}.executive-summary button{width:100%}}@media print{body{background:#fff}.no-print,.back,.header-status,.qualification-panel .evidence input{display:none!important}.panel,.readiness-card,.metrics article{box-shadow:none}.matrix-wrap{overflow:visible}table{min-width:0;font-size:8px}}
      `}</style>
    </main>
  );
}
