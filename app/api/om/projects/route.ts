import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/** Staff-only write path when browser Supabase Auth is unavailable. */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured. Add SUPABASE_SERVICE_ROLE_KEY on Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { error } = await getSupabaseAdmin().from("projects").insert(body);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/om/projects:", err);
    return NextResponse.json({ error: "Failed to save project." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Server database is not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, ...row } = body as { id: string } & Record<string, unknown>;
    if (!id) {
      return NextResponse.json({ error: "Project id is required." }, { status: 400 });
    }
    const { error } = await getSupabaseAdmin().from("projects").update(row).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/om/projects:", err);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
}