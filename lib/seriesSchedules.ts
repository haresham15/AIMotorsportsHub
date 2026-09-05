import { Round, RoundSession } from './types';

export interface ScheduleData {
  currentRound: number;
  rounds: Round[];
  availableYears?: string[];
  note?: string;
}

/**
 * Standard session durations (in milliseconds) based on session type and series conventions.
 */
export function getSessionDurationMs(sessionName: string): number {
  const nameLower = (sessionName || '').toLowerCase();
  if (nameLower.includes('24 hour') || nameLower.includes('24h')) return 24 * 60 * 60 * 1000;
  if (nameLower.includes('6 hour') || nameLower.includes('6h')) return 6 * 60 * 60 * 1000;
  if (nameLower.includes('8 hour') || nameLower.includes('8h')) return 8 * 60 * 60 * 1000;
  if (nameLower.includes('endurance') || nameLower.includes('1812km') || nameLower.includes('1000km')) return 8 * 60 * 60 * 1000;
  if (nameLower.includes('sprint')) return 1.25 * 60 * 60 * 1000; // ~1.25 hours
  if (nameLower.includes('qualifying') || nameLower.includes('hyperpole') || nameLower.includes('shootout')) return 1.5 * 60 * 60 * 1000; // ~1.5 hours
  if (nameLower.includes('race') || nameLower.includes('grand prix') || nameLower.includes('feature') || nameLower.includes('e-prix') || nameLower.includes('eliminations')) {
    return 3 * 60 * 60 * 1000; // ~2.5 - 3 hours
  }
  return 1.25 * 60 * 60 * 1000; // Practice
}

/**
 * Checks whether a given session is currently live (in the middle of it).
 */
export function isSessionInProgress(session: RoundSession | null | undefined, customNowMs?: number): boolean {
  if (!session || !session.dateStart) return false;
  const startMs = new Date(session.dateStart).getTime();
  if (isNaN(startMs)) return false;
  const durationMs = getSessionDurationMs(session.name);
  const nowMs = customNowMs ?? Date.now();
  return nowMs >= startMs && nowMs <= (startMs + durationMs);
}

/**
 * Determines the most recent, active, or relevant session for a given round.
 * Prioritizes:
 * 1. A session currently IN PROGRESS (live / in the middle of it)
 * 2. The most recent session that has already started / completed (e.g. Sprint, Qualifying)
 * 3. The first upcoming session if none have started yet
 * 4. Fallback to Sprint, Qualifying, or Race in that round
 */
export function findMostRecentSession(round: Round | null | undefined, customNowMs?: number): RoundSession | null {
  if (!round || !round.sessions || round.sessions.length === 0) return null;

  const nowMs = customNowMs ?? Date.now();

  const analyzed = round.sessions.map((session) => {
    const startMs = new Date(session.dateStart).getTime();
    const durationMs = getSessionDurationMs(session.name);
    const endMs = !isNaN(startMs) ? startMs + durationMs : NaN;
    const isLive = !isNaN(startMs) && nowMs >= startMs && nowMs <= endMs;
    const isPast = !isNaN(endMs) && nowMs > endMs;
    const isStarted = !isNaN(startMs) && nowMs >= startMs;

    return {
      session,
      startMs,
      endMs,
      isLive,
      isPast,
      isStarted,
    };
  });

  // 1. If any session in this round is currently IN PROGRESS (middle of it), open it immediately
  const liveSession = analyzed.find((s) => s.isLive);
  if (liveSession) return liveSession.session;

  // 2. Look for the most recently started/completed session (e.g. Sprint that finished this afternoon,
  // or Qualifying from earlier today / yesterday, or completed Feature Race)
  const startedSessions = analyzed.filter((s) => s.isStarted).sort((a, b) => b.startMs - a.startMs);
  if (startedSessions.length > 0) {
    return startedSessions[0].session;
  }

  // 3. If no session has started yet in this round (future round):
  // Pick the first upcoming session chronologically (e.g. Practice 1, Qualifying, or Sprint)
  const upcomingSessions = analyzed.filter((s) => !isNaN(s.startMs) && s.startMs > nowMs).sort((a, b) => a.startMs - b.startMs);
  if (upcomingSessions.length > 0) {
    return upcomingSessions[0].session;
  }

  // 4. Fallback if dates are absent: prioritize Sprint, Qualifying, or Race
  return (
    round.sessions.find((s) => s.name.toLowerCase().includes('sprint')) ||
    round.sessions.find((s) => s.name.toLowerCase().includes('qualifying')) ||
    round.sessions.find((s) => s.name.toLowerCase().includes('race') || s.name.toLowerCase().includes('feature') || s.name.toLowerCase().includes('e-prix')) ||
    round.sessions[0]
  );
}

