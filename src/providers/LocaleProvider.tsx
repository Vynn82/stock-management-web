"use client";

import { useEffect } from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import kmKH from "antd/locale/km_KH";
import { useLocaleStore } from "@/lib/i18n/locale-store";

const KHMER_FONT = '"Kantumruy Pro", "Noto Sans Khmer", Inter, sans-serif';

/** Applies the chosen language: <html lang>, Khmer font and the antd component texts (pagination, empty states...). */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const hydrate = useLocaleStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <ConfigProvider locale={locale === "km" ? kmKH : enUS} theme={locale === "km" ? { token: { fontFamily: KHMER_FONT } } : undefined}>
      {children}
    </ConfigProvider>
  );
}
