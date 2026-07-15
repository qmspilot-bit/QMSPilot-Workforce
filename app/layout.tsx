import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilot | QMSPilot Workforce",
  description: "AI Chief of Staff for operational accountability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
