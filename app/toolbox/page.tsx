import { DigitalToolbox } from "@/components/digital-toolbox";

export const metadata = {
  title: "Digital Toolbox | QMSPilot Northstar",
  description: "Launch Northstar production applications from the QMSPilot Workforce.",
};

export default function ToolboxPage() {
  return (
    <main className="standalone-toolbox-page">
      <div className="standalone-toolbox-shell">
        <div className="standalone-toolbox-intro">
          <p className="eyebrow">QMSPilot Northstar</p>
          <h1>Digital Toolbox</h1>
          <p>
            Launch controlled quality applications directly from the Workforce with shared
            context, workforce routing, and submission back to Northstar.
          </p>
          <a className="standalone-toolbox-back" href="/">← Back to Mission Control</a>
        </div>
        <DigitalToolbox />
      </div>
    </main>
  );
}
