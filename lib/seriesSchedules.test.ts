import { describe, expect, it } from 'vitest'
import {
  getSessionDurationMs,
  isSessionInProgress,
  isSessionCompleted,
  findMostRecentSession,
  findCurrentOrRecentRound,
  getSeriesFallbackSchedule,
} from './seriesSchedules'
import { Round } from './types'

describe('seriesSchedules engine', () => {
  it('correctly calculates session durations', () => {
    expect(getSessionDurationMs('24 Hours of Le Mans')).toBe(24 * 3600 * 1000)
    expect(getSessionDurationMs('6 Hours of Spa')).toBe(6 * 3600 * 1000)
    expect(getSessionDurationMs('Grand Prix Race')).toBe(3 * 3600 * 1000)
    expect(getSessionDurationMs('Sprint Race')).toBe(1.25 * 3600 * 1000)
    expect(getSessionDurationMs('Qualifying')).toBe(1.5 * 3600 * 1000)
    expect(getSessionDurationMs('Practice 1')).toBe(1.25 * 3600 * 1000)
  })

  it('detects when a session is in progress (in the middle of it)', () => {
    const baseTime = new Date('2025-06-28T14:00:00Z').getTime()
    const session = {
      name: 'Sprint Race',
      dateStart: new Date(baseTime).toISOString(),
      key: 101,
    }

    // 10 minutes before start: not in progress
    expect(isSessionInProgress(session, baseTime - 10 * 60 * 1000)).toBe(false)
    // 30 minutes into Sprint: in progress
    expect(isSessionInProgress(session, baseTime + 30 * 60 * 1000)).toBe(true)
    // 2 hours after start (Sprint duration is 1.25h): finished
    expect(isSessionInProgress(session, baseTime + 2 * 3600 * 1000)).toBe(false)
  })

  it('detects when a session or race is done / completed', () => {
    const baseTime = new Date('2025-06-28T14:00:00Z').getTime()
    const session = {
      name: 'Grand Prix Race',
      dateStart: new Date(baseTime).toISOString(),
      key: 102,
    }

    // While in progress: not completed
    expect(isSessionCompleted(session, 'in_progress', baseTime + 30 * 60 * 1000)).toBe(false)
    // Explicit completed status: completed
    expect(isSessionCompleted(session, 'completed', baseTime + 30 * 60 * 1000)).toBe(true)
    // 4 hours after start (GP duration 3h): completed
    expect(isSessionCompleted(session, undefined, baseTime + 4 * 3600 * 1000)).toBe(true)
  })


  it('findMostRecentSession picks the session that is currently live', () => {
    const base = new Date('2025-07-05T10:00:00Z').getTime()
    const round: Round = {
      round: 10,
      name: 'British Grand Prix',
      circuitName: 'Silverstone',
      country: 'UK',
      date: '2025-07-06',
      time: '14:00:00Z',
      status: 'upcoming',
      sessions: [
        { name: 'Practice 1', dateStart: new Date(base).toISOString(), key: 1 },
        { name: 'Sprint Qualifying', dateStart: new Date(base + 4 * 3600 * 1000).toISOString(), key: 2 },
        { name: 'Sprint', dateStart: new Date(base + 24 * 3600 * 1000).toISOString(), key: 3 },
        { name: 'Race', dateStart: new Date(base + 48 * 3600 * 1000).toISOString(), key: 4 },
      ]
    }

    // Currently in the middle of Sprint Qualifying (20 min after start)
    const testNow = base + 4 * 3600 * 1000 + 20 * 60 * 1000
    const chosen = findMostRecentSession(round, testNow)
    expect(chosen?.key).toBe(2)
    expect(chosen?.name).toBe('Sprint Qualifying')
  })

  it('findMostRecentSession picks the completed Sprint instead of Sunday Race on Saturday night', () => {
    const base = new Date('2025-07-05T10:00:00Z').getTime()
    const round: Round = {
      round: 10,
      name: 'Austrian Grand Prix',
      circuitName: 'Red Bull Ring',
      country: 'Austria',
      date: '2025-07-06',
      time: '14:00:00Z',
      status: 'upcoming',
      sessions: [
        { name: 'Practice 1', dateStart: new Date(base).toISOString(), key: 1 },
        { name: 'Qualifying', dateStart: new Date(base + 4 * 3600 * 1000).toISOString(), key: 2 },
        { name: 'Sprint', dateStart: new Date(base + 24 * 3600 * 1000).toISOString(), key: 3 },
        { name: 'Race', dateStart: new Date(base + 48 * 3600 * 1000).toISOString(), key: 4 },
      ]
    }

    // Saturday evening: Sprint finished 3 hours ago, Sunday Race is tomorrow
    const saturdayEvening = base + 24 * 3600 * 1000 + 3 * 3600 * 1000
    const chosen = findMostRecentSession(round, saturdayEvening)
    expect(chosen?.key).toBe(3)
    expect(chosen?.name).toBe('Sprint')
  })

  it('findMostRecentSession picks the first session if none have started yet', () => {
    const base = new Date('2025-09-01T10:00:00Z').getTime()
    const round: Round = {
      round: 15,
      name: 'Monza Grand Prix',
      circuitName: 'Monza',
      country: 'Italy',
      date: '2025-09-07',
      time: '14:00:00Z',
      status: 'upcoming',
      sessions: [
        { name: 'Practice 1', dateStart: new Date(base + 48 * 3600 * 1000).toISOString(), key: 1 },
        { name: 'Qualifying', dateStart: new Date(base + 52 * 3600 * 1000).toISOString(), key: 2 },
        { name: 'Race', dateStart: new Date(base + 72 * 3600 * 1000).toISOString(), key: 3 },
      ]
    }

    const testNow = base
    const chosen = findMostRecentSession(round, testNow)
    expect(chosen?.key).toBe(1)
  })

  it('findCurrentOrRecentRound identifies round with live or most recently started session', () => {
    const t1 = new Date('2025-05-01T10:00:00Z').getTime()
    const t2 = new Date('2025-05-15T10:00:00Z').getTime()
    const t3 = new Date('2025-05-29T10:00:00Z').getTime()

    const rounds: Round[] = [
      {
        round: 1,
        name: 'Round 1',
        circuitName: 'Imola',
        country: 'Italy',
        date: '2025-05-02',
        time: '14:00:00Z',
        status: 'completed',
        sessions: [{ name: 'Race', dateStart: new Date(t1).toISOString(), key: 101 }]
      },
      {
        round: 2,
        name: 'Round 2',
        circuitName: 'Monaco',
        country: 'Monaco',
        date: '2025-05-16',
        time: '14:00:00Z',
        status: 'upcoming',
        sessions: [
          { name: 'Qualifying', dateStart: new Date(t2).toISOString(), key: 201 },
          { name: 'Race', dateStart: new Date(t2 + 24 * 3600 * 1000).toISOString(), key: 202 }
        ]
      },
      {
        round: 3,
        name: 'Round 3',
        circuitName: 'Catalunya',
        country: 'Spain',
        date: '2025-05-30',
        time: '14:00:00Z',
        status: 'upcoming',
        sessions: [{ name: 'Race', dateStart: new Date(t3).toISOString(), key: 301 }]
      },
    ]

    // While Round 2 Qualifying is in progress
    const nowLive = t2 + 30 * 60 * 1000
    const liveRound = findCurrentOrRecentRound(rounds, 1, nowLive)
    expect(liveRound?.round).toBe(2)

    // After Round 2 completed, before Round 3
    const nowBetween = t2 + 48 * 3600 * 1000
    const recentRound = findCurrentOrRecentRound(rounds, 1, nowBetween)
    expect(recentRound?.round).toBe(2)

    // Before Round 1 starts
    const nowBefore = t1 - 48 * 3600 * 1000
    const upcomingRound = findCurrentOrRecentRound(rounds, 1, nowBefore)
    expect(upcomingRound?.round).toBe(1)
  })

  it('provides complete championship schedules for non-open API series', () => {
    const f2 = getSeriesFallbackSchedule('f2', '2025')
    expect(f2.rounds.length).toBeGreaterThanOrEqual(10)
    expect(f2.rounds[0].sessions.some(s => s.name.includes('Sprint'))).toBe(true)

    const wec = getSeriesFallbackSchedule('wec', '2025')
    expect(wec.rounds.some(r => r.name.includes('Le Mans'))).toBe(true)

    const fe = getSeriesFallbackSchedule('formula-e', '2025')
    expect(fe.rounds.some(r => r.name.includes('E-Prix'))).toBe(true)

    const topFuel = getSeriesFallbackSchedule('top-fuel', '2025')
    expect(topFuel.rounds.some(r => r.name.includes('Gatornationals'))).toBe(true)
  })
})
