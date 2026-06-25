"use client";

import { useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  MapPin,
  Images,
  Network,
  StickyNote,
  Trash2,
  BatteryCharging,
  Zap,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  type Project,
  type ProjectClassification,
  type ProjectStatus,
  type GridType,
  type StringZone,
  type GalleryImage,
  type ScheduleFrequency,
  visibleProjects,
  createProject,
  updateProject,
  deleteProject,
  maintenanceStatus,
  healthScore,
  uid,
} from "@/lib/om";
import { canManage, canUpload } from "../perms";
import {
  Button,
  Card,
  CardHeader,
  Badge,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  EmptyState,
  fileToDataUrl,
} from "../ui";

const CLASSES: ProjectClassification[] = ["Residential", "Commercial", "Industrial"];
const STATUSES: ProjectStatus[] = ["Active", "Under Maintenance", "Decommissioned"];
const GRIDS: GridType[] = ["On-grid", "Off-grid", "Hybrid"];
const SCHEDULES: ScheduleFrequency[] = ["Monthly", "Quarterly", "Half-yearly", "Annual"];

const CLASS_TONE: Record<ProjectClassification, "blue" | "purple" | "amber"> = {
  Residential: "blue",
  Commercial: "purple",
  Industrial: "amber",
};
const STATUS_TONE: Record<ProjectStatus, "green" | "amber" | "neutral"> = {
  Active: "green",
  "Under Maintenance": "amber",
  Decommissioned: "neutral",
};

