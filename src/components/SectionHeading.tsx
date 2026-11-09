"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function SectionHeading({
  icon,
  title,
  subtitle,
  href,
  viewAll,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  viewAll?: string;
}) {
  const { dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-mist">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-pitch-400 transition-colors hover:text-pitch-500"
        >
          {viewAll}
          <Arrow size={16} className="transition-transform group-hover:-translate-x-0.5 rtl:rotate-0" />
        </Link>
      )}
    </div>
  );
}
