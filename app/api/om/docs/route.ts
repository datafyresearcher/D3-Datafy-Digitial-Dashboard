import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured. Add SUPABASE_SERVICE_ROLE_KEY on Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { data, error } = await getSupabaseAdmin()
      .from("docs")
      .insert(body)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: true, doc: data },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("POST /api/om/docs:", err);
    return NextResponse.json({ error: "Failed to save document." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Server database is not configured." }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Document id is required." }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin().from("docs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("DELETE /api/om/docs:", err);
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }
}
