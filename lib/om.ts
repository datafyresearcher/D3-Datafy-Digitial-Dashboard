/**
 * lib/om.ts — O&M Portal data layer (Supabase-backed).
 *
 * Architecture: the UI consumes a SYNCHRONOUS store via useSyncExternalStore
 * (see components/om/useOmStore.ts). To avoid rewriting every view, this
 * module keeps that synchronous contract but hydrates an in-memory cache
 * from Supabase and refetches after every mutation. RLS enforces
 * row-level access server-side; here we just read/write what RLS allows.
 *
 * Public API (unchanged from the localStorage version):
 *   getStore(), subscribe(), resetStore()
 *   visibleProjects/visibleClients/getProject/getClient
 *   createClient/updateClient/deleteClient
 *   createProject/updateProject/deleteProject
 *   addVisit/updateVisit/visitsFor/toggleDefect
 *   addInspection/updateInspection/toggleAnomaly/inspectionsFor
 *   addPerformance/performanceFor/performanceRatio/co2OffsetKg/parsePerformanceCsv
 *   addDoc/deleteDoc/docsFor
 *   logAudit/logClientActivity
 *   maintenanceStatus/healthScore
 *   uid/nowISO
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/browser";
import type { User } from "./auth";
import { seedStore } from "./om-seed";

const STORE_KEY = "om_store_v1";

/* ============================== Types =============================== */
// (unchanged — kept verbatim so consumers don't break)

export type ClientStatus = "Active" | "Suspended" | "Archived";
export type BillingTier = "Basic" | "Pro" | "Enterprise";

export type ActivityEvent = {
  id: string;
  ts: string;
  type: "login" | "view" | "download" | "upload" | "edit" | "create";
  detail: string;
};

export type Client = {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  billingTier: BillingTier;
  status: ClientStatus;
  createdAt: string;
  activity: ActivityEvent[];
};

export type ProjectClassification = "Residential" | "Commercial" | "Industrial";
export type ProjectStatus = "Active" | "Under Maintenance" | "Decommissioned";
export type GridType = "On-grid" | "Off-grid" | "Hybrid";

export type StringZone = {
  id: string;
  name: string;
  panelCount: number;
  location: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  sizeKWp: number;
  panelCount: number;
  inverterBrand: string;
  inverterModel: string;
  hasBattery: boolean;
  batterySystem?: string;
  gridType: GridType;
  installedAt: string;
  warrantyExpiry: string;
  siteContactName: string;
  siteContactPhone: string;
  classification: ProjectClassification;
  status: ProjectStatus;
  stringZones: StringZone[];
  gallery: GalleryImage[];
  clientNotes: string;
  maintenanceSchedule: ScheduleFrequency[];
};

export type ScheduleFrequency = "Monthly" | "Quarterly" | "Half-yearly" | "Annual";

export type CleaningType = "Dry cleaning" | "Wet cleaning" | "Robotic cleaning" | "None";
export type Weather = "Sunny" | "Cloudy" | "Overcast" | "Rainy";

export type VisitImage = {
  id: string;
  url: string;
  tag: string;
  kind: "before" | "after";
};

export type DefectEntry = {
  id: string;
  category: "Physical damage" | "Soiling" | "Loose connection" | "Other";
  description: string;
  status: "Open" | "Resolved";
  openedAt: string;
  resolvedAt?: string;
};

export type MaintenanceVisit = {
  id: string;
  projectId: string;
  date: string;
  technician: string;
  cleaningType: CleaningType;
  weather: Weather;
  preObservation: string;
  postObservation: string;
  images: VisitImage[];
  defects: DefectEntry[];
  signature: string;
  createdAt: string;
};

export type DroneInspection = {
  id: string;
  projectId: string;
  date: string;
  orthomosaicUrl?: string;
  rgbUrl?: string;
  thermalUrl?: string;
  reportPdfUrl?: string;
  processedImages: { id: string; url: string; label: string }[];
  layoutUrl?: string;
  anomalies: Anomaly[];
  createdAt: string;
};

export type AnomalyType =
  | "Hotspot"
  | "Crack"
  | "Delamination"
  | "Soiling"
  | "Bird droppings";
export type AnomalySeverity = "Critical" | "Warning" | "Info";
export type AnomalyStatus = "Open" | "Resolved";

export type Anomaly = {
  id: string;
  panelId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  detectedAt: string;
  resolvedAt?: string;
  x?: number;
  y?: number;
  note?: string;
};

export type PerformanceRecord = {
  id: string;
  projectId: string;
  date: string;
  energyKWh: number;
  expectedKWh: number;
};

export type DocType =
  | "Warranty"
  | "Contract"
  | "Inverter manual"
  | "Grid connection"
  | "Report"
  | "Other";

