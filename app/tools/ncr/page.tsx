"use client";

import { ArrowLeft, ExternalLink, FileWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NCR_URL = process.env.NEXT_PUBLIC_NCR_APP_URL ||
  "https://qmspilot-bit.github.io/QMSPilot-NCR-Microtool-Northstar/";

export default function NcrToolPage() {
  const [connected, setConnected] = useState(false);
  const context = useMemo(() => ({
    type: "QMSPILOT_CONTEXT",
    tenantId: "northstar-demo",
    site: "QMSPilot Design Partner",
    user: { name: "Northstar User" },
    permissions: ["ncr.read", "ncr.create", "ncr.update", "ncr.submit"],
  }), []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "QMSPILOT_MICROTOOL_READY") {
        setConnected(true);
        const frame = document.getElementById("ncrNorthstarFrame") as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage(context, "*");
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [context]);

  function sendContext() {
    const frame = document.getElementById("ncrNorthstarFrame") as HTMLIFrameElement | null;
    frame?.contentWindow?.postMessage(context, "*");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", background: "#06111f" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", color: "white", borderBottom: "1px solid #203751", background: "#0b1728" }}>
        <a href="/" aria-label="Back to Mission Control" style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #31506f", borderRadius: 10, color: "white", background: "#132a45" }}><ArrowLeft size={18} /></a>
        <FileWarning size={21} />
        <div style={{ marginRight: "auto" }}>
          <small style={{ display: "block", color: "#8fb4d4", fontSize: 9, letterSpacing: ".13em", textTransform: "uppercase" }}>Northstar Production Application</small>
          <strong>Nonconformance Report</strong>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 10px", border: "1px solid #31506f", borderRadius: 999, color: "#b9cce0", fontSize: 9, fontWeight: 800 }}>
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#2bd576" : "#ffbf47" }} />
          {connected ? "Connected" : "Connecting"}
        </span>
        <a href={NCR_URL} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, padding: "0 12px", borderRadius: 10, color: "white", background: "#1f67c8", textDecoration: "none", fontSize: 10, fontWeight: 850 }}>Open separately <ExternalLink size={14} /></a>
      </header>
      <iframe
        id="ncrNorthstarFrame"
        src={NCR_URL}
        title="QMSPilot NCR Microtool"
        onLoad={sendContext}
        allow="camera; clipboard-write"
        style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 64px)", border: 0, background: "#06111f" }}
      />
    </main>
  );
}
