import { NextResponse } from 'next/server';
import { RaceData } from '@/lib/types';

export const revalidate = 10; // Cache the response for 10 seconds to avoid hitting OpenF1 limits

// Define OpenF1 response interfaces
interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
}

interface OpenF1Driver {
  driver_number: number;
  full_name: string;
  team_name: string;
}

interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  compound: string;
}

interface OpenF1Interval {
  driver_number: number;
  gap_to_leader: number;
}

async function safeFetch<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.warn(`Error fetching ${url}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionKey = searchParams.get('sessionKey') || 'latest';

  try {
    // We fetch positions, drivers, stints, intervals, and race control in parallel
    // Using safeFetch for secondary data to prevent total failure if one endpoint goes down
    const [positions, drivers, stints, intervals] = await Promise.all([
      fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`).then(res => res.json()), // Critical
      safeFetch<OpenF1Driver>(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`),
      safeFetch<OpenF1Stint>(`https://api.openf1.org/v1/stints?session_key=${sessionKey}`),
      safeFetch<OpenF1Interval>(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`)
    ]);

    // Group by driver to get latest position
    const latestPositions = new Map<number, OpenF1Position>();
    positions.forEach((p: OpenF1Position) => {
      // OpenF1 returns an array of position records over time. We want the latest for each driver.
      latestPositions.set(p.driver_number, p);
    });

    // Group intervals
    const latestIntervals = new Map<number, OpenF1Interval>();
    intervals.forEach((i: OpenF1Interval) => {
      latestIntervals.set(i.driver_number, i);
    });

    // Get current stint per driver
    const currentStints = new Map<number, OpenF1Stint>();
    stints.forEach((s: OpenF1Stint) => {
      const existing = currentStints.get(s.driver_number);
      if (!existing || s.stint_number > existing.stint_number) {
        currentStints.set(s.driver_number, s);
      }
    });

    // Get driver details
    const driverDetails = new Map<number, OpenF1Driver>();
    drivers.forEach((d: OpenF1Driver) => {
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
