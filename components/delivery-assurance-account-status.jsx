"use client";

import { useCloudWorkspace } from "@/components/cloud-workspace";

const REDIRECT_PATH = "/tools/delivery-assurance";

export default function DeliveryAssuranceAccountStatus() {
  const cloud = useCloudWorkspace();

  const signedIn = cloud.status === "ready" && cloud.user;
  const checking = cloud.status === "loading";

  return (
    <aside className={`delivery-sync-account ${signedIn ? "is-ready" : "is-signed-out"}`} aria-live="polite">
      <span className="delivery-sync-dot" aria-hidden="true" />
      <div className="delivery-sync-copy">
        <strong>
          {signedIn
            ? "Northstar Secure sync active"
            : checking
              ? "Checking Northstar Secure access…"
              : "Sign in to sync devices"}
        </strong>
        <small>
          {signedIn
            ? cloud.user.email
            : "Use the same Northstar account on your computer and iPad."}
        </small>
      </div>
      {!signedIn && !checking && (
        <a href={`/login?redirect=${encodeURIComponent(REDIRECT_PATH)}`}>
          Sign in
        </a>
      )}

      <style jsx>{`
        .delivery-sync-account {
          position: fixed;
          right: 14px;
          bottom: 14px;
          z-index: 2147483647;
          min-width: 300px;
          max-width: min(430px, calc(100vw - 28px));
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          padding: 11px 12px;
          border: 1px solid #b9cce0;
          border-radius: 13px;
          color: #173852;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 16px 44px rgba(7, 38, 67, 0.24);
          font-family: Inter, Arial, sans-serif;
          backdrop-filter: blur(14px);
        }
        .delivery-sync-account.is-ready {
          border-color: #9dd6bd;
        }
        .delivery-sync-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #d68c1d;
          box-shadow: 0 0 0 4px rgba(214, 140, 29, 0.13);
        }
        .delivery-sync-account.is-ready .delivery-sync-dot {
          background: #18895d;
          box-shadow: 0 0 0 4px rgba(24, 137, 93, 0.13);
        }
        .delivery-sync-copy {
          min-width: 0;
        }
        .delivery-sync-copy strong,
        .delivery-sync-copy small {
          display: block;
        }
        .delivery-sync-copy strong {
          font-size: 11px;
          line-height: 1.25;
        }
        .delivery-sync-copy small {
          margin-top: 3px;
          overflow: hidden;
          color: #637b90;
          font-size: 8px;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .delivery-sync-account a {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 13px;
          border-radius: 9px;
          color: #fff;
          background: #075fc9;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .delivery-sync-account {
            right: 10px;
            bottom: 10px;
            left: 10px;
            min-width: 0;
            max-width: none;
          }
        }
      `}</style>
    </aside>
  );
}
