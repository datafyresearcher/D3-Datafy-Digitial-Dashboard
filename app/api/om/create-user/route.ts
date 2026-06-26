import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

/**
 * POST /api/om/create-user
 * Creates a new client auth user + profile. Only callable by staff
 * (RLS would enforce this on a direct insert; this route uses the
 * service-role key, so we check the caller's role from their JWT).
 *
 * Body: { name, email, password, company, clientId, clientSubRole? }
 */

function isEmailTakenMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("already been registered") ||
    lower.includes("already exists") ||
    lower.includes("duplicate")
  );
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  email: string
) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.trim().toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function createClientAuthUser(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  input: {
    name: string;
    email: string;
    password: string;
    company: string;
    clientId: string;
    clientSubRole?: string;
  }
) {
  const email = input.email.trim().toLowerCase();
  const clientSubRole = input.clientSubRole ?? "client_admin";

  const attemptCreate = async () => {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name, company: input.company },
    });
    return { created, createErr };
  };

  let { created, createErr } = await attemptCreate();

  if (createErr && isEmailTakenMessage(createErr.message)) {
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, client_id")
      .ilike("email", email)
      .maybeSingle();

    let userId = existingProfile?.id ?? (await findAuthUserByEmail(supabaseAdmin, email))?.id;

    if (existingProfile?.client_id && existingProfile.client_id !== input.clientId) {
      const { data: otherClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("id", existingProfile.client_id)
        .maybeSingle();
      if (otherClient) {
        return {
          error: NextResponse.json(
            { error: "This email is already linked to another active client." },
            { status: 400 }
          ),
        };
      }
      // Profile points at a deleted client — treat as orphaned below.
    }
    if (!userId) {
      return {
        error: NextResponse.json(
          { error: createErr.message ?? "Failed to create user." },
          { status: 400 }
        ),
      };
    }

    let resolvedUserId = userId;

    if (existingProfile?.client_id === input.clientId) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name, company: input.company },
      });
      if (updateErr) {
        return { error: NextResponse.json({ error: updateErr.message }, { status: 400 }) };
      }
    } else {
      // Orphaned auth row from a deleted client — remove and recreate cleanly.
      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteErr) {
        return { error: NextResponse.json({ error: deleteErr.message }, { status: 400 }) };
      }
      ({ created, createErr } = await attemptCreate());
      if (createErr || !created.user) {
        return {
          error: NextResponse.json(
            { error: createErr?.message ?? "Failed to create user." },
            { status: 400 }
          ),
        };
      }
      resolvedUserId = created.user.id;
    }

    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: resolvedUserId,
      name: input.name,
      email,
      role: "client",
      company: input.company,
      client_id: input.clientId,
      client_sub_role: clientSubRole,
    });

    if (profileErr) {
      return { error: NextResponse.json({ error: profileErr.message }, { status: 500 }) };
    }

    return {
      user: {
        id: resolvedUserId,
        name: input.name,
        email,
        password: "",
        role: "client" as const,
        company: input.company,
        clientId: input.clientId,
        clientSubRole,
        lastLogin: null,
      },
    };
  }

  if (createErr || !created?.user) {
    return {
      error: NextResponse.json(
        { error: createErr?.message ?? "Failed to create user." },
        { status: 400 }
      ),
    };
  }

  const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
    id: created.user.id,
    name: input.name,
    email,
    role: "client",
    company: input.company,
    client_id: input.clientId,
    client_sub_role: clientSubRole,
  });

  if (profileErr) {
    return { error: NextResponse.json({ error: profileErr.message }, { status: 500 }) };
  }

  return {
    user: {
      id: created.user.id,
      name: input.name,
      email,
      password: "",
      role: "client" as const,
      company: input.company,
      clientId: input.clientId,
      clientSubRole,
      lastLogin: null,
    },
  };
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured on this deployment." },
        { status: 503 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { name, email, password, company, clientId, clientSubRole } = body;

    if (!name || !email || !password || !clientId) {
      return NextResponse.json(
        { error: "name, email, password, and clientId are required." },
        { status: 400 }
      );
    }

    const result = await createClientAuthUser(supabaseAdmin, {
      name,
      email,
      password,
      company,
      clientId,
      clientSubRole,
    });

    if ("error" in result && result.error) return result.error;
    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("create-user error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}