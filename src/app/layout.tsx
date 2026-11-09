import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { dirOf, getDict, getLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

const latin = Space_Grotesk({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mourad Goal | مراد جول — بث مباشر مرخّص وأخبار رياضية",
    template: "%s | Mourad Goal",
  },
  description:
    "Mourad Goal — a professional platform to discover fixtures, watch authorized live streams and read the latest sports news in Arabic and English.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const dir = dirOf(locale);
  return (
    <html lang={locale} dir={dir} className={`${latin.variable} ${arabic.variable}`} suppressHydrationWarning>
      <body className="bg-navy-950 text-ink antialiased">
        <LocaleProvider locale={locale} dir={dir} dict={getDict(locale)}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
