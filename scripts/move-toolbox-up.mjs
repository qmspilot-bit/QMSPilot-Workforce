import fs from "node:fs";

const path = "app/page.tsx";
let source = fs.readFileSync(path, "utf8");

source = source.replace("\n          <DigitalToolbox />\n        </div>", "\n        </div>");

const marker = `          <section className="page-intro">\n            <div><p className="eyebrow">AI Chief of Staff · MVP 01</p><h1>Good work starts with a clear mission.</h1><p>Give Pilot the evidence. Get back the gaps, risks, decisions, owners, due dates, and executive action brief.</p></div>\n            <div className="approval-note"><ShieldCheck /><div><strong>You remain the decision-maker.</strong><span>Pilot prepares and recommends. Nothing external happens without approval.</span></div></div>\n          </section>\n`;

if (!source.includes(marker)) {
  throw new Error("Could not find Mission Control intro marker.");
}

source = source.replace(marker, `${marker}\n          <DigitalToolbox />\n`);

fs.writeFileSync(path, source);
