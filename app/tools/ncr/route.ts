import { NextResponse } from "next/server";

const NCR_URL = "https://qms-pilot-ncr-microtool-northstar.vercel.app";
const NORTHSTAR_ENDPOINT = "https://mcdxriothpcadqcaarui.supabase.co/functions/v1/northstar-ncr-ingest";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(NCR_URL, { cache: "no-store" });
  if (!response.ok) {
    return new NextResponse("Northstar could not open the NCR Microtool.", { status: 502 });
  }

  let html = await response.text();

  const injectedHead = `
  <style>
    body{padding-top:58px!important}
    .northstar-demo-bar{position:fixed;inset:0 0 auto 0;height:58px;z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 18px;background:linear-gradient(90deg,#06172b,#092f59);border-bottom:1px solid rgba(116,181,255,.35);box-shadow:0 8px 24px rgba(0,0,0,.24);color:#fff;font-family:Arial,Helvetica,sans-serif}
    .northstar-demo-left,.northstar-demo-right{display:flex;align-items:center;gap:12px}
    .northstar-demo-mark{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#0b5fc6,#62adff);font-weight:900}
    .northstar-demo-title strong,.northstar-demo-title span{display:block}.northstar-demo-title strong{font-size:14px}.northstar-demo-title span{margin-top:3px;color:#9fc4eb;font-size:10px}
    .northstar-demo-status{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(88,213,165,.35);border-radius:999px;background:rgba(35,145,104,.16);color:#b9f3dd;font-size:10px;font-weight:800}
    .northstar-demo-status i{width:7px;height:7px;border-radius:50%;background:#4bd39e;box-shadow:0 0 0 4px rgba(75,211,158,.12)}
    .northstar-demo-return{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.08);color:#fff;text-decoration:none;font-size:10px;font-weight:800}
    @media(max-width:650px){body{padding-top:68px!important}.northstar-demo-bar{height:68px;padding:0 10px}.northstar-demo-title span,.northstar-demo-status{display:none}.northstar-demo-return span{display:none}}
  </style>`;

  const injectedBody = `
  <div class="northstar-demo-bar">
    <div class="northstar-demo-left"><div class="northstar-demo-mark">N</div><div class="northstar-demo-title"><strong>Northstar Digital Toolbox</strong><span>NCR Microtool · Demo-connected workspace</span></div></div>
    <div class="northstar-demo-right"><span class="northstar-demo-status"><i></i>Connected to Northstar</span><a class="northstar-demo-return" href="/"><b>←</b><span>Return to Northstar</span></a></div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', function () {
      const configureNorthstar = () => {
        const setValue = (id, value) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.value = value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setValue('integrationMode', 'api');
        setValue('organizationId', 'qmspilot-demo');
        setValue('northstarUserId', 'northstar-demo-user');
        setValue('northstarEndpoint', '${NORTHSTAR_ENDPOINT}');

        ['organizationId','northstarUserId','northstarEndpoint','northstarToken','integrationMode'].forEach((id) => {
          const el = document.getElementById(id);
          const field = el && el.closest('.field');
          if (field) field.style.display = 'none';
        });

        const headings = Array.from(document.querySelectorAll('.section-title-wrap h3'));
        const heading = headings.find((node) => (node.textContent || '').includes('Northstar Integration'));
        const section = heading && heading.closest('.card');
        const note = section && section.querySelector('.integration-note');
        if (note) note.innerHTML = '<strong style="color:#7cc7ff">Connected through Northstar.</strong> Company, user, and receiving service are supplied automatically for this demo session.';
        if (typeof window.refreshAll === 'function') window.refreshAll();
      };

      const originalInitializeDefaults = window.initializeDefaults;
      if (typeof originalInitializeDefaults === 'function') {
        window.initializeDefaults = function (...args) {
          const result = originalInitializeDefaults.apply(this, args);
          setTimeout(configureNorthstar, 0);
          return result;
        };
      }

      setTimeout(configureNorthstar, 0);
      setTimeout(configureNorthstar, 150);

      document.addEventListener('click', function (event) {
        const button = event.target && event.target.closest ? event.target.closest('button') : null;
        const text = button ? (button.textContent || '').trim().toLowerCase() : '';
        if (text.includes('load demo') || text.includes('new ncr')) {
          setTimeout(configureNorthstar, 50);
          setTimeout(configureNorthstar, 250);
        }
      }, true);
    });
  </script>`;

  html = html.replace("</head>", `${injectedHead}</head>`).replace("<body>", `<body>${injectedBody}`);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
