import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_PROMPT_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt: rawPrompt, series = "f1", contextData } = body;

    if (!rawPrompt || typeof rawPrompt !== "string") {
      return NextResponse.json({ reply: "Please provide a valid question." }, { status: 400 });
    }

    const userPrompt = rawPrompt.trim().slice(0, MAX_PROMPT_LENGTH);
    if (!userPrompt) {
      return NextResponse.json({ reply: "Please provide a valid question." }, { status: 400 });
    }

    const seriesFullNames: Record<string, string> = {
      f1: "Formula 1", f2: "Formula 2", f3: "Formula 3",
      "formula-e": "Formula E", nascar: "NASCAR",
      "nascar-cup": "NASCAR Cup Series",
      "nascar-xfinity": "NASCAR Xfinity Series",
      "nascar-trucks": "NASCAR Craftsman Truck Series",
      "gt-world-challenge": "GT World Challenge",
      "top-fuel": "NHRA Top Fuel Drag Racing",
    };
    const seriesName = seriesFullNames[series] || series.toUpperCase();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        reply: `I'm the ${seriesName} Race Engineer AI. To enable full AI capabilities, please configure the GEMINI_API_KEY environment variable.`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash"
    });

    let contextSnippet = "";
    if (contextData) {
      if (contextData.liveRaceData && Array.isArray(contextData.liveRaceData) && contextData.liveRaceData.length > 0) {
        const top10 = contextData.liveRaceData.slice(0, 10).map((d: any) => 
          `P${d.position}: ${d.drivers?.name || d.driver_id} (Gap: ${d.gap_to_leader}, Tyre: ${d.tire_compound})`
        ).join("; ");
        contextSnippet += `\nLive Timing: ${top10}`;
      }
      if (contextData.standingsData?.driverStandings?.length) {
        const top5Drivers = contextData.standingsData.driverStandings.slice(0, 5).map((d: any) => 
          `P${d.position}: ${d.firstName} ${d.lastName} (${d.points} pts, ${d.constructorName})`
        ).join("; ");
        contextSnippet += `\nChampionship Leaders: ${top5Drivers}`;
      }
    }

    const systemInstruction = `You are the ${seriesName} Race Engineer AI for Apexis, communicating with the driver and pit wall via team radio.
Current Telemetry & Standings:${contextSnippet || " Session telemetry active."}
Instructions:
- Keep responses concise, direct, and under 120 words.
- Use authentic racing terminology (delta, apex, undercut, DRS, tyre life).
- Always prioritize accurate answers using the live telemetry provided.`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nRadio Transmission from User: "${userPrompt}"` }] }
      ]
    });

    const reply = result.response.text();
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Chat error:", message);
    return NextResponse.json({
      reply: "Sorry, I encountered an error processing your question. Details: " + message,
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
