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
  name_acronym?: string;
  team_colour?: string;
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

interface OpenF1RaceControl {
  date: string;
  category: string;
  message: string;
  flag?: string;
  scope?: string;
  sector?: number;
  driver_number?: number;
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
    // Fetch positions, drivers, stints, intervals, and race control in parallel
    const [positions, drivers, stints, intervals, raceControl] = await Promise.all([
      safeFetch<OpenF1Position>(`https://api.openf1.org/v1/position?session_key=${sessionKey}`),
      safeFetch<OpenF1Driver>(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`),
      safeFetch<OpenF1Stint>(`https://api.openf1.org/v1/stints?session_key=${sessionKey}`),
      safeFetch<OpenF1Interval>(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`),
      safeFetch<OpenF1RaceControl>(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`)
    ]);

    // Parse race control notices
    let trackStatus = '1';
    let flagLabel = 'TRACK CLEAR';

    const sortedRaceControl = [...raceControl].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (let i = sortedRaceControl.length - 1; i >= 0; i--) {
      const rc = sortedRaceControl[i];
      const msgUpper = (rc.message || '').toUpperCase();
      const flagUpper = (rc.flag || '').toUpperCase();

      if (flagUpper === 'RED' || msgUpper.includes('RED FLAG')) {
        trackStatus = '5';
        flagLabel = 'RED FLAG';
        break;
      }
      if (msgUpper.includes('VIRTUAL SAFETY CAR DEPLOYED') || flagUpper === 'VSC') {
        trackStatus = '6';
        flagLabel = 'VSC ACTIVE';
        break;
      }
      if (msgUpper.includes('SAFETY CAR DEPLOYED') || flagUpper === 'SAFETY CAR') {
        trackStatus = '4';
        flagLabel = 'SAFETY CAR';
        break;
      }
      if (msgUpper.includes('SAFETY CAR IN THIS LAP') || msgUpper.includes('VIRTUAL SAFETY CAR ENDING') || flagUpper === 'CLEAR' || flagUpper === 'GREEN') {
        trackStatus = '1';
        flagLabel = 'TRACK CLEAR';
        break;
      }
      if (flagUpper === 'YELLOW' || flagUpper === 'DOUBLE YELLOW' || msgUpper.includes('YELLOW')) {
        trackStatus = '2';
        flagLabel = 'YELLOW FLAG';
        break;
      }
    }

    const recentBulletins = sortedRaceControl.slice(-10).reverse().map(rc => ({
      time: new Date(rc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: rc.message,
      flag: rc.flag || 'NOTICE',
      category: rc.category || 'RaceControl',
    }));

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({
        standings: [],
        session: {
          trackStatus: '1',
          flagLabel: 'TRACK CLEAR',
          bulletins: recentBulletins,
        }
      });
    }

    // Group by driver to get latest position chronologically
    const latestPositions = new Map<number, OpenF1Position>();
    positions.forEach((p: OpenF1Position) => {
      const existing = latestPositions.get(p.driver_number);
      if (!existing || new Date(p.date).getTime() >= new Date(existing.date).getTime()) {
        latestPositions.set(p.driver_number, p);
      }
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
      const acronym = driver?.name_acronym || p.driver_number.toString();

      return {
        driver_id: acronym,
        car_number: p.driver_number.toString(),
        position: p.position,
        gap_to_leader: p.position === 1 ? 'LEADER' : (interval?.gap_to_leader !== undefined ? `+${interval.gap_to_leader}s` : '--'),
        last_lap: 'LIVE',
        tire_compound: stint?.compound || 'Unknown',
        team_name: driver?.team_name,
        team_color: driver?.team_colour ? `#${driver.team_colour}` : undefined,
        drivers: driver ? {
          name: driver.full_name,
          series_id: 'f1'
        } : undefined
      };
    });

    // Sort by position
    raceData.sort((a, b) => a.position - b.position);

    return NextResponse.json({
      standings: raceData,
      session: {
        trackStatus,
        flagLabel,
        bulletins: recentBulletins,
      }
    });
  } catch (error) {
    console.error('OpenF1 proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}
