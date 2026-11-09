"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  Mail,
  Menu,
  Newspaper,
  Radio,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";

export function Navbar({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/live", label: t.nav.live, icon: Radio },
    { href: "/today", label: t.nav.today, icon: CalendarDays },
    { href: "/news", label: t.nav.news, icon: Newspaper },
    { href: "/contact", label: t.nav.contact, icon: Mail },
  ];

  return (
    <header className={cn("glass-nav sticky top-0 z-50 transition-shadow", scrolled && "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]")}>
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandLogo />

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13.5px] font-bold transition-colors",
                    active ? "text-pitch-400" : "text-mist hover:text-white",
                  )}
                >
                  <Icon size={15} strokeWidth={2.4} />
                  {label}
                  {active && (
                    <span className="absolute inset-x-3.5 -bottom-[13px] h-[2.5px] rounded-full bg-gradient-to-l from-pitch-500 to-pitch-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <SearchOverlay />
          <LanguageSwitcher />
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-lg border border-pitch-500/40 bg-pitch-500/10 px-3 py-2 text-xs font-bold text-pitch-400 transition-colors hover:bg-pitch-500/20 sm:inline-flex"
            >
              <LayoutDashboard size={14} />
              {t.nav.dashboard}
            </Link>
          )}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-t border-white/8 bg-navy-950/95 px-4 pb-5 pt-3 backdrop-blur-xl lg:hidden">
          <ul className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold",
                      active ? "bg-pitch-500/12 text-pitch-400" : "text-mist hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon size={17} strokeWidth={2.2} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
