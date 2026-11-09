import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { getSiteSettingsRow } from "@/lib/queries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [session, settings] = await Promise.all([
    getSession(),
    getSiteSettingsRow().catch(() => null),
  ]);
  return (
    <>
      <Navbar isAdmin={!!session} />
      <main className="min-h-[70vh]">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
