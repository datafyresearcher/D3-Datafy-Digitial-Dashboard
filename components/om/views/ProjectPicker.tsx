"use client";

import type { User } from "@/lib/auth";
import { type Project, visibleProjects } from "@/lib/om";

/**
 * Shared project selector dropdown for module views that operate on a
 * single active project. Falls back to the first visible project.
 */
export function ProjectPicker({
  user,
  projects,
  value,
  onChange,
}: {
  user: User;
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
}) {
  // visibleProjects is role-aware; recompute here so the picker is current.
  const list = visibleProjects(user);
  void projects;
  const current = list.find((p) => p.id === value) ?? list[0];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Project</span>
      <select
        value={current?.id ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-brand-500 focus:outline-none [&>option]:bg-ink-800"
      >
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
