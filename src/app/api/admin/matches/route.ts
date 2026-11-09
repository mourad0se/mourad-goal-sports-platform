import { NextResponse } from "next/server";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { matchSchema, parseBody } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { getAdminMatches } from "@/lib/queries";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json({ matches: await getAdminMatches() });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const parsed = parseBody(matchSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  if (parsed.data.homeTeamId === parsed.data.awayTeamId) return jsonError(400, "same_teams");

  const kickoff = new Date(parsed.data.kickoffAt);
  if (Number.isNaN(kickoff.getTime())) return jsonError(400, "invalid_date");

  const [created] = await db
    .insert(matches)
    .values({
      sportId: parsed.data.sportId,
      competitionId: parsed.data.competitionId,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      kickoffAt: kickoff,
      status: parsed.data.status,
      homeScore: parsed.data.homeScore ?? null,
      awayScore: parsed.data.awayScore ?? null,
      venue: parsed.data.venue ?? null,
      descriptionAr: parsed.data.descriptionAr ?? null,
      descriptionEn: parsed.data.descriptionEn ?? null,
      featured: parsed.data.featured ?? false,
    })
    .returning({ id: matches.id });

  await logAudit({ user: session, action: "create", entity: "match", entityId: created.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: created.id });
}
