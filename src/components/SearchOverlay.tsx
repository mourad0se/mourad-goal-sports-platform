"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { MatchCard } from "@/components/MatchCard";
import type { MatchDTO } from "@/lib/queries";

export function SearchOverlay() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQ("");
  }, [open]);

  const runSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?q=${encodeURIComponent(term.trim())}`);
      const data = await res.json();
      setResults(data.matches ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void runSearch(q), 280);
    return () => clearTimeout(handle);
  }, [q, runSearch]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white transition-colors hover:border-pitch-500/60 hover:text-pitch-400"
        aria-label={t.nav.search}
      >
        <Search size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
          <button
            aria-label={t.common.close}
            className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="surface relative w-full max-w-2xl animate-fade-up rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/8 pb-4">
              <Search size={18} className="shrink-0 text-pitch-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-mist/50"
              />
              {loading ? (
                <Loader2 size={18} className="animate-spin-slow text-pitch-400" />
              ) : (
                <button onClick={() => setOpen(false)} aria-label={t.common.close} className="text-mist hover:text-white">
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pe-1">
              {q.trim().length < 2 ? (
                <p className="py-8 text-center text-sm text-mist">{t.search.hint}</p>
              ) : results.length === 0 && !loading ? (
                <p className="py-8 text-center text-sm text-mist">{t.common.noResults}</p>
              ) : (
                results.map((m) => (
                  <div key={m.id} onClick={() => setOpen(false)}>
                    <MatchCard match={m} compact />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
