import type { ReactNode } from "react";
import SmartBranchSync from "@/components/smart-branch-sync";

export default function SmartBranchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SmartBranchSync />
      {children}
    </>
  );
}
