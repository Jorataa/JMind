"use client";

import { useEffect, useState } from "react";

export type ThemeId = "default" | "ocean" | "violet" | "rose" | "amber";

// `accent` is the swatch colour shown in the Settings picker (the 500 brand
// shade of each ramp). The CSS in globals.css owns the actual palette.
export const THEMES: { id: ThemeId; label: string; description: string; accent: string }[] = [
  { id: "default", label: "Emerald", description: "Fresh green", accent: "#1e9b68" },
  { id: "ocean", label: "Ocean", description: "Calm blue", accent: "#2278b5" },
  { id: "violet", label: "Violet", description: "Bold purple", accent: "#7a5bc7" },
  { id: "rose", label: "Rose", description: "Warm rose", accent: "#c25573" },
  { id: "amber", label: "Amber", description: "Golden glow", accent: "#c97f2e" },
];

export const THEME_STORAGE_KEY = "jmind:theme";

const THEME_IDS = THEMES.map((t) => t.id);

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEME_IDS as string[]).includes(value);
}

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
      return isThemeId(saved) ? saved : "default";
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
