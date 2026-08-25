"use client";

import { usePathname } from "next/navigation";
import { NorthstarAccountControl } from "@/components/northstar-account-control";
import { NorthstarToolActionInbox } from "@/components/northstar-tool-action-inbox";

export function NorthstarApplicationChrome() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <>
      <NorthstarToolActionInbox />
      <NorthstarAccountControl />
    </>
  );
}
