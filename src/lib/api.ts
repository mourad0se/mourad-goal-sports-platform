import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Server-side authorization gate for every admin API route. */
export async function requireAdminApi(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return jsonError(401, "unauthorized");
  return session;
}

export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
