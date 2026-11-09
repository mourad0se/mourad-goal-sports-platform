"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { BrandMark } from "@/components/BrandLogo";
import { FacebookIcon, InstagramIcon, XIcon, YouTubeIcon } from "@/components/SocialIcons";
import type { SiteSettings } from "@/db/schema";

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t.nav.home },
    { href: "/live", label: t.nav.live },
    { href: "/today", label: t.nav.today },
    { href: "/news", label: t.nav.news },
    { href: "/contact", label: t.nav.contact },
  ];

  const socials = [
    { url: settings?.twitterUrl, Icon: XIcon, label: "X" },
    { url: settings?.youtubeUrl, Icon: YouTubeIcon, label: "YouTube" },
    { url: settings?.facebookUrl, Icon: FacebookIcon, label: "Facebook" },
    { url: settings?.instagramUrl, Icon: InstagramIcon, label: "Instagram" },
  ].filter((s) => s.url);

  return (
    <footer className="mt-20 border-t border-white/8 bg-navy-900/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark size={38} />
            <span className="text-lg font-black text-white">{t.footer.aboutTitle}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mist">{t.footer.aboutBody}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2.5">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-mist transition-colors hover:border-pitch-500/60 hover:text-pitch-400"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">{t.footer.quickLinks}</h3>
          <ul className="mt-4 space-y-2.5">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-mist transition-colors hover:text-pitch-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">{t.footer.sportsTitle}</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-mist">
            <li>{t.category.football}</li>
            <li>{t.category.international}</li>
            <li>{t.category.transfers}</li>
            <li>{t.category.events}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">{t.footer.contactTitle}</h3>
          <a
            href={settings?.contactEmail ? `mailto:${settings.contactEmail}` : "/contact"}
            className="mt-4 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-pitch-400"
          >
            <Mail size={15} />
            {settings?.contactEmail ?? t.nav.contact}
          </a>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-center text-xs text-mist/70 sm:px-6">
          <p>
            © {year} {t.footer.aboutTitle}. {t.footer.rights}
          </p>
          <p className="mx-auto max-w-2xl leading-relaxed">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
