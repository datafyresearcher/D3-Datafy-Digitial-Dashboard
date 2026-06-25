"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Map as MapIcon,
  AlertTriangle,
  FileText,
  Activity,
  Globe,
  LogOut,
  Sun,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { logout, type User } from "@/lib/auth";
import { sites } from "@/lib/d3-data";
import MapsTab from "./MapsTab";
import DefectsTab from "./DefectsTab";
import ReportTab from "./ReportTab";
import ScadaTab from "./ScadaTab";
import SiteLocationsTab from "./SiteLocationsTab";

type TabId = "maps" | "defects" | "report" | "scada" | "sites";

const TABS: { id: TabId; label: string; icon: typeof MapIcon }[] = [
  { id: "maps", label: "Maps", icon: MapIcon },
  { id: "defects", label: "Defects", icon: AlertTriangle },
  { id: "report", label: "Report", icon: FileText },
  { id: "scada", label: "SCADA", icon: Activity },
  { id: "sites", label: "Site Locations", icon: Globe },
];

export default function PortalShell({ user }: { user: User }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("maps");
  const [siteId, setSiteId] = useState(sites[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/d3/login");
  };

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

  return (
    <div className="min-h-screen bg-ink-900 text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ink-800 border-r border-white/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
              <Sun className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-lg block">D³ Portal</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-brand-400 font-bold">
                Digital Dashboard
              </span>
            </div>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Site selector */}
        <div className="px-4 py-4 border-b border-white/10">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">
            <Building2 className="w-3.5 h-3.5" /> Active Site
          </label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id} className="bg-ink-800">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <t.icon className="w-4.5 h-4.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.role}</p>
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-4 bg-ink-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden grid place-items-center w-9 h-9 rounded-lg bg-white/5 text-white"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="leading-tight">
              <h1 className="font-display font-bold text-lg capitalize">{tab}</h1>
              <p className="text-xs text-white/50">
                {sites.find((s) => s.id === siteId)?.name}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Live monitoring
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">
          {tab === "maps" && <MapsTab siteId={siteId} />}
          {tab === "defects" && <DefectsTab siteId={siteId} />}
          {tab === "report" && <ReportTab siteId={siteId} />}
          {tab === "scada" && <ScadaTab siteId={siteId} />}
          {tab === "sites" && <SiteLocationsTab />}
        </main>
      </div>
    </div>
  );
}
