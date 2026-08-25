import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const FANTASY_FILE = path.join(DATA_DIR, 'fantasy.json')

export interface Prediction {
  id: string
  userId: string
  username: string
  series: string
  round: number
  p1: string // Driver ID/Code
  p2: string
  p3: string
  score?: number
  scoredAt?: string
}

export interface FantasyStore {
  predictions: Prediction[]
}

// Initialize the store if it doesn't exist
function initStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(FANTASY_FILE)) {
    fs.writeFileSync(FANTASY_FILE, JSON.stringify({ predictions: [] }, null, 2))
  }
}

export function getFantasyStore(): FantasyStore {
  initStore()
  try {
    const data = fs.readFileSync(FANTASY_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    console.error('Error reading fantasy store:', e)
    return { predictions: [] }
  }
}

export function saveFantasyStore(store: FantasyStore) {
  initStore()
  fs.writeFileSync(FANTASY_FILE, JSON.stringify(store, null, 2))
}

export function addPrediction(prediction: Omit<Prediction, 'id'>) {
  const store = getFantasyStore()
  const newPrediction: Prediction = {
    ...prediction,
    id: Math.random().toString(36).substring(2, 9),
  }
  
  // Update if user already predicted for this round
  const existingIndex = store.predictions.findIndex(p => 
    p.userId === prediction.userId && 
    p.series === prediction.series && 
    p.round === prediction.round
  )

  if (existingIndex >= 0) {
    store.predictions[existingIndex] = { ...store.predictions[existingIndex], ...newPrediction, id: store.predictions[existingIndex].id }
  } else {
    store.predictions.push(newPrediction)
  }
  
  saveFantasyStore(store)
  return newPrediction
}

export function getPredictionsForRound(series: string, round: number) {
  const store = getFantasyStore()
  return store.predictions.filter(p => p.series === series && p.round === round)
}

export function calculateScores(series: string, round: number, actualResults: string[]) {
  // actualResults should be an array of driver codes: [p1_code, p2_code, p3_code]
  const store = getFantasyStore()
  let updated = false

  store.predictions.forEach(p => {
    if (p.series === series && p.round === round && p.score === undefined) {
      let score = 0
      
      const p1Actual = actualResults[0]
      const p2Actual = actualResults[1]
      const p3Actual = actualResults[2]
      
      // Exact position points (5 pts)
      if (p.p1 === p1Actual) score += 5
      else if (actualResults.includes(p.p1)) score += 2 // Podium but wrong position

      if (p.p2 === p2Actual) score += 5
      else if (actualResults.includes(p.p2)) score += 2

      if (p.p3 === p3Actual) score += 5
      else if (actualResults.includes(p.p3)) score += 2

      p.score = score
      p.scoredAt = new Date().toISOString()
      updated = true
    }
  })

  if (updated) saveFantasyStore(store)
}
