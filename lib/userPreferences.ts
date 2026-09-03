'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'
import { SERIES_DRIVERS, TEAM_HISTORY } from './data'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  paddockTier: 'Rookie Fan' | 'Paddock Club' | 'VIP Gold'
  favoriteSeries: string
  memberSince: string
  checkInStreak: number
  totalCheckIns: number
  isDemo?: boolean
}

export interface FollowedDriver {
  code: string
  name: string
  team: string
  series: string
  number?: number
  color?: string
  addedAt: string
}

export interface FollowedTeam {
  name: string
  series: string
  country?: string
  color?: string
  addedAt: string
}

export interface RaceCheckIn {
  id: string
  round: number
  series: string
  raceName: string
  circuit: string
  timestamp: string
  supportedDriverCode?: string
  supportedDriverName?: string
  supportedTeam?: string
  notes?: string
}

export interface FanAchievement {
  id: string
  title: string
  category: 'checkin' | 'favorites' | 'telemetry' | 'loyalty'
  description: string
  badgeText: string
  unlocked: boolean
  unlockedAt?: string
}

export interface TelemetryAlertPreferences {
  pitEntry: boolean
  fastestLap: boolean
  overtakes: boolean
  drsZones: boolean
  radioHighlights: boolean
}

const STORAGE_KEYS = {
  PROFILE: 'apexis_user_profile',
  FOLLOWED_DRIVERS: 'apexis_followed_drivers',
  FOLLOWED_TEAMS: 'apexis_followed_teams',
  CHECK_INS: 'apexis_race_checkins',
  PREFERENCES: 'apexis_telemetry_prefs',
}

// Preloaded demo VIP user for 1-click Instant Paddock Pass
export const DEMO_VIP_USER: UserProfile = {
  id: 'demo-vip-alex-turner',
  email: 'alex.turner@paddock.apexishub.com',
  displayName: 'Alex Turner',
  paddockTier: 'VIP Gold',
  favoriteSeries: 'f1',
  memberSince: 'March 2025',
  checkInStreak: 3,
  totalCheckIns: 12,
  isDemo: true,
}

export const INITIAL_DEMO_DRIVERS: FollowedDriver[] = [
  { code: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', series: 'f1', number: 44, color: '#E8002D', addedAt: '2025-03-15' },
  { code: 'NOR', name: 'Lando Norris', team: 'McLaren', series: 'f1', number: 4, color: '#FF8000', addedAt: '2025-04-02' },
  { code: 'ANT', name: 'Kimi Antonelli', team: 'Mercedes', series: 'f1', number: 12, color: '#27F4D2', addedAt: '2025-05-18' },
]

export const INITIAL_DEMO_TEAMS: FollowedTeam[] = [
  { name: 'Scuderia Ferrari', series: 'f1', country: 'Italy', color: '#E8002D', addedAt: '2025-03-15' },
  { name: 'McLaren Racing', series: 'f1', country: 'United Kingdom', color: '#FF8000', addedAt: '2025-04-02' },
  { name: 'Mercedes-AMG Petronas', series: 'f1', country: 'Germany', color: '#27F4D2', addedAt: '2025-05-18' },
]

export const INITIAL_DEMO_CHECKINS: RaceCheckIn[] = [
  {
    id: 'checkin-rd10',
    round: 10,
    series: 'f1',
    raceName: 'British Grand Prix',
    circuit: 'Silverstone',
    timestamp: '2025-07-06T14:00:00Z',
    supportedDriverCode: 'HAM',
    supportedDriverName: 'Lewis Hamilton',
    supportedTeam: 'Ferrari',
  },
  {
    id: 'checkin-rd11',
    round: 11,
    series: 'f1',
    raceName: 'Hungarian Grand Prix',
    circuit: 'Hungaroring',
    timestamp: '2025-07-27T13:00:00Z',
    supportedDriverCode: 'NOR',
    supportedDriverName: 'Lando Norris',
    supportedTeam: 'McLaren',
  },
  {
    id: 'checkin-rd12',
    round: 12,
    series: 'f1',
    raceName: 'Dutch Grand Prix',
    circuit: 'Zandvoort',
    timestamp: '2025-08-31T13:00:00Z',
    supportedDriverCode: 'ANT',
    supportedDriverName: 'Kimi Antonelli',
    supportedTeam: 'Mercedes',
  },
]

export const BASE_ACHIEVEMENTS: FanAchievement[] = [
  {
    id: 'pole_sitter',
    title: 'Pole Sitter',
    category: 'checkin',
    description: 'Completed your first Grand Prix race weekend check-in.',
    badgeText: 'P1 CHECK-IN',
    unlocked: true,
    unlockedAt: '2025-07-06',
  },
  {
    id: 'grand_slam',
    title: 'Grand Slam Streak',
    category: 'loyalty',
    description: 'Maintained an active 3+ race weekend check-in streak.',
    badgeText: 'STREAK 3+',
    unlocked: true,
    unlockedAt: '2025-08-31',
  },
  {
    id: 'tifosi_loyal',
    title: 'Tifosi Vanguard',
    category: 'favorites',
    description: 'Followed Scuderia Ferrari and checked in for a Ferrari podium.',
    badgeText: 'FERRARI SUPPORTER',
    unlocked: true,
    unlockedAt: '2025-07-06',
  },
  {
    id: 'silver_arrows',
    title: 'Silver Arrows VIP',
    category: 'favorites',
    description: 'Followed Mercedes-AMG and tracked Antonelli telemetry.',
    badgeText: 'MERCEDES FAN',
    unlocked: true,
    unlockedAt: '2025-08-31',
  },
  {
    id: 'telemetry_master',
    title: 'Pit Wall Strategist',
    category: 'telemetry',
    description: 'Used Race Engineer AI pit radio during a live race session.',
    badgeText: 'PIT RADIO ACCREDITED',
    unlocked: false,
  },
  {
    id: 'multi_series',
    title: 'Omni-Motorsport Pass',
    category: 'loyalty',
    description: 'Followed teams across 2 or more different motorsport categories.',
    badgeText: 'GLOBAL MOTORSPORT',
    unlocked: false,
  },
]

// Dispatch custom event for intra-tab state updates
function notifyStateChanged(eventName: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName))
  }
}

