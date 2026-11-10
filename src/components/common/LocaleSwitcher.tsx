"use client";

import { useLocaleStore, type Locale } from "@/lib/i18n/locale-store";
import { useT } from "@/lib/i18n";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "km", label: "ខ្មែរ" },
];

/** Small EN | ខ្មែរ toggle for the header. */
export default function LocaleSwitcher() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();
  return (
    <div className="locale-switch" role="group" aria-label={t("common.language")}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={locale === option.value ? "active" : ""}
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
