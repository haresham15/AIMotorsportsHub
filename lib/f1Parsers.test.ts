import { describe, expect, it } from 'vitest'
import { getRaceStatus, parseStandings } from './f1Parsers'

describe('F1 parsers', () => {
  it('normalizes numeric standings fields', () => {
    const driver = { MRData:{StandingsTable:{StandingsLists:[{DriverStandings:[{position:'1',points:'25.5',wins:'1',Driver:{driverId:'ver',code:'VER',givenName:'Max',familyName:'Verstappen'},Constructors:[{constructorId:'red_bull',name:'Red Bull'}]}]}]}} }
    const constructors = { MRData:{StandingsTable:{StandingsLists:[{ConstructorStandings:[]}]}} }
    expect(parseStandings(driver, constructors).driverStandings[0]).toMatchObject({position:1,points:25.5,wins:1,driverId:'ver'})
  })
  it('classifies upcoming, live, and completed rounds', () => {
    const race = { date:'2026-06-07', time:'14:00:00Z', FirstPractice:{date:'2026-06-05T10:00:00Z'} }
    expect(getRaceStatus(race, new Date('2026-06-04'))).toBe('upcoming')
    expect(getRaceStatus(race, new Date('2026-06-06'))).toBe('live')
    expect(getRaceStatus(race, new Date('2026-06-07T15:00:00Z'))).toBe('live')
    expect(getRaceStatus(race, new Date('2026-06-08'))).toBe('completed')
  })
})
