import { create } from "zustand";

export type Locale = "en" | "km";

const STORAGE_KEY = "sf-locale";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Reads the saved language in the browser (kept out of the first render so server and client HTML match). */
  hydrate: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* storage can be blocked; the choice still applies for this visit */
    }
    set({ locale });
  },
  hydrate: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "km") set({ locale: saved });
    } catch {
      /* ignore */
    }
  },
}));
