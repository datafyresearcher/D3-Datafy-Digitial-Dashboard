import type { SupabaseClient } from "@supabase/supabase-js";

async function throwOnError<T>(result: { data: T; error: { message?: string } | null }) {
  if (result.error) throw new Error(result.error.message ?? "Supabase operation failed.");
  return result.data;
}

export async function deleteOmProjectTree(supabaseAdmin: SupabaseClient, projectId: string) {
  const visits = await throwOnError(
    await supabaseAdmin.from("visits").select("id").eq("project_id", projectId)
  );
  const visitIds = ((visits ?? []) as { id: string }[]).map((v) => v.id);

  const inspections = await throwOnError(
    await supabaseAdmin.from("inspections").select("id").eq("project_id", projectId)
  );
  const inspectionIds = ((inspections ?? []) as { id: string }[]).map((i) => i.id);

  if (inspectionIds.length > 0) {
    await throwOnError(
      await supabaseAdmin.from("anomalies").delete().in("inspection_id", inspectionIds)
    );
  }

  if (visitIds.length > 0) {
    await throwOnError(
      await supabaseAdmin.from("defects").delete().in("visit_id", visitIds)
    );
  }

  await throwOnError(await supabaseAdmin.from("docs").delete().eq("project_id", projectId));
  await throwOnError(await supabaseAdmin.from("performance").delete().eq("project_id", projectId));
  await throwOnError(await supabaseAdmin.from("inspections").delete().eq("project_id", projectId));
  await throwOnError(await supabaseAdmin.from("visits").delete().eq("project_id", projectId));
  await throwOnError(await supabaseAdmin.from("projects").delete().eq("id", projectId));
}
