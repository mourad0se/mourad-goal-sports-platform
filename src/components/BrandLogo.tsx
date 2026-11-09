"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleProvider";

/** Custom Mourad Goal brand mark — SVG, not a stock icon. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mg-badge" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#16C784" />
          <stop offset="100%" stopColor="#0a5c3e" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#mg-badge)" />
      <rect width="48" height="48" rx="13" fill="black" opacity="0.14" />
      {/* stylized pitch + ball */}
      <circle cx="24" cy="24" r="12.5" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.92" />
      <path
        d="M24 17.6l5.34 3.88-2.04 6.28h-6.6l-2.04-6.28L24 17.6z"
        fill="#fff"
        opacity="0.95"
      />
      <path d="M24 11.5v6.1M31.6 17l-3 2.4M33.9 27.4l-4.6-.4M19 31.6l1.66-3.84M14.1 27.4l4.6-.4M16.4 17l3 2.4" stroke="#fff" strokeWidth="1.7" opacity="0.75" />
    </svg>
  );
}

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { t, locale } = useI18n();
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label={t.brand.name}>
      <BrandMark size={compact ? 34 : 40} />
      <span className="leading-none">
        <span className={`block font-black tracking-tight text-white ${compact ? "text-base" : "text-lg"}`}>
          {locale === "ar" ? "مراد" : "MOURAD"}
          <span className="text-pitch-400"> {locale === "ar" ? "جول" : "GOAL"}</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-mist/80">
            {locale === "ar" ? "بث مباشر • أخبار" : "LIVE • NEWS"}
          </span>
        )}
      </span>
    </Link>
  );
}
