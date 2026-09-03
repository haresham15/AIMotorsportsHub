import { describe, expect, it } from 'vitest'
import { generateReplayData } from './raceSimulator'
import tracks from './generatedTracks.json'

describe('race simulator track math', () => {
  it('uses each F1 circuit lap count for race replays', () => {
    const drivers = [{code:'TST',name:'Test Driver',number:1,team:'Test',color:'#fff'}]
    const monaco = generateReplayData('f1', tracks['Monte Carlo'] as any, drivers, 'Qualifying')
    expect(monaco.totalLaps).toBe(3)
    expect(monaco.sessionInfo.sessionType).toBe('Qualifying')
    expect(tracks['Monte Carlo'].totalLaps).toBe(78)
    expect(tracks.Monza.totalLaps).toBe(53)
    expect(tracks['Monte Carlo'].lengthKm).not.toBe(tracks.Monza.lengthKm)
  })
  it('returns no frames for invalid geometry', () => {
    const replay = generateReplayData('f1', {name:'Bad',country:'',lengthKm:1,totalLaps:10,referenceLine:[]} as any, [], 'Race')
    expect(replay.frames).toEqual([])
    expect(replay.totalLaps).toBe(0)
  })
})
