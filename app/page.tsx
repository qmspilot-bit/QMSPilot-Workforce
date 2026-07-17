"use client";

import Image from "next/image";
import {
  AlertTriangle, Archive, ArrowRight, Bot, BrainCircuit, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, Download, FileText, Files, Gauge, Menu, PanelLeftClose,
  Printer, RefreshCw, ShieldCheck, Sparkles, Target, UploadCloud, Users, X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PilotAnalysis, Priority, Severity } from "@/lib/types";
import { ActionBoard } from "@/components/action-board";
import { CloudAccount } from "@/components/cloud-workspace";

const sampleSource = `Internal audit observations\n\n1. Released manufacturing drawings are stored on a shared drive, but the documented process still identifies Lotus Notes as the controlled source.\n2. Preventive maintenance evidence was not available for the Höfler Rapid 1500 and 2600.\n3. Seven observations were discussed in a planning meeting, but a single action register with owners, due dates, and effectiveness checks has not yet been issued.\n4. Leadership agreed to meet every two weeks to drive improvement.\n5. The certification audit target is March 2027.`;

const northstarMission = `Review Northstar Precision Systems' audit-readiness evidence.

Cross-reference every attached document. Identify what genuinely requires leadership attention, cite the exact file and record ID for each conclusion, and produce a prioritized action plan with accountable owners, calendar dates, and objective closure evidence.

Distinguish direct evidence from inference. Call out contradictions and uncertainty where the evidence is incomplete. Some records are intentionally complete and current, so do not invent nonconformities.`;

const severityRank: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function Pill({ value }: { value: Severity | Priority }) {
  return <span className={`pill pill-${value}`}>{value}</span>;
}

type PilotFinding = PilotAnalysis["keyFindings"][number];

function isAssuranceFinding(finding: PilotFinding) {
  const signal = `${finding.category} ${finding.title}`.toLowerCase();
  return ["positive assurance", "control working", "effective control", "clean control"]
    .some((phrase) => signal.includes(phrase));
}

function FindingCard({ finding, assurance = false }: { finding: PilotFinding; assurance?: boolean }) {
  return (
    <article className={`finding-card${assurance ? " finding-card-assurance" : ""}`}>
      <div className="card-top"><span className="finding-id">{finding.id}</span><Pill value={finding.severity} /></div>
      <p className="category">{finding.category}</p>
      <h4>{finding.title}</h4>
      <dl>
        <div><dt>Evidence</dt><dd>{finding.evidence}</dd></div>
        <div><dt>Operational impact</dt><dd>{finding.impact}</dd></div>
        <div className="recommendation"><dt>Recommended response</dt><dd>{finding.recommendation}</dd></div>
      </dl>
    </article>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <div className="empty-orbit"><BrainCircuit size={36} /></div>
      <p className="eyebrow">Pilot is standing by</p>
      <h2>Turn information into accountable action.</h2>
      <p>Paste a process, audit result, customer requirement, meeting note, or improvement idea. Pilot will identify the material gaps and prepare the executive action brief.</p>
      <div className="workflow-strip">
        {[
          [FileText, "Understand"],
          [AlertTriangle, "Find gaps"],
          [Target, "Prioritize"],
          [ClipboardCheck, "Assign"],
          [ShieldCheck, "Verify"],
        ].map(([Icon, label], index) => {
          const I = Icon as typeof FileText;
          return <div className="workflow-step" key={label as string}><I size={17} /><span>{label as string}</span>{index < 4 && <ChevronRight size={14} />}</div>;
        })}
      </div>
    </section>
  );
}

