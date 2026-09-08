"use client";

import React, { useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useThemeStore } from "@/store/themeStore";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#7c3aed",
          borderRadius: 8,
          fontFamily: "inherit",
          colorBgContainer: isDark ? "#0f1c30" : "#f4f7fb",
          colorBgElevated: isDark ? "#0f1c30" : "#f4f7fb",
          colorBgLayout: isDark ? "#07111f" : "#d8e0ea",
          colorBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "#cbd5e1",
          colorBorderSecondary: isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "#cbd5e1",
          colorText: isDark ? "#f8fafc" : "#0f172a",
          colorTextSecondary: isDark ? "#94a3b8" : "#334155",
        },
        components: {
          Table: {
            headerBg: isDark ? "#0a1627" : "#e2e8f0",
            headerColor: isDark ? "#f8fafc" : "#0f172a",
            rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "#e8eff7",
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#cbd5e1",
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
          },
          Card: {
            colorBgContainer: isDark ? "rgba(15, 28, 48, 0.8)" : "#f4f7fb",
            colorBorderSecondary: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "#cbd5e1",
          },
          Modal: {
            contentBg: isDark ? "#0f1c30" : "#f4f7fb",
            headerBg: isDark ? "#0f1c30" : "#f4f7fb",
          },
          Input: {
            colorBgContainer: isDark ? "rgba(255, 255, 255, 0.055)" : "#ffffff",
            colorBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "#cbd5e1",
          },
          Select: {
            colorBgContainer: isDark ? "rgba(255, 255, 255, 0.055)" : "#ffffff",
            optionSelectedBg: isDark ? "rgba(124, 58, 237, 0.2)" : "#e2e8f0",
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Button: {
            colorPrimary: "#7c3aed",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
