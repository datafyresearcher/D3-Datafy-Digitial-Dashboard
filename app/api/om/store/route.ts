import { NextResponse } from "next/server";
import { pullStoreFromSupabase } from "@/lib/om";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/** Read the full O&M dataset for demo/staff sessions without browser Supabase Auth.
 *  Force no caching because this endpoint is used to refresh the UI after mutations
 *  (client/project create/delete). Stale responses would cause created items to
 *  disappear or deleted items to reappear.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured." },
      { status: 503 }
    );
  }

  try {
    const store = await pullStoreFromSupabase(getSupabaseAdmin());
    return NextResponse.json(store, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    console.error("GET /api/om/store:", err);
    return NextResponse.json({ error: "Failed to load portal data." }, { status: 500 });
  }
}