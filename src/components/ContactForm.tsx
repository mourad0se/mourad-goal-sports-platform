"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

export function ContactForm({ contactEmail }: { contactEmail: string | null }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("failed");
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="surface rounded-3xl p-6 sm:p-8">
      {state === "sent" ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pitch-500/15 text-pitch-400">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg font-extrabold text-white">{t.contact.successTitle}</p>
          <p className="max-w-sm text-sm text-mist">{t.contact.successBody}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-mist">{t.contact.name}</span>
              <input name="name" required minLength={2} maxLength={140} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-mist">{t.contact.email}</span>
              <input name="email" type="email" required maxLength={190} className="field" dir="ltr" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-mist">{t.contact.subject}</span>
            <input name="subject" required minLength={2} maxLength={200} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-mist">{t.contact.message}</span>
            <textarea name="message" required minLength={10} maxLength={4000} rows={6} className="field resize-y" />
          </label>

          {state === "error" && <p className="text-sm font-semibold text-live">{t.contact.errorBody}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-pitch-400">
                <Mail size={14} />
                <span dir="ltr">{contactEmail}</span>
              </a>
            )}
            <button type="submit" disabled={state === "sending"} className="btn-primary ms-auto text-sm">
              {state === "sending" ? <Loader2 size={15} className="animate-spin-slow" /> : <Send size={15} />}
              {state === "sending" ? t.contact.sending : t.contact.send}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
