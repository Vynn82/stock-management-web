"use client";

import { useAuth } from "./use-auth";
import {
  hasPermission,
  hasAnyPermission,
  isSuperAdmin,
} from "@/lib/auth/permissions";

export function usePermission() {
  const { user } = useAuth();

  return {
    can: (permission: string) => hasPermission(user, permission),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions),
    isAdmin: isSuperAdmin(user),
  };
}
