'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, CheckCircle, Share2, AlertCircle, ChevronDown, Check } from 'lucide-react'
import { SERIES_DRIVERS } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'

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

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: any[];
  placeholder: string;
}

function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.code === value);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-subtle)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedOption.color }} />
              )}
              {selectedOption.name} ({selectedOption.team})
            </>
          ) : (
            placeholder
          )}
        </div>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '220px',
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {options.map(option => (
              <div
                key={option.code}
                onClick={() => { onChange(option.code); setIsOpen(false); }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: value === option.code ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = value === option.code ? 'rgba(255,255,255,0.05)' : 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {option.color && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: option.color }} />
                  )}
                  {option.name} <span style={{ color: 'var(--text-muted)' }}>({option.team})</span>
                </div>
                {value === option.code && <Check size={16} color="var(--text-primary)" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FantasyGame({ series, round }: FantasyGameProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [predictions, setPredictions] = useState<Prediction>({ p1: '', p2: '', p3: '' })
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{ username: string, totalScore: number, userId: string }[]>([])
  
  const supabase = createClient()

  const drivers = SERIES_DRIVERS[series] || SERIES_DRIVERS['f1']
  const sortedDrivers = [...drivers].sort((a, b) => a.name.localeCompare(b.name))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
      if (session?.user) {
        checkExistingPrediction(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          checkExistingPrediction(session.user.id)
        } else {
          setSubmitted(false)
        }
      }
    )

    fetchLeaderboard()

    return () => subscription.unsubscribe()
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
    if (!user || !predictions.p1 || !predictions.p2 || !predictions.p3) return
    
    setLoading(true)
    const username = user.email?.split('@')[0] || 'Anonymous'

    try {
      const res = await fetch('/api/fantasy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username,
          series,
          round,
          ...predictions
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit prediction")
      }
      setSubmitted(true)
      fetchLeaderboard() // Refresh in case we added a new user
    } catch (e: any) {
      if (e.message) {
        toast.error(e.message)
      }
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const text = score !== null 
      ? `I scored ${score} pts in the ${series.toUpperCase()} Fantasy Game for Round ${round}! 🏆 Play now at Apexis!`
      : `I just predicted my podium for ${series.toUpperCase()} Round ${round}! 🏆\n🥇 ${predictions.p1}\n🥈 ${predictions.p2}\n🥉 ${predictions.p3}\nPlay now at Apexis!`
      
    if (navigator.share) {
      navigator.share({ title: 'Apexis Fantasy', text })
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Results copied to clipboard!")
      }).catch(err => {
        toast.error("Failed to copy to clipboard")
      })
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
          {isAuthLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Loading game state...
            </div>
          ) : !user ? (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              justifyContent: 'center', gap: '16px', height: '100%', 
              textAlign: 'center', padding: '24px'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)'
              }}>
                <Trophy size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>Log In to Play</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Create an account to submit your predictions and join the global leaderboard.
                </p>
              </div>
              <Link href="/login" className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }}>
                Sign In
              </Link>
            </div>
          ) : !submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <CustomSelect
                      value={predictions[pos]}
                      onChange={(val) => setPredictions(prev => ({ ...prev, [pos]: val }))}
                      options={sortedDrivers}
                      placeholder="Select Driver"
                    />
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                disabled={loading || !user || !predictions.p1 || !predictions.p2 || !predictions.p3}
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
              {leaderboard.map((lbUser, idx) => (
                <div key={lbUser.userId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: user?.id === lbUser.userId ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '12px', fontWeight: 800, 
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)' 
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {lbUser.username}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {lbUser.totalScore}
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
