"use client";

import { useSyncExternalStore } from "react";
import { getStore, subscribe, type Store } from "@/lib/om";

/**
 * React binding to the O&M store. Re-renders whenever the store mutates.
 * Returns a snapshot (immutable view) so useSyncExternalStore is happy.
 */
export function useOmStore(): Store {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot
  );
}

// keep a module-level snapshot reference that changes identity on each emit
let snapshot: Store = getStore();
if (typeof window !== "undefined") {
  subscribe(() => {
    snapshot = getStore();
  });
}
