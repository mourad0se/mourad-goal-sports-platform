"use client";

import { useEffect, useState } from "react";
import { Loader2, MailOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";

type Message = { id: number; name: string; email: string; subject: string; message: string; createdAt: string };

export default function AdminMessagesPage() {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => setMessages([]));
  }, []);

  return (
    <div>
      <PageHeader title={t.admin.messages.title} subtitle={t.admin.messages.subtitle} />
      {!messages ? (
        <p className="flex items-center gap-2 text-sm text-mist">
          <Loader2 size={14} className="animate-spin-slow" /> {t.admin.common.loadingData}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-mist">{t.admin.messages.empty}</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <article key={m.id} className="surface rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-white">{m.subject}</p>
                <time className="text-[11px] font-semibold text-mist/60">{formatDateTime(m.createdAt, locale)}</time>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-pitch-400">
                <MailOpen size={12} />
                {t.admin.messages.from}: {m.name} · <span dir="ltr">{m.email}</span>
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
