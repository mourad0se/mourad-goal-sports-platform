"use client";

import { useMemo, useState } from "react";
import { Info, RadioTower } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { AdGate, type AdConfig } from "@/components/AdGate";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { MatchDTO, StreamDTO } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Watch block for the match page: ad gate + player + source switcher. */
export function WatchSection({ match, adConfig }: { match: MatchDTO; adConfig: AdConfig }) {
  const { t, locale } = useI18n();
  const streams = useMemo(
    () => (match.streams ?? []).filter((s) => s.available),
    [match.streams],
  );
  const [activeId, setActiveId] = useState<number | null>(streams[0]?.id ?? null);
  const active: StreamDTO | undefined = streams.find((s) => s.id === activeId) ?? streams[0];

  // Custom unavailability message from any configured-but-disabled stream.
  const unavailableMsg = useMemo(() => {
    const withMsg = (match.streams ?? []).find(
      (s) => !s.available && (s.unavailableMessageAr || s.unavailableMessageEn),
    );
    if (!withMsg) return null;
    return locale === "ar"
      ? withMsg.unavailableMessageAr ?? withMsg.unavailableMessageEn
      : withMsg.unavailableMessageEn ?? withMsg.unavailableMessageAr;
  }, [match.streams, locale]);

  if (streams.length === 0 || !active) {
    return (
      <div id="watch" className="surface flex scroll-mt-24 flex-col items-center gap-3 rounded-2xl px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-mist">
          <RadioTower size={24} />
        </span>
        <p className="text-lg font-extrabold text-white">{t.matchPage.noStreamTitle}</p>
        <p className="max-w-md text-sm leading-relaxed text-mist">{unavailableMsg ?? t.matchPage.noStreamBody}</p>
      </div>
    );
  }

  return (
    <div id="watch" className="scroll-mt-24 space-y-4">
      {streams.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-mist">{t.matchPage.selectSource}:</span>
          {streams.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              data-active={s.id === active.id}
              className={cn("chip", s.id === active.id && "text-pitch-400")}
              data-active2=""
            >
              {s.label || `${t.matchPage.source} ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {active.type === "embed" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <iframe
            key={active.id}
            src={active.url}
            className="aspect-video w-full bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            referrerPolicy="no-referrer"
            title={active.label}
          />
        </div>
      ) : (
        <AdGate key={active.id} config={adConfig}>
          <VideoPlayer url={active.url} type={active.type} isLive={match.status === "live"} />
        </AdGate>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-mist/70">
        <Info size={12} />
        {t.footer.disclaimer}
      </p>
    </div>
  );
}
