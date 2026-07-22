import { redirect } from "next/navigation";

export default function ToolboxRoute() {
  redirect("/?toolbox=open");
}
