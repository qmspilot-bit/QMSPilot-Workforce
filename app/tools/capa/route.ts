import { NextResponse } from "next/server";

const CAPA_URL = process.env.NEXT_PUBLIC_CAPA_APP_URL
  || "https://qmspilot-bit.github.io/QMSPilot-Corrective-Action-CAPA-Northstar/";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = await fetch(CAPA_URL, { cache: "no-store" });
  if (!response.ok) return new NextResponse("Northstar could not open the CAPA application.", { status: 502 });

  let html = await response.text();
  const origin = new URL(request.url).origin;
  const baseHref = CAPA_URL.endsWith("/") ? CAPA_URL : `${CAPA_URL}/`;

  const injectedHead = `
  <base href="${baseHref}">
  <style>
    body{padding-top:62px!important}
    .northstar-closed-loop-bar{position:fixed;inset:0 0 auto 0;height:62px;z-index:99999;display:flex;align-items:center;gap:14px;padding:0 18px;background:linear-gradient(90deg,#06172b,#0a396b);border-bottom:1px solid rgba(116,181,255,.38);box-shadow:0 9px 26px rgba(0,0,0,.28);color:#fff;font-family:Inter,Arial,sans-serif}
    .northstar-closed-loop-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,#0a66ff,#7fdbff);font-weight:950}
    .northstar-closed-loop-copy{margin-right:auto}.northstar-closed-loop-copy strong,.northstar-closed-loop-copy span{display:block}.northstar-closed-loop-copy span{margin-top:3px;color:#a7cbed;font-size:10px}
    .northstar-loop-status{padding:8px 11px;border:1px solid rgba(75,211,158,.38);border-radius:999px;background:rgba(35,145,104,.18);color:#c9f7e6;font-size:10px;font-weight:850}
    .northstar-loop-return,.northstar-loop-actions{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-size:10px;font-weight:850}
    .northstar-loop-actions{cursor:pointer;background:#0a66ff}
    .northstar-action-drawer{position:fixed;right:18px;top:76px;z-index:100000;width:min(430px,calc(100vw - 36px));max-height:calc(100vh - 94px);overflow:auto;padding:16px;border:1px solid #315f89;border-radius:18px;background:#071829;color:#fff;box-shadow:0 26px 80px rgba(0,0,0,.52);font-family:Inter,Arial,sans-serif;display:none}
    .northstar-action-drawer.open{display:block}.northstar-action-drawer h3{margin:0 0 6px}.northstar-action-drawer>p{margin:0 0 14px;color:#9fc0dc;font-size:12px;line-height:1.5}
    .northstar-action-card{margin-top:10px;padding:13px;border:1px solid #284a68;border-radius:13px;background:#0c2238}.northstar-action-card strong,.northstar-action-card small{display:block}.northstar-action-card small{margin-top:5px;color:#a7bdd1;line-height:1.45}.northstar-action-card .meta{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}.northstar-action-card .meta span{padding:4px 7px;border-radius:999px;background:#143454;color:#cce5fa;font-size:9px;font-weight:800}.northstar-action-card button{margin:5px 5px 0 0;padding:8px 10px;border:0;border-radius:8px;color:#fff;background:#145ea8;font-size:10px;font-weight:850}.northstar-action-card button.done{background:#16835a}.northstar-action-card button.block{background:#8a5a16}
    @media(max-width:720px){body{padding-top:72px!important}.northstar-closed-loop-bar{height:72px;padding:0 10px}.northstar-loop-status,.northstar-closed-loop-copy span{display:none}.northstar-loop-return span{display:none}}
  </style>`;

  const injectedBody = `
  <div class="northstar-closed-loop-bar">
    <div class="northstar-closed-loop-mark">N</div>
    <div class="northstar-closed-loop-copy"><strong>QMSPilot Northstar · Closed-Loop CAPA</strong><span>CAPA submission, Intelligence Bus routing, approved writeback, and evidence-based closure</span></div>
    <span class="northstar-loop-status">● Intelligence Bus connected</span>
    <button type="button" class="northstar-loop-actions" id="northstarActionButton">Actions <b id="northstarActionCount">0</b></button>
    <a class="northstar-loop-return" href="/"><b>←</b><span>Return to Northstar</span></a>
  </div>
  <aside class="northstar-action-drawer" id="northstarActionDrawer"><h3>Northstar actions</h3><p>Human-approved actions written directly into this CAPA context.</p><div id="northstarActionList">Sign in to Northstar Secure to load controlled actions.</div></aside>
  <script>
    (function(){
      const endpoint='${origin}/api/adapters/capa';
      const actionEndpoint='${origin}/api/closed-loop/tool-actions';
      function token(){
        try{
          for(let i=0;i<localStorage.length;i+=1){
            const key=localStorage.key(i)||'';
            if(!key.startsWith('sb-')||!key.endsWith('-auth-token')) continue;
            const parsed=JSON.parse(localStorage.getItem(key)||'{}');
            const value=parsed.access_token||parsed.currentSession?.access_token||parsed.session?.access_token;
            if(value) return value;
          }
        }catch(e){}
        return '';
      }
      function setValue(name,value){
        const el=document.querySelector('[name="'+name+'"]')||document.getElementById(name);
        if(!el)return;
        el.value=value;
        el.dispatchEvent(new Event('change',{bubbles:true}));
      }
      function configure(){
        setValue('integrationMode','Direct API');
        setValue('apiEndpoint',endpoint);
        const pill=document.getElementById('connectionPill');
        if(pill)pill.textContent=token()?'Northstar Secure connected':'Sign in to Northstar Secure';
      }
      async function loadActions(){
        const list=document.getElementById('northstarActionList');
        const count=document.getElementById('northstarActionCount');
        const accessToken=token();
        if(!accessToken){list.textContent='Sign in to Northstar Secure to load controlled actions.';count.textContent='0';return;}
        const record=(document.querySelector('[name="capaNumber"]')||{}).value||'';
        const url=actionEndpoint+'?tool=capa'+(record?'&record='+encodeURIComponent(record):'');
        const response=await fetch(url,{headers:{Authorization:'Bearer '+accessToken}});
        const payload=await response.json();
        if(!response.ok){list.textContent=payload.error||'Actions could not be loaded.';return;}
        const actions=payload.actions||[];count.textContent=String(actions.filter(a=>!['done','rejected'].includes(a.action_status)).length);
        list.innerHTML=actions.length?actions.map(a=>'<article class="northstar-action-card"><strong>'+escapeHtml(a.title)+'</strong><small>'+escapeHtml(a.verification_required||'Verification requirement not supplied')+'</small><div class="meta"><span>'+escapeHtml(a.priority)+'</span><span>'+escapeHtml(a.action_status.replaceAll('_',' '))+'</span><span>'+escapeHtml(a.owner_name||'Owner pending')+'</span><span>'+escapeHtml(a.due_date||'No due date')+'</span></div><button onclick="window.northstarUpdateAction(\''+a.id+'\',\'in_progress\')">Start</button><button class="block" onclick="window.northstarUpdateAction(\''+a.id+'\',\'blocked\')">Block</button><button class="done" onclick="window.northstarUpdateAction(\''+a.id+'\',\'done\')">Complete</button></article>').join(''):'No actions have been written into this CAPA record.';
      }
      function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
      window.northstarUpdateAction=async function(id,status){
        const note=prompt(status==='done'?'Document objective verification and closure evidence:':'Add a controlled progress note:','');
        if(!note)return;
        const response=await fetch(actionEndpoint,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({id,status,note})});
        const payload=await response.json();
        if(!response.ok){alert(payload.error||'Action could not be updated.');return;}
        await loadActions();
      };
      document.addEventListener('DOMContentLoaded',function(){
        configure();setTimeout(configure,150);setTimeout(configure,500);
        document.getElementById('northstarActionButton')?.addEventListener('click',function(){document.getElementById('northstarActionDrawer')?.classList.toggle('open');loadActions();});
        document.querySelector('[name="capaNumber"]')?.addEventListener('change',loadActions);
        loadActions();
      });
    })();
  </script>`;

  if (!html.includes("<base ")) html = html.replace("<head>", `<head>${injectedHead}`);
  else html = html.replace("</head>", `${injectedHead}</head>`);
  html = html.replace("<body>", `<body>${injectedBody}`);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
