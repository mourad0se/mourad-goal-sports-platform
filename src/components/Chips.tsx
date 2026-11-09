"use client";

import { useI18n } from "@/lib/i18n/LocaleProvider";
import type { MatchStatus } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function LiveBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-live/15 px-2 py-1 text-[11px] font-extrabold tracking-wider text-live",
        className,
      )}
    >
      <span className="live-dot" />
      {t.status.live}
    </span>
  );
}

export function StatusChip({ status }: { status: MatchStatus }) {
  const { t } = useI18n();
  if (status === "live") return <LiveBadge />;
  const styles: Record<MatchStatus, string> = {
    scheduled: "bg-pitch-500/10 text-pitch-400 border-pitch-500/30",
    live: "",
    finished: "bg-white/5 text-mist border-white/10",
    postponed: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold", styles[status])}>
      {t.status[status]}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const { t } = useI18n();
  const label = (t.category as Record<string, string>)[category] ?? category;
  return (
    <span className="inline-flex items-center rounded-full border border-pitch-500/30 bg-pitch-500/10 px-2.5 py-1 text-[11px] font-bold text-pitch-400">
      {label}
    </span>
  );
}
