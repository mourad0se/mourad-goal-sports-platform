# Mourad Goal — مراد جول

A professional, bilingual (Arabic RTL / English LTR) **sports live-streaming and news platform**.
Discover fixtures, watch **authorized** live streams (HLS/MP4/embeds), follow today's matches and
results, and publish sports journalism — all managed from a secure admin dashboard.

> Built as a production-oriented personal project and a portfolio piece for full-stack interviews.

---

## 1. Architecture (Phase 1 — approved design)

The brief referenced MERN (MongoDB/Express/React). This implementation uses the same concepts on an
integrated, production-grade stack — one deployable unit, one type system end-to-end:

| Brief (MERN)              | This project (equivalent)                                     |
| ------------------------- | ------------------------------------------------------------- |
| React + React Router      | Next.js 16 App Router (React 19, file-based routing)          |
| Express REST controllers  | Next.js Route Handlers under `src/app/api/**`                 |
| Mongoose models           | Drizzle ORM schema (`src/db/schema.ts`) + PostgreSQL          |
| Context API               | `LocaleProvider` context + server components                  |
| CSS3 design system        | Tailwind CSS 4 tokens in `globals.css` (brand palette)        |
| JWT + bcrypt middleware   | `jose` JWT (httpOnly cookie) + `bcryptjs` + server guards     |
| Mongoose validation       | Zod schemas (`src/lib/validations.ts`) on every mutation      |

```
src/
├── app/
│   ├── layout.tsx              # html[lang/dir], fonts, LocaleProvider (Arabic default)
│   ├── (site)/                 # Public site: layout (Navbar/Footer) + pages
│   │   ├── page.tsx            # Homepage: hero, live, today, other sports, news
│   │   ├── live|today|news|contact/…
│   │   └── matches/[id]/       # Match center: video, ad gate, details, related
│   ├── admin/
│   │   ├── login/              # Public sign-in screen
│   │   └── (panel)/            # Server-guarded dashboard (layout redirects if no JWT)
│   │       ├── page.tsx        # Overview stats + audit trail
│   │       ├── matches|streams|news|ads|settings|messages/
│   └── api/                    # REST: auth, matches, news, contact, admin/*
├── components/                 # VideoPlayer(hls.js), AdGate, MatchCard, Hero, Navbar…
├── db/                         # Drizzle schema + seed
└── lib/                        # auth, i18n dicts (ar/en), queries/DTOs, zod, rate-limit, audit
```

## 2. Features

- **Bilingual**: Arabic is the default; full RTL layout; language switcher persists via cookie.
- **Homepage**: hero with featured match, live-now grid, today's explorer (status tabs + competition
  filter + search), other-sports events (basketball/tennis/boxing), latest news.
- **Match center** (`/matches/[id]`): teams, score, status, kickoff, venue, video player, related
  matches & news.
- **Streaming**: custom **hls.js** player (play/pause, volume, fullscreen, loading/error/retry,
  LIVE chip), multiple prioritized sources per match, availability windows, custom "unavailable"
  messages, MP4 and approved-iframe embed support.
- **Direct broadcast workflow**: OBS → managed RTMP provider → paste the generated HLS URL in the
  dashboard (no home-grown transcoding, per the brief).
- **Pre-roll ads**: countdown, configurable skip delay, ad-blocker bait check with a configurable
  fallback policy (allow/ask-to-disable — never traps the visitor), optional VAST tag field.
- **Admin dashboard** (`/admin`): JWT-protected; overview stats, match CRUD (+scores/status/featured),
  stream CRUD (+server-side health probe), news CRUD, ad settings, site settings, contact inbox.
- **News**: original articles with images, categories, source attribution, slugs.

## 3. Database models (Drizzle)

`users` (role: admin/editor), `sports`, `competitions`, `teams`, `matches` (status enum, scores,
featured), `streams` (type hls/mp4/embed, priority, enabled, availability window, health),
`news_articles` (slug, bilingual fields, category enum, source attribution), `ad_settings`
(singleton), `site_settings` (singleton), `audit_logs`, `contact_messages`.
All tables carry validation constraints and `createdAt/updatedAt` timestamps; matches are indexed by
kickoff and status.

