/**
 * lib/om.ts — O&M Portal data layer.
 *
 * A single localStorage-backed store powers all six modules. It is
 * intentionally framework-light: a plain object + a tiny pub/sub so
 * React components re-render on change. In production this would be a
 * REST/GraphQL API; the selector signatures below are designed to map
 * cleanly onto one.
 */

import type { User } from "./auth";

/* ============================== Types =============================== */

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
  /** number of panels in this string/zone */
  panelCount: number;
  /** free text, e.g. "Roof block A east" */
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
  /** free-text notes visible to the client */
  clientNotes: string;
  maintenanceSchedule: ScheduleFrequency[];
};

export type ScheduleFrequency = "Monthly" | "Quarterly" | "Half-yearly" | "Annual";

export type CleaningType = "Dry cleaning" | "Wet cleaning" | "Robotic cleaning" | "None";
export type Weather = "Sunny" | "Cloudy" | "Overcast" | "Rainy";

export type VisitImage = {
  id: string;
  url: string;
  tag: string; // zone/string tag
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
  signature: string; // typed sign-off name
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
  /** processed anomaly overlay images */
  processedImages: { id: string; url: string; label: string }[];
  /** background layout image for pinning anomalies */
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
  /** pin position on the layout image, in percent (0-100) */
  x?: number;
  y?: number;
  note?: string;
};

