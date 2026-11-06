"use client";

import type { ReactNode } from "react";

/**
 * Loading / error / empty message for pages that read from the server.
 * Uses the page's own theme colours so it works in light and dark mode.
 */
export function LiveState({
  loading,
  error,
  empty,
  emptyText = "Nothing here yet.",
  loadingText = "Loading…",
  onRetry,
  children,
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
  emptyText?: string;
  loadingText?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const box = (text: string, action?: ReactNode, alert = false) => (
    <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--muted)" }} role={alert ? "alert" : "status"}>
      <p style={{ margin: action ? "0 0 14px" : 0 }}>{text}</p>
      {action}
    </div>
  );
  if (loading) return box(loadingText);
  if (error) {
    return box(
      error,
      onRetry ? (
        <button type="button" className="stock-action-btn" onClick={onRetry}>
          Try again
        </button>
      ) : undefined,
      true,
    );
  }
  if (empty) return box(emptyText);
  return <>{children}</>;
}

export function errorText(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
