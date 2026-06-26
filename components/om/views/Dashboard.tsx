"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  FolderKanban,
  CalendarClock,
  AlertTriangle,
  Leaf,
  Gauge,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Globe,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  type Store,
  visibleProjects,
  healthScore,
  maintenanceStatus,
  co2OffsetKg,
  performanceRatio,
  visitsFor,
} from "@/lib/om";
import { canManage } from "../perms";
import { Stat, Card, CardHeader, Badge, Button } from "../ui";
import SiteLocationsView from "./SiteLocationsView";

type ViewId =
  | "dashboard"
  | "clients"
  | "projects"
  | "overview"
  | "maintenance"
  | "inspections"
  | "performance"
  | "reports";

export default function Dashboard({
  user,
  store,
  projectId,
  onProject,
  onNavigate,
}: {
  user: User;
  store: Store;
  projectId: string;
  onProject: (id: string) => void;
  onNavigate: (v: ViewId, projectId?: string) => void;
}) {
  const projects = useMemo(() => visibleProjects(user), [user, store]);
  const active = useMemo(
    () => projects.find((p) => p.id === projectId) ?? projects[0],
    [projects, projectId]
  );

  const openDefects = store.visits
    .filter((v) => projects.some((p) => p.id === v.projectId))
    .flatMap((v) => v.defects)
    .filter((d) => d.status === "Open").length;
  const openAnomalies = store.inspections
    .filter((i) => projects.some((p) => p.id === i.projectId))
    .flatMap((i) => i.anomalies)
    .filter((a) => a.status === "Open").length;

  const totalCO2 = projects.reduce((s, p) => s + co2OffsetKg(p.id), 0);
  const avgPR = projects.length
    ? projects.reduce((s, p) => s + performanceRatio(p.id), 0) / projects.length
    : 0;

  const overdueProjects = projects.filter((p) => maintenanceStatus(p).overdue);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">
          Welcome back, {user.name.split(" ")[0]}
        </h2>
        <p className="text-sm text-white/60">
          {canManage(user)
            ? `Managing ${store.clients.length} clients and ${store.projects.length} projects.`
            : user.role === "client"
            ? `You have access to ${projects.length} project${projects.length !== 1 ? "s" : ""}.`
            : `Field operations across ${projects.length} projects.`}
        </p>
      </div>

      {/* GIS site map */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">Site Locations (GIS)</h3>
            <p className="text-xs text-white/50">
              {projects.length} monitored site{projects.length === 1 ? "" : "s"} on the hybrid satellite map
            </p>
          </div>
        </div>
        <SiteLocationsView user={user} store={store} embedded />
      </div>

      {/* Role-aware KPIs — single row on desktop */}
      <div
        className={`grid gap-3 ${
          canManage(user) ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {canManage(user) && (
          <Stat label="Clients" value={store.clients.length} icon={Building2} tone="text-brand-400" />
        )}
        <Stat
          label="Projects"
          value={projects.length}
          icon={FolderKanban}
          tone="text-brand-400"
        />
        <Stat
          label="Open Issues"
          value={openDefects + openAnomalies}
          icon={AlertTriangle}
          tone="text-red-400"
          sub={`${openDefects} defects · ${openAnomalies} anomalies`}
        />
        <Stat
          label="Avg Perf. Ratio"
          value={`${avgPR.toFixed(1)}%`}
          icon={Gauge}
          tone="text-purple-400"
        />
        <Stat
          label="CO₂ Offset"
          value={`${(totalCO2 / 1000).toFixed(1)} t`}
          icon={Leaf}
          tone="text-emerald-400"
          sub="From generation data"
        />
      </div>

      {/* Overdue banner */}
      {overdueProjects.length > 0 && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-200 text-sm">
                {overdueProjects.length} project{overdueProjects.length !== 1 ? "s" : ""} overdue for
                scheduled maintenance
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {overdueProjects.map((p) => p.name).join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => onNavigate("maintenance", overdueProjects[0]?.id)}
            >
              Review <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Projects with health */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg">Project Health</h3>
          <Button size="sm" variant="ghost" onClick={() => onNavigate("projects")}>
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const score = healthScore(p);
            const ms = maintenanceStatus(p);
            const tone =
              score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
            const bar =
              score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
            return (
              <Card key={p.id} className="p-4 hover:border-white/20 transition-colors cursor-pointer">
                <div onClick={() => onNavigate("overview", p.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-white/50">{p.classification} · {p.sizeKWp} kWp</p>
                  </div>
                  {ms.overdue ? (
                    <Badge tone="red">Overdue</Badge>
                  ) : (
                    <Badge tone="green">{p.status}</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-2xl font-display font-bold ${tone}`}>{score}</span>
                  <span className="text-xs text-white/50">health score</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Last visit: {ms.lastDate ?? "—"}</span>
                  <span>{ms.daysSince > 9000 ? "never" : `${ms.daysSince}d ago`}</span>
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent activity (client) / audit (admin) */}
      {canManage(user) ? (
        <Card>
          <CardHeader title="Recent Audit Log" icon={TrendingUp} />
          <div className="divide-y divide-white/5">
            {store.audit.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Badge tone={a.action === "delete" ? "red" : a.action === "upload" ? "blue" : a.action === "create" ? "green" : "neutral"}>
                  {a.action}
                </Badge>
                <span className="text-white/80 flex-1 truncate">{a.target}</span>
                <span className="text-white/40 text-xs">{a.userName}</span>
                <span className="text-white/30 text-xs">
                  {new Date(a.ts).toLocaleDateString()}
                </span>
              </div>
            ))}
            {store.audit.length === 0 && (
              <p className="px-5 py-6 text-center text-white/40 text-sm">No activity yet.</p>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Your Activity" icon={TrendingUp} />
          <div className="divide-y divide-white/5">
            {projects[0] &&
              getClient(store, user).activity.slice(0, 6).map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <Badge tone={ev.type === "download" ? "blue" : ev.type === "login" ? "green" : "neutral"}>
                    {ev.type}
                  </Badge>
                  <span className="text-white/80 flex-1">{ev.detail}</span>
                  <span className="text-white/30 text-xs">
                    {new Date(ev.ts).toLocaleDateString()}
                  </span>
                </div>
              ))}
            {projects.length === 0 && (
              <p className="px-5 py-6 text-center text-white/40 text-sm">
                No projects assigned yet.
              </p>
            )}
          </div>
        </Card>
      )}

      <p className="text-center text-xs text-white/30 pt-2">
        Solar O&amp;M Portal ·{" "}
        <Link href="/d3" className="hover:text-brand-400">
          D³ Dashboard
        </Link>{" "}
        ·{" "}
        <Link href="/" className="hover:text-brand-400">
          Website
        </Link>
      </p>
    </div>
  );
}

function getClient(store: Store, user: User) {
  return (
    store.clients.find((c) => c.id === user.clientId) ?? {
      company: user.company ?? "",
      contactName: user.name,
      activity: [],
      id: "",
      email: user.email,
      phone: "",
      billingTier: "Basic",
      status: "Active",
      createdAt: "",
    }
  );
}
