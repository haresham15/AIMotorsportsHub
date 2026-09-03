import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDb } from "@/lib/db";
import { TireDegradationModel } from "@/lib/ml/tireModel";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // Step 1: Intent Extraction
    const extractionPrompt = `
      Extract the historical Formula 1 scenario parameters from the following query.
      Query: "${query}"
      
      Respond EXACTLY in this JSON format, nothing else:
      {
        "driverSurname": "string (e.g. Verstappen, Hamilton)",
        "year": "number (e.g. 2021, 2023)",
        "raceName": "string (just the country/location, e.g. Spa, Abu Dhabi)",
        "originalPitLap": "number (guess if not provided, default 40)",
        "newPitLap": "number (extract from query, default 32)",
        "compound": "string ('SOFT', 'MEDIUM', 'HARD', default 'MEDIUM')"
      }
    `;

    const extractionResult = await model.generateContent(extractionPrompt);
    let extractedText = extractionResult.response.text().trim();
    
    // Clean up potential markdown formatting cleanly
    extractedText = extractedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    
    let intent;
    try {
      intent = JSON.parse(extractedText);
    } catch (e) {
      console.error("Failed to parse LLM JSON:", extractedText);
      return NextResponse.json({ error: "Could not understand the scenario parameters." }, { status: 400 });
    }

    // Step 2: Retrieval
    const db = getDb();
    
    // Find Race: search race name, circuit name, location, or country
    const racePattern = `%${intent.raceName}%`;
    const race = db.prepare(`
      SELECT r.raceId, r.name, r.year 
      FROM races r
      LEFT JOIN circuits c ON r.circuitId = c.circuitId
      WHERE r.year = ? AND (c.location LIKE ? OR c.name LIKE ? OR r.name LIKE ? OR c.country LIKE ?)
      ORDER BY 
        CASE 
          WHEN c.location LIKE ? THEN 1 
          WHEN c.name LIKE ? THEN 2 
          WHEN r.name LIKE ? THEN 3 
          ELSE 4 
        END ASC
      LIMIT 1
    `).get(intent.year, racePattern, racePattern, racePattern, racePattern, racePattern, racePattern, racePattern) as any;
                   
    if (!race) {
      return NextResponse.json({ error: `Could not find a race matching ${intent.raceName} in ${intent.year}.` }, { status: 404 });
    }

    // Find Driver
    const driverRes = db.prepare(`
      SELECT res.positionOrder as position, res.time, res.milliseconds, d.forename, d.surname, res.driverId
      FROM results res
      JOIN drivers d ON res.driverId = d.driverId
      WHERE res.raceId = ? AND d.surname LIKE ?
      LIMIT 1
    `).get(race.raceId, `%${intent.driverSurname}%`) as any;

    if (!driverRes) {
      return NextResponse.json({ error: `Could not find ${intent.driverSurname} in the ${race.year} ${race.name}.` }, { status: 404 });
    }

    // Step 3: ML Inference
    let timeDeltaMs = 0;
    let newPosition = driverRes.position;

    // We only recalculate if the driver finished the race (has milliseconds)
    if (driverRes.milliseconds) {
      const tireModel = new TireDegradationModel();
      
      // Simulate difference in degradation (returns value in seconds, roughly)
      // We multiply by 1000 for ms, and scale by a factor to make it noticeable but realistic (e.g., 2.5)
      const rawDeltaSec = await tireModel.simulateTireDelta(intent.originalPitLap, intent.newPitLap, intent.compound);
      timeDeltaMs = Math.round(rawDeltaSec * 1000 * 2.5); 
      
      const newTotalMs = driverRes.milliseconds + timeDeltaMs;

      // Find new position
      const allResults = db.prepare(`
        SELECT positionOrder, milliseconds, driverId
        FROM results
        WHERE raceId = ? AND milliseconds IS NOT NULL
        ORDER BY milliseconds ASC
      `).all(race.raceId) as any[];

      // Sort with the modified time
      const modifiedResults = allResults.map(r => {
        if (r.driverId === driverRes.driverId) {
          return { ...r, milliseconds: newTotalMs };
        }
        return r;
      }).sort((a, b) => a.milliseconds - b.milliseconds);

      const foundIndex = modifiedResults.findIndex(r => r.driverId === driverRes.driverId);
      if (foundIndex !== -1) {
        newPosition = foundIndex + 1; // 1-indexed
      }
      
      tireModel.dispose();
    }

    // Step 4: Narrative Generation
    let mathSummary = `No time delta could be calculated because the driver didn't finish the race on the lead lap.`;
    let timeString = driverRes.time || "N/A";
    
    if (driverRes.milliseconds) {
      const deltaFormatted = (timeDeltaMs / 1000).toFixed(3);
      const sign = timeDeltaMs > 0 ? '+' : '';
      mathSummary = `The ML Tire Degradation model calculated a time delta of ${sign}${deltaFormatted} seconds. Their original position was P${driverRes.position}, and their simulated position is P${newPosition}.`;
      
      // Calculate a rough "new time" string for UI display
      const totalSeconds = (driverRes.milliseconds + timeDeltaMs) / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = (totalSeconds % 60).toFixed(3);
      timeString = `${hours > 0 ? hours + ':' : ''}${minutes < 10 && hours > 0 ? '0' : ''}${minutes}:${seconds.padStart(6, '0')}`;
    }

    const narrativePrompt = `
You are a premium, dramatic motorsports journalist. 
A fan asked this "What If?" scenario: "${query}"

Here are the Grounded Facts:
- Race: ${race.year} ${race.name}
- Driver: ${driverRes.forename} ${driverRes.surname}
- Original Result: P${driverRes.position} (Time: ${driverRes.time || 'DNF/Lapped'})

Here is the Mathematical Simulation Result:
- ${mathSummary}

Write a 2-3 paragraph dramatic narration of how this alternate reality plays out. 
Focus heavily on the mathematical truth provided by the simulation (e.g., if they lost 4 seconds and dropped 2 places, explain how those extra laps on old tires cost them).
Do not break character. Do not mention "The ML model says" — present it as the factual alternate history.
`;

    const narrativeResult = await model.generateContent(narrativePrompt);
    const narrative = narrativeResult.response.text();

    return NextResponse.json({
      original: {
        position: driverRes.position,
        time: driverRes.time,
      },
      simulated: {
        position: newPosition,
        time: timeString,
      },
      driverName: `${driverRes.forename} ${driverRes.surname}`,
      timeDeltaMs,
      narrative,
      intent
    });

  } catch (error: any) {
    console.error("What If API error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
