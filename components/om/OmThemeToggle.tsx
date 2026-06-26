"use client";

import { Moon, Sun } from "lucide-react";
import { useOmTheme } from "./OmThemeProvider";

export default function OmThemeToggle({
  showLabel = true,
  className = "",
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useOmTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-om-surface border border-om text-sm font-medium text-om-muted hover:bg-om-surface-hover hover:text-om-fg transition-all ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
      {showLabel && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}