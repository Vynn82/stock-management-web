import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "stockflow_theme";

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize theme from localStorage or system preference if available
  let initialTheme: ThemeMode = "light";
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark") {
      initialTheme = saved;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initialTheme = "dark";
    }
    document.documentElement.setAttribute("data-theme", initialTheme);
  }

  return {
    theme: initialTheme,
    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === "light" ? "dark" : "light";
        if (typeof window !== "undefined") {
          localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          document.documentElement.setAttribute("data-theme", nextTheme);
        }
        return { theme: nextTheme };
      });
    },
    setTheme: (theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.documentElement.setAttribute("data-theme", theme);
      }
      set({ theme });
    },
  };
});