function Results({ analysis }: { analysis: PilotAnalysis }) {
  const sortedFindings = [...analysis.keyFindings].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const assuranceFindings = sortedFindings.filter(isAssuranceFinding);
  const attentionFindings = sortedFindings.filter((finding) => !isAssuranceFinding(finding));
  const highRisks = attentionFindings.filter((f) => severityRank[f.severity] >= 3).length;
  return (
    <div className="results" id="pilot-results">
      {analysis.mode === "demo" && (
        <div className="demo-banner"><Sparkles size={17} /><span><strong>Demo intelligence:</strong> add an OpenAI API key to activate document-specific analysis.</span></div>
      )}
      <section className="brief-hero">
        <div>
          <p className="eyebrow">Executive briefing</p>
          <h2>{analysis.title}</h2>
          <p>{analysis.executiveSummary}</p>
        </div>
        <div className="confidence-card">
          <Gauge size={22} />
          <span>Confidence</span>
          <strong>{analysis.confidence}</strong>
        </div>
      </section>

      <div className="metric-grid">
        <div className="metric"><AlertTriangle /><span>Findings reviewed</span><strong>{analysis.keyFindings.length}</strong></div>
        <div className="metric"><ClipboardCheck /><span>Recommended actions</span><strong>{analysis.actions.length}</strong></div>
        <div className="metric"><ShieldCheck /><span>High-risk items</span><strong>{highRisks}</strong></div>
        <div className="metric"><BrainCircuit /><span>Decisions needed</span><strong>{analysis.decisionsNeeded.length}</strong></div>
      </div>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">01 / Findings</p><h3>What Pilot found</h3></div><span>{analysis.sourceOverview}</span></div>
        <div className="findings-group">
          <div className="findings-group-heading">
            <span><AlertTriangle size={17} />Issues requiring attention</span>
            <strong>{attentionFindings.length}</strong>
          </div>
          <div className="findings-grid">
            {attentionFindings.map((finding) => <FindingCard finding={finding} key={finding.id} />)}
          </div>
        </div>
        {assuranceFindings.length > 0 && (
          <div className="findings-group findings-group-assurance">
            <div className="findings-group-heading findings-group-heading-assurance">
              <span><ShieldCheck size={17} />Controls working as intended</span>
              <strong>{assuranceFindings.length}</strong>
            </div>
            <div className="findings-grid findings-grid-assurance">
              {assuranceFindings.map((finding) => <FindingCard assurance finding={finding} key={finding.id} />)}
            </div>
          </div>
        )}
      </section>

      <ActionBoard analysis={analysis} />

      <section className="panel briefing-panel">
        <div className="section-heading"><div><p className="eyebrow">05 / Briefing rhythm</p><h3>What happens next</h3></div></div>
        <div className="brief-columns">
          <div><span>Today</span>{analysis.brief.today.map((x) => <p key={x}><CheckCircle2 size={15} />{x}</p>)}</div>
          <div><span>Next 7 days</span>{analysis.brief.next7Days.map((x) => <p key={x}><ArrowRight size={15} />{x}</p>)}</div>
          <div><span>Watchlist</span>{analysis.brief.watchlist.map((x) => <p key={x}><AlertTriangle size={15} />{x}</p>)}</div>
        </div>
        <p className="disclaimer">{analysis.disclaimer}</p>
      </section>
    </div>
  );
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<PilotAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("qmspilot:last-analysis");
    if (saved) {
      try { setAnalysis(JSON.parse(saved)); } catch { /* ignore stale local data */ }
    }
  }, []);

  const canAnalyze = useMemo(() => Boolean(sourceText.trim() || files.length), [sourceText, files]);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!canAnalyze || loading) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.set("title", title);
    form.set("context", context);
    form.set("sourceText", sourceText);
    files.forEach((file) => form.append("files", file));
    try {
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const responseText = await response.text();
      let payload: PilotAnalysis | { error?: string };
      try {
        payload = JSON.parse(responseText) as PilotAnalysis | { error?: string };
      } catch {
        throw new Error(
          response.ok
            ? "Pilot returned an unreadable response. Please try again."
            : "Pilot's analysis service was interrupted. Please try again.",
        );
      }
      if (!response.ok) {
        const message = "error" in payload ? payload.error : undefined;
        throw new Error(message || "Pilot could not complete the review.");
      }
      const completedAnalysis = payload as PilotAnalysis;
      setAnalysis(completedAnalysis);
      window.localStorage.setItem("qmspilot:last-analysis", JSON.stringify(completedAnalysis));
      window.setTimeout(() => document.getElementById("pilot-results")?.scrollIntoView({ behavior: "smooth" }), 120);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pilot could not complete the review.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAnalysis(null); setTitle(""); setContext(""); setSourceText(""); setFiles([]); setError("");
    window.localStorage.removeItem("qmspilot:last-analysis");
    if (fileRef.current) fileRef.current.value = "";
  }

  function loadNorthstar() {
    setTitle("Northstar audit-readiness review");
    setContext("Prepare a traceable, leadership-ready action brief for the 15 September 2026 surveillance audit.");
    setSourceText(northstarMission);
    setFiles([]);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    window.setTimeout(() => document.getElementById("northstar-assignment")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    if (fileRef.current) fileRef.current.value = "";
  }

  function download() {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `pilot-analysis-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand"><Image src="/qmspilot-logo.jpeg" alt="QMSPilot" width={190} height={62} priority /></div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><PanelLeftClose /></button>
        <div className="agent-card"><div className="agent-avatar"><Bot /></div><div><strong>Pilot</strong><span><i />Online · supervised</span></div></div>
        <nav>
          <a className="active" href="#mission"><BrainCircuit />Mission control</a>
          <a href="#pilot-results"><ClipboardCheck />Action board</a>
          <a href="#pilot-results"><FileText />Briefings</a>
          <a href="#team"><Users />AI workforce</a>
        </nav>
        <div className="team-mini" id="team">
          <p>Workforce</p>
          {[['P', 'Pilot', 'Chief of Staff', 'active'], ['A', 'Atlas', 'Quality intelligence', 'next'], ['N', 'Nexus', 'Growth intelligence', 'next'], ['F', 'Forge', 'Product intelligence', 'next']].map(([letter, name, role, status]) => (
            <div className="team-row" key={name}><span>{letter}</span><div><strong>{name}</strong><small>{role}</small></div><em className={status}>{status === 'active' ? 'Live' : 'Next'}</em></div>
          ))}
        </div>
        <div className="sidebar-footer"><ShieldCheck /><span><strong>Human approval gate</strong>External actions are blocked.</span></div>
      </aside>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><p>QMSPilot Workforce</p><strong>Mission Control</strong></div>
          <div className="top-actions">
            {analysis && <button className="quiet-button" onClick={download}><Download />Export</button>}
            {analysis && <button className="quiet-button" onClick={() => window.print()}><Printer />Print</button>}
            {analysis && <button className="quiet-button" onClick={reset}><RefreshCw />New review</button>}
            <CloudAccount />
            <span className="status-chip"><i />Pilot online</span>
          </div>
        </header>

        <div className="workspace" id="mission">
          <section className="page-intro">
            <div><p className="eyebrow">AI Chief of Staff · Pilot 1.1</p><h1>Good work starts with a clear mission.</h1><p>Give Pilot the evidence. Get back the gaps, risks, decisions, owners, due dates, and executive action brief.</p></div>
            <div className="approval-note"><ShieldCheck /><div><strong>You remain the decision-maker.</strong><span>Pilot prepares and recommends. Nothing external happens without approval.</span></div></div>
          </section>

          <section className="scenario-lab" aria-labelledby="northstar-title">
            <div className="scenario-copy">
              <span className="scenario-badge"><Sparkles />Synthetic validation lab</span>
              <p className="eyebrow">Northstar Precision Systems</p>
              <h2 id="northstar-title">Put Pilot through a real cross-document test.</h2>
              <p>A fictional manufacturer, mixed evidence formats, deliberate contradictions, and clean controls. Safe for product testing—no real customer data.</p>
              <div className="scenario-features">
                <span><Files /><strong>10 evidence files</strong>PDF, Word, and Excel</span>
                <span><Target /><strong>Cross-document reasoning</strong>Trace conflicts to source records</span>
                <span><ShieldCheck /><strong>False-positive controls</strong>Not every record is a problem</span>
              </div>
            </div>
            <div className="scenario-actions">
              <a className="scenario-secondary" href="/scenarios/northstar/northstar-evidence-pack.zip" download><Archive />Download evidence pack</a>
              <button className="scenario-primary" type="button" onClick={loadNorthstar}><Sparkles />Load Northstar mission<ArrowRight /></button>
              <small>Download, unzip, then attach evidence files 01–10 below.</small>
            </div>
          </section>

          <form className="mission-card" id="northstar-assignment" onSubmit={analyze}>
            <div className="mission-head"><div className="pilot-mark"><Sparkles /></div><div><p className="eyebrow">New assignment</p><h2>What should Pilot review?</h2></div><button type="button" className="sample-button" onClick={() => { setTitle("ISO Internal Audit Follow-up"); setContext("Prepare a practical action plan for leadership and the biweekly improvement cadence."); setSourceText(sampleSource); setFiles([]); if (fileRef.current) fileRef.current.value = ""; }}>Load simple example</button></div>
            <div className="form-grid">
              <label><span>Assignment title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Internal audit follow-up" maxLength={120} /></label>
              <label><span>Business context</span><input value={context} onChange={(e) => setContext(e.target.value)} placeholder="What outcome do you need?" maxLength={400} /></label>
            </div>
            <label className="source-label"><span>Source information</span><textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Paste audit notes, customer requirements, meeting notes, a process description, or an improvement opportunity..." rows={8} /></label>
            <div className="mission-footer">
              <label className="upload-button"><UploadCloud /><span>{files.length ? `${files.length} evidence file${files.length === 1 ? "" : "s"} attached` : "Attach evidence files"}</span><input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.txt,.md,.json,.html,.xml,.rtf,.odt" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
              {files.length > 0 && <button type="button" className="remove-file" onClick={() => { setFiles([]); if (fileRef.current) fileRef.current.value = ""; }}><X />Remove all</button>}
              <span className="file-note">Up to 12 files · 15 MB each · 30 MB total</span>
              <button className="analyze-button" disabled={!canAnalyze || loading} type="submit">{loading ? <><RefreshCw className="spin" />Pilot is reviewing...</> : <><BrainCircuit />Analyze and build action brief<ArrowRight /></>}</button>
            </div>
            {files.length > 0 && <div className="file-selection" aria-label="Attached evidence files">{files.map((attachedFile, index) => <span key={`${attachedFile.name}-${attachedFile.lastModified}`}><FileText /><span><strong>{attachedFile.name}</strong><small>{Math.max(1, Math.round(attachedFile.size / 1024))} KB</small></span><button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${attachedFile.name}`}><X /></button></span>)}</div>}
            {error && <div className="error-message"><AlertTriangle />{error}</div>}
          </form>

          {analysis ? <Results analysis={analysis} /> : <EmptyState />}
        </div>
      </main>
    </div>
  );
}
