import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema, parseBody } from "@/lib/validations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { jsonError, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const ip = clientIp(req);

  // 5 attempts per 5 minutes per IP — slows credential stuffing.
  const rl = rateLimit(`login:${ip}`, 5, 5 * 60 * 1000);
  if (!rl.ok) {
    await logAudit({ user: null, action: "login_failed", entity: "auth", meta: { reason: "rate_limited" }, ip });
    return NextResponse.json(
      { error: "too_many" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const body = await readJson(req);
  const parsed = parseBody(loginSchema, body ?? {});
  if (!parsed.ok) return jsonError(400, "invalid");

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;

  if (!user || !ok) {
    await logAudit({ user: null, action: "login_failed", entity: "auth", meta: { email }, ip });
    return jsonError(401, "invalid_credentials");
  }

  const session = { sub: user.id, email: user.email, name: user.name, role: user.role };
  await createSession(session);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await logAudit({ user: session, action: "login", entity: "auth", entityId: user.id, ip });

  return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
}
