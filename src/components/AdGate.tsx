"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Megaphone, Play, ShieldAlert, TimerReset } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export type AdConfig = {
  enabled: boolean;
  durationSec: number;
  skipAfterSec: number;
  hasVast: boolean;
  fallbackPolicy: "allow" | "block";
};

type Phase = "locked" | "checking" | "ad" | "blocked" | "done";

/**
 * Pre-roll advertisement gate.
 * Honest by design: client-side detection cannot defeat every blocker,
 * so failures resolve through the admin-configured fallback policy and
 * never trap the visitor in an endless loading screen.
 */
export function AdGate({ config, children }: { config: AdConfig; children: ReactNode }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>(config.enabled ? "locked" : "done");
  const [remaining, setRemaining] = useState(config.durationSec);
  const [checks, setChecks] = useState(0);
  const baitRef = useRef<HTMLDivElement>(null);

  /** Standard bait-element probe (same family of signals blockers hide). */
  const detectBlocker = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const bait = document.createElement("div");
      bait.className = "adsbox ad-banner pub_300x250 textads";
      bait.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;";
      document.body.appendChild(bait);
      setTimeout(() => {
        const blocked =
          bait.offsetParent === null || bait.clientHeight === 0 || bait.clientWidth === 0;
        bait.remove();
        resolve(blocked);
      }, 320);
    });
  }, []);

  const startSequence = useCallback(async () => {
    setPhase("checking");
    const blocked = await detectBlocker();
    if (blocked) {
      setPhase("blocked");
      return;
    }
    setRemaining(config.durationSec);
    setPhase("ad");
  }, [config.durationSec, detectBlocker]);

  const retry = useCallback(() => {
    setChecks((c) => c + 1);
    void startSequence();
  }, [startSequence]);

  // Ad countdown ticking.
  useEffect(() => {
    if (phase !== "ad") return;
    if (remaining <= 0) {
      setPhase("done");
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, remaining]);

  if (phase === "done") return <>{children}</>;

  const elapsed = config.durationSec - remaining;
  const canSkip = elapsed >= config.skipAfterSec;
  const progress = Math.min(100, (elapsed / Math.max(config.durationSec, 1)) * 100);
  const strictBlocked = phase === "blocked" && config.fallbackPolicy === "block";
  const strictGiveUp = strictBlocked && checks >= 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-2xl">
      <div className="aspect-video w-full bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        {phase === "locked" && (
          <>
            <button
              onClick={() => void startSequence()}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-pitch-500 text-navy-950 shadow-[0_0_50px_-8px_rgba(22,199,132,0.8)] transition-transform hover:scale-105"
              aria-label={t.common.watchMatch}
            >
              <Play size={34} fill="currentColor" className="ms-1" />
            </button>
            <p className="text-sm font-semibold text-mist">{t.ads.supports}</p>
          </>
        )}

        {phase === "checking" && (
          <>
            <span className="h-9 w-9 animate-spin-slow rounded-full border-2 border-pitch-500 border-t-transparent" />
            <p className="text-sm font-semibold text-mist">{t.ads.loading}</p>
          </>
        )}

        {phase === "ad" && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white/80">
              <Megaphone size={12} />
              {t.ads.label}
            </span>
            {/* House ad creative (demo). A VAST tag from an approved provider plugs in here. */}
            <div className="w-full rounded-2xl border border-pitch-500/40 bg-gradient-to-l from-pitch-500/15 to-transparent p-6">
              <p className="text-xl font-black text-white">{t.ads.houseTitle}</p>
              <p className="mt-1.5 text-sm text-mist">{t.ads.houseBody}</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-pitch-500 transition-[width] duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                <TimerReset size={15} className="text-pitch-400" />
                {remaining}s
              </span>
              <button
                onClick={() => setPhase("done")}
                disabled={!canSkip}
                className="btn-ghost px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                {canSkip ? t.ads.skipAd : `${t.ads.skipIn} ${Math.max(config.skipAfterSec - elapsed, 0)}s`}
              </button>
            </div>
          </div>
        )}

        {phase === "blocked" && (
          <div className="flex max-w-md flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
              <ShieldAlert size={22} />
            </span>
            <p className="font-extrabold text-white">{t.ads.blockedTitle}</p>
            <p className="text-sm leading-relaxed text-mist">
              {strictBlocked && !strictGiveUp ? t.ads.blockedBodyStrict : t.ads.blockedBody}
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
              {(config.fallbackPolicy === "allow" || strictGiveUp) && (
                <button onClick={() => setPhase("done")} className="btn-primary px-4 py-2 text-xs">
                  <Play size={13} fill="currentColor" />
                  {t.ads.continue}
                </button>
              )}
              {strictBlocked && !strictGiveUp && (
                <button onClick={retry} className="btn-ghost px-4 py-2 text-xs">
                  {t.common.retry}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* hidden bait node (accessibility-safe) */}
      <div ref={baitRef} className="adsbox" aria-hidden="true" style={{ position: "absolute", left: -9999 }} />
    </div>
  );
}
