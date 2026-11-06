"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCustomerOrders } from "./customer-orders.api";
import { CustomerOrderSummary } from "./customer-orders.types";

/** Ids already seen, kept across page changes so a banner shows only once per order. */
let seenIds: Set<string> | null = null;

const POLL_MS = 30_000;

/**
 * Orders waiting for staff review, refreshed every 30 seconds. `onNew` runs
 * with the orders that appeared since the last check (never on the first load,
 * so opening the site does not show a banner for old orders).
 */
export function usePendingOrders(onNew?: (fresh: CustomerOrderSummary[]) => void) {
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchCustomerOrders("PENDING_REVIEW");
      if (seenIds) {
        const known = seenIds;
        const fresh = rows.filter((o) => !known.has(o.id));
        if (fresh.length > 0) onNewRef.current?.(fresh);
      }
      seenIds = new Set(rows.map((o) => o.id));
      setOrders(rows);
      setError(false);
    } catch {
      // Not signed in yet, or the server is unreachable: try again next time.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { orders, count: orders.length, loading, error, refresh };
}
