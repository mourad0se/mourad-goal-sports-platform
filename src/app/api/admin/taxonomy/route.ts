import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api";
import { getTaxonomies } from "@/lib/queries";

/** Dropdown data for admin forms: sports, competitions, teams. */
export async function GET() {
  const guard = await requireAdminApi();
  if (guard instanceof NextResponse) return guard;
  return NextResponse.json(await getTaxonomies());
}
