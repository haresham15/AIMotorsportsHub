import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get("series");
  const round = searchParams.get("round");
  const action = searchParams.get("action");

  const supabase = await createClient();

  if (action === 'leaderboard') {
    // Get all-time leaderboard using Supabase RPC or aggregating
    const { data, error } = await supabase
      .from('fantasy_predictions')
      .select('user_id, username, score')
      .not('score', 'is', null);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    const scores: Record<string, { username: string, totalScore: number }> = {};
    
    data.forEach(p => {
      if (!scores[p.user_id]) {
        scores[p.user_id] = { username: p.username, totalScore: 0 };
      }
      scores[p.user_id].totalScore += p.score || 0;
    });

    const leaderboard = Object.values(scores).sort((a, b) => b.totalScore - a.totalScore);
    return NextResponse.json({ leaderboard });
  }

  if (!series || !round) {
    return NextResponse.json({ error: "Missing series or round" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('fantasy_predictions')
    .select('*')
    .eq('series', series)
    .eq('round', parseInt(round));

  if (error) {
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }

  // Map database columns back to camelCase for the frontend if needed
  const predictions = data.map(p => ({
    userId: p.user_id,
    username: p.username,
    series: p.series,
    round: p.round,
    p1: p.p1,
    p2: p.p2,
    p3: p.p3,
    score: p.score
  }));

  return NextResponse.json({ predictions });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, series, round, p1, p2, p3 } = body;
    const userId = session.user.id;

    if (!username || !series || round === undefined || !p1 || !p2 || !p3) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert into Supabase (requires UNIQUE constraint on user_id, series, round)
    const { data, error } = await supabase
      .from('fantasy_predictions')
      .upsert({
        user_id: userId,
        username,
        series,
        round: parseInt(round),
        p1,
        p2,
        p3
      }, { onConflict: 'user_id,series,round' })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const prediction = {
      userId: data.user_id,
      username: data.username,
      series: data.series,
      round: data.round,
      p1: data.p1,
      p2: data.p2,
      p3: data.p3
    };

    return NextResponse.json({ success: true, prediction });
  } catch (e) {
    console.error("Error saving prediction", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