## 4. Security strategy

- JWT in **httpOnly, SameSite=Lax** cookie (12h), verified server-side on **every** admin API route
  *and* the dashboard layout — frontend checks are never trusted alone.
- Passwords hashed with **bcrypt(12)**; login is rate-limited (5/5min/IP) with audit logging of
  failures.
- **Zod** validation on all mutations; parameterized queries via Drizzle (no raw SQL injection path).
- Security headers + pragmatic CSP in `next.config.ts` (`media-src`/`frame-src` allow HTTPS so
  licensed providers work; `frame-ancestors` restricted via X-Frame-Options).
- Stream URLs are only served for enabled/available sources; embed iframes are sandboxed.
- Admin health checks probe streams **server-side** (no URL leakage of admin endpoints, 6s timeout).
- `.env` holds `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_*` — never committed to public repos.

**Honest limitations (for the security section of any review):** the in-memory rate limiter is
per-process (use Redis at scale); no client-side technique can fully stop ad blockers (hence the
fallback policy); add CSRF tokens if cookies are ever used cross-site (not needed with SameSite=Lax
+ JSON APIs); plan dependency audits (`npm audit`) and secret rotation. No system is unhackable —
the design assumes layered defenses and continuous maintenance.

## 5. API (REST)

Public: `GET /api/matches?scope=today|live` · `GET /api/matches?q=` · `GET /api/news?category=`
· `POST /api/contact`
Auth: `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
Admin (JWT): `GET /api/admin/stats` · `GET /api/admin/taxonomy`
· `GET|POST /api/admin/matches` · `PATCH|DELETE /api/admin/matches/:id`
· `GET|POST /api/admin/streams` · `PATCH|DELETE /api/admin/streams/:id` · `GET /api/admin/streams/:id/check`
· `GET|POST /api/admin/news` · `PATCH|DELETE /api/admin/news/:id`
· `GET|PATCH /api/admin/ads` · `GET|PATCH /api/admin/settings` · `GET /api/admin/messages`

## 6. Getting started

```bash
npm install
cp .env.example .env        # or use the values below
npx drizzle-kit push        # create tables
npx tsx src/db/seed.ts      # demo data + admin account
npm run dev                 # http://localhost:3000
```

**Environment variables**

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AUTH_SECRET=<64-char random hex>          # required in production
ADMIN_EMAIL=admin@mourad-goal.com         # used once by the seed
ADMIN_PASSWORD=<strong password>           # used once by the seed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> The seed creates **admin@mourad-goal.com / (ADMIN_PASSWORD)** — change it immediately after the
> first login on any real deployment.

## 7. Demo streams & content policy

Seeded streams are openly-licensed test endpoints (Mux/Apple HLS samples, Blender Foundation
"Tears of Steel"). Replace them only with streams you **own or are licensed to broadcast**. The
platform is deliberately built so unauthorized sources are never required for a full demo.

## 8. Suggested commit plan (meaningful, non-fabricated)

1. `chore: scaffold next.js + drizzle foundation`
2. `feat(db): schema for sports, matches, streams, news, settings`
3. `feat(i18n): arabic/english dictionaries with RTL support`
4. `feat(ui): brand design system, navbar, hero, match cards`
5. `feat(streams): hls.js player, ad gate, watch section`
6. `feat(api): auth + public feeds`
7. `feat(admin): guarded dashboard with CRUD modules`
8. `feat(seed): bilingual demo data`
9. `docs: architecture, api and security notes`

## 9. Roadmap (next iterations)

- OAuth-free password change flow + multiple admins UI · Redis rate limiting · VAST/VPAID player
  integration against a real approved ad network · external news API ingestion (e.g., NewsData.io,
  attributing sources) · WebSocket/score polling for auto-refreshing live scores · image upload
  storage (S3) for news and team crests · e2e tests (Playwright) · Docker compose + CI deploy
  (Vercel/Railway + managed Postgres).

## Credits

Photography: Pexels contributors (linked in seed data). Icons: Lucide (`lucide-react`). Demo video:
Blender Foundation / Mux / Apple public test streams.
