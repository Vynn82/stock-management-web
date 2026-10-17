"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

export type ThemeName = "light" | "dark";
export type ThemeMode = ThemeName | "system";

type ThemeContextValue = { theme: ThemeName; mode: ThemeMode; setTheme: (t: ThemeMode) => void };
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setTheme] = useState<ThemeMode>("light");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");

    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sf-theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        setTheme(stored);
      }
    } catch (error) {
      console.error("Unable to read the saved theme preference.", error);
    } finally {
      setPreferencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    try {
      localStorage.setItem("sf-theme", mode);
    } catch (error) {
      console.error("Unable to save the theme preference.", error);
    }
  }, [mode, preferencesLoaded]);

  const theme = mode === "system" ? systemTheme : mode;

  const tokenOverrides = {
    colorPrimary: theme === "dark" ? "#8b5cf6" : "#6d28d9",
    borderRadius: 8,
    fontFamily: "Inter, sans-serif",
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme }}>
      <ConfigProvider theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: tokenOverrides,
      }}>
        <div className={`theme-${theme}`}>{children}</div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
