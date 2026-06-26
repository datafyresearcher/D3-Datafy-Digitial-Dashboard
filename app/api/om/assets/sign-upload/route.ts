import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server";

const BUCKET = "om-inspection-assets";

export const dynamic = "force-dynamic";

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureBucket() {
  const admin = getSupabaseAdmin();
  const { error: getErr } = await admin.storage.getBucket(BUCKET);
  if (!getErr) return;

  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "100MB",
  });

  if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
    throw createErr;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Server storage is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      projectId?: string;
      fileName?: string;
      contentType?: string;
      kind?: string;
    };

    if (!body.projectId || !body.fileName) {
      return NextResponse.json({ error: "projectId and fileName are required." }, { status: 400 });
    }

    await ensureBucket();

    const project = safeSegment(body.projectId) || "project";
    const kind = safeSegment(body.kind ?? "asset") || "asset";
    const file = safeSegment(body.fileName) || "upload";
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `${project}/inspections/${kind}/${suffix}-${file}`;

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return NextResponse.json(
      {
        bucket: BUCKET,
        path,
        token: data.token,
        signedUrl: data.signedUrl,
        publicUrl,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  } catch (err) {
    console.error("POST /api/om/assets/sign-upload:", err);
    return NextResponse.json({ error: "Failed to prepare file upload." }, { status: 500 });
  }
}