export type PerformanceRecord = {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  energyKWh: number;
  /** expected yield for the day, kWp * peak-sun-hours */
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

const STORE_KEY = "om_store_v1";

let cache: Store | null = null;
type Listener = () => void;
const listeners = new Set<Listener>();

function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function seed(): Store {
  return {
    clients: [
      {
        id: "c-nestle",
        company: "Nestlé Pakistan",
        contactName: "Ahsan Khan",
        email: "client@nestle.com",
        phone: "+92 300 1234567",
        billingTier: "Enterprise",
        status: "Active",
        createdAt: "2021-03-01T00:00:00Z",
        activity: [
          { id: uid(), ts: "2026-06-20T08:14:00Z", type: "login", detail: "Logged in" },
          { id: uid(), ts: "2026-06-18T11:02:00Z", type: "download", detail: "Downloaded performance report" },
        ],
      },
      {
        id: "c-jzs",
        company: "JZS Farm",
        contactName: "Imran Yousuf",
        email: "viewer@jzs.com",
        phone: "+92 321 7654321",
        billingTier: "Pro",
        status: "Active",
        createdAt: "2019-08-15T00:00:00Z",
        activity: [
          { id: uid(), ts: "2026-06-22T07:30:00Z", type: "login", detail: "Logged in" },
          { id: uid(), ts: "2026-06-15T09:45:00Z", type: "view", detail: "Viewed drone inspection" },
        ],
      },
      {
        id: "c-qa",
        company: "Quaid-e-Azam Solar Power",
        contactName: "Bilal Ahmed",
        email: "bilal@qasp.com.pk",
        phone: "+92 333 9876543",
        billingTier: "Enterprise",
        status: "Active",
        createdAt: "2015-05-01T00:00:00Z",
        activity: [
          { id: uid(), ts: "2026-06-21T13:20:00Z", type: "login", detail: "Logged in" },
        ],
      },
    ],
    projects: [
      {
        id: "p-nestle-1",
        clientId: "c-nestle",
        name: "Nestlé Sheikhupura Rooftop",
        address: "Ferozewala, Sheikhupura, Punjab",
        lat: 31.516,
        lng: 74.0167,
        sizeKWp: 450,
        panelCount: 11250,
        inverterBrand: "Huawei",
        inverterModel: "SUN2000-100KTL",
        hasBattery: false,
        gridType: "On-grid",
        installedAt: "2021-03-15",
        warrantyExpiry: "2031-03-15",
        siteContactName: "Tariq Mehmood",
        siteContactPhone: "+92 300 5551122",
        classification: "Industrial",
        status: "Active",
        stringZones: [
          { id: uid(), name: "String 1-12", panelCount: 1320, location: "Roof block A" },
          { id: uid(), name: "String 13-24", panelCount: 1320, location: "Roof block B" },
        ],
        gallery: [],
        clientNotes: "Quarterly performance review scheduled with sustainability team.",
        maintenanceSchedule: ["Quarterly"],
      },
      {
        id: "p-jzs-1",
        clientId: "c-jzs",
        name: "JZS Sahiwal Ground-Mount",
        address: "Sahiwal, Punjab",
        lat: 30.6662,
        lng: 73.0223,
        sizeKWp: 20,
        panelCount: 8224,
        inverterBrand: "Sungrow",
        inverterModel: "SG250HX",
        hasBattery: true,
        batterySystem: "Tesla Powerpack 200 kWh",
        gridType: "Hybrid",
        installedAt: "2019-08-20",
        warrantyExpiry: "2029-08-20",
        siteContactName: "Imran Yousuf",
        siteContactPhone: "+92 321 7654321",
        classification: "Commercial",
        status: "Active",
        stringZones: [
          { id: uid(), name: "Zone A", panelCount: 4112, location: "North array" },
          { id: uid(), name: "Zone B", panelCount: 4112, location: "South array" },
        ],
        gallery: [],
        clientNotes: "Bird-deterrent netting installed in Zone B (May 2026).",
        maintenanceSchedule: ["Monthly"],
      },
      {
        id: "p-qa-1",
        clientId: "c-qa",
        name: "QASP Phase-I 100MW",
        address: "Lal Suhanra, Bahawalpur",
        lat: 29.3858,
        lng: 71.6908,
        sizeKWp: 100000,
        panelCount: 411200,
        inverterBrand: "Sungrow",
        inverterModel: "SG2500HV",
        hasBattery: false,
        gridType: "On-grid",
        installedAt: "2015-05-01",
        warrantyExpiry: "2025-05-01",
        siteContactName: "Bilal Ahmed",
        siteContactPhone: "+92 333 9876543",
        classification: "Industrial",
        status: "Under Maintenance",
        stringZones: [
          { id: uid(), name: "Block A", panelCount: 102800, location: "West field" },
          { id: uid(), name: "Block B", panelCount: 102800, location: "East field" },
        ],
        gallery: [],
        clientNotes: "Inverter firmware upgrade underway for Block A.",
        maintenanceSchedule: ["Monthly", "Half-yearly"],
      },
    ],
    visits: [
      {
        id: uid("v"),
        projectId: "p-nestle-1",
        date: "2026-05-12",
        technician: "Shahzad Hassan",
        cleaningType: "Wet cleaning",
        weather: "Sunny",
        preObservation: "Moderate dust accumulation observed on block A.",
        postObservation: "All panels cleaned. Post-clean IR readings nominal.",
        images: [],
        defects: [
          {
            id: uid(),
            category: "Soiling",
            description: "Heavy soiling on panel A-204",
            status: "Resolved",
            openedAt: "2026-05-12T09:00:00Z",
            resolvedAt: "2026-05-12T11:30:00Z",
          },
        ],
        signature: "Shahzad Hassan",
        createdAt: "2026-05-12T08:00:00Z",
      },
    ],
    inspections: [
      {
        id: uid("ins"),
        projectId: "p-nestle-1",
        date: "2026-04-10",
        processedImages: [],
        anomalies: [
          {
            id: uid(),
            panelId: "A-104",
            type: "Hotspot",
            severity: "Critical",
            status: "Open",
            detectedAt: "2026-04-10",
            x: 32,
            y: 45,
            note: "ΔT 22°C",
          },
          {
            id: uid(),
            panelId: "B-058",
            type: "Soiling",
            severity: "Info",
            status: "Resolved",
            detectedAt: "2026-04-10",
            resolvedAt: "2026-05-12",
            x: 68,
            y: 60,
          },
        ],
        createdAt: "2026-04-10T00:00:00Z",
      },
    ],
    performance: seedPerformance(),
    docs: [
      {
        id: uid(),
        projectId: "p-nestle-1",
        name: "Module Warranty 25yr.pdf",
        type: "Warranty",
        url: "#",
        uploadedAt: "2021-03-16T00:00:00Z",
        uploadedBy: "admin@datafy.com",
      },
      {
        id: uid(),
        projectId: "p-nestle-1",
        name: "Huawei SUN2000 Manual.pdf",
        type: "Inverter manual",
        url: "#",
        uploadedAt: "2021-03-16T00:00:00Z",
        uploadedBy: "admin@datafy.com",
      },
    ],
    audit: [
      {
        id: uid(),
        ts: "2026-06-20T08:14:00Z",
        userId: "om-client-1",
        userName: "Ahsan Khan",
        action: "download",
        target: "Performance report (p-nestle-1)",
      },
    ],
  };
}

function seedPerformance(): PerformanceRecord[] {
  const out: PerformanceRecord[] = [];
  const projects = [
    { id: "p-nestle-1", kwp: 450, psh: 4.6 },
    { id: "p-jzs-1", kwp: 20, psh: 4.7 },
    { id: "p-qa-1", kwp: 100000, psh: 4.8 },
  ];
  const today = new Date("2026-06-20T00:00:00Z");
  for (const p of projects) {
    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const wave = Math.sin(d / 3.5) * 0.1 + 0.92;
      const expected = +(p.kwp * p.psh).toFixed(1);
      out.push({
        id: uid("perf"),
        projectId: p.id,
        date: date.toISOString().slice(0, 10),
        energyKWh: +(expected * wave).toFixed(1),
        expectedKWh: expected,
      });
    }
  }
  return out;
}

