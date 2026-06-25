"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  Wrench,
  Camera,
  PenLine,
  GitCompare,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  type Project,
  type MaintenanceVisit,
  type VisitImage,
  type DefectEntry,
  type CleaningType,
  type Weather,
  type ScheduleFrequency,
  visibleProjects,
  visitsFor,
  addVisit,
  toggleDefect,
  maintenanceStatus,
  healthScore,
  uid,
} from "@/lib/om";
import { canUpload } from "../perms";
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
  Stat,
  fileToDataUrl,
} from "../ui";
import { ProjectPicker } from "./ProjectPicker";

const CLEANINGS: CleaningType[] = ["Dry cleaning", "Wet cleaning", "Robotic cleaning", "None"];
const WEATHERS: Weather[] = ["Sunny", "Cloudy", "Overcast", "Rainy"];
const DEFECT_CATS: DefectEntry["category"][] = ["Physical damage", "Soiling", "Loose connection", "Other"];

export default function MaintenanceView({
  user,
  store,
  projectId,
  onProject,
}: {
  user: User;
  store: Store;
  projectId: string;
  onProject: (id: string) => void;
}) {
  const projects = useMemo(() => visibleProjects(user), [user, store]);
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const [showForm, setShowForm] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  if (!project) return <Card><EmptyState icon={CalendarClock} title="No projects" /></Card>;

  const visits = visitsFor(project.id);
  const ms = maintenanceStatus(project);
  const score = healthScore(project);

  // next scheduled notification hint (7 days before next due)
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + Math.max(0, ms.dueDays - ms.daysSince));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">O&amp;M Scheduling &amp; Logs</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Scheduled maintenance, visit records with before/after imagery, defect log and side-by-side
            comparison.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectPicker user={user} projects={projects} value={project.id} onChange={onProject} />
          {canUpload(user) && (
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Log Visit</Button>
          )}
        </div>
      </div>

      {/* Health + schedule stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Health Score" value={score} tone={score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"} icon={Wrench} />
        <Stat label="Schedule" value={project.maintenanceSchedule.join(" + ")} sub={`Every ${ms.dueDays} days`} icon={CalendarClock} />
        <Stat
          label="Last Visit"
          value={ms.lastDate ?? "—"}
          sub={ms.daysSince > 9000 ? "never" : `${ms.daysSince} days ago`}
          tone={ms.overdue ? "text-red-400" : "text-white"}
          icon={CalendarClock}
        />
        <Stat label="Total Visits" value={visits.length} icon={Wrench} />
      </div>

      {/* Overdue / notification banner */}
      {ms.overdue ? (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-200">
              <strong>Overdue maintenance.</strong> Last visit was {ms.daysSince} days ago; schedule
              interval is {ms.dueDays} days.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-brand-400" />
            <p className="text-sm text-white/80">
              Next scheduled visit reminder (email/SMS) will be sent 7 days before{" "}
              <strong>{nextDue.toISOString().slice(0, 10)}</strong>.
            </p>
          </div>
        </Card>
      )}

      {/* Visit timeline */}
      <Card>
        <CardHeader title="Maintenance Visits" icon={Wrench} action={canUpload(user) ? <Button size="sm" variant="subtle" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5" /> Log Visit</Button> : undefined} />
        {visits.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No visits logged" hint="Field engineers log visits here." />
        ) : (
          <div className="divide-y divide-white/5">
            {visits.map((v) => (
              <VisitRow key={v.id} visit={v} store={store} user={user} projectId={project.id} />
            ))}
          </div>
        )}
      </Card>

      {/* Comparison viewer */}
      {visits.length >= 2 && (
        <Card>
          <CardHeader title="Visit Comparison" icon={GitCompare} />
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Visit A">
                <Select value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                  <option value="">Select…</option>
                  {visits.map((v) => <option key={v.id} value={v.id}>{v.date} · {v.technician}</option>)}
                </Select>
              </Field>
              <Field label="Visit B">
                <Select value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                  <option value="">Select…</option>
                  {visits.map((v) => <option key={v.id} value={v.id}>{v.date} · {v.technician}</option>)}
                </Select>
              </Field>
            </div>
            {compareA && compareB && (
              <CompareView a={visits.find((v) => v.id === compareA)!} b={visits.find((v) => v.id === compareB)!} />
            )}
          </div>
        </Card>
      )}

      {showForm && (
        <VisitForm open={showForm} onClose={() => setShowForm(false)} project={project} user={user} />
      )}
    </div>
  );
}

