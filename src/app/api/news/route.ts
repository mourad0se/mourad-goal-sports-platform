import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { newsArticles } from "@/db/schema";

/** Public news feed: GET /api/news?limit=12&category=transfers */
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 12) || 12, 50);
  const category = req.nextUrl.searchParams.get("category");

  const cond =
    category && ["football", "international", "transfers", "competitions", "events"].includes(category)
      ? and(eq(newsArticles.published, true), eq(newsArticles.category, category as never))
      : eq(newsArticles.published, true);

  const rows = await db
    .select({
      id: newsArticles.id,
      slug: newsArticles.slug,
      titleAr: newsArticles.titleAr,
      titleEn: newsArticles.titleEn,
      excerptAr: newsArticles.excerptAr,
      excerptEn: newsArticles.excerptEn,
      imageUrl: newsArticles.imageUrl,
      category: newsArticles.category,
      sourceName: newsArticles.sourceName,
      sourceUrl: newsArticles.sourceUrl,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .where(cond)
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);

  return NextResponse.json({
    articles: rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() })),
  });
}
