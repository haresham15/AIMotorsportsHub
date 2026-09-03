import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { resolveLocalTelemetryIntent } from "@/lib/raceEngineerIntent";

const MAX_PROMPT_LENGTH = 1000;

// High-speed in-memory response cache
interface CacheEntry {
  reply: string;
  expiresAt: number;
}
const chatCache = new Map<string, CacheEntry>();

function getCachedReply(key: string): string | null {
  const entry = chatCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    chatCache.delete(key);
    return null;
  }
  return entry.reply;
}

function setCachedReply(key: string, reply: string, ttlMs: number = 60000) {
  if (chatCache.size > 300) {
    const firstKey = chatCache.keys().next().value;
    if (firstKey) chatCache.delete(firstKey);
  }
  chatCache.set(key, { reply, expiresAt: Date.now() + ttlMs });
}

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

    const acceptHeader = request.headers.get("accept") || "";
    const wantsJsonOnly = acceptHeader.includes("application/json") && !acceptHeader.includes("text/plain");

    // ── FAST PATH 1: Instant Local Telemetry Intent (< 1ms) ───────────
    const localIntentReply = resolveLocalTelemetryIntent(userPrompt, seriesName, contextData);
    if (localIntentReply) {
      if (wantsJsonOnly) {
        return NextResponse.json({ reply: localIntentReply, cached: false, fastPath: true });
      }

      // Stream instant local reply in rapid chunks for smooth teletype feel
      const encoder = new TextEncoder();
      const words = localIntentReply.split(" ");
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
            controller.enqueue(encoder.encode(chunk));
            // Tiny 15ms spacing between word batches to simulate radio teletype
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Fast-Path": "telemetry-engine",
        },
      });
    }

    // ── FAST PATH 2: In-memory LRU Cache Check (< 1ms) ────────────────
    const cacheKey = `${series}:${userPrompt.toLowerCase()}`;
    const cached = getCachedReply(cacheKey);
    if (cached) {
      if (wantsJsonOnly) {
        return NextResponse.json({ reply: cached, cached: true });
      }

      const encoder = new TextEncoder();
      const words = cached.split(" ");
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i += 4) {
            const chunk = words.slice(i, i + 4).join(" ") + (i + 4 < words.length ? " " : "");
            controller.enqueue(encoder.encode(chunk));
            await new Promise((r) => setTimeout(r, 10));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Fast-Path": "cache",
        },
      });
    }

    // ── FAST PATH 3: Optimized Gemini Streaming ───────────────────────
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      const offlineMsg = `I'm the ${seriesName} Race Engineer AI. Comms channel configured. Standing by for telemetry.`;
      return wantsJsonOnly
        ? NextResponse.json({ reply: offlineMsg })
        : new Response(offlineMsg, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Compact telemetry context to minimize input token processing overhead
    let contextSnippet = "";
    if (contextData?.liveRaceData?.length) {
      const top5 = contextData.liveRaceData.slice(0, 5).map((d: any) =>
        `P${d.position}:${d.drivers?.name || d.driver_id}(${d.gap_to_leader},${d.tire_compound})`
      ).join("; ");
      contextSnippet += `\nTiming: ${top5}`;
    }

    const systemInstruction = `You are ${seriesName} Race Engineer on pit radio.
Current Telemetry:${contextSnippet || " Active."}
Rules:
- Max 50 words. Punchy, authentic pit radio terminology (delta, apex, box, DRS, tyres).
- Answer immediately. No conversational filler.`;

    // Try fastest available model: gemini-3.5-flash-lite, fallback to gemini-flash-latest
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"];
    let activeModel = null;
    let streamResult = null;

    for (const mName of modelsToTry) {
      try {
        const candidateModel = genAI.getGenerativeModel({
          model: mName,
          generationConfig: {
            maxOutputTokens: 90,
            temperature: 0.2,
          },
        });

        streamResult = await candidateModel.generateContentStream({
          contents: [
            { role: "user", parts: [{ text: `${systemInstruction}\n\nRadio Transmission: "${userPrompt}"` }] },
          ],
        });
        activeModel = mName;
        break;
      } catch (err: any) {
        console.warn(`Model ${mName} unavailable:`, err?.message);
      }
    }

    if (!streamResult) {
      throw new Error("All AI models currently busy");
    }

    // If client requested JSON only:
    if (wantsJsonOnly) {
      let fullText = "";
      for await (const chunk of streamResult.stream) {
        fullText += chunk.text();
      }
      const reply = fullText.trim() || "Copy that. Standing by.";
      setCachedReply(cacheKey, reply, 60000);
      return NextResponse.json({ reply, model: activeModel });
    }

    // Stream response chunks directly to client
    const encoder = new TextEncoder();
    let accumulatedText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            accumulatedText += text;
            controller.enqueue(encoder.encode(text));
          }
          if (accumulatedText.trim()) {
            setCachedReply(cacheKey, accumulatedText.trim(), 60000);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-AI-Model": activeModel || "unknown",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI Chat error:", message);

    const fallbackRadio = "Radio static: Comms interference on pit wall. Focus on your delta and tyre temperatures, standing by.";
    return NextResponse.json({ reply: fallbackRadio });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
