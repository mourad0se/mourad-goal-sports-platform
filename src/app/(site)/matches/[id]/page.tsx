import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Info, MapPin, Trophy } from "lucide-react";
import { dirOf, getDict, getLocale } from "@/lib/i18n";
import { getAdSettingsRow, getMatchById, getRelatedMatches, getRelatedNews } from "@/lib/queries";
import { TeamCrest } from "@/components/TeamCrest";
import { StatusChip } from "@/components/Chips";
import { WatchSection } from "@/components/WatchSection";
import { SectionHeading } from "@/components/SectionHeading";
import { MatchCard } from "@/components/MatchCard";
import { NewsCard } from "@/components/NewsCard";
import { formatDateTime, formatTime } from "@/lib/utils";
import type { AdConfig } from "@/components/AdGate";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getLocale();
  const id = Number((await params).id);
  const match = Number.isInteger(id) ? await getMatchById(id) : null;
  if (!match) return { title: "Match" };
  const home = locale === "ar" ? match.home.nameAr : match.home.nameEn;
  const away = locale === "ar" ? match.away.nameAr : match.away.nameEn;
  return { title: `${home} × ${away}` };
}

export default async function MatchPage({ params }: Props) {
  const locale = await getLocale();
  const t = getDict(locale);
  const dir = dirOf(locale);
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const match = await getMatchById(id);
  if (!match) notFound();

  const [related, relatedNews, ads] = await Promise.all([
    getRelatedMatches(match.competition.id, match.id, 4),
    getRelatedNews(match.id, 3),
    getAdSettingsRow(),
  ]);

  const adConfig: AdConfig = {
    enabled: ads.enabled,
    durationSec: ads.demoDurationSec,
    skipAfterSec: ads.skipAfterSec,
    hasVast: !!ads.vastTagUrl,
    fallbackPolicy: ads.fallbackPolicy === "block" ? "block" : "allow",
  };

  const homeName = locale === "ar" ? match.home.nameAr : match.home.nameEn;
  const awayName = locale === "ar" ? match.away.nameAr : match.away.nameEn;
  const compName = locale === "ar" ? match.competition.nameAr : match.competition.nameEn;
  const description = locale === "ar" ? match.descriptionAr : match.descriptionEn;
  const scored = match.status === "live" || match.status === "finished";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/today" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-mist transition-colors hover:text-pitch-400">
        <Arrow size={15} />
        {t.common.back}
      </Link>

      {/* Header card */}
      <header className="surface relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute -top-28 start-1/3 h-64 w-64 rounded-full bg-pitch-500/12 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-mist">
            <Trophy size={15} style={{ color: match.competition.color }} />
            {compName}
          </span>
          <StatusChip status={match.status} />
        </div>

        <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <TeamCrest code={match.home.shortCode} color={match.home.color} size={92} />
            <h1 className="text-lg font-black text-white sm:text-2xl">{homeName}</h1>
          </div>
          <div className="text-center">
            {scored ? (
              <span className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                {match.homeScore ?? 0}
                <span className="mx-2 text-mist/40">:</span>
                {match.awayScore ?? 0}
              </span>
            ) : (
              <div>
                <span className="block text-3xl font-black text-pitch-400 sm:text-4xl">
                  {formatTime(match.kickoffAt, locale)}
                </span>
                <span className="mt-1 block text-xs font-semibold text-mist">
                  {match.status === "postponed" ? t.status.postponed : t.matchPage.kickoff}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <TeamCrest code={match.away.shortCode} color={match.away.color} size={92} />
            <h2 className="text-lg font-black text-white sm:text-2xl">{awayName}</h2>
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/8 pt-5 text-xs font-semibold text-mist">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} className="text-pitch-400" />
            {formatDateTime(match.kickoffAt, locale)}
          </span>
          {match.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-pitch-400" />
              {match.venue}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Info size={13} className="text-pitch-400" />
            {locale === "ar" ? match.sport.nameAr : match.sport.nameEn}
          </span>
        </div>
      </header>

      {/* Watch */}
      <section className="mt-8" aria-label={t.matchPage.watchTheMatch}>
        <h2 className="mb-4 text-xl font-extrabold text-white">{t.matchPage.watchTheMatch}</h2>
        <WatchSection match={match} adConfig={adConfig} />
      </section>

      {/* Description */}
      {description && (
        <section className="mt-10" aria-label={t.matchPage.aboutMatch}>
          <h2 className="mb-3 text-xl font-extrabold text-white">{t.matchPage.aboutMatch}</h2>
          <div className="surface rounded-2xl p-6 leading-relaxed text-mist">{description}</div>
        </section>
      )}

      {/* Related matches */}
      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={t.matchPage.relatedMatches} href="/today" viewAll={t.common.viewAll} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((m) => (
              <MatchCard key={m.id} match={m} compact />
            ))}
          </div>
        </section>
      )}

      {/* Related news */}
      {relatedNews.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={t.matchPage.relatedNews} href="/news" viewAll={t.common.viewAll} />
          <div className="grid gap-5 md:grid-cols-3">
            {relatedNews.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
