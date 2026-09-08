import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Stock Management",
  description: "Sign in to access stock and staff management",
};

export default function LoginPage() {
  return <LoginForm />;
}
