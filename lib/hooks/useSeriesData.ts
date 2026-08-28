import { useState, useEffect } from 'react'
import { Round, DriverStanding, ConstructorStanding } from '@/lib/types'

interface SeriesDataResult {
  scheduleData: { currentRound: number; rounds: Round[] } | null
  standingsData: { driverStandings: DriverStanding[]; constructorStandings: ConstructorStanding[] } | null
  selectedRound: number
  setSelectedRound: (round: number) => void
  selectedSessionKey: number | null
  setSelectedSessionKey: (key: number | null) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
}

export function useSeriesData(series: string): SeriesDataResult {
  const [scheduleData, setScheduleData] = useState<{currentRound: number, rounds: Round[]} | null>(null)
  const [standingsData, setStandingsData] = useState<{driverStandings: DriverStanding[], constructorStandings: ConstructorStanding[]} | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null)

  const isNascar = series.startsWith('nascar-')

  useEffect(() => {
    if (series === 'f1') {
      // F1 data pipeline — unchanged
      const fetchData = async () => {
        try {
          const [scheduleRes, standingsRes] = await Promise.all([
            fetch(`/api/f1/schedule?year=${selectedYear}`),
            fetch(`/api/f1/standings?year=${selectedYear}`)
          ])
          
          const schedule = await scheduleRes.json()
          const standings = await standingsRes.json()
          
          setScheduleData(schedule)
          setStandingsData(standings)

          // Find the most recent race that is either live or completed
          const latestRace = [...(schedule.rounds || [])].reverse().find(
            (r: Round) => r.status === 'completed' || r.status === 'live'
          )
          const initialRound = latestRace ? latestRace.round : schedule.currentRound
          
          setSelectedRound(initialRound)
          
          const currentRoundData = schedule.rounds.find((r: Round) => r.round === initialRound)
          const raceSession = currentRoundData?.sessions.find((s: any) => s.name === 'Race') || currentRoundData?.sessions[0]
          if (raceSession) setSelectedSessionKey(raceSession.key)
        } catch (err) {
          console.error('Error fetching F1 data:', err)
        }
      }
      
      fetchData()
    } else if (isNascar) {
      // NASCAR data pipeline — fetch from NASCAR CDN proxy
      const fetchNascarData = async () => {
        try {
          const [scheduleRes, standingsRes] = await Promise.all([
            fetch(`/api/nascar/schedule?year=${selectedYear}`),
            fetch(`/api/nascar/standings?year=${selectedYear}`)
          ])
          
          const schedule = await scheduleRes.json()
          const standings = await standingsRes.json()
          
          setScheduleData(schedule)
          setStandingsData(standings)

          // Find the most recent completed or live race
          const latestRace = [...(schedule.rounds || [])].reverse().find(
            (r: Round) => r.status === 'completed' || r.status === 'live'
          )
          const initialRound = latestRace ? latestRace.round : schedule.currentRound
          
          setSelectedRound(initialRound)
          
          const currentRoundData = schedule.rounds.find((r: Round) => r.round === initialRound)
          const raceSession = currentRoundData?.sessions.find((s: any) => s.name === 'Race') || currentRoundData?.sessions[0]
          if (raceSession) setSelectedSessionKey(raceSession.key)

          // NASCAR doesn't have a separate standings API yet — we'll build standings from live feed data
          // For now, leave standings null (dashboard handles this gracefully)
        } catch (err) {
          console.error('Error fetching NASCAR data:', err)
        }
      }

      fetchNascarData()
    }
  }, [series, selectedYear, isNascar])

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
