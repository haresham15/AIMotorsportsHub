'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'
import { SERIES_DRIVERS, TEAM_HISTORY } from './data'

export type AvatarFrameType = 'carbon' | 'gold_champion' | 'tifosi_rosso' | 'neon_halo' | 'speed_demon' | 'stealth_night';
export type PaddockPrivacy = 'public' | 'friends_only' | 'private';

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  avatarFrame?: AvatarFrameType
  tagline?: string
  title?: string
  homeCircuit?: string
  themeColor?: string
  primaryDriver?: string
  primaryTeam?: string
  privacy?: PaddockPrivacy
  paddockTier: 'Rookie Fan' | 'Paddock Club' | 'VIP Gold'
  favoriteSeries: string
  memberSince: string
  checkInStreak: number
  totalCheckIns: number
  isDemo?: boolean
}

export interface FriendConnection {
  id: string
  displayName: string
  email?: string
  tagline?: string
  title?: string
  avatarUrl?: string
  avatarFrame?: AvatarFrameType
  paddockTier: string
  favoriteSeries: string
  primaryDriver?: string
  primaryTeam?: string
  homeCircuit?: string
  themeColor?: string
  checkInStreak: number
  status: 'online' | 'in_replay' | 'in_garage' | 'offline'
  statusText?: string
  connectedSince: string
}

export interface FriendRequest {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  senderFrame?: AvatarFrameType
  senderTitle?: string
  senderTeam?: string
  senderBio?: string
  receiverId: string
  timestamp: string
  direction: 'incoming' | 'outgoing'
  status: 'pending' | 'accepted' | 'declined'
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
  FRIENDS: 'apexis_paddock_friends',
  FRIEND_REQUESTS: 'apexis_friend_requests',
}

// Seed Community Directory for Discovering Paddock Members
export const SEED_PADDOCK_MEMBERS: FriendConnection[] = [
  {
    id: 'member-elena-tifosi',
    displayName: 'Elena Rostova',
    tagline: 'Scuderia fan since Monza 2008. Always believing in red.',
    title: 'Tifosi Vanguard',
    avatarUrl: 'preset:helmet_red',
    avatarFrame: 'tifosi_rosso',
    paddockTier: 'VIP Gold',
    favoriteSeries: 'f1',
    primaryDriver: 'Charles Leclerc',
    primaryTeam: 'Scuderia Ferrari',
    homeCircuit: 'Monza',
    themeColor: 'ferrari',
    checkInStreak: 18,
    status: 'online',
    statusText: 'Analyzing Monza 2019 Telemetry',
    connectedSince: '2025-04-12',
  },
  {
    id: 'member-marcus-apex',
    displayName: 'Marcus Vance',
    tagline: 'Apex hunter. Telemetry nerd. Silverstone is home.',
    title: 'Pit Wall Strategist',
    avatarUrl: 'preset:wheel',
    avatarFrame: 'neon_halo',
    paddockTier: 'Paddock Club',
    favoriteSeries: 'f1',
    primaryDriver: 'Lewis Hamilton',
    primaryTeam: 'Mercedes-AMG Petronas',
    homeCircuit: 'Silverstone',
    themeColor: 'mercedes',
    checkInStreak: 9,
    status: 'online',
    statusText: 'Comparing telemetry delta with Antonelli',
    connectedSince: '2025-05-01',
  },
  {
    id: 'member-kenji-sato',
    displayName: 'Kenji Sato',
    tagline: 'Honda & Red Bull racing engineer mindset.',
    title: 'Telemetry Analyst',
    avatarUrl: 'preset:v10',
    avatarFrame: 'gold_champion',
    paddockTier: 'VIP Gold',
    favoriteSeries: 'f1',
    primaryDriver: 'Max Verstappen',
    primaryTeam: 'Red Bull Racing',
    homeCircuit: 'Suzuka',
    themeColor: 'redbull',
    checkInStreak: 24,
    status: 'in_replay',
    statusText: 'Replaying 2021 Abu Dhabi What-If',
    connectedSince: '2025-03-20',
  },
  {
    id: 'member-sophie-wec',
    displayName: 'Sophie Laurent',
    tagline: 'Endurance racing purist. 24 Hours of Le Mans veteran.',
    title: 'Grand Prix Veteran',
    avatarUrl: 'preset:eagle',
    avatarFrame: 'speed_demon',
    paddockTier: 'Paddock Club',
    favoriteSeries: 'wec',
    primaryDriver: 'Kevin Estre',
    primaryTeam: 'Porsche Penske Motorsport',
    homeCircuit: 'Spa-Francorchamps',
    themeColor: 'amber',
    checkInStreak: 14,
    status: 'in_garage',
    statusText: 'Calibrating Hypercar tire wear models',
    connectedSince: '2025-06-10',
  },
  {
    id: 'member-mateo-silva',
    displayName: 'Mateo Silva',
    tagline: 'Papaya army! Senna legacy & Interlagos heart.',
    title: 'Apex Hunter',
    avatarUrl: 'preset:helmet_papaya',
    avatarFrame: 'carbon',
    paddockTier: 'Rookie Fan',
    favoriteSeries: 'f1',
    primaryDriver: 'Lando Norris',
    primaryTeam: 'McLaren Racing',
    homeCircuit: 'Interlagos',
    themeColor: 'mclaren',
    checkInStreak: 5,
    status: 'offline',
    statusText: 'Last active 2h ago',
    connectedSince: '2025-07-15',
  },
  {
    id: 'member-chase-nascar',
    displayName: 'Chase Elliott Fan 9',
    tagline: 'V8 rumble, restrictor plates, and 200 MPH drafting.',
    title: 'Sim Racer',
    avatarUrl: 'preset:flag',
    avatarFrame: 'stealth_night',
    paddockTier: 'Paddock Club',
    favoriteSeries: 'nascar',
    primaryDriver: 'Chase Elliott',
    primaryTeam: 'Hendrick Motorsports',
    homeCircuit: 'Daytona International Speedway',
    themeColor: 'amber',
    checkInStreak: 11,
    status: 'online',
    statusText: 'Watching NASCAR Next-Gen replay',
    connectedSince: '2025-08-01',
  },
]

