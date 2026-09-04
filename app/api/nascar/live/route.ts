import { NextRequest, NextResponse } from 'next/server'
import { RaceData } from '@/lib/types'

export const revalidate = 10 // Cache for 10 seconds, same strategy as F1

const NASCAR_SERIES_IDS: Record<string, number> = {
  'nascar': 1,
  'nascar-cup': 1,
  'nascar-xfinity': 2,
  'nascar-trucks': 3,
}

// NASCAR CDN live feed shape (per vehicle)
interface NascarVehicle {
  vehicle_number: string
  running_position: number
  delta: number
  last_lap_time: number
  last_lap_speed: number
  best_lap_time: number
  best_lap_speed: number
  laps_completed: number
  laps_led: Array<{ start_lap: number; end_lap: number }>
  starting_position: number
  vehicle_manufacturer: string
  status: number
  is_on_track: boolean
  is_on_dvp: boolean
  sponsor_name: string
  pit_stops: Array<{
    positions_gained_lossed: number
    pit_in_lap_count: number
    pit_out_elapsed_time: number
  }>
  driver: {
    driver_id: number
    full_name: string
    first_name: string
    last_name: string
    is_in_chase: boolean
  }
}

interface NascarLiveFeed {
  lap_number: number
  laps_in_race: number
  laps_to_go: number
  flag_state: number
  race_id: number
  series_id: number
  run_id: number
  run_name: string
  run_type: number
  track_id: number
  track_name: string
  track_length: number
  elapsed_time: number
  number_of_caution_laps: number
  number_of_caution_segments: number
  number_of_lead_changes: number
  number_of_leaders: number
  vehicles: NascarVehicle[]
  stage: {
    stage_num: number
    finish_at_lap: number
    laps_in_stage: number
  }
}

// Map NASCAR flag_state integers to readable labels
function getFlagLabel(flagState: number): string {
  switch (flagState) {
    case 1: return 'GREEN'
    case 2: return 'YELLOW'
    case 3: return 'RED'
    case 4: return 'CHECKERED'
    case 8: return 'WARM-UP'
    case 9: return 'NOT ACTIVE'
    default: return 'UNKNOWN'
  }
}

function getManufacturerName(abbr: string): string {
  switch (abbr) {
    case 'Chv': return 'Chevrolet'
    case 'Frd': return 'Ford'
    case 'Tyt': return 'Toyota'
    default: return abbr
  }
}

export async function GET(request: NextRequest) {
  const series = request.nextUrl.searchParams.get('series') || 'nascar-cup'
  const requestedSeriesId = NASCAR_SERIES_IDS[series]

  if (!requestedSeriesId) {
    return NextResponse.json({ error: 'Invalid NASCAR series requested' }, { status: 400 })
  }

  try {
    const response = await fetch('https://cf.nascar.com/live/feeds/live-feed.json', {
      next: { revalidate: 10 }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'NASCAR CDN unavailable' },
        { status: 502 }
      )
    }

    const feed: NascarLiveFeed = await response.json()

    if (feed.series_id !== requestedSeriesId) {
      return NextResponse.json(
        {
          error: 'Requested NASCAR series is not the active live feed',
          requestedSeries: series,
          activeSeriesId: feed.series_id,
        },
        { status: 404 }
      )
    }

    // Sort vehicles by running position
    const sortedVehicles = [...(feed.vehicles || [])]
      .filter((vehicle) => vehicle.running_position > 0 && vehicle.driver?.full_name)
      .sort((a, b) => a.running_position - b.running_position)

    const raceData: RaceData[] = sortedVehicles.map((v) => {
      // Format gap: leader gets "LEADER", others get "+{delta}s"
      let gap = 'LEADER'
      if (v.running_position > 1 && v.delta > 0) {
        gap = `+${v.delta.toFixed(3)}s`
      } else if (v.running_position > 1) {
        // delta 0 for cars that haven't started or are lapped
        gap = v.laps_completed > 0 ? `+${v.delta.toFixed(3)}s` : '--'
      }

      // Format last lap time as mm:ss.sss
      let lastLap = '--'
      if (v.last_lap_time > 0) {
        const totalSec = v.last_lap_time
        const mins = Math.floor(totalSec / 60)
        const secs = (totalSec % 60).toFixed(3)
        lastLap = mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${totalSec.toFixed(3)}s`
      }

      return {
        driver_id: v.vehicle_number,
        position: v.running_position,
        gap_to_leader: gap,
        last_lap: lastLap,
        tire_compound: getManufacturerName(v.vehicle_manufacturer),
        manufacturer: v.vehicle_manufacturer,
        drivers: {
          name: v.driver.full_name,
          series_id: series
        }
      }
    })

    return NextResponse.json({
      standings: raceData,
      session: {
        raceId: feed.race_id,
        seriesId: feed.series_id,
        runName: feed.run_name,
        trackName: feed.track_name,
        trackLength: feed.track_length,
        lapNumber: feed.lap_number,
        lapsInRace: feed.laps_in_race,
        lapsToGo: feed.laps_to_go,
        flagState: feed.flag_state,
        flagLabel: getFlagLabel(feed.flag_state),
        stage: feed.stage,
        cautionLaps: feed.number_of_caution_laps,
        cautionSegments: feed.number_of_caution_segments,
        leadChanges: feed.number_of_lead_changes,
        leaders: feed.number_of_leaders
      }
    })
  } catch (error) {
    console.error('NASCAR live feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch NASCAR live data' },
      { status: 500 }
    )
  }
}
