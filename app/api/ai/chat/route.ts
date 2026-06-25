import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const MAX_PROMPT_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt: rawPrompt, series = "f1" } = body;

    if (!rawPrompt || typeof rawPrompt !== "string") {
      return NextResponse.json(
        { reply: "Please provide a valid question." },
        { status: 400 }
      );
    }

    // Sanitize input
    const userPrompt = rawPrompt.trim().slice(0, MAX_PROMPT_LENGTH);
    if (!userPrompt) {
      return NextResponse.json(
        { reply: "Please provide a valid question." },
        { status: 400 }
      );
    }

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

    // Try to get live race context from Supabase
    let raceContext = "";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY?.trim();

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: raceData } = await supabase
          .from("mock_live_race_data")
          .select("*, drivers(name, series_id)")
          .order("position", { ascending: true })
          .limit(20);

        if (raceData && raceData.length > 0) {
          const seriesData = raceData.filter(
            (d: Record<string, unknown>) => {
              const drivers = d.drivers as Record<string, unknown> | null;
              return drivers?.series_id === series;
            }
          );
          if (seriesData.length > 0) {
            const standings = seriesData.map(
              (d: Record<string, unknown>) => {
                const drivers = d.drivers as Record<string, string> | null;
                return `P${d.position}: ${drivers?.name || "Unknown"} (Gap: ${d.gap_to_leader}, Last Lap: ${d.last_lap}, Tires: ${d.tire_compound})`;
              }
            );
            raceContext = `\n\nCurrent live race standings for ${seriesName}:\n${standings.join("\n")}`;
          }
        }
      } catch {
        raceContext = "\n\nNote: Live race data is currently unavailable.";
      }
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        reply: `I'm the ${seriesName} Race Engineer AI. To enable full AI capabilities, please configure the GEMINI_API_KEY environment variable. Your question was: "${userPrompt}"`,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are an expert race engineer and commentator for ${seriesName}. 
You ONLY answer questions about ${seriesName}. If asked about a different racing series, politely redirect the user to the appropriate series dashboard.

You are knowledgeable about:
- Race strategy, tire management, pit stops
- Current and historical driver/team performance
- Technical regulations and car specifications
- Track characteristics and race circuits
- Championship standings and points systems
- Weather effects on racing
${raceContext}

Be concise, informative, and enthusiastic. Use racing terminology naturally. Keep responses under 150 words unless the question requires more detail.

User question: ${userPrompt}

Provide a helpful, engaging answer:`;

    const result = await model.generateContent(systemPrompt);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Chat error:", message);
    return NextResponse.json({
      reply: "Sorry, I encountered an error processing your question. Please try again.",
    });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
