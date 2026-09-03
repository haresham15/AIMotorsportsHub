import { useState, useEffect } from 'react'
import { Round, DriverStanding, ConstructorStanding } from '@/lib/types'

interface ScheduleData {
  currentRound: number
  rounds: Round[]
  availableYears?: string[]
}

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
  const [standingsData, setStandingsData] = useState<{driverStandings: DriverStanding[], constructorStandings: ConstructorStanding[]} | null>(null)
  const [selectedYear, setSelectedYear] = useState(() => isNascar ? '2025' : new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null)

  const queryYear = isNascar ? '2025' : selectedYear

  useEffect(() => {
    if (series === 'f1') {
      const fetchData = async () => {
        try {
          const [scheduleRes, standingsRes] = await Promise.all([
            fetch(`/api/f1/schedule?year=${queryYear}`),
            fetch(`/api/f1/standings?year=${queryYear}`)
          ])

          const schedule = await scheduleRes.json()
          const standings = await standingsRes.json()

          setScheduleData(schedule)
          setStandingsData(standings)

          if (!schedule.rounds?.length) {
            setSelectedRound(1)
            setSelectedSessionKey(null)
            return
          }

          const latestRace = [...schedule.rounds].reverse().find(
            (r: Round) => r.status === 'completed' || r.status === 'live'
          )
          const initialRound = latestRace ? latestRace.round : (schedule.currentRound || 1)

          setSelectedRound(initialRound)

          const currentRoundData = schedule.rounds.find((r: Round) => r.round === initialRound)
          const raceSession = currentRoundData?.sessions?.find((s: { name: string }) => s.name === 'Race') || currentRoundData?.sessions?.[0]
          if (raceSession) setSelectedSessionKey(raceSession.key)
        } catch (err) {
          console.error('Error fetching F1 data:', err)
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

          const schedule = await scheduleRes.json()
          const standings = await standingsRes.json()

          setScheduleData(schedule)
          setStandingsData(standings)

          if (!schedule.rounds?.length) {
            setSelectedRound(1)
            setSelectedSessionKey(null)
            return
          }

          const latestRace = [...schedule.rounds].reverse().find(
            (r: Round) => r.status === 'completed' || r.status === 'live'
          )
          const initialRound = latestRace ? latestRace.round : (schedule.currentRound || 1)

          setSelectedRound(initialRound)

          const currentRoundData = schedule.rounds.find((r: Round) => r.round === initialRound)
          const raceSession = currentRoundData?.sessions?.find((s: { name: string }) => s.name === 'Race') || currentRoundData?.sessions?.[0]
          if (raceSession) setSelectedSessionKey(raceSession.key)
        } catch (err) {
          console.error('Error fetching NASCAR data:', err)
        }
      }

      fetchNascarData()
    }
  }, [series, queryYear, isNascar])

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
