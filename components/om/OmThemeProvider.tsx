"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type OmTheme = "dark" | "light";

const STORAGE_KEY = "gridsentinel-portal-theme";

type OmThemeContextValue = {
  theme: OmTheme;
  setTheme: (theme: OmTheme) => void;
  toggleTheme: () => void;
};

const OmThemeContext = createContext<OmThemeContextValue | null>(null);

export function useOmTheme() {
  const ctx = useContext(OmThemeContext);
  if (!ctx) throw new Error("useOmTheme must be used within OmThemeProvider");
  return ctx;
}

export default function OmThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<OmTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setThemeState(stored);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: OmTheme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  if (!ready) {
    return <div className="om-portal min-h-screen om-bg" data-om-theme="dark" />;
  }

  return (
    <OmThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className="om-portal min-h-screen om-bg text-om-fg" data-om-theme={theme}>
        {children}
      </div>
    </OmThemeContext.Provider>
  );
}