"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Pencil,
  Activity,
  KeyRound,
  Users,
  ShieldCheck,
} from "lucide-react";
import type { User } from "@/lib/auth";
import { addOmUser, getOmUsersForClient } from "@/lib/auth";
import { supabase } from "@/lib/supabase/browser";
import {
  type Store,
  type Client,
  type ClientStatus,
  type BillingTier,
  createClient,
  updateClient,
  deleteClient,
  formatOmError,
  refresh,
} from "@/lib/om";
import { canManage } from "../perms";
import {
  Button,
  Card,
  CardHeader,
  Badge,
  Field,
  Input,
  Select,
  Modal,
  EmptyState,
} from "../ui";

const STATUSES: ClientStatus[] = ["Active", "Suspended", "Archived"];
const TIERS: BillingTier[] = ["Basic", "Pro", "Enterprise"];

const STATUS_TONE: Record<ClientStatus, "green" | "amber" | "neutral"> = {
  Active: "green",
  Suspended: "amber",
  Archived: "neutral",
};

function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function ClientsView({ user, store }: { user: User; store: Store }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activityFor, setActivityFor] = useState<Client | null>(null);
  const [usersFor, setUsersFor] = useState<Client | null>(null);
  const [clientUsers, setClientUsers] = useState<User[]>([]);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch the profiles linked to the selected client whenever the Users modal opens.
  useEffect(() => {
    if (!usersFor) {
      setClientUsers([]);
      return;
    }
    let active = true;
    (async () => {
      const demoUsers = getOmUsersForClient(usersFor.id);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("client_id", usersFor.id);
        if (!active) return;
        const remoteUsers = (data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          password: "",
          role: r.role,
          company: r.company ?? undefined,
          clientId: r.client_id ?? undefined,
          clientSubRole: r.client_sub_role ?? undefined,
          lastLogin: r.last_login,
        }));
        const byEmail = new Map<string, User>();
        for (const u of [...remoteUsers, ...demoUsers]) byEmail.set(u.email, u);
        setClientUsers([...byEmail.values()]);
      } catch {
        if (active) setClientUsers(demoUsers);
      }
    })();
    return () => {
      active = false;
    };
  }, [usersFor]);

  const filtered = useMemo(
    () =>
      [...store.clients]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .filter(
          (c) =>
            c.company.toLowerCase().includes(query.toLowerCase()) ||
            c.contactName.toLowerCase().includes(query.toLowerCase())
        ),
    [store.clients, query]
  );

  if (!canManage(user)) {
    return (
      <Card>
        <EmptyState icon={ShieldCheck} title="Access restricted" hint="Only Super Admins manage clients." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Client &amp; User Management</h2>
          <p className="text-sm text-om-muted max-w-2xl">
            Onboard clients, manage billing tier &amp; status, auto-generate credentials, and track
            activity per client.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Onboard Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-om-faint" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients…"
          className="pl-10 max-w-md"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const projectCount = store.projects.filter((p) => p.clientId === c.id).length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
              </div>
              <h3 className="font-display font-bold text-lg leading-tight">{c.company}</h3>
              <p className="text-xs text-om-subtle mb-3">{c.billingTier} tier · {projectCount} projects</p>
              <dl className="space-y-1.5 text-sm border-t border-om pt-3">
                <div className="flex justify-between"><dt className="text-om-subtle">Contact</dt><dd>{c.contactName}</dd></div>
                <div className="flex justify-between"><dt className="text-om-subtle">Email</dt><dd className="text-om-soft truncate ml-2">{c.email}</dd></div>
                <div className="flex justify-between"><dt className="text-om-subtle">Phone</dt><dd>{c.phone}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Button size="sm" variant="subtle" onClick={() => setActivityFor(c)}>
                  <Activity className="w-3.5 h-3.5" /> Activity
                </Button>
                <Button size="sm" variant="subtle" onClick={() => setUsersFor(c)}>
                  <Users className="w-3.5 h-3.5" /> Users
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setShowForm(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm(`Delete ${c.company}? This removes their projects too.`)) return;
                    try {
                      await deleteClient(c.id, user);
                    } catch (err) {
                      console.error("Delete client failed:", err);
                      alert(formatOmError(err));
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <EmptyState icon={Building2} title="No clients found" hint="Onboard your first client." />
        </Card>
      )}

      {/* Create/Edit modal */}
      <ClientForm
        open={showForm}
        onClose={() => { setShowForm(false); setFormError(""); }}
        client={editing}
        submitting={submitting}
        error={formError}
        onSubmit={async (data) => {
          setFormError("");
          setSubmitting(true);
          try {
            if (editing) {
              await updateClient(editing.id, data, user);
              setShowForm(false);
            } else {
              const password = genPassword();
              const c = await createClient({ ...data }, user);
              try {
                await addOmUser({
                  name: c.contactName,
                  email: c.email,
                  password,
                  company: c.company,
                  clientId: c.id,
                });
              } catch (userErr) {
                try {
                  await deleteClient(c.id, user);
                } catch (rollbackErr) {
                  console.error("Rollback client after user creation failed:", rollbackErr);
                }
                throw userErr;
              }
              setQuery("");
              setShowForm(false);
              setCreds({ email: c.email, password });
            }
          } catch (err) {
            console.error("Onboard client failed:", err);
            setFormError(formatOmError(err));
          } finally {
            setSubmitting(false);
          }
        }}
      />

      {/* Credentials modal */}
      <Modal open={!!creds} onClose={() => setCreds(null)} title="Credentials Generated">
        {creds && (
          <div className="space-y-4">
            <p className="text-sm text-om-muted">
              Login credentials have been generated. In production these would be emailed to the
              client automatically.
            </p>
            <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between"><span className="text-om-subtle">Login ID</span><span>{creds.email}</span></div>
              <div className="flex justify-between"><span className="text-om-subtle">Password</span><span className="text-brand-300">{creds.password}</span></div>
            </div>
            <Button className="w-full" onClick={() => setCreds(null)}>Done</Button>
          </div>
        )}
      </Modal>

      {/* Activity modal */}
      <Modal open={!!activityFor} onClose={() => setActivityFor(null)} title={activityFor ? `${activityFor.company} — Activity` : ""}>
        {activityFor && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-om-subtle pb-2 border-b border-om">
              <span>Last login: {activityFor.activity.find((a) => a.type === "login")?.ts.slice(0, 10) ?? "—"}</span>
              <Badge tone={STATUS_TONE[activityFor.status]}>{activityFor.status}</Badge>
            </div>
            {activityFor.activity.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm py-2 border-b border-om">
                <Badge tone={ev.type === "download" ? "blue" : ev.type === "login" ? "green" : "neutral"}>{ev.type}</Badge>
                <span className="text-om-soft flex-1">{ev.detail}</span>
                <span className="text-om-faint text-xs">{new Date(ev.ts).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Users modal */}
      <Modal open={!!usersFor} onClose={() => setUsersFor(null)} title={usersFor ? `${usersFor.company} — Users` : ""}>
        {usersFor && (
          <div className="space-y-3">
            <p className="text-xs text-om-subtle">
              Users associated with this client. Sub-roles are controlled by Datafy.
            </p>
            {clientUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl bg-om-surface p-3">
                <div className="grid place-items-center w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                  {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-om-subtle truncate">{u.email}</p>
                </div>
                <Badge tone={u.clientSubRole === "client_admin" ? "purple" : "blue"}>
                  {u.clientSubRole === "client_admin" ? "Admin (all projects)" : "Viewer"}
                </Badge>
              </div>
            ))}
            {clientUsers.length === 0 && (
              <p className="text-center text-om-faint text-sm py-4">No users linked yet.</p>
            )}
            <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-3 text-xs text-om-muted flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-400" />
              New users get auto-generated credentials emailed on creation.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ClientForm({
  open,
  onClose,
  client,
  onSubmit,
  submitting = false,
  error = "",
}: {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSubmit: (data: Omit<Client, "id" | "createdAt" | "activity">) => void;
  submitting?: boolean;
  error?: string;
}) {
  const [form, setForm] = useState<Omit<Client, "id" | "createdAt" | "activity">>({
    company: client?.company ?? "",
    contactName: client?.contactName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    billingTier: client?.billingTier ?? "Pro",
    status: client?.status ?? "Active",
  });

  // reset when target changes
  const key = client?.id ?? "new";
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setForm({
      company: client?.company ?? "",
      contactName: client?.contactName ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      billingTier: client?.billingTier ?? "Pro",
      status: client?.status ?? "Active",
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={client ? "Edit Client" : "Onboard Client"}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
        className="space-y-4"
      >
        <Field label="Company name">
          <Input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name">
            <Input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <Field label="Email (becomes login ID)">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Billing tier">
            <Select value={form.billingTier} onChange={(e) => setForm({ ...form, billingTier: e.target.value as BillingTier })}>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2">
            {error}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Creating…" : client ? "Save changes" : "Create & generate credentials"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
