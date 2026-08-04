"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NorthstarMotionSystem() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;
    body.classList.remove("ns-route-enter");
    void body.offsetWidth;
    body.classList.add("ns-route-enter");
    const timer = window.setTimeout(() => body.classList.remove("ns-route-enter"), 520);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <style jsx global>{`
      :root {
        --ns-motion-fast: 140ms;
        --ns-motion-standard: 220ms;
        --ns-motion-emphasis: 380ms;
        --ns-ease-standard: cubic-bezier(.2,.8,.2,1);
        --ns-ease-emphasis: cubic-bezier(.16,1,.3,1);
      }

      .ns-route-enter main,
      .ns-route-enter .app-shell,
      .ns-route-enter .ei-shell,
      .ns-route-enter .wr-shell {
        animation: nsRouteEnter var(--ns-motion-emphasis) var(--ns-ease-emphasis) both;
      }

      .wr-content > section,
      .wr-content > div:not(.wr-notice) {
        animation: nsWorkspaceEnter 320ms var(--ns-ease-emphasis) both;
      }

      :where(button, a, [role="button"]) {
        transition:
          transform var(--ns-motion-fast) var(--ns-ease-standard),
          color var(--ns-motion-fast) var(--ns-ease-standard),
          background-color var(--ns-motion-fast) var(--ns-ease-standard),
          border-color var(--ns-motion-fast) var(--ns-ease-standard),
          box-shadow var(--ns-motion-standard) var(--ns-ease-standard),
          opacity var(--ns-motion-fast) var(--ns-ease-standard);
      }

      :where(button, [role="button"]):active,
      :where(a):active {
        transform: scale(.985);
      }

      :where(button, a, [role="button"]):focus-visible {
        outline: 3px solid rgba(10,102,255,.28);
        outline-offset: 3px;
      }

      :where(.wr-panel, .view-card, .metrics article, .wr-metrics article, .mission-card, .panel, .scenario-lab) {
        transition:
          transform var(--ns-motion-standard) var(--ns-ease-standard),
          border-color var(--ns-motion-standard) var(--ns-ease-standard),
          box-shadow var(--ns-motion-standard) var(--ns-ease-standard);
      }

      :where(a.view-card, .nav-card, .scenario-primary, .scenario-secondary):hover {
        transform: translateY(-2px);
      }

      .wr-sidebar nav button:hover,
      .ei-shell aside nav a:hover,
      .sidebar nav a:hover {
        transform: translateX(2px);
      }

      .wr-sidebar nav button svg:last-child {
        transition: transform var(--ns-motion-standard) var(--ns-ease-standard);
      }

      .wr-sidebar nav button:hover svg:last-child,
      .wr-sidebar nav button.active svg:last-child {
        transform: translateX(3px);
      }

      .wr-bars b,
      .work-center-bars b,
      .progress span {
        transform-origin: left center;
        animation: nsProgressReveal 720ms var(--ns-ease-emphasis) both;
      }

      .wr-ring,
      .ring {
        animation: nsRingSettle 560ms var(--ns-ease-emphasis) both;
      }

      @keyframes nsRouteEnter {
        from { opacity: .35; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes nsWorkspaceEnter {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes nsProgressReveal {
        from { transform: scaleX(0); opacity: .45; }
        to { transform: scaleX(1); opacity: 1; }
      }

      @keyframes nsRingSettle {
        from { opacity: .5; transform: scale(.94) rotate(-4deg); }
        to { opacity: 1; transform: scale(1) rotate(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          scroll-behavior: auto !important;
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
        }
      }
    `}</style>
  );
}
