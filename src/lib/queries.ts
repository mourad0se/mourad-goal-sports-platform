import { and, desc, eq, gte, ilike, inArray, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  adSettings,
  competitions,
  matches,
  newsArticles,
  siteSettings,
  sports,
  streams,
  teams,
  type MatchStatus,
  type StreamType,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Public DTOs (serialized for client components)                     */
/* ------------------------------------------------------------------ */
export type TeamDTO = {
  id: number;
  nameAr: string;
  nameEn: string;
  shortCode: string;
  color: string;
  country: string | null;
};
export type CompetitionDTO = {
  id: number;
  nameAr: string;
  nameEn: string;
  country: string | null;
  color: string;
};
export type SportDTO = { id: number; slug: string; nameAr: string; nameEn: string; icon: string };
export type StreamDTO = {
  id: number;
  label: string;
  type: StreamType;
  url: string;
  priority: number;
  enabled: boolean;
  available: boolean;
  health: string;
  unavailableMessageAr: string | null;
  unavailableMessageEn: string | null;
};
export type MatchDTO = {
  id: number;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  featured: boolean;
  home: TeamDTO;
  away: TeamDTO;
  competition: CompetitionDTO;
  sport: SportDTO;
  hasStream: boolean;
  streams?: StreamDTO[];
};
export type NewsDTO = {
  id: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  contentAr: string | null;
  contentEn: string | null;
  imageUrl: string | null;
  category: string;
  sourceName: string | null;
  sourceUrl: string | null;
  published: boolean;
  publishedAt: string;
};
export type { MatchStatus };

const awayTeams = alias(teams, "away_teams");

type MatchRow = {
  match: typeof matches.$inferSelect;
  home: typeof teams.$inferSelect;
  away: typeof teams.$inferSelect;
  competition: typeof competitions.$inferSelect;
  sport: typeof sports.$inferSelect;
};

function streamAvailable(s: typeof streams.$inferSelect, now: Date): boolean {
  if (!s.enabled) return false;
  if (s.startsAt && s.startsAt > now) return false;
  if (s.endsAt && s.endsAt < now) return false;
  return true;
}

function toMatchDTO(
  row: MatchRow,
  streamRows: (typeof streams.$inferSelect)[],
  withStreams: boolean,
): MatchDTO {
  const now = new Date();
  const dtos: StreamDTO[] = [...streamRows]
    .sort((a, b) => a.priority - b.priority)
    .map((s) => ({
      id: s.id,
      label: s.label,
      type: s.type,
      url: s.url,
      priority: s.priority,
      enabled: s.enabled,
      available: streamAvailable(s, now),
      health: s.health,
      unavailableMessageAr: s.unavailableMessageAr,
      unavailableMessageEn: s.unavailableMessageEn,
    }));
  return {
    id: row.match.id,
    kickoffAt: row.match.kickoffAt.toISOString(),
    status: row.match.status,
    homeScore: row.match.homeScore,
    awayScore: row.match.awayScore,
    venue: row.match.venue,
    descriptionAr: row.match.descriptionAr,
    descriptionEn: row.match.descriptionEn,
    featured: row.match.featured,
    home: {
      id: row.home.id,
      nameAr: row.home.nameAr,
      nameEn: row.home.nameEn,
      shortCode: row.home.shortCode,
      color: row.home.color,
      country: row.home.country,
    },
    away: {
      id: row.away.id,
      nameAr: row.away.nameAr,
      nameEn: row.away.nameEn,
      shortCode: row.away.shortCode,
      color: row.away.color,
      country: row.away.country,
    },
    competition: {
      id: row.competition.id,
      nameAr: row.competition.nameAr,
      nameEn: row.competition.nameEn,
      country: row.competition.country,
      color: row.competition.color,
    },
    sport: row.sport,
    hasStream: dtos.some((s) => s.available),
    ...(withStreams ? { streams: dtos } : {}),
  };
}

async function fetchMatchRows(
  where: SQL | undefined,
  mode: "asc" | "desc",
  limit: number,
): Promise<MatchRow[]> {
  return db
    .select({ match: matches, home: teams, away: awayTeams, competition: competitions, sport: sports })
    .from(matches)
    .innerJoin(teams, eq(matches.homeTeamId, teams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .innerJoin(competitions, eq(matches.competitionId, competitions.id))
    .innerJoin(sports, eq(matches.sportId, sports.id))
    .where(where)
    .orderBy(mode === "asc" ? matches.kickoffAt : desc(matches.kickoffAt))
    .limit(limit);
}

async function attachStreams(rows: MatchRow[], withStreams: boolean): Promise<MatchDTO[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.match.id);
  const streamRows = await db.select().from(streams).where(inArray(streams.matchId, ids));
  const byMatch = new Map<number, (typeof streams.$inferSelect)[]>();
  for (const s of streamRows) {
    const list = byMatch.get(s.matchId) ?? [];
    list.push(s);
    byMatch.set(s.matchId, list);
  }
  return rows.map((r) => toMatchDTO(r, byMatch.get(r.match.id) ?? [], withStreams));
}

function todayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/* ------------------------------------------------------------------ */
/* Public queries                                                     */
/* ------------------------------------------------------------------ */
export async function getLiveMatches(limit = 12): Promise<MatchDTO[]> {
  const rows = await fetchMatchRows(eq(matches.status, "live"), "asc", limit);
  return attachStreams(rows, false);
}

export async function getTodayMatches(): Promise<MatchDTO[]> {
  const { start, end } = todayRange();
  const rows = await fetchMatchRows(
    and(gte(matches.kickoffAt, start), lt(matches.kickoffAt, end)),
    "asc",
    200,
  );
  return attachStreams(rows, false);
}

export async function getOtherSportsEvents(limit = 6): Promise<MatchDTO[]> {
  const { start } = todayRange();
  const rows = await fetchMatchRows(
    and(ne(sports.slug, "football"), gte(matches.kickoffAt, start), ne(matches.status, "postponed")),
    "asc",
    limit,
  );
  return attachStreams(rows, false);
}

export async function getFeaturedMatch(): Promise<MatchDTO | null> {
  const recentPast = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const featured = await fetchMatchRows(
    and(
      eq(matches.featured, true),
      ne(matches.status, "finished"),
      ne(matches.status, "postponed"),
      gte(matches.kickoffAt, recentPast),
    ),
    "asc",
    1,
  );
  let rows = featured;
  if (rows.length === 0) rows = await fetchMatchRows(eq(matches.status, "live"), "asc", 1);
  if (rows.length === 0)
    rows = await fetchMatchRows(
      and(eq(matches.status, "scheduled"), gte(matches.kickoffAt, new Date())),
      "asc",
      1,
    );
  return (await attachStreams(rows, true))[0] ?? null;
}

export async function getMatchById(id: number): Promise<MatchDTO | null> {
  const rows = await fetchMatchRows(eq(matches.id, id), "asc", 1);
  return (await attachStreams(rows, true))[0] ?? null;
}

export async function getRelatedMatches(
  competitionId: number,
  excludeId: number,
  limit = 4,
): Promise<MatchDTO[]> {
  const rows = await fetchMatchRows(
    and(eq(matches.competitionId, competitionId), ne(matches.id, excludeId)),
    "desc",
    limit,
  );
  return attachStreams(rows, false);
}

export async function searchMatches(q: string, limit = 12): Promise<MatchDTO[]> {
  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const cond = or(
    ilike(teams.nameAr, pattern),
    ilike(teams.nameEn, pattern),
    ilike(awayTeams.nameAr, pattern),
    ilike(awayTeams.nameEn, pattern),
    ilike(competitions.nameAr, pattern),
    ilike(competitions.nameEn, pattern),
  );
  const rows = await db
    .select({ match: matches, home: teams, away: awayTeams, competition: competitions, sport: sports })
    .from(matches)
    .innerJoin(teams, eq(matches.homeTeamId, teams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .innerJoin(competitions, eq(matches.competitionId, competitions.id))
    .innerJoin(sports, eq(matches.sportId, sports.id))
    .where(cond)
    .orderBy(desc(matches.kickoffAt))
    .limit(limit);
  return attachStreams(rows, false);
}

/* ------------------------------------------------------------------ */
/* News                                                               */
/* ------------------------------------------------------------------ */
function toNewsDTO(a: typeof newsArticles.$inferSelect): NewsDTO {
  return {
    id: a.id,
    slug: a.slug,
    titleAr: a.titleAr,
    titleEn: a.titleEn,
    excerptAr: a.excerptAr,
    excerptEn: a.excerptEn,
    contentAr: a.contentAr,
    contentEn: a.contentEn,
    imageUrl: a.imageUrl,
    category: a.category,
    sourceName: a.sourceName,
    sourceUrl: a.sourceUrl,
    published: a.published,
    publishedAt: a.publishedAt.toISOString(),
  };
}

export async function getLatestNews(limit = 6): Promise<NewsDTO[]> {
  const rows = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.published, true))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return rows.map(toNewsDTO);
}

export async function getArticleBySlug(slug: string): Promise<NewsDTO | null> {
  const rows = await db
    .select()
    .from(newsArticles)
    .where(and(eq(newsArticles.slug, slug), eq(newsArticles.published, true)))
    .limit(1);
  return rows[0] ? toNewsDTO(rows[0]) : null;
}

export async function getRelatedNews(excludeId: number, limit = 3): Promise<NewsDTO[]> {
  const rows = await db
    .select()
    .from(newsArticles)
    .where(and(eq(newsArticles.published, true), ne(newsArticles.id, excludeId)))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return rows.map(toNewsDTO);
}

/* ------------------------------------------------------------------ */
/* Singletons                                                         */
/* ------------------------------------------------------------------ */
export async function getSiteSettingsRow(): Promise<typeof siteSettings.$inferSelect> {
  const rows = await db.select().from(siteSettings).limit(1);
  if (rows[0]) return rows[0];
  const inserted = await db.insert(siteSettings).values({}).returning();
  return inserted[0];
}

export async function getAdSettingsRow(): Promise<typeof adSettings.$inferSelect> {
  const rows = await db.select().from(adSettings).limit(1);
  if (rows[0]) return rows[0];
  const inserted = await db.insert(adSettings).values({}).returning();
  return inserted[0];
}

/* ------------------------------------------------------------------ */
/* Admin helpers                                                      */
/* ------------------------------------------------------------------ */
export async function getTaxonomies() {
  const [sportRows, competitionRows, teamRows] = await Promise.all([
    db.select().from(sports).orderBy(sports.sortOrder),
    db.select().from(competitions).orderBy(competitions.nameEn),
    db.select().from(teams).orderBy(teams.nameEn),
  ]);
  return { sports: sportRows, competitions: competitionRows, teams: teamRows };
}

export async function getAdminMatches(): Promise<MatchDTO[]> {
  const rows = await fetchMatchRows(sql`true`, "desc", 200);
  return attachStreams(rows, false);
}
