/**
 * Client-side auth for the Datafy portals.
 *
 * Supports two portals:
 *  - D³ dashboard (/d3)        — legacy single-user demo dashboard
 *  - O&M portal  (/portal)     — role-based (super_admin / field_engineer / client)
 *
 * Auth is client-side/demo: credentials live in-memory and the session is
 * persisted in localStorage. The contract is backend-agnostic so a real
 * service can be swapped in without touching the UI.
 */

export type Role = "super_admin" | "field_engineer" | "client";
export type ClientSubRole = "client_admin" | "client_viewer";

export type User = {
  id: string;
  name: string;
  email: string;
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

const SESSION_KEY = "d3_session";
const PORTAL_SESSION_KEY = "om_session";
const STORED_USERS_KEY = "om_stored_users";

/* ------------------------------------------------------------------ */
/*  Credentials                                                        */
/* ------------------------------------------------------------------ */

/**
 * D³ dashboard users (legacy /d3 portal). Kept for backward compatibility.
 */
export const users: Record<string, { password: string; user: User }> = {
  "admin@datafy.com": {
    password: "Datafy@123",
    user: {
      id: "u-001",
      name: "Badar Munir",
      email: "admin@datafy.com",
      password: "Datafy@123",
      role: "super_admin",
      company: "Quaid-e-Azam Solar Power",
      title: "Plant Manager",
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

/**
 * O&M portal credentials. Roles: super_admin, field_engineer, client.
 * Client users carry a clientId + sub-role so the portal can restrict
 * their view to their own projects.
 */
export const omUsers: Record<string, User> = {
  "admin@datafy.com": {
    id: "om-admin",
    name: "Badar Munir",
    email: "admin@datafy.com",
    password: "Datafy@123",
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

export const OM_DEMO_CREDENTIALS = [
  { loginId: "admin@datafy.com", password: "Datafy@123", role: "Super Admin" },
  { loginId: "engineer@datafy.com", password: "Solar#2026", role: "Field Engineer" },
  { loginId: "client@nestle.com", password: "Nestle#2026", role: "Client Admin" },
  { loginId: "viewer@jzs.com", password: "Jzs#2026", role: "Client Viewer" },
];

export const DEMO_CREDENTIALS = [
  { loginId: "admin@datafy.com", password: "Datafy@123" },
  { loginId: "engineer@datafy.com", password: "Solar#2026" },
];

/* ------------------------------------------------------------------ */
/*  Session helpers (shared)                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  D³ dashboard auth (legacy)                                        */
/* ------------------------------------------------------------------ */

export function login(loginId: string, password: string): User | null {
  const entry = users[loginId.trim().toLowerCase()];
  if (!entry || entry.password !== password) return null;
  const user = entry.user;
  user.lastLogin = new Date().toISOString();
  writeSession(SESSION_KEY, user);
  return user;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): User | null {
  return readSession(SESSION_KEY);
}

/* ------------------------------------------------------------------ */
/*  O&M portal auth                                                   */
/* ------------------------------------------------------------------ */

export function omLogin(loginId: string, password: string): User | null {
  const user = omUsers[loginId.trim().toLowerCase()];
  if (!user || user.password !== password) return null;
  user.lastLogin = new Date().toISOString();
  writeSession(PORTAL_SESSION_KEY, user);
  return user;
}

export function omLogout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PORTAL_SESSION_KEY);
  }
}

export function getOmSession(): User | null {
  return readSession(PORTAL_SESSION_KEY);
}

/**
 * Load any previously stored O&M users from localStorage so they survive
 * page refreshes.
 */
function loadStoredOmUsers() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(STORED_USERS_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Record<string, User>;
      for (const [key, u] of Object.entries(stored)) {
        omUsers[key] = u;
      }
    }
  } catch {
    // ignore corrupt data
  }
}

function persistOmUsers() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    // Only persist dynamically-created users (those not in the hardcoded defaults).
    const defaults = new Set([
      "admin@datafy.com",
      "engineer@datafy.com",
      "client@nestle.com",
      "viewer@jzs.com",
    ]);
    const stored: Record<string, User> = {};
    for (const [key, u] of Object.entries(omUsers)) {
      if (!defaults.has(key)) {
        stored[key] = u;
      }
    }
    localStorage.setItem(STORED_USERS_KEY, JSON.stringify(stored));
  } catch {
    // storage full or unavailable
  }
}

// Hydrate runtime users from localStorage on module load.
loadStoredOmUsers();

/**
 * Register a new O&M portal user at runtime (used when onboarding clients).
 * Adds the user to the in-memory omUsers record and persists it so the
 * credential survives a page refresh.
 */
export function addOmUser(input: {
  name: string;
  email: string;
  password: string;
  company: string;
  clientId: string;
  clientSubRole?: ClientSubRole;
}): User {
  const user: User = {
    id: `om-user-${Date.now()}`,
    name: input.name,
    email: input.email,
    password: input.password,
    role: "client",
    company: input.company,
    clientId: input.clientId,
    clientSubRole: input.clientSubRole ?? "client_admin",
    lastLogin: null,
  };
  omUsers[input.email.toLowerCase()] = user;
  persistOmUsers();
  return user;
}

/** Permission helpers used across the portal. */
export function can(user: User | null, action: "manage" | "upload" | "read") {
  if (!user) return false;
  if (action === "read") return true;
  if (action === "upload") return user.role === "super_admin" || user.role === "field_engineer";
  if (action === "manage") return user.role === "super_admin";
  return false;
}
