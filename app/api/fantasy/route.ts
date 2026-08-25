import { NextRequest, NextResponse } from "next/server";
import { addPrediction, getPredictionsForRound, getFantasyStore } from "@/lib/fantasyStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get("series");
  const round = searchParams.get("round");
  const action = searchParams.get("action");

  if (action === 'leaderboard') {
    // Get all-time leaderboard
    const store = getFantasyStore();
    const scores: Record<string, { username: string, totalScore: number }> = {};
    
    store.predictions.forEach(p => {
      if (p.score !== undefined) {
        if (!scores[p.userId]) {
          scores[p.userId] = { username: p.username, totalScore: 0 };
        }
        scores[p.userId].totalScore += p.score;
      }
    });

    const leaderboard = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
    return NextResponse.json({ leaderboard });
  }

  if (!series || !round) {
    return NextResponse.json({ error: "Missing series or round" }, { status: 400 });
  }

  const predictions = getPredictionsForRound(series, parseInt(round));
  return NextResponse.json({ predictions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, series, round, p1, p2, p3 } = body;

    if (!userId || !username || !series || round === undefined || !p1 || !p2 || !p3) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPrediction = addPrediction({
      userId,
      username,
      series,
      round: parseInt(round),
      p1,
      p2,
      p3
    });

    return NextResponse.json({ success: true, prediction: newPrediction });
  } catch (e) {
    console.error("Error saving prediction", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
