"use client";

import { useMemo, useState, useRef } from "react";
import JSZip from "jszip";
import {
  Radar,
  Plus,
  MapPin,
  AlertTriangle,
  Download,
  GitCompare,
  FileImage,
  ImageIcon,
  Thermometer,
  FileText,
  CheckCircle2,
  Circle,
  History,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  type DroneInspection,
  type Anomaly,
  type AnomalyType,
  type AnomalySeverity,
  type AnomalyStatus,
  visibleProjects,
  inspectionsFor,
  addInspection,
  updateInspection,
  addAnomaly,
  toggleAnomaly,
  persistentAnomalies,
  uid,
} from "@/lib/om";
import { logAudit } from "@/lib/om";
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

const ANOMALY_TYPES: AnomalyType[] = ["Hotspot", "Crack", "Delamination", "Soiling", "Bird droppings"];
const SEVERITIES: AnomalySeverity[] = ["Critical", "Warning", "Info"];
const SEV_TONE: Record<AnomalySeverity, "red" | "amber" | "blue"> = {
  Critical: "red",
  Warning: "amber",
  Info: "blue",
};
const SEV_COLOR: Record<AnomalySeverity, string> = {
  Critical: "#ef4444",
  Warning: "#f59e0b",
  Info: "#0ea5e9",
};

