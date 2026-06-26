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
    const { error } = await getSupabaseAdmin().from("clients").insert(body);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/om/clients:", err);
    return NextResponse.json({ error: "Failed to save client." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Server database is not configured." }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    let id = url.searchParams.get("id") ?? undefined;
    if (!id) {
      const body = (await request.json().catch(() => null)) as { id?: string } | null;
      id = body?.id;
    }
    if (!id) {
      return NextResponse.json({ error: "Client id is required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Remove portal logins tied to this client so the email can be reused.
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("client_id", id);
    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 400 });
    }

    for (const profile of profiles ?? []) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
      if (authErr) {
        console.error(`DELETE /api/om/clients: could not delete auth user ${profile.id}:`, authErr);
        return NextResponse.json(
          { error: `Could not remove login for this client: ${authErr.message}` },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin.from("clients").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/om/clients:", err);
    return NextResponse.json({ error: "Failed to delete client." }, { status: 500 });
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
      return NextResponse.json({ error: "Client id is required." }, { status: 400 });
    }
    const { error } = await getSupabaseAdmin().from("clients").update(row).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/om/clients:", err);
    return NextResponse.json({ error: "Failed to update client." }, { status: 500 });
  }
}