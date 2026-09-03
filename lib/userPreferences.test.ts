import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredFollowedDrivers,
  saveStoredFollowedDrivers,
  getStoredFollowedTeams,
  saveStoredFollowedTeams,
  getStoredCheckIns,
  saveStoredCheckIns,
  loginAsDemoUser,
  DEMO_VIP_USER,
  INITIAL_DEMO_DRIVERS,
  INITIAL_DEMO_TEAMS,
} from './userPreferences'

// Mock localStorage for Node test runner
const memoryStore: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, val: string) => { memoryStore[key] = val },
  removeItem: (key: string) => { delete memoryStore[key] },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]) },
}

// @ts-expect-error Mocking global for testing
global.localStorage = localStorageMock
// @ts-expect-error Mocking window for testing
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
}

describe('userPreferences engine', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('saves and retrieves user profile correctly', () => {
    expect(getStoredUserProfile()).toBeNull()
    saveStoredUserProfile(DEMO_VIP_USER)
    const profile = getStoredUserProfile()
    expect(profile?.displayName).toBe('Alex Turner')
    expect(profile?.paddockTier).toBe('VIP Gold')
  })

  it('logs in demo VIP user with preloaded favorites and check-ins', () => {
    const user = loginAsDemoUser()
    expect(user.displayName).toBe('Alex Turner')
    expect(user.checkInStreak).toBe(3)

    const drivers = getStoredFollowedDrivers()
    expect(drivers.length).toBe(INITIAL_DEMO_DRIVERS.length)
    expect(drivers.some(d => d.code === 'HAM')).toBe(true)

    const teams = getStoredFollowedTeams()
    expect(teams.length).toBe(INITIAL_DEMO_TEAMS.length)
    expect(teams.some(t => t.name === 'Scuderia Ferrari')).toBe(true)

    const checkIns = getStoredCheckIns()
    expect(checkIns.length).toBe(3)
    expect(checkIns[0].circuit).toBe('Silverstone')
  })

  it('toggles followed drivers and teams', () => {
    saveStoredFollowedDrivers([])
    const current = getStoredFollowedDrivers()
    expect(current.length).toBe(0)

    const updated = [
      ...current,
      { code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', series: 'f1', addedAt: new Date().toISOString() }
    ]
    saveStoredFollowedDrivers(updated)
    expect(getStoredFollowedDrivers().length).toBe(1)
    expect(getStoredFollowedDrivers()[0].code).toBe('VER')
  })
})
