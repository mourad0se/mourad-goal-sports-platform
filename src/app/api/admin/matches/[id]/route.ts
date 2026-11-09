import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { matchSchema, parseBody } from "@/lib/validations";
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

  const parsed = parseBody(matchSchema.partial(), (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;
  if (d.homeTeamId && d.awayTeamId && d.homeTeamId === d.awayTeamId) return jsonError(400, "same_teams");

  const update: Partial<typeof matches.$inferInsert> = { updatedAt: new Date() };
  if (d.sportId !== undefined) update.sportId = d.sportId;
  if (d.competitionId !== undefined) update.competitionId = d.competitionId;
  if (d.homeTeamId !== undefined) update.homeTeamId = d.homeTeamId;
  if (d.awayTeamId !== undefined) update.awayTeamId = d.awayTeamId;
  if (d.status !== undefined) update.status = d.status;
  if (d.homeScore !== undefined) update.homeScore = d.homeScore;
  if (d.awayScore !== undefined) update.awayScore = d.awayScore;
  if (d.venue !== undefined) update.venue = d.venue ?? null;
  if (d.descriptionAr !== undefined) update.descriptionAr = d.descriptionAr ?? null;
  if (d.descriptionEn !== undefined) update.descriptionEn = d.descriptionEn ?? null;
  if (d.featured !== undefined) update.featured = d.featured;
  if (d.kickoffAt !== undefined) {
    const kickoff = new Date(d.kickoffAt);
    if (Number.isNaN(kickoff.getTime())) return jsonError(400, "invalid_date");
    update.kickoffAt = kickoff;
  }

  const updated = await db.update(matches).set(update).where(eq(matches.id, id)).returning({ id: matches.id });
  if (!updated.length) return jsonError(404, "not_found");

  await logAudit({ user: session, action: "update", entity: "match", entityId: id, meta: { fields: Object.keys(d) }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = parseId((await ctx.params).id);
  if (!id) return jsonError(400, "invalid_id");

  const removed = await db.delete(matches).where(eq(matches.id, id)).returning({ id: matches.id });
  if (!removed.length) return jsonError(404, "not_found");

  await logAudit({ user: session, action: "delete", entity: "match", entityId: id, ip: clientIp(_req) });
  return NextResponse.json({ ok: true });
}
