/**
 * Supabase client for the SERVER (route handlers, Server Components).
 *
 * Uses the secret "service role" key which BYPASSES Row Level Security.
 * Only ever import this in code that runs on the server — it must never
 * be bundled into the browser. Used for trusted admin operations.
 *
 * Initialized lazily so `next build` succeeds when env vars are not yet
 * configured on Vercel; callers get a clear runtime error instead.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add them to your Vercel project environment variables."
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
