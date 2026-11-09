import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { getSession } from "@/lib/auth";
import { BrandMark } from "@/components/BrandLogo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Admin — Sign in" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  const locale = await getLocale();
  const t = getDict(locale);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(22,199,132,0.12),transparent_60%)]" />
      <div className="relative mb-7 flex flex-col items-center gap-3 text-center">
        <BrandMark size={56} />
        <h1 className="text-2xl font-black text-white">{t.auth.loginTitle}</h1>
        <p className="flex items-center gap-1.5 text-sm text-mist">
          <ShieldCheck size={14} className="text-pitch-400" />
          {t.auth.loginSubtitle}
        </p>
      </div>
      <div className="relative">
        <LoginForm />
      </div>
    </div>
  );
}
