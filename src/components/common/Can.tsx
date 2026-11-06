"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasAnyPermission } from "@/lib/auth/permissions";

/**
 * Shows its children only when the signed-in role holds one of the permissions
 * (admins always pass). Used to hide buttons a role can't use, like the mobile app does.
 */
export default function Can({ any, children, fallback = null }: { any: string | string[]; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  const list = Array.isArray(any) ? any : [any];
  // Permissions not delivered yet (old session): show the control, the server still enforces it.
  if (user?.permissions === undefined) return <>{children}</>;
  return <>{hasAnyPermission(user, list) ? children : fallback}</>;
}
