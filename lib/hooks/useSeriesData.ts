import { useState, useEffect, useCallback } from 'react'
import { Round, DriverStanding, ConstructorStanding } from '@/lib/types'
import {
  findCurrentOrRecentRound,
  findMostRecentSession,
  getSeriesFallbackSchedule,
  type ScheduleData,
} from '@/lib/seriesSchedules'

interface SeriesDataResult {
  scheduleData: ScheduleData | null
  standingsData: { driverStandings: DriverStanding[]; constructorStandings: ConstructorStanding[] } | null
  selectedRound: number
  setSelectedRound: (round: number) => void
  selectedSessionKey: number | null
  setSelectedSessionKey: (key: number | null) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
}

export function useSeriesData(series: string): SeriesDataResult {
  const isNascar = series === 'nascar' || series.startsWith('nascar-')
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [standingsData, setStandingsData] = useState<{ driverStandings: DriverStanding[]; constructorStandings: ConstructorStanding[] } | null>(null)
  const [selectedYear, setSelectedYear] = useState(() => isNascar ? '2025' : new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null)

  const queryYear = isNascar ? '2025' : selectedYear

  // Primary data fetcher when series or year changes
  useEffect(() => {
    let isCancelled = false

    // Reset data when switching series to prevent stale cross-series flashes
    setScheduleData(null)
    setStandingsData(null)

    if (series === 'f1') {
      const fetchData = async () => {
        try {
          const [scheduleRes, standingsRes] = await Promise.all([
            fetch(`/api/f1/schedule?year=${queryYear}`),
            fetch(`/api/f1/standings?year=${queryYear}`)
          ])

          if (isCancelled) return

          const schedule: ScheduleData | null = scheduleRes.ok ? await scheduleRes.json() : null
          const standings = standingsRes.ok ? await standingsRes.json() : null

          if (isCancelled) return

          if (schedule) setScheduleData(schedule)
          if (standings && !standings.error) setStandingsData(standings)

          if (!schedule?.rounds?.length) {
            setSelectedRound(1)
            setSelectedSessionKey(null)
            return
          }

          // Prioritize active or most recent round & session
          const targetRound = findCurrentOrRecentRound(schedule.rounds, schedule.currentRound)
          const initialRound = targetRound ? targetRound.round : (schedule.currentRound || 1)
          setSelectedRound(initialRound)

          const recentSession = findMostRecentSession(targetRound)
          if (recentSession) {
            setSelectedSessionKey(recentSession.key)
          }
        } catch (err) {
          if (!isCancelled) {
            console.error('Error fetching F1 data:', err)
          }
        }
      }

      fetchData()
    } else if (isNascar) {
      const fetchNascarData = async () => {
        try {
          const nascarParam = series === 'nascar' ? 'nascar-cup' : series
          const [scheduleRes, standingsRes] = await Promise.all([
            fetch(`/api/nascar/schedule?year=${queryYear}&series=${nascarParam}`),
            fetch(`/api/nascar/standings?year=${queryYear}&series=${nascarParam}`)
          ])

          if (isCancelled) return

          const schedule: ScheduleData | null = scheduleRes.ok ? await scheduleRes.json() : null
          const standings = standingsRes.ok ? await standingsRes.json() : null

          if (isCancelled) return

          if (schedule) setScheduleData(schedule)
          if (standings && !standings.error) setStandingsData(standings)

          if (!schedule?.rounds?.length) {
            setSelectedRound(1)
            setSelectedSessionKey(null)
            return
          }

          const targetRound = findCurrentOrRecentRound(schedule.rounds, schedule.currentRound)
          const initialRound = targetRound ? targetRound.round : (schedule.currentRound || 1)
          setSelectedRound(initialRound)

          const recentSession = findMostRecentSession(targetRound)
          if (recentSession) {
            setSelectedSessionKey(recentSession.key)
          }
        } catch (err) {
          if (!isCancelled) {
            console.error('Error fetching NASCAR data:', err)
          }
        }
      }

      fetchNascarData()
    } else {
      // Non-F1/NASCAR categories (F2, F3, WEC, Formula E, GT World Challenge, Top Fuel)
      const fallbackSchedule = getSeriesFallbackSchedule(series, queryYear)
      if (fallbackSchedule && fallbackSchedule.rounds?.length > 0) {
        setScheduleData(fallbackSchedule)
        const targetRound = findCurrentOrRecentRound(fallbackSchedule.rounds, fallbackSchedule.currentRound)
        const initialRound = targetRound ? targetRound.round : (fallbackSchedule.currentRound || 1)
        setSelectedRound(initialRound)

        const recentSession = findMostRecentSession(targetRound)
        if (recentSession) {
          setSelectedSessionKey(recentSession.key)
        }
      }
    }

    return () => {
      isCancelled = true
    }
  }, [series, queryYear, isNascar])

  // Automatically keep session aligned whenever selectedRound changes
  useEffect(() => {
    if (!scheduleData?.rounds?.length) return
    const roundData = scheduleData.rounds.find(r => r.round === selectedRound)
    if (!roundData || !roundData.sessions?.length) return

    const sessionExistsInRound = roundData.sessions.some(s => s.key === selectedSessionKey)
    if (!sessionExistsInRound) {
      const recentSession = findMostRecentSession(roundData)
      if (recentSession) {
        setSelectedSessionKey(recentSession.key)
      }
    }
  }, [selectedRound, scheduleData, selectedSessionKey])

  return {
    scheduleData,
    standingsData,
    selectedRound,
    setSelectedRound,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedYear,
    setSelectedYear
  }
}

