"use client";

import { useMemo, useState } from "react";
import { Thermometer, Filter, Search, AlertTriangle } from "lucide-react";
import {
  getPanels,
  DEFECT_COLORS,
  SEVERITY_COLORS,
  type DefectType,
  type Severity,
} from "@/lib/d3-data";

const ALL_TYPES: DefectType[] = [
  "Hotspot",
  "Bypass Diode",
  "Cell Crack",
  "String Imbalance",
  "Soiling",
  "PID",
];

function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {severity}
    </span>
  );
}

export default function DefectsTab({ siteId }: { siteId: string }) {
  const allPanels = useMemo(
    () => getPanels(siteId).filter((p) => p.status === "Defective"),
    [siteId]
  );

  const [typeFilter, setTypeFilter] = useState<DefectType | "All">("All");
  const [sevFilter, setSevFilter] = useState<Severity | "All">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      allPanels.filter((p) => {
        if (typeFilter !== "All" && p.defectType !== typeFilter) return false;
        if (sevFilter !== "All" && p.severity !== sevFilter) return false;
        if (query && !p.id.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [allPanels, typeFilter, sevFilter, query]
  );

  // group by defect type
  const grouped = useMemo(() => {
    const map = new Map<DefectType, typeof filtered>();
    for (const p of filtered) {
      const key = p.defectType as DefectType;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // type summary counts (unfiltered)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allPanels) counts[p.defectType!] = (counts[p.defectType!] ?? 0) + 1;
    return counts;
  }, [allPanels]);

  const avgTemp =
    filtered.length > 0
      ? filtered.reduce((s, p) => s + (p.tempDiff ?? 0), 0) / filtered.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">Defective Panels</h2>
        <p className="text-sm text-white/60 max-w-2xl">
          Panels categorised by defect type, each with its temperature difference (ΔT) and severity
          rating from thermographic inspection.
        </p>
      </div>

      {/* Summary chips by type */}
      <div className="flex flex-wrap gap-2">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter((cur) => (cur === t ? "All" : t))}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              typeFilter === t
                ? "border-transparent text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
            style={typeFilter === t ? { backgroundColor: DEFECT_COLORS[t] } : undefined}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: DEFECT_COLORS[t] }}
            />
            {t}
            <span className="opacity-70">{typeCounts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search panel ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value as Severity | "All")}
            className="bg-transparent text-sm text-white focus:outline-none"
          >
            <option value="All" className="bg-ink-800">All severities</option>
            <option value="Critical" className="bg-ink-800">Critical</option>
            <option value="Major" className="bg-ink-800">Major</option>
            <option value="Minor" className="bg-ink-800">Minor</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Defects", value: allPanels.length, tone: "text-white" },
          { label: "Showing", value: filtered.length, tone: "text-brand-400" },
          {
            label: "Critical",
            value: allPanels.filter((p) => p.severity === "Critical").length,
            tone: "text-red-400",
          },
          { label: "Avg ΔT", value: `${avgTemp.toFixed(1)}°C`, tone: "text-amber-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/50">{k.label}</p>
            <p className={`text-xl font-display font-bold ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      <div className="space-y-5">
        {grouped.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-10 text-center text-white/50">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No defects match the current filters.
          </div>
        )}

        {grouped.map(([type, panels]) => (
          <div
            key={type}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
          >
            {/* Group header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b border-white/10"
              style={{ backgroundColor: `${DEFECT_COLORS[type]}14` }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: DEFECT_COLORS[type] }}
                />
                <h3 className="font-display font-bold">{type}</h3>
              </div>
              <span className="text-xs text-white/50">{panels.length} panels</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-white/40">
                    <th className="px-5 py-2 font-medium">Panel ID</th>
                    <th className="px-5 py-2 font-medium">Location</th>
                    <th className="px-5 py-2 font-medium">Defect Type</th>
                    <th className="px-5 py-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5" /> Temp ΔT
                      </span>
                    </th>
                    <th className="px-5 py-2 font-medium">Severity</th>
                    <th className="px-5 py-2 font-medium text-right">Power Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {panels.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-white/90">{p.id}</td>
                      <td className="px-5 py-3 text-white/60">
                        {p.block} · R{p.row}C{p.col}
                      </td>
                      <td className="px-5 py-3 text-white/70">{p.defectType}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: SEVERITY_COLORS[p.severity!],
                            }}
                          />
                          +{p.tempDiff}°C
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={p.severity!} />
                      </td>
                      <td className="px-5 py-3 text-right text-white/70">{p.powerLossW} W</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
