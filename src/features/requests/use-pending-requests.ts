"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRequests } from "./requests-live";

const POLL_MS = 60_000;

/**
 * How many requests are waiting for the signed-in person's decision, for the
 * sidebar badge. Refreshed every minute and whenever `refreshKey` changes
 * (e.g. the page they are on), so it drops after they approve or reject.
 */
export function usePendingRequests(refreshKey?: string) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchRequests();
      setCount(rows.filter((r) => r.status === "Pending" && r.canAct).length);
    } catch {
      // Not signed in yet or server unreachable: keep the last number.
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh, refreshKey]);

  return count;
}