export type VaultDoc = {
  id: string;
  projectId: string;
  name: string;
  type: DocType;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type AuditEntry = {
  id: string;
  ts: string;
  userId: string;
  userName: string;
  action: "upload" | "edit" | "download" | "create" | "delete";
  target: string;
};

export type Store = {
  clients: Client[];
  projects: Project[];
  visits: MaintenanceVisit[];
  inspections: DroneInspection[];
  performance: PerformanceRecord[];
  docs: VaultDoc[];
  audit: AuditEntry[];
};

/* ============================== Store =============================== */

let cache: Store | null = null;
let loading: Promise<void> | null = null;
/** Bumped on every mutate so in-flight refreshes cannot overwrite newer data. */
let syncGeneration = 0;
type Listener = () => void;
const listeners = new Set<Listener>();
type OmTableResult = {
  error: { message?: string } | null;
};

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

function emit() {
  listeners.forEach((l) => l());
}

/** Shallow snapshot so useSyncExternalStore detects in-place mutations. */
function snapshotStore(store: Store): Store {
  return {
    clients: [...store.clients],
    projects: [...store.projects],
    visits: [...store.visits],
    inspections: [...store.inspections],
    performance: [...store.performance],
    docs: [...store.docs],
    audit: [...store.audit],
  };
}

function publishStore() {
  if (!cache) cache = emptyStore();
  cache = snapshotStore(cache);
  emit();
}

async function hasSupabaseSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session?.user;
  } catch {
    return false;
  }
}

