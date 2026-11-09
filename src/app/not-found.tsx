"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
        <Compass size={28} />
      </span>
      <h1 className="text-3xl font-black text-white">{t.notFound.title}</h1>
      <p className="max-w-sm text-sm text-mist">{t.notFound.body}</p>
      <Link href="/" className="btn-primary mt-2 text-sm">
        {t.notFound.backHome}
      </Link>
    </div>
  );
}
