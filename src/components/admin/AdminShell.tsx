"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  RadioTower,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/LocaleProvider";
import { BrandMark } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

type AdminUser = { name: string; email: string; role: string };

export function AdminShell({ user, children }: { user: AdminUser; children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: t.admin.nav.dashboard },
    { href: "/admin/matches", icon: Trophy, label: t.admin.nav.matches },
    { href: "/admin/streams", icon: RadioTower, label: t.admin.nav.streams },
    { href: "/admin/news", icon: Newspaper, label: t.admin.nav.news },
    { href: "/admin/ads", icon: Megaphone, label: t.admin.nav.ads },
    { href: "/admin/messages", icon: Inbox, label: t.admin.nav.messages },
    { href: "/admin/settings", icon: Settings, label: t.admin.nav.settings },
  ];

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 border-b border-white/8 px-5">
        <BrandMark size={34} />
        <div className="leading-tight">
          <p className="text-sm font-black text-white">{t.brand.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-pitch-400/90">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, icon: Icon, label }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                active ? "bg-pitch-500/14 text-pitch-400 ring-1 ring-pitch-500/30" : "text-mist hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={17} strokeWidth={2.2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/8 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-mist transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} />
          {t.admin.nav.viewSite}
        </Link>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-mist transition-colors hover:bg-live/10 hover:text-live"
        >
          {loggingOut ? <Loader2 size={16} className="animate-spin-slow" /> : <LogOut size={16} />}
          {t.admin.nav.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-white/8 bg-navy-900/70 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="close" />
          <aside className="absolute inset-y-0 start-0 w-72 border-e border-white/8 bg-navy-900">{sidebar}</aside>
        </div>
      )}

      <div className="lg:ps-64">
        {/* Topbar */}
        <div className="glass-nav sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="ms-auto flex items-center gap-3">
            <div className="hidden text-end sm:block">
              <p className="text-sm font-extrabold text-white">{user.name}</p>
              <p className="text-[11px] font-semibold text-mist/70">{user.email}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pitch-500 to-pitch-600 text-sm font-black text-navy-950">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
