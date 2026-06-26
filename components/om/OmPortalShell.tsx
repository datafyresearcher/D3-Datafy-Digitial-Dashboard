"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CalendarClock,
  Radar,
  LineChart,
  FileText,
  Globe,
  LogOut,
  Sun,
  Menu,
  X,
  ShieldCheck,
  Wind,
  Zap,
  Cable,
} from "lucide-react";
import { omLogout, type Role, type User } from "@/lib/auth";
import { useOmStore } from "./useOmStore";
import Dashboard from "./views/Dashboard";
import ClientsView from "./views/ClientsView";
import ProjectsView from "./views/ProjectsView";
import MaintenanceView from "./views/MaintenanceView";
import InspectionsView from "./views/InspectionsView";
import PerformanceView from "./views/PerformanceView";
import ReportsView from "./views/ReportsView";
import SiteLocationsView from "./views/SiteLocationsView";

type ViewId =
  | "dashboard"
  | "clients"
  | "projects"
  | "maintenance"
  | "inspections"
  | "performance"
  | "reports"
  | "sites";

const ALL_VIEWS: { id: ViewId; label: string; icon: typeof Sun; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "field_engineer", "client"] },
  { id: "clients", label: "Clients", icon: Building2, roles: ["super_admin"] },
  { id: "projects", label: "Projects", icon: FolderKanban, roles: ["super_admin", "field_engineer", "client"] },
  { id: "maintenance", label: "O&M Logs", icon: CalendarClock, roles: ["super_admin", "field_engineer", "client"] },
  { id: "inspections", label: "Drone Inspections", icon: Radar, roles: ["super_admin", "field_engineer", "client"] },
  { id: "performance", label: "Performance", icon: LineChart, roles: ["super_admin", "field_engineer", "client"] },
  { id: "reports", label: "Reports & Docs", icon: FileText, roles: ["super_admin", "field_engineer", "client"] },
  { id: "sites", label: "GIS", icon: Globe, roles: ["super_admin", "field_engineer", "client"] },
];

const FUTURE_VIEWS: { id: string; label: string; icon: typeof Sun; roles: Role[] }[] = [
  { id: "wind-inspections", label: "Wind Farms Inspections", icon: Wind, roles: ["super_admin", "field_engineer", "client"] },
  { id: "substation-inspections", label: "Substation Inspections", icon: Zap, roles: ["super_admin", "field_engineer", "client"] },
  { id: "tl-inspections", label: "TL Inspection", icon: Cable, roles: ["super_admin", "field_engineer", "client"] },
];

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  field_engineer: "Field Engineer",
  client: "Client",
};

export default function OmPortalShell({ user }: { user: User }) {
  const router = useRouter();
  const store = useOmStore();
  const [view, setView] = useState<ViewId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalProjectId, setGlobalProjectId] = useState<string>("");

  const views = useMemo(() => ALL_VIEWS.filter((v) => v.roles.includes(user.role)), [user.role]);
  const futureViews = useMemo(() => FUTURE_VIEWS.filter((v) => v.roles.includes(user.role)), [user.role]);

  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [user.name]
  );

  const handleLogout = async () => {
    await omLogout();
    router.replace("/portal/login");
  };

  // expose store & selection so memo on useOmStore in children re-renders
  const _storeRef = store;

  return (
    <div className="min-h-screen bg-ink-900 text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ink-800 border-r border-white/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
              <Sun className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-lg block">O&amp;M Portal</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-brand-400 font-bold">
                Datafy Associate
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {views.map((v) => {
            const active = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setView(v.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <v.icon className="w-4.5 h-4.5" />
                {v.label}
              </button>
            );
          })}
          {futureViews.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
              {futureViews.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled
                  title="Planned feature — coming in a future release"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/35 cursor-not-allowed"
                >
                  <v.icon className="w-4.5 h-4.5 shrink-0 opacity-50" />
                  <span className="flex-1 text-left truncate">{v.label}</span>
                  <span className="shrink-0 text-[10px] font-bold tracking-wider text-amber-400/70">[FUTURE]</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {ROLE_LABEL[user.role]}
                {user.clientSubRole === "client_admin" && " · Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-4 bg-ink-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden grid place-items-center w-9 h-9 rounded-lg bg-white/5 text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-lg">
                {views.find((v) => v.id === view)?.label}
              </h1>
              <p className="text-xs text-white/50">
                {user.company} · Signed in as {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Synced
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden" data-view={_storeRef.clients.length}>
          {view === "dashboard" && (
            <Dashboard
              user={user}
              store={store}
              projectId={globalProjectId}
              onProject={setGlobalProjectId}
              onNavigate={setView}
            />
          )}
          {view === "clients" && <ClientsView user={user} store={store} />}
          {view === "projects" && <ProjectsView user={user} store={store} />}
          {view === "maintenance" && (
            <MaintenanceView user={user} store={store} projectId={globalProjectId} onProject={setGlobalProjectId} />
          )}
          {view === "inspections" && (
            <InspectionsView user={user} store={store} projectId={globalProjectId} onProject={setGlobalProjectId} />
          )}
          {view === "performance" && (
            <PerformanceView user={user} store={store} projectId={globalProjectId} onProject={setGlobalProjectId} />
          )}
          {view === "reports" && (
            <ReportsView user={user} store={store} projectId={globalProjectId} onProject={setGlobalProjectId} />
          )}
          {view === "sites" && <SiteLocationsView user={user} store={store} />}
        </main>
      </div>
    </div>
  );
}
