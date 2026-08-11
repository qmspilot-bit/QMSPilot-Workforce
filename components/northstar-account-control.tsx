"use client";

import type { User } from "@supabase/supabase-js";
import { BarChart3, BriefcaseBusiness, ChevronDown, CircleUserRound, Home, ListChecks, LockKeyhole, LogIn, LogOut, ShieldCheck } from "lucide-react";
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

const links = [
  ["/", "Home", "What needs attention now", Home],
  ["/toolbox", "Work", "Open a workspace or controlled tool", BriefcaseBusiness],
  ["/my-actions", "My Actions", "What you own, what is due, what needs closure", ListChecks],
  ["/executive-intelligence", "Leadership", "Business health, risk, and priorities", BarChart3],
] as const;

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
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (pathname === "/login") return null;

  const fullName = user
    ? textValue(user.user_metadata?.full_name) || textValue(user.user_metadata?.name) || user.email?.split("@")[0] || "Northstar User"
    : "";
  const organization = user
    ? textValue(user.app_metadata?.organization_name) || textValue(user.user_metadata?.organization_name) || "QMSPilot"
    : "QMSPilot";
  const role = user
    ? textValue(user.app_metadata?.role) || textValue(user.user_metadata?.role) || "Administrator"
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
        <a className="northstar-account-button" href={`/login?redirect=${encodeURIComponent(redirect)}`}>
          <span className="northstar-account-avatar"><LockKeyhole size={18} /></span>
          <span className="northstar-account-copy"><small>SECURE WORKSPACE</small><strong>Sign in</strong></span>
          <LogIn size={17} />
        </a>
      ) : (
        <>
          <button type="button" className="northstar-account-button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
            <span className="northstar-account-avatar">{initials(fullName)}</span>
            <span className="northstar-account-copy"><small>{organization.toUpperCase()}</small><strong>{fullName}</strong></span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="northstar-account-panel" role="menu">
              <div className="northstar-account-panel-head">
                <span className="northstar-panel-avatar">{initials(fullName)}</span>
                <div><small>SIGNED IN</small><strong>{fullName}</strong><span>{user.email}</span></div>
                <ShieldCheck size={20} />
              </div>
              <div className="northstar-role"><CircleUserRound size={15} /><span><small>Access role</small><strong>{role}</strong></span></div>
              <div className="northstar-account-links">
                {links.map(([href, label, note, Icon]) => (
                  <a href={href} role="menuitem" key={href}><Icon size={16} /><span><strong>{label}</strong><small>{note}</small></span></a>
                ))}
              </div>
              <button type="button" className="northstar-signout" onClick={handleSignOut} disabled={signingOut}>
                <LogOut size={16} /> {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        .northstar-account-anchor{position:fixed;top:9px;right:16px;z-index:2147483000;width:286px;font-family:Inter,Arial,sans-serif}.northstar-account-button{width:100%;min-height:48px;display:flex;align-items:center;gap:9px;padding:5px 9px 5px 6px;border:1px solid #cddae6;border-radius:13px;color:#15314c;background:rgba(255,255,255,.97);box-shadow:0 10px 28px rgba(13,39,65,.14);text-decoration:none}.northstar-account-button:hover{border-color:#82add1}.northstar-account-avatar,.northstar-panel-avatar{display:grid;place-items:center;flex:0 0 auto;color:#fff;background:linear-gradient(145deg,#073b70,#0a66ff);font-weight:950}.northstar-account-avatar{width:36px;height:36px;border-radius:10px;font-size:11px}.northstar-account-copy{min-width:0;margin-right:auto;text-align:left}.northstar-account-copy small,.northstar-account-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.northstar-account-copy small{color:#6f8498;font-size:8px;font-weight:950;letter-spacing:.1em}.northstar-account-copy strong{margin-top:2px;color:#183955;font-size:11px}button.northstar-account-button{cursor:pointer}.northstar-account-panel{position:absolute;top:56px;right:0;width:330px;overflow:hidden;border:1px solid #cbd9e5;border-radius:16px;background:#fff;box-shadow:0 24px 70px rgba(6,29,51,.25)}.northstar-account-panel-head{display:grid;grid-template-columns:46px 1fr auto;gap:10px;align-items:center;padding:15px;color:#fff;background:linear-gradient(135deg,#061729,#0b477c)}.northstar-panel-avatar{width:46px;height:46px;border-radius:12px}.northstar-account-panel-head small,.northstar-account-panel-head strong,.northstar-account-panel-head span{display:block}.northstar-account-panel-head small{color:#91c8f4;font-size:7px;font-weight:950;letter-spacing:.13em}.northstar-account-panel-head strong{margin-top:3px;font-size:13px}.northstar-account-panel-head span{margin-top:3px;overflow:hidden;color:#bdd5e8;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.northstar-account-panel-head>svg{color:#71d8af}.northstar-role{display:grid;grid-template-columns:26px 1fr;gap:8px;align-items:center;margin:11px 12px 5px;padding:9px 10px;border:1px solid #e0e8ef;border-radius:10px;background:#f8fbfd}.northstar-role svg{color:#0a66ff}.northstar-role small,.northstar-role strong{display:block}.northstar-role small{color:#7b8da0;font-size:7px}.northstar-role strong{margin-top:2px;color:#2a455f;font-size:9px}.northstar-account-links{display:grid;padding:5px 12px 10px}.northstar-account-links a{display:grid;grid-template-columns:29px 1fr;gap:8px;align-items:center;padding:9px;border-radius:10px;color:#2b4963;text-decoration:none}.northstar-account-links a:hover{background:#eef6ff}.northstar-account-links a>svg{color:#0a66ff}.northstar-account-links strong,.northstar-account-links small{display:block}.northstar-account-links strong{font-size:9px}.northstar-account-links small{margin-top:2px;color:#74899c;font-size:7px}.northstar-signout{width:calc(100% - 24px);min-height:36px;display:flex;align-items:center;justify-content:center;gap:7px;margin:0 12px 12px;border:1px solid #d7e1e9;border-radius:10px;color:#5b2d35;background:#fff7f8;font-size:9px;font-weight:850}.northstar-signout:disabled{opacity:.55}@media(min-width:1280px){body:has(.northstar-account-anchor) .command-topbar,body:has(.northstar-account-anchor) .main>header,body:has(.northstar-account-anchor) main>header,body:has(.northstar-account-anchor) .topbar{padding-right:316px!important}}@media(max-width:1279px){.northstar-account-anchor{width:50px;right:10px}.northstar-account-copy,.northstar-account-button>svg:last-child{display:none}.northstar-account-button{justify-content:center;padding:5px}.northstar-account-panel{width:min(330px,calc(100vw - 20px))}body:has(.northstar-account-anchor) .command-topbar,body:has(.northstar-account-anchor) .main>header,body:has(.northstar-account-anchor) main>header,body:has(.northstar-account-anchor) .topbar{padding-right:72px!important}}
      `}</style>
    </div>
  );
}
