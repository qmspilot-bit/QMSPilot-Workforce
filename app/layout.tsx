import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CloudWorkspaceProvider } from "@/components/cloud-workspace";
import { NorthstarAccountControl } from "@/components/northstar-account-control";
import { NorthstarPhotographicBrandSync } from "@/components/northstar-photographic-brand-sync";
import { NorthstarDashboardLauncher } from "@/components/northstar-dashboard-launcher";
import { NorthstarNavigationSync } from "@/components/northstar-navigation-sync";
import { NorthstarToolboxLauncher } from "@/components/northstar-toolbox-launcher";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";
import { NorthstarWorkforceLauncher } from "@/components/northstar-workforce-launcher";
import { ProcessAssuranceCloudBridge } from "@/components/process-assurance-cloud-bridge";

export const metadata: Metadata = {
  title: "Northstar | QMSPilot Workforce",
  description: "QMSPilot Northstar executive intelligence, smart workspaces, AI workforce, accountability, and closed-loop execution.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CloudWorkspaceProvider>
          <NorthstarPhotographicBrandSync />
          <NorthstarNavigationSync />
          <NorthstarAccountControl />
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
