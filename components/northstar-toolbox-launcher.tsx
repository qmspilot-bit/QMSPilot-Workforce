"use client";

import { Boxes, ClipboardCheck, ExternalLink, FileWarning, GraduationCap, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const CAPA_URL = process.env.NEXT_PUBLIC_CAPA_APP_URL ||
  "https://qmspilot-bit.github.io/QMSPilot-Corrective-Action-CAPA-Northstar/";

export function NorthstarToolboxLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openFromUrl = new URLSearchParams(window.location.search).get("toolbox") === "open";
    if (openFromUrl) setOpen(true);

    const openToolbox = () => setOpen(true);
    window.addEventListener("qmspilot:open-toolbox", openToolbox);
    return () => window.removeEventListener("qmspilot:open-toolbox", openToolbox);
  }, []);

  function closeToolbox() {
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.get("toolbox") === "open") {
      url.searchParams.delete("toolbox");
      const query = url.searchParams.toString();
      window.history.replaceState({}, "", `${url.pathname}${query ? `?${query}` : ""}${url.hash}`);
    }
  }

  const connectedCard = (title: string, description: string, href: string, icon: ReactNode, actionLabel: string) => (
    <article style={{ padding: 20, border: "1px solid #9bc8f1", borderRadius: 18, background: "linear-gradient(160deg,#fff,#edf7ff)", boxShadow: "0 14px 30px rgba(25,107,181,.12)" }}>
      <div style={{ display: "inline-flex", padding: "6px 9px", borderRadius: 999, color: "#28614c", background: "#edf9f3", fontSize: 10, fontWeight: 850 }}>CONNECTED</div>
      <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", marginTop: 16, borderRadius: 12, color: "#1f67c8", background: "#e8f3ff" }}>{icon}</div>
      <h3 style={{ margin: "14px 0 8px", color: "#0e1b31", fontSize: 20 }}>{title}</h3>
      <p style={{ color: "#53677d", fontSize: 12, lineHeight: 1.55 }}>{description}</p>
      <a href={href} style={{ marginTop: 18, minHeight: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 11, color: "white", background: "linear-gradient(135deg,#0d315c,#1f67c8)", fontSize: 12, fontWeight: 850, textDecoration: "none" }}>
        {actionLabel} <ExternalLink size={15}/>
      </a>
    </article>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Northstar Digital Toolbox"
        style={{
          position: "fixed", top: 70, right: 20, zIndex: 180, display: "inline-flex",
          alignItems: "center", gap: 9, minHeight: 44, padding: "0 16px",
          border: "1px solid #8fbbe9", borderRadius: 999, color: "white",
          background: "linear-gradient(135deg,#0d315c,#1f67c8)",
          boxShadow: "0 14px 36px rgba(17,74,137,.28)", fontSize: 12,
          fontWeight: 850, cursor: "pointer",
        }}
      >
        <Boxes size={17} />
        Digital Toolbox
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Northstar Digital Toolbox" style={{ position: "fixed", inset: 0, zIndex: 500, display: "grid", placeItems: "center", padding: 18, background: "rgba(4,17,31,.82)", backdropFilter: "blur(10px)" }}>
          <div style={{ width: "min(1220px,100%)", maxHeight: "92vh", overflow: "auto", border: "1px solid #365b7b", borderRadius: 22, background: "#f7fbff", boxShadow: "0 35px 100px rgba(0,0,0,.5)" }}>
            <header style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", color: "white", background: "linear-gradient(135deg,#071a31,#123f73)" }}>
              <Boxes size={22} />
              <div style={{ marginRight: "auto" }}>
                <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#9ec8ee" }}>QMSPilot Northstar</div>
                <strong style={{ fontSize: 18 }}>Digital Toolbox</strong>
              </div>
              <button type="button" onClick={closeToolbox} aria-label="Close Digital Toolbox" style={{width:38,height:38,display:"grid",placeItems:"center",border:"1px solid #426587",borderRadius:10,color:"white",background:"#102d4d",cursor:"pointer"}}><X size={18}/></button>
            </header>

            <div style={{ padding: 24 }}>
              <p style={{ margin: "0 0 20px", color: "#53677d", lineHeight: 1.6 }}>
                Launch controlled quality and operations applications directly from the Workforce. Northstar carries company context, preserves human authority, and converts completed work into executive intelligence.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
                {connectedCard(
                  "Corrective Action & CAPA",
                  "Contain, investigate, assign accountable actions, verify effectiveness, and submit the controlled CAPA record to Northstar.",
                  CAPA_URL,
                  <Boxes size={21} />,
                  "Open CAPA",
                )}
                {connectedCard(
                  "Nonconformance Report",
                  "Capture nonconforming output, containment, disposition, evidence, COPQ, corrective actions, and submit the controlled NCR record to Northstar.",
                  "/tools/ncr",
                  <FileWarning size={21} />,
                  "Open NCR",
                )}
                {connectedCard(
                  "Process Assurance",
                  "Run layered process audits, verify standards at the point of work, assign containment, and submit operating intelligence to Northstar.",
                  "/tools/process-assurance",
                  <ClipboardCheck size={21} />,
                  "Open Process Assurance",
                )}
                {connectedCard(
                  "Workforce Readiness",
                  "Control the skills matrix, qualification evidence, cross-training priorities, expiration risk, and critical-process coverage.",
                  "/tools/workforce-readiness",
                  <GraduationCap size={21} />,
                  "Open Workforce Readiness",
                )}

                {["Calibration, Supplier Quality & More"].map((title) => (
                  <article key={title} style={{ padding: 20, border: "1px solid #d7e2ec", borderRadius: 18, background: "white", opacity: .78 }}>
                    <div style={{ display: "inline-flex", padding: "6px 9px", borderRadius: 999, color: "#6a7887", background: "#eef2f5", fontSize: 10, fontWeight: 850 }}>ROADMAP</div>
                    <h3 style={{ margin: "16px 0 8px", color: "#0e1b31", fontSize: 18 }}>{title}</h3>
                    <p style={{ color: "#53677d", fontSize: 12, lineHeight: 1.55 }}>Additional Northstar production applications will appear here as they become available.</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
