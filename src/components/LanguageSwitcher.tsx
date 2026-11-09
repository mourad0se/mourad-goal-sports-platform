"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const next = locale === "ar" ? "en" : "ar";
  return (
    <button
      onClick={() => setLocale(next)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition-colors hover:border-pitch-500/60 hover:text-pitch-400"
      aria-label={next === "en" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages size={15} />
      {next === "en" ? "EN" : "عربي"}
    </button>
  );
}
