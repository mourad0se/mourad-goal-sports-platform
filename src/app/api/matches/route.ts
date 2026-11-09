import { NextResponse, type NextRequest } from "next/server";
import { getLiveMatches, getTodayMatches, searchMatches } from "@/lib/queries";

/**
 * Public match feed.
 *  GET /api/matches?scope=today|live   (default: today)
 *  GET /api/matches?q=<term>           (search overlay)
 */
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope") ?? "today";
  const q = req.nextUrl.searchParams.get("q")?.trim();

  try {
    if (q && q.length >= 2) {
      return NextResponse.json({ matches: await searchMatches(q) });
    }
    if (scope === "live") {
      return NextResponse.json({ matches: await getLiveMatches(30) });
    }
    return NextResponse.json({ matches: await getTodayMatches() });
  } catch (err) {
    console.error("matches_feed_error", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
