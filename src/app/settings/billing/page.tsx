import { redirect } from "next/navigation";

// Billing was removed from the app; old links go to Settings.
export default function BillingSettingsPage() {
  redirect("/settings");
}
