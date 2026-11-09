"use client";

import Link from "next/link";
import { Play, CalendarClock, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { StatusChip } from "@/components/Chips";
import { TeamCrest } from "@/components/TeamCrest";
import { formatTime, cn } from "@/lib/utils";
import type { MatchDTO } from "@/lib/queries";

export function MatchCard({ match, compact = false }: { match: MatchDTO; compact?: boolean }) {
  const { t, locale } = useI18n();
  const homeName = locale === "ar" ? match.home.nameAr : match.home.nameEn;
  const awayName = locale === "ar" ? match.away.nameAr : match.away.nameEn;
  const compName = locale === "ar" ? match.competition.nameAr : match.competition.nameEn;
  const scored = match.status === "live" || match.status === "finished";

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn("surface surface-hover group block rounded-2xl p-4", compact && "p-3.5")}
    >
      {/* top meta row */}
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-mist">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: match.competition.color }} />
          <span className="truncate">{compName}</span>
        </span>
        {match.status === "scheduled" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-pitch-500/30 bg-pitch-500/10 px-2 py-1 text-[11px] font-bold text-pitch-400">
            <CalendarClock size={12} />
            {formatTime(match.kickoffAt, locale)}
          </span>
        ) : (
          <StatusChip status={match.status} />
        )}
      </div>

      {/* teams row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamCrest code={match.home.shortCode} color={match.home.color} size={compact ? 40 : 48} />
          <span className="w-full truncate text-[13px] font-bold text-white">{homeName}</span>
        </div>
        <div className="px-1 text-center">
          {scored ? (
            <span className="inline-flex items-baseline gap-1.5 text-2xl font-black tracking-tight text-white">
              {match.homeScore ?? 0}
              <span className="text-mist/60">-</span>
              {match.awayScore ?? 0}
            </span>
          ) : (
            <span className="inline-block rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-mist">
              {t.common.vs}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamCrest code={match.away.shortCode} color={match.away.color} size={compact ? 40 : 48} />
          <span className="w-full truncate text-[13px] font-bold text-white">{awayName}</span>
        </div>
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-mist/80">
          {match.venue ? (
            <>
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{match.venue}</span>
            </>
          ) : (
            <span>{locale === "ar" ? match.sport.nameAr : match.sport.nameEn}</span>
          )}
        </span>
        {/* Watch button only appears when an authorized stream is available */}
        {match.hasStream && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-l from-pitch-500 to-pitch-600 px-3 py-1.5 text-[11px] font-extrabold text-navy-950 transition-transform group-hover:scale-[1.03]">
            <Play size={12} fill="currentColor" />
            {match.status === "live" ? t.common.watchLive : t.common.watchMatch}
          </span>
        )}
      </div>
    </Link>
  );
}
