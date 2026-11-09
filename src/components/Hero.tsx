"use client";

import Link from "next/link";
import Image from "next/image";
import { CalendarClock, ChevronDown, MonitorPlay, Play, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { TeamCrest } from "@/components/TeamCrest";
import { LiveBadge } from "@/components/Chips";
import { formatDateTime, formatTime } from "@/lib/utils";
import type { MatchDTO } from "@/lib/queries";

export function Hero({ featured, image }: { featured: MatchDTO | null; image: string }) {
  const { t, locale } = useI18n();

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/55 to-navy-950" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_20%,rgba(22,199,132,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_85%_15%,rgba(0,230,118,0.1),transparent_60%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="chip" data-active="true">
            <Trophy size={13} />
            {t.hero.badge}
          </span>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            {t.hero.welcome.split(" ").slice(0, -2).join(" ")}{" "}
            <span className="text-gradient-green">{t.hero.welcome.split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-mist sm:text-lg">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {featured?.hasStream ? (
              <Link href={`/matches/${featured.id}#watch`} className="btn-primary text-sm">
                <Play size={16} fill="currentColor" />
                {t.hero.watchNow}
              </Link>
            ) : (
              <Link href="/today" className="btn-primary text-sm">
                <CalendarClock size={16} />
                {t.nav.today}
              </Link>
            )}
            <Link href="/live" className="btn-ghost text-sm">
              <MonitorPlay size={16} />
              {t.nav.live}
            </Link>
          </div>

          <div className="mt-10 hidden justify-center lg:flex">
            <ChevronDown size={18} className="animate-bounce text-mist/50" />
          </div>
        </div>

        {/* Featured match panel */}
        {featured && (
          <div className="animate-fade-up [animation-delay:120ms]">
            <div className="surface relative overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8">
              <div className="pointer-events-none absolute -top-24 end-0 h-56 w-56 rounded-full bg-pitch-500/15 blur-3xl" />
              <div className="mb-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-mist">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: featured.competition.color }} />
                  {t.hero.featuredMatch} · {locale === "ar" ? featured.competition.nameAr : featured.competition.nameEn}
                </span>
                {featured.status === "live" && <LiveBadge />}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-3 text-center">
                  <TeamCrest code={featured.home.shortCode} color={featured.home.color} size={72} />
                  <span className="text-sm font-extrabold text-white sm:text-base">
                    {locale === "ar" ? featured.home.nameAr : featured.home.nameEn}
                  </span>
                </div>
                <div className="text-center">
                  {featured.status === "live" || featured.status === "finished" ? (
                    <span className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                      {featured.homeScore ?? 0}
                      <span className="mx-1 text-mist/50">:</span>
                      {featured.awayScore ?? 0}
                    </span>
                  ) : (
                    <div>
                      <span className="block text-2xl font-black text-pitch-400">
                        {formatTime(featured.kickoffAt, locale)}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-mist">
                        {t.hero.kickoffAt}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-3 text-center">
                  <TeamCrest code={featured.away.shortCode} color={featured.away.color} size={72} />
                  <span className="text-sm font-extrabold text-white sm:text-base">
                    {locale === "ar" ? featured.away.nameAr : featured.away.nameEn}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-center text-xs font-semibold text-mist">
                {formatDateTime(featured.kickoffAt, locale)}
                {featured.venue ? ` · ${featured.venue}` : ""}
              </p>

              <div className="mt-6 flex justify-center gap-3">
                {featured.hasStream && (
                  <Link href={`/matches/${featured.id}#watch`} className="btn-primary pitch-glow text-sm">
                    <Play size={15} fill="currentColor" />
                    {t.common.watchLive}
                  </Link>
                )}
                <Link href={`/matches/${featured.id}`} className="btn-ghost text-sm">
                  {t.hero.matchCenter}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
