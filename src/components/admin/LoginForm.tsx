"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, LogIn } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error === "too_many" ? t.auth.tooMany : json.error === "invalid_credentials" ? t.auth.invalid : t.auth.genericError);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError(t.auth.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface w-full max-w-sm space-y-4 rounded-2xl p-7">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-mist">{t.auth.email}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="field"
          dir="ltr"
          placeholder="admin@mourad-goal.com"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-mist">{t.auth.password}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="field"
          dir="ltr"
          placeholder="••••••••••"
        />
      </label>

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-live/40 bg-live/10 px-3 py-2.5 text-xs font-bold text-live">
          <LockKeyhole size={14} />
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full text-sm">
        {busy ? <Loader2 size={16} className="animate-spin-slow" /> : <LogIn size={16} />}
        {busy ? t.auth.signingIn : t.auth.signIn}
      </button>
    </form>
  );
}
