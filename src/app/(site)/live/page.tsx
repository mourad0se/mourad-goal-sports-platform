import { Radio } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getLiveMatches } from "@/lib/queries";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const matches = await getLiveMatches(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-live/12 text-live ring-1 ring-live/30">
          <Radio size={22} />
          {matches.length > 0 && <span className="live-dot absolute -end-1 -top-1" />}
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t.livePage.title}</h1>
          <p className="mt-1 text-sm text-mist">{t.livePage.subtitle}</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState title={t.livePage.emptyTitle} hint={t.livePage.emptyHint} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
