import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60; // Allow more time for fetches

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionKey: string }> }
) {
  const { sessionKey } = await params;
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get('driver_number') || '1' // Default to Verstappen

  try {
    // 1. Fetch laps for the requested driver, or fallback to any driver in this session
    let laps: any[] = []
    const requestedDriver = searchParams.get('driver_number')
    if (requestedDriver) {
      try {
        const lapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&driver_number=${requestedDriver}`)
        if (lapsRes.ok) {
          laps = await lapsRes.json()
        }
      } catch {
        // Fallback to all laps
      }
    }

    if (!Array.isArray(laps) || laps.length === 0) {
      const allLapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`)
      if (allLapsRes.ok) {
        laps = await allLapsRes.json()
      }
    }

    if (!Array.isArray(laps) || laps.length === 0) {
      return NextResponse.json({ error: 'No laps found for session' }, { status: 404 })
    }

    // 2. Find a valid fast lap to ensure a clean trace of the circuit
    const validLaps = laps.filter((l: any) => l.lap_duration && l.lap_duration > 50 && l.date_start)
    if (validLaps.length === 0) {
      return NextResponse.json({ error: 'No valid laps found' }, { status: 404 })
    }
    const bestLap = validLaps.sort((a: any, b: any) => a.lap_duration - b.lap_duration)[0]
    const lapDriver = String(bestLap.driver_number || driver)

    // 3. Define time window for the lap
    const start = new Date(bestLap.date_start).getTime()
    // Add 1 second buffer to ensure the loop closes
    const end = start + (bestLap.lap_duration + 1) * 1000 
    
    const startIso = new Date(start).toISOString()
    const endIso = new Date(end).toISOString()

    // 4. Fetch the location data for this exact lap and driver
    const queryParams = new URLSearchParams({
      session_key: sessionKey,
      driver_number: lapDriver,
      'date>=': startIso,
      'date<': endIso
    })

    const url = `https://api.openf1.org/v1/location?${queryParams.toString()}`
    const locRes = await fetch(url)
    if (!locRes.ok) {
      return NextResponse.json({ error: `OpenF1 location lookup returned status ${locRes.status}` }, { status: locRes.status === 429 ? 429 : 502 })
    }
    const locData = await locRes.json()

    if (!locData || locData.length === 0) {
      return NextResponse.json({ error: 'No location data found' }, { status: 404 })
    }

    // 5. Downsample by taking 1 in every 3 points to shrink payload size for real-time trace
    const points = locData
      .filter((_: unknown, i: number) => i % 3 === 0)
      .map((p: any) => ({
        x: p.x,
        y: p.y
      }))

    // Ensure it forms a closed loop
    if (points.length > 0) {
      points.push({ ...points[0] })
    }

    return NextResponse.json(points, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error fetching OpenF1 circuit path:', error)
    return NextResponse.json({ error: 'Failed to fetch circuit path' }, { status: 500 })
  }
}
