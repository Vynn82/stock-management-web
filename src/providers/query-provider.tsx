"use client";

import React from "react";

/**
 * Placeholder / Wrapper for React Query or client caching providers
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
