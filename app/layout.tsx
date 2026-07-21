import type { Metadata } from "next";
import "./globals.css";
import { CloudWorkspaceProvider } from "@/components/cloud-workspace";
import { NorthstarToolboxLauncher } from "@/components/northstar-toolbox-launcher";

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
          <NorthstarToolboxLauncher />
        </CloudWorkspaceProvider>
      </body>
    </html>
  );
}
