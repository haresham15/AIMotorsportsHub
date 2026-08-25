'use client'

import { useState, useEffect } from 'react'
import { Trophy, CheckCircle, Share2, AlertCircle } from 'lucide-react'
import { SERIES_DRIVERS } from '@/lib/data'

interface FantasyGameProps {
  series: string
  round: number
}

interface Prediction {
  p1: string
  p2: string
  p3: string
  score?: number
}

export default function FantasyGame({ series, round }: FantasyGameProps) {
  const [username, setUsername] = useState('')
  const [predictions, setPredictions] = useState<Prediction>({ p1: '', p2: '', p3: '' })
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ username: string, totalScore: number }[]>([])

  const drivers = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1']
  const sortedDrivers = [...drivers].sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    // Check local storage for an existing username
    const savedUser = localStorage.getItem('motorsport-hub-user')
    if (savedUser) {
      setUsername(savedUser)
      checkExistingPrediction(savedUser)
    }
    fetchLeaderboard()
  }, [series, round])

  const checkExistingPrediction = async (userId: string) => {
    try {
      const res = await fetch(`/api/fantasy?series=${series}&round=${round}`)
      const data = await res.json()
      const myPred = data.predictions?.find((p: any) => p.userId === userId)
      if (myPred) {
        setPredictions({ p1: myPred.p1, p2: myPred.p2, p3: myPred.p3 })
        setSubmitted(true)
        if (myPred.score !== undefined) setScore(myPred.score)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/fantasy?action=leaderboard')
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !predictions.p1 || !predictions.p2 || !predictions.p3) return
    
    setLoading(true)
    localStorage.setItem('motorsport-hub-user', username)

    try {
      await fetch('/api/fantasy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: username,
          username,
          series,
          round,
          ...predictions
        })
      })
      setSubmitted(true)
      fetchLeaderboard() // Refresh in case we added a new user
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const text = score !== null 
      ? `I scored ${score} pts in the ${series.toUpperCase()} Fantasy Game for Round ${round}! 🏎️🏆 Play now at The Motorsport Hub!`
      : `I just predicted my podium for ${series.toUpperCase()} Round ${round}! 🏎️🏆\n🥇 ${predictions.p1}\n🥈 ${predictions.p2}\n🥉 ${predictions.p3}\nPlay now at The Motorsport Hub!`
      
    if (navigator.share) {
      navigator.share({ title: 'Motorsport Hub Fantasy', text })
    } else {
      navigator.clipboard.writeText(text)
      alert("Results copied to clipboard!")
    }
  }

  return (
    <div className="card" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(234,179,8,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#eab308',
        }}>
          <Trophy size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Fantasy Predictions</h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Round {round} Podium
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Side: Prediction Form or Results */}
        <div>
          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter a username..."
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)',
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(['p1', 'p2', 'p3'] as const).map((pos, idx) => (
                  <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', 
                      background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#b45309',
                      color: idx === 0 ? '#000' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '12px', flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <select
                      value={predictions[pos]}
                      onChange={e => setPredictions(prev => ({ ...prev, [pos]: e.target.value }))}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                      required
                    >
                      <option value="" disabled>Select Driver</option>
                      {sortedDrivers.map(d => (
                        <option key={d.code} value={d.code}>{d.name} ({d.team})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                disabled={loading || !username || !predictions.p1 || !predictions.p2 || !predictions.p3}
                className="btn-primary"
                style={{ marginTop: '8px' }}
              >
                {loading ? 'Saving...' : 'Lock Predictions'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', height: '100%', textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: score !== null ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                color: score !== null ? '#4ade80' : '#60a5fa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {score !== null ? <Trophy size={32} /> : <CheckCircle size={32} />}
              </div>
              
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>
                  {score !== null ? `You Scored ${score} pts!` : 'Predictions Locked!'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  {score !== null ? 'Final results have been calculated.' : 'Waiting for the race to finish...'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', margin: '16px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🥇</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{predictions.p1}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🥈</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{predictions.p2}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🥉</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{predictions.p3}</div>
                </div>
              </div>

              <button onClick={handleShare} className="hover-lift" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}>
                <Share2 size={14} />
                Share Results
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Global Leaderboard */}
        <div style={{
          borderLeft: '1px solid var(--border-subtle)',
          paddingLeft: '32px',
        }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Global Leaderboard
          </h3>
          
          {leaderboard.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <AlertCircle size={14} />
              No scores yet. Be the first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '250px' }}>
              {leaderboard.map((user, idx) => (
                <div key={user.username} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: username === user.username ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '12px', fontWeight: 800, 
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' 
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {user.username}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.totalScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
