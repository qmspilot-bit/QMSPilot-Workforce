"use client";

import {
  ArrowRight, Bot, CheckCircle2, Clipboard, Clock3, FileCheck2, RefreshCw, RotateCcw,
  Save, ShieldCheck, UserCheck, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PilotAnalysis, WorkProduct } from "@/lib/types";
import { useCloudWorkspace } from "@/components/cloud-workspace";

type ActionStatus = "proposed" | "approved" | "in-progress" | "ready-for-review" | "blocked" | "done";
type DecisionStatus = "pending" | "approved" | "deferred";

type BoardItem = {
  status: ActionStatus;
  owner: string;
  dueDate: string;
  note: string;
  workProduct: WorkProduct | null;
  workProductGeneratedAt: string;
  workProductReviewedAt: string;
  workProductReviewedBy: string;
};

type DecisionItem = {
  status: DecisionStatus;
  note: string;
};

type BoardState = Record<string, BoardItem>;
type DecisionState = Record<string, DecisionItem>;

type StoredWorkboard = {
  actions?: BoardState;
  decisions?: DecisionState;
};

const agentProfiles = {
  Pilot: {
    role: "Chief of Staff",
    focus: "Coordinate the work, reconcile inputs, and prepare a leadership-ready recommendation.",
  },
  Atlas: {
    role: "Quality Intelligence",
    focus: "Trace the evidence, test control effectiveness, and prepare an audit-ready quality response.",
  },
  Nexus: {
    role: "Growth Intelligence",
    focus: "Assess customer and commercial implications, then prepare a decision-ready growth response.",
  },
  Forge: {
    role: "Product Intelligence",
    focus: "Translate the requirement into a controlled product or process work package.",
  },
} as const;

const actionStatuses: Array<{ value: ActionStatus; label: string }> = [
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "in-progress", label: "In progress" },
  { value: "ready-for-review", label: "Ready for review" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const decisionStatuses: Array<{ value: DecisionStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "deferred", label: "Deferred" },
];

function makeDefaultBoard(analysis: PilotAnalysis): BoardState {
  return Object.fromEntries(
    analysis.actions.map((action) => [
      action.id,
      {
        status: "proposed",
        owner: action.owner,
        dueDate: action.dueDate,
        note: "",
        workProduct: null,
        workProductGeneratedAt: "",
        workProductReviewedAt: "",
        workProductReviewedBy: "",
      },
    ]),
  );
}

function makeDefaultDecisions(analysis: PilotAnalysis): DecisionState {
  return Object.fromEntries(
    analysis.decisionsNeeded.map((decision) => [
      decision,
      { status: "pending", note: "" },
    ]),
  );
}

function StatusPill({ status }: { status: ActionStatus | DecisionStatus }) {
  return <span className={"workflow-status workflow-status-" + status}>{status.replaceAll("-", " ")}</span>;
}

function handoffStateLabel(status: ActionStatus, agent: string) {
  if (status === "approved") return `Assignment approved for ${agent}`;
  if (status === "in-progress") return `${agent} preparation is in progress`;
  if (status === "ready-for-review") return `${agent}'s work product is ready for human review`;
  if (status === "blocked") return "Assignment blocked pending human input";
  if (status === "done") return "Work marked complete after human review";
  return "Awaiting human approval";
}

