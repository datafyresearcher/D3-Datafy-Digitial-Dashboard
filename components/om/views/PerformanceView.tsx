"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  LineChart as LineIcon,
  Upload,
  Plus,
  Leaf,
  Gauge,
  Zap,
  AlertTriangle,
  TrendingDown,
  FileSpreadsheet,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  visibleProjects,
  performanceFor,
  performanceRatio,
  co2OffsetKg,
  addPerformance,
  parsePerformanceCsv,
} from "@/lib/om";
import { canUpload } from "../perms";
import {
  Button,
  Card,
  CardHeader,
  Badge,
  Field,
  Input,
  Modal,
  EmptyState,
  Stat,
} from "../ui";
import { ProjectPicker } from "./ProjectPicker";

const tooltipStyle = {
  backgroundColor: "rgba(10,15,13,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

export default function PerformanceView({
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
  const [showManual, setShowManual] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const [threshold, setThreshold] = useState(75);

  if (!project) return <Card><EmptyState icon={LineIcon} title="No projects" /></Card>;

  const recs = performanceFor(project.id);
  const pr = performanceRatio(project.id);
  const co2 = co2OffsetKg(project.id);
  const totalEnergy = recs.reduce((s, r) => s + r.energyKWh, 0);

  // alert: any day below threshold PR
  const lowDays = recs.filter((r) => (r.energyKWh / r.expectedKWh) * 100 < threshold);
  const chartData = recs.map((r) => ({
    date: r.date.slice(5),
    actual: r.energyKWh,
    expected: r.expectedKWh,
    pr: +((r.energyKWh / r.expectedKWh) * 100).toFixed(1),
  }));

  const importCsv = () => {
    const parsed = parsePerformanceCsv(csvText);
    if (parsed.length === 0) {
      alert("No valid rows. Use the format: date,energy (e.g. 2026-06-01,1820)");
      return;
    }
    parsed.forEach((p) => addPerformance(project.id, p.date, p.energyKWh, user));
    setCsvText("");
    setShowCsv(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Performance Analytics</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Energy generation, Performance Ratio (PR), actual vs expected output and CO₂ offset — via
            manual entry or CSV.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectPicker user={user} projects={projects} value={project.id} onChange={onProject} />
          {canUpload(user) && (
            <Button onClick={() => setShowManual(true)}><Plus className="w-4 h-4" /> Add Reading</Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Performance Ratio" value={`${pr.toFixed(1)}%`} tone={pr >= 80 ? "text-emerald-400" : pr >= 70 ? "text-amber-400" : "text-red-400"} icon={Gauge} />
        <Stat label="Total Generation" value={`${(totalEnergy / 1000).toFixed(1)} MWh`} sub={`Over ${recs.length} days`} icon={Zap} />
        <Stat label="CO₂ Offset" value={`${(co2 / 1000).toFixed(2)} t`} sub="≈ 0.42 kg / kWh" icon={Leaf} tone="text-emerald-400" />
        <Stat label="Low-output Days" value={lowDays.length} sub={`Below ${threshold}% PR`} tone={lowDays.length ? "text-red-400" : "text-white"} icon={AlertTriangle} />
      </div>

      {/* Threshold alert */}
      {lowDays.length > 0 && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-200 text-sm">Performance alert triggered</p>
              <p className="text-xs text-white/60 mt-0.5">
                {lowDays.length} day{lowDays.length !== 1 ? "s" : ""} fell below the {threshold}% PR threshold: {lowDays.slice(0, 5).map((d) => d.date).join(", ")}{lowDays.length > 5 ? "…" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-20 text-xs py-1.5" />
              <span className="text-xs text-white/50">% PR</span>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      {recs.length === 0 ? (
        <Card><EmptyState icon={LineIcon} title="No performance data" hint={canUpload(user) ? "Add readings manually or via CSV." : "No data uploaded yet."} /></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Actual vs Expected Output (kWh)" icon={Zap} />
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" name="Actual" dataKey="actual" stroke="#f59e0b" strokeWidth={2} fill="url(#gAct)" />
                  <Line type="monotone" name="Expected" dataKey="expected" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Performance Ratio Trend (%)" icon={Gauge} />
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `${threshold}% alert`, fontSize: 10, fill: "#ef4444" }} />
                  <Line type="monotone" name="PR" dataKey="pr" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* CSV upload */}
      {canUpload(user) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk CSV upload
            </p>
            <Button size="sm" variant="subtle" onClick={() => setShowCsv((s) => !s)}>{showCsv ? "Cancel" : "Paste CSV"}</Button>
          </div>
          {showCsv ? (
            <div className="space-y-2">
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={"2026-06-01,1820\n2026-06-02,1740\n2026-06-03,1900"}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-white/40 focus:border-brand-500 focus:outline-none"
              />
              <Button size="sm" onClick={importCsv}><Upload className="w-3.5 h-3.5" /> Import {csvText ? `(${parsePerformanceCsv(csvText).length} rows)` : ""}</Button>
            </div>
          ) : (
            <p className="text-xs text-white/40">Format: <code className="text-brand-300">date,energy_kwh</code> per line. Example: <code className="text-brand-300">2026-06-01,1820</code></p>
          )}
        </Card>
      )}

      {/* Manual entry modal */}
      {showManual && (
        <ManualEntry open={showManual} onClose={() => setShowManual(false)} project={project} user={user} />
      )}
    </div>
  );
}

function ManualEntry({ open, onClose, project, user }: { open: boolean; onClose: () => void; project: { id: string; name: string }; user: User }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [energy, setEnergy] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Add Performance Reading">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const kwh = parseFloat(energy);
          if (isNaN(kwh)) return;
          addPerformance(project.id, date, kwh, user);
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="Date"><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Energy generated (kWh)"><Input type="number" step="any" required value={energy} onChange={(e) => setEnergy(e.target.value)} placeholder="e.g. 1820" /></Field>
        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">Save Reading</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
