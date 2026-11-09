import { CalendarDays } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getTodayMatches } from "@/lib/queries";
import { TodayExplorer } from "@/components/TodayExplorer";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const matches = await getTodayMatches();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
          <CalendarDays size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t.todayPage.title}</h1>
          <p className="mt-1 text-sm text-mist">{t.todayPage.subtitle}</p>
        </div>
      </div>

      <TodayExplorer matches={matches} variant="page" />
    </div>
  );
}
