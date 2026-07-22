import { NextResponse } from "next/server";

const NCR_URL = process.env.NEXT_PUBLIC_NCR_APP_URL || "https://qms-pilot-ncr-microtool-northstar.vercel.app";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = await fetch(NCR_URL, { cache: "no-store" });
  if (!response.ok) return new NextResponse("Northstar could not open the NCR Microtool.", { status: 502 });

  let html = await response.text();
  const origin = new URL(request.url).origin;
  const adapterEndpoint = `${origin}/api/adapters/ncr`;
  const actionEndpoint = `${origin}/api/closed-loop/tool-actions`;

  const injectedHead = `
  <style>
    body{padding-top:62px!important}
    .northstar-demo-bar{position:fixed;inset:0 0 auto 0;height:62px;z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 18px;background:linear-gradient(90deg,#06172b,#092f59);border-bottom:1px solid rgba(116,181,255,.35);box-shadow:0 8px 24px rgba(0,0,0,.24);color:#fff;font-family:Arial,Helvetica,sans-serif}
    .northstar-demo-left,.northstar-demo-right{display:flex;align-items:center;gap:12px}.northstar-demo-left{min-width:0}
    .northstar-demo-mark{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#0a66ff,#7fdbff);font-weight:900}
    .northstar-demo-title strong,.northstar-demo-title span{display:block}.northstar-demo-title strong{font-size:14px}.northstar-demo-title span{margin-top:3px;color:#9fc4eb;font-size:10px}
    .northstar-demo-status{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(88,213,165,.35);border-radius:999px;background:rgba(35,145,104,.16);color:#b9f3dd;font-size:10px;font-weight:800}
    .northstar-demo-return,.northstar-action-button{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-size:10px;font-weight:800}.northstar-action-button{border:0;background:#0a66ff;cursor:pointer}
    .northstar-action-drawer{position:fixed;right:18px;top:76px;z-index:100000;width:min(430px,calc(100vw - 36px));max-height:calc(100vh - 94px);overflow:auto;padding:16px;border:1px solid #315f89;border-radius:18px;background:#071829;color:#fff;box-shadow:0 26px 80px rgba(0,0,0,.52);font-family:Arial,sans-serif;display:none}.northstar-action-drawer.open{display:block}
    .northstar-action-drawer h3{margin:0 0 6px}.northstar-action-drawer>p{margin:0 0 14px;color:#9fc0dc;font-size:12px;line-height:1.5}.northstar-action-card{margin-top:10px;padding:13px;border:1px solid #284a68;border-radius:13px;background:#0c2238}.northstar-action-card strong,.northstar-action-card small{display:block}.northstar-action-card small{margin-top:5px;color:#a7bdd1;line-height:1.45}.northstar-action-card .meta{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}.northstar-action-card .meta span{padding:4px 7px;border-radius:999px;background:#143454;color:#cce5fa;font-size:9px;font-weight:800}.northstar-action-card button{margin:5px 5px 0 0;padding:8px 10px;border:0;border-radius:8px;color:#fff;background:#145ea8;font-size:10px;font-weight:850}.northstar-action-card button.done{background:#16835a}.northstar-action-card button.block{background:#8a5a16}
    @media(max-width:700px){body{padding-top:72px!important}.northstar-demo-bar{height:72px;padding:0 10px}.northstar-demo-title span,.northstar-demo-status{display:none}.northstar-demo-return span{display:none}}
  </style>`;

  const injectedBody = `
  <div class="northstar-demo-bar">
    <div class="northstar-demo-left"><div class="northstar-demo-mark">N</div><div class="northstar-demo-title"><strong>Northstar Closed-Loop NCR</strong><span>Nonconformance · Intelligence Bus · approved action writeback</span></div></div>
    <div class="northstar-demo-right"><span class="northstar-demo-status">● Connected</span><button type="button" class="northstar-action-button" id="northstarActionButton">Actions <b id="northstarActionCount">0</b></button><a class="northstar-demo-return" href="/"><b>←</b><span>Return to Northstar</span></a></div>
  </div>
  <aside class="northstar-action-drawer" id="northstarActionDrawer"><h3>Northstar actions</h3><p>Human-approved actions written directly into this NCR context.</p><div id="northstarActionList">Sign in to Northstar Secure to load controlled actions.</div></aside>
  <script>
    window.addEventListener('DOMContentLoaded', function () {
      function token(){
        try{for(let i=0;i<localStorage.length;i+=1){const key=localStorage.key(i)||'';if(!key.startsWith('sb-')||!key.endsWith('-auth-token'))continue;const parsed=JSON.parse(localStorage.getItem(key)||'{}');const value=parsed.access_token||parsed.currentSession?.access_token||parsed.session?.access_token;if(value)return value;}}catch(e){}
        return '';
      }
      const setValue=(id,value)=>{const el=document.getElementById(id);if(!el)return;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
      const configureNorthstar=()=>{
        setValue('integrationMode','api');setValue('northstarEndpoint','${adapterEndpoint}');setValue('northstarToken',token());
        ['organizationId','northstarUserId','northstarEndpoint','northstarToken','integrationMode'].forEach((id)=>{const el=document.getElementById(id);const field=el&&el.closest('.field');if(field)field.style.display='none';});
        const headings=Array.from(document.querySelectorAll('.section-title-wrap h3'));const heading=headings.find((node)=>(node.textContent||'').includes('Northstar Integration'));const section=heading&&heading.closest('.card');const note=section&&section.querySelector('.integration-note');if(note)note.innerHTML='<strong style="color:#7cc7ff">Connected to the Northstar Closed-Loop Execution Engine.</strong> NCR submission creates an Intelligence Bus event and routes the supervised AI workforce.';
        if(typeof window.refreshAll==='function')window.refreshAll();
      };
      function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
      async function loadActions(){
        const list=document.getElementById('northstarActionList');const count=document.getElementById('northstarActionCount');const accessToken=token();if(!accessToken){list.textContent='Sign in to Northstar Secure to load controlled actions.';count.textContent='0';return;}
        const record=(document.getElementById('ncrNumber')||document.querySelector('[name="ncrNumber"]')||{}).value||'';
        const response=await fetch('${actionEndpoint}?tool=ncr'+(record?'&record='+encodeURIComponent(record):''),{headers:{Authorization:'Bearer '+accessToken}});const payload=await response.json();if(!response.ok){list.textContent=payload.error||'Actions could not be loaded.';return;}
        const actions=payload.actions||[];count.textContent=String(actions.filter(a=>!['done','rejected'].includes(a.action_status)).length);list.innerHTML=actions.length?actions.map(a=>'<article class="northstar-action-card"><strong>'+escapeHtml(a.title)+'</strong><small>'+escapeHtml(a.verification_required||'Verification requirement not supplied')+'</small><div class="meta"><span>'+escapeHtml(a.priority)+'</span><span>'+escapeHtml(a.action_status.replaceAll('_',' '))+'</span><span>'+escapeHtml(a.owner_name||'Owner pending')+'</span><span>'+escapeHtml(a.due_date||'No due date')+'</span></div><button onclick="window.northstarUpdateNcrAction(\''+a.id+'\',\'in_progress\')">Start</button><button class="block" onclick="window.northstarUpdateNcrAction(\''+a.id+'\',\'blocked\')">Block</button><button class="done" onclick="window.northstarUpdateNcrAction(\''+a.id+'\',\'done\')">Complete</button></article>').join(''):'No actions have been written into this NCR record.';
      }
      window.northstarUpdateNcrAction=async function(id,status){const note=prompt(status==='done'?'Document objective verification and closure evidence:':'Add a controlled progress note:','');if(!note)return;const response=await fetch('${actionEndpoint}',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({id,status,note})});const payload=await response.json();if(!response.ok){alert(payload.error||'Action could not be updated.');return;}await loadActions();};
      const originalInitializeDefaults=window.initializeDefaults;if(typeof originalInitializeDefaults==='function'){window.initializeDefaults=function(...args){const result=originalInitializeDefaults.apply(this,args);setTimeout(configureNorthstar,0);return result;};}
      configureNorthstar();setTimeout(configureNorthstar,150);setTimeout(configureNorthstar,500);
      document.addEventListener('click',function(event){const button=event.target&&event.target.closest?event.target.closest('button'):null;const text=button?(button.textContent||'').trim().toLowerCase():'';if(text.includes('load demo')||text.includes('new ncr')){setTimeout(configureNorthstar,50);setTimeout(configureNorthstar,250);setTimeout(loadActions,350);}},true);
      document.getElementById('northstarActionButton')?.addEventListener('click',function(){document.getElementById('northstarActionDrawer')?.classList.toggle('open');loadActions();});
      loadActions();
    });
  </script>`;

  html = html.replace("</head>", `${injectedHead}</head>`).replace("<body>", `<body>${injectedBody}`);
  return new NextResponse(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
