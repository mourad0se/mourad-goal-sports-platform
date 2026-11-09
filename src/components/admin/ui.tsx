"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Trash2, TriangleAlert, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mist">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button aria-label="close" className="fixed inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("surface relative w-full animate-fade-up rounded-2xl p-6", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
          <h2 className="text-lg font-extrabold text-white">{title}</h2>
          <button onClick={onClose} className="text-mist hover:text-white" aria-label="close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Labeled({ label, children, dir }: { label: string; children: ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-mist">{label}</span>
      <div dir={dir}>{children}</div>
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm font-bold text-white"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-pitch-500" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
            checked ? "start-[22px]" : "start-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function Notice({ kind, text }: { kind: "ok" | "err"; text: string }) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold",
        kind === "ok"
          ? "border-pitch-500/40 bg-pitch-500/10 text-pitch-400"
          : "border-live/40 bg-live/10 text-live",
      )}
    >
      {kind === "ok" ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
      {text}
    </div>
  );
}

/** Two-step delete so a single stray click never destroys data. */
export function ConfirmDelete({ onConfirm, busy }: { onConfirm: () => void; busy: boolean }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist transition-colors hover:border-live/50 hover:text-live"
      >
        <Trash2 size={13} />
        {t.common.delete}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={onConfirm}
        disabled={busy}
        className="rounded-lg bg-live px-2.5 py-1.5 text-xs font-extrabold text-white disabled:opacity-60"
      >
        {t.common.confirm}
      </button>
      <button
        onClick={() => setArmed(false)}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-mist hover:text-white"
      >
        {t.common.cancel}
      </button>
    </span>
  );
}
