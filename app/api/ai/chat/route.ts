import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { readFile } from "fs/promises";
import path from "path";

const MAX_PROMPT_LENGTH = 500;

const getLiveStandingsDeclaration: FunctionDeclaration = {
  name: "get_live_standings",
  description: "Get the current live telemetry, standings, intervals, and tire data for the active race session. Useful for answering 'who is leading right now', 'what are the gaps', or 'what tires are they on'.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      series: {
        type: SchemaType.STRING,
        description: "The racing series (e.g. 'f1', 'f2')",
      },
    },
    required: ["series"],
  },
};

const getChampionshipStandingsDeclaration: FunctionDeclaration = {
  name: "get_championship_standings",
  description: "Get the overall championship points and standings for drivers and constructors.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      series: {
        type: SchemaType.STRING,
        description: "The racing series (e.g. 'f1')",
      },
    },
    required: ["series"],
  },
};

const getScheduleDeclaration: FunctionDeclaration = {
  name: "get_schedule",
  description: "Get the race calendar, schedule of upcoming sessions, and the status of the current or next round.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      series: {
        type: SchemaType.STRING,
        description: "The racing series (e.g. 'f1')",
      },
    },
    required: ["series"],
  },
};

const searchRulebookDeclaration: FunctionDeclaration = {
  name: "search_rulebook",
  description: "Search the official FIA sporting regulations and rulebook for the given series. Call this when the user asks about rules, penalties, race formats, safety cars, points systems, or flag meanings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      series: {
        type: SchemaType.STRING,
        description: "The racing series (e.g. 'f1')",
      },
    },
    required: ["series"],
  },
};

const tools = [
  {
    functionDeclarations: [
      getLiveStandingsDeclaration,
      getChampionshipStandingsDeclaration,
      getScheduleDeclaration,
      searchRulebookDeclaration,
    ],
  },
];

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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      tools: tools
    });

    const chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are the ${seriesName} Race Engineer AI. You have access to tools to fetch live telemetry, championship standings, and schedule data. 
          Use them when needed to answer the user's question accurately. If the user asks a general racing question, you can answer from your own knowledge.
          Keep responses concise, informative, and enthusiastic. Use racing terminology naturally. Keep responses under 150 words.`
        }]
      }
    });

    let result = await chat.sendMessage(userPrompt);
    let functionCall = result.response.functionCalls()?.[0];
    
    // Simple 1-iteration loop for function calling
    if (functionCall) {
      let apiResponse;
      const { name, args } = functionCall;
      const targetSeries = (args as any).series || series;
      const origin = request.nextUrl.origin;
      
      try {
        if (name === "get_live_standings") {
          // Live standings are fetched client-side and sent via contextData
          apiResponse = {
            liveRaceData: contextData?.liveRaceData || "No live telemetry available right now",
            cvData: contextData?.cvData || "No Computer Vision scan data available"
          };
        } else if (name === "get_championship_standings") {
          // In production, we'd fetch this. For now, since the frontend passes it, we can use it to save a round trip.
          if (contextData?.championship) {
            apiResponse = contextData.championship;
          } else {
            const res = await fetch(`${origin}/api/${targetSeries}/standings`);
            apiResponse = res.ok ? await res.json() : { error: "Failed to fetch standings" };
          }
        } else if (name === "get_schedule") {
          const res = await fetch(`${origin}/api/${targetSeries}/schedule`);
          apiResponse = res.ok ? await res.json() : { error: "Failed to fetch schedule" };
        } else if (name === "search_rulebook") {
          try {
            const filePath = path.join(process.cwd(), 'data', 'fia_regulations_2024.md');
            const rulesContent = await readFile(filePath, 'utf-8');
            apiResponse = { rules: rulesContent };
          } catch (e) {
            apiResponse = { error: "Rulebook not found for this series" };
          }
        } else {
           apiResponse = { error: "Unknown tool" };
        }
      } catch (e) {
        apiResponse = { error: "Tool execution failed" };
      }
      
      // Send tool response back to the model
      result = await chat.sendMessage([{
        functionResponse: {
          name: name,
          response: apiResponse
        }
      }]);
    }
    
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