export default function ProjectsView({ user, store }: { user: User; store: Store }) {
  const projects = useMemo(() => visibleProjects(user), [user, store]);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = projects.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Projects</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Site records with string/zone mapping, photo gallery, schedule and client-visible notes.
          </p>
        </div>
        {canManage(user) && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="pl-10 max-w-md" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const ms = maintenanceStatus(p);
          const score = healthScore(p);
          const client = store.clients.find((c) => c.id === p.clientId);
          return (
            <Card key={p.id} className="p-5 hover:border-white/20 transition-colors cursor-pointer" >
              <div onClick={() => setDetail(p)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={CLASS_TONE[p.classification]}>{p.classification}</Badge>
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg leading-tight mb-1">{p.name}</h3>
                <p className="text-xs text-white/50 flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3" /> {p.address}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="rounded-lg bg-white/5 py-2">
                    <p className="text-[10px] uppercase text-white/40">Size</p>
                    <p className="text-sm font-bold">{p.sizeKWp} kWp</p>
                  </div>
                  <div className="rounded-lg bg-white/5 py-2">
                    <p className="text-[10px] uppercase text-white/40">Panels</p>
                    <p className="text-sm font-bold">{p.panelCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 py-2">
                    <p className="text-[10px] uppercase text-white/40">Health</p>
                    <p className={`text-sm font-bold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>{score}</p>
                  </div>
                </div>
                <p className="text-xs text-white/50">{client?.company}</p>
              </div>
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/10">
                {ms.overdue && <Badge tone="red">Overdue</Badge>}
                <Badge tone="neutral">{p.maintenanceSchedule.join(" + ")}</Badge>
                {canManage(user) && (
                  <>
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setEditing(p); setShowForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProject(p.id, user); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card><EmptyState icon={FolderKanban} title="No projects" hint={canManage(user) ? "Create your first project." : "No projects assigned."} /></Card>
      )}

      {/* Detail modal */}
      {detail && <ProjectDetail open={!!detail} onClose={() => setDetail(null)} project={detail} store={store} user={user} onEdit={() => { setEditing(detail); setDetail(null); setShowForm(true); }} />}

      {/* Form */}
      {showForm && (
        <ProjectForm
          open={showForm}
          onClose={() => setShowForm(false)}
          project={editing}
          store={store}
          user={user}
        />
      )}
    </div>
  );
}

function ProjectDetail({
  open,
  onClose,
  project,
  store,
  user,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  store: Store;
  user: User;
  onEdit: () => void;
}) {
  const client = store.clients.find((c) => c.id === project.clientId);
  const ms = maintenanceStatus(project);
  const score = healthScore(project);

  return (
    <Modal open={open} onClose={onClose} title={project.name} wide>
      <div className="space-y-5">
        {/* header badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={CLASS_TONE[project.classification]}>{project.classification}</Badge>
          <Badge tone={STATUS_TONE[project.status]}>{project.status}</Badge>
          <Badge tone="neutral">{project.gridType}</Badge>
          {project.hasBattery && <Badge tone="green"><BatteryCharging className="w-3 h-3" /> {project.batterySystem}</Badge>}
          {canManage(user) && <Button size="sm" variant="subtle" className="ml-auto" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /> Edit</Button>}
        </div>

        {/* spec grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            ["Client", client?.company ?? "—"],
            ["Size", `${project.sizeKWp} kWp`],
            ["Panels", project.panelCount.toLocaleString()],
            ["Inverter", `${project.inverterBrand} ${project.inverterModel}`],
            ["Installed", project.installedAt],
            ["Warranty expiry", project.warrantyExpiry],
            ["Site contact", project.siteContactName],
            ["Phone", project.siteContactPhone],
            ["GPS", `${project.lat.toFixed(4)}, ${project.lng.toFixed(4)}`],
            ["Schedule", project.maintenanceSchedule.join(" + ")],
            ["Last visit", ms.lastDate ?? "—"],
            ["Health score", `${score}/100`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{k}</p>
              <p className="text-sm font-medium text-white/90">{v}</p>
            </div>
          ))}
        </div>

        {ms.overdue && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
            ⚠ Maintenance overdue — last visit {ms.daysSince > 9000 ? "never" : `${ms.daysSince} days ago`} (due every {ms.dueDays}d).
          </div>
        )}

        {/* String / zone mapping */}
        <Section icon={Network} title="String & Zone Mapping">
          {project.stringZones.length === 0 ? (
            <p className="text-sm text-white/40 py-3">No strings/zones mapped.</p>
          ) : (
            <div className="space-y-2">
              {project.stringZones.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-white/60">{s.location}</span>
                  <Badge tone="blue">{s.panelCount} panels</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Site gallery */}
        <Section icon={Images} title="Site Photo Gallery">
          {project.gallery.length === 0 ? (
            <p className="text-sm text-white/40 py-3">No site photos yet. Upload from the project editor.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {project.gallery.map((g) => (
                <div key={g.id} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={g.url} alt={g.caption} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Client notes */}
        <Section icon={StickyNote} title="Client Notes (visible to client)">
          <p className="text-sm text-white/80 whitespace-pre-wrap">{project.clientNotes || "No notes."}</p>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Zap; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h4 className="flex items-center gap-2 font-semibold text-sm mb-3">
        <Icon className="w-4 h-4 text-brand-400" /> {title}
      </h4>
      {children}
    </div>
  );
}

function ProjectForm({
  open,
  onClose,
  project,
  store,
  user,
}: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  store: Store;
  user: User;
}) {
  const [form, setForm] = useState<Project>(
    project ?? {
      id: "",
      clientId: store.clients[0]?.id ?? "",
      name: "",
      address: "",
      lat: 0,
      lng: 0,
      sizeKWp: 0,
      panelCount: 0,
      inverterBrand: "",
      inverterModel: "",
      hasBattery: false,
      batterySystem: "",
      gridType: "On-grid",
      installedAt: new Date().toISOString().slice(0, 10),
      warrantyExpiry: new Date().toISOString().slice(0, 10),
      siteContactName: "",
      siteContactPhone: "",
      classification: "Commercial",
      status: "Active",
      stringZones: [],
      gallery: [],
      clientNotes: "",
      maintenanceSchedule: ["Quarterly"],
    }
  );
  const [newZone, setNewZone] = useState<StringZone>({ id: "", name: "", panelCount: 0, location: "" });

  const addZone = () => {
    if (!newZone.name) return;
    setForm({ ...form, stringZones: [...form.stringZones, { ...newZone, id: uid("sz") }] });
    setNewZone({ id: "", name: "", panelCount: 0, location: "" });
  };

  const onGalleryUpload = async (files: FileList | null) => {
    if (!files) return;
    const imgs: GalleryImage[] = [];
    for (const f of Array.from(files)) {
      const url = await fileToDataUrl(f);
      imgs.push({ id: uid("img"), url, caption: f.name, uploadedAt: new Date().toISOString() });
    }
    setForm({ ...form, gallery: [...form.gallery, ...imgs] });
  };

  const toggleSchedule = (s: ScheduleFrequency) => {
    setForm({
      ...form,
      maintenanceSchedule: form.maintenanceSchedule.includes(s)
        ? form.maintenanceSchedule.filter((x) => x !== s)
        : [...form.maintenanceSchedule, s],
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      updateProject(project.id, form, user);
    } else {
      const { id, ...rest } = form;
      void id;
      createProject(rest, user);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? "Edit Project" : "New Project"} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Project name" className="sm:col-span-2">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              {store.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
            </Select>
          </Field>
          <Field label="Site address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Latitude">
            <Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: +e.target.value })} />
          </Field>
          <Field label="Longitude">
            <Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: +e.target.value })} />
          </Field>
          <Field label="System size (kWp)">
            <Input type="number" required value={form.sizeKWp} onChange={(e) => setForm({ ...form, sizeKWp: +e.target.value })} />
          </Field>
          <Field label="Total panels">
            <Input type="number" required value={form.panelCount} onChange={(e) => setForm({ ...form, panelCount: +e.target.value })} />
          </Field>
          <Field label="Inverter brand">
            <Input value={form.inverterBrand} onChange={(e) => setForm({ ...form, inverterBrand: e.target.value })} />
          </Field>
          <Field label="Inverter model">
            <Input value={form.inverterModel} onChange={(e) => setForm({ ...form, inverterModel: e.target.value })} />
          </Field>
          <Field label="Grid type">
            <Select value={form.gridType} onChange={(e) => setForm({ ...form, gridType: e.target.value as GridType })}>
              {GRIDS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Classification">
            <Select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value as ProjectClassification })}>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Has battery">
            <Select value={form.hasBattery ? "yes" : "no"} onChange={(e) => setForm({ ...form, hasBattery: e.target.value === "yes" })}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
          {form.hasBattery && (
            <Field label="Battery system">
              <Input value={form.batterySystem ?? ""} onChange={(e) => setForm({ ...form, batterySystem: e.target.value })} />
            </Field>
          )}
          <Field label="Installation date">
            <Input type="date" value={form.installedAt} onChange={(e) => setForm({ ...form, installedAt: e.target.value })} />
          </Field>
          <Field label="Warranty expiry">
            <Input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} />
          </Field>
          <Field label="Site contact name">
            <Input value={form.siteContactName} onChange={(e) => setForm({ ...form, siteContactName: e.target.value })} />
          </Field>
          <Field label="Site contact phone">
            <Input value={form.siteContactPhone} onChange={(e) => setForm({ ...form, siteContactPhone: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        {/* Maintenance schedule (combinable) */}
        <Field label="Maintenance schedule (combine as needed)">
          <div className="flex flex-wrap gap-2">
            {SCHEDULES.map((s) => {
              const on = form.maintenanceSchedule.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSchedule(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    on ? "bg-brand-600 border-transparent text-white" : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        {/* String / zone editor */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
            <Network className="w-4 h-4" /> String / Zone Mapping
          </p>
          <div className="space-y-2 mb-3">
            {form.stringZones.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium flex-1">{s.name}</span>
                <span className="text-white/50">{s.location}</span>
                <span className="text-white/60 w-20 text-right">{s.panelCount} panels</span>
                <button type="button" onClick={() => setForm({ ...form, stringZones: form.stringZones.filter((x) => x.id !== s.id) })} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input placeholder="Name" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} />
            <Input placeholder="Location" value={newZone.location} onChange={(e) => setNewZone({ ...newZone, location: e.target.value })} />
            <Input type="number" placeholder="Panels" value={newZone.panelCount || ""} onChange={(e) => setNewZone({ ...newZone, panelCount: +e.target.value })} />
            <Button type="button" variant="subtle" onClick={addZone}><Plus className="w-3.5 h-3.5" /> Add</Button>
          </div>
        </div>

        {/* Gallery upload */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
            <Images className="w-4 h-4" /> Site Photo Gallery
          </p>
          {form.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {form.gallery.map((g) => (
                <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={g.url} alt={g.caption} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, gallery: form.gallery.filter((x) => x.id !== g.id) })} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 grid place-items-center text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 text-sm text-white/60 hover:border-brand-500 hover:text-brand-300 cursor-pointer transition-colors">
            <Plus className="w-4 h-4" /> Upload site photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGalleryUpload(e.target.files)} />
          </label>
        </div>

        <Field label="Client notes (visible to client)">
          <Textarea rows={3} value={form.clientNotes} onChange={(e) => setForm({ ...form, clientNotes: e.target.value })} placeholder="Notes shared with the client…" />
        </Field>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">{project ? "Save changes" : "Create project"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
