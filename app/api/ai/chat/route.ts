import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_PROMPT_LENGTH = 500;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Step 1: Orchestrator Agent (Intent Classification)
    const orchestratorPrompt = `
You are a routing agent for a motorsports platform. Classify the user's intent into exactly ONE of these three categories:
1. "telemetry" - questions about current standings, who is leading, gaps, positions, or live race data.
2. "strategy" - questions about tire wear, when someone should pit, race pace, or predictive outcomes.
3. "rules_history" - questions about general knowledge, past races, technical regulations, driver history, or anything else.

Reply with ONLY the exact category name (telemetry, strategy, or rules_history).
User query: "${userPrompt}"
`;
    const intentResult = await model.generateContent(orchestratorPrompt);
    const intent = intentResult.response.text().trim().toLowerCase();

    // Serialize live context
    let raceContext = "Live Data Not Available.";
    if (contextData) {
      const topDrivers = contextData.championship?.driverStandings?.slice(0, 5) || [];
      const cvDrivers = contextData.cvData || [];
      const liveRace = contextData.liveRaceData || [];
      raceContext = `
Live Race Standings: ${JSON.stringify(liveRace)}
CV Scan Standings: ${JSON.stringify(cvDrivers)}
Championship Standings: ${JSON.stringify(topDrivers)}
`;
    }

    // Step 2: Specialized Agent Execution
    let systemPrompt = "";

    if (intent.includes("telemetry")) {
      systemPrompt = `You are the ${seriesName} Telemetry Agent. Your job is to answer questions strictly based on the live race data provided below.
If the data is empty, say you are waiting for live telemetry to sync.
Live Context: ${raceContext}`;
    } else if (intent.includes("strategy")) {
      systemPrompt = `You are the ${seriesName} Race Strategy Agent. Analyze the current race situation and tire/gap data to make informed strategic predictions (e.g. pit windows, undercut potential, tire degradation).
Live Context: ${raceContext}`;
    } else {
      systemPrompt = `You are the ${seriesName} Rules & History Agent. Your job is to answer general knowledge questions about ${seriesName} regulations, past championships, and historical statistics. You do not need live data.`;
    }

    const finalPrompt = `
${systemPrompt}
Remember to be concise, informative, and enthusiastic. Use racing terminology naturally. Keep responses under 150 words.
User question: ${userPrompt}
Provide a helpful, engaging answer:`;

    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Chat error:", message);
    return NextResponse.json({
      reply: "Sorry, I encountered an error processing your question. Please try again.",
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
