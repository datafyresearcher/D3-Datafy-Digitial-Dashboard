/**
 * lib/auth.ts — Hybrid auth for the Datafy portals.
 *
 * Two portals share this layer:
 *  - D³ dashboard (/d3)        — legacy single-user demo dashboard
 *  - O&M portal  (/portal)     — role-based (super_admin / field_engineer / client)
 *
 * Tries Supabase first; falls back to in-memory demo credentials when Supabase
 * is unavailable or users have not been seeded yet.
 */

import { isSupabaseConfigured, supabase } from "@/lib/supabase/browser";

const SESSION_KEY = "d3_session";
const PORTAL_SESSION_KEY = "om_session";
const STORED_USERS_KEY = "om_stored_users";

export type Role = "super_admin" | "field_engineer" | "client";
export type ClientSubRole = "client_admin" | "client_viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  /** Kept on the type for compatibility; always empty under Supabase. */
  password: string;
  role: Role;
  company?: string;
  title?: string;
  /** For client users: the clientId they belong to. */
  clientId?: string;
  /** For client users: sub-role governing project visibility. */
  clientSubRole?: ClientSubRole;
  /** For client_viewer: the single projectId they may see. */
  restrictedProjectId?: string;
  lastLogin?: string | null;
};

/** Row shape in the public.profiles table (snake_case columns). */
type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: string | null;
  title: string | null;
  client_id: string | null;
  client_sub_role: ClientSubRole | null;
  restricted_project_id: string | null;
  last_login: string | null;
};

function toUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    password: "",
    role: p.role,
    company: p.company ?? undefined,
    title: p.title ?? undefined,
    clientId: p.client_id ?? undefined,
    clientSubRole: p.client_sub_role ?? undefined,
    restrictedProjectId: p.restricted_project_id ?? undefined,
    lastLogin: p.last_login,
  };
}

/* ------------------------------------------------------------------ */
/*  Demo credential display (login screens show these as hints)        */
/* ------------------------------------------------------------------ */

export const DEMO_CREDENTIALS = [
  { loginId: "admin@datafy.com", password: "Datafy#2026" },
  { loginId: "engineer@datafy.com", password: "Solar#2026" },
];

export const OM_DEMO_CREDENTIALS = [
  { loginId: "admin@datafy.com", password: "Datafy#2026", role: "Super Admin" },
  { loginId: "engineer@datafy.com", password: "Solar#2026", role: "Field Engineer" },
  { loginId: "client@nestle.com", password: "Nestle#2026", role: "Client Admin" },
  { loginId: "viewer@jzs.com", password: "Jzs#2026", role: "Client Viewer" },
];

const d3Users: Record<string, { password: string; user: User }> = {
  "admin@datafy.com": {
    password: "Datafy#2026",
    user: {
      id: "u-001",
      name: "Badar Munir",
      email: "admin@datafy.com",
      password: "Datafy#2026",
      role: "super_admin",
      company: "Datafy Associate",
      title: "Super Admin",
      lastLogin: null,
    },
  },
  "engineer@datafy.com": {
    password: "Solar#2026",
    user: {
      id: "u-002",
      name: "Shahzad Hassan",
      email: "engineer@datafy.com",
      password: "Solar#2026",
      role: "field_engineer",
      company: "Datafy Associate",
      title: "Performance Engineer",
      lastLogin: null,
    },
  },
};

const omUsers: Record<string, User> = {
  "admin@datafy.com": {
    id: "om-admin",
    name: "Badar Munir",
    email: "admin@datafy.com",
    password: "Datafy#2026",
    role: "super_admin",
    company: "Datafy Associate",
    title: "Super Admin",
    lastLogin: null,
  },
  "engineer@datafy.com": {
    id: "om-eng",
    name: "Shahzad Hassan",
    email: "engineer@datafy.com",
    password: "Solar#2026",
    role: "field_engineer",
    company: "Datafy Associate",
    title: "Field Engineer",
    lastLogin: null,
  },
  "client@nestle.com": {
    id: "om-client-1",
    name: "Ahsan Khan",
    email: "client@nestle.com",
    password: "Nestle#2026",
    role: "client",
    company: "Nestlé Pakistan",
    clientId: "c-nestle",
    clientSubRole: "client_admin",
    title: "Sustainability Lead",
    lastLogin: null,
  },
  "viewer@jzs.com": {
    id: "om-client-2",
    name: "Imran Yousuf",
    email: "viewer@jzs.com",
    password: "Jzs#2026",
    role: "client",
    company: "JZS Farm",
    clientId: "c-jzs",
    clientSubRole: "client_viewer",
    restrictedProjectId: "p-jzs-1",
    title: "Plant Operator",
    lastLogin: null,
  },
};

function readSession(key: string): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, user: User) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(user));
  }
}

function clearSession(key: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key);
  }
}

function loadStoredOmUsers() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORED_USERS_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Record<string, User>;
    for (const [key, user] of Object.entries(stored)) {
      omUsers[key] = user;
    }
  } catch {
    // ignore corrupt data
  }
}

function persistOmUsers() {
  if (typeof window === "undefined") return;
  try {
    const defaults = new Set(OM_DEMO_CREDENTIALS.map((c) => c.loginId));
    const stored: Record<string, User> = {};
    for (const [key, user] of Object.entries(omUsers)) {
      if (!defaults.has(key)) stored[key] = user;
    }
    localStorage.setItem(STORED_USERS_KEY, JSON.stringify(stored));
  } catch {
    // storage full or unavailable
  }
}

