import { NextResponse } from 'next/server';
import { RaceData } from '@/lib/types';

export const revalidate = 10; // Cache the response for 10 seconds to avoid hitting OpenF1 limits

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionKey = searchParams.get('sessionKey') || 'latest';

  try {
    // We fetch positions, drivers, stints, intervals, and race control in parallel
    const [posRes, driversRes, stintsRes, intervalsRes] = await Promise.all([
      fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`),
      fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`),
      fetch(`https://api.openf1.org/v1/stints?session_key=${sessionKey}`),
      fetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`)
    ]);

    if (!posRes.ok) throw new Error('Failed to fetch position data');

    const [positions, drivers, stints, intervals] = await Promise.all([
      posRes.json(),
      driversRes.ok ? driversRes.json() : [],
      stintsRes.ok ? stintsRes.json() : [],
      intervalsRes.ok ? intervalsRes.json() : []
    ]);

    // Group by driver to get latest position
    const latestPositions = new Map<string, any>();
    positions.forEach((p: any) => {
      // OpenF1 returns an array of position records over time. We want the latest for each driver.
      // Often the API returns them chronologically, so overwriting gets the latest.
      latestPositions.set(p.driver_number, p);
    });

    // Group intervals
    const latestIntervals = new Map<string, any>();
    intervals.forEach((i: any) => {
      latestIntervals.set(i.driver_number, i);
    });

    // Get current stint per driver
    const currentStints = new Map<string, any>();
    stints.forEach((s: any) => {
      if (!currentStints.has(s.driver_number) || s.stint_number > currentStints.get(s.driver_number).stint_number) {
        currentStints.set(s.driver_number, s);
      }
    });

    // Get driver details
    const driverDetails = new Map<string, any>();
    drivers.forEach((d: any) => {
      driverDetails.set(d.driver_number, d);
    });

    // Compile into RaceData[]
    const raceData: RaceData[] = Array.from(latestPositions.values()).map(p => {
      const driver = driverDetails.get(p.driver_number);
      const stint = currentStints.get(p.driver_number);
      const interval = latestIntervals.get(p.driver_number);

      return {
        driver_id: p.driver_number.toString(),
        position: p.position,
        gap_to_leader: interval ? `+${interval.gap_to_leader}s` : '0.0s',
        last_lap: 'N/A', // OpenF1 laps endpoint is heavy, skipping for now
        tire_compound: stint?.compound || 'Unknown',
        drivers: driver ? {
          name: driver.full_name,
          series_id: 'f1'
        } : undefined
      };
    });

    // Sort by position
    raceData.sort((a, b) => a.position - b.position);

    return NextResponse.json(raceData);
  } catch (error) {
    console.error('OpenF1 proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}