async function staffApiWrite(
  path: "/api/om/clients" | "/api/om/projects" | "/api/om/inspections",
  method: "POST" | "PATCH",
  body: Record<string, unknown>
): Promise<any> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Could not save via ${path}.`);
  }
  return res.json().catch(() => null);
}

/** DELETE with id in query string — reliable on Vercel (request bodies on DELETE often drop). */
async function staffApiDelete(
  path: "/api/om/clients" | "/api/om/projects",
  id: string
): Promise<void> {
  const res = await fetch(`${path}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Could not delete via ${path}.`);
  }
}

function invalidatePendingSyncs() {
  syncGeneration += 1;
}

async function fetchStoreFromServer(staff = false): Promise<Store | null> {
  if (staff && isSupabaseConfigured()) {
    return pullStoreViaStaffApi();
  }
  if (isSupabaseConfigured()) {
    // For staff users (super_admin / field_engineer), prefer the admin (staff) API
    // so we get a complete unfiltered view (especially important right after service-role
    // writes for create/delete). Falls back to RLS browser pull otherwise.
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data?.session?.user?.id;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();
        const role = (prof as any)?.role as string | undefined;
        if (role === "super_admin" || role === "field_engineer") {
          return pullStoreViaStaffApi();
        }
      }
    } catch {
      // fall through
    }

    if (await hasSupabaseSession()) {
      return pullStoreFromSupabase(supabase);
    }
    return pullStoreViaStaffApi();
  }
  return null;
}

async function applyServerStore(generation: number, staff = false): Promise<void> {
  const latest = await fetchStoreFromServer(staff);
  if (generation === syncGeneration && latest) {
    cache = latest;
    emit();
    return;
  }
  if (!isSupabaseConfigured() && cache) persistLocalStore(cache);
}

async function syncStoreFromServer(staff = false): Promise<void> {
  const generation = syncGeneration;
  await applyServerStore(generation, staff);
}

function nullableDate(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function projectToDbRow(project: Project) {
  return {
    id: project.id,
    client_id: project.clientId,
    name: project.name.trim(),
    address: project.address?.trim() || "—",
    lat: Number.isFinite(project.lat) ? project.lat : 0,
    lng: Number.isFinite(project.lng) ? project.lng : 0,
    size_kwp: Number.isFinite(project.sizeKWp) ? project.sizeKWp : 0,
    panel_count: Number.isFinite(project.panelCount) ? project.panelCount : 0,
    inverter_brand: project.inverterBrand?.trim() || null,
    inverter_model: project.inverterModel?.trim() || null,
    has_battery: project.hasBattery,
    battery_system: project.batterySystem?.trim() ? project.batterySystem : null,
    grid_type: project.gridType,
    installed_at: nullableDate(project.installedAt),
    warranty_expiry: nullableDate(project.warrantyExpiry),
    site_contact_name: project.siteContactName?.trim() || null,
    site_contact_phone: project.siteContactPhone?.trim() || null,
    classification: project.classification,
    status: project.status,
    string_zones: project.stringZones ?? [],
    gallery: project.gallery ?? [],
    client_notes: project.clientNotes ?? "",
    maintenance_schedule: project.maintenanceSchedule?.length ? project.maintenanceSchedule : [],
  };
}

/** Turn Supabase / validation errors into user-facing form messages. */
export function formatOmError(err: unknown): string {
  if (err instanceof Error && err.message && !err.message.startsWith("{")) {
    return err.message;
  }
  const e = err as { message?: string; code?: string; details?: string };
  const msg = e?.message ?? "";
  if (e?.code === "23503") {
    return "The selected client no longer exists. Refresh the page and pick a client again.";
  }
  if (e?.code === "22007" || msg.includes("invalid input syntax for type date")) {
    return "Installation or warranty date is invalid. Please set both dates.";
  }
  if (msg.includes("row-level security") || e?.code === "42501") {
    return "You do not have permission to save projects. Sign in as an admin.";
  }
  if (
    msg.includes("Payload too large") ||
    msg.includes("timeout") ||
    msg.includes("Failed to fetch")
  ) {
    return "Uploaded photos are too large. Try fewer or smaller images.";
  }
  if (msg.includes("quota") || msg.includes("setItem")) {
    return "Browser storage is full. Sign in again to save to the cloud, or remove uploaded photos.";
  }
  if (msg.includes("session expired")) {
    return msg;
  }
  return msg || "Could not save. Please check the form and try again.";
}

function isDataUrl(url: string | undefined | null): boolean {
  return !!url?.startsWith("data:");
}

/** Strip embedded images before localStorage — data URLs can exceed the ~5MB quota. */
function stripHeavyMedia(store: Store): Store {
  const strip = (url: string | undefined) => (isDataUrl(url) ? "" : (url ?? ""));

  return {
    ...store,
    projects: store.projects.map((p) => ({
      ...p,
      gallery: p.gallery.map((g) => ({ ...g, url: strip(g.url) })),
    })),
    visits: store.visits.map((v) => ({
      ...v,
      images: v.images.map((img) => ({ ...img, url: strip(img.url) })),
      signature: strip(v.signature),
    })),
    inspections: store.inspections.map((i) => ({
      ...i,
      orthomosaicUrl: strip(i.orthomosaicUrl),
      rgbUrl: strip(i.rgbUrl),
      thermalUrl: strip(i.thermalUrl),
      reportPdfUrl: strip(i.reportPdfUrl),
      layoutUrl: strip(i.layoutUrl),
      processedImages: i.processedImages.map((img) => ({ ...img, url: strip(img.url) })),
    })),
  };
}

function clearLocalStoreSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORE_KEY);
  } catch {
    // ignore
  }
}

function loadLocalStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // corrupt data — re-seed below
  }
  const seeded = seedStore(uid);
  persistLocalStore(seeded);
  return seeded;
}

function persistLocalStore(store: Store) {
  if (typeof window === "undefined" || isSupabaseConfigured()) return;

  const payload = JSON.stringify(stripHeavyMedia(store));
  try {
    window.localStorage.setItem(STORE_KEY, payload);
  } catch {
    try {
      clearLocalStoreSnapshot();
      window.localStorage.setItem(STORE_KEY, payload);
    } catch {
      // In-memory cache still works for this session.
    }
  }
}

/** Subscribe to store changes; returns an unsubscribe fn. */
export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Empty store returned before the first Supabase fetch resolves. */
function emptyStore(): Store {
  return {
    clients: [],
    projects: [],
    visits: [],
    inspections: [],
    performance: [],
    docs: [],
    audit: [],
  };
}

/** Synchronous snapshot. Triggers a background load on first call. */
export function getStore(): Store {
  if (!cache) {
    cache = emptyStore();
    // Fire-and-forget; callers will re-render once data lands.
    void refresh();
  }
  return cache;
}

/* --------------------- Supabase <-> domain mappers ----------------- */

function mapClient(r: any, activity: ActivityEvent[] = []): Client {
  return {
    id: r.id,
    company: r.company,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone ?? "",
    billingTier: r.billing_tier,
    status: r.status,
    createdAt: r.created_at,
    activity,
  };
}

function mapProject(r: any): Project {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    sizeKWp: Number(r.size_kwp),
    panelCount: r.panel_count,
    inverterBrand: r.inverter_brand ?? "",
    inverterModel: r.inverter_model ?? "",
    hasBattery: !!r.has_battery,
    batterySystem: r.battery_system ?? undefined,
    gridType: r.grid_type,
    installedAt: r.installed_at,
    warrantyExpiry: r.warranty_expiry,
    siteContactName: r.site_contact_name ?? "",
    siteContactPhone: r.site_contact_phone ?? "",
    classification: r.classification,
    status: r.status,
    stringZones: r.string_zones ?? [],
    gallery: r.gallery ?? [],
    clientNotes: r.client_notes ?? "",
    maintenanceSchedule: r.maintenance_schedule ?? [],
  };
}

function mapVisit(r: any, defects: DefectEntry[] = []): MaintenanceVisit {
  return {
    id: r.id,
    projectId: r.project_id,
    date: r.date,
    technician: r.technician ?? "",
    cleaningType: r.cleaning_type,
    weather: r.weather,
    preObservation: r.pre_observation ?? "",
    postObservation: r.post_observation ?? "",
    images: r.images ?? [],
    defects,
    signature: r.signature ?? "",
    createdAt: r.created_at,
  };
}

function mapDefect(r: any): DefectEntry {
  return {
    id: r.id,
    category: r.category,
    description: r.description ?? "",
    status: r.status,
    openedAt: r.opened_at,
    resolvedAt: r.resolved_at ?? undefined,
  };
}

function mapInspection(r: any, anomalies: Anomaly[] = []): DroneInspection {
  return {
    id: r.id,
    projectId: r.project_id,
    date: r.date,
    orthomosaicUrl: r.orthomosaic_url ?? undefined,
    rgbUrl: r.rgb_url ?? undefined,
    thermalUrl: r.thermal_url ?? undefined,
    reportPdfUrl: r.report_pdf_url ?? undefined,
    processedImages: r.processed_images ?? [],
    layoutUrl: r.layout_url ?? undefined,
    anomalies,
    createdAt: r.created_at,
  };
}

function mapAnomaly(r: any): Anomaly {
  return {
    id: r.id,
    panelId: r.panel_id,
    type: r.type,
    severity: r.severity,
    status: r.status,
    detectedAt: r.detected_at,
    resolvedAt: r.resolved_at ?? undefined,
    x: r.x != null ? Number(r.x) : undefined,
    y: r.y != null ? Number(r.y) : undefined,
    note: r.note ?? undefined,
  };
}

function mapPerformance(r: any): PerformanceRecord {
  return {
    id: r.id,
    projectId: r.project_id,
    date: r.date,
    energyKWh: Number(r.energy_kwh),
    expectedKWh: Number(r.expected_kwh),
  };
}

function mapDoc(r: any): VaultDoc {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    type: r.type,
    url: r.url,
    uploadedAt: r.uploaded_at,
    uploadedBy: r.uploaded_by ?? "",
  };
}

function mapAudit(r: any): AuditEntry {
  return {
    id: r.id,
    ts: r.ts,
    userId: r.user_id,
    userName: r.user_name,
    action: r.action,
    target: r.target,
  };
}

/** Load the full O&M store from any Supabase client (browser or service role). */
export async function pullStoreFromSupabase(client: SupabaseClient): Promise<Store> {
  const [
    clientsR,
    activityR,
    projectsR,
    visitsR,
    defectsR,
    inspectionsR,
    anomaliesR,
    perfR,
    docsR,
    auditR,
  ] = await Promise.all([
    client.from("clients").select("*"),
    client.from("client_activity").select("*"),
    client.from("projects").select("*"),
    client.from("visits").select("*"),
    client.from("defects").select("*"),
    client.from("inspections").select("*"),
    client.from("anomalies").select("*"),
    client.from("performance").select("*"),
    client.from("docs").select("*"),
    client.from("audit").select("*"),
  ]);

  for (const result of [
    clientsR,
    activityR,
    projectsR,
    visitsR,
    defectsR,
    inspectionsR,
    anomaliesR,
    perfR,
    docsR,
    auditR,
  ] as OmTableResult[]) {
    if (result.error) {
      throw new Error(result.error.message ?? "Failed to load portal data from Supabase.");
    }
  }

  const activityByClient = new Map<string, ActivityEvent[]>();
  for (const a of (activityR.data ?? []) as any[]) {
    const list = activityByClient.get(a.client_id) ?? [];
    list.push({
      id: a.id,
      ts: a.ts,
      type: a.type,
      detail: a.detail ?? "",
    });
    activityByClient.set(a.client_id, list);
  }

  const defectsByVisit = new Map<string, DefectEntry[]>();
  for (const d of (defectsR.data ?? []) as any[]) {
    const list = defectsByVisit.get(d.visit_id) ?? [];
    list.push(mapDefect(d));
    defectsByVisit.set(d.visit_id, list);
  }

  const anomaliesByInspection = new Map<string, Anomaly[]>();
  for (const a of (anomaliesR.data ?? []) as any[]) {
    const list = anomaliesByInspection.get(a.inspection_id) ?? [];
    list.push(mapAnomaly(a));
    anomaliesByInspection.set(a.inspection_id, list);
  }

  return {
    clients: ((clientsR.data ?? []) as any[]).map((r) =>
      mapClient(r, activityByClient.get(r.id) ?? [])
    ),
    projects: ((projectsR.data ?? []) as any[]).map(mapProject),
    visits: ((visitsR.data ?? []) as any[]).map((r) =>
      mapVisit(r, defectsByVisit.get(r.id) ?? [])
    ),
    inspections: ((inspectionsR.data ?? []) as any[]).map((r) =>
      mapInspection(r, anomaliesByInspection.get(r.id) ?? [])
    ),
    performance: ((perfR.data ?? []) as any[]).map(mapPerformance),
    docs: ((docsR.data ?? []) as any[]).map(mapDoc),
    audit: ((auditR.data ?? []) as any[]).map(mapAudit),
  };
}

async function pullStoreViaStaffApi(): Promise<Store | null> {
  try {
    const res = await fetch("/api/om/store", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Store;
  } catch {
    return null;
  }
}

/** Fetch all rows (RLS scopes them to the current user). */
export async function refresh(): Promise<void> {
  // Serialize concurrent refreshes.
  if (loading) return loading;
  const generation = syncGeneration;
  loading = (async () => {
    try {
      if (!isSupabaseConfigured()) {
        if (generation === syncGeneration) {
          cache = loadLocalStore();
          emit();
        }
        return;
      }

      const latest = await fetchStoreFromServer(false);
      if (generation === syncGeneration) {
        cache = latest ?? cache ?? emptyStore();
        emit();
      }
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Replace the cache from the server (used by the "reset demo data" action). */
export async function resetStore(): Promise<void> {
  const remote = await hasSupabaseSession();
  if (remote) {
    await refresh();
    return;
  }
  cache = seedStore(uid);
  if (!isSupabaseConfigured()) persistLocalStore(cache);
  emit();
}

/**
 * Mutate the cache locally, then optionally reload from the server.
 *
 * Client/project writes already went through the server API. On Vercel, a
 * follow-up store read can briefly return the previous snapshot, which makes
 * successful creates vanish and successful deletes reappear. Those mutations
 * skip the immediate refetch and keep the confirmed local state.
 */
async function mutate(
  localFn: (s: Store) => void,
  staffSync = false,
  options: { syncAfter?: boolean } = {}
): Promise<void> {
  invalidatePendingSyncs();
  if (!cache) cache = emptyStore();
  localFn(cache);
  publishStore(); // optimistic UI update (new snapshot reference)
  if (options.syncAfter === false) {
    if (!isSupabaseConfigured()) persistLocalStore(cache);
    return;
  }
  await syncStoreFromServer(staffSync);
}

/* ===================== Audit + activity helpers ==================== */

export async function logAudit(user: User, action: AuditEntry["action"], target: string) {
  await supabase.from("audit").insert({
    user_id: user.id,
    user_name: user.name,
    action,
    target,
  });
  await mutate((s) => {
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action, target });
  });
}

export async function logClientActivity(clientId: string, ev: Omit<ActivityEvent, "id" | "ts">) {
  await supabase.from("client_activity").insert({ client_id: clientId, type: ev.type, detail: ev.detail });
  await mutate((s) => {
    const c = s.clients.find((x) => x.id === clientId);
    if (c) c.activity.unshift({ id: uid(), ts: nowISO(), ...ev });
  });
}

/* ============================ Selectors ============================= */

export function visibleProjects(user: User | null): Project[] {
  const s = getStore();
  if (!user) return [];
  if (user.role !== "client") return s.projects;
  if (user.clientSubRole === "client_viewer" && user.restrictedProjectId) {
    return s.projects.filter((p) => p.id === user.restrictedProjectId);
  }
  return s.projects.filter((p) => p.clientId === user.clientId);
}

export function visibleClients(user: User | null): Client[] {
  const s = getStore();
  if (!user || user.role !== "super_admin") return [];
  return s.clients;
}

export function getProject(id: string): Project | undefined {
  return getStore().projects.find((p) => p.id === id);
}

export function getClient(id: string): Client | undefined {
  return getStore().clients.find((c) => c.id === id);
}

/* =================== Module 1: Clients CRUD ======================== */

export async function createClient(input: Omit<Client, "id" | "createdAt" | "activity">, user: User) {
  const id = uid("c");
  const client: Client = {
    ...input,
    id,
    createdAt: nowISO(),
    activity: [{ id: uid(), ts: nowISO(), type: "create", detail: "Client onboarded" }],
  };

  const row = {
    id,
    company: input.company,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone,
    billing_tier: input.billingTier,
    status: input.status,
  };
  if (isSupabaseConfigured()) {
    await staffApiWrite("/api/om/clients", "POST", row);
  }
  // In local (!configured) mode the mutate below + persistLocalStore handles persistence.

  await mutate((s) => {
    s.clients = s.clients.filter((c) => c.id !== client.id);
    s.clients.push(client);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "create",
      target: `Client ${input.company}`,
    });
  }, true, { syncAfter: false });
  return client;
}

export async function updateClient(id: string, patch: Partial<Client>, user: User) {
  const row: Record<string, unknown> = {};
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.contactName !== undefined) row.contact_name = patch.contactName;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.billingTier !== undefined) row.billing_tier = patch.billingTier;
  if (patch.status !== undefined) row.status = patch.status;
  if (isSupabaseConfigured() && Object.keys(row).length > 0) {
    await staffApiWrite("/api/om/clients", "PATCH", { id, ...row });
  }
  await mutate((s) => {
    const c = s.clients.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "edit", target: `Client ${id}` });
  }, true, { syncAfter: false });
}

export async function deleteClient(id: string, user: User) {
  if (isSupabaseConfigured()) {
    await staffApiDelete("/api/om/clients", id);
  }
  // In local (!configured) mode the mutate below + persistLocalStore handles it.

  await mutate((s) => {
    s.clients = s.clients.filter((c) => c.id !== id);
    s.projects = s.projects.filter((p) => p.clientId !== id);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "delete", target: `Client ${id}` });
  }, true, { syncAfter: false });
}

/* =================== Module 2: Projects CRUD ======================= */

export async function createProject(
  input: Omit<Project, "id" | "stringZones" | "gallery" | "clientNotes" | "maintenanceSchedule"> &
    Partial<Pick<Project, "stringZones" | "gallery" | "clientNotes" | "maintenanceSchedule">>,
  user: User
) {
  if (!input.clientId?.trim()) {
    throw new Error("A client must be selected before creating a project.");
  }
  if (!input.name?.trim()) {
    throw new Error("Project name is required.");
  }

  const store = getStore();
  if (!store.clients.some((c) => c.id === input.clientId)) {
    throw new Error("The selected client was not found. Refresh the page and try again.");
  }

  const id = uid("p");
  const project: Project = {
    stringZones: [],
    gallery: [],
    clientNotes: "",
    maintenanceSchedule: ["Quarterly"],
    ...input,
    id,
    name: input.name.trim(),
  };

  const row = projectToDbRow(project);
  if (isSupabaseConfigured()) {
    await staffApiWrite("/api/om/projects", "POST", row);
  }
  await mutate((s) => {
    s.projects = s.projects.filter((p) => p.id !== project.id);
    s.projects.push(project);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "create", target: `Project ${project.name}` });
  }, true, { syncAfter: false });
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>, user: User) {
  const existing = getStore().projects.find((p) => p.id === id);
  if (!existing) throw new Error("Project not found.");

  const merged: Project = { ...existing, ...patch, id };
  const row = projectToDbRow(merged);
  delete (row as { id?: string }).id;

  if (isSupabaseConfigured()) {
    await staffApiWrite("/api/om/projects", "PATCH", { ...row, id });
  }
  await mutate((s) => {
    const p = s.projects.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "edit", target: `Project ${id}` });
  }, true, { syncAfter: false });
}

export async function deleteProject(id: string, user: User) {
  if (isSupabaseConfigured()) {
    await staffApiDelete("/api/om/projects", id);
  }
  // In local (!configured) mode the mutate below + persistLocalStore handles it.

  await mutate((s) => {
    s.projects = s.projects.filter((p) => p.id !== id);
    s.visits = s.visits.filter((v) => v.projectId !== id);
    s.inspections = s.inspections.filter((i) => i.projectId !== id);
    s.performance = s.performance.filter((r) => r.projectId !== id);
    s.docs = s.docs.filter((d) => d.projectId !== id);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "delete", target: `Project ${id}` });
  }, true, { syncAfter: false });
}

/* =================== Module 3: Visits + defects ==================== */

export async function addVisit(input: Omit<MaintenanceVisit, "id" | "createdAt">, user: User) {
  const { data, error } = await supabase
    .from("visits")
    .insert({
      project_id: input.projectId,
      date: input.date,
      technician: input.technician,
      cleaning_type: input.cleaningType,
      weather: input.weather,
      pre_observation: input.preObservation,
      post_observation: input.postObservation,
      images: input.images,
      signature: input.signature,
    })
    .select()
    .single();
  if (error) throw error;
  // insert nested defects
  if (input.defects.length) {
    await supabase.from("defects").insert(
      input.defects.map((d) => ({
        visit_id: data.id,
        category: d.category,
        description: d.description,
        status: d.status,
        opened_at: d.openedAt,
        resolved_at: d.resolvedAt ?? null,
      }))
    );
  }
  await mutate((s) => {
    s.visits.push({ ...input, id: data.id, createdAt: data.created_at });
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "create", target: `Visit ${input.date} (${input.projectId})` });
  });
  return getStore().visits.find((v) => v.id === data.id)!;
}

export async function updateVisit(id: string, patch: Partial<MaintenanceVisit>) {
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.technician !== undefined) row.technician = patch.technician;
  if (patch.cleaningType !== undefined) row.cleaning_type = patch.cleaningType;
  if (patch.weather !== undefined) row.weather = patch.weather;
  if (patch.preObservation !== undefined) row.pre_observation = patch.preObservation;
  if (patch.postObservation !== undefined) row.post_observation = patch.postObservation;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.signature !== undefined) row.signature = patch.signature;
  await supabase.from("visits").update(row).eq("id", id);
  await mutate((s) => {
    const v = s.visits.find((x) => x.id === id);
    if (v) Object.assign(v, patch);
  });
}

export function visitsFor(projectId: string): MaintenanceVisit[] {
  return getStore()
    .visits.filter((v) => v.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function toggleDefect(visitId: string, defectId: string, user: User) {
  const visit = getStore().visits.find((v) => v.id === visitId);
  const defect = visit?.defects.find((d) => d.id === defectId);
  if (!defect) return;
  const newStatus = defect.status === "Open" ? "Resolved" : "Open";
  await supabase
    .from("defects")
    .update({ status: newStatus, resolved_at: newStatus === "Resolved" ? nowISO() : null })
    .eq("id", defectId);
  await mutate((s) => {
    const v = s.visits.find((x) => x.id === visitId);
    const d = v?.defects.find((x) => x.id === defectId);
    if (d) {
      d.status = newStatus;
      d.resolvedAt = newStatus === "Resolved" ? nowISO() : undefined;
    }
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "edit", target: `Defect ${defectId}` });
  });
}

export function maintenanceStatus(project: Project): {
  lastVisit?: MaintenanceVisit;
  lastDate?: string;
  daysSince: number;
  dueDays: number;
  overdue: boolean;
} {
  const v = visitsFor(project.id);
  const last = v[0];
  const lastDate = last ? new Date(last.date) : null;
  const daysSince = lastDate
    ? Math.floor((Date.now() - lastDate.getTime()) / 86400000)
    : 9999;
  const intervalDays = Math.min(
    ...project.maintenanceSchedule.map((f) =>
      f === "Monthly" ? 30 : f === "Quarterly" ? 90 : f === "Half-yearly" ? 180 : 365
    )
  );
  return {
    lastVisit: last,
    lastDate: last?.date,
    daysSince,
    dueDays: intervalDays,
    overdue: daysSince > intervalDays,
  };
}

export function healthScore(project: Project): number {
  const { daysSince, dueDays, overdue } = maintenanceStatus(project);
  const recency = overdue ? Math.max(0, 100 - (daysSince - dueDays)) : 100;
  const openDefects = visitsFor(project.id).flatMap((v) => v.defects).filter((d) => d.status === "Open").length;
  const openAnomalies = getStore()
    .inspections.filter((i) => i.projectId === project.id)
    .flatMap((i) => i.anomalies)
    .filter((a) => a.status === "Open").length;
  const penalty = Math.min(40, (openDefects + openAnomalies) * 5);
  return Math.max(0, Math.round(recency - penalty));
}

/* ================ Module 4: Drone inspections ===================== */

export async function addInspection(input: Omit<DroneInspection, "id" | "createdAt">, user: User) {
  const row = {
    project_id: input.projectId,
    date: input.date,
    orthomosaic_url: input.orthomosaicUrl ?? null,
    rgb_url: input.rgbUrl ?? null,
    thermal_url: input.thermalUrl ?? null,
    report_pdf_url: input.reportPdfUrl ?? null,
    processed_images: input.processedImages,
    layout_url: input.layoutUrl ?? null,
    anomalies: input.anomalies.map((a) => ({
      panel_id: a.panelId,
      type: a.type,
      severity: a.severity,
      status: a.status,
      detected_at: a.detectedAt,
      resolved_at: a.resolvedAt ?? null,
      x: a.x ?? null,
      y: a.y ?? null,
      note: a.note ?? null,
    })),
  };

  let saved: { id: string; created_at: string };
  if (isSupabaseConfigured()) {
    const payload = (await staffApiWrite("/api/om/inspections", "POST", row)) as {
      inspection?: { id: string; created_at: string };
    } | null;
    if (!payload?.inspection) throw new Error("Inspection was not saved.");
    saved = payload.inspection;
  } else {
    saved = { id: uid("ins"), created_at: nowISO() };
  }

  await mutate((s) => {
    s.inspections = s.inspections.filter((i) => i.id !== saved.id);
    s.inspections.push({ ...input, id: saved.id, createdAt: saved.created_at });
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "upload", target: `Inspection ${input.date} (${input.projectId})` });
  }, true, { syncAfter: false });
  return getStore().inspections.find((i) => i.id === saved.id)!;
}

export async function updateInspection(id: string, patch: Partial<DroneInspection>) {
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.orthomosaicUrl !== undefined) row.orthomosaic_url = patch.orthomosaicUrl;
  if (patch.rgbUrl !== undefined) row.rgb_url = patch.rgbUrl;
  if (patch.thermalUrl !== undefined) row.thermal_url = patch.thermalUrl;
  if (patch.reportPdfUrl !== undefined) row.report_pdf_url = patch.reportPdfUrl;
  if (patch.processedImages !== undefined) row.processed_images = patch.processedImages;
  if (patch.layoutUrl !== undefined) row.layout_url = patch.layoutUrl;
  await supabase.from("inspections").update(row).eq("id", id);
  await mutate((s) => {
    const i = s.inspections.find((x) => x.id === id);
    if (i) Object.assign(i, patch);
  });
}

/** Add a single anomaly to an inspection (separate table). */
export async function addAnomaly(inspectionId: string, anomaly: Omit<Anomaly, "id">) {
  const { data, error } = await supabase
    .from("anomalies")
    .insert({
      inspection_id: inspectionId,
      panel_id: anomaly.panelId,
      type: anomaly.type,
      severity: anomaly.severity,
      status: anomaly.status,
      detected_at: anomaly.detectedAt,
      resolved_at: anomaly.resolvedAt ?? null,
      x: anomaly.x ?? null,
      y: anomaly.y ?? null,
      note: anomaly.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await mutate((s) => {
    const ins = s.inspections.find((x) => x.id === inspectionId);
    if (ins) ins.anomalies.push({ ...anomaly, id: data.id });
  });
}

export async function toggleAnomaly(inspectionId: string, anomalyId: string) {
  const ins = getStore().inspections.find((i) => i.id === inspectionId);
  const anomaly = ins?.anomalies.find((a) => a.id === anomalyId);
  if (!anomaly) return;
  const newStatus = anomaly.status === "Open" ? "Resolved" : "Open";
  await supabase
    .from("anomalies")
    .update({ status: newStatus, resolved_at: newStatus === "Resolved" ? nowISO() : null })
    .eq("id", anomalyId);
  await mutate((s) => {
    const ins2 = s.inspections.find((x) => x.id === inspectionId);
    const a = ins2?.anomalies.find((x) => x.id === anomalyId);
    if (a) {
      a.status = newStatus;
      a.resolvedAt = newStatus === "Resolved" ? nowISO() : undefined;
    }
  });
}

export function inspectionsFor(projectId: string): DroneInspection[] {
  return getStore()
    .inspections.filter((i) => i.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function persistentAnomalies(projectId: string) {
  const ins = inspectionsFor(projectId);
  const openNow = new Set(
    ins[0]?.anomalies.filter((a) => a.status === "Open").map((a) => a.panelId + a.type) ?? []
  );
  const earlier = ins.slice(1);
  return earlier.flatMap((i) =>
    i.anomalies
      .filter((a) => openNow.has(a.panelId + a.type))
      .map((a) => ({ earlier: a, latest: ins[0] }))
  );
}

/* ================ Module 5: Performance =========================== */

export async function addPerformance(projectId: string, date: string, energyKWh: number, user: User) {
  const project = getProject(projectId);
  const expected = project ? +(project.sizeKWp * 4.6).toFixed(1) : energyKWh;
  const { error } = await supabase.from("performance").upsert(
    { project_id: projectId, date, energy_kwh: energyKWh, expected_kwh: expected },
    { onConflict: "project_id,date" }
  );
  if (error) throw error;
  await mutate((s) => {
    s.performance.push({ id: uid("perf"), projectId, date, energyKWh, expectedKWh: expected });
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "upload", target: `Performance ${date} (${projectId})` });
  });
}

export function performanceFor(projectId: string): PerformanceRecord[] {
  return getStore()
    .performance.filter((r) => r.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function performanceRatio(projectId: string): number {
  const recs = performanceFor(projectId);
  if (!recs.length) return 0;
  const pr = recs.reduce((s, r) => s + (r.energyKWh / r.expectedKWh) * 100, 0) / recs.length;
  return Math.round(pr * 10) / 10;
}

export function co2OffsetKg(projectId: string): number {
  const total = performanceFor(projectId).reduce((s, r) => s + r.energyKWh, 0);
  return Math.round(total * 0.42);
}

export function parsePerformanceCsv(text: string): { date: string; energyKWh: number }[] {
  const lines = text.trim().split(/\r?\n/);
  const out: { date: string; energyKWh: number }[] = [];
  for (const line of lines) {
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 2) continue;
    const iso = parts[0];
    const energy = parseFloat(parts[1]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || isNaN(energy)) continue;
    out.push({ date: iso, energyKWh: energy });
  }
  return out;
}

/* ================ Module 6: Documents + audit ===================== */

export async function addDoc(input: Omit<VaultDoc, "id" | "uploadedAt">, user: User) {
  const { data, error } = await supabase
    .from("docs")
    .insert({
      project_id: input.projectId,
      name: input.name,
      type: input.type,
      url: input.url,
      uploaded_by: input.uploadedBy,
    })
    .select()
    .single();
  if (error) throw error;
  await mutate((s) => {
    s.docs.push({ ...input, id: data.id, uploadedAt: data.uploaded_at });
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "upload", target: `Doc ${input.name}` });
  });
  return getStore().docs.find((d) => d.id === data.id)!;
}

export async function deleteDoc(id: string, user: User) {
  await supabase.from("docs").delete().eq("id", id);
  await mutate((s) => {
    s.docs = s.docs.filter((d) => d.id !== id);
    s.audit.unshift({ id: uid(), ts: nowISO(), userId: user.id, userName: user.name, action: "delete", target: `Doc ${id}` });
  });
}

export function docsFor(projectId: string): VaultDoc[] {
  return getStore()
    .docs.filter((d) => d.projectId === projectId)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}
