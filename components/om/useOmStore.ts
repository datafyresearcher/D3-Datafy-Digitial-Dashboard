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
    // Auth guard has confirmed the user; safe to load Supabase-backed data.
    void getStore();
    void refresh();
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot
  );
}

const emptySnapshot = (): Store => ({
  clients: [],
  projects: [],
  visits: [],
  inspections: [],
  performance: [],
  docs: [],
  audit: [],
});

// Hydrate only after the auth guard has mounted (useEffect below).
let snapshot: Store = emptySnapshot();
subscribe(() => {
  snapshot = getStore();
});
