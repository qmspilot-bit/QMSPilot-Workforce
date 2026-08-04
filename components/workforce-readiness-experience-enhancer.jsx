"use client";

import { ArrowRight, GraduationCap, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

const guidance = {
  Qualified: {
    title: "Authorized capability",
    copy: "This employee is qualified for independent work. Keep the supporting evidence, revision, and expiration date current.",
    action: "Review evidence and expiration",
  },
  Training: {
    title: "Training in progress",
    copy: "The employee has an open learning requirement and is not yet approved for independent work on this process.",
    action: "Open training assignments",
  },
  Expired: {
    title: "Qualification expired",
    copy: "Independent work should be restricted until the employee is revalidated against the current controlled instruction.",
    action: "Start revalidation",
  },
  Supervised: {
    title: "Qualified with supervision",
    copy: "The employee can perform the work only with defined oversight. A practical evaluation is the next controlled step.",
    action: "Open competency signoff",
  },
  "N/A": {
    title: "No role requirement",
    copy: "This process is not currently assigned to the employee's role. No training or authorization action is required.",
    action: "Review role coverage",
  },
};

function statusFromCode(code) {
  return ({ Q: "Qualified", T: "Training", E: "Expired", S: "Supervised", "—": "N/A" })[code] || "N/A";
}

export default function WorkforceReadinessExperienceEnhancer() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const decorated = new WeakSet();
    let frame = 0;

    const clearFocus = (table) => {
      table.querySelectorAll(".is-row-focus,.is-column-focus").forEach((node) => node.classList.remove("is-row-focus", "is-column-focus"));
    };

    const decorate = () => {
      const table = document.querySelector("table.wr-matrix");
      if (!table) return;
      const wrapper = table.closest(".wr-table");
      wrapper?.classList.add("wr-matrix-enhanced");
      const headers = Array.from(table.querySelectorAll("thead th"));
      const rows = Array.from(table.querySelectorAll("tbody tr"));

      rows.forEach((row, rowIndex) => {
        row.style.setProperty("--matrix-row-delay", `${rowIndex * 55}ms`);
        const identity = row.querySelector("td:first-child");
        const employee = identity?.querySelector("strong")?.textContent?.trim() || "Employee";
        const role = identity?.querySelector("small")?.textContent?.trim() || "Role";

        Array.from(row.querySelectorAll("td")).slice(1).forEach((cell, skillIndex) => {
          if (decorated.has(cell)) return;
          decorated.add(cell);
          const code = cell.textContent?.trim() || "—";
          const status = statusFromCode(code);
          const skill = headers[skillIndex + 1]?.textContent?.trim() || "Capability";
          cell.classList.add("wr-matrix-interactive-cell");
          cell.dataset.matrixStatus = status;
          cell.dataset.matrixColumn = String(skillIndex + 1);
          cell.tabIndex = 0;
          cell.setAttribute("role", "button");
          cell.setAttribute("aria-label", `${employee}, ${skill}: ${status}`);
          cell.style.setProperty("--matrix-delay", `${rowIndex * 55 + skillIndex * 28}ms`);

          const activate = () => {
            table.querySelectorAll(".is-selected-cell").forEach((node) => node.classList.remove("is-selected-cell"));
            cell.classList.add("is-selected-cell");
            setSelected({ employee, role, skill, status });
          };

          cell.addEventListener("click", activate);
          cell.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              activate();
            }
          });
          cell.addEventListener("mouseenter", () => {
            clearFocus(table);
            row.classList.add("is-row-focus");
            table.querySelectorAll(`th:nth-child(${skillIndex + 2}), td:nth-child(${skillIndex + 2})`).forEach((node) => node.classList.add("is-column-focus"));
          });
          cell.addEventListener("mouseleave", () => clearFocus(table));
        });
      });
    };

    const scheduleDecorate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(decorate);
    };

    scheduleDecorate();
    const observer = new MutationObserver(scheduleDecorate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const navigateTo = (label) => {
    const button = Array.from(document.querySelectorAll(".wr-sidebar nav button")).find((node) => node.textContent?.includes(label));
    button?.click();
    setSelected(null);
  };

  const selectedGuidance = selected ? guidance[selected.status] || guidance["N/A"] : null;

  return (
    <>
      {selected && selectedGuidance && (
        <div className="ns-matrix-backdrop" onClick={() => setSelected(null)}>
          <aside className="ns-matrix-drawer" onClick={(event) => event.stopPropagation()} aria-live="polite">
            <div className="ns-matrix-drawer-head">
              <div>
                <small>WORKFORCE READINESS DETAIL</small>
                <h2>{selected.employee}</h2>
                <p>{selected.role}</p>
              </div>
              <button aria-label="Close readiness detail" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div className={`ns-matrix-status status-${selected.status.toLowerCase().replace(/[^a-z]/g, "")}`}>
              <span>{selected.status === "Qualified" ? <ShieldCheck size={22} /> : <GraduationCap size={22} />}</span>
              <div><small>{selected.skill}</small><strong>{selectedGuidance.title}</strong></div>
            </div>

            <p className="ns-matrix-guidance">{selectedGuidance.copy}</p>

            <div className="ns-matrix-path">
              <div><span>01</span><strong>Controlled instruction</strong></div>
              <i>→</i>
              <div><span>02</span><strong>Training evidence</strong></div>
              <i>→</i>
              <div><span>03</span><strong>Authorization</strong></div>
            </div>

            <div className="ns-matrix-actions">
              {(selected.status === "Training" || selected.status === "Expired") && <button onClick={() => navigateTo("Training Assignments")}>{selectedGuidance.action} <ArrowRight size={15} /></button>}
              {selected.status === "Supervised" && <button onClick={() => navigateTo("Competency Signoff")}>{selectedGuidance.action} <ArrowRight size={15} /></button>}
              {(selected.status === "Qualified" || selected.status === "N/A") && <button onClick={() => navigateTo("Document Library")}>{selectedGuidance.action} <ArrowRight size={15} /></button>}
              <a href="/executive-intelligence">View executive rollup <ArrowRight size={15} /></a>
            </div>
          </aside>
        </div>
      )}

      <style jsx global>{`
        .wr-matrix-enhanced {
          position: relative;
          padding: 12px;
          border-color: #315778 !important;
          background:
            radial-gradient(circle at 92% 0%, rgba(69,207,255,.16), transparent 30%),
            linear-gradient(180deg, #07192d, #0a2744) !important;
          box-shadow: 0 24px 55px rgba(5,29,52,.25) !important;
        }

        .wr-matrix-enhanced::before {
          content: "LIVE CAPABILITY MAP";
          display: block;
          margin: 2px 4px 12px;
          color: #8ecbff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .wr-matrix-enhanced .wr-matrix {
          border-collapse: separate;
          border-spacing: 0 7px;
          color: #eaf4ff;
        }

        .wr-matrix-enhanced .wr-matrix thead th {
          position: sticky;
          top: 0;
          z-index: 4;
          border: 0;
          color: #a9c9e4;
          background: #0a223b;
          box-shadow: inset 0 -1px 0 #31526d;
        }

        .wr-matrix-enhanced .wr-matrix thead th:first-child {
          left: 0;
          z-index: 6;
          border-radius: 10px 0 0 10px;
        }

        .wr-matrix-enhanced .wr-matrix tbody tr {
          opacity: 0;
          animation: nsMatrixRowIn 420ms var(--ns-ease-emphasis, cubic-bezier(.16,1,.3,1)) var(--matrix-row-delay) forwards;
        }

        .wr-matrix-enhanced .wr-matrix td {
          border-top: 1px solid rgba(92,133,169,.28);
          border-bottom: 1px solid rgba(92,133,169,.28);
          background: rgba(10,34,59,.82);
          transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .wr-matrix-enhanced .wr-matrix td:first-child {
          left: 0;
          z-index: 3;
          min-width: 190px;
          border-left: 1px solid rgba(92,133,169,.28);
          border-radius: 12px 0 0 12px;
          color: #f5f9fd;
          background: #0b2845;
          box-shadow: 8px 0 18px rgba(3,19,34,.18);
        }

        .wr-matrix-enhanced .wr-matrix td:last-child {
          border-right: 1px solid rgba(92,133,169,.28);
          border-radius: 0 12px 12px 0;
        }

        .wr-matrix-enhanced .wr-matrix td:first-child small {
          color: #8fa9bf;
        }

        .wr-matrix-interactive-cell {
          position: relative;
          cursor: pointer;
        }

        .wr-matrix-interactive-cell .wr-cell {
          position: relative;
          width: 38px;
          height: 38px;
          border: 1px solid currentColor;
          border-radius: 11px;
          box-shadow: 0 8px 20px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.28);
          opacity: 0;
          transform: translateY(8px) scale(.9);
          animation: nsMatrixCellIn 420ms var(--ns-ease-emphasis, cubic-bezier(.16,1,.3,1)) var(--matrix-delay) forwards;
          transition: transform 180ms var(--ns-ease-standard, ease), box-shadow 180ms ease, filter 180ms ease;
        }

        .wr-matrix-interactive-cell:hover .wr-cell,
        .wr-matrix-interactive-cell:focus-visible .wr-cell,
        .wr-matrix-interactive-cell.is-selected-cell .wr-cell {
          transform: translateY(-3px) scale(1.13);
          filter: saturate(1.12);
          box-shadow: 0 14px 30px rgba(0,0,0,.28), 0 0 0 4px rgba(80,181,255,.14);
        }

        .wr-matrix-enhanced .wr-matrix tr.is-row-focus td,
        .wr-matrix-enhanced .wr-matrix .is-column-focus {
          background: rgba(18,63,101,.95);
          border-color: rgba(99,185,255,.55);
        }

        .wr-matrix-interactive-cell[data-matrix-status="Qualified"] .wr-cell {
          color: #a8f0ca !important;
          background: rgba(33,151,94,.24) !important;
        }

        .wr-matrix-interactive-cell[data-matrix-status="Training"] .wr-cell {
          color: #ffe0a0 !important;
          background: rgba(190,125,17,.27) !important;
        }

        .wr-matrix-interactive-cell[data-matrix-status="Expired"] .wr-cell {
          color: #ffb2bc !important;
          background: rgba(185,54,72,.3) !important;
          animation: nsMatrixCellIn 420ms var(--ns-ease-emphasis, cubic-bezier(.16,1,.3,1)) var(--matrix-delay) forwards, nsExpiredPulse 2.4s ease-in-out 1s infinite;
        }

        .wr-matrix-interactive-cell[data-matrix-status="Supervised"] .wr-cell {
          color: #d2c7ff !important;
          background: rgba(116,91,207,.28) !important;
        }

        .wr-matrix-interactive-cell[data-matrix-status="N/A"] .wr-cell {
          color: #8ea3b8 !important;
          background: rgba(92,115,137,.2) !important;
          border-style: dashed;
        }

        .wr-matrix-enhanced + .wr-legend,
        .wr-matrix-enhanced ~ .wr-legend {
          padding: 11px 13px;
          border: 1px solid #d3e1ec;
          border-radius: 12px;
          background: #f8fbfd;
        }

        .ns-matrix-backdrop {
          position: fixed;
          inset: 0;
          z-index: 720;
          display: flex;
          justify-content: flex-end;
          padding: 18px;
          background: rgba(3,15,27,.62);
          backdrop-filter: blur(8px);
          animation: nsBackdropIn 180ms ease both;
        }

        .ns-matrix-drawer {
          width: min(430px, 96vw);
          height: 100%;
          overflow: auto;
          padding: 22px;
          border: 1px solid #365b79;
          border-radius: 22px;
          color: #eaf4ff;
          background: radial-gradient(circle at 100% 0%, rgba(69,207,255,.16), transparent 35%), linear-gradient(180deg,#07192d,#0a2744);
          box-shadow: 0 35px 90px rgba(0,0,0,.44);
          animation: nsDrawerIn 320ms var(--ns-ease-emphasis, cubic-bezier(.16,1,.3,1)) both;
        }

        .ns-matrix-drawer-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 17px;
          border-bottom: 1px solid #31526d;
        }

        .ns-matrix-drawer-head > div { margin-right: auto; }
        .ns-matrix-drawer-head small { color: #8ecbff; font-size: 8px; font-weight: 900; letter-spacing: .14em; }
        .ns-matrix-drawer-head h2 { margin: 7px 0 3px; }
        .ns-matrix-drawer-head p { margin: 0; color: #9eb6ca; font-size: 10px; }
        .ns-matrix-drawer-head button { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #426482; border-radius: 10px; color: #fff; background: #102f50; }

        .ns-matrix-status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 18px;
          padding: 15px;
          border: 1px solid #426482;
          border-radius: 15px;
          background: rgba(255,255,255,.05);
        }

        .ns-matrix-status > span { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 13px; color: #8ecbff; background: #0d3e68; }
        .ns-matrix-status small,.ns-matrix-status strong { display: block; }
        .ns-matrix-status small { color: #91aac0; font-size: 8px; text-transform: uppercase; }
        .ns-matrix-status strong { margin-top: 5px; }
        .ns-matrix-guidance { margin: 16px 0; color: #c5d7e6; font-size: 11px; line-height: 1.65; }

        .ns-matrix-path {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 8px;
          align-items: center;
          padding: 14px;
          border: 1px solid #31526d;
          border-radius: 15px;
          background: rgba(3,17,30,.38);
        }
        .ns-matrix-path div { min-width: 0; }
        .ns-matrix-path span,.ns-matrix-path strong { display: block; }
        .ns-matrix-path span { color: #55cfff; font-size: 9px; font-weight: 900; }
        .ns-matrix-path strong { margin-top: 4px; font-size: 9px; line-height: 1.35; }
        .ns-matrix-path i { color: #55cfff; font-style: normal; }

        .ns-matrix-actions { display: grid; gap: 9px; margin-top: 18px; }
        .ns-matrix-actions button,.ns-matrix-actions a { min-height: 42px; display: flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid #5fa8e8; border-radius: 11px; color: #fff; background: linear-gradient(135deg,#0d4a7c,#0a66ff); text-decoration: none; font-size: 10px; font-weight: 900; }
        .ns-matrix-actions a { color: #dceeff; background: transparent; }

        @keyframes nsMatrixRowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes nsMatrixCellIn { to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes nsExpiredPulse { 0%,100% { box-shadow: 0 8px 20px rgba(0,0,0,.18); } 50% { box-shadow: 0 8px 20px rgba(0,0,0,.18), 0 0 0 5px rgba(255,102,117,.12); } }
        @keyframes nsBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nsDrawerIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }

        @media(max-width: 700px) {
          .ns-matrix-backdrop { padding: 8px; }
          .ns-matrix-path { grid-template-columns: 1fr; }
          .ns-matrix-path i { transform: rotate(90deg); justify-self: center; }
        }
      `}</style>
    </>
  );
}