// ==========================================
// LOCAL STORAGE & SUPABASE SYNC HELPERS
// ==========================================

export function getStoredUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveStoredUserProfile(profile: UserProfile | null): void {
  if (typeof window === 'undefined') return
  try {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE)
    }
    notifyStateChanged('apexis_user_updated')
  } catch (e) {
    console.error('Failed to save profile to storage', e)
  }
}

export function getStoredFollowedDrivers(): FollowedDriver[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLLOWED_DRIVERS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredFollowedDrivers(drivers: FollowedDriver[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FOLLOWED_DRIVERS, JSON.stringify(drivers))
    notifyStateChanged('apexis_favorites_updated')
  } catch (e) {
    console.error('Failed to save drivers to storage', e)
  }
}

export function getStoredFollowedTeams(): FollowedTeam[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLLOWED_TEAMS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredFollowedTeams(teams: FollowedTeam[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FOLLOWED_TEAMS, JSON.stringify(teams))
    notifyStateChanged('apexis_favorites_updated')
  } catch (e) {
    console.error('Failed to save teams to storage', e)
  }
}

export function getStoredCheckIns(): RaceCheckIn[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECK_INS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStoredCheckIns(checkIns: RaceCheckIn[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns))
    notifyStateChanged('apexis_checkins_updated')
  } catch (e) {
    console.error('Failed to save check-ins to storage', e)
  }
}

export function getStoredAlertPreferences(): TelemetryAlertPreferences {
  const defaults: TelemetryAlertPreferences = {
    pitEntry: true,
    fastestLap: true,
    overtakes: true,
    drsZones: false,
    radioHighlights: true,
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function saveStoredAlertPreferences(prefs: TelemetryAlertPreferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs))
    notifyStateChanged('apexis_prefs_updated')
  } catch (e) {
    console.error('Failed to save preferences to storage', e)
  }
}

// 1-Click Demo Login
export function loginAsDemoUser(): UserProfile {
  saveStoredUserProfile(DEMO_VIP_USER)
  saveStoredFollowedDrivers(INITIAL_DEMO_DRIVERS)
  saveStoredFollowedTeams(INITIAL_DEMO_TEAMS)
  saveStoredCheckIns(INITIAL_DEMO_CHECKINS)
  return DEMO_VIP_USER
}

// Logout
export async function logoutUserProfile(): Promise<void> {
  const supabase = createClient()
  try {
    await supabase.auth.signOut()
  } catch {
    // Ignore if not logged into Supabase
  }
  saveStoredUserProfile(null)
  saveStoredFollowedDrivers([])
  saveStoredFollowedTeams([])
  saveStoredCheckIns([])
}

