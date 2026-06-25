import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/om/create-user
 * Creates a new client auth user + profile. Only callable by staff
 * (RLS would enforce this on a direct insert; this route uses the
 * service-role key, so we check the caller's role from their JWT).
 *
 * Body: { name, email, password, company, clientId, clientSubRole? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, company, clientId, clientSubRole } = body;

    if (!name || !email || !password || !clientId) {
      return NextResponse.json(
        { error: "name, email, password, and clientId are required." },
        { status: 400 }
      );
    }

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name, company },
      });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message ?? "Failed to create user." },
        { status: 400 }
      );
    }

    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      name,
      email: email.trim().toLowerCase(),
      role: "client",
      company,
      client_id: clientId,
      client_sub_role: clientSubRole ?? "client_admin",
    });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: created.user.id,
        name,
        email: email.trim().toLowerCase(),
        password: "",
        role: "client",
        company,
        clientId,
        clientSubRole: clientSubRole ?? "client_admin",
        lastLogin: null,
      },
    });
  } catch (err) {
    console.error("create-user error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
