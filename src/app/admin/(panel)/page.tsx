"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Inbox,
  Newspaper,
  Radio,
  RadioTower,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/admin/ui";
import { formatDateTime, formatTime } from "@/lib/utils";

type StatsResponse = {
  stats: Record<string, number>;
  recentActivity: { id: number; action: string; entity: string; entityId: string | null; userEmail: string | null; createdAt: string }[];
  recentMessages: { id: number; name: string; subject: string; createdAt: string }[];
  recentMatches: { id: number; kickoffAt: string; status: string; homeScore: number | null; awayScore: number | null }[];
};

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent?: "live" }) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-mist">{label}</span>
        <span className={accent === "live" ? "text-live" : "text-pitch-400"}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const s = data?.stats;

  return (
    <div>
      <PageHeader title={t.admin.overview.title} subtitle={t.admin.overview.subtitle} />

      {!data ? (
        <p className="text-sm text-mist">{t.admin.common.loadingData}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Trophy} label={t.admin.overview.totalMatches} value={s!.totalMatches} />
            <StatCard icon={Radio} label={t.admin.overview.liveMatches} value={s!.liveMatches} accent="live" />
            <StatCard icon={CalendarClock} label={t.admin.overview.upcomingMatches} value={s!.upcomingMatches} />
            <StatCard icon={CheckCircle2} label={t.admin.overview.finishedMatches} value={s!.finishedMatches} />
            <StatCard icon={Newspaper} label={t.admin.overview.publishedNews} value={s!.publishedNews} />
            <StatCard icon={RadioTower} label={t.admin.overview.activeStreams} value={s!.activeStreams} />
            <StatCard icon={Users} label={t.admin.overview.adminUsers} value={s!.adminUsers} />
            <StatCard icon={Inbox} label={t.admin.overview.contactMessages} value={s!.contactMessages} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="surface rounded-2xl p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-white">
                <Activity size={15} className="text-pitch-400" />
                {t.admin.overview.recentActivity}
              </h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-mist">{t.admin.overview.empty}</p>
              ) : (
                <ul className="space-y-2.5 text-xs">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0">
                      <span className="min-w-0 truncate text-mist">
                        <span className="font-bold text-white">{a.action}</span> · {a.entity}
                        {a.entityId ? ` #${a.entityId}` : ""} · {a.userEmail ?? "—"}
                      </span>
                      <time className="shrink-0 text-mist/60">{formatTime(a.createdAt, locale)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="surface rounded-2xl p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-white">
                <Inbox size={15} className="text-pitch-400" />
                {t.admin.overview.contactMessages}
              </h2>
              {data.recentMessages.length === 0 ? (
                <p className="text-sm text-mist">{t.admin.messages.empty}</p>
              ) : (
                <ul className="space-y-2.5 text-xs">
                  {data.recentMessages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0">
                      <span className="min-w-0 truncate text-mist">
                        <span className="font-bold text-white">{m.name}</span> — {m.subject}
                      </span>
                      <time className="shrink-0 text-mist/60">{formatDateTime(m.createdAt, locale)}</time>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/messages" className="mt-4 inline-block text-xs font-bold text-pitch-400 hover:underline">
                {t.common.viewAll} →
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
