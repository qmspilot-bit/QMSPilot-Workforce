"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCloudWorkspace } from "@/components/cloud-workspace";

const REDIRECT_PATH = "/tools/delivery-assurance";

export default function DeliveryAssuranceAccountStatus() {
  const cloud = useCloudWorkspace();
  const [toolbar, setToolbar] = useState(null);

  useEffect(() => {
    function locateToolbar() {
      const nextToolbar = document.querySelector(".toolbar");
      if (nextToolbar) setToolbar(nextToolbar);
      return Boolean(nextToolbar);
    }

    if (locateToolbar()) return undefined;

    const observer = new MutationObserver(() => {
      if (locateToolbar()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!toolbar) return null;

  const signedIn = cloud.status === "ready" && Boolean(cloud.user);
  const checking = cloud.status === "loading";

  return createPortal(
    <>
      {signedIn ? (
        <span className="delivery-sync-toolbar is-ready" aria-live="polite">
          <span className="delivery-sync-toolbar-dot" />
          <span><strong>Sync active</strong><small>{cloud.user?.email}</small></span>
        </span>
      ) : checking ? (
        <span className="delivery-sync-toolbar is-checking" aria-live="polite">
          <span className="delivery-sync-toolbar-dot" />
          <span><strong>Checking secure access…</strong><small>Device sync status</small></span>
        </span>
      ) : (
        <a
          className="delivery-sync-toolbar is-signed-out"
          href={`/login?redirect=${encodeURIComponent(REDIRECT_PATH)}`}
          aria-label="Sign in to Northstar Secure to sync Delivery Assurance across devices"
        >
          <span className="delivery-sync-toolbar-dot" />
          <span><strong>Sign in to sync devices</strong><small>Computer + iPad</small></span>
        </a>
      )}

      <style jsx global>{`
        .delivery-sync-toolbar {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 5px 12px;
          border: 1px solid #dfb85c;
          border-radius: 11px;
          color: #684b08;
          background: #fff7dc;
          box-shadow: 0 7px 18px rgba(31, 66, 96, 0.1);
          font-family: Inter, Arial, sans-serif;
          text-decoration: none;
          white-space: nowrap;
        }
        .delivery-sync-toolbar.is-signed-out {
          border-color: #0a66ff;
          color: #fff;
          background: linear-gradient(135deg, #0d315c, #0a66ff);
        }
        .delivery-sync-toolbar.is-ready {
          border-color: #87cdb0;
          color: #145f44;
          background: #ebfaf3;
        }
        .delivery-sync-toolbar-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 auto;
          border-radius: 999px;
          background: #d58a16;
          box-shadow: 0 0 0 4px rgba(213, 138, 22, 0.15);
        }
        .delivery-sync-toolbar.is-signed-out .delivery-sync-toolbar-dot {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.18);
        }
        .delivery-sync-toolbar.is-ready .delivery-sync-toolbar-dot {
          background: #18895d;
          box-shadow: 0 0 0 4px rgba(24, 137, 93, 0.14);
        }
        .delivery-sync-toolbar strong,
        .delivery-sync-toolbar small {
          display: block;
          line-height: 1.15;
        }
        .delivery-sync-toolbar strong {
          font-size: 9px;
          font-weight: 950;
        }
        .delivery-sync-toolbar small {
          max-width: 170px;
          margin-top: 3px;
          overflow: hidden;
          font-size: 7px;
          font-weight: 750;
          opacity: 0.82;
          text-overflow: ellipsis;
        }
        @media (max-width: 650px) {
          .delivery-sync-toolbar {
            width: 100%;
            justify-content: center;
          }
          .delivery-sync-toolbar small {
            max-width: 250px;
          }
        }
      `}</style>
    </>,
    toolbar,
  );
}
