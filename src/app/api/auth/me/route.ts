import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "unauthorized");
  return NextResponse.json({ user: session });
}
