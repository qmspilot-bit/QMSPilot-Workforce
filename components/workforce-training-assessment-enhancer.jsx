"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const ASSESSMENT_KEY = "qmspilot:northstar:training-assessments";
const RESULT_KEY = "qmspilot:northstar:training-assessment-results";
const WORKSPACE_KEY = "qmspilot:northstar:workforce-readiness-workspace";

const demoAssessment = {
  id: "WI-ASM-006::B",
  documentNumber: "WI-ASM-006",
  title: "Fan Motor Assembly",
  revision: "B",
  questionCount: 5,
  passingScore: 80,
  allowRetakes: true,
  requireReviewAfterFail: true,
  status: "Approved",
  approvedBy: "Manufacturing Engineering",
  approvedAt: "2026-08-24T11:00:00.000Z",
  questions: [
    { id: "Q1", type: "multiple_choice", question: "Before beginning the assembly, what should the trainee use as the controlling source?", choices: ["The current approved work instruction", "A previous revision", "Personal notes", "Verbal memory only"], correctAnswer: "The current approved work instruction", reference: "Current controlled instruction" },
    { id: "Q2", type: "scenario", question: "A required quality checkpoint cannot be verified. What is the correct response?", choices: ["Stop and escalate the deviation", "Continue and check later", "Skip the check", "Ask another operator to sign it"], correctAnswer: "Stop and escalate the deviation", reference: "Quality checkpoint / escalation" },
    { id: "Q3", type: "true_false", question: "A trainee may substitute an uncontrolled method if production is behind schedule.", choices: ["True", "False"], correctAnswer: "False", reference: "Controlled method requirement" },
    { id: "Q4", type: "multiple_choice", question: "What evidence best supports completion of a required step?", choices: ["The required documented verification", "A verbal statement", "An assumption", "No evidence is needed"], correctAnswer: "The required documented verification", reference: "Required record / evidence" },
    { id: "Q5", type: "scenario", question: "The work result does not meet the instruction's expected result. What should happen next?", choices: ["Stop, contain, and follow the escalation path", "Ship it anyway", "Change the acceptance criteria", "Delete the record"], correctAnswer: "Stop, contain, and follow the escalation path", reference: "Expected result / escalation" },
  ],
};

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentTabLabel() {
  const active = document.querySelector(".wr-sidebar nav button.active");
  return active?.textContent || "";
}

function collectBuilderSnapshot() {
  const labels = Array.from(document.querySelectorAll(".wr-content label"));
  const getValue = (startsWith) => {
    const label = labels.find((node) => node.textContent?.trim().startsWith(startsWith));
    const field = label?.querySelector("input, textarea, select");
    return field?.value?.trim?.() || "";
  };
  const stepCards = Array.from(document.querySelectorAll(".wr-step-list article"));
  const stepText = stepCards.map((card, index) => {
    const fields = Array.from(card.querySelectorAll("input, textarea")).map((node) => node.value?.trim()).filter(Boolean);
    return `Section ${index + 1}: ${fields.join(" | ")}`;
  }).join("\n");
  return {
    documentNumber: getValue("Document Number") || "DRAFT",
    title: getValue("Title") || "Untitled controlled document",
    revision: "A",
    source: [
      `Purpose and Scope: ${getValue("Purpose and Scope")}`,
      `Process / Work Center: ${getValue("Process / Area") || getValue("Work Center")}`,
      stepText,
    ].filter(Boolean).join("\n"),
  };
}

function statusClass(status) {
  if (["Passed", "Complete", "Approved"].includes(status)) return "good";
  if (["Review Required", "Assessment Pending", "Viewed", "In Progress"].includes(status)) return "warn";
  if (["Failed"].includes(status)) return "bad";
  return "blue";
}

