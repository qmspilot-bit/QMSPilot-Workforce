"use client";

import { ExternalLink, FileWarning } from "lucide-react";

export function NcrToolLauncher() {
  return (
    <a
      href="/tools/ncr"
      target="_blank"
      rel="noreferrer"
      aria-label="Open the Northstar NCR Microtool"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 60,
        width: 290,
        display: "grid",
        gridTemplateColumns: "44px minmax(0,1fr) 20px",
        gap: 12,
        alignItems: "center",
        padding: "15px 16px",
        borderRadius: 16,
        border: "1px solid rgba(116,181,255,.42)",
        background: "linear-gradient(135deg,#071d35,#0b4f91)",
        color: "white",
        textDecoration: "none",
        boxShadow: "0 18px 42px rgba(7,29,53,.28)",
      }}
    >
      <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, background: "rgba(255,255,255,.12)" }}>
        <FileWarning size={23} />
      </span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 13 }}>NCR Microtool</strong>
        <small style={{ display: "block", marginTop: 4, color: "#b9d8f7", fontSize: 10, lineHeight: 1.35 }}>
          Open from the Northstar Digital Toolbox
        </small>
      </span>
      <ExternalLink size={18} />
    </a>
  );
}
