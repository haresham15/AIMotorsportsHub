import type { LiveSessionData, RaceData, TrackStatus } from '@/lib/types'

type UnknownRecord = Record<string, unknown>

export interface NormalizedAlKamelFeed {
  session: LiveSessionData
  standings: RaceData[]
}

const ACTIVE_POLL_INTERVAL_MS = 1_000
const IDLE_POLL_INTERVAL_MS = 60_000

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null
}

function readValue(record: UnknownRecord, aliases: string[]): unknown {
  for (const alias of aliases) {
    const direct = record[alias]
    if (direct !== undefined && direct !== null && direct !== '') return direct

    const key = Object.keys(record).find((candidate) => candidate.toLowerCase() === alias.toLowerCase())
    if (key && record[key] !== undefined && record[key] !== null && record[key] !== '') return record[key]
  }
  return undefined
}

function readString(record: UnknownRecord, aliases: string[], fallback = ''): string {
  const value = readValue(record, aliases)
  return value === undefined ? fallback : String(value).trim()
}

function readNumber(record: UnknownRecord, aliases: string[]): number | undefined {
  const value = readValue(record, aliases)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const parsed = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseTimingMilliseconds(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) && value >= 1_000 ? value : Math.round(value * 1_000)
  }
  if (typeof value !== 'string') return undefined

  const timing = value.trim().replace(/^\+/, '')
  if (!timing || timing === '-' || timing === '--') return undefined

  const parts = timing.split(':')
  if (parts.length > 3 || parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))) return undefined

  let seconds = 0
  for (const part of parts) seconds = seconds * 60 + Number(part)
  return Number.isFinite(seconds) ? Math.round(seconds * 1_000) : undefined
}

export function normalizeTrackStatus(value: unknown): TrackStatus {
  const status = String(value ?? '').trim().toUpperCase().replace(/[\s_-]+/g, '')
  if (['GREEN', 'TRACKCLEAR', 'RACING'].includes(status)) return 'GREEN'
  if (['YELLOW', 'FCY', 'FULLCOURSEYELLOW', 'SC', 'SAFETYCAR'].includes(status)) return 'YELLOW'
  if (['RED', 'REDFLAG', 'SUSPENDED'].includes(status)) return 'RED'
  if (['CHEQUERED', 'CHECKERED', 'FINISHED', 'END'].includes(status)) return 'CHEQUERED'
  if (['IDLE', 'INACTIVE', 'NOTACTIVE', 'STOPPED'].includes(status)) return 'IDLE'
  return 'UNKNOWN'
}

export function getPollIntervalMs(status: TrackStatus): number {
  return status === 'GREEN' || status === 'YELLOW' || status === 'RED'
    ? ACTIVE_POLL_INTERVAL_MS
    : IDLE_POLL_INTERVAL_MS
}

function findEntries(payload: UnknownRecord): UnknownRecord[] {
  const candidates = ['standings', 'classification', 'positions', 'cars', 'entries', 'vehicles', 'timing']
  for (const candidate of candidates) {
    const value = readValue(payload, [candidate])
    if (Array.isArray(value)) return value.map(asRecord).filter((entry): entry is UnknownRecord => entry !== null)
  }

  const nested = readValue(payload, ['data', 'result', 'session'])
  const nestedRecord = asRecord(nested)
  return nestedRecord ? findEntries(nestedRecord) : []
}

function normalizeEntry(entry: UnknownRecord, series: string): RaceData | null {
  const carNumber = readString(entry, ['car_number', 'carnumber', 'number', 'no', 'num'])
  const position = readNumber(entry, ['position', 'pos', 'overall_position', 'overallposition'])
  if (!carNumber || position === undefined) return null

  const currentDriverId = readString(entry, ['current_driver_id', 'driver_number', 'drivernumber', 'driver_id'])
  const currentDriverName = readString(entry, ['current_driver', 'driver_name', 'drivername', 'name'], currentDriverId || carNumber)
  const lastLap = readValue(entry, ['last_lap', 'lastlaptime', 'lap_time', 'laptime'])
  const gap = readString(entry, ['gap_to_leader', 'gapt_leader', 'gap', 'totalgap'], position === 1 ? 'LEADER' : '--')

  return {
    driver_id: currentDriverId || carNumber,
    car_number: carNumber,
    position,
    class_position: readNumber(entry, ['class_position', 'classposition', 'position_in_class', 'posclass']),
    category_code: readString(entry, ['category_code', 'class', 'group', 'category']) || undefined,
    current_driver_id: currentDriverId || undefined,
    gap_to_leader: position === 1 ? 'LEADER' : gap,
    last_lap: lastLap === undefined ? '--' : String(lastLap),
    last_lap_ms: parseTimingMilliseconds(lastLap),
    stint_duration_ms: parseTimingMilliseconds(readValue(entry, ['stint_duration', 'stint_time', 'stinttime', 'pit_time'])),
    tire_compound: readString(entry, ['tire_compound', 'tyre_compound', 'compound'], 'Unknown'),
    manufacturer: readString(entry, ['manufacturer', 'make', 'brand']) || undefined,
    team_name: readString(entry, ['team_name', 'team', 'entrant']) || undefined,
    laps_completed: readNumber(entry, ['laps_completed', 'laps', 'lap']),
    pit_status: readString(entry, ['pit_status', 'pit', 'in_pit']) || undefined,
    drivers: { name: currentDriverName, series_id: series },
  }
}

export function normalizeAlKamelFeed(payload: unknown, series: string): NormalizedAlKamelFeed {
  const root = asRecord(payload)
  if (!root) throw new Error('Al Kamel feed must be a JSON object')

  const sessionRecord = asRecord(readValue(root, ['session', 'event'])) ?? root
  const status = normalizeTrackStatus(readValue(sessionRecord, ['track_status', 'trackstatus', 'flag', 'status', 'session_status']))
  const updatedAt = readString(root, ['updated_at', 'updatedat', 'timestamp', 'time'])

  const standings = findEntries(root)
    .map((entry) => normalizeEntry(entry, series))
    .filter((entry): entry is RaceData => entry !== null)
    .sort((left, right) => left.position - right.position)

  return {
    session: {
      session_id: readString(sessionRecord, ['session_id', 'sessionid', 'id', 'key'], 'latest'),
      series,
      name: readString(sessionRecord, ['session_name', 'sessionname', 'name']) || undefined,
      track_name: readString(sessionRecord, ['track_name', 'trackname', 'circuit']) || undefined,
      status,
      poll_interval_ms: getPollIntervalMs(status),
      updated_at: updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? new Date(updatedAt).toISOString() : new Date().toISOString(),
    },
    standings,
  }
}
