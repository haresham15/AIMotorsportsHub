import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        summary: `Welcome to ${seriesName}! AI summaries require a Gemini API key. Add GEMINI_API_KEY to your .env.local file to enable AI-powered briefings.`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a professional motorsports journalist. Write a concise, engaging 2-paragraph summary of the CURRENT state of ${seriesName}. 

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
      summary: `Unable to generate AI summary for ${seriesName} at this time. Please check your Gemini API key configuration.`,
    });
  }
}
