"use client";

import { useSyncExternalStore } from "react";

/**
 * Which orders / requests this browser has already looked at, so the red
 * numbers in the sidebar count only what is new. Kept in localStorage; nothing
 * is sent to the server.
 */
export type SeenKind = "orders" | "requests";

const KEY = (kind: SeenKind) => `stockflow.seen.${kind}`;
const MAX_KEPT = 500;
const EMPTY: ReadonlySet<string> = new Set();

const sets: Partial<Record<SeenKind, ReadonlySet<string>>> = {};
const listeners = new Set<() => void>();

function read(kind: SeenKind): ReadonlySet<string> {
  const cached = sets[kind];
  if (cached) return cached;
  let ids: string[] = [];
  try {
    const raw = window.localStorage.getItem(KEY(kind));
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    // Storage blocked or damaged: start empty.
  }
  const loaded = new Set(ids);
  sets[kind] = loaded;
  return loaded;
}

/** Marks these ids as seen (the red number drops straight away). */
export function markSeen(kind: SeenKind, ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const current = read(kind);
  const fresh = ids.filter((id) => !current.has(id));
  if (fresh.length === 0) return;
  const next = new Set([...current, ...fresh]);
  // Keep the newest ids only, so this never grows forever.
  const kept = new Set([...next].slice(-MAX_KEPT));
  sets[kind] = kept;
  try {
    window.localStorage.setItem(KEY(kind), JSON.stringify([...kept]));
  } catch {
    // Not saved (private window): the number still drops until the page is reloaded.
  }
  listeners.forEach((l) => l());
}

/** The ids already seen; re-renders when more are marked. */
export function useSeenIds(kind: SeenKind): ReadonlySet<string> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(kind),
    () => EMPTY,
  );
}