// ==========================================
// REACT HOOK: useUserProfile
// ==========================================

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [followedDrivers, setFollowedDrivers] = useState<FollowedDriver[]>([])
  const [followedTeams, setFollowedTeams] = useState<FollowedTeam[]>([])
  const [checkIns, setCheckIns] = useState<RaceCheckIn[]>([])
  const [alertPrefs, setAlertPrefs] = useState<TelemetryAlertPreferences>(getStoredAlertPreferences())
  const [loading, setLoading] = useState(true)

  const reloadAll = useCallback(() => {
    setProfile(getStoredUserProfile())
    setFollowedDrivers(getStoredFollowedDrivers())
    setFollowedTeams(getStoredFollowedTeams())
    setCheckIns(getStoredCheckIns())
    setAlertPrefs(getStoredAlertPreferences())
  }, [])

  useEffect(() => {
    reloadAll()
    setLoading(false)

    // Check Supabase session on mount
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const existing = getStoredUserProfile()
        if (!existing || existing.id !== session.user.id) {
          const userObj: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0] || 'Motorsport Fan',
            paddockTier: 'Paddock Club',
            favoriteSeries: 'f1',
            memberSince: new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            checkInStreak: existing?.checkInStreak || 1,
            totalCheckIns: existing?.totalCheckIns || 1,
          }
          saveStoredUserProfile(userObj)
          setProfile(userObj)
        }
      }
    })

    const handleUpdate = () => reloadAll()
    window.addEventListener('apexis_user_updated', handleUpdate)
    window.addEventListener('apexis_favorites_updated', handleUpdate)
    window.addEventListener('apexis_checkins_updated', handleUpdate)
    window.addEventListener('apexis_prefs_updated', handleUpdate)

    return () => {
      window.removeEventListener('apexis_user_updated', handleUpdate)
      window.removeEventListener('apexis_favorites_updated', handleUpdate)
      window.removeEventListener('apexis_checkins_updated', handleUpdate)
      window.removeEventListener('apexis_prefs_updated', handleUpdate)
    }
  }, [reloadAll])

  // Driver follow toggle
  const toggleDriver = useCallback((driver: { code: string; name: string; team: string; series: string; number?: number; color?: string }) => {
    const current = getStoredFollowedDrivers()
    const index = current.findIndex(d => d.code === driver.code && d.series === driver.series)
    let next: FollowedDriver[]

    if (index >= 0) {
      next = current.filter((_, i) => i !== index)
    } else {
      next = [
        ...current,
        {
          code: driver.code,
          name: driver.name,
          team: driver.team,
          series: driver.series,
          number: driver.number,
          color: driver.color,
          addedAt: new Date().toISOString(),
        }
      ]
    }
    saveStoredFollowedDrivers(next)
    setFollowedDrivers(next)

    // Sync to Supabase in background if logged in
    const user = getStoredUserProfile()
    if (user && !user.isDemo) {
      const supabase = createClient()
      if (index >= 0) {
        supabase.from('followed_drivers').delete().match({ user_id: user.id, driver_id: driver.code, series: driver.series })
      } else {
        supabase.from('followed_drivers').insert({ user_id: user.id, driver_id: driver.code, series: driver.series })
      }
    }
  }, [])

  // Team follow toggle
  const toggleTeam = useCallback((team: { name: string; series: string; country?: string; color?: string }) => {
    const current = getStoredFollowedTeams()
    const index = current.findIndex(t => t.name === team.name && t.series === team.series)
    let next: FollowedTeam[]

    if (index >= 0) {
      next = current.filter((_, i) => i !== index)
    } else {
      next = [
        ...current,
        {
          name: team.name,
          series: team.series,
          country: team.country,
          color: team.color,
          addedAt: new Date().toISOString(),
        }
      ]
    }
    saveStoredFollowedTeams(next)
    setFollowedTeams(next)
  }, [])

  // Check in to race
  const checkIn = useCallback((round: number, series: string, raceName: string, circuit: string, driver?: { code: string; name: string; team: string }) => {
    const current = getStoredCheckIns()
    const existingIndex = current.findIndex(c => c.round === round && c.series === series)

    const checkInRecord: RaceCheckIn = {
      id: `checkin-${series}-rd${round}-${Date.now()}`,
      round,
      series,
      raceName,
      circuit,
      timestamp: new Date().toISOString(),
      supportedDriverCode: driver?.code,
      supportedDriverName: driver?.name,
      supportedTeam: driver?.team,
    }

    let next: RaceCheckIn[]
    if (existingIndex >= 0) {
      next = [...current]
      next[existingIndex] = checkInRecord
    } else {
      next = [checkInRecord, ...current]
    }
    saveStoredCheckIns(next)
    setCheckIns(next)

    // Update profile streak and count
    const user = getStoredUserProfile()
    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        checkInStreak: existingIndex >= 0 ? user.checkInStreak : user.checkInStreak + 1,
        totalCheckIns: existingIndex >= 0 ? user.totalCheckIns : user.totalCheckIns + 1,
      }
      saveStoredUserProfile(updatedUser)
      setProfile(updatedUser)
    }

    return checkInRecord
  }, [])

  const isDriverFollowed = useCallback((code: string, series: string) => {
    return followedDrivers.some(d => d.code === code && d.series === series)
  }, [followedDrivers])

  const isTeamFollowed = useCallback((name: string, series: string) => {
    return followedTeams.some(t => t.name.toLowerCase() === name.toLowerCase() && t.series === series)
  }, [followedTeams])

  const isCheckedInForRound = useCallback((round: number, series: string) => {
    return checkIns.some(c => c.round === round && c.series === series)
  }, [checkIns])

  const updateAlertPreferences = useCallback((prefs: Partial<TelemetryAlertPreferences>) => {
    const next = { ...alertPrefs, ...prefs }
    saveStoredAlertPreferences(next)
    setAlertPrefs(next)
  }, [alertPrefs])

  return {
    profile,
    isLoggedIn: !!profile,
    followedDrivers,
    followedTeams,
    checkIns,
    alertPrefs,
    loading,
    toggleDriver,
    toggleTeam,
    checkIn,
    isDriverFollowed,
    isTeamFollowed,
    isCheckedInForRound,
    updateAlertPreferences,
    loginDemo: loginAsDemoUser,
    logout: logoutUserProfile,
  }
}
