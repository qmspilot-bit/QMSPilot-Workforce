"use client";

import { usePathname } from "next/navigation";
import { NorthstarAccountControl } from "@/components/northstar-account-control";
import { NorthstarDashboardLauncher } from "@/components/northstar-dashboard-launcher";
import { NorthstarToolboxLauncher } from "@/components/northstar-toolbox-launcher";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";
import { NorthstarWorkforceLauncher } from "@/components/northstar-workforce-launcher";

export function NorthstarApplicationChrome() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <>
      <NorthstarAccountControl />
      <NorthstarToolActionInbox />

      <nav className="northstar-quick-actions" aria-label="Northstar quick access">
        <NorthstarWorkforceLauncher />
        <NorthstarDashboardLauncher />
        <NorthstarToolboxLauncher />
      </nav>

      <style jsx global>{`
        .northstar-quick-actions {
          position: fixed;
          top: 12px;
          right: 336px;
          z-index: 2147482000;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Inter, Arial, sans-serif;
        }

        .northstar-quick-actions > a,
        .northstar-quick-actions > button {
          position: static !important;
          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          flex: 0 0 auto;
          box-sizing: border-box;
          min-height: 44px !important;
          margin: 0 !important;
        }

        @media (min-width: 1500px) {
          body:has(.northstar-quick-actions) .command-topbar,
          body:has(.northstar-quick-actions) .main > header,
          body:has(.northstar-quick-actions) main > header,
          body:has(.northstar-quick-actions) .topbar {
            padding-right: 836px !important;
          }
        }

        @media (max-width: 1499px) {
          .northstar-quick-actions > a,
          .northstar-quick-actions > button {
            width: 44px !important;
            min-width: 44px !important;
            max-width: 44px !important;
            padding: 0 !important;
            justify-content: center !important;
            gap: 0 !important;
            border-radius: 12px !important;
            font-size: 0 !important;
          }
        }

        @media (min-width: 1280px) and (max-width: 1499px) {
          body:has(.northstar-quick-actions) .command-topbar,
          body:has(.northstar-quick-actions) .main > header,
          body:has(.northstar-quick-actions) main > header,
          body:has(.northstar-quick-actions) .topbar {
            padding-right: 500px !important;
          }
        }

        @media (max-width: 1279px) {
          .northstar-quick-actions {
            right: 74px;
          }

          body:has(.northstar-quick-actions) .command-topbar,
          body:has(.northstar-quick-actions) .main > header,
          body:has(.northstar-quick-actions) main > header,
          body:has(.northstar-quick-actions) .topbar {
            padding-right: 238px !important;
          }
        }

        @media (max-width: 640px) {
          .northstar-quick-actions {
            top: 9px;
            right: 68px;
            gap: 6px;
          }

          .northstar-quick-actions > a {
            display: none !important;
          }

          body:has(.northstar-quick-actions) .command-topbar,
          body:has(.northstar-quick-actions) .main > header,
          body:has(.northstar-quick-actions) main > header,
          body:has(.northstar-quick-actions) .topbar {
            padding-right: 124px !important;
          }
        }
      `}</style>
    </>
  );
}
