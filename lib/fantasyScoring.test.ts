import { describe, expect, it } from 'vitest'
import { scorePodiumPrediction } from './fantasyScoring'

describe('fantasy scoring', () => {
  it('awards five for exact and two for misplaced podium drivers', () => expect(scorePodiumPrediction(['A','B','C'], ['A','C','D'])).toBe(7))
  it('awards zero for misses', () => expect(scorePodiumPrediction(['A','B','C'], ['D','E','F'])).toBe(0))
})
