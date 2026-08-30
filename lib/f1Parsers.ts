export function parseStandings(driverData: any, constructorData: any) {
  const driverRows = driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []
  const constructorRows = constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []
  return {
    driverStandings: driverRows.map((ds: any) => ({ position: Number(ds.position), points: Number(ds.points), wins: Number(ds.wins), driverId: ds.Driver.driverId, driverNumber: ds.Driver.permanentNumber, code: ds.Driver.code, firstName: ds.Driver.givenName, lastName: ds.Driver.familyName, constructorId: ds.Constructors?.[0]?.constructorId, constructorName: ds.Constructors?.[0]?.name })),
    constructorStandings: constructorRows.map((cs: any) => ({ position: Number(cs.position), points: Number(cs.points), wins: Number(cs.wins), constructorId: cs.Constructor.constructorId, constructorName: cs.Constructor.name })),
  }
}

export function getRaceStatus(race: { date: string; time?: string; FirstPractice?: { date?: string } }, now: Date) {
  const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`)
  if (now > raceDate) return 'completed'
  if (now >= new Date(race.FirstPractice?.date || raceDate) && now <= raceDate) return 'live'
  return 'upcoming'
}
