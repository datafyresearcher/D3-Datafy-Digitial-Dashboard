"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Printer,
  ShieldCheck,
  FolderLock,
  ScrollText,
  Wrench,
  Radar,
  Zap,
  Calendar,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  type DocType,
  visibleProjects,
  docsFor,
  addDoc,
  deleteDoc,
  visitsFor,
  inspectionsFor,
  performanceFor,
  performanceRatio,
  co2OffsetKg,
  maintenanceStatus,
  healthScore,
  getClient,
  uid,
} from "@/lib/om";
import { logAudit } from "@/lib/om";
import { canManage, canUpload } from "../perms";
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
  Stat,
  fileToDataUrl,
} from "../ui";
import { ProjectPicker } from "./ProjectPicker";

const DOC_TYPES: DocType[] = ["Warranty", "Contract", "Inverter manual", "Grid connection", "Report", "Other"];
const DOC_TONE: Record<DocType, "amber" | "purple" | "blue" | "green" | "neutral"> = {
  Warranty: "amber",
  Contract: "purple",
  "Inverter manual": "blue",
  "Grid connection": "green",
  Report: "neutral",
  Other: "neutral",
};

export default function ReportsView({
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
  const [showUpload, setShowUpload] = useState(false);
  const [reportKind, setReportKind] = useState<"om" | "inspection" | "performance">("om");
  const [showReport, setShowReport] = useState(false);

  if (!project) return <Card><EmptyState icon={FileText} title="No projects" /></Card>;

  const docs = docsFor(project.id);
  const client = getClient(project.clientId);
  const visits = visitsFor(project.id);
  const inspections = inspectionsFor(project.id);
  const perf = performanceFor(project.id);
  const ms = maintenanceStatus(project);
  const score = healthScore(project);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Reports &amp; Documents</h2>
          <p className="text-sm text-om-muted max-w-2xl">
            Auto-generated PDF reports, a document vault, and the audit log (admin only).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectPicker user={user} projects={projects} value={project.id} onChange={onProject} />
          {canUpload(user) && (
            <Button onClick={() => setShowUpload(true)}><Upload className="w-4 h-4" /> Upload Doc</Button>
          )}
        </div>
      </div>

      {/* Auto-generated reports */}
      <Card>
        <CardHeader title="Auto-Generated Reports" icon={FileText} />
        <div className="p-5 space-y-4">
          <p className="text-xs text-om-subtle">Select a report type, then print or save as PDF.</p>
          <div className="flex flex-wrap gap-2">
            {([
              { id: "om", label: "O&M Visit Summary", icon: Wrench },
              { id: "inspection", label: "Drone Inspection Package", icon: Radar },
              { id: "performance", label: "Performance Summary", icon: Zap },
            ] as const).map((r) => (
              <button
                key={r.id}
                onClick={() => { setReportKind(r.id); setShowReport(true); }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  false ? "bg-brand-600 border-transparent text-white" : "border-om bg-om-surface text-om-soft hover:bg-om-surface-hover"
                }`}
              >
                <r.icon className="w-4 h-4" /> {r.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Document vault */}
      <Card>
        <CardHeader title="Document Vault" icon={FolderLock} action={canUpload(user) ? <Button size="sm" variant="subtle" onClick={() => setShowUpload(true)}><Upload className="w-3.5 h-3.5" /> Upload</Button> : undefined} />
        {docs.length === 0 ? (
          <EmptyState icon={FolderLock} title="No documents" hint={canUpload(user) ? "Upload warranties, contracts, manuals." : "No documents shared."} />
        ) : (
          <div className="divide-y divide-om">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-om-surface text-om-muted">
                  <FileText className="w-4 h-4" />
                </div>
                <Badge tone={DOC_TONE[d.type]}>{d.type}</Badge>
                <span className="flex-1 truncate text-om-fg">{d.name}</span>
                <span className="text-xs text-om-faint hidden sm:inline">by {d.uploadedBy}</span>
                <span className="text-xs text-om-faint">{new Date(d.uploadedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => logAudit(user, "download", `Doc ${d.name}`)}
                  className="text-brand-400 hover:text-brand-300"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                {canUpload(user) && (
                  <button onClick={() => deleteDoc(d.id, user)} className="text-red-400 hover:text-red-300" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Audit log (admin only) */}
      {canManage(user) ? (
        <Card>
          <CardHeader title="Audit Log" icon={ShieldCheck} action={<Badge tone="purple">Super Admin</Badge>} />
          <div className="divide-y divide-om max-h-96 overflow-y-auto">
            {store.audit.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <Badge tone={a.action === "delete" ? "red" : a.action === "upload" ? "blue" : a.action === "create" ? "green" : "neutral"}>{a.action}</Badge>
                <span className="text-om-soft flex-1 truncate">{a.target}</span>
                <span className="text-om-faint text-xs">{a.userName}</span>
                <span className="text-om-faint text-xs">{new Date(a.ts).toLocaleString()}</span>
              </div>
            ))}
            {store.audit.length === 0 && <p className="px-5 py-6 text-center text-om-faint text-sm">No audit entries.</p>}
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-3 text-sm text-om-subtle">
            <ScrollText className="w-4 h-4" /> Audit logs are visible to Super Admins only.
          </div>
        </Card>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadDoc open={showUpload} onClose={() => setShowUpload(false)} project={project} user={user} />
      )}

      {/* Report preview */}
      {showReport && (
        <ReportPreview
          open={showReport}
          onClose={() => setShowReport(false)}
          kind={reportKind}
          project={project}
          client={client}
          store={store}
          visits={visits.length}
          inspections={inspections.length}
          perfCount={perf.length}
          pr={performanceRatio(project.id)}
          co2={co2OffsetKg(project.id)}
          ms={ms}
          score={score}
        />
      )}
    </div>
  );
}

function UploadDoc({ open, onClose, project, user }: { open: boolean; onClose: () => void; project: { id: string; name: string }; user: User }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DocType>("Warranty");
  const [url, setUrl] = useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addDoc(
      {
        projectId: project.id,
        name: name || "Untitled.pdf",
        type,
        url: url ?? "#",
        uploadedBy: user.email,
      },
      user
    );
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Document name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Module Warranty 25yr.pdf" />
        </Field>
        <Field label="Document type">
          <Select value={type} onChange={(e) => setType(e.target.value as DocType)}>
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="File">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-om-strong text-sm text-om-muted hover:border-brand-500 cursor-pointer">
            {url ? <span className="text-emerald-400 text-xs">✓ {name}</span> : <span>Choose file…</span>}
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUrl(await fileToDataUrl(f));
                  if (!name) setName(f.name);
                }
              }}
            />
          </label>
        </Field>
        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">Upload</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReportPreview({
  open,
  onClose,
  kind,
  project,
  client,
  store,
  visits,
  inspections,
  perfCount,
  pr,
  co2,
  ms,
  score,
}: {
  open: boolean;
  onClose: () => void;
  kind: "om" | "inspection" | "performance";
  project: ReturnType<typeof visibleProjects>[number];
  client: ReturnType<typeof getClient>;
  store: Store;
  visits: number;
  inspections: number;
  perfCount: number;
  pr: number;
  co2: number;
  ms: ReturnType<typeof maintenanceStatus>;
  score: number;
}) {
  const title = kind === "om" ? "O&M Visit Summary" : kind === "inspection" ? "Drone Inspection Report" : "Performance Summary";
  const icon = kind === "om" ? Wrench : kind === "inspection" ? Radar : Zap;

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Badge tone="blue"><Calendar className="w-3 h-3" /> {new Date().toISOString().slice(0, 10)}</Badge>
          <Button size="sm" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print / Save PDF</Button>
        </div>

        {/* printable report */}
        <div className="rounded-2xl border border-om bg-white text-black p-6 print:border-0 print:p-0">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Datafy Associate</p>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-gray-600">{project.name}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>{client?.company}</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              ["Capacity", `${project.sizeKWp} kWp`],
              ["Panels", project.panelCount.toLocaleString()],
              ["Health Score", `${score}/100`],
              ["Last Visit", ms.lastDate ?? "—"],
              ["Schedule", project.maintenanceSchedule.join(", ")],
              ["Status", project.status],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-gray-200 p-2">
                <p className="text-[9px] uppercase text-gray-400">{k}</p>
                <p className="text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {kind === "om" && <OmReport project={project} store={store} />}
          {kind === "inspection" && <InspectionReport project={project} store={store} />}
          {kind === "performance" && (
            <div>
              <h3 className="font-bold text-sm mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Performance Ratio" value={`${pr.toFixed(1)}%`} />
                <Metric label="CO₂ Offset" value={`${(co2 / 1000).toFixed(2)} t`} />
                <Metric label="Records" value={`${perfCount} days`} />
              </div>
            </div>
          )}

          <p className="text-[9px] text-gray-400 mt-6 pt-3 border-t border-gray-200">
            Generated by Datafy Solar O&amp;M Portal · {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 p-2">
      <p className="text-[9px] uppercase text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OmReport({ project, store }: { project: ReturnType<typeof visibleProjects>[number]; store: Store }) {
  const visits = visitsFor(project.id);
  const defects = visits.flatMap((v) => v.defects);
  return (
    <div>
      <h3 className="font-bold text-sm mb-2">Recent Maintenance Visits</h3>
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-1">Date</th>
            <th>Technician</th>
            <th>Cleaning</th>
            <th>Defects</th>
          </tr>
        </thead>
        <tbody>
          {visits.slice(0, 5).map((v) => (
            <tr key={v.id} className="border-b border-gray-100">
              <td className="py-1">{v.date}</td>
              <td>{v.technician}</td>
              <td>{v.cleaningType}</td>
              <td>{v.defects.length} ({v.defects.filter((d) => d.status === "Open").length} open)</td>
            </tr>
          ))}
          {visits.length === 0 && <tr><td colSpan={4} className="py-2 text-gray-400">No visits recorded.</td></tr>}
        </tbody>
      </table>
      <h3 className="font-bold text-sm mb-1">Open Defects ({defects.filter((d) => d.status === "Open").length})</h3>
      <ul className="text-xs text-gray-600 list-disc pl-4">
        {defects.filter((d) => d.status === "Open").slice(0, 8).map((d) => (
          <li key={d.id}>{d.category}: {d.description}</li>
        ))}
        {defects.filter((d) => d.status === "Open").length === 0 && <li>No open defects.</li>}
      </ul>
    </div>
  );
}

function InspectionReport({ project, store }: { project: ReturnType<typeof visibleProjects>[number]; store: Store }) {
  void store;
  const inspections = inspectionsFor(project.id);
  const anomalies = inspections.flatMap((i) => i.anomalies);
  const byType: Record<string, number> = {};
  anomalies.forEach((a) => (byType[a.type] = (byType[a.type] ?? 0) + 1));

  return (
    <div>
      <h3 className="font-bold text-sm mb-2">Inspection Summary ({inspections.length} inspections)</h3>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Metric label="Total Anomalies" value={`${anomalies.length}`} />
        <Metric label="Open" value={`${anomalies.filter((a) => a.status === "Open").length}`} />
        <Metric label="Critical" value={`${anomalies.filter((a) => a.severity === "Critical").length}`} />
        <Metric label="Resolved" value={`${anomalies.filter((a) => a.status === "Resolved").length}`} />
      </div>
      <h3 className="font-bold text-sm mb-1">By Anomaly Type</h3>
      <ul className="text-xs text-gray-600 list-disc pl-4">
        {Object.entries(byType).map(([t, c]) => <li key={t}>{t}: {c}</li>)}
        {Object.keys(byType).length === 0 && <li>No anomalies recorded.</li>}
      </ul>
    </div>
  );
}
