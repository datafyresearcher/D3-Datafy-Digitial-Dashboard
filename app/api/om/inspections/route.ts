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
    const { anomalies = [], ...inspection } = body as Record<string, any>;
    const admin = getSupabaseAdmin();

    const { data, error } = await admin.from("inspections").insert(inspection).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (Array.isArray(anomalies) && anomalies.length > 0) {
      const { error: anomaliesErr } = await admin.from("anomalies").insert(
        anomalies.map((a) => ({
          inspection_id: data.id,
          panel_id: a.panel_id,
          type: a.type,
          severity: a.severity,
          status: a.status,
          detected_at: a.detected_at,
          resolved_at: a.resolved_at ?? null,
          x: a.x ?? null,
          y: a.y ?? null,
          note: a.note ?? null,
        }))
      );
      if (anomaliesErr) {
        return NextResponse.json({ error: anomaliesErr.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { ok: true, inspection: data },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("POST /api/om/inspections:", err);
    return NextResponse.json({ error: "Failed to save inspection." }, { status: 500 });
  }
}
