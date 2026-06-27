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
    const { defects = [], ...visit } = body as Record<string, any>;
    const admin = getSupabaseAdmin();

    const { data, error } = await admin.from("visits").insert(visit).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (Array.isArray(defects) && defects.length > 0) {
      const { error: defectsErr } = await admin.from("defects").insert(
        defects.map((d: any) => ({
          id: d.id ?? undefined,
          visit_id: data.id,
          category: d.category,
          description: d.description ?? "",
          status: d.status ?? "Open",
          opened_at: d.opened_at ?? d.openedAt ?? new Date().toISOString(),
          resolved_at: d.resolved_at ?? d.resolvedAt ?? null,
        }))
      );
      if (defectsErr) {
        return NextResponse.json({ error: defectsErr.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { ok: true, visit: data },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("POST /api/om/visits:", err);
    return NextResponse.json({ error: "Failed to save visit." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured. Add SUPABASE_SERVICE_ROLE_KEY on Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { id, defect, ...row } = body as { id: string; defect?: any } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json({ error: "Visit id is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Update visit fields if any provided
    if (Object.keys(row).length > 0) {
      const { error } = await admin.from("visits").update(row).eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle defect status toggle/update
    if (defect && defect.id) {
      const update: Record<string, unknown> = { status: defect.status };
      if (defect.resolved_at !== undefined) update.resolved_at = defect.resolved_at;
      if (defect.resolvedAt !== undefined) update.resolved_at = defect.resolvedAt;

      const { error: defErr } = await admin.from("defects").update(update).eq("id", defect.id);
      if (defErr) {
        return NextResponse.json({ error: defErr.message }, { status: 400 });
      }
    }

    // Return the updated visit row for convenience
    const { data: visitData } = await admin.from("visits").select("*").eq("id", id).single();

    return NextResponse.json(
      { ok: true, visit: visitData },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("PATCH /api/om/visits:", err);
    return NextResponse.json({ error: "Failed to update visit." }, { status: 500 });
  }
}
