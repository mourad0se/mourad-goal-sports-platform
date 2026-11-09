import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adSettings } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { adSettingsSchema, parseBody } from "@/lib/validations";
import { getAdSettingsRow } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;
  const row = await getAdSettingsRow();
  return NextResponse.json({ settings: { ...row, updatedAt: row.updatedAt.toISOString() } });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const parsed = parseBody(adSettingsSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  // Skip must never exceed the ad duration.
  if (parsed.data.skipAfterSec > parsed.data.demoDurationSec) return jsonError(400, "skip_gt_duration");

  const row = await getAdSettingsRow();
  await db
    .update(adSettings)
    .set({ ...parsed.data, vastTagUrl: parsed.data.vastTagUrl ?? null, updatedAt: new Date() })
    .where(eq(adSettings.id, row.id));

  await logAudit({ user: session, action: "settings", entity: "ads", entityId: row.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