function VisitRow({ visit, store, user, projectId }: { visit: MaintenanceVisit; store: Store; user: User; projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const openDefects = visit.defects.filter((d) => d.status === "Open").length;

  return (
    <div className="px-5">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center gap-3 py-4 text-left">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400">
          <Wrench className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{visit.date} · {visit.cleaningType}</p>
          <p className="text-xs text-white/50">{visit.technician} · {visit.weather}</p>
        </div>
        {openDefects > 0 && <Badge tone="red">{openDefects} open defects</Badge>}
        {visit.signature && <Badge tone="green"><PenLine className="w-3 h-3" /> Signed</Badge>}
        <Badge tone="neutral">{visit.images.length} photos</Badge>
      </button>
      {expanded && (
        <div className="pb-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Pre-observation</p>
              <p className="text-sm text-white/80">{visit.preObservation || "—"}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Post-observation</p>
              <p className="text-sm text-white/80">{visit.postObservation || "—"}</p>
            </div>
          </div>

          {visit.images.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Before / After Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {visit.images.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={img.url} alt={img.tag} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white">{img.kind}</span>
                    <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white truncate">{img.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Defect log */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Defect Log</p>
            <div className="space-y-2">
              {visit.defects.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <button onClick={() => toggleDefect(visit.id, d.id, user)} className="flex-shrink-0">
                    {d.status === "Open" ? <Circle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <Badge tone={d.category === "Soiling" ? "amber" : d.category === "Physical damage" ? "red" : "neutral"}>{d.category}</Badge>
                  <span className="flex-1 text-white/80">{d.description}</span>
                  <Badge tone={d.status === "Open" ? "red" : "green"}>{d.status}</Badge>
                </div>
              ))}
              {visit.defects.length === 0 && <p className="text-xs text-white/40">No defects noted.</p>}
            </div>
          </div>

          {visit.signature && (
            <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-3 text-sm flex items-center gap-2">
              <PenLine className="w-4 h-4 text-brand-400" /> Technician sign-off: <strong className="font-handwriting">{visit.signature}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareView({ a, b }: { a: MaintenanceVisit; b: MaintenanceVisit }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { label: "Visit A", v: a },
        { label: "Visit B", v: b },
      ].map(({ label, v }) => (
        <div key={label} className="rounded-xl bg-white/5 p-4">
          <p className="font-semibold text-sm mb-2">{label}: {v.date}</p>
          <dl className="text-xs space-y-1 mb-3">
            <div className="flex justify-between"><dt className="text-white/50">Cleaning</dt><dd>{v.cleaningType}</dd></div>
            <div className="flex justify-between"><dt className="text-white/50">Weather</dt><dd>{v.weather}</dd></div>
            <div className="flex justify-between"><dt className="text-white/50">Defects</dt><dd>{v.defects.filter((d) => d.status === "Open").length} open</dd></div>
          </dl>
          {v.images.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {v.images.slice(0, 6).map((img) => (
                <div key={img.id} className="aspect-square rounded overflow-hidden">
                  <img src={img.url} alt={img.tag} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VisitForm({ open, onClose, project, user }: { open: boolean; onClose: () => void; project: Project; user: User }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [technician, setTechnician] = useState(user.name);
  const [cleaningType, setCleaningType] = useState<CleaningType>("Wet cleaning");
  const [weather, setWeather] = useState<Weather>("Sunny");
  const [pre, setPre] = useState("");
  const [post, setPost] = useState("");
  const [signature, setSignature] = useState("");
  const [images, setImages] = useState<VisitImage[]>([]);
  const [defects, setDefects] = useState<DefectEntry[]>([]);
  const [defCat, setDefCat] = useState<DefectEntry["category"]>("Soiling");
  const [defDesc, setDefDesc] = useState("");

  const uploadImages = async (files: FileList | null, kind: "before" | "after", tag: string) => {
    if (!files) return;
    const out: VisitImage[] = [];
    for (const f of Array.from(files)) {
      out.push({ id: uid("img"), url: await fileToDataUrl(f), tag, kind });
    }
    setImages((prev) => [...prev, ...out]);
  };

  const addDefect = () => {
    if (!defDesc) return;
    setDefects((prev) => [...prev, { id: uid("def"), category: defCat, description: defDesc, status: "Open", openedAt: new Date().toISOString() }]);
    setDefDesc("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      alert("Technician sign-off is required.");
      return;
    }
    addVisit(
      {
        projectId: project.id,
        date,
        technician,
        cleaningType,
        weather,
        preObservation: pre,
        postObservation: post,
        images,
        defects,
        signature,
      },
      user
    );
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Maintenance Visit" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Technician"><Input value={technician} onChange={(e) => setTechnician(e.target.value)} /></Field>
          <Field label="Cleaning type">
            <Select value={cleaningType} onChange={(e) => setCleaningType(e.target.value as CleaningType)}>
              {CLEANINGS.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Weather">
            <Select value={weather} onChange={(e) => setWeather(e.target.value as Weather)}>
              {WEATHERS.map((w) => <option key={w}>{w}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Pre-visit observation"><Textarea rows={2} value={pre} onChange={(e) => setPre(e.target.value)} /></Field>
        <Field label="Post-visit observation"><Textarea rows={2} value={post} onChange={(e) => setPost(e.target.value)} /></Field>

        {/* Image upload */}
        <div className="grid sm:grid-cols-2 gap-3">
          {(["before", "after"] as const).map((kind) => (
            <div key={kind} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {kind === "before" ? "Before" : "After"} images</p>
              {images.filter((i) => i.kind === kind).map((img) => (
                <div key={img.id} className="flex items-center gap-2 mb-2">
                  <img src={img.url} className="w-10 h-10 rounded object-cover" alt="" />
                  <Input value={img.tag} onChange={(e) => setImages((prev) => prev.map((x) => x.id === img.id ? { ...x, tag: e.target.value } : x))} className="text-xs py-1.5" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((x) => x.id !== img.id))} className="text-red-400">✕</button>
                </div>
              ))}
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/20 text-xs text-white/60 hover:border-brand-500 cursor-pointer">
                <Plus className="w-3 h-3" /> Upload {kind}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(e.target.files, kind, "")} />
              </label>
            </div>
          ))}
        </div>

        {/* Defect log */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Defect Log</p>
          <div className="space-y-1.5 mb-3">
            {defects.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <Badge tone="neutral">{d.category}</Badge>
                <span className="flex-1">{d.description}</span>
                <button type="button" onClick={() => setDefects((prev) => prev.filter((x) => x.id !== d.id))} className="text-red-400">✕</button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <Select value={defCat} onChange={(e) => setDefCat(e.target.value as DefectEntry["category"])} className="text-xs py-1.5">
              {DEFECT_CATS.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input placeholder="Description" value={defDesc} onChange={(e) => setDefDesc(e.target.value)} className="text-xs py-1.5" />
            <Button type="button" size="sm" variant="subtle" onClick={addDefect}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        {/* Signature */}
        <Field label="Technician sign-off (type full name)">
          <Input required value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Full name acts as digital signature" />
        </Field>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">Submit Visit</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
