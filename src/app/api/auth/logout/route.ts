import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await getSession();
  await clearSession();
  if (session) {
    await logAudit({ user: session, action: "logout", entity: "auth", entityId: session.sub, ip: clientIp(req) });
  }
  return NextResponse.json({ ok: true });
}
