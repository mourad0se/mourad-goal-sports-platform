import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { streams } from "@/db/schema";
import { jsonError, requireAdminApi } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

async function probe(url: string, method: "HEAD" | "GET"): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: method === "GET" ? { Range: "bytes=0-0" } : {},
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Server-side reachability check — keeps provider URLs off the client. */
export async function GET(req: Request, ctx: Ctx) {
  const session = await requireAdminApi();
  if (session instanceof NextResponse) return session;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError(400, "invalid_id");

  const [stream] = await db.select().from(streams).where(eq(streams.id, id)).limit(1);
  if (!stream) return jsonError(404, "not_found");

  let online = false;
  if (stream.type === "embed") {
    online = true; // embeds cannot be probed cross-origin; assume reachable
  } else {
    online = (await probe(stream.url, "HEAD")) || (await probe(stream.url, "GET"));
  }

  await db
    .update(streams)
    .set({ health: online ? "online" : "offline", updatedAt: new Date() })
    .where(eq(streams.id, id));

  await logAudit({
    user: session,
    action: "update",
    entity: "stream",
    entityId: id,
    meta: { kind: "health_check", result: online ? "online" : "offline" },
    ip: clientIp(req),
  });

  return NextResponse.json({ health: online ? "online" : "offline" });
}
