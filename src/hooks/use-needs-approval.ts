"use client";

import { useAuth } from "@/hooks/use-auth";
import { needsApproval } from "@/lib/auth/permissions";

/** True when the signed-in person lacks `permission` and must send a request for approval instead. */
export function useNeedsApproval(permission: string): boolean {
  const { user } = useAuth();
  return needsApproval(user, permission);
}
