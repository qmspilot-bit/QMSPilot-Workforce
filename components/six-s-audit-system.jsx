"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SixSGuidedAudit from "@/components/six-s-guided-audit";

const AUDIT_LABELS = [
  "start 6s audit",
  "start audit",
  "new 6s audit",
  "new audit",
  "run audit",
  "launch baseline",
  "begin 6s audit",
  "begin audit",
  "conduct 6s audit",
  "perform 6s audit",
];

function normalized(value = "") {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function controlLabel(control) {
  return normalized([
    control.textContent,
    control.getAttribute("title"),
    control.getAttribute("aria-label"),
    control.dataset?.sixSAuditEntry,
  ].filter(Boolean).join(" "));
}

function isSixSContext(control, label) {
  return Boolean(
    control.closest(".six-shell") ||
    window.location.pathname.includes("/tools/6s-workplace-excellence") ||
    label.includes("6s") ||
    control.dataset?.sixSAuditEntry
  );
}

function isAuditEntry(control) {
  if (!control || control.closest(".guided-6s-shell") || control.classList.contains("guided-6s-launcher")) return false;
  const label = controlLabel(control);
  if (!isSixSContext(control, label)) return false;
  return AUDIT_LABELS.some((candidate) => label.includes(candidate));
}

function areaFromControl(control) {
  const explicit = control.dataset?.sixSArea;
  if (explicit) return explicit.trim();

  const modalArea = control.closest(".area-modal")?.querySelector(".six-modal-head h2")?.textContent?.trim();
  if (modalArea) return modalArea;

  const row = control.closest("tr");
  const rowArea = row?.querySelector("td:first-child .area-identity strong, td:first-child strong")?.textContent?.trim();
  if (rowArea) return rowArea;

  const cardArea = control.closest("[data-6s-area]")?.getAttribute("data-6s-area")?.trim();
  return cardArea || "";
}

function auditTypeFromControl(control) {
  const explicit = control.dataset?.sixSAuditType;
  if (explicit) return explicit.trim();

  const label = controlLabel(control);
  if (label.includes("baseline")) return "Baseline implementation";
  if (label.includes("daily")) return "Daily area-owner check";
  if (label.includes("cross-functional") || label.includes("calibration")) return "Cross-functional calibration";
  if (label.includes("leadership") || label.includes("monthly")) return "Monthly leadership";
  return "Weekly supervisor";
}

function setControlledSelect(select, value) {
  if (!select || !value) return;
  const option = Array.from(select.options).find((item) => normalized(item.textContent) === normalized(value) || normalized(item.textContent).includes(normalized(value)));
  if (!option) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, option.value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyAuditContext(context, attempt = 0) {
  const overlay = document.querySelector(".guided-6s-overlay");
  const selects = overlay?.querySelectorAll(".audit-context select");
  if (!overlay || !selects?.length) {
    if (attempt < 24) window.setTimeout(() => applyAuditContext(context, attempt + 1), 35);
    return;
  }

  setControlledSelect(selects[0], context.area);
  setControlledSelect(selects[1], context.auditType);
  const auditor = overlay.querySelector(".audit-context input:not([type='date'])");
  if (auditor && !auditor.value) auditor.focus();
}

function openGuidedAudit(context) {
  const launcher = document.querySelector(".guided-6s-launcher");
  if (!launcher) return;
  launcher.click();
  applyAuditContext(context);
}

function SixSAuditEntryRouter() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle("six-s-workspace-route", pathname.includes("/tools/6s-workplace-excellence"));
    return () => document.body.classList.remove("six-s-workspace-route");
  }, [pathname]);

  useEffect(() => {
    const routeAuditEntry = (event) => {
      const control = event.target?.closest?.("button, a, [role='button']");
      if (!isAuditEntry(control)) return;

      const context = {
        area: areaFromControl(control),
        auditType: auditTypeFromControl(control),
        source: controlLabel(control),
        sourcePath: window.location.pathname,
      };

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      window.dispatchEvent(new CustomEvent("qmspilot:6s-audit-entry-routed", { detail: context }));
      openGuidedAudit(context);
    };

    const programmaticEntry = (event) => {
      const detail = event.detail || {};
      openGuidedAudit({
        area: detail.area || detail.areaName || "",
        auditType: detail.auditType || "Weekly supervisor",
        source: detail.source || "programmatic 6S audit entry",
        sourcePath: window.location.pathname,
      });
    };

    document.addEventListener("click", routeAuditEntry, true);
    window.addEventListener("qmspilot:open-6s-audit", programmaticEntry);
    return () => {
      document.removeEventListener("click", routeAuditEntry, true);
      window.removeEventListener("qmspilot:open-6s-audit", programmaticEntry);
    };
  }, []);

  return (
    <style jsx global>{`
      body:not(.six-s-workspace-route) .guided-6s-launcher {
        display: none !important;
      }
    `}</style>
  );
}

export function SixSAuditSystem() {
  return (
    <>
      <SixSAuditEntryRouter />
      <SixSGuidedAudit />
    </>
  );
}
