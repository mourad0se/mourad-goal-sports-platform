"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { ConfirmDelete, Labeled, Modal, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { formatDateTime, slugify } from "@/lib/utils";
import type { NewsDTO } from "@/lib/queries";

type FormState = {
  id?: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  imageUrl: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  published: boolean;
};

const emptyForm: FormState = {
  slug: "",
  titleAr: "",
  titleEn: "",
  excerptAr: "",
  excerptEn: "",
  contentAr: "",
  contentEn: "",
  imageUrl: "",
  category: "football",
  sourceName: "",
  sourceUrl: "",
  published: true,
};

const CATEGORIES = ["football", "international", "transfers", "competitions", "events"] as const;

export default function AdminNewsPage() {
  const { t, locale } = useI18n();
  const [articles, setArticles] = useState<(NewsDTO & { createdAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news").then((r) => r.json());
      setArticles(res.articles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(a: NewsDTO) {
    setForm({
      id: a.id,
      slug: a.slug,
      titleAr: a.titleAr,
      titleEn: a.titleEn,
      excerptAr: a.excerptAr ?? "",
      excerptEn: a.excerptEn ?? "",
      contentAr: a.contentAr ?? "",
      contentEn: a.contentEn ?? "",
      imageUrl: a.imageUrl ?? "",
      category: a.category,
      sourceName: a.sourceName ?? "",
      sourceUrl: a.sourceUrl ?? "",
      published: a.published,
    });
    setModal(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const payload = {
      slug: slugify(form.slug || form.titleEn),
      titleAr: form.titleAr,
      titleEn: form.titleEn,
      excerptAr: form.excerptAr || null,
      excerptEn: form.excerptEn || null,
      contentAr: form.contentAr || null,
      contentEn: form.contentEn || null,
      imageUrl: form.imageUrl || null,
      category: form.category,
      sourceName: form.sourceName || null,
      sourceUrl: form.sourceUrl || null,
      published: form.published,
    };
    try {
      const res = await fetch(form.id ? `/api/admin/news/${form.id}` : "/api/admin/news", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.saved });
      setModal(false);
      await load();
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.deleted });
      await load();
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(a: NewsDTO) {
    await fetch(`/api/admin/news/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    await load();
  }

  return (
    <div>
      <PageHeader
        title={t.admin.news.title}
        subtitle={t.admin.news.subtitle}
        action={
          <div className="flex gap-2">
            <button onClick={() => void load()} className="btn-ghost px-3.5 py-2 text-xs" aria-label="refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={openNew} className="btn-primary px-4 py-2 text-xs">
              <Plus size={14} />
              {t.admin.news.new}
            </button>
          </div>
        }
      />

      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-mist/70">
              <th className="px-4 py-3 text-start font-bold">{t.admin.news.titleCol}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.news.category}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.news.published}</th>
              <th className="px-4 py-3 text-start font-bold">{t.common.actions === "" ? "" : "Date"}</th>
              <th className="px-4 py-3 text-end font-bold">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-mist">
                  {t.admin.common.loadingData}
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="max-w-[260px] truncate px-4 py-3 text-xs font-bold text-white">
                    {locale === "ar" ? a.titleAr : a.titleEn}
                  </td>
                  <td className="px-4 py-3 text-xs text-mist">{t.category[a.category as keyof typeof t.category] ?? a.category}</td>
                  <td className="px-4 py-3">
                    <Toggle checked={a.published} onChange={() => void togglePublished(a)} label="" />
                  </td>
                  <td className="px-4 py-3 text-xs text-mist/70">{formatDateTime(a.publishedAt, locale)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(a)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist transition-colors hover:border-pitch-500/50 hover:text-pitch-400"
                      >
                        <Pencil size={13} />
                        {t.common.edit}
                      </button>
                      <ConfirmDelete busy={busy} onConfirm={() => void remove(a.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? t.admin.news.edit : t.admin.news.new} wide>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Labeled label={t.admin.news.titleAr}>
            <input className="field" dir="rtl" maxLength={240} value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} required />
          </Labeled>
          <Labeled label={t.admin.news.titleEn}>
            <input className="field" dir="ltr" maxLength={240} value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} required />
          </Labeled>

          <Labeled label={t.admin.news.slug}>
            <input
              className="field"
              dir="ltr"
              placeholder={slugify(form.titleEn || "my-article-slug")}
              value={form.slug}
              maxLength={220}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </Labeled>
          <Labeled label={t.admin.news.category}>
            <select className="field" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.category[c]}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.news.excerptAr}>
            <textarea className="field resize-y" dir="rtl" rows={2} maxLength={600} value={form.excerptAr} onChange={(e) => setForm((f) => ({ ...f, excerptAr: e.target.value }))} />
          </Labeled>
          <Labeled label={t.admin.news.excerptEn}>
            <textarea className="field resize-y" dir="ltr" rows={2} maxLength={600} value={form.excerptEn} onChange={(e) => setForm((f) => ({ ...f, excerptEn: e.target.value }))} />
          </Labeled>

          <Labeled label={t.admin.news.contentAr}>
            <textarea className="field resize-y" dir="rtl" rows={5} value={form.contentAr} onChange={(e) => setForm((f) => ({ ...f, contentAr: e.target.value }))} />
          </Labeled>
          <Labeled label={t.admin.news.contentEn}>
            <textarea className="field resize-y" dir="ltr" rows={5} value={form.contentEn} onChange={(e) => setForm((f) => ({ ...f, contentEn: e.target.value }))} />
          </Labeled>

          <div className="sm:col-span-2">
            <Labeled label={t.admin.news.imageUrl}>
              <input className="field" dir="ltr" placeholder="https://…" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
            </Labeled>
          </div>

          <Labeled label={t.admin.news.sourceName}>
            <input className="field" maxLength={160} value={form.sourceName} onChange={(e) => setForm((f) => ({ ...f, sourceName: e.target.value }))} />
          </Labeled>
          <Labeled label={t.admin.news.sourceUrl}>
            <input className="field" dir="ltr" placeholder="https://…" value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} />
          </Labeled>

          <div className="sm:col-span-2">
            <Toggle checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} label={t.admin.news.published} />
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost text-xs">
              {t.common.cancel}
            </button>
            <button type="submit" disabled={busy} className="btn-primary text-xs">
              <Save size={14} />
              {busy ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
