import { NextResponse } from "next/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, contactMessages, matches, newsArticles, streams, users } from "@/db/schema";
import { requireAdminApi } from "@/lib/api";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const scalar = async (q: Promise<{ count: number }[]>) => (await q)[0]?.count ?? 0;

  const [
    totalMatches,
    liveMatches,
    upcomingMatches,
    finishedMatches,
    publishedNews,
    activeStreams,
    adminUsers,
    messageCount,
  ] = await Promise.all([
    scalar(db.select({ count: count() }).from(matches)),
    scalar(db.select({ count: count() }).from(matches).where(eq(matches.status, "live"))),
    scalar(db.select({ count: count() }).from(matches).where(eq(matches.status, "scheduled"))),
    scalar(db.select({ count: count() }).from(matches).where(eq(matches.status, "finished"))),
    scalar(
      db
        .select({ count: count() })
        .from(newsArticles)
        .where(eq(newsArticles.published, true)),
    ),
    scalar(db.select({ count: count() }).from(streams).where(eq(streams.enabled, true))),
    scalar(db.select({ count: count() }).from(users)),
    scalar(db.select({ count: count() }).from(contactMessages)),
  ]);

  const recentActivity = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  const recentMessages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(5);

  const upcomingList = await db
    .select({
      id: matches.id,
      kickoffAt: matches.kickoffAt,
      status: matches.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      updatedAt: matches.updatedAt,
    })
    .from(matches)
    .orderBy(desc(matches.updatedAt))
    .limit(6);

  return NextResponse.json({
    stats: {
      totalMatches,
      liveMatches,
      upcomingMatches,
      finishedMatches,
      publishedNews,
      activeStreams,
      adminUsers,
      contactMessages: messageCount,
    },
    recentActivity: recentActivity.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    recentMessages: recentMessages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    recentMatches: upcomingList.map((m) => ({
      ...m,
      kickoffAt: m.kickoffAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  });
}
