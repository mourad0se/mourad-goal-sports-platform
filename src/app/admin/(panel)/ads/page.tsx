"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { Labeled, Notice, PageHeader, Toggle } from "@/components/admin/ui";

type AdsState = {
  enabled: boolean;
  demoDurationSec: number;
  skipAfterSec: number;
  vastTagUrl: string;
  fallbackPolicy: "allow" | "block";
};

export default function AdminAdsPage() {
  const { t } = useI18n();
  const [state, setState] = useState<AdsState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((d) =>
        setState({
          enabled: d.settings.enabled,
          demoDurationSec: d.settings.demoDurationSec,
          skipAfterSec: d.settings.skipAfterSec,
          vastTagUrl: d.settings.vastTagUrl ?? "",
          fallbackPolicy: d.settings.fallbackPolicy === "block" ? "block" : "allow",
        }),
      )
      .catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, vastTagUrl: state.vastTagUrl || null }),
      });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.saved });
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t.admin.ads.title} subtitle={t.admin.ads.subtitle} />
      {notice && <Notice kind={notice.kind} text={notice.text} />}

      {!state ? (
        <p className="flex items-center gap-2 text-sm text-mist">
          <Loader2 size={14} className="animate-spin-slow" /> {t.admin.common.loadingData}
        </p>
      ) : (
        <form onSubmit={submit} className="surface max-w-2xl space-y-6 rounded-2xl p-6">
          <Toggle checked={state.enabled} onChange={(v) => setState((s) => s && { ...s, enabled: v })} label={t.admin.ads.enabled} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label={t.admin.ads.duration}>
              <input
                type="number"
                min={3}
                max={60}
                className="field"
                dir="ltr"
                value={state.demoDurationSec}
                onChange={(e) => setState((s) => s && { ...s, demoDurationSec: Number(e.target.value) })}
              />
            </Labeled>
            <Labeled label={t.admin.ads.skipAfter}>
              <input
                type="number"
                min={0}
                max={60}
                className="field"
                dir="ltr"
                value={state.skipAfterSec}
                onChange={(e) => setState((s) => s && { ...s, skipAfterSec: Number(e.target.value) })}
              />
            </Labeled>
          </div>

          <Labeled label={t.admin.ads.vastTag}>
            <input
              className="field"
              dir="ltr"
              placeholder="https://provider.example/vast/tag.xml"
              value={state.vastTagUrl}
              onChange={(e) => setState((s) => s && { ...s, vastTagUrl: e.target.value })}
            />
          </Labeled>

          <Labeled label={t.admin.ads.fallback}>
            <select
              className="field"
              value={state.fallbackPolicy}
              onChange={(e) => setState((s) => s && { ...s, fallbackPolicy: e.target.value as "allow" | "block" })}
            >
              <option value="allow">{t.admin.ads.fallbackAllow}</option>
              <option value="block">{t.admin.ads.fallbackBlock}</option>
            </select>
          </Labeled>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/8 p-4 text-xs leading-relaxed text-amber-200/90">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              {t.admin.ads.note} {t.admin.ads.demoMode}
            </span>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={busy} className="btn-primary text-xs">
              <Save size={14} />
              {busy ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
