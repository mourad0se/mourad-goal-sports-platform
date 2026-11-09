import { CalendarDays, Medal, Newspaper, Radio } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import {
  getFeaturedMatch,
  getLatestNews,
  getLiveMatches,
  getOtherSportsEvents,
  getTodayMatches,
} from "@/lib/queries";
import { Hero } from "@/components/Hero";
import { SectionHeading } from "@/components/SectionHeading";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import { TodayExplorer } from "@/components/TodayExplorer";
import { NewsExplorer } from "@/components/NewsExplorer";

const HERO_IMAGE =
  "https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDict(locale);

  const [featured, live, today, others, news] = await Promise.all([
    getFeaturedMatch(),
    getLiveMatches(9),
    getTodayMatches(),
    getOtherSportsEvents(6),
    getLatestNews(7),
  ]);

  return (
    <>
      <Hero featured={featured} image={HERO_IMAGE} />

      <div className="mx-auto max-w-7xl space-y-16 px-4 pb-8 pt-12 sm:px-6">
        {/* Live now */}
        <section aria-label={t.home.liveNow}>
          <SectionHeading
            icon={<Radio size={20} strokeWidth={2.2} />}
            title={t.home.liveNow}
            subtitle={t.home.liveSubtitle}
            href="/live"
            viewAll={t.common.viewAll}
          />
          {live.length === 0 ? (
            <EmptyState title={t.home.noLiveTitle} hint={t.home.noLiveHint} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Today */}
        <section aria-label={t.home.todayTitle}>
          <SectionHeading
            icon={<CalendarDays size={20} strokeWidth={2.2} />}
            title={t.home.todayTitle}
            subtitle={t.home.todaySubtitle}
            href="/today"
            viewAll={t.common.viewAll}
          />
          <TodayExplorer matches={today} variant="home" />
        </section>

        {/* Other sports */}
        {others.length > 0 && (
          <section aria-label={t.home.otherSportsTitle}>
            <SectionHeading icon={<Medal size={20} strokeWidth={2.2} />} title={t.home.otherSportsTitle} subtitle={t.home.otherSportsSubtitle} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}

        {/* News */}
        <section aria-label={t.home.newsTitle}>
          <SectionHeading
            icon={<Newspaper size={20} strokeWidth={2.2} />}
            title={t.home.newsTitle}
            subtitle={t.home.newsSubtitle}
            href="/news"
            viewAll={t.common.viewAll}
          />
          {news.length === 0 ? <EmptyState title={t.common.noResults} /> : <NewsExplorer articles={news} withFilters={false} />}
        </section>
      </div>
    </>
  );
}
