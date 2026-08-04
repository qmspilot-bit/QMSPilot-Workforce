"use client";

import { useEffect } from "react";

const SUMMARY_KEY = "qmspilot:northstar:6s-summary";
const href = "/tools/6s-workplace-excellence";

const defaultSummary = {
  enterpriseScore: 81,
  safetyScore: 87,
  criticalSafety: 1,
  openRedTags: 21,
  areasAtTarget: 2,
  totalAreas: 6,
  recoveredSpace: 610,
  recoveredValue: 42750,
};

function readSummary() {
  try {
    return { ...defaultSummary, ...(JSON.parse(localStorage.getItem(SUMMARY_KEY) || "null") || {}) };
  } catch {
    return defaultSummary;
  }
}

function iconMarkup() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
}

function addNavigatorCard() {
  if (document.querySelector(`.navigator-shell a[href="${href}"]`)) return;
  const titles = Array.from(document.querySelectorAll<HTMLElement>(".navigator-shell .section-title h2"));
  const title = titles.find((node) => node.textContent?.trim() === "Smart Workspaces");
  const grid = title?.closest("section")?.querySelector<HTMLElement>(".card-grid");
  if (!grid) return;

  const card = document.createElement("article");
  card.className = "nav-card featured six-s-nav-card";
  card.innerHTML = `<div class="card-top"><span class="badge">NEW · READY</span><span class="card-icon">${iconMarkup()}</span></div><h3>6S Workplace Excellence</h3><p>Area ownership, red tags, visual controls, cleaning-as-inspection, safety gates, layered audits, sustainment, kaizen, and verified improvement value.</p><a href="${href}">Open 6S workspace <span aria-hidden="true">↗</span></a>`;
  grid.prepend(card);
}

function addToolboxTile() {
  if (window.location.pathname !== "/toolbox" || document.querySelector(`.workspace-grid a[href="${href}"]`)) return;
  const grid = document.querySelector<HTMLElement>(".workspace-grid");
  if (!grid) return;

  const tile = document.createElement("a");
  tile.href = href;
  tile.className = "tile featured new-workspace six-s-toolbox-tile";
  tile.innerHTML = `<div class="tile-top"><span>${iconMarkup()}</span><em>NEW · READY</em></div><h2>6S Workplace Excellence</h2><p>Implement and sustain Sort, Set in Order, Shine, Standardize, Sustain, and Safety with controlled ownership, audits, actions, standards, and improvement value.</p><div class="open">Open workspace <span aria-hidden="true">→</span></div>`;
  grid.prepend(tile);

  const headerCount = document.querySelector<HTMLElement>(".main > header > span");
  const sectionCount = document.querySelector<HTMLElement>(".section-head > span");
  if (headerCount?.textContent?.includes("connected operating environments")) headerCount.textContent = "9 connected operating environments";
  if (sectionCount?.textContent?.includes("connected workspaces")) sectionCount.textContent = "9 connected workspaces";
}

function addExecutiveIntelligence() {
  if (window.location.pathname !== "/executive-intelligence") return;
  const summary = readSummary();

  const metrics = document.querySelector<HTMLElement>(".ei-shell .metrics");
  if (metrics) {
    let metric = metrics.querySelector<HTMLElement>(".six-s-ei-metric");
    if (!metric) {
      metric = document.createElement("article");
      metric.className = "six-s-ei-metric";
      metrics.insertBefore(metric, metrics.children[2] || null);
    }
    metric.innerHTML = `<small>6S workplace excellence</small><strong>${summary.enterpriseScore}%</strong><span>${summary.criticalSafety} critical safety gate · ${summary.openRedTags} open red tags</span>`;
  }

  const grid = document.querySelector<HTMLElement>(".ei-shell .view-grid");
  if (grid) {
    let card = grid.querySelector<HTMLElement>(".six-s-ei-card");
    if (!card) {
      card = document.createElement("a");
      card.className = "view-card featured six-s-ei-card";
      card.setAttribute("href", href);
      grid.insertBefore(card, grid.children[1] || null);
    }
    card.innerHTML = `<div class="view-top"><span>${iconMarkup()}</span><div><strong>${summary.enterpriseScore}%</strong><small>${summary.areasAtTarget}/${summary.totalAreas} areas at target</small></div></div><h3>6S Workplace Excellence</h3><p>Area maturity, safety release gates, red-tag aging, visual controls, audit completion, repeat findings, sustainment, and verified space or value recovery.</p><b>Open operational source <span aria-hidden="true">→</span></b>`;
  }

  const sectionCount = Array.from(document.querySelectorAll<HTMLElement>(".ei-shell .section-head > span")).find((node) => node.textContent?.includes("connected views"));
  if (sectionCount) sectionCount.textContent = "7 connected views";
}

export function SixSPlatformSync() {
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        addNavigatorCard();
        addToolboxTile();
        addExecutiveIntelligence();
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("qmspilot:6s-summary-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("qmspilot:6s-summary-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <style jsx global>{`
      .six-s-nav-card,
      .six-s-toolbox-tile,
      .six-s-ei-card {
        border-color: #2aa56e !important;
        background: linear-gradient(180deg, #f2fbf7, #ffffff) !important;
        box-shadow: 0 14px 34px rgba(28, 139, 91, 0.13) !important;
      }
      .six-s-nav-card .card-icon,
      .six-s-toolbox-tile .tile-top > span,
      .six-s-ei-card .view-top > span {
        color: #16845b !important;
        background: #e3f7ed !important;
      }
      .six-s-nav-card .badge,
      .six-s-toolbox-tile .tile-top em {
        color: #176747 !important;
        background: #e4f8ef !important;
      }
      .six-s-ei-metric {
        border-color: #9dd6bd !important;
        background: linear-gradient(180deg, #f2fbf7, #ffffff) !important;
      }
    `}</style>
  );
}
