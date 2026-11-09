import { Mail } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getSiteSettingsRow } from "@/lib/queries";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const settings = await getSiteSettingsRow().catch(() => null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch-500/12 text-pitch-400 ring-1 ring-pitch-500/30">
          <Mail size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{t.contact.title}</h1>
          <p className="mt-1 text-sm text-mist">{t.contact.subtitle}</p>
        </div>
      </div>
      <ContactForm contactEmail={settings?.contactEmail ?? null} />
    </div>
  );
}
