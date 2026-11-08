"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRequests } from "./requests-live";
import { useSeenIds } from "@/features/seen/seen-store";

const POLL_MS = 60_000;

/**
 * How many requests are waiting for the signed-in person's decision and not
 * looked at yet, for the sidebar badge. Refreshed every minute and whenever `refreshKey` changes
 * (e.g. the page they are on), so it drops after they approve or reject.
 */
export function usePendingRequests(refreshKey?: string) {
  const [waiting, setWaiting] = useState<string[]>([]);
  const seen = useSeenIds("requests");

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchRequests();
      setWaiting(rows.filter((r) => r.status === "Pending" && r.canAct).map((r) => r.id));
    } catch {
      // Not signed in yet or server unreachable: keep the last number.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh, refreshKey]);

  // Only the ones not looked at yet are counted.
  return waiting.filter((id) => !seen.has(id)).length;
}
