"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { Labeled, Notice, PageHeader } from "@/components/admin/ui";

type SettingsState = {
  siteNameAr: string;
  siteNameEn: string;
  taglineAr: string;
  taglineEn: string;
  defaultLocale: "ar" | "en";
  contactEmail: string;
  twitterUrl: string;
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
};

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const [state, setState] = useState<SettingsState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        setState({
          siteNameAr: s.siteNameAr,
          siteNameEn: s.siteNameEn,
          taglineAr: s.taglineAr ?? "",
          taglineEn: s.taglineEn ?? "",
          defaultLocale: s.defaultLocale === "en" ? "en" : "ar",
          contactEmail: s.contactEmail ?? "",
          twitterUrl: s.twitterUrl ?? "",
          youtubeUrl: s.youtubeUrl ?? "",
          facebookUrl: s.facebookUrl ?? "",
          instagramUrl: s.instagramUrl ?? "",
        });
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!state) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          taglineAr: state.taglineAr || null,
          taglineEn: state.taglineEn || null,
          contactEmail: state.contactEmail || null,
          twitterUrl: state.twitterUrl || null,
          youtubeUrl: state.youtubeUrl || null,
          facebookUrl: state.facebookUrl || null,
          instagramUrl: state.instagramUrl || null,
        }),
      });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.saved });
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div>
        <PageHeader title={t.admin.settings.title} subtitle={t.admin.settings.subtitle} />
        <p className="flex items-center gap-2 text-sm text-mist">
          <Loader2 size={14} className="animate-spin-slow" /> {t.admin.common.loadingData}
        </p>
      </div>
    );
  }

  const urlField = (key: "twitterUrl" | "youtubeUrl" | "facebookUrl" | "instagramUrl", label: string) => (
    <Labeled label={label}>
      <input
        className="field"
        dir="ltr"
        placeholder="https://…"
        value={state[key]}
        onChange={(e) => setState((s) => s && { ...s, [key]: e.target.value })}
      />
    </Labeled>
  );

  return (
    <div>
      <PageHeader title={t.admin.settings.title} subtitle={t.admin.settings.subtitle} />
      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <form onSubmit={submit} className="max-w-2xl space-y-6">
        <section className="surface grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
          <Labeled label={t.admin.settings.siteNameAr}>
            <input className="field" dir="rtl" maxLength={120} value={state.siteNameAr} onChange={(e) => setState((s) => s && { ...s, siteNameAr: e.target.value })} required />
          </Labeled>
          <Labeled label={t.admin.settings.siteNameEn}>
            <input className="field" dir="ltr" maxLength={120} value={state.siteNameEn} onChange={(e) => setState((s) => s && { ...s, siteNameEn: e.target.value })} required />
          </Labeled>
          <Labeled label={t.admin.settings.taglineAr}>
            <input className="field" dir="rtl" maxLength={240} value={state.taglineAr} onChange={(e) => setState((s) => s && { ...s, taglineAr: e.target.value })} />
          </Labeled>
          <Labeled label={t.admin.settings.taglineEn}>
            <input className="field" dir="ltr" maxLength={240} value={state.taglineEn} onChange={(e) => setState((s) => s && { ...s, taglineEn: e.target.value })} />
          </Labeled>
          <Labeled label={t.admin.settings.defaultLocale}>
            <select className="field" value={state.defaultLocale} onChange={(e) => setState((s) => s && { ...s, defaultLocale: e.target.value as "ar" | "en" })}>
              <option value="ar">العربية (RTL)</option>
              <option value="en">English (LTR)</option>
            </select>
          </Labeled>
          <Labeled label={t.admin.settings.contactEmail}>
            <input type="email" className="field" dir="ltr" value={state.contactEmail} onChange={(e) => setState((s) => s && { ...s, contactEmail: e.target.value })} />
          </Labeled>
        </section>

        <section className="surface grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
          <h2 className="text-sm font-extrabold text-white sm:col-span-2">{t.admin.settings.social}</h2>
          {urlField("twitterUrl", t.admin.settings.twitter)}
          {urlField("youtubeUrl", t.admin.settings.youtube)}
          {urlField("facebookUrl", t.admin.settings.facebook)}
          {urlField("instagramUrl", t.admin.settings.instagram)}
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary text-xs">
            <Save size={14} />
            {busy ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>
    </div>
  );
}
