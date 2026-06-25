"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Zap, Sun, Thermometer, Gauge, TrendingUp } from "lucide-react";
import { getScada } from "@/lib/d3-data";

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Zap;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <h3 className="flex items-center gap-2 font-display font-bold text-base mb-4">
        <Icon className="w-4.5 h-4.5 text-brand-400" />
        {title}
      </h3>
      <div className="h-60">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(10,15,13,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

export default function ScadaTab({ siteId }: { siteId: string }) {
  const [range, setRange] = useState<7 | 14 | 30>(30);
  const data = useMemo(() => getScada(siteId).slice(-range), [siteId, range]);

  const kpis = useMemo(() => {
    const totalEnergy = data.reduce((s, d) => s + d.power, 0);
    const peak = Math.max(...data.map((d) => d.power));
    const avgPR =
      data.reduce((s, d) => s + d.performanceRatio, 0) / Math.max(data.length, 1);
    const avgIrr =
      data.reduce((s, d) => s + d.irradiance, 0) / Math.max(data.length, 1);
    return { totalEnergy, peak, avgPR, avgIrr };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1">SCADA Performance Monitoring</h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Historical SCADA data for performance monitoring and trend analysis of key plant
            parameters.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r ? "bg-brand-600 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Energy",
            value: `${(kpis.totalEnergy / 1000).toFixed(1)} MWh`,
            sub: `${range}-day period`,
            icon: Zap,
            tone: "bg-amber-500/15 text-amber-400",
          },
          {
            label: "Peak Output",
            value: `${(kpis.peak / 1000).toFixed(2)} MW`,
            sub: "Daily maximum",
            icon: TrendingUp,
            tone: "bg-brand-500/15 text-brand-400",
          },
          {
            label: "Avg Performance Ratio",
            value: `${kpis.avgPR.toFixed(1)}%`,
            sub: "DC→AC efficiency",
            icon: Gauge,
            tone: "bg-purple-500/15 text-purple-400",
          },
          {
            label: "Avg Irradiance",
            value: `${kpis.avgIrr.toFixed(0)} W/m²`,
            sub: "Plane of array",
            icon: Sun,
            tone: "bg-sky-500/15 text-sky-400",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                {k.label}
              </span>
              <span className={`grid place-items-center w-8 h-8 rounded-lg ${k.tone}`}>
                <k.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-display font-bold">{k.value}</p>
            <p className="text-xs text-white/50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Power Output (kWh)" icon={Zap}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="power"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#gPower)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance Ratio (%)" icon={Gauge}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="performanceRatio"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Plane-of-Array Irradiance (W/m²)" icon={Sun}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gIrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="irradiance"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#gIrr)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Module vs Ambient Temperature (°C)" icon={Thermometer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="moduleTemp"
                name="Module"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ambientTemp"
                name="Ambient"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
