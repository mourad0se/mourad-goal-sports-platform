"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import type { MatchDTO } from "@/lib/queries";
import type { Locale } from "@/lib/i18n";

type Tab = "all" | "live" | "scheduled" | "finished";

function teamNames(m: MatchDTO, locale: Locale) {
  return locale === "ar" ? `${m.home.nameAr} ${m.away.nameAr}` : `${m.home.nameEn} ${m.away.nameEn}`;
}

export function TodayExplorer({ matches, variant = "page" }: { matches: MatchDTO[]; variant?: "home" | "page" }) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("all");
  const [compId, setCompId] = useState<string>("all");
  const [q, setQ] = useState("");

  const competitions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string; country: string | null }>();
    for (const m of matches) {
      if (!map.has(m.competition.id)) {
        map.set(m.competition.id, {
          id: m.competition.id,
          name: locale === "ar" ? m.competition.nameAr : m.competition.nameEn,
          color: m.competition.color,
          country: m.competition.country,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [matches, locale]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return matches.filter((m) => {
      if (tab !== "all") {
        if (tab === "live" && m.status !== "live") return false;
        if (tab === "scheduled" && m.status !== "scheduled" && m.status !== "postponed") return false;
        if (tab === "finished" && m.status !== "finished") return false;
      }
      if (compId !== "all" && m.competition.id !== Number(compId)) return false;
      if (term) {
        const hay = `${teamNames(m, "ar")} ${teamNames(m, "en")} ${m.competition.nameAr} ${m.competition.nameEn}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [matches, tab, compId, q]);

  const groups = useMemo(() => {
    const map = new Map<number, { comp: MatchDTO["competition"]; list: MatchDTO[] }>();
    for (const m of filtered) {
      const g = map.get(m.competition.id) ?? { comp: m.competition, list: [] };
      g.list.push(m);
      map.set(m.competition.id, g);
    }
    return [...map.values()].sort((a, b) =>
      (locale === "ar" ? a.comp.nameAr : a.comp.nameEn).localeCompare(locale === "ar" ? b.comp.nameAr : b.comp.nameEn),
    );
  }, [filtered, locale]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: t.todayPage.filterAll },
    { key: "live", label: t.todayPage.filterLive },
    { key: "scheduled", label: t.todayPage.filterUpcoming },
    { key: "finished", label: t.todayPage.filterFinished },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        {tabs.map(({ key, label }) => (
          <button key={key} data-active={tab === key} onClick={() => setTab(key)} className="chip">
            {label}
            {key === "live" && matches.some((m) => m.status === "live") && <span className="live-dot" />}
          </button>
        ))}

        {variant === "page" && competitions.length > 1 && (
          <select value={compId} onChange={(e) => setCompId(e.target.value)} className="field w-auto py-2 text-xs font-bold">
            <option value="all">{t.todayPage.allCompetitions}</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="relative ms-auto w-full sm:w-60">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-mist/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.todayPage.searchPlaceholder}
            className="field py-2 ps-8 text-xs"
          />
        </div>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <EmptyState title={t.todayPage.noMatchesTitle} hint={t.todayPage.noMatchesHint} />
      ) : (
        <div className="space-y-8">
          {groups.map(({ comp, list }) => (
            <div key={comp.id}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: comp.color }} />
                <h3 className="text-sm font-extrabold text-white">
                  {locale === "ar" ? comp.nameAr : comp.nameEn}
                </h3>
                {comp.country && <span className="text-[11px] font-semibold text-mist/70">· {comp.country}</span>}
                <span className="ms-auto text-[11px] font-bold text-mist/60">
                  {list.length} {t.todayPage.matchesCount}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
