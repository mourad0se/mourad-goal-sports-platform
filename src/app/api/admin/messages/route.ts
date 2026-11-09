import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireAdminApi } from "@/lib/api";

export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;

  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100);
  return NextResponse.json({
    messages: rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
