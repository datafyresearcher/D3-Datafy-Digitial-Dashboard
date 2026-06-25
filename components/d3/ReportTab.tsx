"use client";

import { useMemo } from "react";
import {
  FileText,
  Heart,
  Activity,
  Zap,
  DollarSign,
  Printer,
  CalendarDays,
  Gauge,
} from "lucide-react";
import {
  getReportMetrics,
  DEFECT_COLORS,
  SEVERITY_COLORS,
} from "@/lib/d3-data";

function HealthGauge({ score }: { score: number }) {
  // semicircle gauge from 0..100
  const radius = 70;
  const circ = Math.PI * radius; // half circle
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="110" viewBox="0 0 180 110">
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="90" y="80" textAnchor="middle" className="fill-white font-display font-bold" fontSize="32">
          {score}
        </text>
        <text x="90" y="100" textAnchor="middle" className="fill-white/50" fontSize="11">
          / 100
        </text>
      </svg>
      <span className="text-xs uppercase tracking-wider text-white/50">Health Score</span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
      <h3 className="flex items-center gap-2 font-display font-bold text-lg mb-4">
        <Icon className="w-5 h-5 text-brand-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ReportTab({ siteId }: { siteId: string }) {
  const m = useMemo(() => getReportMetrics(siteId), [siteId]);
  const typeRows = Object.entries(m.byType).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(...typeRows.map(([, v]) => v), 1);
  const totalDefects = typeRows.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-6 print:text-black">
      {/* Heading + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">Inspection Report</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Customized report with executive summaries, installation health, defect status, and
            power &amp; financial impact.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/30"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Report header (visible in print) */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600/20 to-transparent border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-400 font-bold mb-1">
              D³ Solar Asset Report
            </p>
            <h2 className="font-display font-bold text-2xl">{m.site.name}</h2>
            <p className="text-sm text-white/60">
              {m.site.client} · {m.site.location}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <CalendarDays className="w-4 h-4 text-brand-400" />
            Inspection date: <span className="text-white/90 font-medium">{m.inspectionDate}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Executive summary */}
        <Section icon={FileText} title="Executive Summary">
          <div className="space-y-3 text-sm text-white/80 leading-relaxed">
            <p>
              A thermographic inspection of the <strong>{m.site.name}</strong> (
              {m.site.capacityMW} MW, {m.summary.total.toLocaleString()} modules) was conducted on{" "}
              {m.inspectionDate}. The assessment identified{" "}
              <strong className="text-red-400">{m.summary.defective.toLocaleString()}</strong>{" "}
              defective modules ({((m.summary.defective / m.summary.total) * 100).toFixed(2)}% of the
              array).
            </p>
            <p>
              The plant currently holds an overall health score of{" "}
              <strong className="text-brand-400">{m.healthScore}/100</strong>, with an estimated
              annual revenue impact of{" "}
              <strong className="text-amber-400">${m.annualRevenueLossUSD.toLocaleString()}</strong>{" "}
              due to underperformance. Prioritised remediation of Critical and Major defects is
              recommended to restore yield.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-white/50">Capacity</p>
                <p className="font-display font-bold text-lg">{m.site.capacityMW} MW</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wider text-white/50">Commissioned</p>
                <p className="font-display font-bold text-lg">{m.site.commissioned}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Health */}
        <Section icon={Heart} title="Installation Health">
          <div className="flex flex-col items-center">
            <HealthGauge score={m.healthScore} />
            <p className="text-xs text-white/50 mt-2 text-center">
              {m.healthScore >= 85
                ? "Excellent condition — minor maintenance advised."
                : m.healthScore >= 70
                ? "Fair condition — schedule remediation soon."
                : "Attention required — multiple critical defects."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-lg bg-white/5 py-2">
              <p className="text-[10px] uppercase text-white/40">Healthy</p>
              <p className="text-sm font-bold text-brand-400">{m.summary.healthy.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <p className="text-[10px] uppercase text-white/40">Defective</p>
              <p className="text-sm font-bold text-red-400">{m.summary.defective.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <p className="text-[10px] uppercase text-white/40">Total</p>
              <p className="text-sm font-bold">{m.summary.total.toLocaleString()}</p>
            </div>
          </div>
        </Section>

        {/* Financial impact */}
        <Section icon={DollarSign} title="Power &amp; Financial Impact">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/70">
                <Zap className="w-4 h-4 text-amber-400" /> Power Loss
              </span>
              <span className="font-display font-bold text-amber-400">
                {m.totalPowerLossKW.toLocaleString()} kW
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/70">
                <Activity className="w-4 h-4 text-purple-400" /> Annual Energy Loss
              </span>
              <span className="font-display font-bold text-purple-400">
                {m.annualEnergyLossKWh.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/70">
                <DollarSign className="w-4 h-4 text-red-400" /> Revenue Loss / yr
              </span>
              <span className="font-display font-bold text-red-400">
                ${m.annualRevenueLossUSD.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/70">
                <Gauge className="w-4 h-4 text-brand-400" /> Expected Annual Yield
              </span>
              <span className="font-display font-bold text-brand-400">
                {m.annualYieldKWh.toLocaleString()} kWh
              </span>
            </div>
          </div>
        </Section>
      </div>

      {/* Defect status */}
      <Section icon={Activity} title="Defect Status Breakdown">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* by type */}
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-3">By Defect Type</p>
            <div className="space-y-3">
              {typeRows.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="inline-flex items-center gap-2 text-white/80">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: DEFECT_COLORS[type as keyof typeof DEFECT_COLORS] }}
                      />
                      {type}
                    </span>
                    <span className="text-white/60">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / maxType) * 100}%`,
                        backgroundColor: DEFECT_COLORS[type as keyof typeof DEFECT_COLORS],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* by severity */}
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-3">By Severity</p>
            <div className="grid grid-cols-3 gap-3">
              {(["Critical", "Major", "Minor"] as const).map((sev) => (
                <div
                  key={sev}
                  className="rounded-xl border p-4 text-center"
                  style={{
                    borderColor: `${SEVERITY_COLORS[sev]}40`,
                    backgroundColor: `${SEVERITY_COLORS[sev]}12`,
                  }}
                >
                  <p className="font-display font-bold text-3xl" style={{ color: SEVERITY_COLORS[sev] }}>
                    {m.bySeverity[sev]}
                  </p>
                  <p className="text-xs text-white/60 mt-1">{sev}</p>
                  <p className="text-[10px] text-white/40">
                    {totalDefects ? ((m.bySeverity[sev] / totalDefects) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <p className="text-center text-xs text-white/30 pt-2">
        Generated by D³ Portal — Datafy Digital Dashboard · {m.inspectionDate}
      </p>
    </div>
  );
}
