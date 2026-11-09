import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { jsonError, readJson, requireAdminApi } from "@/lib/api";
import { parseBody, siteSettingsSchema } from "@/lib/validations";
import { getSiteSettingsRow } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;
  const row = await getSiteSettingsRow();
  return NextResponse.json({ settings: { ...row, updatedAt: row.updatedAt.toISOString() } });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const parsed = parseBody(siteSettingsSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });
  const d = parsed.data;

  const row = await getSiteSettingsRow();
  await db
    .update(siteSettings)
    .set({
      siteNameAr: d.siteNameAr,
      siteNameEn: d.siteNameEn,
      taglineAr: d.taglineAr ?? null,
      taglineEn: d.taglineEn ?? null,
      defaultLocale: d.defaultLocale,
      contactEmail: d.contactEmail ?? null,
      twitterUrl: d.twitterUrl ?? null,
      youtubeUrl: d.youtubeUrl ?? null,
      facebookUrl: d.facebookUrl ?? null,
      instagramUrl: d.instagramUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, row.id));

  await logAudit({ user: session, action: "settings", entity: "settings", entityId: row.id, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
