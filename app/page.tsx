"use client";

import Image from "next/image";
import {
  AlertTriangle, ArrowRight, Bot, BrainCircuit, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock3, Download, FileText, Gauge, Menu, PanelLeftClose,
  Printer, RefreshCw, ShieldCheck, Sparkles, Target, UploadCloud, Users, X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PilotAnalysis, Priority, Severity } from "@/lib/types";
import { ActionBoard } from "@/components/action-board";
import { CloudAccount } from "@/components/cloud-workspace";
import { DigitalToolbox } from "@/components/digital-toolbox";

const sampleSource = `Internal audit observations\n\n1. Released manufacturing drawings are stored on a shared drive, but the documented process still identifies Lotus Notes as the controlled source.\n2. Preventive maintenance evidence was not available for the Höfler Rapid 1500 and 2600.\n3. Seven observations were discussed in a planning meeting, but a single action register with owners, due dates, and effectiveness checks has not yet been issued.\n4. Leadership agreed to meet every two weeks to drive improvement.\n5. The certification audit target is March 2027.`;

const severityRank: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function Pill({ value }: { value: Severity | Priority }) {
  return <span className={`pill pill-${value}`}>{value}</span>;
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
  const highRisks = analysis.keyFindings.filter((f) => severityRank[f.severity] >= 3).length;
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
        <div className="metric"><AlertTriangle /><span>Material findings</span><strong>{analysis.keyFindings.length}</strong></div>
        <div className="metric"><ClipboardCheck /><span>Recommended actions</span><strong>{analysis.actions.length}</strong></div>
        <div className="metric"><ShieldCheck /><span>High-risk items</span><strong>{highRisks}</strong></div>
        <div className="metric"><BrainCircuit /><span>Decisions needed</span><strong>{analysis.decisionsNeeded.length}</strong></div>
      </div>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">01 / Findings</p><h3>What requires attention</h3></div><span>{analysis.sourceOverview}</span></div>
        <div className="findings-grid">
          {[...analysis.keyFindings].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]).map((finding) => (
            <article className="finding-card" key={finding.id}>
              <div className="card-top"><span className="finding-id">{finding.id}</span><Pill value={finding.severity} /></div>
              <p className="category">{finding.category}</p>
              <h4>{finding.title}</h4>
              <dl>
                <div><dt>Evidence</dt><dd>{finding.evidence}</dd></div>
                <div><dt>Operational impact</dt><dd>{finding.impact}</dd></div>
                <div className="recommendation"><dt>Recommended response</dt><dd>{finding.recommendation}</dd></div>
              </dl>
            </article>
          ))}
        </div>
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
  const [file, setFile] = useState<File | null>(null);
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

  const canAnalyze = useMemo(() => Boolean(sourceText.trim() || file), [sourceText, file]);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!canAnalyze || loading) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.set("title", title);
    form.set("context", context);
    form.set("sourceText", sourceText);
    if (file) form.set("file", file);
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
    setAnalysis(null); setTitle(""); setContext(""); setSourceText(""); setFile(null); setError("");
    window.localStorage.removeItem("qmspilot:last-analysis");
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
          <a href="#toolbox"><ClipboardCheck />Digital toolbox</a>
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
            <div><p className="eyebrow">AI Chief of Staff · MVP 01</p><h1>Good work starts with a clear mission.</h1><p>Give Pilot the evidence. Get back the gaps, risks, decisions, owners, due dates, and executive action brief.</p></div>
            <div className="approval-note"><ShieldCheck /><div><strong>You remain the decision-maker.</strong><span>Pilot prepares and recommends. Nothing external happens without approval.</span></div></div>
          </section>

          <form className="mission-card" onSubmit={analyze}>
            <div className="mission-head"><div className="pilot-mark"><Sparkles /></div><div><p className="eyebrow">New assignment</p><h2>What should Pilot review?</h2></div><button type="button" className="sample-button" onClick={() => { setTitle("ISO Internal Audit Follow-up"); setContext("Prepare a practical action plan for leadership and the biweekly improvement cadence."); setSourceText(sampleSource); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>Load example</button></div>
            <div className="form-grid">
              <label><span>Assignment title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Internal audit follow-up" maxLength={120} /></label>
              <label><span>Business context</span><input value={context} onChange={(e) => setContext(e.target.value)} placeholder="What outcome do you need?" maxLength={400} /></label>
            </div>
            <label className="source-label"><span>Source information</span><textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder="Paste audit notes, customer requirements, meeting notes, a process description, or an improvement opportunity..." rows={8} /></label>
            <div className="mission-footer">
              <label className="upload-button"><UploadCloud /><span>{file ? file.name : "Attach a document"}</span><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.tsv,.txt,.md,.json,.html,.xml,.rtf,.odt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
              {file && <button type="button" className="remove-file" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}><X />Remove</button>}
              <span className="file-note">PDF, Office, spreadsheet, or text · 15 MB max</span>
              <button className="analyze-button" disabled={!canAnalyze || loading} type="submit">{loading ? <><RefreshCw className="spin" />Pilot is reviewing...</> : <><BrainCircuit />Analyze and build action brief<ArrowRight /></>}</button>
            </div>
            {error && <div className="error-message"><AlertTriangle />{error}</div>}
          </form>

          {analysis ? <Results analysis={analysis} /> : <EmptyState />}
          <DigitalToolbox />
        </div>
      </main>
    </div>
  );
}
