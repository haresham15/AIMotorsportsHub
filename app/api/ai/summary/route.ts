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
        summary: `DEBUG: GEMINI_API_KEY is missing or undefined.`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    const prompt = `You are a professional motorsports journalist. Write a concise, engaging 2-paragraph summary of the CURRENT state of ${seriesName}. 
${contextData}
Include:
- The current or most recent race/event and notable results
- Championship standings highlights  
- Upcoming schedule and what to watch for
- Any breaking news or notable storylines

Keep it factual, exciting, and under 200 words. Write as if briefing a passionate fan who wants to stay up-to-date.`;

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
      summary: `DEBUG ERROR: ${message}`,
    });
  }
}
