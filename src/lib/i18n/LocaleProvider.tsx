"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "./index";
import { LOCALE_COOKIE } from "./cookie";

type I18nContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  locale,
  dir,
  dict,
  children,
}: {
  locale: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
  children: ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // Persist the visitor's choice for one year, then re-render the app
      // from the server so html[lang/dir] and all server text switch too.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  return (
    <I18nContext.Provider value={{ locale, dir, t: dict, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LocaleProvider>");
  return ctx;
}
