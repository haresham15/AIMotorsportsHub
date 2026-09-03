import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 3600

const SUPPORTED_YEARS = ['2025']

const NASCAR_SERIES: Record<string, { id: number; label: string; raceCount: number }> = {
  'nascar-cup': { id: 1, label: 'NASCAR Cup Series', raceCount: 36 },
  'nascar-xfinity': { id: 2, label: 'NASCAR Xfinity Series', raceCount: 33 },
  'nascar-trucks': { id: 3, label: 'NASCAR Craftsman Truck Series', raceCount: 23 },
}

const NASCAR_CUP_2025 = [
  { round: 1, name: 'Cook Out Clash', track: 'Bowman Gray Stadium', city: 'Winston-Salem', state: 'NC', date: '2025-02-02', raceId: 5600 },
  { round: 2, name: 'Daytona 500', track: 'Daytona International Speedway', city: 'Daytona Beach', state: 'FL', date: '2025-02-16', raceId: 5601 },
  { round: 3, name: 'Ambetter Health 400', track: 'Atlanta Motor Speedway', city: 'Hampton', state: 'GA', date: '2025-02-23', raceId: 5602 },
  { round: 4, name: 'Pennzoil 400', track: 'Las Vegas Motor Speedway', city: 'Las Vegas', state: 'NV', date: '2025-03-02', raceId: 5603 },
  { round: 5, name: "Shriners Children's 500", track: 'Phoenix Raceway', city: 'Avondale', state: 'AZ', date: '2025-03-09', raceId: 5604 },
  { round: 6, name: 'Food City 500', track: 'Bristol Motor Speedway', city: 'Bristol', state: 'TN', date: '2025-03-16', raceId: 5605 },
  { round: 7, name: 'EchoPark Automotive Grand Prix', track: 'Circuit of the Americas', city: 'Austin', state: 'TX', date: '2025-03-23', raceId: 5606 },
  { round: 8, name: 'Toyota Owners 400', track: 'Richmond Raceway', city: 'Richmond', state: 'VA', date: '2025-03-30', raceId: 5607 },
  { round: 9, name: 'GEICO 500', track: 'Talladega Superspeedway', city: 'Talladega', state: 'AL', date: '2025-04-06', raceId: 5608 },
  { round: 10, name: 'AutoTrader EchoPark 400', track: 'Texas Motor Speedway', city: 'Fort Worth', state: 'TX', date: '2025-04-13', raceId: 5609 },
  { round: 11, name: 'Wurth 400', track: 'Dover Motor Speedway', city: 'Dover', state: 'DE', date: '2025-04-27', raceId: 5610 },
  { round: 12, name: 'AdventHealth 400', track: 'Kansas Speedway', city: 'Kansas City', state: 'KS', date: '2025-05-04', raceId: 5611 },
  { round: 13, name: 'Goodyear 400', track: 'Darlington Raceway', city: 'Darlington', state: 'SC', date: '2025-05-11', raceId: 5612 },
  { round: 14, name: 'All-Star Race', track: 'North Wilkesboro Speedway', city: 'North Wilkesboro', state: 'NC', date: '2025-05-18', raceId: 5613 },
  { round: 15, name: 'Coca-Cola 600', track: 'Charlotte Motor Speedway', city: 'Concord', state: 'NC', date: '2025-05-25', raceId: 5614 },
  { round: 16, name: 'Enjoy Illinois 300', track: 'World Wide Technology Raceway', city: 'Madison', state: 'IL', date: '2025-06-01', raceId: 5615 },
  { round: 17, name: 'Toyota / Save Mart 350', track: 'Sonoma Raceway', city: 'Sonoma', state: 'CA', date: '2025-06-08', raceId: 5616 },
  { round: 18, name: 'Iowa Corn 350', track: 'Iowa Speedway', city: 'Newton', state: 'IA', date: '2025-06-15', raceId: 5617 },
  { round: 19, name: 'USA TODAY 301', track: 'New Hampshire Motor Speedway', city: 'Loudon', state: 'NH', date: '2025-06-22', raceId: 5618 },
  { round: 20, name: 'Grant Park 165', track: 'Chicago Street Course', city: 'Chicago', state: 'IL', date: '2025-07-06', raceId: 5619 },
  { round: 21, name: 'Quaker State 400', track: 'Atlanta Motor Speedway', city: 'Hampton', state: 'GA', date: '2025-07-13', raceId: 5620 },
  { round: 22, name: 'Brickyard 400', track: 'Indianapolis Motor Speedway', city: 'Indianapolis', state: 'IN', date: '2025-07-20', raceId: 5621 },
  { round: 23, name: 'Crayon 301', track: 'Pocono Raceway', city: 'Long Pond', state: 'PA', date: '2025-07-27', raceId: 5622 },
  { round: 24, name: 'FireKeepers Casino 400', track: 'Michigan International Speedway', city: 'Brooklyn', state: 'MI', date: '2025-08-10', raceId: 5623 },
  { round: 25, name: 'Go Bowling at The Glen', track: 'Watkins Glen International', city: 'Watkins Glen', state: 'NY', date: '2025-08-17', raceId: 5624 },
  { round: 26, name: 'Coke Zero Sugar 400', track: 'Daytona International Speedway', city: 'Daytona Beach', state: 'FL', date: '2025-08-23', raceId: 5625 },
  { round: 27, name: 'Cook Out Southern 500', track: 'Darlington Raceway', city: 'Darlington', state: 'SC', date: '2025-08-31', raceId: 5626 },
  { round: 28, name: 'Quaker State 400', track: 'Atlanta Motor Speedway', city: 'Hampton', state: 'GA', date: '2025-09-07', raceId: 5627 },
  { round: 29, name: 'Bass Pro Shops Night Race', track: 'Bristol Motor Speedway', city: 'Bristol', state: 'TN', date: '2025-09-13', raceId: 5628 },
  { round: 30, name: 'Hollywood Casino 400', track: 'Kansas Speedway', city: 'Kansas City', state: 'KS', date: '2025-09-21', raceId: 5629 },
  { round: 31, name: 'YellaWood 500', track: 'Talladega Superspeedway', city: 'Talladega', state: 'AL', date: '2025-09-28', raceId: 5630 },
  { round: 32, name: 'Bank of America ROVAL 400', track: 'Charlotte Motor Speedway ROVAL', city: 'Concord', state: 'NC', date: '2025-10-05', raceId: 5631 },
  { round: 33, name: 'South Point 400', track: 'Las Vegas Motor Speedway', city: 'Las Vegas', state: 'NV', date: '2025-10-19', raceId: 5632 },
  { round: 34, name: 'Straight Talk Wireless 400', track: 'Homestead-Miami Speedway', city: 'Homestead', state: 'FL', date: '2025-10-26', raceId: 5633 },
  { round: 35, name: 'Xfinity 500', track: 'Martinsville Speedway', city: 'Ridgeway', state: 'VA', date: '2025-11-02', raceId: 5634 },
  { round: 36, name: 'NASCAR Cup Series Championship', track: 'Phoenix Raceway', city: 'Avondale', state: 'AZ', date: '2025-11-09', raceId: 5635 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = searchParams.get('year') || '2025'
  const rawSeries = searchParams.get('series') || 'nascar-cup'
  const series = rawSeries === 'nascar' ? 'nascar-cup' : rawSeries
  const seriesInfo = NASCAR_SERIES[series]

  if (!seriesInfo) {
    return NextResponse.json({ error: 'Invalid NASCAR series requested' }, { status: 400 })
  }

  try {
    const now = new Date()
    let currentRound = 1

    if (!SUPPORTED_YEARS.includes(year)) {
      return NextResponse.json({
        currentRound,
        rounds: [],
        year,
        availableYears: SUPPORTED_YEARS,
        note: 'NASCAR schedule data is currently available for 2025 only.',
      })
    }

    const calendar = NASCAR_CUP_2025.slice(0, seriesInfo.raceCount)

    const rounds = calendar.map((race) => {
      const raceDate = new Date(`${race.date}T19:00:00Z`)
      const raceEnd = new Date(raceDate.getTime() + 5 * 60 * 60 * 1000)

      let status: 'upcoming' | 'live' | 'completed' = 'upcoming'
      if (now > raceEnd) {
        status = 'completed'
        if (race.round >= currentRound) {
          currentRound = Math.min(race.round + 1, calendar.length)
        }
      } else if (now >= raceDate) {
        status = 'live'
        currentRound = race.round
      }

      const raceName = series === 'nascar-cup'
        ? race.name
        : `${seriesInfo.label} at ${race.track}`

      return {
        round: race.round,
        name: raceName,
        circuitName: race.track,
        country: `${race.city}, ${race.state}`,
        date: race.date,
        time: '19:00:00Z',
        status,
        nascarRaceId: series === 'nascar-cup' ? race.raceId : undefined,
        sessions: [
          { key: seriesInfo.id * 100000 + race.round * 10 + 1, name: 'Practice', dateStart: `${race.date}T14:00:00Z` },
          { key: seriesInfo.id * 100000 + race.round * 10 + 2, name: 'Qualifying', dateStart: `${race.date}T16:00:00Z` },
          { key: seriesInfo.id * 100000 + race.round * 10 + 3, name: 'Race', dateStart: `${race.date}T19:00:00Z` },
        ],
      }
    })

    let liveSessionInfo = null
    try {
      const liveRes = await fetch('https://cf.nascar.com/live/feeds/live-feed.json', {
        next: { revalidate: 60 },
      })
      if (liveRes.ok) {
        const liveFeed = await liveRes.json()
        if (liveFeed.series_id === seriesInfo.id) {
          liveSessionInfo = {
            raceId: liveFeed.race_id,
            runName: liveFeed.run_name,
            trackName: liveFeed.track_name,
            seriesId: liveFeed.series_id,
            lapNumber: liveFeed.lap_number,
            flagState: liveFeed.flag_state,
          }
        }
      }
    } catch {
      // Schedule data is still usable when live metadata is unavailable.
    }

    return NextResponse.json({
      currentRound,
      rounds,
      liveSession: liveSessionInfo,
      year,
      availableYears: SUPPORTED_YEARS,
    })
  } catch (error) {
    console.error('Error building NASCAR schedule:', error)
    return NextResponse.json({ error: 'Failed to build NASCAR schedule' }, { status: 500 })
  }
}