function load(): Store {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = seed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as Store;
      return cache;
    }
  } catch {
    /* fall through to seed */
  }
  cache = seed();
  persist();
  return cache;
}

function persist() {
  if (cache && typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(cache));
  }
}

function emit() {
  listeners.forEach((l) => l());
}

/** Subscribe to store changes; returns an unsubscribe fn. */
export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getStore(): Store {
  return load();
}

/** Replace the whole store (used by the settings "reset demo data" action). */
export function resetStore(): void {
  cache = seed();
  persist();
  emit();
}

/** Internal mutator: updates the store and notifies listeners. */
function mutate(fn: (s: Store) => void) {
  const s = load();
  fn(s);
  persist();
  emit();
}

/* ===================== Audit + activity helpers ==================== */

export function logAudit(user: User, action: AuditEntry["action"], target: string) {
  mutate((s) => {
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action,
      target,
    });
  });
}

export function logClientActivity(clientId: string, ev: Omit<ActivityEvent, "id" | "ts">) {
  mutate((s) => {
    const c = s.clients.find((x) => x.id === clientId);
    if (c) c.activity.unshift({ id: uid(), ts: nowISO(), ...ev });
  });
}

/* ============================ Selectors ============================= */

/** Projects visible to a given user, honouring client scoping. */
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

export function createClient(input: Omit<Client, "id" | "createdAt" | "activity">, user: User) {
  const client: Client = {
    ...input,
    id: uid("c"),
    createdAt: nowISO(),
    activity: [{ id: uid(), ts: nowISO(), type: "create", detail: "Client onboarded" }],
  };
  mutate((s) => {
    s.clients.push(client);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "create",
      target: `Client ${client.company}`,
    });
  });
  return client;
}

export function updateClient(id: string, patch: Partial<Client>, user: User) {
  mutate((s) => {
    const c = s.clients.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "edit",
      target: `Client ${id}`,
    });
  });
}

export function deleteClient(id: string, user: User) {
  mutate((s) => {
    s.clients = s.clients.filter((c) => c.id !== id);
    s.projects = s.projects.filter((p) => p.clientId !== id);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "delete",
      target: `Client ${id}`,
    });
  });
}

/* =================== Module 2: Projects CRUD ======================= */

export function createProject(input: Omit<Project, "id" | "stringZones" | "gallery" | "clientNotes" | "maintenanceSchedule"> & Partial<Pick<Project, "stringZones" | "gallery" | "clientNotes" | "maintenanceSchedule">>, user: User) {
  const project: Project = {
    stringZones: [],
    gallery: [],
    clientNotes: "",
    maintenanceSchedule: ["Quarterly"],
    ...input,
    id: uid("p"),
  };
  mutate((s) => {
    s.projects.push(project);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "create",
      target: `Project ${project.name}`,
    });
  });
  return project;
}

export function updateProject(id: string, patch: Partial<Project>, user: User) {
  mutate((s) => {
    const p = s.projects.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "edit",
      target: `Project ${id}`,
    });
  });
}

export function deleteProject(id: string, user: User) {
  mutate((s) => {
    s.projects = s.projects.filter((p) => p.id !== id);
    s.visits = s.visits.filter((v) => v.projectId !== id);
    s.inspections = s.inspections.filter((i) => i.projectId !== id);
    s.performance = s.performance.filter((r) => r.projectId !== id);
    s.docs = s.docs.filter((d) => d.projectId !== id);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "delete",
      target: `Project ${id}`,
    });
  });
}

/* =================== Module 3: Visits + defects ==================== */

export function addVisit(input: Omit<MaintenanceVisit, "id" | "createdAt">, user: User) {
  const visit: MaintenanceVisit = { ...input, id: uid("v"), createdAt: nowISO() };
  mutate((s) => {
    s.visits.push(visit);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "create",
      target: `Visit ${visit.date} (${visit.projectId})`,
    });
  });
  return visit;
}

