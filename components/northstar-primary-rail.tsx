"use client";

import { BarChart3, BrainCircuit, BriefcaseBusiness, Home, ListChecks, ShieldCheck } from "lucide-react";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

type ActiveSection = "home" | "work" | "actions" | "leadership" | "ai-workforce";

const items = [
  { key: "home" as const, href: "/", label: "Home", note: "Operating view", icon: Home },
  { key: "work" as const, href: "/toolbox", label: "Work", note: "Smart workspaces", icon: BriefcaseBusiness },
  { key: "actions" as const, href: "/my-actions", label: "My Actions", note: "Ownership & closure", icon: ListChecks },
  { key: "leadership" as const, href: "/executive-intelligence", label: "Leadership", note: "Risk & performance", icon: BarChart3 },
  { key: "ai-workforce" as const, href: "/workforce-operations", label: "AI Workforce", note: "Agents & recommendations", icon: BrainCircuit },
];

export function NorthstarPrimaryRail({ active }: { active: ActiveSection }) {
  return (
    <aside className="northstar-primary-rail">
      <div className="northstar-brand-lockup">
        <div className="northstar-qms-logo"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
        <div className="northstar-wordmark"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
      </div>

      <div className="rail-section-label">PRIMARY</div>
      <nav className="northstar-primary-nav" aria-label="Northstar primary navigation">
        {items.map(({ key, href, label, note, icon: Icon }) => (
          <a className={active === key ? "active" : ""} href={href} key={key}>
            <span className="rail-icon"><Icon size={17} strokeWidth={2} /></span>
            <span className="rail-copy"><strong>{label}</strong><small>{note}</small></span>
          </a>
        ))}
      </nav>

      <div className="rail-status">
        <div className="rail-status-head"><ShieldCheck size={16} /><span>Northstar Secure</span></div>
        <div className="rail-status-row"><i /> Cloud persistence active</div>
        <div className="rail-status-row"><i /> Human authority preserved</div>
      </div>

      <style jsx global>{`
        .northstar-primary-rail{position:fixed;inset:0 auto 0 0;z-index:90;width:236px;height:100vh;display:flex;flex-direction:column;padding:18px 14px 16px;border-right:1px solid #173754;color:#fff;background:linear-gradient(180deg,#071727 0%,#091f34 58%,#071725 100%);font-family:Inter,Arial,sans-serif;box-shadow:8px 0 30px rgba(2,15,28,.08)}
        .northstar-brand-lockup{padding:3px 4px 17px;border-bottom:1px solid rgba(151,185,212,.16)}
        .northstar-qms-logo{height:48px;display:flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:8px;background:#fff}
        .northstar-qms-logo img{max-width:164px;max-height:38px}
        .northstar-wordmark{height:39px;display:flex;align-items:center;justify-content:center;margin-top:7px;padding:4px 10px;border:1px solid rgba(150,180,205,.12);border-radius:7px;background:#02070d}
        .northstar-wordmark img{max-width:166px;max-height:30px}
        .rail-section-label{margin:21px 10px 8px;color:#6f91ad;font-size:8px;font-weight:900;letter-spacing:.16em}
        .northstar-primary-nav{display:grid;gap:4px}
        .northstar-primary-nav a{position:relative;display:grid;grid-template-columns:34px 1fr;gap:9px;align-items:center;min-height:52px;padding:7px 9px;border:1px solid transparent;border-radius:8px;color:#b9ccdc;text-decoration:none;transition:background .16s ease,border-color .16s ease,color .16s ease}
        .northstar-primary-nav a:hover{color:#fff;background:#0d2d49;border-color:#214765}
        .northstar-primary-nav a.active{color:#fff;background:linear-gradient(90deg,#0d3b65,#0d3152);border-color:#2b5b80;box-shadow:inset 3px 0 0 #3c9bff}
        .rail-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:7px;color:#7eacd0;background:rgba(116,163,199,.08)}
        .northstar-primary-nav a.active .rail-icon{color:#8dc7ff;background:rgba(31,126,213,.14)}
        .rail-copy strong,.rail-copy small{display:block}.rail-copy strong{font-size:11px;font-weight:850;letter-spacing:.01em}.rail-copy small{margin-top:3px;color:#708ca3;font-size:7px;font-weight:700;letter-spacing:.02em}.northstar-primary-nav a.active .rail-copy small{color:#9ebbd2}
        .rail-status{margin-top:auto;padding:13px 11px 10px;border-top:1px solid rgba(151,185,212,.16);color:#8faabd}
        .rail-status-head{display:flex;align-items:center;gap:7px;margin-bottom:10px;color:#c8d8e5;font-size:9px;font-weight:850}.rail-status-head svg{color:#55c997}
        .rail-status-row{display:flex;align-items:center;gap:7px;margin-top:7px;font-size:7px}.rail-status-row i{width:6px;height:6px;border-radius:50%;background:#37c989;box-shadow:0 0 0 3px rgba(55,201,137,.09)}
        @media(max-width:820px){.northstar-primary-rail{position:static;width:auto;height:auto;display:block;padding:11px}.northstar-brand-lockup{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 0 10px}.northstar-qms-logo,.northstar-wordmark{height:42px;margin:0}.rail-section-label,.rail-status{display:none}.northstar-primary-nav{grid-template-columns:repeat(5,1fr);gap:5px}.northstar-primary-nav a{grid-template-columns:1fr;min-height:44px;padding:7px;text-align:center}.rail-icon{display:none}.rail-copy small{display:none}}
        @media(max-width:560px){.northstar-primary-nav{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </aside>
  );
}
