import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsArticles } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { newsSchema, parseBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = parseId((await ctx.params).id);
  if (!id) return jsonError(400, "invalid_id");

  const parsed = parseBody(newsSchema.partial(), (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;

  const update: Partial<typeof newsArticles.$inferInsert> = { updatedAt: new Date() };
  if (d.slug !== undefined) update.slug = d.slug;
  if (d.titleAr !== undefined) update.titleAr = d.titleAr;
  if (d.titleEn !== undefined) update.titleEn = d.titleEn;
  if (d.excerptAr !== undefined) update.excerptAr = d.excerptAr ?? null;
  if (d.excerptEn !== undefined) update.excerptEn = d.excerptEn ?? null;
  if (d.contentAr !== undefined) update.contentAr = d.contentAr ?? null;
  if (d.contentEn !== undefined) update.contentEn = d.contentEn ?? null;
  if (d.imageUrl !== undefined) update.imageUrl = d.imageUrl ?? null;
  if (d.category !== undefined) update.category = d.category;
  if (d.sourceName !== undefined) update.sourceName = d.sourceName ?? null;
  if (d.sourceUrl !== undefined) update.sourceUrl = d.sourceUrl ?? null;
  if (d.published !== undefined) update.published = d.published;

  try {
    const updated = await db
      .update(newsArticles)
      .set(update)
      .where(eq(newsArticles.id, id))
      .returning({ id: newsArticles.id });
    if (!updated.length) return jsonError(404, "not_found");
  } catch (err) {
    if (String(err).includes("duplicate key")) return jsonError(409, "slug_taken");
    throw err;
  }

  await logAudit({ user: session, action: "update", entity: "news", entityId: id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = parseId((await ctx.params).id);
  if (!id) return jsonError(400, "invalid_id");

  const removed = await db.delete(newsArticles).where(eq(newsArticles.id, id)).returning({ id: newsArticles.id });
  if (!removed.length) return jsonError(404, "not_found");

  await logAudit({ user: session, action: "delete", entity: "news", entityId: id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
