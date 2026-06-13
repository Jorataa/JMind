"use client";

import { useEffect, useState } from "react";

export type ThemeId = "default" | "smiski";

export const THEMES: { id: ThemeId; label: string; description: string }[] = [
  { id: "default", label: "Default", description: "Dark zinc workspace" },
  { id: "smiski", label: "Smiski", description: "Soft sage green, cozy glow" },
];

export const THEME_STORAGE_KEY = "jmind:theme";

function applyTheme(theme: ThemeId) {
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "default";
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "smiski" ? "smiski" : "default";
    } catch {
      return "default";
    }
  });

  // Sync theme attribute to <html> whenever theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const changeTheme = (next: ThemeId) => {
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
  };

  return { theme, themes: THEMES, changeTheme };
}
