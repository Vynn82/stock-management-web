"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredAuth } from "@/lib/auth/session";

// Opens the dashboard when a saved login exists, otherwise the sign-in page.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const saved = getStoredAuth();
    const signedIn = Boolean(saved?.accessToken || saved?.token) && !saved?.mustChangePassword;
    router.replace(signedIn ? "/dashboard" : "/auth/login");
  }, [router]);

  return null;
}
