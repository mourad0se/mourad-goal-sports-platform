import { cookies } from "next/headers";
import { ar } from "./ar";
import { en, type Dictionary } from "./en";
import { LOCALE_COOKIE } from "./cookie";

export type Locale = "ar" | "en";
export type { Dictionary };
export { LOCALE_COOKIE };
export const DEFAULT_LOCALE: Locale = "ar";

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ar" || value === "en";
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Server-side locale resolution (cookie first, Arabic default). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDict(locale: Locale): Dictionary {
  return dictionaries[locale];
}
