import { redirect } from "next/navigation";

export default function AlertsRedirect() {
  redirect("/settings?tab=alerts");
}
