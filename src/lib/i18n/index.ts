"use client";

import { useCallback } from "react";
import { en, type MessageKey } from "./messages/en";
import { km } from "./messages/km";
import { useLocaleStore, type Locale } from "./locale-store";

export type { MessageKey, Locale };
export { useLocaleStore };

type Vars = Record<string, string | number>;

const dictionaries: Record<Locale, Record<string, string>> = { en, km };

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  return fill(dictionaries[locale][key] ?? en[key] ?? key, vars);
}

/**
 * Translation function for components: `const t = useT(); t("nav.dashboard")`.
 * `{name}` placeholders are filled from `vars`: `t("stock.count", { n: 5 })`.
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale]);
}

/**
 * For values that come from the API (a status, a role...). Looks up `prefix.value`
 * and falls back to the original text when there is no translation.
 */
export function useTx() {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback(
    (prefix: string, value: string) => {
      const key = `${prefix}.${value}`;
      return dictionaries[locale][key] ?? value;
    },
    [locale],
  );
}

export function useLocale() {
  return useLocaleStore((s) => s.locale);
}