export function ActionBoard({ analysis }: { analysis: PilotAnalysis }) {
  const storageKey = "qmspilot:workboard:" + analysis.generatedAt;
  const defaultBoard = useMemo(() => makeDefaultBoard(analysis), [analysis]);
  const defaultDecisions = useMemo(() => makeDefaultDecisions(analysis), [analysis]);
  const [board, setBoard] = useState<BoardState>(defaultBoard);
  const [decisions, setDecisions] = useState<DecisionState>(defaultDecisions);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const cloud = useCloudWorkspace();
  const [cloudAnalysisId, setCloudAnalysisId] = useState<string | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [generatingActionId, setGeneratingActionId] = useState("");
  const [workProductError, setWorkProductError] = useState("");
  const handoffPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReady(false);
    setCloudAnalysisId(null);
    setCloudLoaded(false);
    setSelectedActionId("");
    setCopyState("idle");
    setGeneratingActionId("");
    setWorkProductError("");
    setBoard(defaultBoard);
    setDecisions(defaultDecisions);

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredWorkboard;
        if (parsed.actions) {
          setBoard(Object.fromEntries(
            Object.entries(defaultBoard).map(([id, item]) => [
              id,
              { ...item, ...(parsed.actions?.[id] ?? {}) },
            ]),
          ));
        }
        if (parsed.decisions) setDecisions({ ...defaultDecisions, ...parsed.decisions });
      }
    } catch {
      // Ignore stale browser data and begin with Pilot's recommendations.
    }

    setReady(true);
  }, [defaultBoard, defaultDecisions, storageKey]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ actions: board, decisions }));
    setSavedAt(
      new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()),
    );
  }, [board, decisions, ready, storageKey]);

  useEffect(() => {
    if (!ready || cloud.status !== "ready") {
      setCloudLoaded(false);
      return;
    }

    let active = true;

    async function connectWorkboard() {
      const analysisId = await cloud.ensureAnalysis(analysis);
      if (!active || !analysisId) return;

      setCloudAnalysisId(analysisId);
      const stored = await cloud.loadWorkboard(analysisId);
      if (!active) return;

      if (stored && Object.keys(stored.actions).length > 0) {
        setBoard((current) => ({ ...current, ...stored.actions }));
      }
      if (stored && Object.keys(stored.decisions).length > 0) {
        setDecisions((current) => ({ ...current, ...stored.decisions }));
      }

      setCloudLoaded(true);
    }

    connectWorkboard().catch((error) => {
      console.error("Pilot cloud load failed", error);
      if (active) setCloudLoaded(false);
    });

    return () => {
      active = false;
    };
  }, [analysis, cloud.ensureAnalysis, cloud.loadWorkboard, cloud.status, ready]);

  useEffect(() => {
    if (!ready || !cloudLoaded || !cloudAnalysisId || cloud.status !== "ready") return;

    const timeout = window.setTimeout(() => {
      cloud.saveWorkboard(cloudAnalysisId, analysis, board, decisions).catch((error) => {
        console.error("Pilot cloud save failed", error);
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    analysis, board, cloud.saveWorkboard, cloud.status, cloudAnalysisId,
    cloudLoaded, decisions, ready,
  ]);

  useEffect(() => {
    if (!selectedActionId) return;
    const frame = window.requestAnimationFrame(() => {
      handoffPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      handoffPanelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedActionId]);

  function updateAction(id: string, patch: Partial<BoardItem>) {
    setBoard((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  function updateDecision(decision: string, patch: Partial<DecisionItem>) {
    setDecisions((current) => ({
      ...current,
      [decision]: { ...current[decision], ...patch },
    }));
  }

  function requestStatusChange(id: string, status: ActionStatus) {
    const currentStatus = board[id]?.status ?? "proposed";
    if (currentStatus === "proposed" && (status === "approved" || status === "in-progress")) {
      setSelectedActionId(id);
      setCopyState("idle");
      setWorkProductError("");
      return;
    }
    if (status === "done" && currentStatus !== "done") {
      setSelectedActionId(id);
      setWorkProductError("Review the specialist work product and use Approve completion to close this action.");
      return;
    }
    updateAction(id, { status });
  }

  function approveHandoff(id: string) {
    const item = board[id] ?? defaultBoard[id];
    if (!item.owner.trim() || !item.dueDate) return;
    updateAction(id, { status: "approved" });
    setWorkProductError("");
  }

  async function prepareWorkProduct(id: string) {
    const action = analysis.actions.find((candidate) => candidate.id === id);
    const item = board[id] ?? defaultBoard[id];
    if (!action || !item.owner.trim() || !item.dueDate || generatingActionId) return;

    setGeneratingActionId(id);
    setWorkProductError("");
    updateAction(id, { status: "in-progress" });

    try {
      const token = await cloud.getAccessToken();
      if (!token) throw new Error("Sign in to Secure cloud before assigning specialist work.");

      const response = await fetch("/api/work-product", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          assignment: {
            owner: item.owner,
            dueDate: item.dueDate,
            progressNote: item.note,
          },
          analysis: {
            title: analysis.title,
            sourceOverview: analysis.sourceOverview,
            executiveSummary: analysis.executiveSummary,
            keyFindings: analysis.keyFindings,
            risks: analysis.risks,
            brief: analysis.brief,
          },
        }),
      });
      const payload = await response.json() as WorkProduct & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The specialist work product could not be prepared.");

      updateAction(id, {
        status: "ready-for-review",
        workProduct: payload,
        workProductGeneratedAt: new Date().toISOString(),
        workProductReviewedAt: "",
        workProductReviewedBy: "",
      });
    } catch (error) {
      updateAction(id, { status: "approved" });
      setWorkProductError(error instanceof Error ? error.message : "The specialist work product could not be prepared.");
    } finally {
      setGeneratingActionId("");
    }
  }

  function returnForRevision(id: string) {
    updateAction(id, {
      status: "approved",
      workProductReviewedAt: "",
      workProductReviewedBy: "",
    });
    setWorkProductError("");
  }

  function approveCompletion(id: string) {
    const item = board[id] ?? defaultBoard[id];
    if (item.status !== "ready-for-review" || !item.workProduct || !cloud.user) return;
    updateAction(id, {
      status: "done",
      workProductReviewedAt: new Date().toISOString(),
      workProductReviewedBy: cloud.user.id,
    });
    setWorkProductError("");
  }

  async function copyWorkPacket(id: string) {
    const action = analysis.actions.find((candidate) => candidate.id === id);
    if (!action) return;
    const item = board[id] ?? defaultBoard[id];
    const profile = agentProfiles[action.recommendedAgent];
    const packet = [
      `QMSPILOT SUPERVISED WORK PACKET · ${action.id}`,
      `Assignment: ${action.title}`,
      `Specialist: ${action.recommendedAgent} · ${profile.role}`,
      `Accountable owner: ${item.owner || "Not assigned"}`,
      `Due date: ${item.dueDate || "Not set"}`,
      `Priority: ${action.priority}`,
      `Mission context: ${analysis.sourceOverview}`,
      `Why this work matters: ${action.rationale}`,
      `Definition of done: ${action.verification}`,
      `Specialist brief: ${profile.focus}`,
      "Authority boundary: Prepare and recommend only. Do not contact people, alter source records, approve changes, or take external action without a separate human approval.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(packet);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const counts = analysis.actions.reduce(
    (summary, action) => {
      const status = board[action.id]?.status ?? "proposed";
      if (status === "proposed") summary.proposed += 1;
      if (status === "approved" || status === "in-progress") summary.active += 1;
      if (status === "ready-for-review") summary.ready += 1;
      if (status === "blocked") summary.blocked += 1;
      if (status === "done") summary.done += 1;
      return summary;
    },
    { proposed: 0, active: 0, ready: 0, blocked: 0, done: 0 },
  );

  const selectedAction = analysis.actions.find((action) => action.id === selectedActionId);
  const selectedItem = selectedAction
    ? board[selectedAction.id] ?? defaultBoard[selectedAction.id]
    : null;
  const handoffReady = Boolean(selectedItem?.owner.trim() && selectedItem?.dueDate);

  return (
    <>
      <section className="panel action-board-panel" id="action-board">
        <div className="section-heading action-board-heading">
          <div>
            <p className="eyebrow">02 / Action board</p>
            <h3>Approve the work. Track the outcome.</h3>
          </div>
          <div className={cloud.status === "ready" ? "local-save-note cloud-save-note" : "local-save-note"}>
            <Save size={15} />
            <span>
              <strong>
                {cloud.status === "ready"
                  ? cloud.lastSync
                    ? "Cloud saved at " + cloud.lastSync
                    : cloudLoaded
                      ? "Cloud protection active"
                      : "Connecting secure storage..."
                  : savedAt
                    ? "Saved in this browser at " + savedAt
                    : "Saved automatically"}
              </strong>
              {cloud.status === "ready"
                ? "Protected in " + (cloud.organizationName || "your QMSPilot workspace") + "."
                : "Sign in to Secure cloud to protect this work across devices."}
            </span>
          </div>
        </div>

        <div className="board-summary" aria-label="Action status summary">
          <div><span>Awaiting approval</span><strong>{counts.proposed}</strong></div>
          <div><span>Approved or active</span><strong>{counts.active}</strong></div>
          <div><span>Ready for review</span><strong>{counts.ready}</strong></div>
          <div><span>Blocked</span><strong>{counts.blocked}</strong></div>
          <div><span>Complete</span><strong>{counts.done}</strong></div>
        </div>

        <div className="approval-reminder">
          <ShieldCheck size={17} />
          <span><strong>You control every assignment.</strong> Approving a handoff records your decision and releases preparation work only. No one is contacted and no source record is changed.</span>
        </div>

        <div className="action-table-wrap">
          <table className="action-table workboard-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Agent</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Progress note</th>
              </tr>
            </thead>
            <tbody>
              {analysis.actions.map((action) => {
                const item = board[action.id] ?? defaultBoard[action.id];
                return (
                  <tr key={action.id}>
                    <td>
                      <span className="action-id">{action.id}</span>
                      <strong>{action.title}</strong>
                      <small>{action.verification}</small>
                    </td>
                    <td>
                      <input
                        className="board-input owner-input"
                        aria-label={"Owner for " + action.title}
                        value={item.owner}
                        onChange={(event) => updateAction(action.id, { owner: event.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="board-select"
                        aria-label={"Status for " + action.title}
                        value={item.status}
                        onChange={(event) => requestStatusChange(action.id, event.target.value as ActionStatus)}
                      >
                        {actionStatuses.map((status) => (
                          <option
                            key={status.value}
                            value={status.value}
                            disabled={
                              (status.value === "ready-for-review" && item.status !== "ready-for-review")
                              || (status.value === "done" && item.status !== "done")
                            }
                          >{status.label}</option>
                        ))}
                      </select>
                      <StatusPill status={item.status} />
                    </td>
                    <td>
                      <div className="agent-cell">
                        <span className="agent-badge"><Bot size={14} />{action.recommendedAgent}</span>
                        <button
                          className="handoff-link"
                          aria-expanded={selectedActionId === action.id}
                          aria-controls="action-handoff-panel"
                          onClick={() => {
                            setSelectedActionId(action.id);
                            setCopyState("idle");
                            setWorkProductError("");
                          }}
                        >
                          {item.status === "proposed"
                            ? "Review handoff"
                            : item.status === "ready-for-review"
                              ? "Review work product"
                              : item.status === "done"
                                ? "View accepted work"
                                : "Open work packet"}<ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                    <td><span className={"pill pill-" + action.priority}>{action.priority}</span></td>
                    <td>
                      <label className="date-editor">
                        <Clock3 size={14} />
                        <input
                          className="board-input"
                          type="date"
                          aria-label={"Due date for " + action.title}
                          value={item.dueDate}
                          onChange={(event) => updateAction(action.id, { dueDate: event.target.value })}
                        />
                      </label>
                    </td>
                    <td>
                      <input
                        className="board-input note-input"
                        aria-label={"Progress note for " + action.title}
                        placeholder="Add a short update"
                        value={item.note}
                        onChange={(event) => updateAction(action.id, { note: event.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedAction && selectedItem && (
          <section
            className="handoff-panel"
            id="action-handoff-panel"
            aria-live="polite"
            ref={handoffPanelRef}
            tabIndex={-1}
          >
            <div className="handoff-heading">
              <div>
                <p className="eyebrow">Supervised action handoff</p>
                <h4>{selectedAction.title}</h4>
                <span>{selectedAction.id} · Work packet prepared by Pilot</span>
              </div>
              <button
                className="handoff-close"
                aria-label="Close work packet"
                onClick={() => setSelectedActionId("")}
              ><X /></button>
            </div>

            <div className="handoff-layout">
              <div className="handoff-agent-card">
                <div className="handoff-agent-icon"><Bot /></div>
                <div>
                  <span>Recommended specialist</span>
                  <strong>{selectedAction.recommendedAgent}</strong>
                  <p>{agentProfiles[selectedAction.recommendedAgent].role}</p>
                </div>
                <StatusPill status={selectedItem.status} />
              </div>

              <dl className="handoff-packet-grid">
                <div><dt>Accountable owner</dt><dd>{selectedItem.owner || "Owner required"}</dd></div>
                <div><dt>Due date</dt><dd>{selectedItem.dueDate || "Due date required"}</dd></div>
                <div><dt>Why this work matters</dt><dd>{selectedAction.rationale}</dd></div>
                <div><dt>Definition of done</dt><dd>{selectedAction.verification}</dd></div>
                <div className="handoff-packet-wide"><dt>Specialist brief</dt><dd>{agentProfiles[selectedAction.recommendedAgent].focus}</dd></div>
              </dl>
            </div>

            <div className="handoff-guardrail">
              <ShieldCheck />
              <div>
                <strong>Human approval boundary</strong>
                <span>Prepare and recommend only. No messages, record changes, approvals, purchases, or external actions are authorized by this handoff.</span>
              </div>
            </div>

            {selectedItem.workProduct && (
              <article className={selectedItem.status === "done" ? "work-product work-product-accepted" : "work-product"}>
                <div className="work-product-heading">
                  <div className="work-product-icon"><FileCheck2 /></div>
                  <div>
                    <p className="eyebrow">Specialist work product</p>
                    <h5>{selectedItem.workProduct.title}</h5>
                    <span>
                      Prepared by {selectedItem.workProduct.preparedBy}
                      {selectedItem.workProductGeneratedAt
                        ? " · " + new Date(selectedItem.workProductGeneratedAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <span className={`work-product-confidence confidence-${selectedItem.workProduct.confidence}`}>
                    {selectedItem.workProduct.confidence} confidence
                  </span>
                </div>

                <div className="work-product-summary">
                  <strong>Executive summary</strong>
                  <p>{selectedItem.workProduct.executiveSummary}</p>
                </div>

                <div className="work-product-grid">
                  <section>
                    <strong>Work performed</strong>
                    <ul>{selectedItem.workProduct.workPerformed.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <strong>Evidence considered</strong>
                    <ul>{selectedItem.workProduct.evidenceConsidered.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>

                <section className="work-product-deliverable">
                  <strong>Prepared deliverable</strong>
                  <p>{selectedItem.workProduct.deliverable}</p>
                </section>

                <div className="work-product-grid">
                  <section>
                    <strong>Limitations and open evidence</strong>
                    <ul>{selectedItem.workProduct.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <strong>Closure evidence</strong>
                    <ul>{selectedItem.workProduct.closureEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <strong>Recommended next steps</strong>
                    <ul>{selectedItem.workProduct.recommendedNextSteps.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                </div>

                {selectedItem.status === "done" && (
                  <div className="work-product-acceptance">
                    <CheckCircle2 />
                    <span>
                      <strong>Completion approved by a human reviewer</strong>
                      {selectedItem.workProductReviewedAt
                        ? new Date(selectedItem.workProductReviewedAt).toLocaleString()
                        : "Recorded in the secure audit trail."}
                    </span>
                  </div>
                )}
              </article>
            )}

            {!handoffReady && selectedItem.status === "proposed" && (
              <p className="handoff-requirement">Add an accountable owner and due date before approving this assignment.</p>
            )}
            {cloud.status !== "ready" && selectedItem.status !== "proposed" && (
              <p className="handoff-requirement">Connect Secure cloud before asking a specialist to prepare work.</p>
            )}
            {workProductError && <p className="work-product-error">{workProductError}</p>}

            <div className="handoff-footer">
              <div className="handoff-audit-note">
                <UserCheck />
                <span>
                  <strong>{cloud.user?.email ?? "Current reviewer"}</strong>
                  {cloud.status === "ready" ? "Approval will be retained in the secure audit trail." : "Approval will be saved in this browser until Secure cloud is connected."}
                </span>
              </div>
              <div className="handoff-actions">
                <button className="handoff-secondary" onClick={() => copyWorkPacket(selectedAction.id)}>
                  <Clipboard />{copyState === "copied" ? "Packet copied" : copyState === "error" ? "Copy unavailable" : "Copy work packet"}
                </button>
                {selectedItem.status === "proposed" ? (
                  <button
                    className="handoff-primary"
                    disabled={!handoffReady}
                    onClick={() => approveHandoff(selectedAction.id)}
                  >
                    <UserCheck />Approve &amp; assign to {selectedAction.recommendedAgent}
                  </button>
                ) : selectedItem.status === "approved" ? (
                  <button
                    className="handoff-primary"
                    disabled={cloud.status !== "ready" || generatingActionId === selectedAction.id}
                    onClick={() => prepareWorkProduct(selectedAction.id)}
                  >
                    <Bot />
                    {selectedItem.workProduct
                      ? `Ask ${selectedAction.recommendedAgent} to revise work product`
                      : `Ask ${selectedAction.recommendedAgent} to prepare work product`}
                  </button>
                ) : selectedItem.status === "in-progress" ? (
                  <div className="handoff-state handoff-state-in-progress">
                    <RefreshCw className="spin" />{selectedAction.recommendedAgent} is preparing the draft
                  </div>
                ) : selectedItem.status === "ready-for-review" ? (
                  <>
                    <button className="handoff-secondary" onClick={() => returnForRevision(selectedAction.id)}>
                      <RotateCcw />Return for revision
                    </button>
                    <button className="handoff-primary" onClick={() => approveCompletion(selectedAction.id)}>
                      <UserCheck />Approve completion
                    </button>
                  </>
                ) : (
                  <div className={`handoff-state handoff-state-${selectedItem.status}`}>
                    <CheckCircle2 />{handoffStateLabel(selectedItem.status, selectedAction.recommendedAgent)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </section>

      <div className="two-column">
        <section className="panel compact-panel">
          <div className="section-heading">
            <div><p className="eyebrow">03 / Decisions</p><h3>Donald’s decision queue</h3></div>
          </div>
          <div className="interactive-decisions">
            {analysis.decisionsNeeded.map((decision, index) => {
              const item = decisions[decision] ?? defaultDecisions[decision];
              return (
                <article className="decision-card" key={decision}>
                  <div className="decision-number">{index + 1}</div>
                  <div className="decision-content">
                    <strong>{decision}</strong>
                    <div className="decision-controls">
                      <select
                        className="board-select"
                        aria-label={"Decision status: " + decision}
                        value={item.status}
                        onChange={(event) => updateDecision(decision, { status: event.target.value as DecisionStatus })}
                      >
                        {decisionStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                      <input
                        className="board-input"
                        aria-label={"Decision note: " + decision}
                        placeholder="Record your decision or rationale"
                        value={item.note}
                        onChange={(event) => updateDecision(decision, { note: event.target.value })}
                      />
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><div><p className="eyebrow">04 / Risk</p><h3>Watchlist</h3></div></div>
          <div className="risk-list">
            {analysis.risks.map((risk) => (
              <article key={risk.risk}>
                <span className={"pill pill-" + risk.level}>{risk.level}</span>
                <div><strong>{risk.risk}</strong><p>{risk.mitigation}</p></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
