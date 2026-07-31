"use client";

import type { User } from "@supabase/supabase-js";
import {
  BarChart3,
  Building2,
  ChevronDown,
  CircleUserRound,
  LayoutGrid,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] || ""}`.toUpperCase();
}

export function NorthstarAccountControl() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (pathname === "/login") return null;

  const fullName = user
    ? textValue(user.user_metadata?.full_name)
      || textValue(user.user_metadata?.name)
      || user.email?.split("@")[0]
      || "Northstar User"
    : "";
  const organization = user
    ? textValue(user.app_metadata?.organization_name)
      || textValue(user.user_metadata?.organization_name)
      || "QMSPilot"
    : "QMSPilot";
  const site = user
    ? textValue(user.app_metadata?.site_name)
      || textValue(user.user_metadata?.site_name)
      || "Northstar Workspace"
    : "Northstar Workspace";
  const role = user
    ? textValue(user.app_metadata?.role)
      || textValue(user.user_metadata?.role)
      || "Administrator"
    : "";

  async function handleSignOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/login");
  }

  const redirect = pathname && pathname.startsWith("/") ? pathname : "/";

  return (
    <div className="northstar-account-anchor" ref={rootRef}>
      {loading ? (
        <div className="northstar-account-button is-loading" aria-label="Loading secure access">
          <span className="northstar-account-avatar"><LockKeyhole size={18} /></span>
          <span className="northstar-account-copy"><small>SECURE ACCESS</small><strong>Verifying session</strong></span>
        </div>
      ) : !user ? (
        <a className="northstar-account-button northstar-signin" href={`/login?redirect=${encodeURIComponent(redirect)}`} aria-label="Sign in to QMSPilot Northstar">
          <span className="northstar-account-avatar"><LockKeyhole size={18} /></span>
          <span className="northstar-account-copy northstar-signin-copy"><small>SECURE WORKSPACE</small><strong>Sign in to Northstar</strong></span>
          <LogIn className="northstar-account-chevron" size={17} />
        </a>
      ) : (
        <>
          <button
            type="button"
            className="northstar-account-button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={`Open account menu for ${fullName}`}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="northstar-account-avatar">{initials(fullName)}</span>
            <span className="northstar-account-copy"><small>{organization.toUpperCase()}</small><strong>{fullName}</strong></span>
            <ChevronDown className="northstar-account-chevron" size={16} />
          </button>

          {open && (
            <div className="northstar-account-panel" role="menu">
              <div className="northstar-account-panel-head">
                <span className="northstar-panel-avatar">{initials(fullName)}</span>
                <div><small>AUTHENTICATED USER</small><strong>{fullName}</strong><span>{user.email}</span></div>
                <ShieldCheck size={20} />
              </div>

              <div className="northstar-context-label">ACTIVE OPERATING CONTEXT</div>
              <div className="northstar-context-grid">
                <div><Building2 size={16} /><span><small>Organization</small><strong>{organization}</strong></span></div>
                <div><MapPin size={16} /><span><small>Workspace / Site</small><strong>{site}</strong></span></div>
                <div><CircleUserRound size={16} /><span><small>Access role</small><strong>{role}</strong></span></div>
              </div>

              <div className="northstar-account-links">
                <a href="/" role="menuitem"><LayoutGrid size={16} /><span><strong>Command Center</strong><small>Executive operating view</small></span></a>
                <a href="/dashboard" role="menuitem"><BarChart3 size={16} /><span><strong>Accountability</strong><small>Owners, dates, evidence, closure</small></span></a>
                <a href="/toolbox" role="menuitem"><Building2 size={16} /><span><strong>Workspaces</strong><small>Open the Digital Toolbox</small></span></a>
              </div>

              <button type="button" className="northstar-signout" onClick={handleSignOut} disabled={signingOut}>
                <LogOut size={16} /> {signingOut ? "Signing out…" : "Sign out of this session"}
              </button>
              <p className="northstar-session-note"><LockKeyhole size={13} /> Identity is shared across authorized Northstar workspaces and embedded tools.</p>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        .northstar-account-anchor{position:fixed;top:9px;right:16px;z-index:2147483000;width:304px;font-family:Inter,Arial,sans-serif}.northstar-account-button{width:100%;min-height:50px;display:flex;align-items:center;gap:10px;padding:5px 9px 5px 6px;border:1px solid #cddae6;border-radius:13px;color:#15314c;background:rgba(255,255,255,.97);box-shadow:0 10px 28px rgba(13,39,65,.14);backdrop-filter:blur(16px);text-decoration:none;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.northstar-account-button:hover{border-color:#82add1;box-shadow:0 14px 32px rgba(13,39,65,.18);transform:translateY(-1px)}button.northstar-account-button{cursor:pointer}.northstar-account-button.is-loading{opacity:.8}.northstar-account-avatar,.northstar-panel-avatar{display:grid;place-items:center;flex:0 0 auto;color:#fff;background:linear-gradient(145deg,#073b70,#0a66ff);font-weight:950;letter-spacing:.02em}.northstar-account-avatar{width:38px;height:38px;border-radius:10px;font-size:11px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}.northstar-account-copy{min-width:0;margin-right:auto;text-align:left}.northstar-account-copy small,.northstar-account-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.northstar-account-copy small{color:#6f8498;font-size:8px;font-weight:950;letter-spacing:.12em}.northstar-account-copy strong{margin-top:3px;color:#183955;font-size:11px}.northstar-account-chevron{flex:0 0 auto;color:#58738c}.northstar-signin .northstar-account-avatar{color:#0a5fc7;background:#e7f2ff}.northstar-account-panel{position:absolute;top:58px;right:0;width:350px;overflow:hidden;border:1px solid #cbd9e5;border-radius:17px;background:#fff;box-shadow:0 24px 70px rgba(6,29,51,.25);animation:northstar-account-in .16s ease-out}.northstar-account-panel-head{display:grid;grid-template-columns:48px 1fr auto;gap:11px;align-items:center;padding:16px;color:#fff;background:linear-gradient(135deg,#061729,#0b477c)}.northstar-panel-avatar{width:48px;height:48px;border-radius:13px;background:linear-gradient(145deg,#0a66ff,#55a4ff);font-size:13px}.northstar-account-panel-head small,.northstar-account-panel-head strong,.northstar-account-panel-head span{display:block}.northstar-account-panel-head small{color:#91c8f4;font-size:7px;font-weight:950;letter-spacing:.13em}.northstar-account-panel-head strong{margin-top:4px;font-size:13px}.northstar-account-panel-head span{margin-top:3px;overflow:hidden;color:#bdd5e8;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.northstar-account-panel-head>svg{color:#71d8af}.northstar-context-label{padding:13px 15px 7px;color:#688096;font-size:7px;font-weight:950;letter-spacing:.13em}.northstar-context-grid{display:grid;gap:7px;padding:0 12px 12px}.northstar-context-grid>div{display:grid;grid-template-columns:30px 1fr;gap:9px;align-items:center;padding:9px 10px;border:1px solid #e0e8ef;border-radius:11px;background:#f8fbfd}.northstar-context-grid>div>svg{width:16px;color:#0a66ff}.northstar-context-grid small,.northstar-context-grid strong{display:block}.northstar-context-grid small{color:#7b8da0;font-size:7px;font-weight:800}.northstar-context-grid strong{margin-top:2px;color:#2a455f;font-size:9px}.northstar-account-links{display:grid;padding:4px 12px 10px;border-top:1px solid #edf1f5}.northstar-account-links a{display:grid;grid-template-columns:31px 1fr;gap:9px;align-items:center;padding:9px;border-radius:10px;color:#2b4963;text-decoration:none}.northstar-account-links a:hover{background:#eef6ff}.northstar-account-links a>svg{color:#0a66ff}.northstar-account-links strong,.northstar-account-links small{display:block}.northstar-account-links strong{font-size:9px}.northstar-account-links small{margin-top:2px;color:#74899c;font-size:7px}.northstar-signout{width:calc(100% - 24px);min-height:38px;display:flex;align-items:center;justify-content:center;gap:7px;margin:0 12px;border:1px solid #d7e1e9;border-radius:10px;color:#5b2d35;background:#fff7f8;font-size:9px;font-weight:850}.northstar-signout:disabled{cursor:not-allowed;opacity:.55}.northstar-session-note{display:flex;align-items:flex-start;gap:6px;margin:11px 15px 14px;color:#75899b;font-size:7px;line-height:1.45}.northstar-session-note svg{flex:0 0 auto;color:#16835a}@keyframes northstar-account-in{from{opacity:0;transform:translateY(-5px) scale(.985)}to{opacity:1;transform:none}}@media(min-width:1280px){body:has(.northstar-account-anchor) .command-topbar,body:has(.northstar-account-anchor) .main>header,body:has(.northstar-account-anchor) main>header,body:has(.northstar-account-anchor) .topbar{padding-right:338px!important}}@media(max-width:1279px){.northstar-account-anchor{width:52px;right:10px}.northstar-account-copy,.northstar-account-chevron{display:none}.northstar-account-button{justify-content:center;padding:5px}.northstar-account-panel{width:min(350px,calc(100vw - 20px))}body:has(.northstar-account-anchor) .command-topbar,body:has(.northstar-account-anchor) .main>header,body:has(.northstar-account-anchor) main>header,body:has(.northstar-account-anchor) .topbar{padding-right:76px!important}}@media(max-width:640px){.northstar-account-anchor{top:8px;right:8px}.northstar-account-button{min-height:46px}.northstar-account-avatar{width:34px;height:34px}.northstar-account-panel{top:53px}}
      `}</style>
    </div>
  );
}