export function updateVisit(id: string, patch: Partial<MaintenanceVisit>, user: User) {
  mutate((s) => {
    const v = s.visits.find((x) => x.id === id);
    if (v) Object.assign(v, patch);
  });
}

export function visitsFor(projectId: string): MaintenanceVisit[] {
  return getStore()
    .visits.filter((v) => v.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function toggleDefect(visitId: string, defectId: string, user: User) {
  mutate((s) => {
    const v = s.visits.find((x) => x.id === visitId);
    const d = v?.defects.find((x) => x.id === defectId);
    if (d) {
      d.status = d.status === "Open" ? "Resolved" : "Open";
      d.resolvedAt = d.status === "Resolved" ? nowISO() : undefined;
    }
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "edit",
      target: `Defect ${defectId}`,
    });
  });
}

/**
 * Days since the last visit. Used to flag overdue maintenance relative
 * to the most frequent scheduled interval.
 */
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

/** 0-100 health score: visit recency + open-defect penalty. */
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

export function addInspection(input: Omit<DroneInspection, "id" | "createdAt">, user: User) {
  const ins: DroneInspection = { ...input, id: uid("ins"), createdAt: nowISO() };
  mutate((s) => {
    s.inspections.push(ins);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "upload",
      target: `Inspection ${ins.date} (${ins.projectId})`,
    });
  });
  return ins;
}

export function updateInspection(id: string, patch: Partial<DroneInspection>, user: User) {
  mutate((s) => {
    const i = s.inspections.find((x) => x.id === id);
    if (i) Object.assign(i, patch);
  });
}

export function toggleAnomaly(inspectionId: string, anomalyId: string, user: User) {
  mutate((s) => {
    const ins = s.inspections.find((x) => x.id === inspectionId);
    const a = ins?.anomalies.find((x) => x.id === anomalyId);
    if (a) {
      a.status = a.status === "Open" ? "Resolved" : "Open";
      a.resolvedAt = a.status === "Resolved" ? nowISO() : undefined;
    }
  });
}

export function inspectionsFor(projectId: string): DroneInspection[] {
  return getStore()
    .inspections.filter((i) => i.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Anomalies that were Open in an earlier inspection and are still Open now. */
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

export function addPerformance(projectId: string, date: string, energyKWh: number, user: User) {
  const project = getProject(projectId);
  const expected = project ? +(project.sizeKWp * 4.6).toFixed(1) : energyKWh;
  mutate((s) => {
    s.performance.push({
      id: uid("perf"),
      projectId,
      date,
      energyKWh,
      expectedKWh: expected,
    });
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "upload",
      target: `Performance ${date} (${projectId})`,
    });
  });
}

export function performanceFor(projectId: string): PerformanceRecord[] {
  return getStore()
    .performance.filter((r) => r.projectId === projectId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Performance Ratio (%) averaged over the period. */
export function performanceRatio(projectId: string): number {
  const recs = performanceFor(projectId);
  if (!recs.length) return 0;
  const pr = recs.reduce((s, r) => s + (r.energyKWh / r.expectedKWh) * 100, 0) / recs.length;
  return Math.round(pr * 10) / 10;
}

/** CO2 offset in kg from total generation (1 kWh ≈ 0.42 kg CO2 averted). */
export function co2OffsetKg(projectId: string): number {
  const total = performanceFor(projectId).reduce((s, r) => s + r.energyKWh, 0);
  return Math.round(total * 0.42);
}

/** Parse simple `date,energy` CSV into records. */
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

export function addDoc(input: Omit<VaultDoc, "id" | "uploadedAt">, user: User) {
  const doc: VaultDoc = { ...input, id: uid(), uploadedAt: nowISO() };
  mutate((s) => {
    s.docs.push(doc);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "upload",
      target: `Doc ${doc.name}`,
    });
  });
  return doc;
}

export function deleteDoc(id: string, user: User) {
  mutate((s) => {
    s.docs = s.docs.filter((d) => d.id !== id);
    s.audit.unshift({
      id: uid(),
      ts: nowISO(),
      userId: user.id,
      userName: user.name,
      action: "delete",
      target: `Doc ${id}`,
    });
  });
}

export function docsFor(projectId: string): VaultDoc[] {
  return getStore()
    .docs.filter((d) => d.projectId === projectId)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export { uid, nowISO };