// Preloaded demo VIP user for 1-click Instant Paddock Pass
export const DEMO_VIP_USER: UserProfile = {
  id: 'demo-vip-alex-turner',
  email: 'alex.turner@paddock.apexishub.com',
  displayName: 'Alex Turner',
  avatarUrl: 'preset:helmet_gold',
  avatarFrame: 'gold_champion',
  title: 'Pit Wall Strategist',
  tagline: 'Analyzing telemetry deltas & tire deg models since 2018. Tifosi at heart.',
  homeCircuit: 'Silverstone',
  themeColor: 'amber',
  primaryDriver: 'Lewis Hamilton',
  primaryTeam: 'Scuderia Ferrari',
  privacy: 'public',
  paddockTier: 'VIP Gold',
  favoriteSeries: 'f1',
  memberSince: 'March 2025',
  checkInStreak: 3,
  totalCheckIns: 12,
  isDemo: true,
}

export const INITIAL_DEMO_FRIENDS: FriendConnection[] = [
  SEED_PADDOCK_MEMBERS[0], // Elena Rostova
  SEED_PADDOCK_MEMBERS[1], // Marcus Vance
]

export const INITIAL_DEMO_REQUESTS: FriendRequest[] = [
  {
    id: 'req-mateo-silva',
    senderId: 'member-mateo-silva',
    senderName: 'Mateo Silva',
    senderAvatar: 'preset:helmet_papaya',
    senderFrame: 'carbon',
    senderTitle: 'Apex Hunter',
    senderTeam: 'McLaren Racing',
    senderBio: 'Papaya army! Love comparing telemetry deltas.',
    receiverId: 'demo-vip-alex-turner',
    timestamp: '2025-09-05T14:30:00Z',
    direction: 'incoming',
    status: 'pending',
  },
]

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

