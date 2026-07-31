"use client";

import { usePathname } from "next/navigation";
import { NorthstarAccountControl } from "@/components/northstar-account-control";
import { NorthstarDashboardLauncher } from "@/components/northstar-dashboard-launcher";
import { NorthstarToolboxLauncher } from "@/components/northstar-toolbox-launcher";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";
import { NorthstarWorkforceLauncher } from "@/components/northstar-workforce-launcher";

export function NorthstarApplicationChrome() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <>
      <NorthstarAccountControl />
      <NorthstarToolActionInbox />
      <NorthstarWorkforceLauncher />
      <NorthstarDashboardLauncher />
      <NorthstarToolboxLauncher />
    </>
  );
}