/**
 * Identifies the most relevant round across a championship schedule:
 * 1. A round with a session currently in progress (LIVE)
 * 2. The round whose session has started most recently (e.g. today or this weekend)
 * 3. The first upcoming round if the season hasn't started yet
 * 4. Fallback to currentRoundNum or latest completed round
 */
export function findCurrentOrRecentRound(
  rounds: Round[] | null | undefined,
  currentRoundNum?: number,
  customNowMs?: number
): Round | null {
  if (!rounds || rounds.length === 0) return null;

  const nowMs = customNowMs ?? Date.now();

  // 1. Check if any round has a session currently IN PROGRESS
  for (const round of rounds) {
    if (round.status === 'live') return round;
    if (round.sessions) {
      for (const session of round.sessions) {
        if (isSessionInProgress(session, nowMs)) {
          return round;
        }
      }
    }
  }

  // 2. Find the round with the most recently started session
  let mostRecentRound: Round | null = null;
  let mostRecentStartMs = -Infinity;

  for (const round of rounds) {
    if (round.sessions) {
      for (const session of round.sessions) {
        const startMs = new Date(session.dateStart).getTime();
        if (!isNaN(startMs) && startMs <= nowMs && startMs > mostRecentStartMs) {
          mostRecentStartMs = startMs;
          mostRecentRound = round;
        }
      }
    }
  }

  if (mostRecentRound) {
    return mostRecentRound;
  }

  // 3. If no session has started yet, find the first round with an upcoming session
  let nextUpcomingRound: Round | null = null;
  let nextUpcomingStartMs = Infinity;

  for (const round of rounds) {
    if (round.sessions) {
      for (const session of round.sessions) {
        const startMs = new Date(session.dateStart).getTime();
        if (!isNaN(startMs) && startMs > nowMs && startMs < nextUpcomingStartMs) {
          nextUpcomingStartMs = startMs;
          nextUpcomingRound = round;
        }
      }
    }
  }

  if (nextUpcomingRound) {
    return nextUpcomingRound;
  }

  // 4. Fallback: match currentRoundNum, or latest completed round, or rounds[0]
  if (currentRoundNum) {
    const match = rounds.find((r) => r.round === currentRoundNum);
    if (match) return match;
  }

  const completed = [...rounds].reverse().find((r) => r.status === 'completed');
  if (completed) return completed;

  return rounds[0];
}

/**
 * Pre-compiled championship calendars for categories without a direct open REST API (F2, F3, WEC, FE, GTWC, Top Fuel).
 */
