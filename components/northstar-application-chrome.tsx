"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { NorthstarAccountControl } from "@/components/northstar-account-control";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";

const PRIMARY_RAIL_ROUTES = new Set([
  "/",
  "/toolbox",
  "/my-actions",
  "/executive-intelligence",
  "/workforce-operations",
]);

export function NorthstarApplicationChrome() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const showQuickHome = !PRIMARY_RAIL_ROUTES.has(pathname);

  return (
    <>
      {showQuickHome ? (
        <Link className="northstar-quick-home" href="/" aria-label="Return to Northstar home" title="Northstar Home">
          <Home size={17} strokeWidth={2.2} />
          <span>Home</span>
        </Link>
      ) : null}

      <NorthstarToolActionInbox />
      <NorthstarAccountControl />

      <style jsx global>{`
        .northstar-quick-home{
          position:fixed;
          left:12px;
          top:50%;
          z-index:118;
          display:flex;
          align-items:center;
          gap:7px;
          min-height:38px;
          padding:9px 11px;
          transform:translateY(-50%);
          border:1px solid #28577d;
          border-radius:9px;
          color:#dceeff;
          background:linear-gradient(180deg,#0a2944 0%,#081f35 100%);
          box-shadow:0 10px 28px rgba(2,15,28,.24);
          font:800 10px/1 Inter,Arial,sans-serif;
          letter-spacing:.02em;
          text-decoration:none;
          transition:transform .16s ease,border-color .16s ease,background .16s ease,color .16s ease;
        }
        .northstar-quick-home:hover{
          color:#fff;
          border-color:#4b90c8;
          background:linear-gradient(180deg,#0d3659 0%,#0a2945 100%);
          transform:translateY(-50%) translateX(2px);
        }
        .northstar-quick-home:focus-visible{
          outline:2px solid #79bfff;
          outline-offset:3px;
        }
        @media(max-width:820px){
          .northstar-quick-home{
            left:10px;
            top:auto;
            bottom:14px;
            min-height:40px;
            transform:none;
          }
          .northstar-quick-home:hover{transform:translateX(2px)}
        }
      `}</style>
    </>
  );
}
