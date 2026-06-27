import { supabase } from "@/lib/supabase/browser";

type UploadKind =
  | "orthomosaic"
  | "rgb"
  | "thermal"
  | "report"
  | "layout"
  | "processed"
  | "document"
  | "visit";

export async function uploadOmAsset(file: File, projectId: string, kind: UploadKind): Promise<string> {
  const res = await fetch("/api/om/assets/sign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      kind,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Could not prepare file upload.");
  }

  const payload = (await res.json()) as {
    bucket: string;
    path: string;
    token: string;
    publicUrl: string;
  };

  const { error } = await supabase.storage
    .from(payload.bucket)
    .uploadToSignedUrl(payload.path, payload.token, file);

  if (error) {
    throw new Error(error.message);
  }

  return payload.publicUrl;
}
