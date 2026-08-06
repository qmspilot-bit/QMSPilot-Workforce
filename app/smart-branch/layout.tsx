import type { ReactNode } from "react";
import SmartBranchCloudControl from "@/components/smart-branch-cloud-control";

export default function SmartBranchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SmartBranchCloudControl />
      {children}
    </>
  );
}
