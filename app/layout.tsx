import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CloudWorkspaceProvider } from "@/components/cloud-workspace";
import { NorthstarApplicationChrome } from "@/components/northstar-application-chrome";
import { NorthstarMotionSystem } from "@/components/northstar-motion-system";
import { NorthstarPhotographicBrandSync } from "@/components/northstar-photographic-brand-sync";
import { NorthstarNavigationSync } from "@/components/northstar-navigation-sync";
import { ProcessAssuranceCloudBridge } from "@/components/process-assurance-cloud-bridge";
import { SixSPlatformSync } from "@/components/six-s-platform-sync";

export const metadata: Metadata = {
  title: "Northstar | QMSPilot Workforce",
  description: "QMSPilot Northstar executive intelligence, smart workspaces, AI workforce, accountability, and closed-loop execution.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CloudWorkspaceProvider>
          <NorthstarMotionSystem />
          <NorthstarPhotographicBrandSync />
          <NorthstarNavigationSync />
          <SixSPlatformSync />
          <NorthstarApplicationChrome />
          {children}
          <ProcessAssuranceCloudBridge />
        </CloudWorkspaceProvider>
      </body>
    </html>
  );
}
