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

  useEffect(() => {
    if (series !== 'f1') return
    
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
        setSelectedRound(schedule.currentRound)
        
        const currentRoundData = schedule.rounds.find((r: Round) => r.round === schedule.currentRound)
        const raceSession = currentRoundData?.sessions.find((s: any) => s.name === 'Race') || currentRoundData?.sessions[0]
        if (raceSession) setSelectedSessionKey(raceSession.key)
      } catch (err) {
        console.error('Error fetching F1 data:', err)
      }
    }
    
    fetchData()
  }, [series, selectedYear])

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
