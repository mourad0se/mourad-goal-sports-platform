"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Save, Signal, SignalZero, SignalMedium } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { ConfirmDelete, Labeled, Modal, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { formatDateTime, toInputDateTime } from "@/lib/utils";
import type { MatchDTO } from "@/lib/queries";

type StreamRow = {
  id: number;
  matchId: number;
  label: string;
  type: "hls" | "mp4" | "embed";
  url: string;
  priority: number;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  health: "unknown" | "online" | "offline";
  unavailableMessageAr: string | null;
  unavailableMessageEn: string | null;
  match: { id: number; homeNameAr: string; homeNameEn: string; awayNameAr: string; awayNameEn: string; kickoffAt: string };
};

type FormState = {
  id?: number;
  matchId: string;
  label: string;
  type: "hls" | "mp4" | "embed";
  url: string;
  priority: string;
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  unavailableMessageAr: string;
  unavailableMessageEn: string;
};

const emptyForm: FormState = {
  matchId: "",
  label: "Main",
  type: "hls",
  url: "",
  priority: "0",
  enabled: true,
  startsAt: "",
  endsAt: "",
  unavailableMessageAr: "",
  unavailableMessageEn: "",
};

export default function AdminStreamsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<StreamRow[]>([]);
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        fetch("/api/admin/streams").then((r) => r.json()),
        fetch("/api/admin/matches").then((r) => r.json()),
      ]);
      setRows(s.streams ?? []);
      setMatches(m.matches ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const matchOptions = useMemo(
    () =>
      matches.map((m) => ({
        id: m.id,
        label:
          locale === "ar"
            ? `${m.home.nameAr} × ${m.away.nameAr}`
            : `${m.home.nameEn} × ${m.away.nameEn}`,
      })),
    [matches, locale],
  );

  function openNew() {
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(s: StreamRow) {
    setForm({
      id: s.id,
      matchId: String(s.matchId),
      label: s.label,
      type: s.type,
      url: s.url,
      priority: String(s.priority),
      enabled: s.enabled,
      startsAt: toInputDateTime(s.startsAt),
      endsAt: toInputDateTime(s.endsAt),
      unavailableMessageAr: s.unavailableMessageAr ?? "",
      unavailableMessageEn: s.unavailableMessageEn ?? "",
    });
    setModal(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const payload = {
      matchId: Number(form.matchId),
      label: form.label,
      type: form.type,
      url: form.url,
      priority: Number(form.priority) || 0,
      enabled: form.enabled,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      unavailableMessageAr: form.unavailableMessageAr || null,
      unavailableMessageEn: form.unavailableMessageEn || null,
    };
    try {
      const res = await fetch(form.id ? `/api/admin/streams/${form.id}` : "/api/admin/streams", {
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
      const res = await fetch(`/api/admin/streams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.deleted });
      await load();
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(s: StreamRow) {
    await fetch(`/api/admin/streams/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    await load();
  }

  async function checkHealth(id: number) {
    setCheckingId(id);
    try {
      await fetch(`/api/admin/streams/${id}/check`);
      await load();
    } finally {
      setCheckingId(null);
    }
  }

  const healthBadge = (h: StreamRow["health"]) => {
    if (h === "online")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-pitch-400">
          <Signal size={13} /> {t.admin.streams.online}
        </span>
      );
    if (h === "offline")
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-live">
          <SignalZero size={13} /> {t.admin.streams.offline}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-mist/70">
        <SignalMedium size={13} /> {t.admin.streams.unknownHealth}
      </span>
    );
  };

  return (
    <div>
      <PageHeader
        title={t.admin.streams.title}
        subtitle={t.admin.streams.subtitle}
        action={
          <div className="flex gap-2">
            <button onClick={() => void load()} className="btn-ghost px-3.5 py-2 text-xs" aria-label="refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={openNew} className="btn-primary px-4 py-2 text-xs">
              <Plus size={14} />
              {t.admin.streams.new}
            </button>
          </div>
        }
      />

      {/* Direct broadcast workflow explainer */}
      <div className="surface mb-6 flex items-start gap-3 rounded-2xl p-5">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
          <RadioTowerIcon />
        </span>
        <div>
          <p className="text-sm font-extrabold text-white">{t.admin.streams.ingestTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-mist">{t.admin.streams.ingestBody}</p>
        </div>
      </div>

      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[11px] uppercase tracking-wider text-mist/70">
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.match}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.label}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.type}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.url}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.enabled}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.streams.health}</th>
              <th className="px-4 py-3 text-end font-bold">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mist">
                  {t.admin.common.loadingData}
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="max-w-[190px] truncate text-xs font-bold text-white">
                      {locale === "ar" ? `${s.match.homeNameAr} × ${s.match.awayNameAr}` : `${s.match.homeNameEn} × ${s.match.awayNameEn}`}
                    </p>
                    <p className="text-[11px] text-mist/70">{formatDateTime(s.match.kickoffAt, locale)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-white">{s.label}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-white/8 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-mist">
                      {s.type}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-xs text-mist" dir="ltr">
                    {s.url}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={s.enabled} onChange={() => void toggleEnabled(s)} label="" />
                  </td>
                  <td className="px-4 py-3">{healthBadge(s.health)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => void checkHealth(s.id)}
                        disabled={checkingId === s.id}
                        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist transition-colors hover:border-pitch-500/50 hover:text-pitch-400 disabled:opacity-50"
                      >
                        {checkingId === s.id ? t.admin.streams.checking : t.admin.streams.check}
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist transition-colors hover:border-pitch-500/50 hover:text-pitch-400"
                      >
                        <Pencil size={13} />
                        {t.common.edit}
                      </button>
                      <ConfirmDelete busy={busy} onConfirm={() => void remove(s.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? t.admin.streams.edit : t.admin.streams.new} wide>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Labeled label={t.admin.streams.match}>
              <select
                className="field"
                value={form.matchId}
                onChange={(e) => setForm((f) => ({ ...f, matchId: e.target.value }))}
                required
              >
                <option value="">{t.admin.common.selectPlaceholder}</option>
                {matchOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>

          <Labeled label={t.admin.streams.label}>
            <input
              className="field"
              value={form.label}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
          </Labeled>

          <Labeled label={t.admin.streams.type}>
            <select
              className="field"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))}
            >
              <option value="hls">HLS (.m3u8)</option>
              <option value="mp4">MP4</option>
              <option value="embed">Embed (iframe)</option>
            </select>
          </Labeled>

          <div className="sm:col-span-2">
            <Labeled label={t.admin.streams.url}>
              <input
                className="field"
                dir="ltr"
                placeholder="https://…/stream.m3u8"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                required
              />
            </Labeled>
          </div>

          <Labeled label={t.admin.streams.priority}>
            <input
              type="number"
              min={0}
              max={1000}
              className="field"
              dir="ltr"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            />
          </Labeled>

          <div className="flex items-end pb-1">
            <Toggle checked={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} label={t.admin.streams.enabled} />
          </div>

          <Labeled label={t.admin.streams.startsAt}>
            <input
              type="datetime-local"
              className="field"
              dir="ltr"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </Labeled>
          <Labeled label={t.admin.streams.endsAt}>
            <input
              type="datetime-local"
              className="field"
              dir="ltr"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </Labeled>

          <Labeled label={t.admin.streams.unavailableAr}>
            <input
              className="field"
              dir="rtl"
              maxLength={500}
              value={form.unavailableMessageAr}
              onChange={(e) => setForm((f) => ({ ...f, unavailableMessageAr: e.target.value }))}
            />
          </Labeled>
          <Labeled label={t.admin.streams.unavailableEn}>
            <input
              className="field"
              dir="ltr"
              maxLength={500}
              value={form.unavailableMessageEn}
              onChange={(e) => setForm((f) => ({ ...f, unavailableMessageEn: e.target.value }))}
            />
          </Labeled>

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

function RadioTowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  );
}
