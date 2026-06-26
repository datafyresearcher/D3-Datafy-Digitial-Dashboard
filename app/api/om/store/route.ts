import { NextResponse } from "next/server";
import { pullStoreFromSupabase } from "@/lib/om";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/** Read the full O&M dataset for demo/staff sessions without browser Supabase Auth. */
export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured." },
      { status: 503 }
    );
  }

  try {
    const store = await pullStoreFromSupabase(getSupabaseAdmin());
    return NextResponse.json(store);
  } catch (err) {
    console.error("GET /api/om/store:", err);
    return NextResponse.json({ error: "Failed to load portal data." }, { status: 500 });
  }
}