export default function WorkforceTrainingAssessmentEnhancer() {
  const [portalTarget, setPortalTarget] = useState(null);
  const [activeView, setActiveView] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState([]);
  const [draft, setDraft] = useState({ required: true, questionCount: 10, passingScore: 80, allowRetakes: true, requireReviewAfterFail: true, questions: [], status: "Not Generated" });
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const content = document.querySelector(".wr-content");
    if (content) setPortalTarget(content);
    const savedAssessments = readJson(ASSESSMENT_KEY, []);
    const seeded = savedAssessments.length ? savedAssessments : [demoAssessment];
    setAssessments(seeded);
    if (!savedAssessments.length) writeJson(ASSESSMENT_KEY, seeded);
    setResults(readJson(RESULT_KEY, []));

    const sync = () => setActiveView(currentTabLabel());
    const buttons = Array.from(document.querySelectorAll(".wr-sidebar nav button"));
    buttons.forEach((button) => button.addEventListener("click", sync));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      buttons.forEach((button) => button.removeEventListener("click", sync));
    };
  }, []);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const saveAssessments = (next) => {
    setAssessments(next);
    writeJson(ASSESSMENT_KEY, next);
  };

  const generateAssessment = async () => {
    const snapshot = collectBuilderSnapshot();
    if (!snapshot.source || snapshot.source.length < 20) {
      flash("Add controlled document content before generating the assessment.");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch("/api/training-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...snapshot, questionCount: draft.questionCount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assessment generation failed.");
      setDraft((current) => ({ ...current, ...snapshot, questions: data.questions, status: "AI Generated — Awaiting Approval", mode: data.mode }));
      flash("Assessment generated. Review and approve before it can be assigned.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Assessment generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const approveAssessment = () => {
    if (!draft.questions.length) return;
    const record = {
      ...draft,
      id: `${draft.documentNumber}::${draft.revision || "A"}`,
      status: "Approved",
      approvedBy: "Document Creator / Owner",
      approvedAt: new Date().toISOString(),
      version: 1,
    };
    const next = [record, ...assessments.filter((item) => item.id !== record.id)];
    saveAssessments(next);
    setDraft((current) => ({ ...current, status: "Approved" }));
    flash("Assessment approved and published. Human approval recorded.");
  };

  const updateQuestion = (id, field, value) => {
    setDraft((current) => ({ ...current, questions: current.questions.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const deleteQuestion = (id) => setDraft((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }));

  const trainingRows = useMemo(() => {
    const workspace = typeof window !== "undefined" ? readJson(WORKSPACE_KEY, {}) : {};
    const assignments = Array.isArray(workspace.assignments) && workspace.assignments.length ? workspace.assignments : [
      { id: 1, employee: "Maria Torres", role: "Assembly Technician", document: "WI-ASM-006 Rev B", requirement: "Practical demonstration", due: "Aug 6", status: "Viewed" },
    ];
    return assignments.map((item) => {
      const result = results.filter((entry) => entry.assignmentId === item.id).at(-1);
      const assessment = assessments.find((entry) => item.document?.includes(entry.documentNumber) && item.document?.includes(`Rev ${entry.revision}`));
      const assessmentStatus = result?.passed ? "Passed" : result?.requiresReview ? "Review Required" : assessment ? "Assessment Pending" : "Not Required";
      return { ...item, assessment, result, assessmentStatus };
    });
  }, [assessments, results]);

  const markReviewed = (assignment) => {
    const next = results.filter((item) => !(item.assignmentId === assignment.id && item.pendingReview));
    next.push({ assignmentId: assignment.id, employee: assignment.employee, pendingReview: false, reviewedAt: new Date().toISOString(), requiresReview: false, attempts: assignment.result?.attempts || 0 });
    setResults(next);
    writeJson(RESULT_KEY, next);
    flash("Current document revision reviewed. Assessment is available.");
  };

  const beginQuiz = (assignment) => {
    setQuiz(assignment);
    setAnswers({});
  };

  const submitQuiz = () => {
    if (!quiz?.assessment) return;
    const questions = quiz.assessment.questions;
    const correct = questions.reduce((sum, question) => sum + (answers[question.id] === question.correctAnswer ? 1 : 0), 0);
    const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
    const passed = score >= quiz.assessment.passingScore;
    const previousAttempts = quiz.result?.attempts || 0;
    const record = {
      assignmentId: quiz.id,
      employee: quiz.employee,
      document: quiz.document,
      documentRevision: quiz.assessment.revision,
      assessmentVersion: quiz.assessment.version || 1,
      score,
      passed,
      requiresReview: !passed && quiz.assessment.requireReviewAfterFail,
      attempts: previousAttempts + 1,
      completedAt: new Date().toISOString(),
    };
    const nextResults = [...results.filter((item) => item.assignmentId !== quiz.id), record];
    setResults(nextResults);
    writeJson(RESULT_KEY, nextResults);

    const workspace = readJson(WORKSPACE_KEY, {});
    if (Array.isArray(workspace.assignments)) {
      workspace.assignments = workspace.assignments.map((item) => item.id === quiz.id ? { ...item, status: passed ? "Complete" : "In Progress", assessmentScore: score, assessmentResult: passed ? "Passed" : "Review Required", attempts: record.attempts } : item);
      writeJson(WORKSPACE_KEY, workspace);
    }
    window.dispatchEvent(new CustomEvent("qmspilot:training-assessment-updated", { detail: record }));
    setQuiz({ ...quiz, submitted: true, score, passed });
  };

  if (!portalTarget) return null;

  const builderActive = activeView.includes("Instruction Builder");
  const trainingActive = activeView.includes("Training Assignments");
  if (!builderActive && !trainingActive && !quiz) return null;

  return createPortal(
    <>
      {notice && <div className="nsa-notice"><Sparkles size={16} /> {notice}</div>}

      {builderActive && <section className="nsa-card">
        <header className="nsa-heading">
          <div><small>TRAINING & COMPETENCY</small><h2>AI Training Assessment</h2><p>Generate a knowledge assessment from this controlled Work Instruction or SOP. Northstar assists; the document owner approves.</p></div>
          <GraduationCap size={22} />
        </header>

        <div className="nsa-config">
          <label className="nsa-toggle"><input type="checkbox" checked={draft.required} onChange={(event) => setDraft({ ...draft, required: event.target.checked })} /><span>Assessment required for training completion</span></label>
          <label>Questions<input type="number" min="3" max="20" value={draft.questionCount} onChange={(event) => setDraft({ ...draft, questionCount: Number(event.target.value) })} /></label>
          <label>Passing score<input type="number" min="1" max="100" value={draft.passingScore} onChange={(event) => setDraft({ ...draft, passingScore: Number(event.target.value) })} /></label>
          <label className="nsa-toggle"><input type="checkbox" checked={draft.allowRetakes} onChange={(event) => setDraft({ ...draft, allowRetakes: event.target.checked })} /><span>Allow retakes</span></label>
          <label className="nsa-toggle"><input type="checkbox" checked={draft.requireReviewAfterFail} onChange={(event) => setDraft({ ...draft, requireReviewAfterFail: event.target.checked })} /><span>Require document review after failed attempt</span></label>
        </div>

        <div className="nsa-actions">
          <button className="primary" disabled={!draft.required || generating} onClick={generateAssessment}><Sparkles size={15} /> {generating ? "Generating..." : draft.questions.length ? "Regenerate Assessment" : "Generate Assessment"}</button>
          <span className={`nsa-badge ${draft.status === "Approved" ? "good" : draft.questions.length ? "warn" : "blue"}`}>{draft.status}</span>
        </div>

        {draft.questions.length > 0 && <div className="nsa-review">
          <div className="nsa-review-head"><div><strong>Creator Review Required</strong><small>Edit, remove, or regenerate before approval. AI cannot publish this assessment.</small></div><ShieldCheck size={19} /></div>
          {draft.questions.map((question, index) => <article key={question.id}>
            <div className="nsa-qtop"><span>Q{index + 1} · {question.type.replaceAll("_", " ")}</span><button onClick={() => deleteQuestion(question.id)} aria-label="Delete question"><Trash2 size={14} /></button></div>
            <textarea value={question.question} onChange={(event) => updateQuestion(question.id, "question", event.target.value)} />
            <div className="nsa-choices">{question.choices.map((choice, choiceIndex) => <label key={`${question.id}-${choiceIndex}`}><input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === choice} onChange={() => updateQuestion(question.id, "correctAnswer", choice)} /><input value={choice} onChange={(event) => {
              const nextChoices = question.choices.map((item, idx) => idx === choiceIndex ? event.target.value : item);
              const nextCorrect = question.correctAnswer === choice ? event.target.value : question.correctAnswer;
              setDraft((current) => ({ ...current, questions: current.questions.map((item) => item.id === question.id ? { ...item, choices: nextChoices, correctAnswer: nextCorrect } : item) }));
            }} /></label>)}</div>
            <small className="nsa-reference">Source: {question.reference}</small>
          </article>)}
          <div className="nsa-approve"><div><BadgeCheck size={18} /><span><strong>Human approval is authoritative</strong><small>Approval records the assessment against the current document revision.</small></span></div><button className="primary" onClick={approveAssessment}><CheckCircle2 size={15} /> Approve & Publish Assessment</button></div>
        </div>}
      </section>}

      {trainingActive && <section className="nsa-card nsa-training">
        <header className="nsa-heading"><div><small>KNOWLEDGE CONFIRMATION</small><h2>Training Assessments</h2><p>Document review, assessment result, and training completion stay connected to the controlled revision.</p></div><ClipboardCheck size={22} /></header>
        <div className="nsa-table-wrap"><table><thead><tr><th>Employee</th><th>Controlled Document</th><th>Training Status</th><th>Assessment</th><th>Score</th><th>Action</th></tr></thead><tbody>{trainingRows.map((item) => <tr key={item.id}><td><strong>{item.employee}</strong><small>{item.role}</small></td><td><strong>{item.document}</strong><small>{item.requirement}</small></td><td><span className={`nsa-badge ${statusClass(item.status)}`}>{item.status}</span></td><td><span className={`nsa-badge ${statusClass(item.assessmentStatus)}`}>{item.assessmentStatus}</span></td><td>{item.result?.score != null ? `${item.result.score}%` : "—"}</td><td>{!item.assessment ? <span className="nsa-muted">No assessment required</span> : item.result?.passed ? <span className="nsa-complete"><CheckCircle2 size={14} /> Matrix updated</span> : item.result?.requiresReview ? <button onClick={() => markReviewed(item)}><BookOpenCheck size={14} /> Review Instruction Again</button> : <button className="primary" onClick={() => beginQuiz(item)}><GraduationCap size={14} /> Begin Assessment</button>}</td></tr>)}</tbody></table></div>
        <div className="nsa-sync"><CheckCircle2 size={16} /><span><strong>Closed-loop matrix sync</strong><small>Passing marks the training assignment complete and records score, revision, attempt count, and assessment version. Failure leaves training incomplete and routes the trainee back to the document.</small></span></div>
      </section>}

      {quiz && <div className="nsa-modal-backdrop"><section className="nsa-modal">
        {!quiz.submitted ? <>
          <header><button onClick={() => setQuiz(null)}><ArrowLeft size={15} /> Exit</button><div><small>TRAINING ASSESSMENT</small><h2>{quiz.document}</h2><p>{quiz.employee} · Passing score {quiz.assessment.passingScore}%</p></div><GraduationCap size={22} /></header>
          <div className="nsa-quiz-list">{quiz.assessment.questions.map((question, index) => <article key={question.id}><strong>{index + 1}. {question.question}</strong>{question.choices.map((choice) => <label key={choice}><input type="radio" name={question.id} checked={answers[question.id] === choice} onChange={() => setAnswers({ ...answers, [question.id]: choice })} /><span>{choice}</span></label>)}</article>)}</div>
          <footer><span>{Object.keys(answers).length} of {quiz.assessment.questions.length} answered</span><button className="primary" disabled={Object.keys(answers).length !== quiz.assessment.questions.length} onClick={submitQuiz}><Save size={15} /> Submit Assessment</button></footer>
        </> : <div className={`nsa-result ${quiz.passed ? "passed" : "failed"}`}>
          {quiz.passed ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
          <small>{quiz.passed ? "ASSESSMENT PASSED" : "ASSESSMENT REQUIRES REVIEW"}</small>
          <h2>{quiz.score}%</h2>
          <p>Passing requirement: {quiz.assessment.passingScore}%</p>
          <div>{quiz.passed ? "Training is complete. Northstar updated the training record and readiness status." : "Training remains incomplete. Review the current instruction again before another attempt."}</div>
          <button className="primary" onClick={() => setQuiz(null)}>{quiz.passed ? "Return to Training" : "Review Instruction Again"}</button>
        </div>}
      </section></div>}

      <style>{`
        .nsa-card{margin-top:14px;padding:18px;border:1px solid #d4dfe8;border-radius:11px;background:#fff;box-shadow:0 5px 18px rgba(20,48,72,.05);color:#17364f}.nsa-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:13px;border-bottom:1px solid #e4ebf0}.nsa-heading small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.13em}.nsa-heading h2{margin:4px 0 4px;font-size:15px}.nsa-heading p{margin:0;color:#708496;font-size:8px;line-height:1.5}.nsa-heading>svg{color:#0a66b7}.nsa-config{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.nsa-config label{display:flex;flex-direction:column;gap:5px;color:#506b80;font-size:8px;font-weight:850}.nsa-config input[type=number]{min-height:34px;padding:0 9px;border:1px solid #cfdbe4;border-radius:7px}.nsa-config .nsa-toggle{justify-content:center;padding:10px;border:1px solid #d9e3ea;border-radius:8px;background:#f8fafc}.nsa-toggle{flex-direction:row!important;align-items:center!important}.nsa-actions{display:flex;align-items:center;gap:9px;margin-top:13px}.nsa-actions button,.nsa-approve button,.nsa-table-wrap button,.nsa-modal button{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 10px;border:1px solid #c9d7e1;border-radius:7px;background:#fff;color:#315c79;font-size:8px;font-weight:900}.nsa-actions button.primary,.nsa-approve button.primary,.nsa-table-wrap button.primary,.nsa-modal button.primary{border-color:#0a66b7;background:#0a66b7;color:#fff}.nsa-actions button:disabled,.nsa-modal button:disabled{opacity:.45}.nsa-badge{display:inline-flex;padding:5px 7px;border-radius:5px;font-size:7px;font-weight:950}.nsa-badge.good{color:#246b50;background:#e7f6ef}.nsa-badge.warn{color:#815d16;background:#fff0cf}.nsa-badge.bad{color:#9a2632;background:#fde8eb}.nsa-badge.blue{color:#245f89;background:#eaf3fa}.nsa-review{margin-top:14px;border-top:1px solid #e5ebef}.nsa-review-head,.nsa-approve,.nsa-sync{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0}.nsa-review-head strong,.nsa-review-head small,.nsa-approve strong,.nsa-approve small,.nsa-sync strong,.nsa-sync small{display:block}.nsa-review-head small,.nsa-approve small,.nsa-sync small{margin-top:3px;color:#75899a;font-size:8px}.nsa-review article{padding:12px 0;border-top:1px solid #edf1f4}.nsa-qtop{display:flex;justify-content:space-between;align-items:center}.nsa-qtop span{font-size:7px;font-weight:950;color:#55738a;text-transform:uppercase}.nsa-qtop button{border:0;background:transparent;color:#9a3340}.nsa-review textarea{width:100%;min-height:62px;margin-top:7px;padding:9px;border:1px solid #d1dce5;border-radius:7px;font:inherit;font-size:9px}.nsa-choices{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:7px}.nsa-choices label{display:grid;grid-template-columns:16px 1fr;gap:6px;align-items:center}.nsa-choices input[type=text],.nsa-choices input:not([type]){width:100%;min-height:31px;padding:0 8px;border:1px solid #d7e1e8;border-radius:6px;font-size:8px}.nsa-reference{display:block;margin-top:7px;color:#748a9c}.nsa-approve{border-top:1px solid #dfe7ed}.nsa-approve>div,.nsa-sync{display:flex;align-items:center;justify-content:flex-start}.nsa-approve svg,.nsa-sync svg{color:#26956b}.nsa-table-wrap{overflow:auto;margin-top:13px}.nsa-table-wrap table{width:100%;border-collapse:collapse;font-size:8px}.nsa-table-wrap th{padding:8px;text-align:left;color:#718597;background:#f3f6f8;font-size:7px;text-transform:uppercase}.nsa-table-wrap td{padding:10px 8px;border-bottom:1px solid #e7edf1}.nsa-table-wrap td strong,.nsa-table-wrap td small{display:block}.nsa-table-wrap td small{margin-top:3px;color:#7a8e9d}.nsa-complete{display:flex;align-items:center;gap:5px;color:#267151;font-weight:900}.nsa-muted{color:#8596a3}.nsa-sync{margin-top:13px;padding:11px;border:1px solid #cfe4d9;border-radius:8px;background:#f2faf6}.nsa-notice{position:fixed;z-index:9000;right:22px;top:78px;display:flex;align-items:center;gap:7px;max-width:420px;padding:10px 12px;border:1px solid #b9d5e8;border-radius:8px;background:#eef7fd;color:#245e85;font-size:9px;font-weight:850;box-shadow:0 8px 24px rgba(20,48,72,.12)}.nsa-modal-backdrop{position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:28px;background:rgba(8,24,38,.66)}.nsa-modal{width:min(900px,96vw);max-height:90vh;overflow:auto;border-radius:12px;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.28)}.nsa-modal>header{position:sticky;top:0;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:15px 18px;border-bottom:1px solid #dce5eb;background:#fff}.nsa-modal header small{color:#0a66b7;font-size:7px;font-weight:950;letter-spacing:.12em}.nsa-modal header h2{margin:3px 0;font-size:15px}.nsa-modal header p{margin:0;color:#748899;font-size:8px}.nsa-quiz-list{padding:16px 18px}.nsa-quiz-list article{padding:13px 0;border-bottom:1px solid #e8edf1}.nsa-quiz-list article>strong{display:block;font-size:10px}.nsa-quiz-list label{display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border:1px solid #dce5eb;border-radius:7px;color:#48677f;font-size:9px}.nsa-modal footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-top:1px solid #dce5eb;background:#fff;font-size:8px}.nsa-result{padding:48px;text-align:center}.nsa-result svg{color:#bc3948}.nsa-result.passed svg{color:#219268}.nsa-result small{display:block;margin-top:10px;color:#55748b;font-weight:950;letter-spacing:.12em}.nsa-result h2{margin:8px 0 0;font-size:42px}.nsa-result p{margin:4px 0 12px;color:#748899}.nsa-result>div{max-width:570px;margin:0 auto 18px;color:#49677d;font-size:10px;line-height:1.5}@media(max-width:1100px){.nsa-config{grid-template-columns:repeat(2,1fr)}.nsa-choices{grid-template-columns:1fr}}@media(max-width:650px){.nsa-config{grid-template-columns:1fr}.nsa-modal-backdrop{padding:8px}.nsa-result{padding:28px 18px}}
      `}</style>
    </>,
    portalTarget,
  );
}
