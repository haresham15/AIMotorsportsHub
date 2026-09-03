import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

const MAX_PROMPT_LENGTH = 1000;
const MAX_AGENT_TURNS = 5; // Prevent infinite loops

function getInternalApiUrl(origin: string, series: string, resource: 'schedule' | 'standings') {
  if (series === 'f1') {
    return `${origin}/api/f1/${resource}`;
  }

  if (series.startsWith('nascar-')) {
    return `${origin}/api/nascar/${resource}?series=${encodeURIComponent(series)}`;
  }

  return null;
}

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
  description: "Search the official FIA sporting regulations and rulebook for the given series using semantic search. Call this when the user asks about rules, penalties, race formats, safety cars, points systems, or flag meanings.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: "The semantic search query for the rulebook",
      },
      series: {
        type: SchemaType.STRING,
        description: "The racing series (e.g. 'f1')",
      },
    },
    required: ["query", "series"],
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
      model: "gemini-2.5-flash",
      tools: tools
    });

    const chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are the ${seriesName} Race Engineer AI for Apexis. 
          You have access to live tools. YOU MUST call tools if the user asks for data you don't inherently know (live gaps, rulebook details, schedule).
          Keep responses concise, informative, and enthusiastic. Use racing terminology naturally. Keep responses under 150 words.`
        }]
      }
    });

    let result = await chat.sendMessage(userPrompt);
    let turns = 0;
    
    // Multi-turn Agentic Loop
    while (result.response.functionCalls() && turns < MAX_AGENT_TURNS) {
      turns++;
      const functionCalls = result.response.functionCalls();
      const functionResponses = [];
      
      for (const call of functionCalls!) {
        const { name, args } = call;
        const targetSeries = (args as any).series || series;
        const origin = request.nextUrl.origin;
        let apiResponse;
        
        try {
          if (name === "get_live_standings") {
            apiResponse = {
              liveRaceData: contextData?.liveRaceData || "No live telemetry available right now",
              cvData: contextData?.cvData || "No Computer Vision scan data available"
            };
          } else if (name === "get_championship_standings") {
            if (contextData?.championship) {
              apiResponse = contextData.championship;
            } else {
              const standingsUrl = getInternalApiUrl(origin, targetSeries, "standings");
              if (!standingsUrl) {
                apiResponse = { error: `Championship standings are not available for ${targetSeries}` };
              } else {
                const res = await fetch(standingsUrl);
                apiResponse = res.ok ? await res.json() : { error: "Failed to fetch standings" };
              }
            }
          } else if (name === "get_schedule") {
            const scheduleUrl = getInternalApiUrl(origin, targetSeries, "schedule");
            if (!scheduleUrl) {
              apiResponse = { error: `Schedule data is not available for ${targetSeries}` };
            } else {
              const res = await fetch(scheduleUrl);
              apiResponse = res.ok ? await res.json() : { error: "Failed to fetch schedule" };
            }
          } else if (name === "search_rulebook") {
            // Semantic Search using pgvector
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (supabaseUrl && supabaseKey) {
              const supabase = createClient(supabaseUrl, supabaseKey);
              const queryStr = (args as any).query;
              
              // 1. Embed query
              const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
              const embedRes = await embedModel.embedContent(queryStr);
              const queryEmbedding = embedRes.embedding.values;
              
              // 2. Vector search via RPC
              const { data, error } = await supabase.rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: 0.7,
                match_count: 3
              });
              
              if (error) throw error;
              apiResponse = { rules_chunks: data.map((d: any) => d.content) };
            } else {
               apiResponse = { error: "Supabase credentials missing for rulebook search." };
            }
          } else {
             apiResponse = { error: "Unknown tool" };
          }
        } catch (e) {
          console.error(`Tool execution failed for ${name}:`, e);
          apiResponse = { error: "Tool execution failed due to internal error." };
        }
        
        functionResponses.push({
          functionResponse: {
            name: name,
            response: apiResponse
          }
        });
      }
      
      // Send all tool responses back to the model to continue the conversation
      result = await chat.sendMessage(functionResponses);
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
