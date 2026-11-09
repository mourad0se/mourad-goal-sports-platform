import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, streams, teams } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { streamSchema, parseBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const awayTeams = alias(teams, "away_teams");

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const rows = await db
    .select({
      stream: streams,
      homeNameAr: teams.nameAr,
      homeNameEn: teams.nameEn,
      awayNameAr: awayTeams.nameAr,
      awayNameEn: awayTeams.nameEn,
      kickoffAt: matches.kickoffAt,
      status: matches.status,
    })
    .from(streams)
    .innerJoin(matches, eq(streams.matchId, matches.id))
    .innerJoin(teams, eq(matches.homeTeamId, teams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .orderBy(desc(streams.createdAt))
    .limit(300);

  return NextResponse.json({
    streams: rows.map((r) => ({
      ...r.stream,
      createdAt: r.stream.createdAt.toISOString(),
      updatedAt: r.stream.updatedAt.toISOString(),
      startsAt: r.stream.startsAt?.toISOString() ?? null,
      endsAt: r.stream.endsAt?.toISOString() ?? null,
      match: {
        id: r.stream.matchId,
        homeNameAr: r.homeNameAr,
        homeNameEn: r.homeNameEn,
        awayNameAr: r.awayNameAr,
        awayNameEn: r.awayNameEn,
        kickoffAt: r.kickoffAt.toISOString(),
        status: r.status,
      },
    })),
  });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const parsed = parseBody(streamSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;

  const [created] = await db
    .insert(streams)
    .values({
      matchId: d.matchId,
      label: d.label,
      type: d.type,
      url: d.url,
      priority: d.priority ?? 0,
      enabled: d.enabled ?? true,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      unavailableMessageAr: d.unavailableMessageAr ?? null,
      unavailableMessageEn: d.unavailableMessageEn ?? null,
    })
    .returning({ id: streams.id });

  await logAudit({ user: session, action: "create", entity: "stream", entityId: created.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: created.id });
}
