import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get("series") || "f1";

  const seriesFullNames: Record<string, string> = {
    f1: "Formula 1",
    f2: "Formula 2",
    f3: "Formula 3",
    "formula-e": "Formula E",
    nascar: "NASCAR",
    "gt-world-challenge": "GT World Challenge",
    "top-fuel": "NHRA Top Fuel Drag Racing",
  };

  const seriesName = seriesFullNames[series] || series.toUpperCase();

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        summary: `Briefing not available right now — check back shortly.`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    let contextData = ""
    try {
      if (series === 'f1') {
        const standingsUrl = new URL('/api/f1/standings', request.url)
        const scheduleUrl = new URL('/api/f1/schedule', request.url)
        const [standingsRes, scheduleRes] = await Promise.all([
          fetch(standingsUrl.toString()),
          fetch(scheduleUrl.toString())
        ])
        if (standingsRes.ok && scheduleRes.ok) {
          const standings = await standingsRes.json()
          const schedule = await scheduleRes.json()
          
          const top5Drivers = standings.driverStandings?.slice(0, 5).map((d: any) => `${d.position}. ${d.firstName} ${d.lastName} (${d.points} pts)`).join(', ')
          const currentRound = schedule.rounds?.find((r: any) => r.round === schedule.currentRound)
          
          contextData = `
          CURRENT LIVE DATA (Use this for factual grounding):
          - Championship Top 5: ${top5Drivers || 'N/A'}
          - Current/Next Race: Round ${schedule.currentRound} - ${currentRound?.name || 'N/A'} in ${currentRound?.country || 'N/A'} (Status: ${currentRound?.status || 'N/A'})
          `
        }
      }
    } catch (e) {
      console.error("Failed to fetch context data for AI summary", e)
    }

    const prompt = `You are a premium motorsports journalist providing an in-depth, authoritative briefing on the current state of ${seriesName}.

${contextData ? `IMPORTANT - LATEST LIVE DATA:\n${contextData}\n\nYou MUST ground your briefing heavily in the live data provided above.` : `Provide a highly relevant, up-to-date overview of the current season and era of ${seriesName}.`}

Your briefing should be comprehensive, highly engaging, and structured into 3 to 4 well-developed paragraphs. Please cover:
1. The Championship Battle: Analyze the current standings, who is dominating, and who is underperforming.
2. Recent & Upcoming Action: Discuss the most recent event's outcomes and set the stage for the next round on the calendar.
3. Key Storylines & Drama: Highlight the biggest technical battles, team rivalries, or paddock rumors currently defining the sport.

Write in a punchy, analytical, and passionate tone tailored for hardcore racing fans. Avoid generic filler and focus on specific, factual racing insights.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json(
      { summary },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Summary error:", message);
    return NextResponse.json({
      summary: `Briefing not available right now — check back shortly.`,
    });
  }
}
