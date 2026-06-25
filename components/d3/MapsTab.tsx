"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  PanelTop,
  AlertTriangle,
  Zap,
  DollarSign,
  Sun,
  MapPin,
} from "lucide-react";
import {
  getPanels,
  getDefectiveSummary,
  getReportMetrics,
  sites,
  SEVERITY_COLORS,
} from "@/lib/d3-data";

// Leaflet must be rendered client-side only.
const SiteMap = dynamic(() => import("./SiteMap"), { ssr: false, loading: () => <MapSkeleton /> });

function MapSkeleton() {
  return (
    <div className="h-full w-full grid place-items-center rounded-2xl bg-white/5 border border-white/10 text-white/40">
      <div className="flex flex-col items-center gap-2">
        <Sun className="w-6 h-6 animate-spin" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub?: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
        <span className={`grid place-items-center w-8 h-8 rounded-lg ${tone}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
    </div>
  );
}

export default function MapsTab({ siteId }: { siteId: string }) {
  const [showDefectiveOnly, setShowDefectiveOnly] = useState(false);
  const site = useMemo(() => sites.find((s) => s.id === siteId)!, [siteId]);
  const allPanels = useMemo(() => getPanels(siteId), [siteId]);
  const summary = useMemo(() => getDefectiveSummary(siteId), [siteId]);
  const metrics = useMemo(() => getReportMetrics(siteId), [siteId]);

  const panels = useMemo(
    () => (showDefectiveOnly ? allPanels.filter((p) => p.status === "Defective") : allPanels),
    [allPanels, showDefectiveOnly]
  );

  const defectiveSample = allPanels.filter((p) => p.status === "Defective");

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Geospatial Asset Map</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Interactive solar asset digitization. Defective panels are colour-coded by severity,
            with accumulative power and revenue loss quantified below.
          </p>
        </div>
        <label className="inline-flex items-center gap-3 cursor-pointer select-none">
          <span className="text-sm text-white/70">Defective only</span>
          <span
            onClick={() => setShowDefectiveOnly((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              showDefectiveOnly ? "bg-brand-600" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                showDefectiveOnly ? "translate-x-5" : ""
              }`}
            />
          </span>
        </label>
      </div>

      {/* Impact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={PanelTop}
          label="Total Panels"
          value={summary.total.toLocaleString()}
          sub={`${site.capacityMW} MW · ${site.client}`}
          tone="bg-brand-500/15 text-brand-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Defective Panels"
          value={summary.defective.toLocaleString()}
          sub={`${((summary.defective / summary.total) * 100).toFixed(2)}% of array`}
          tone="bg-red-500/15 text-red-400"
        />
        <StatCard
          icon={Zap}
          label="Power Loss"
          value={`${metrics.totalPowerLossKW.toLocaleString()} kW`}
          sub="Accumulated across defects"
          tone="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue Loss / yr"
          value={`$${metrics.annualRevenueLossUSD.toLocaleString()}`}
          sub="Estimated annual impact"
          tone="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* Map + side panel */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[420px] rounded-2xl overflow-hidden border border-white/10">
          <SiteMap site={site} panels={panels} />
        </div>

        <div className="space-y-4">
          {/* Site info */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-brand-400" /> {site.name}
            </h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Client", site.client],
                ["Location", site.location],
                ["Capacity", `${site.capacityMW} MW`],
                ["Commissioned", site.commissioned],
                ["Coordinates", `${site.lat.toFixed(4)}, ${site.lng.toFixed(4)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-white/50">{k}</dt>
                  <dd className="text-white/90 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Legend */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h3 className="font-display font-bold text-sm mb-3 uppercase tracking-wider text-white/60">
              Severity Legend
            </h3>
            <ul className="space-y-2 text-sm">
              {(["Critical", "Major", "Minor"] as const).map((sev) => (
                <li key={sev} className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                  />
                  <span className="text-white/80">{sev}</span>
                  <span className="ml-auto text-white/50">
                    {defectiveSample.filter((p) => p.severity === sev).length} sampled
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-3 pt-2 border-t border-white/10">
                <span className="w-3.5 h-3.5 rounded-full bg-brand-400" />
                <span className="text-white/80">Healthy</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
