"use client";

import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NORTHSTAR_LOGO_DATA_URI, QMSPILOT_LOGO_DATA_URI } from "@/lib/northstar-brand-assets";

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [signup, setSignup] = useState(false);
  const [redirect, setRedirect] = useState("/");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const target = safeRedirect(new URLSearchParams(window.location.search).get("redirect"));
    setRedirect(target);
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => { if (data.user) window.location.replace(target); });
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (!supabase) return setError("Secure cloud authentication is not configured for this deployment.");
    if (!email.trim() || !password) return setError("Enter your work email and password.");
    if (signup && !company.trim()) return setError("Enter your company name.");
    setSubmitting(true);
    if (signup) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { company_name: company.trim() } } });
      if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }
      if (data.session) window.location.assign(redirect);
      else { setNotice("Account created. Check your email to confirm your account, then sign in."); setSignup(false); setSubmitting(false); }
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) { setError(signInError.message); setSubmitting(false); return; }
    window.location.assign(redirect);
  }

  const recoveryHref = `/reset-password?email=${encodeURIComponent(email.trim())}&return=${encodeURIComponent(redirect)}`;

  return (
    <main className="northstar-login-shell">
      <section className="northstar-login-brand">
        <div className="northstar-login-logo-row"><div className="northstar-login-logo qms"><img src={QMSPILOT_LOGO_DATA_URI} alt="QMSPilot" /></div><div className="northstar-login-logo ns"><img src={NORTHSTAR_LOGO_DATA_URI} alt="Northstar" /></div></div>
        <div className="northstar-login-message"><small>ENTERPRISE QUALITY EXECUTION</small><h1>One secure identity across every Northstar workspace.</h1><p>Sign in once to carry your organization, site, role, permissions, approvals, and controlled-record accountability throughout the platform.</p></div>
        <div className="northstar-login-assurances"><div><ShieldCheck size={20} /><span><strong>Controlled access</strong><small>Identity and authorization remain separate from AI recommendations.</small></span></div><div><Building2 size={20} /><span><strong>Tenant-aware context</strong><small>Northstar preserves the active company, site, and workspace.</small></span></div><div><CheckCircle2 size={20} /><span><strong>Verified accountability</strong><small>Actions retain ownership, evidence, decisions, and closure history.</small></span></div></div>
        <div className="northstar-login-boundary"><LockKeyhole size={16} /> Human authority remains mandatory for approvals, releases, commitments, and record closure.</div>
      </section>
      <section className="northstar-login-access"><div className="northstar-login-card">
        <div className="northstar-login-card-head"><span><LockKeyhole size={21} /></span><div><small>QMSPILOT NORTHSTAR</small><h2>{signup ? "Create your workspace" : "Secure workspace access"}</h2></div></div>
        <p className="northstar-login-intro">{signup ? "Create a secure company workspace with isolated data." : "Use the work email assigned to your Northstar account."}</p>
        <form onSubmit={handleSubmit}>
          {signup && <label><span>Company name</span><div className="northstar-login-field"><Building2 size={17} /><input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="Your company" /></div></label>}
          <label><span>Work email</span><div className="northstar-login-field"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@company.com" /></div></label>
          <label><span>Password</span><div className="northstar-login-field"><LockKeyhole size={17} /><input type={showPassword?"text":"password"} autoComplete={signup?"new-password":"current-password"} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={signup?"Create a password":"Enter your password"} /><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
          {!signup && <div className="northstar-login-help"><a href={recoveryHref}>Forgot password?</a></div>}
          {error && <div className="northstar-login-error" role="alert">{error}</div>}{notice && <div className="northstar-login-notice">{notice}</div>}
          <button className="northstar-login-submit" type="submit" disabled={submitting||!supabase}>{submitting?(signup?"Creating workspace…":"Authenticating…"):(signup?"Create account":"Sign in to Northstar")} {!submitting&&supabase&&<ArrowRight size={17}/>}</button>
        </form>
        <div className="northstar-login-account">{signup?"Already have an account?":"New to QMSPilot Northstar?"} <button type="button" onClick={()=>{setSignup(v=>!v);setError("");setNotice("");}}>{signup?"Sign in":"Create an account"}</button></div>
        <div className="northstar-login-foot"><ShieldCheck size={14}/><span>Your credentials are processed by the configured Supabase Auth service. Northstar does not display passwords to administrators.</span></div>
      </div></section>
      <style jsx>{`
*{box-sizing:border-box}.northstar-login-shell{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(440px,.92fr);color:#142b40;background:#edf3f8;font-family:Inter,Arial,sans-serif}.northstar-login-brand{min-height:100vh;display:flex;flex-direction:column;padding:34px 48px 32px;color:#fff;background:radial-gradient(circle at 80% 18%,rgba(21,111,204,.43),transparent 28%),linear-gradient(145deg,#041322,#082f52 58%,#0a66ff)}.northstar-login-logo-row{display:flex;gap:10px}.northstar-login-logo{height:58px;display:flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:13px}.northstar-login-logo.qms{width:205px;background:#fff}.northstar-login-logo.ns{width:205px;border:1px solid rgba(137,190,236,.28);background:#020914}.northstar-login-logo img{max-width:184px;max-height:45px}.northstar-login-message{max-width:770px;margin:auto 0}.northstar-login-message>small{color:#94d0ff;font-size:10px;font-weight:950;letter-spacing:.14em}.northstar-login-message h1{margin:16px 0 15px;font-size:clamp(43px,5.5vw,76px);line-height:.98;letter-spacing:-.045em}.northstar-login-message p{max-width:720px;margin:0;color:#c9dff1;font-size:15px;line-height:1.7}.northstar-login-assurances{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:34px}.northstar-login-assurances>div{display:grid;grid-template-columns:32px 1fr;gap:9px;padding:14px;border:1px solid rgba(139,191,235,.25);border-radius:14px;background:rgba(6,31,54,.42)}.northstar-login-assurances svg{color:#6ec3ff}.northstar-login-assurances strong,.northstar-login-assurances small{display:block}.northstar-login-assurances strong{font-size:10px}.northstar-login-assurances small{margin-top:5px;color:#a9c4da;font-size:8px;line-height:1.45}.northstar-login-boundary{display:flex;align-items:center;gap:8px;margin-top:20px;color:#a9c4da;font-size:9px}.northstar-login-boundary svg{color:#55d6a7}.northstar-login-access{display:grid;place-items:center;padding:38px;background:linear-gradient(180deg,#f6f9fc,#eaf1f7)}.northstar-login-card{width:min(470px,100%);padding:30px;border:1px solid #cddae6;border-radius:22px;background:#fff;box-shadow:0 30px 80px rgba(22,52,79,.16)}.northstar-login-card-head{display:flex;align-items:center;gap:12px}.northstar-login-card-head>span{width:48px;height:48px;display:grid;place-items:center;border-radius:13px;color:#fff;background:linear-gradient(145deg,#073b70,#0a66ff)}.northstar-login-card-head small,.northstar-login-card-head h2{display:block;margin:0}.northstar-login-card-head small{color:#0a66ff;font-size:8px;font-weight:950;letter-spacing:.14em}.northstar-login-card-head h2{margin-top:4px;color:#15344f;font-size:22px}.northstar-login-intro{margin:20px 0;color:#687e92;font-size:11px}.northstar-login-card form{display:grid;gap:15px}.northstar-login-card label>span{display:block;margin-bottom:7px;color:#344f68;font-size:9px;font-weight:850}.northstar-login-field{height:48px;display:grid;grid-template-columns:35px 1fr auto;align-items:center;border:1px solid #ccd9e5;border-radius:11px;background:#f9fbfd}.northstar-login-field:focus-within{border-color:#6ea7df;box-shadow:0 0 0 4px rgba(10,102,255,.08);background:#fff}.northstar-login-field>svg{justify-self:center;color:#63819d}.northstar-login-field input{width:100%;height:100%;padding:0;border:0;outline:0;color:#183650;background:transparent;font-size:12px}.northstar-login-field button{width:40px;height:40px;display:grid;place-items:center;border:0;color:#617b91;background:transparent}.northstar-login-help{display:flex;justify-content:flex-end;margin-top:-6px}.northstar-login-help a{color:#0a66ff;font-size:9px;font-weight:900;text-decoration:none}.northstar-login-error,.northstar-login-notice{padding:11px 12px;border-radius:10px;font-size:9px;line-height:1.5}.northstar-login-error{border:1px solid #ecc5ca;color:#8e2f3a;background:#fff3f5}.northstar-login-notice{border:1px solid #b9ddcf;color:#176044;background:#effbf6}.northstar-login-submit{min-height:49px;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:3px;border:0;border-radius:11px;color:#fff;background:linear-gradient(135deg,#073b70,#0a66ff);box-shadow:0 12px 28px rgba(10,102,255,.22);font-size:11px;font-weight:900}.northstar-login-submit:disabled{opacity:.52}.northstar-login-account{text-align:center;margin-top:16px;color:#687e92;font-size:10px}.northstar-login-account button{border:0;background:transparent;color:#0a66ff;font:inherit;font-weight:900;cursor:pointer}.northstar-login-foot{display:flex;align-items:flex-start;gap:7px;margin-top:18px;padding-top:16px;border-top:1px solid #e6edf3;color:#788b9d;font-size:8px;line-height:1.5}.northstar-login-foot svg{flex:0 0 auto;color:#17815c}@media(max-width:1050px){.northstar-login-shell{grid-template-columns:1fr}.northstar-login-brand{min-height:auto;padding:25px}.northstar-login-message{margin:70px 0 20px}.northstar-login-assurances{grid-template-columns:1fr}.northstar-login-access{padding:35px 18px 60px}}@media(max-width:560px){.northstar-login-logo-row{display:grid}.northstar-login-logo.qms,.northstar-login-logo.ns{width:190px}.northstar-login-message h1{font-size:43px}.northstar-login-card{padding:23px}.northstar-login-access{padding:24px 12px 45px}}
`}</style>
    </main>
  );
}
