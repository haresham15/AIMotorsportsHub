import { NextRequest, NextResponse } from 'next/server'
import { getRaceStatus } from '@/lib/f1Parsers'

export const revalidate = 300 // Cache for 5 minutes

interface OpenF1Session {
  session_key: number
  session_name: string
  date_start: string
  date_end: string
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  country_key: number
  country_code: string
  country_name: string
  location: string
  gmt_offset: string
  year: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    // Fetch schedule from Jolpica (Ergast replacement)
    const jolpicaRes = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`)
    if (!jolpicaRes.ok) throw new Error('Failed to fetch from Jolpica')
    const jolpicaData = await jolpicaRes.json()
    const races = jolpicaData.MRData.RaceTable.Races

    // Fetch sessions from OpenF1 to get session keys
    const openF1Res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}`)
    const openF1Sessions: OpenF1Session[] = openF1Res.ok ? await openF1Res.json() : []

    const now = new Date()
    let currentRound = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rounds = races.map((race: any) => {
      const status = getRaceStatus(race, now)
      if (status === 'completed') {
        // If this race is completed, the current round is at least the next one
        const roundNum = parseInt(race.round)
        if (roundNum >= currentRound) {
          currentRound = Math.min(roundNum + 1, races.length)
        }
      } else if (status === 'live') {
        currentRound = parseInt(race.round)
      }

      // Try to find matching OpenF1 sessions for this round
      // OpenF1 groups sessions by meeting_key, so we find the Race session first to get the meeting_key
      const openF1RaceSession = openF1Sessions.find(s => 
        s.session_name === 'Race' && 
        (s.country_name === race.Circuit.Location.country || s.location === race.Circuit.Location.locality) &&
        new Date(s.date_start).toISOString().split('T')[0] === race.date
      )

      const meetingKey = openF1RaceSession?.meeting_key
      const roundSessions = meetingKey 
        ? openF1Sessions.filter(s => s.meeting_key === meetingKey)
        : []

      return {
        round: parseInt(race.round),
        name: race.raceName,
        circuitName: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        date: race.date,
        time: race.time,
        status,
        openF1MeetingKey: meetingKey,
        sessions: roundSessions.map(s => ({
          key: s.session_key,
          name: s.session_name,
          dateStart: s.date_start,
        })).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
      }
    })

    return NextResponse.json({ currentRound, rounds })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}