loadStoredOmUsers();

function demoLogin(loginId: string, password: string, sessionKey: string): User | null {
  const email = loginId.trim().toLowerCase();
  const entry = d3Users[email];
  if (!entry || entry.password !== password) return null;
  const user = { ...entry.user, lastLogin: new Date().toISOString() };
  writeSession(sessionKey, user);
  return user;
}

function demoOmLogin(loginId: string, password: string): User | null {
  const email = loginId.trim().toLowerCase();
  const user = omUsers[email];
  if (!user || user.password !== password) return null;
  const sessionUser = { ...user, lastLogin: new Date().toISOString() };
  writeSession(PORTAL_SESSION_KEY, sessionUser);
  return sessionUser;
}

/** Known built-in portal demo account (used when Supabase Auth rows are unavailable). */
export function isDemoPortalUser(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  return Object.prototype.hasOwnProperty.call(omUsers, user.email.trim().toLowerCase());
}

/* ------------------------------------------------------------------ */
/*  Fetch the profile row for a given auth uid.                        */
/* ------------------------------------------------------------------ */

async function fetchProfile(uid: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) return null;
  return toUser(data as ProfileRow);
}

/** Stamp last_login on the profile row. Best-effort; ignored on failure. */
async function stampLogin(uid: string) {
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", uid);
}

/* ------------------------------------------------------------------ */
/*  D³ dashboard auth (legacy /d3 portal)                              */
/*  Note: both portals accept the same credentials; only the redirect  */
/*  target differs, so we keep the original two entry points.          */
/* ------------------------------------------------------------------ */

export async function login(loginId: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginId.trim().toLowerCase(),
      password,
    });
    if (!error && data.user) {
      clearSession(SESSION_KEY);
      await stampLogin(data.user.id);
      const profile = await fetchProfile(data.user.id);
      if (profile) return profile;
    }
  } catch {
    // Supabase unavailable — fall through to demo auth.
  }
  return demoLogin(loginId, password, SESSION_KEY);
}

export async function logout(): Promise<void> {
  clearSession(SESSION_KEY);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

export async function getSession(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) {
      const profile = await fetchProfile(uid);
      if (profile) return profile;
    }
  } catch {
    // Supabase unavailable — fall through to demo session.
  }
  return readSession(SESSION_KEY);
}

/* ------------------------------------------------------------------ */
/*  O&M portal auth                                                    */
/* ------------------------------------------------------------------ */

export async function omLogin(loginId: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return demoOmLogin(loginId, password);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginId.trim().toLowerCase(),
      password,
    });
    if (!error && data.user) {
      await stampLogin(data.user.id);
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        writeSession(PORTAL_SESSION_KEY, profile);
        return profile;
      }
      await supabase.auth.signOut();
    }
  } catch {
    // Supabase Auth unavailable — fall through to demo accounts.
  }

  return demoOmLogin(loginId, password);
}

export async function omLogout(): Promise<void> {
  clearSession(PORTAL_SESSION_KEY);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

export async function getOmSession(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return readSession(PORTAL_SESSION_KEY);
  }

  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) {
      const profile = await fetchProfile(uid);
      if (profile) {
        writeSession(PORTAL_SESSION_KEY, profile);
        return profile;
      }
      await supabase.auth.signOut();
    }
  } catch {
    // Fall through to cached demo session.
  }

  const cached = readSession(PORTAL_SESSION_KEY);
  return isDemoPortalUser(cached) ? cached : null;
}

/* ------------------------------------------------------------------ */
/*  Onboarding a new client user (used by ClientsView).                */
/*  Creates an auth user via the service-role key through a route,     */
/*  then inserts the profile. Client components can't use the service  */
/*  key directly, so this calls /api/om/create-user.                   */
/* ------------------------------------------------------------------ */

export async function addOmUser(input: {
  name: string;
  email: string;
  password: string;
  company: string;
  clientId: string;
  clientSubRole?: ClientSubRole;
}): Promise<User | null> {
  let apiError = "Could not create the client login account.";
  try {
    const res = await fetch("/api/om/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const { user } = await res.json();
      return user as User;
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    apiError = body?.error ?? apiError;
    if (isSupabaseConfigured()) {
      throw new Error(apiError);
    }
  } catch (err) {
    if (isSupabaseConfigured()) throw err;
    // API unavailable in local demo mode — fall through to local demo user store.
  }

  const user: User = {
    id: `om-user-${Date.now()}`,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: "client",
    company: input.company,
    clientId: input.clientId,
    clientSubRole: input.clientSubRole ?? "client_admin",
    lastLogin: null,
  };
  omUsers[user.email] = user;
  persistOmUsers();
  return user;
}

/**
 * @deprecated Kept only for backward-compat with older imports.
 * Under Supabase, users live in the database — call fetchProfiles() instead.
 */
export async function fetchProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) return [];
  return (data as ProfileRow[]).map(toUser);
}

/** Demo/local users linked to a client (used when Supabase profiles are unavailable). */
export function getOmUsersForClient(clientId: string): User[] {
  return Object.values(omUsers).filter((u) => u.clientId === clientId);
}

/** Permission helpers used across the portal. */
export function can(user: User | null, action: "manage" | "upload" | "read") {
  if (!user) return false;
  if (action === "read") return true;
  if (action === "upload") return user.role === "super_admin" || user.role === "field_engineer";
  if (action === "manage") return user.role === "super_admin";
  return false;
}
