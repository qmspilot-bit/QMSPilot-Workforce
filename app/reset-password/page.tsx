"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

type Mode = "request" | "email-sent" | "update" | "complete";

const RETURN_PATH = "/tools/delivery-assurance";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setCheckingLink(false);
      return;
    }

    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") {
        setMode("update");
        setError("");
        setCheckingLink(false);
      }
    });

    async function initializeRecovery() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          url.searchParams.delete("code");
          window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const recoveryHint = url.searchParams.get("type") === "recovery" || window.location.hash.includes("type=recovery");
      if (data.session && (code || recoveryHint)) {
        setMode("update");
      }
      setCheckingLink(false);
    }

    void initializeRecovery();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Secure cloud authentication is not configured for this deployment.");
      return;
    }
    if (!email.trim()) {
      setError("Enter the email address assigned to your Northstar account.");
      return;
    }

    setSubmitting(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMode("email-sent");
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Secure cloud authentication is not configured for this deployment.");
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for the new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The two password entries do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMode("complete");
    window.setTimeout(() => window.location.assign(RETURN_PATH), 900);
  }

  return (
    <main className="reset-shell">
      <section className="reset-brand">
        <div className="logo-row">
          <div className="logo qms"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div>
          <div className="logo northstar"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div>
        </div>
        <div className="brand-copy">
          <small>SECURE ACCOUNT RECOVERY</small>
          <h1>Recover access without losing your Northstar work.</h1>
          <p>Your saved browser draft remains on the original computer. Resetting the account password does not delete the Customer Promise or other locally saved work.</p>
        </div>
        <div className="security-note"><ShieldCheck size={17} /> Password recovery is handled through Supabase Auth. QMSPilot administrators cannot view your password.</div>
      </section>

      <section className="reset-access">
        <div className="reset-card">
          <div className="card-head">
            <span>{mode === "complete" ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}</span>
            <div><small>QMSPILOT NORTHSTAR</small><h2>{mode === "update" ? "Choose a new password" : mode === "complete" ? "Password updated" : "Reset your password"}</h2></div>
          </div>

          {checkingLink ? (
            <div className="status-box">Checking the secure recovery link…</div>
          ) : mode === "request" ? (
            <form onSubmit={requestReset}>
              <p>Enter the email used for your Northstar demo account. We will send a secure reset link.</p>
              <label><span>Northstar account email</span><div className="field"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" /></div></label>
              {error && <div className="error" role="alert">{error}</div>}
              <button className="primary" type="submit" disabled={submitting || !supabase}>{submitting ? "Sending secure link…" : "Email password-reset link"}<ArrowRight size={17} /></button>
            </form>
          ) : mode === "email-sent" ? (
            <div className="message-state">
              <CheckCircle2 size={40} />
              <h3>Check your email</h3>
              <p>A secure password-reset link was requested for <strong>{email}</strong>. Open the message on the iPad or computer, then choose a new password.</p>
              <small>Check Spam or Junk if it is not in the inbox. The screen intentionally does not reveal whether an account exists for an email address.</small>
              <button type="button" onClick={() => setMode("request")}>Use a different email</button>
            </div>
          ) : mode === "update" ? (
            <form onSubmit={updatePassword}>
              <p>Create a new password with at least 12 characters. After it is saved, Northstar will return you to Delivery Assurance.</p>
              <label><span>New password</span><div className="field"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
              <label><span>Confirm new password</span><div className="field"><LockKeyhole size={17} /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Enter it again" /></div></label>
              {error && <div className="error" role="alert">{error}</div>}
              <button className="primary" type="submit" disabled={submitting}>{submitting ? "Updating password…" : "Set new password"}<ArrowRight size={17} /></button>
            </form>
          ) : (
            <div className="message-state success">
              <CheckCircle2 size={44} />
              <h3>Password updated</h3>
              <p>You are signed in. Returning to Delivery Assurance now…</p>
            </div>
          )}

          <a className="back" href={`/login?redirect=${encodeURIComponent(RETURN_PATH)}`}><ArrowLeft size={14} /> Return to sign in</a>
        </div>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.reset-shell{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(430px,.95fr);color:#142b40;background:#edf3f8;font-family:Inter,Arial,sans-serif}.reset-brand{min-height:100vh;display:flex;flex-direction:column;padding:34px 48px 32px;color:#fff;background:radial-gradient(circle at 78% 20%,rgba(26,117,211,.45),transparent 29%),linear-gradient(145deg,#041322,#082f52 58%,#0a66ff)}.logo-row{display:flex;gap:10px}.logo{height:58px;width:205px;display:flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:13px}.logo.qms{background:#fff}.logo.northstar{border:1px solid rgba(137,190,236,.28);background:#020914}.logo img{max-width:184px;max-height:45px}.brand-copy{max-width:760px;margin:auto 0}.brand-copy small{color:#94d0ff;font-size:10px;font-weight:950;letter-spacing:.14em}.brand-copy h1{margin:16px 0 15px;font-size:clamp(43px,5.2vw,73px);line-height:.99;letter-spacing:-.04em}.brand-copy p{max-width:710px;margin:0;color:#c9dff1;font-size:15px;line-height:1.7}.security-note{display:flex;align-items:center;gap:9px;margin-top:30px;color:#b8d0e3;font-size:10px}.security-note svg{color:#55d6a7}.reset-access{display:grid;place-items:center;padding:38px;background:linear-gradient(180deg,#f6f9fc,#eaf1f7)}.reset-card{width:min(485px,100%);padding:30px;border:1px solid #cddae6;border-radius:22px;background:#fff;box-shadow:0 30px 80px rgba(22,52,79,.16)}.card-head{display:flex;align-items:center;gap:12px}.card-head>span{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;color:#fff;background:linear-gradient(145deg,#073b70,#0a66ff)}.card-head small,.card-head h2{display:block;margin:0}.card-head small{color:#0a66ff;font-size:8px;font-weight:950;letter-spacing:.14em}.card-head h2{margin-top:4px;color:#15344f;font-size:22px}.reset-card form{display:grid;gap:15px;margin-top:22px}.reset-card form>p,.message-state p{margin:0;color:#687e92;font-size:11px;line-height:1.6}.reset-card label>span{display:block;margin-bottom:7px;color:#344f68;font-size:9px;font-weight:850}.field{height:48px;display:grid;grid-template-columns:35px 1fr auto;align-items:center;border:1px solid #ccd9e5;border-radius:11px;background:#f9fbfd}.field:focus-within{border-color:#6ea7df;box-shadow:0 0 0 4px rgba(10,102,255,.08);background:#fff}.field>svg{justify-self:center;color:#63819d}.field input{width:100%;height:100%;padding:0;border:0;outline:0;color:#183650;background:transparent;font-size:12px}.field button{width:40px;height:40px;display:grid;place-items:center;border:0;color:#617b91;background:transparent}.primary{min-height:49px;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:11px;color:#fff;background:linear-gradient(135deg,#073b70,#0a66ff);box-shadow:0 12px 28px rgba(10,102,255,.22);font-size:11px;font-weight:900}.primary:disabled{opacity:.55}.error{padding:11px 12px;border:1px solid #ecc5ca;border-radius:10px;color:#8e2f3a;background:#fff3f5;font-size:9px;line-height:1.5}.status-box{margin-top:22px;padding:16px;border:1px solid #cfe0ed;border-radius:12px;color:#536e84;background:#f5f9fc;font-size:11px}.message-state{display:grid;justify-items:center;gap:11px;margin-top:24px;padding:22px;border:1px solid #cfe3d9;border-radius:15px;background:#f3fbf7;text-align:center}.message-state>svg{color:#16835a}.message-state h3{margin:0;color:#173f31}.message-state strong{color:#254e70}.message-state small{color:#778b9c;font-size:9px;line-height:1.5}.message-state button{border:0;color:#0a66ff;background:transparent;font-size:9px;font-weight:900}.back{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:18px;padding-top:16px;border-top:1px solid #e6edf3;color:#0a66ff;text-decoration:none;font-size:9px;font-weight:850}@media(max-width:1000px){.reset-shell{grid-template-columns:1fr}.reset-brand{min-height:auto;padding:25px}.brand-copy{margin:65px 0 25px}.reset-access{padding:32px 15px 60px}}@media(max-width:560px){.logo-row{display:grid}.logo{width:190px}.brand-copy h1{font-size:41px}.reset-card{padding:23px}.reset-access{padding:22px 12px 45px}}
      `}</style>
    </main>
  );
}
