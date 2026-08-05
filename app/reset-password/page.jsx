"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const RETURN_PATH = "/tools/delivery-assurance";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;
    const client = supabase;
    const { data: authListener } = client.auth.onAuthStateChange((event) => {
      if (mounted && event === "PASSWORD_RECOVERY") {
        setMode("update");
        setError("");
        setChecking(false);
      }
    });

    async function initialize() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          url.searchParams.delete("code");
          window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        }
      }

      const { data } = await client.auth.getSession();
      if (!mounted) return;

      const recoveryHint = url.searchParams.get("type") === "recovery" || window.location.hash.includes("type=recovery");
      if (data.session && (code || recoveryHint)) setMode("update");
      setChecking(false);
    }

    void initialize();
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendReset(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Northstar Secure authentication is unavailable.");
      return;
    }
    if (!email.trim()) {
      setError("Enter the email address used for the Northstar account.");
      return;
    }

    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMode("sent");
    setMessage("A secure reset link has been requested. Check Inbox, Spam, and Junk.");
  }

  async function savePassword(event) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Northstar Secure authentication is unavailable.");
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two password entries do not match.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMode("complete");
    setMessage("Password updated. Returning to Delivery Assurance…");
    window.setTimeout(() => window.location.assign(RETURN_PATH), 900);
  }

  return (
    <main className="reset-shell">
      <section className="reset-card">
        <div className="brand">QMSPILOT <span>NORTHSTAR</span></div>
        <small>SECURE ACCOUNT RECOVERY</small>
        <h1>{mode === "update" ? "Choose a new password" : mode === "complete" ? "Password updated" : "Reset your Northstar password"}</h1>
        <p className="intro">Resetting the password will not delete the Customer Promise saved on the original computer.</p>

        {checking ? (
          <div className="notice">Checking the secure recovery link…</div>
        ) : mode === "request" ? (
          <form onSubmit={sendReset}>
            <label>Northstar account email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={busy || !supabase}>{busy ? "Sending…" : "Email password-reset link"}</button>
          </form>
        ) : mode === "sent" ? (
          <div className="success">
            <strong>Check your email</strong>
            <p>{message}</p>
            <p>Account: <b>{email}</b></p>
            <button type="button" onClick={() => setMode("request")}>Use a different email</button>
          </div>
        ) : mode === "update" ? (
          <form onSubmit={savePassword}>
            <label>New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /></label>
            <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" /></label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={busy}>{busy ? "Updating…" : "Set new password"}</button>
          </form>
        ) : (
          <div className="success"><strong>Password updated</strong><p>{message}</p></div>
        )}

        <a className="back" href={`/login?redirect=${encodeURIComponent(RETURN_PATH)}`}>Return to sign in</a>
        <div className="security">Credentials are processed by Supabase Auth. QMSPilot administrators cannot view your password.</div>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.reset-shell{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 10%,#145da8 0,transparent 30%),linear-gradient(145deg,#041322,#082f52 58%,#0a66ff);font-family:Inter,Arial,sans-serif}.reset-card{width:min(500px,100%);padding:32px;border:1px solid #c9d9e7;border-radius:22px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.34)}.brand{color:#11334f;font-size:19px;font-weight:950;letter-spacing:.03em}.brand span{margin-left:6px;color:#0a66ff}.reset-card>small{display:block;margin-top:24px;color:#0a66ff;font-size:9px;font-weight:950;letter-spacing:.14em}.reset-card h1{margin:8px 0 10px;color:#13344f;font-size:30px;line-height:1.06}.intro{margin:0 0 22px;color:#657d91;font-size:12px;line-height:1.6}.reset-card form{display:grid;gap:15px}.reset-card label{display:grid;gap:7px;color:#35516a;font-size:10px;font-weight:850}.reset-card input{width:100%;height:49px;padding:0 13px;border:1px solid #c8d8e5;border-radius:11px;outline:0;color:#15344f;background:#f9fbfd;font-size:13px}.reset-card input:focus{border-color:#5e9cda;box-shadow:0 0 0 4px rgba(10,102,255,.09);background:#fff}.reset-card form>button{height:49px;border:0;border-radius:11px;color:#fff;background:linear-gradient(135deg,#073b70,#0a66ff);font-size:11px;font-weight:900;cursor:pointer}.reset-card form>button:disabled{opacity:.55}.notice,.error,.success{padding:15px;border-radius:12px;font-size:11px;line-height:1.55}.notice{border:1px solid #cbdce9;color:#536e84;background:#f3f8fc}.error{border:1px solid #e9bec5;color:#8c2f3a;background:#fff2f4}.success{display:grid;gap:9px;border:1px solid #a9d6be;color:#245c46;background:#f1fbf6}.success strong{font-size:16px}.success p{margin:0}.success button{justify-self:start;padding:0;border:0;color:#0a66ff;background:transparent;font-weight:900}.back{display:block;margin-top:19px;color:#0a66ff;text-align:center;text-decoration:none;font-size:10px;font-weight:900}.security{margin-top:17px;padding-top:15px;border-top:1px solid #e4ecf2;color:#7a8d9d;font-size:9px;line-height:1.5}@media(max-width:560px){.reset-card{padding:24px}.reset-card h1{font-size:27px}}
      `}</style>
    </main>
  );
}
