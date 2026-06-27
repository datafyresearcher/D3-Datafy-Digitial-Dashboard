"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GridSentinelLogo from "./GridSentinelLogo";
import OmThemeToggle from "./OmThemeToggle";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CalendarClock,
  Radar,
  LineChart,
  FileText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Wind,
  Zap,
  Cable,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
} from "lucide-react";
import { omLogout, type Role, type User } from "@/lib/auth";
import { visibleProjects } from "@/lib/om";
import { useOmStore } from "./useOmStore";
import Dashboard from "./views/Dashboard";
import ClientsView from "./views/ClientsView";
import ProjectsView, { ProjectOverview } from "./views/ProjectsView";
import MaintenanceView from "./views/MaintenanceView";
import InspectionsView from "./views/InspectionsView";
import PerformanceView from "./views/PerformanceView";
import ReportsView from "./views/ReportsView";

type GlobalViewId = "dashboard" | "clients" | "projects";

type ProjectViewId = "overview" | "maintenance" | "inspections" | "performance" | "reports";

const GLOBAL_VIEWS: { id: GlobalViewId; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "field_engineer", "client"] },
  { id: "clients", label: "Clients", icon: Building2, roles: ["super_admin"] },
  { id: "projects", label: "Projects", icon: FolderKanban, roles: ["super_admin", "field_engineer", "client"] },
];

const PROJECT_VIEWS: { id: ProjectViewId; label: string; icon: typeof FolderKanban }[] = [
  { id: "overview", label: "Overview", icon: FolderKanban },
  { id: "maintenance", label: "O&M Logs", icon: CalendarClock },
  { id: "inspections", label: "Drone Inspections", icon: Radar },
  { id: "performance", label: "Performance", icon: LineChart },
  { id: "reports", label: "Reports & Docs", icon: FileText },
];

