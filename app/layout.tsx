import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CloudWorkspaceProvider } from "@/components/cloud-workspace";
import { NorthstarDashboardLauncher } from "@/components/northstar-dashboard-launcher";
import { NorthstarToolboxLauncher } from "@/components/northstar-toolbox-launcher";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";
import { NorthstarWorkforceLauncher } from "@/components/northstar-workforce-launcher";
import { ProcessAssuranceCloudBridge } from "@/components/process-assurance-cloud-bridge";

export const metadata: Metadata = {
  title: "Northstar | QMSPilot Workforce",
  description: "QMSPilot Northstar mission control, AI workforce, digital toolbox, accountability dashboard, and closed-loop execution.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CloudWorkspaceProvider>
          {children}
          <NorthstarToolActionInbox />
          <NorthstarWorkforceLauncher />
          <NorthstarDashboardLauncher />
          <NorthstarToolboxLauncher />
          <ProcessAssuranceCloudBridge />
        </CloudWorkspaceProvider>
      </body>
    </html>
  );
}
