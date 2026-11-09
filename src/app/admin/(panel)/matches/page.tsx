"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Save, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { ConfirmDelete, Labeled, Modal, Notice, PageHeader, Toggle } from "@/components/admin/ui";
import { TeamCrest } from "@/components/TeamCrest";
import { formatDateTime, toInputDateTime } from "@/lib/utils";
import type { MatchDTO } from "@/lib/queries";
import type { Competition, Sport, Team } from "@/db/schema";

type Taxonomy = { sports: Sport[]; competitions: Competition[]; teams: Team[] };

type FormState = {
  id?: number;
  sportId: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  status: string;
  homeScore: string;
  awayScore: string;
  venue: string;
  featured: boolean;
  descriptionAr: string;
  descriptionEn: string;
};

const emptyForm: FormState = {
  sportId: "",
  competitionId: "",
  homeTeamId: "",
  awayTeamId: "",
  kickoffAt: "",
  status: "scheduled",
  homeScore: "",
  awayScore: "",
  venue: "",
  featured: false,
  descriptionAr: "",
  descriptionEn: "",
};

export default function AdminMatchesPage() {
  const { t, locale } = useI18n();
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, tx] = await Promise.all([
        fetch("/api/admin/matches").then((r) => r.json()),
        fetch("/api/admin/taxonomy").then((r) => r.json()),
      ]);
      setMatches(m.matches ?? []);
      setTax(tx);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredComps = useMemo(
    () => tax?.competitions.filter((c) => c.sportId === Number(form.sportId)) ?? [],
    [tax, form.sportId],
  );

  function openNew() {
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(m: MatchDTO) {
    setForm({
      id: m.id,
      sportId: String(m.sport.id),
      competitionId: String(m.competition.id),
      homeTeamId: String(m.home.id),
      awayTeamId: String(m.away.id),
      kickoffAt: toInputDateTime(m.kickoffAt),
      status: m.status,
      homeScore: m.homeScore == null ? "" : String(m.homeScore),
      awayScore: m.awayScore == null ? "" : String(m.awayScore),
      venue: m.venue ?? "",
      featured: m.featured,
      descriptionAr: m.descriptionAr ?? "",
      descriptionEn: m.descriptionEn ?? "",
    });
    setModal(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const payload = {
      sportId: Number(form.sportId),
      competitionId: Number(form.competitionId),
      homeTeamId: Number(form.homeTeamId),
      awayTeamId: Number(form.awayTeamId),
      kickoffAt: new Date(form.kickoffAt).toISOString(),
      status: form.status,
      homeScore: form.homeScore === "" ? null : Number(form.homeScore),
      awayScore: form.awayScore === "" ? null : Number(form.awayScore),
      venue: form.venue || null,
      featured: form.featured,
      descriptionAr: form.descriptionAr || null,
      descriptionEn: form.descriptionEn || null,
    };
    try {
      const res = await fetch(form.id ? `/api/admin/matches/${form.id}` : "/api/admin/matches", {
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
      const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setNotice({ kind: "ok", text: t.admin.common.deleted });
      await load();
    } catch {
      setNotice({ kind: "err", text: t.admin.common.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t.admin.matches.title}
        subtitle={t.admin.matches.subtitle}
        action={
          <div className="flex gap-2">
            <button onClick={() => void load()} className="btn-ghost px-3.5 py-2 text-xs" aria-label="refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={openNew} className="btn-primary px-4 py-2 text-xs">
              <Plus size={14} />
              {t.admin.matches.new}
            </button>
          </div>
        }
      />

      {notice && <Notice kind={notice.kind} text={notice.text} />}

      <div className="surface overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[760px] text-start text-sm">
          <thead>
            <tr className="border-b border-white/8 text-start text-[11px] uppercase tracking-wider text-mist/70">
              <th className="px-4 py-3 text-start font-bold">{t.admin.matches.title}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.matches.competition}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.matches.kickoff}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.matches.status}</th>
              <th className="px-4 py-3 text-start font-bold">{t.admin.matches.score}</th>
              <th className="px-4 py-3 text-end font-bold">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mist">
                  {t.admin.common.loadingData}
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-bold text-white">
                      {m.featured && <Star size={13} className="shrink-0 fill-amber-300 text-amber-300" />}
                      <TeamCrest code={m.home.shortCode} color={m.home.color} size={26} />
                      <span className="max-w-[110px] truncate">{locale === "ar" ? m.home.nameAr : m.home.nameEn}</span>
                      <span className="text-mist/50">×</span>
                      <TeamCrest code={m.away.shortCode} color={m.away.color} size={26} />
                      <span className="max-w-[110px] truncate">{locale === "ar" ? m.away.nameAr : m.away.nameEn}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-mist">{locale === "ar" ? m.competition.nameAr : m.competition.nameEn}</td>
                  <td className="px-4 py-3 text-xs text-mist">{formatDateTime(m.kickoffAt, locale)}</td>
                  <td className="px-4 py-3 text-xs font-bold">
                    <span
                      className={
                        m.status === "live" ? "text-live" : m.status === "finished" ? "text-mist" : "text-pitch-400"
                      }
                    >
                      {t.status[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-extrabold text-white">
                    {m.homeScore != null && m.awayScore != null ? `${m.homeScore} - ${m.awayScore}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(m)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist transition-colors hover:border-pitch-500/50 hover:text-pitch-400"
                      >
                        <Pencil size={13} />
                        {t.common.edit}
                      </button>
                      <ConfirmDelete busy={busy} onConfirm={() => void remove(m.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? t.admin.matches.edit : t.admin.matches.new} wide>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Labeled label={t.admin.matches.sport}>
            <select
              className="field"
              value={form.sportId}
              onChange={(e) => setForm((f) => ({ ...f, sportId: e.target.value, competitionId: "" }))}
              required
            >
              <option value="">{t.admin.common.selectPlaceholder}</option>
              {tax?.sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === "ar" ? s.nameAr : s.nameEn}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.matches.competition}>
            <select
              className="field"
              value={form.competitionId}
              onChange={(e) => setForm((f) => ({ ...f, competitionId: e.target.value }))}
              required
            >
              <option value="">{t.admin.common.selectPlaceholder}</option>
              {filteredComps.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.matches.homeTeam}>
            <select
              className="field"
              value={form.homeTeamId}
              onChange={(e) => setForm((f) => ({ ...f, homeTeamId: e.target.value }))}
              required
            >
              <option value="">{t.admin.common.selectPlaceholder}</option>
              {tax?.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {locale === "ar" ? team.nameAr : team.nameEn}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.matches.awayTeam}>
            <select
              className="field"
              value={form.awayTeamId}
              onChange={(e) => setForm((f) => ({ ...f, awayTeamId: e.target.value }))}
              required
            >
              <option value="">{t.admin.common.selectPlaceholder}</option>
              {tax?.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {locale === "ar" ? team.nameAr : team.nameEn}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.matches.kickoff}>
            <input
              type="datetime-local"
              className="field"
              dir="ltr"
              value={form.kickoffAt}
              onChange={(e) => setForm((f) => ({ ...f, kickoffAt: e.target.value }))}
              required
            />
          </Labeled>

          <Labeled label={t.admin.matches.status}>
            <select
              className="field"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {(["scheduled", "live", "finished", "postponed"] as const).map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
          </Labeled>

          <Labeled label={t.admin.matches.homeScore}>
            <input
              type="number"
              min={0}
              max={99}
              className="field"
              dir="ltr"
              value={form.homeScore}
              onChange={(e) => setForm((f) => ({ ...f, homeScore: e.target.value }))}
            />
          </Labeled>

          <Labeled label={t.admin.matches.awayScore}>
            <input
              type="number"
              min={0}
              max={99}
              className="field"
              dir="ltr"
              value={form.awayScore}
              onChange={(e) => setForm((f) => ({ ...f, awayScore: e.target.value }))}
            />
          </Labeled>

          <Labeled label={t.admin.matches.venue}>
            <input
              className="field"
              value={form.venue}
              maxLength={160}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            />
          </Labeled>

          <div className="flex items-end pb-1">
            <Toggle
              checked={form.featured}
              onChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              label={t.admin.matches.featured}
            />
          </div>

          <div className="sm:col-span-2">
            <Labeled label={t.admin.matches.descriptionAr}>
              <textarea
                className="field resize-y"
                rows={2}
                dir="rtl"
                value={form.descriptionAr}
                onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
              />
            </Labeled>
          </div>
          <div className="sm:col-span-2">
            <Labeled label={t.admin.matches.descriptionEn}>
              <textarea
                className="field resize-y"
                rows={2}
                dir="ltr"
                value={form.descriptionEn}
                onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
              />
            </Labeled>
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