export default function InspectionsView({
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
  const [dateFilter, setDateFilter] = useState("");
  const [activeIns, setActiveIns] = useState<DroneInspection | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  if (!project) return <Card><EmptyState icon={Radar} title="No projects" /></Card>;

  const inspections = inspectionsFor(project.id);
  const filtered = dateFilter ? inspections.filter((i) => i.date === dateFilter) : inspections;

  const allAnomalies = inspections.flatMap((i) => i.anomalies);
  const openCount = allAnomalies.filter((a) => a.status === "Open").length;
  const critical = allAnomalies.filter((a) => a.severity === "Critical" && a.status === "Open").length;
  const persistent = persistentAnomalies(project.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Drone Inspection</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Orthomosaics, RGB/thermal imagery, ML anomaly overlays, a plant-layout pin view and
            inspection-to-inspection comparison.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectPicker user={user} projects={projects} value={project.id} onChange={onProject} />
          {canUpload(user) && (
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Upload Inspection</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Inspections" value={inspections.length} icon={Radar} />
        <Stat label="Open Anomalies" value={openCount} tone={openCount ? "text-red-400" : "text-emerald-400"} icon={AlertTriangle} />
        <Stat label="Critical / Open" value={critical} tone={critical ? "text-red-400" : "text-white"} icon={AlertTriangle} />
        <Stat label="Persistent" value={persistent.length} sub="Still open from earlier" icon={History} />
      </div>

      {/* Persistent anomalies banner */}
      {persistent.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <History className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200 text-sm">{persistent.length} persistent anomal{persistent.length !== 1 ? "ies" : "y"}</p>
              <p className="text-xs text-white/60 mt-0.5">
                Detected in earlier inspections and still Open now: {persistent.map((p) => `${p.earlier.panelId} (${p.earlier.type})`).join(", ")}
              </p>
            </div>
            <Button size="sm" variant="subtle" className="ml-auto" onClick={() => setShowCompare(true)}>
              <GitCompare className="w-3.5 h-3.5" /> Compare
            </Button>
          </div>
        </Card>
      )}

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Filter by date</span>
        <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="max-w-[200px]">
          <option value="">All inspections</option>
          {[...new Set(inspections.map((i) => i.date))].sort().map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </div>

      {/* Inspection cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((ins) => {
          const open = ins.anomalies.filter((a) => a.status === "Open").length;
          return (
            <Card key={ins.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400">
                  <Radar className="w-5 h-5" />
                </div>
                <div className="flex gap-1.5">
                  {open > 0 ? <Badge tone="red">{open} open</Badge> : <Badge tone="green">All resolved</Badge>}
                </div>
              </div>
              <h3 className="font-display font-bold text-lg">{ins.date}</h3>
              <p className="text-xs text-white/50 mb-3">{ins.anomalies.length} anomalies detected</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ins.orthomosaicUrl && <Badge tone="blue"><FileImage className="w-3 h-3" /> Orthomosaic</Badge>}
                {ins.rgbUrl && <Badge tone="neutral"><ImageIcon className="w-3 h-3" /> RGB</Badge>}
                {ins.thermalUrl && <Badge tone="amber"><Thermometer className="w-3 h-3" /> Thermal</Badge>}
                {ins.reportPdfUrl && <Badge tone="purple"><FileText className="w-3 h-3" /> Report</Badge>}
                {ins.layoutUrl && <Badge tone="green"><MapPin className="w-3 h-3" /> Layout</Badge>}
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="subtle" onClick={() => setActiveIns(ins)}>View &amp; Anomalies</Button>
                <Button size="sm" variant="ghost" onClick={() => downloadPackage(ins, user)}>
                  <Download className="w-3.5 h-3.5" /> ZIP
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card><EmptyState icon={Radar} title="No inspections" hint={canUpload(user) ? "Upload the first drone dataset." : "No drone data yet."} /></Card>
      )}

      {/* Active inspection modal with layout pins + anomaly log */}
      {activeIns && (
        <InspectionDetail open={!!activeIns} onClose={() => setActiveIns(null)} inspection={activeIns} user={user} />
      )}

      {/* Upload form */}
      {showForm && (
        <InspectionForm open={showForm} onClose={() => setShowForm(false)} project={project} user={user} />
      )}

      {/* Comparison modal */}
      {showCompare && inspections.length >= 2 && (
        <CompareInspections open={showCompare} onClose={() => setShowCompare(false)} inspections={inspections} />
      )}
    </div>
  );
}

function InspectionDetail({ open, onClose, inspection, user }: { open: boolean; onClose: () => void; inspection: DroneInspection; user: User }) {
  const [pinning, setPinning] = useState(false);
  const [newPin, setNewPin] = useState<{ type: AnomalyType; severity: AnomalySeverity; panelId: string }>({
    type: "Hotspot",
    severity: "Warning",
    panelId: "",
  });
  const layoutRef = useRef<HTMLDivElement>(null);

  const placePin = (e: React.MouseEvent) => {
    if (!pinning || !layoutRef.current) return;
    const rect = layoutRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    addAnomaly(inspection.id, {
      panelId: newPin.panelId || "—",
      type: newPin.type,
      severity: newPin.severity,
      status: "Open",
      detectedAt: inspection.date,
      x,
      y,
    });
    setPinning(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Inspection — ${inspection.date}`} wide>
      <div className="space-y-5">
        {/* Processed imagery */}
        {inspection.processedImages.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Processed Anomaly Overlays</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {inspection.processedImages.map((p) => (
                <div key={p.id} className="rounded-lg overflow-hidden bg-white/5">
                  <img src={p.url} alt={p.label} className="w-full aspect-video object-cover" />
                  <p className="text-xs text-white/60 px-2 py-1.5 truncate">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout pin view */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Plant Layout — Anomaly Pins
            </p>
            {canUpload(user) && (
              <div className="flex items-center gap-2">
                {pinning && (
                  <>
                    <Input placeholder="Panel ID" value={newPin.panelId} onChange={(e) => setNewPin({ ...newPin, panelId: e.target.value })} className="text-xs py-1.5 w-28" />
                    <Select value={newPin.type} onChange={(e) => setNewPin({ ...newPin, type: e.target.value as AnomalyType })} className="text-xs py-1.5 w-28">
                      {ANOMALY_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </Select>
                    <Select value={newPin.severity} onChange={(e) => setNewPin({ ...newPin, severity: e.target.value as AnomalySeverity })} className="text-xs py-1.5 w-28">
                      {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </>
                )}
                <Button size="sm" variant={pinning ? "primary" : "subtle"} onClick={() => setPinning((p) => !p)}>
                  {pinning ? "Click layout to pin" : <><Plus className="w-3.5 h-3.5" /> Add pin</>}
                </Button>
              </div>
            )}
          </div>
          <div
            ref={layoutRef}
            onClick={placePin}
            className={`relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-ink-900 border border-white/10 ${pinning ? "cursor-crosshair" : ""}`}
          >
            {inspection.layoutUrl ? (
              <img src={inspection.layoutUrl} alt="Plant layout" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/30 text-sm">
                {pinning ? "Click anywhere to place a pin" : "No layout image uploaded — pins still plot on a grid"}
                <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              </div>
            )}
            {inspection.anomalies
              .filter((a) => a.x != null && a.y != null)
              .map((a) => (
                <div
                  key={a.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${a.x}%`, top: `${a.y}%` }}
                >
                  <span
                    className="block w-4 h-4 rounded-full ring-2 ring-white/40"
                    style={{ backgroundColor: SEV_COLOR[a.severity] }}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-5 z-10 hidden group-hover:block whitespace-nowrap rounded-lg bg-ink-900 border border-white/15 px-2 py-1 text-[11px]">
                    {a.panelId} · {a.type} · {a.severity}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Anomaly log */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Anomaly Log</p>
          <div className="space-y-1.5">
            {inspection.anomalies.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
                <button onClick={() => toggleAnomaly(inspection.id, a.id)} className="flex-shrink-0">
                  {a.status === "Open" ? <Circle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <span className="font-mono text-white/90 w-20">{a.panelId}</span>
                <Badge tone="neutral">{a.type}</Badge>
                <Badge tone={SEV_TONE[a.severity]}>{a.severity}</Badge>
                <span className="text-white/40 text-xs">{a.detectedAt}</span>
                {a.note && <span className="text-white/50 text-xs hidden sm:inline">· {a.note}</span>}
                <Badge tone={a.status === "Open" ? "red" : "green"} className="ml-auto">{a.status}</Badge>
              </div>
            ))}
            {inspection.anomalies.length === 0 && <p className="text-xs text-white/40 py-2">No anomalies recorded.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CompareInspections({ open, onClose, inspections }: { open: boolean; onClose: () => void; inspections: DroneInspection[] }) {
  const sorted = [...inspections].sort((a, b) => (a.date < b.date ? -1 : 1));
  const [aId, setAId] = useState(sorted[0]?.id ?? "");
  const [bId, setBId] = useState(sorted[sorted.length - 1]?.id ?? "");
  const a = inspections.find((i) => i.id === aId);
  const b = inspections.find((i) => i.id === bId);

  // anomalies open in A, check if still open in B
  const stillOpen = a && b
    ? a.anomalies.filter((an) => {
        const match = b.anomalies.find((bn) => bn.panelId === an.panelId && bn.type === an.type);
        return match && match.status === "Open";
      })
    : [];

  return (
    <Modal open={open} onClose={onClose} title="Inspection Comparison" wide>
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Compare two inspections to see which anomalies from the earlier date are still open.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Earlier inspection">
            <Select value={aId} onChange={(e) => setAId(e.target.value)}>
              {sorted.map((i) => <option key={i.id} value={i.id}>{i.date}</option>)}
            </Select>
          </Field>
          <Field label="Later inspection">
            <Select value={bId} onChange={(e) => setBId(e.target.value)}>
              {sorted.map((i) => <option key={i.id} value={i.id}>{i.date}</option>)}
            </Select>
          </Field>
        </div>

        {a && b && (
          <div className="grid sm:grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-2xl font-display font-bold text-amber-400">{a.anomalies.filter((x) => x.status === "Open").length}</p>
              <p className="text-xs text-white/50">Open on {a.date}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-display font-bold text-red-400">{stillOpen.length}</p>
              <p className="text-xs text-white/50">Still open on {b.date}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-display font-bold text-emerald-400">{a.anomalies.filter((x) => x.status === "Open").length - stillOpen.length}</p>
              <p className="text-xs text-white/50">Resolved since</p>
            </Card>
          </div>
        )}

        {a && b && stillOpen.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Persisting anomalies</p>
            <div className="space-y-1.5">
              {stillOpen.map((an) => (
                <div key={an.id} className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm">
                  <span className="font-mono w-20">{an.panelId}</span>
                  <Badge tone="neutral">{an.type}</Badge>
                  <Badge tone={SEV_TONE[an.severity]}>{an.severity}</Badge>
                  <span className="text-white/50 text-xs ml-auto">Detected {an.detectedAt} · still open</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InspectionForm({ open, onClose, project, user }: { open: boolean; onClose: () => void; project: { id: string; name: string }; user: User }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orthomosaic, setOrthomosaic] = useState<string>();
  const [rgb, setRgb] = useState<string>();
  const [thermal, setThermal] = useState<string>();
  const [reportPdf, setReportPdf] = useState<string>();
  const [layout, setLayout] = useState<string>();
  const [processed, setProcessed] = useState<{ id: string; url: string; label: string }[]>([]);

  const toDataUrl = async (files: FileList | null) => {
    if (!files || !files[0]) return undefined;
    return fileToDataUrl(files[0]);
  };

  const uploadProcessed = async (files: FileList | null) => {
    if (!files) return;
    const out: { id: string; url: string; label: string }[] = [];
    for (const f of Array.from(files)) {
      out.push({ id: uid("proc"), url: await fileToDataUrl(f), label: f.name.replace(/\.[^.]+$/, "") });
    }
    setProcessed((p) => [...p, ...out]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addInspection(
      {
        projectId: project.id,
        date,
        orthomosaicUrl: orthomosaic,
        rgbUrl: rgb,
        thermalUrl: thermal,
        reportPdfUrl: reportPdf,
        layoutUrl: layout,
        processedImages: processed,
        anomalies: [],
      },
      user
    );
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Drone Inspection" wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Inspection date"><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <UploadField label="Orthomosaic (GeoTIFF/JPG)" icon={FileImage} value={orthomosaic} onChange={async (f) => setOrthomosaic(await toDataUrl(f))} />
          <UploadField label="Raw RGB imagery" icon={ImageIcon} value={rgb} onChange={async (f) => setRgb(await toDataUrl(f))} />
          <UploadField label="Thermal imagery" icon={Thermometer} value={thermal} onChange={async (f) => setThermal(await toDataUrl(f))} />
          <UploadField label="Collection Report PDF" icon={FileText} value={reportPdf} onChange={async (f) => setReportPdf(await toDataUrl(f))} />
          <UploadField label="Plant layout image" icon={MapPin} value={layout} onChange={async (f) => setLayout(await toDataUrl(f))} />
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Processed Anomaly Overlays (post ML/DL)</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {processed.map((p) => (
              <div key={p.id} className="relative aspect-video rounded overflow-hidden group">
                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setProcessed((prev) => prev.filter((x) => x.id !== p.id))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 grid place-items-center text-red-300 text-xs">Remove</button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/20 text-xs text-white/60 hover:border-brand-500 cursor-pointer">
            <Plus className="w-3 h-3" /> Upload processed images
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadProcessed(e.target.files)} />
          </label>
        </div>

        <p className="text-xs text-white/40">Anomalies can be pinned on the plant layout after upload.</p>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">Save Inspection</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function UploadField({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: typeof FileImage;
  value?: string;
  onChange: (f: FileList | null) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </p>
      <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/20 text-sm text-white/60 hover:border-brand-500 cursor-pointer transition-colors">
        {value ? <span className="text-emerald-400 text-xs">✓ Uploaded</span> : <span>Choose file…</span>}
        <input type="file" className="hidden" onChange={(e) => onChange(e.target.files)} />
      </label>
    </div>
  );
}

/** Build a ZIP package: anomaly log + a manifest of assets, plus any embedded images. */
async function downloadPackage(ins: DroneInspection, user: User) {
  const zip = new JSZip();
  // anomaly log as CSV
  const header = "panel_id,anomaly_type,severity,status,detected_at,resolved_at,note\n";
  const rows = ins.anomalies
    .map((a) => [a.panelId, a.type, a.severity, a.status, a.detectedAt, a.resolvedAt ?? "", (a.note ?? "").replace(/,/g, ";")].join(","))
    .join("\n");
  zip.file("anomaly_log.csv", header + rows);

  // manifest
  const manifest = [
    `Drone Inspection Package`,
    `Date: ${ins.date}`,
    `Anomalies: ${ins.anomalies.length} (${ins.anomalies.filter((a) => a.status === "Open").length} open)`,
    ``,
    `Assets:`,
    ins.orthomosaicUrl ? `- orthomosaic.png` : "",
    ins.rgbUrl ? `- rgb.png` : "",
    ins.thermalUrl ? `- thermal.png` : "",
    ins.layoutUrl ? `- layout.png` : "",
    ins.processedImages.length ? `- processed/ (${ins.processedImages.length} overlays)` : "",
  ].join("\n");
  zip.file("MANIFEST.txt", manifest);

  // embed images (data URLs -> blobs)
  if (ins.orthomosaicUrl?.startsWith("data:")) zip.file("orthomosaic.png", await dataToBlob(ins.orthomosaicUrl));
  if (ins.rgbUrl?.startsWith("data:")) zip.file("rgb.png", await dataToBlob(ins.rgbUrl));
  if (ins.thermalUrl?.startsWith("data:")) zip.file("thermal.png", await dataToBlob(ins.thermalUrl));
  if (ins.layoutUrl?.startsWith("data:")) zip.file("layout.png", await dataToBlob(ins.layoutUrl));
  const folder = zip.folder("processed");
  for (const p of ins.processedImages) {
    if (p.url.startsWith("data:")) folder?.file(`${p.label}.png`, await dataToBlob(p.url));
  }

  logAudit(user, "download", `Inspection package ${ins.date}`);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inspection_${ins.date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

async function dataToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
