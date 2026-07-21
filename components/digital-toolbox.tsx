"use client";

import {
  ArrowUpRight, Boxes, ClipboardCheck, Construction, FileSearch, ShieldCheck, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const CAPA_URL = process.env.NEXT_PUBLIC_CAPA_APP_URL ||
  "https://qmspilot-bit.github.io/QMSPilot-Corrective-Action-CAPA-Northstar/";

type Tool = {
  id: string;
  title: string;
  description: string;
  status: "live" | "coming";
  icon: typeof ClipboardCheck;
};

const tools: Tool[] = [
  {
    id: "capa",
    title: "Corrective Action & CAPA",
    description: "Contain, investigate, assign, verify effectiveness, and submit the controlled record to Northstar.",
    status: "live",
    icon: ClipboardCheck,
  },
  {
    id: "ncr",
    title: "Nonconformance Report",
    description: "Capture defects, evidence, disposition, risk, and escalation into the shared quality record.",
    status: "coming",
    icon: FileSearch,
  },
  {
    id: "audit",
    title: "6S & Process Audits",
    description: "Run observable audits, assign corrective actions, and track sustained compliance.",
    status: "coming",
    icon: ShieldCheck,
  },
  {
    id: "more",
    title: "More Northstar Apps",
    description: "Training, calibration, shipping evidence, COPQ, warranty, layered audits, and more.",
    status: "coming",
    icon: Boxes,
  },
];

export function DigitalToolbox() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const context = useMemo(() => ({
    type: "QMSPILOT_CONTEXT",
    tenantId: "northstar-demo",
    site: "QMSPilot Design Partner",
    user: { name: "Northstar User" },
    permissions: ["capa.read", "capa.create", "capa.update", "capa.submit"],
  }), []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "QMSPILOT_MICROTOOL_READY") {
        setLoaded(true);
        const frame = document.getElementById("capaApplicationFrame") as HTMLIFrameElement | null;
        frame?.contentWindow?.postMessage(context, "*");
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [context]);

  function launchCapa() {
    setLoaded(false);
    setOpen(true);
  }

  function sendContext() {
    const frame = document.getElementById("capaApplicationFrame") as HTMLIFrameElement | null;
    frame?.contentWindow?.postMessage(context, "*");
    setLoaded(true);
  }

  return (
    <>
      <section className="toolbox-section" id="toolbox">
        <div className="toolbox-heading">
          <div>
            <p className="eyebrow">Northstar Digital Toolbox</p>
            <h2>Launch the work where the workforce can support it.</h2>
            <p>Each application opens inside Northstar with shared context, workforce routing, and a path back to the system of record.</p>
          </div>
          <span className="toolbox-state"><i />1 production application connected</span>
        </div>

        <div className="tool-grid">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const live = tool.status === "live";
            return (
              <article className={live ? "tool-tile tool-tile-live" : "tool-tile"} key={tool.id}>
                <div className="tool-icon"><Icon /></div>
                <div className="tool-tile-top">
                  <span>{live ? "Connected" : "Roadmap"}</span>
                  {live ? <i className="tool-live-dot" /> : <Construction size={15} />}
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button type="button" disabled={!live} onClick={live ? launchCapa : undefined}>
                  {live ? <>Open CAPA <ArrowUpRight /></> : "Coming to Northstar"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {open && (
        <div className="app-launcher" role="dialog" aria-modal="true" aria-label="Corrective Action and CAPA application">
          <div className="app-launcher-shell">
            <header>
              <div>
                <p>Northstar Application</p>
                <strong>Corrective Action & CAPA</strong>
              </div>
              <div className="launcher-status"><i className={loaded ? "ready" : ""} />{loaded ? "Connected" : "Connecting"}</div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close CAPA application"><X /></button>
            </header>
            <div className="launcher-frame-wrap">
              <iframe
                id="capaApplicationFrame"
                src={CAPA_URL}
                title="QMSPilot Corrective Action and CAPA"
                onLoad={sendContext}
                allow="camera; clipboard-write"
              />
            </div>
            <footer>
              <span>CAPA runs as a Northstar production application. Tenant, user, site, permissions, and submission events are passed through the host bridge.</span>
              <a href={CAPA_URL} target="_blank" rel="noreferrer">Open in a new tab <ArrowUpRight /></a>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
