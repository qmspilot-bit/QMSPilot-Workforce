"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function WorkforceHomeNavigation() {
  const [navTarget, setNavTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findNavigation = () => {
      const target = document.querySelector<HTMLElement>(".wr-sidebar nav");
      setNavTarget(target);
      return Boolean(target);
    };

    if (findNavigation()) return;

    const observer = new MutationObserver(() => {
      if (findNavigation()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!navTarget) return null;

  return createPortal(
    <>
      <Link className="wr-home-link" href="/" aria-label="Return to Northstar home">
        <Home size={17} />
        <span>Home</span>
        <ChevronRight size={14} />
      </Link>
      <style jsx global>{`
        .wr-sidebar nav .wr-home-link{
          width:100%;
          display:grid;
          grid-template-columns:auto 1fr auto;
          align-items:center;
          gap:9px;
          padding:11px;
          border:1px solid transparent;
          border-radius:10px;
          color:#bfd2e3;
          background:transparent;
          text-align:left;
          font-size:10px;
          font-weight:850;
          line-height:1.2;
          text-decoration:none;
          transition:color .16s ease,border-color .16s ease,background .16s ease;
        }
        .wr-sidebar nav .wr-home-link:hover{
          color:#fff;
          border-color:#315777;
          background:#0d4a7c;
        }
        .wr-sidebar nav .wr-home-link:focus-visible{
          outline:2px solid #8ecbff;
          outline-offset:2px;
        }
      `}</style>
    </>,
    navTarget
  );
}
