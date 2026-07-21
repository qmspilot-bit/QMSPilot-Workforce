import type { Metadata } from "next";
import "./globals.css";
import "./toolbox.css";
import { CloudWorkspaceProvider } from "@/components/cloud-workspace";
import { DigitalToolbox } from "@/components/digital-toolbox";

export const metadata: Metadata = {
  title: "Northstar | QMSPilot Workforce",
  description: "QMSPilot Northstar mission control, AI workforce, and digital toolbox.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CloudWorkspaceProvider>
          {children}
          <DigitalToolbox />
        </CloudWorkspaceProvider>
      </body>
    </html>
  );
}
