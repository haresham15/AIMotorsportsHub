import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const SERIES_FULL_NAMES: Record<string, string> = {
  f1: "Formula 1",
  f2: "Formula 2",
  f3: "Formula 3",
  "formula-e": "Formula E",
  nascar: "NASCAR",
  "nascar-cup": "NASCAR Cup Series",
  "nascar-xfinity": "NASCAR Xfinity Series",
  "nascar-trucks": "NASCAR Craftsman Truck Series",
  "gt-world-challenge": "GT World Challenge",
  "top-fuel": "NHRA Top Fuel Drag Racing",
};

function getSeriesEndpoints(series: string, requestUrl: string) {
  if (series === "f1") {
    return {
      standingsUrl: new URL("/api/f1/standings", requestUrl),
      scheduleUrl: new URL("/api/f1/schedule", requestUrl),
    };
  }

  if (series.startsWith("nascar-")) {
    const standingsUrl = new URL("/api/nascar/standings", requestUrl);
    standingsUrl.searchParams.set("series", series);
    const scheduleUrl = new URL("/api/nascar/schedule", requestUrl);
    scheduleUrl.searchParams.set("series", series);
    return { standingsUrl, scheduleUrl };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const series = searchParams.get("series") || "f1";
  const seriesName = SERIES_FULL_NAMES[series] || series.toUpperCase();

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        summary: "Briefing not available right now. Check back shortly.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let contextData = "";
    try {
      const endpoints = getSeriesEndpoints(series, request.url);
      if (endpoints) {
        const [standingsRes, scheduleRes] = await Promise.all([
          fetch(endpoints.standingsUrl.toString()),
          fetch(endpoints.scheduleUrl.toString()),
        ]);

        if (standingsRes.ok && scheduleRes.ok) {
          const standings = await standingsRes.json();
          const schedule = await scheduleRes.json();

          const top5Drivers = standings.driverStandings
            ?.slice(0, 5)
            .map((driver: { position: number; firstName: string; lastName: string; points: number }) =>
              `${driver.position}. ${driver.firstName} ${driver.lastName} (${driver.points} pts)`
            )
            .join(", ");
          const currentRound = schedule.rounds?.find((round: { round: number }) => round.round === schedule.currentRound);

          contextData = `
          CURRENT LIVE DATA (Use this for factual grounding):
          - Championship Top 5: ${top5Drivers || "N/A"}
          - Current/Next Race: Round ${schedule.currentRound} - ${currentRound?.name || "N/A"} in ${currentRound?.country || "N/A"} (Status: ${currentRound?.status || "N/A"})
          `;
        }
      }
    } catch (error) {
      console.error("Failed to fetch context data for AI summary", error);
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
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Summary error:", message);
    return NextResponse.json({
      summary: "Briefing not available right now. Check back shortly.",
    });
  }
}
