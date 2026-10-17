import { SetupPasswordForm } from "@/features/auth/components/setup-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Password | Stock Management",
  description: "Create your secure account password",
};

export default function SetupPasswordPage() {
  return <SetupPasswordForm />;
}
