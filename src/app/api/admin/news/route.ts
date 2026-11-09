import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { newsArticles } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { newsSchema, parseBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const rows = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(200);
  return NextResponse.json({
    articles: rows.map((r) => ({
      ...r,
      publishedAt: r.publishedAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const parsed = parseBody(newsSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;

  try {
    const [created] = await db
      .insert(newsArticles)
      .values({
        slug: d.slug,
        titleAr: d.titleAr,
        titleEn: d.titleEn,
        excerptAr: d.excerptAr ?? null,
        excerptEn: d.excerptEn ?? null,
        contentAr: d.contentAr ?? null,
        contentEn: d.contentEn ?? null,
        imageUrl: d.imageUrl ?? null,
        category: d.category,
        sourceName: d.sourceName ?? null,
        sourceUrl: d.sourceUrl ?? null,
        published: d.published ?? true,
      })
      .returning({ id: newsArticles.id });

    await logAudit({ user: session, action: "create", entity: "news", entityId: created.id, ip: clientIp(req) });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    if (String(err).includes("news_articles_slug_unique") || String(err).includes("duplicate key")) {
      return jsonError(409, "slug_taken");
    }
    throw err;
  }
}