const FUTURE_VIEWS: { id: string; label: string; icon: typeof Wind; roles: Role[] }[] = [
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
  const [view, setView] = useState<GlobalViewId>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectView, setProjectView] = useState<ProjectViewId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalProjectId, setGlobalProjectId] = useState<string>("");

  const globalViews = useMemo(() => GLOBAL_VIEWS.filter((v) => v.roles.includes(user.role)), [user.role]);
  const futureViews = useMemo(() => FUTURE_VIEWS.filter((v) => v.roles.includes(user.role)), [user.role]);
  const projects = useMemo(() => visibleProjects(user), [user, store]);
  const selectedProject = useMemo(
    () => (selectedProjectId ? projects.find((p) => p.id === selectedProjectId) ?? store.projects.find((p) => p.id === selectedProjectId) : null),
    [selectedProjectId, projects, store.projects]
  );

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

  const openProject = (projectId: string, subView: ProjectViewId = "overview") => {
    setSelectedProjectId(projectId);
    setGlobalProjectId(projectId);
    setProjectView(subView);
    setView("projects");
    setSidebarOpen(false);
  };

  const selectProject = (projectId: string) => {
    setGlobalProjectId(projectId);
    if (selectedProjectId) setSelectedProjectId(projectId);
  };

  const exitProject = () => {
    setSelectedProjectId(null);
    setProjectView("overview");
    setView("projects");
  };

  const handleNavigate = (target: GlobalViewId | ProjectViewId, projectId?: string) => {
    if (projectId) {
      openProject(projectId, target as ProjectViewId);
      return;
    }
    if (target === "overview" || target === "maintenance" || target === "inspections" || target === "performance" || target === "reports") {
      if (selectedProjectId) setProjectView(target);
      return;
    }
    setSelectedProjectId(null);
    setView(target as GlobalViewId);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await omLogout();
    router.replace("/portal/login");
  };

  const headerTitle = selectedProject
    ? `${selectedProject.name} · ${PROJECT_VIEWS.find((v) => v.id === projectView)?.label ?? "Overview"}`
    : globalViews.find((v) => v.id === view)?.label ?? "Dashboard";

  const _storeRef = store;
  const inProjectContext = !!selectedProject;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 om-bg-elevated border-r border-om flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-72"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`border-b border-om ${
            sidebarCollapsed
              ? "flex flex-col items-center gap-3 px-2 py-3"
              : "flex items-center justify-between gap-2 px-4 py-5"
          }`}
        >
          <GridSentinelLogo variant={sidebarCollapsed ? "sidebar-collapsed" : "sidebar"} />
          {sidebarCollapsed ? (
            <button
              className="grid place-items-center w-11 h-11 rounded-xl bg-om-surface border border-om text-om-fg hover:bg-om-surface-hover hover:border-brand-500/40 transition-colors shadow-sm shrink-0"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                className="hidden lg:grid place-items-center w-11 h-11 rounded-xl bg-om-surface border border-om text-om-muted hover:bg-om-surface-hover hover:text-om-fg hover:border-brand-500/40 transition-colors shrink-0"
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
              <button
                className="lg:hidden grid place-items-center w-10 h-10 rounded-lg text-om-muted hover:text-om-fg shrink-0"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${sidebarCollapsed ? "px-2" : "px-4"}`}>
          {inProjectContext ? (
            <>
              <button
                onClick={exitProject}
                title="All Projects"
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium om-nav-idle hover:bg-om-surface-hover hover:text-om-fg transition-all ${
                  sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                }`}
              >
                <ArrowLeft className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span>All Projects</span>}
              </button>

              {!sidebarCollapsed && selectedProject && (
                <div className="px-4 py-2 mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-om-faint font-semibold">Current Project</p>
                  <p className="text-sm font-semibold text-brand-300 truncate mt-0.5" title={selectedProject.name}>
                    {selectedProject.name}
                  </p>
                </div>
              )}

              <div className={`space-y-1 ${sidebarCollapsed ? "" : "pt-1"}`}>
                {PROJECT_VIEWS.map((v) => {
                  const active = projectView === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setProjectView(v.id);
                        setSidebarOpen(false);
                      }}
                      title={v.label}
                      className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                        sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                      } ${
                        active
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                          : "om-nav-idle hover:bg-om-surface-hover hover:text-om-fg"
                      }`}
                    >
                      <v.icon className="w-4.5 h-4.5 shrink-0" />
                      {!sidebarCollapsed && <span>{v.label}</span>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {globalViews.map((v) => {
                const active = view === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleNavigate(v.id)}
                    title={v.label}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                      sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                    } ${
                      active
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                        : "om-nav-idle hover:bg-om-surface-hover hover:text-om-fg"
                    }`}
                  >
                    <v.icon className="w-4.5 h-4.5 shrink-0" />
                    {!sidebarCollapsed && <span>{v.label}</span>}
                  </button>
                );
              })}
              {futureViews.length > 0 && !sidebarCollapsed && (
                <div className="pt-3 mt-3 border-t border-om space-y-1">
                  {futureViews.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled
                      title="Planned feature — coming in a future release"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-om-faint cursor-not-allowed"
                    >
                      <v.icon className="w-4.5 h-4.5 shrink-0 opacity-50" />
                      <span className="flex-1 text-left truncate">{v.label}</span>
                      <span className="shrink-0 text-[10px] font-bold tracking-wider text-amber-400/70">[FUTURE]</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </nav>

        <div className={`border-t border-om ${sidebarCollapsed ? "px-2 py-3" : "px-4 py-4"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="grid place-items-center w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-sm font-semibold truncate text-om-fg">{user.name}</p>
                <p className="text-xs text-om-subtle flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {ROLE_LABEL[user.role]}
                  {user.clientSubRole === "client_admin" && " · Admin"}
                </p>
              </div>
            </div>
          )}
          <OmThemeToggle
            showLabel={!sidebarCollapsed}
            className={`w-full mb-2 ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-4 py-2.5"}`}
          />
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-om-surface border border-om text-sm font-medium text-om-soft hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all ${
              sidebarCollapsed ? "px-2 py-2.5" : "px-4 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4" /> {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 om-overlay lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-4 om-header-bg backdrop-blur-xl border-b border-om">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden grid place-items-center w-9 h-9 rounded-lg bg-om-surface text-om-fg shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {inProjectContext && (
              <button
                className="hidden sm:grid place-items-center w-9 h-9 rounded-lg bg-om-surface text-om-fg shrink-0 hover:bg-om-surface-hover transition-colors"
                onClick={exitProject}
                title="Back to all projects"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {sidebarCollapsed && <GridSentinelLogo variant="header" className="hidden lg:block" />}
            <div className="leading-tight min-w-0">
              <h1 className="font-display font-bold text-lg truncate text-om-fg">{headerTitle}</h1>
              <p className="text-xs text-om-subtle truncate">
                GridSentinel · Signed in as {ROLE_LABEL[user.role]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <OmThemeToggle showLabel={false} className="hidden sm:inline-flex px-2.5 py-2" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-om-subtle ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Synced
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden" data-view={_storeRef.clients.length}>
          {!inProjectContext && view === "dashboard" && (
            <Dashboard
              user={user}
              store={store}
              projectId={globalProjectId}
              onProject={setGlobalProjectId}
              onNavigate={handleNavigate}
            />
          )}
          {!inProjectContext && view === "clients" && <ClientsView user={user} store={store} />}
          {!inProjectContext && view === "projects" && (
            <ProjectsView user={user} store={store} onOpenProject={openProject} />
          )}
          {inProjectContext && selectedProject && projectView === "overview" && (
            <ProjectOverview project={selectedProject} store={store} user={user} />
          )}
          {inProjectContext && projectView === "maintenance" && (
            <MaintenanceView user={user} store={store} projectId={globalProjectId} onProject={selectProject} />
          )}
          {inProjectContext && projectView === "inspections" && (
            <InspectionsView user={user} store={store} projectId={globalProjectId} onProject={selectProject} />
          )}
          {inProjectContext && projectView === "performance" && (
            <PerformanceView user={user} store={store} projectId={globalProjectId} onProject={selectProject} />
          )}
          {inProjectContext && projectView === "reports" && (
            <ReportsView user={user} store={store} projectId={globalProjectId} onProject={selectProject} />
          )}
        </main>
      </div>
    </div>
  );
}