export function getSeriesFallbackSchedule(series: string, year = '2025'): ScheduleData {
  const now = new Date();
  const yearNum = parseInt(year, 10) || 2025;

  let rawRounds: Array<{
    round: number;
    name: string;
    circuitName: string;
    country: string;
    month: number; // 1-12
    day: number;
    sessions: Array<{ name: string; dayOffset: number; hour: number }>;
  }> = [];

  switch (series) {
    case 'f2':
      rawRounds = [
        { round: 1, name: 'Sakhir F2 Round', circuitName: 'Sakhir', country: 'Bahrain', month: 3, day: 1, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 12 }] },
        { round: 2, name: 'Jeddah F2 Round', circuitName: 'Jeddah', country: 'Saudi Arabia', month: 3, day: 8, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 14 }, { name: 'Qualifying', dayOffset: -1, hour: 18 }, { name: 'Sprint Race', dayOffset: 0, hour: 17 }, { name: 'Feature Race', dayOffset: 1, hour: 15 }] },
        { round: 3, name: 'Melbourne F2 Round', circuitName: 'Melbourne', country: 'Australia', month: 3, day: 23, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: 'Sprint Race', dayOffset: 0, hour: 13 }, { name: 'Feature Race', dayOffset: 1, hour: 11 }] },
        { round: 4, name: 'Imola F2 Round', circuitName: 'Imola', country: 'Italy', month: 5, day: 18, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 5, name: 'Monaco F2 Round', circuitName: 'Monte Carlo', country: 'Monaco', month: 5, day: 25, sessions: [{ name: 'Free Practice', dayOffset: -2, hour: 15 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 9 }] },
        { round: 6, name: 'Barcelona F2 Round', circuitName: 'Catalunya', country: 'Spain', month: 6, day: 22, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 11 }] },
        { round: 7, name: 'Red Bull Ring F2 Round', circuitName: 'Spielberg', country: 'Austria', month: 6, day: 29, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 13 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 8, name: 'Silverstone F2 Round', circuitName: 'Silverstone', country: 'United Kingdom', month: 7, day: 6, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 13 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 9, name: 'Spa F2 Round', circuitName: 'Spa-Francorchamps', country: 'Belgium', month: 7, day: 27, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 10, name: 'Monza F2 Round', circuitName: 'Monza', country: 'Italy', month: 8, day: 31, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: -1, hour: 16 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
      ];
      break;

    case 'f3':
      rawRounds = [
        { round: 1, name: 'Sakhir F3 Round', circuitName: 'Sakhir', country: 'Bahrain', month: 3, day: 1, sessions: [{ name: 'Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 13 }, { name: 'Sprint Race', dayOffset: 0, hour: 12 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 2, name: 'Melbourne F3 Round', circuitName: 'Melbourne', country: 'Australia', month: 3, day: 23, sessions: [{ name: 'Practice', dayOffset: -1, hour: 8 }, { name: 'Qualifying', dayOffset: -1, hour: 12 }, { name: 'Sprint Race', dayOffset: 0, hour: 11 }, { name: 'Feature Race', dayOffset: 1, hour: 9 }] },
        { round: 3, name: 'Imola F3 Round', circuitName: 'Imola', country: 'Italy', month: 5, day: 18, sessions: [{ name: 'Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: 'Sprint Race', dayOffset: 0, hour: 10 }, { name: 'Feature Race', dayOffset: 1, hour: 8 }] },
        { round: 4, name: 'Monaco F3 Round', circuitName: 'Monte Carlo', country: 'Monaco', month: 5, day: 25, sessions: [{ name: 'Practice', dayOffset: -2, hour: 13 }, { name: 'Qualifying', dayOffset: -1, hour: 11 }, { name: 'Sprint Race', dayOffset: 0, hour: 10 }, { name: 'Feature Race', dayOffset: 1, hour: 8 }] },
        { round: 5, name: 'Barcelona F3 Round', circuitName: 'Catalunya', country: 'Spain', month: 6, day: 22, sessions: [{ name: 'Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: 'Sprint Race', dayOffset: 0, hour: 10 }, { name: 'Feature Race', dayOffset: 1, hour: 10 }] },
        { round: 6, name: 'Spa F3 Round', circuitName: 'Spa-Francorchamps', country: 'Belgium', month: 7, day: 27, sessions: [{ name: 'Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: 'Sprint Race', dayOffset: 0, hour: 9 }, { name: 'Feature Race', dayOffset: 1, hour: 8 }] },
        { round: 7, name: 'Monza F3 Finale', circuitName: 'Monza', country: 'Italy', month: 8, day: 31, sessions: [{ name: 'Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Sprint Race', dayOffset: 0, hour: 9 }, { name: 'Feature Race', dayOffset: 1, hour: 8 }] },
      ];
      break;

    case 'formula-e':
      rawRounds = [
        { round: 1, name: 'São Paulo E-Prix', circuitName: 'Interlagos', country: 'Brazil', month: 1, day: 11, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 14 }, { name: 'Qualifying', dayOffset: 0, hour: 11 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 15 }] },
        { round: 2, name: 'Mexico City E-Prix', circuitName: 'Mexico City', country: 'Mexico', month: 1, day: 18, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 15 }, { name: 'Qualifying', dayOffset: 0, hour: 10 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 14 }] },
        { round: 3, name: 'Miami E-Prix', circuitName: 'Miami', country: 'United States', month: 4, day: 12, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 16 }, { name: 'Qualifying', dayOffset: 0, hour: 11 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 15 }] },
        { round: 4, name: 'Monaco E-Prix', circuitName: 'Monte Carlo', country: 'Monaco', month: 5, day: 3, sessions: [{ name: 'Free Practice 1', dayOffset: 0, hour: 7 }, { name: 'Qualifying', dayOffset: 0, hour: 10 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 15 }] },
        { round: 5, name: 'Berlin E-Prix', circuitName: 'Spielberg', country: 'Germany', month: 5, day: 17, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 16 }, { name: 'Qualifying', dayOffset: 0, hour: 10 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 15 }] },
        { round: 6, name: 'Shanghai E-Prix', circuitName: 'Shanghai', country: 'China', month: 5, day: 31, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 14 }, { name: 'Qualifying', dayOffset: 0, hour: 9 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 14 }] },
        { round: 7, name: 'London E-Prix Finale', circuitName: 'Silverstone', country: 'United Kingdom', month: 7, day: 26, sessions: [{ name: 'Free Practice 1', dayOffset: -1, hour: 16 }, { name: 'Qualifying', dayOffset: 0, hour: 12 }, { name: 'E-Prix (Race)', dayOffset: 0, hour: 17 }] },
      ];
      break;

    case 'wec':
      rawRounds = [
        { round: 1, name: 'Qatar 1812 KM', circuitName: 'Lusail', country: 'Qatar', month: 2, day: 28, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 15 }, { name: 'Qatar 1812 KM Race', dayOffset: 0, hour: 11 }] },
        { round: 2, name: '6 Hours of Imola', circuitName: 'Imola', country: 'Italy', month: 4, day: 20, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 14 }, { name: '6 Hours of Imola Race', dayOffset: 0, hour: 13 }] },
        { round: 3, name: '6 Hours of Spa-Francorchamps', circuitName: 'Spa-Francorchamps', country: 'Belgium', month: 5, day: 10, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 14 }, { name: '6 Hours of Spa Race', dayOffset: 0, hour: 13 }] },
        { round: 4, name: '24 Hours of Le Mans', circuitName: 'Circuit de la Sarthe', country: 'France', month: 6, day: 14, sessions: [{ name: 'Practice', dayOffset: -2, hour: 14 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 20 }, { name: '24 Hours of Le Mans Race', dayOffset: 0, hour: 16 }] },
        { round: 5, name: '6 Hours of São Paulo', circuitName: 'Interlagos', country: 'Brazil', month: 7, day: 13, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: '6 Hours of São Paulo Race', dayOffset: 0, hour: 11 }] },
        { round: 6, name: 'Lone Star Le Mans (COTA)', circuitName: 'Austin', country: 'United States', month: 9, day: 7, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 15 }, { name: 'Lone Star Le Mans Race', dayOffset: 0, hour: 13 }] },
        { round: 7, name: '8 Hours of Bahrain', circuitName: 'Sakhir', country: 'Bahrain', month: 11, day: 8, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying & Hyperpole', dayOffset: -1, hour: 16 }, { name: '8 Hours of Bahrain Race', dayOffset: 0, hour: 14 }] },
      ];
      break;

    case 'gt-world-challenge':
      rawRounds = [
        { round: 1, name: 'GTWC Paul Ricard 1000km', circuitName: 'Monza', country: 'France', month: 4, day: 12, sessions: [{ name: 'Free Practice', dayOffset: -1, hour: 9 }, { name: 'Qualifying', dayOffset: -1, hour: 14 }, { name: '1000km Endurance Race', dayOffset: 0, hour: 18 }] },
        { round: 2, name: 'GTWC Brands Hatch Sprint', circuitName: 'Silverstone', country: 'United Kingdom', month: 5, day: 4, sessions: [{ name: 'Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying', dayOffset: 0, hour: 9 }, { name: 'Sprint Race 1', dayOffset: 0, hour: 12 }, { name: 'Sprint Race 2', dayOffset: 0, hour: 16 }] },
        { round: 3, name: 'CrowdStrike 24 Hours of Spa', circuitName: 'Spa-Francorchamps', country: 'Belgium', month: 6, day: 28, sessions: [{ name: 'Pre-Qualifying', dayOffset: -2, hour: 15 }, { name: 'Superpole Qualifying', dayOffset: -1, hour: 16 }, { name: '24 Hours of Spa Race', dayOffset: 0, hour: 16 }] },
        { round: 4, name: 'GTWC Nürburgring Sprint', circuitName: 'Spielberg', country: 'Germany', month: 8, day: 30, sessions: [{ name: 'Practice', dayOffset: -1, hour: 11 }, { name: 'Qualifying', dayOffset: 0, hour: 9 }, { name: 'Sprint Race', dayOffset: 0, hour: 14 }] },
        { round: 5, name: 'GTWC Barcelona Finale', circuitName: 'Catalunya', country: 'Spain', month: 10, day: 11, sessions: [{ name: 'Practice', dayOffset: -1, hour: 10 }, { name: 'Qualifying', dayOffset: -1, hour: 15 }, { name: 'Endurance Finale Race', dayOffset: 0, hour: 15 }] },
      ];
      break;

    case 'top-fuel':
    default:
      rawRounds = [
        { round: 1, name: 'NHRA Gatornationals', circuitName: 'Drag Strip', country: 'USA', month: 3, day: 8, sessions: [{ name: 'Qualifying Session 1', dayOffset: -1, hour: 13 }, { name: 'Qualifying Session 2', dayOffset: -1, hour: 16 }, { name: 'Final Eliminations', dayOffset: 0, hour: 12 }] },
        { round: 2, name: 'NHRA Arizona Nationals', circuitName: 'Drag Strip', country: 'USA', month: 3, day: 22, sessions: [{ name: 'Qualifying Session 1', dayOffset: -1, hour: 13 }, { name: 'Qualifying Session 2', dayOffset: -1, hour: 16 }, { name: 'Final Eliminations', dayOffset: 0, hour: 12 }] },
        { round: 3, name: 'NHRA 4-Wide Nationals', circuitName: 'Drag Strip', country: 'USA', month: 4, day: 12, sessions: [{ name: 'Qualifying Session 1', dayOffset: -1, hour: 14 }, { name: 'Qualifying Session 2', dayOffset: -1, hour: 17 }, { name: 'Final Eliminations', dayOffset: 0, hour: 13 }] },
        { round: 4, name: 'NHRA Thunder Valley Nationals', circuitName: 'Drag Strip', country: 'USA', month: 6, day: 7, sessions: [{ name: 'Qualifying Session 1', dayOffset: -1, hour: 14 }, { name: 'Qualifying Session 2', dayOffset: -1, hour: 18 }, { name: 'Final Eliminations', dayOffset: 0, hour: 12 }] },
        { round: 5, name: 'NHRA U.S. Nationals', circuitName: 'Drag Strip', country: 'USA', month: 8, day: 31, sessions: [{ name: 'Qualifying Session 1', dayOffset: -2, hour: 15 }, { name: 'Qualifying Session 2', dayOffset: -1, hour: 15 }, { name: 'Final Eliminations', dayOffset: 0, hour: 11 }] },
      ];
      break;
  }

  let currentRound = 1;

  const rounds: Round[] = rawRounds.map((r, rIdx) => {
    // Generate ISO timestamp
    const dateStr = `${yearNum}-${String(r.month).padStart(2, '0')}-${String(r.day).padStart(2, '0')}`;
    const raceStart = new Date(`${dateStr}T14:00:00Z`);
    const raceEnd = new Date(raceStart.getTime() + 4 * 60 * 60 * 1000);

    let status: 'upcoming' | 'live' | 'completed' = 'upcoming';
    if (now > raceEnd) {
      status = 'completed';
      if (r.round >= currentRound) {
        currentRound = Math.min(r.round + 1, rawRounds.length);
      }
    } else if (now >= new Date(raceStart.getTime() - 2 * 24 * 60 * 60 * 1000)) {
      status = 'live';
      currentRound = r.round;
    }

    const sessions: RoundSession[] = r.sessions.map((s, sIdx) => {
      const sDate = new Date(raceStart);
      sDate.setDate(sDate.getDate() + s.dayOffset);
      sDate.setUTCHours(s.hour, 0, 0, 0);

      return {
        key: r.round * 100 + sIdx + 1,
        name: s.name,
        dateStart: sDate.toISOString(),
      };
    });

    return {
      round: r.round,
      name: r.name,
      circuitName: r.circuitName,
      country: r.country,
      date: dateStr,
      time: '14:00:00Z',
      status,
      sessions,
    };
  });

  return {
    currentRound,
    rounds,
    availableYears: ['2025', '2024'],
  };
}
