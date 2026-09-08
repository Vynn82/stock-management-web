"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleLogout() {
    logout();
    router.push(ROUTES.LOGIN);
  }

  const fullName = mounted
    ? [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.name ||
      user?.staffId ||
      user?.email ||
      "Staff Member"
    : "Staff Member";

  const staffCode =
    mounted && user?.staffId && (user?.firstName || user?.name)
      ? ` (${user.staffId})`
      : "";

  const staffDisplayName = `${fullName}${staffCode}`;
  const roleDisplayName = mounted
    ? user?.role || user?.roles?.[0] || "Staff"
    : "Staff";

  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "var(--bg-header)",
        backdropFilter: "blur(12px)",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ fontSize: 14, color: "var(--text-sub)" }}>
        Welcome back,{" "}
        <strong suppressHydrationWarning style={{ color: "var(--text-main)" }}>
          {staffDisplayName}
        </strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ThemeToggle />

        <span
          suppressHydrationWarning
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(34, 197, 94, 0.12)",
            color: "#16a34a",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          {roleDisplayName}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-sub)",
            padding: "6px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.15s ease",
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
