import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema, parseBody } from "@/lib/validations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`contact:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.ok) return jsonError(429, "too_many");

  const parsed = parseBody(contactSchema, (await readJson(req)) ?? {});
  if (!parsed.ok) return jsonError(400, "invalid", { details: parsed.errors });

  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  return NextResponse.json({ ok: true });
}
