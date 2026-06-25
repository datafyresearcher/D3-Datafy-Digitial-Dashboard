"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { getStore, subscribe, refresh, type Store } from "@/lib/om";

/**
 * React binding to the O&M store. Re-renders whenever the store mutates.
 * Returns a snapshot (immutable view) so useSyncExternalStore is happy.
 *
 * On mount it kicks off a background refresh() so the in-memory cache is
 * hydrated from Supabase (RLS scopes rows to the signed-in user).
 */
export function useOmStore(): Store {
  useEffect(() => {
    // Hydrate from Supabase when the portal mounts.
    void refresh();
  }, []);

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