export function getStoredFriends(): FriendConnection[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_FRIENDS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS)
    return raw ? JSON.parse(raw) : INITIAL_DEMO_FRIENDS
  } catch {
    return INITIAL_DEMO_FRIENDS
  }
}

export function saveStoredFriends(friends: FriendConnection[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends))
    notifyStateChanged('apexis_friends_updated')
  } catch (e) {
    console.error('Failed to save friends to storage', e)
  }
}

export function getStoredFriendRequests(): FriendRequest[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_REQUESTS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)
    return raw ? JSON.parse(raw) : INITIAL_DEMO_REQUESTS
  } catch {
    return INITIAL_DEMO_REQUESTS
  }
}

export function saveStoredFriendRequests(requests: FriendRequest[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(requests))
    notifyStateChanged('apexis_friends_updated')
  } catch (e) {
    console.error('Failed to save friend requests to storage', e)
  }
}

// 1-Click Demo Login
export function loginAsDemoUser(): UserProfile {
  saveStoredUserProfile(DEMO_VIP_USER)
  saveStoredFollowedDrivers(INITIAL_DEMO_DRIVERS)
  saveStoredFollowedTeams(INITIAL_DEMO_TEAMS)
  saveStoredCheckIns(INITIAL_DEMO_CHECKINS)
  saveStoredFriends(INITIAL_DEMO_FRIENDS)
  saveStoredFriendRequests(INITIAL_DEMO_REQUESTS)
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
  const [friends, setFriends] = useState<FriendConnection[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [alertPrefs, setAlertPrefs] = useState<TelemetryAlertPreferences>({
    pitEntry: true,
    fastestLap: true,
    overtakes: true,
    drsZones: false,
    radioHighlights: true,
  })
  const [loading, setLoading] = useState(true)

  const reloadAll = useCallback(() => {
    setProfile(getStoredUserProfile())
    setFollowedDrivers(getStoredFollowedDrivers())
    setFollowedTeams(getStoredFollowedTeams())
    setCheckIns(getStoredCheckIns())
    setAlertPrefs(getStoredAlertPreferences())
    setFriends(getStoredFriends())
    setFriendRequests(getStoredFriendRequests())
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
    window.addEventListener('apexis_friends_updated', handleUpdate)

    return () => {
      window.removeEventListener('apexis_user_updated', handleUpdate)
      window.removeEventListener('apexis_favorites_updated', handleUpdate)
      window.removeEventListener('apexis_checkins_updated', handleUpdate)
      window.removeEventListener('apexis_prefs_updated', handleUpdate)
      window.removeEventListener('apexis_friends_updated', handleUpdate)
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

  // Profile customization update
  const updateProfileCustomization = useCallback((updates: Partial<UserProfile>) => {
    const current = getStoredUserProfile() || DEMO_VIP_USER
    const updated: UserProfile = {
      ...current,
      ...updates,
    }
    saveStoredUserProfile(updated)
    setProfile(updated)

    // Sync to Supabase profile if real user
    if (updated && !updated.isDemo) {
      const supabase = createClient()
      supabase.from('profiles').upsert({
        id: updated.id,
        display_name: updated.displayName,
        avatar_url: updated.avatarUrl,
        avatar_frame: updated.avatarFrame,
        tagline: updated.tagline,
        title: updated.title,
        home_circuit: updated.homeCircuit,
        theme_color: updated.themeColor,
        favorite_series: updated.favoriteSeries,
        primary_driver: updated.primaryDriver,
        primary_team: updated.primaryTeam,
        privacy: updated.privacy,
        updated_at: new Date().toISOString(),
      }).then(({ error: upsertErr }) => {
        if (upsertErr) console.warn('Supabase profile sync warning:', upsertErr)
      })
    }
  }, [])

  // Send friend request to another paddock member
  const sendFriendRequest = useCallback((target: FriendConnection) => {
    const currentRequests = getStoredFriendRequests()
    const currentFriends = getStoredFriends()

    // Check if already friends
    if (currentFriends.some(f => f.id === target.id)) return

    // Check if pending request already exists
    if (currentRequests.some(r => (r.receiverId === target.id || r.senderId === target.id) && r.status === 'pending')) return

    const currentUser = getStoredUserProfile() || DEMO_VIP_USER
    const newRequest: FriendRequest = {
      id: `req-${Date.now()}-${target.id}`,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      senderFrame: currentUser.avatarFrame,
      senderTitle: currentUser.title,
      senderTeam: currentUser.primaryTeam,
      senderBio: currentUser.tagline,
      receiverId: target.id,
      timestamp: new Date().toISOString(),
      direction: 'outgoing',
      status: 'pending',
    }

    const updatedRequests = [newRequest, ...currentRequests]
    saveStoredFriendRequests(updatedRequests)
    setFriendRequests(updatedRequests)
  }, [])

  // Accept incoming friend request
  const acceptFriendRequest = useCallback((requestId: string) => {
    const currentRequests = getStoredFriendRequests()
    const request = currentRequests.find(r => r.id === requestId)
    if (!request) return

    // Find the member details from seed members or request metadata
    const memberSeed = SEED_PADDOCK_MEMBERS.find(m => m.id === request.senderId)
    const newFriend: FriendConnection = memberSeed || {
      id: request.senderId,
      displayName: request.senderName,
      title: request.senderTitle || 'Paddock Member',
      avatarUrl: request.senderAvatar || 'preset:helmet_gold',
      avatarFrame: request.senderFrame || 'carbon',
      paddockTier: 'Paddock Club',
      favoriteSeries: 'f1',
      primaryTeam: request.senderTeam,
      checkInStreak: 1,
      status: 'online',
      statusText: 'Connected with you',
      connectedSince: new Date().toISOString().split('T')[0],
      tagline: request.senderBio,
    }

    const currentFriends = getStoredFriends()
    const updatedFriends = currentFriends.some(f => f.id === newFriend.id)
      ? currentFriends
      : [newFriend, ...currentFriends]

    const updatedRequests = currentRequests.filter(r => r.id !== requestId)

    saveStoredFriends(updatedFriends)
    saveStoredFriendRequests(updatedRequests)
    setFriends(updatedFriends)
    setFriendRequests(updatedRequests)
  }, [])

  // Decline incoming friend request
  const declineFriendRequest = useCallback((requestId: string) => {
    const currentRequests = getStoredFriendRequests()
    const updatedRequests = currentRequests.filter(r => r.id !== requestId)
    saveStoredFriendRequests(updatedRequests)
    setFriendRequests(updatedRequests)
  }, [])

  // Cancel outgoing friend request
  const cancelOutgoingRequest = useCallback((requestId: string) => {
    const currentRequests = getStoredFriendRequests()
    const updatedRequests = currentRequests.filter(r => r.id !== requestId)
    saveStoredFriendRequests(updatedRequests)
    setFriendRequests(updatedRequests)
  }, [])

  // Remove friend connection
  const removeFriend = useCallback((friendId: string) => {
    const currentFriends = getStoredFriends()
    const updatedFriends = currentFriends.filter(f => f.id !== friendId)
    saveStoredFriends(updatedFriends)
    setFriends(updatedFriends)
  }, [])

  // Helper: check if a user is currently a friend
  const isFriend = useCallback((userId: string) => {
    return friends.some(f => f.id === userId)
  }, [friends])

  // Helper: check if a pending request exists
  const hasPendingRequest = useCallback((userId: string) => {
    return friendRequests.some(r => (r.receiverId === userId || r.senderId === userId) && r.status === 'pending')
  }, [friendRequests])

  return {
    profile,
    isLoggedIn: !!profile,
    followedDrivers,
    followedTeams,
    checkIns,
    friends,
    friendRequests,
    alertPrefs,
    loading,
    toggleDriver,
    toggleTeam,
    checkIn,
    isDriverFollowed,
    isTeamFollowed,
    isCheckedInForRound,
    updateAlertPreferences,
    updateProfileCustomization,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelOutgoingRequest,
    removeFriend,
    isFriend,
    hasPendingRequest,
    loginDemo: loginAsDemoUser,
    logout: logoutUserProfile,
  }
}
