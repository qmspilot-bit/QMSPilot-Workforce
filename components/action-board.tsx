"use client";

import { Bot, CheckCircle2, Clock3, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PilotAnalysis } from "@/lib/types";

type ActionStatus = "proposed" | "approved" | "in-progress" | "blocked" | "done";
type DecisionStatus = "pending" | "approved" | "deferred";

type BoardItem = {
  status: ActionStatus;
  owner: string;
  dueDate: string;
  note: string;
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

const actionStatuses: Array<{ value: ActionStatus; label: string }> = [
  { value: "proposed", label: "Proposed" },
  { value: "approved", label: "Approved" },
  { value: "in-progress", label: "In progress" },
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
  return <span className={"workflow-status workflow-status-" + status}>{status.replace("-", " ")}</span>;
}

export function ActionBoard({ analysis }: { analysis: PilotAnalysis }) {
  const storageKey = "qmspilot:workboard:" + analysis.generatedAt;
  const defaultBoard = useMemo(() => makeDefaultBoard(analysis), [analysis]);
  const defaultDecisions = useMemo(() => makeDefaultDecisions(analysis), [analysis]);
  const [board, setBoard] = useState<BoardState>(defaultBoard);
  const [decisions, setDecisions] = useState<DecisionState>(defaultDecisions);
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    setReady(false);
    setBoard(defaultBoard);
    setDecisions(defaultDecisions);

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredWorkboard;
        if (parsed.actions) setBoard({ ...defaultBoard, ...parsed.actions });
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

  const counts = analysis.actions.reduce(
    (summary, action) => {
      const status = board[action.id]?.status ?? "proposed";
      if (status === "proposed") summary.proposed += 1;
      if (status === "approved" || status === "in-progress") summary.active += 1;
      if (status === "blocked") summary.blocked += 1;
      if (status === "done") summary.done += 1;
      return summary;
    },
    { proposed: 0, active: 0, blocked: 0, done: 0 },
  );

  return (
    <>
      <section className="panel action-board-panel" id="action-board">
        <div className="section-heading action-board-heading">
          <div>
            <p className="eyebrow">02 / Action board</p>
            <h3>Approve the work. Track the outcome.</h3>
          </div>
          <div className="local-save-note">
            <Save size={15} />
            <span>
              <strong>{savedAt ? "Saved at " + savedAt : "Saved automatically"}</strong>
              This first version stays in this browser.
            </span>
          </div>
        </div>

        <div className="board-summary" aria-label="Action status summary">
          <div><span>Awaiting approval</span><strong>{counts.proposed}</strong></div>
          <div><span>Approved or active</span><strong>{counts.active}</strong></div>
          <div><span>Blocked</span><strong>{counts.blocked}</strong></div>
          <div><span>Complete</span><strong>{counts.done}</strong></div>
        </div>

        <div className="approval-reminder">
          <ShieldCheck size={17} />
          <span><strong>You control every assignment.</strong> Changing a status records your decision; Pilot does not contact anyone or take external action.</span>
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
                        onChange={(event) => updateAction(action.id, { status: event.target.value as ActionStatus })}
                      >
                        {actionStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                      <StatusPill status={item.status} />
                    </td>
                    <td><span className="agent-badge"><Bot size={14} />{action.recommendedAgent}</span></td>
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
