/**
 * Supabase client for the SERVER (route handlers, Server Components).
 *
 * Uses the secret "service role" key which BYPASSES Row Level Security.
 * Only ever import this in code that runs on the server — it must never
 * be bundled into the browser. Used for trusted admin operations and the
 * contact-form emailer.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add them to .env.local (see README)."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
