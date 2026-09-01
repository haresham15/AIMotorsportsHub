import { NextResponse } from "next/server";
import { getGoatRankings } from "@/lib/ml/eloModel";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minRaces = parseInt(searchParams.get("minRaces") || "30", 10);
    const activeOnly = searchParams.get("active") === "true";

    const allRankings = getGoatRankings();

    let filtered = allRankings.filter(r => r.races >= minRaces);

    if (activeOnly) {
      // In a real scenario, we'd check if they raced in the current year.
      // We can approximate by checking if their era ends in "2020s"
      filtered = filtered.filter(r => r.era.includes("2020s"));
    }

    return NextResponse.json({ rankings: filtered });
  } catch (error: any) {
    console.error("Rankings API error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
