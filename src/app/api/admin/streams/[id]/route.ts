import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { streams } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { parseBody, streamSchema } from "@/lib/validations";
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

  const parsed = parseBody(streamSchema.partial(), (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;

  const update: Partial<typeof streams.$inferInsert> = { updatedAt: new Date() };
  if (d.matchId !== undefined) update.matchId = d.matchId;
  if (d.label !== undefined) update.label = d.label;
  if (d.type !== undefined) update.type = d.type;
  if (d.url !== undefined) update.url = d.url;
  if (d.priority !== undefined) update.priority = d.priority;
  if (d.enabled !== undefined) update.enabled = d.enabled;
  if (d.startsAt !== undefined) update.startsAt = d.startsAt ? new Date(d.startsAt) : null;
  if (d.endsAt !== undefined) update.endsAt = d.endsAt ? new Date(d.endsAt) : null;
  if (d.unavailableMessageAr !== undefined) update.unavailableMessageAr = d.unavailableMessageAr ?? null;
  if (d.unavailableMessageEn !== undefined) update.unavailableMessageEn = d.unavailableMessageEn ?? null;

  const updated = await db.update(streams).set(update).where(eq(streams.id, id)).returning({ id: streams.id });
  if (!updated.length) return jsonError(404, "not_found");

  await logAudit({ user: session, action: "update", entity: "stream", entityId: id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = parseId((await ctx.params).id);
  if (!id) return jsonError(400, "invalid_id");

  const removed = await db.delete(streams).where(eq(streams.id, id)).returning({ id: streams.id });
  if (!removed.length) return jsonError(404, "not_found");

  await logAudit({ user: session, action: "delete", entity: "stream", entityId: id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
