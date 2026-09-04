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
    <div ref={ref} className="relative flex-1">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white/5 border border-[var(--border-subtle)] px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] cursor-pointer flex items-center justify-between select-none ${selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedOption.color }} />
              )}
              {selectedOption.name} ({selectedOption.team})
            </>
          ) : (
            placeholder
          )}
        </div>
        <ChevronDown size={16} color="var(--text-muted)" className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] max-h-[220px] overflow-y-auto z-50 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {options.map(option => (
              <div
                key={option.code}
                onClick={() => { onChange(option.code); setIsOpen(false); }}
                className={`px-3 py-2.5 cursor-pointer flex items-center justify-between text-[14px] transition-colors duration-100 text-[var(--text-primary)] ${value === option.code ? 'bg-white/5' : 'bg-transparent hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                  )}
                  {option.name} <span className="text-[var(--text-muted)]">({option.team})</span>
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

  const hasDuplicatePicks = new Set([predictions.p1, predictions.p2, predictions.p3].filter(Boolean)).size !== [predictions.p1, predictions.p2, predictions.p3].filter(Boolean).length

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
      if (session?.user) {
        checkExistingPrediction(session.user.id)
      } else {
        try {
          const guestKey = `apexis_guest_fantasy_${series}_${round}`
          const stored = localStorage.getItem(guestKey)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.p1 && parsed.p2 && parsed.p3) {
              setPredictions(parsed)
              setSubmitted(true)
            }
          }
        } catch {}
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          checkExistingPrediction(session.user.id)
        } else {
          try {
            const guestKey = `apexis_guest_fantasy_${series}_${round}`
            const stored = localStorage.getItem(guestKey)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.p1 && parsed.p2 && parsed.p3) {
                setPredictions(parsed)
                setSubmitted(true)
                return
              }
            }
          } catch {}
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
      } else {
        setPredictions({ p1: '', p2: '', p3: '' })
        setSubmitted(false)
        setScore(null)
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
    if (!predictions.p1 || !predictions.p2 || !predictions.p3 || hasDuplicatePicks) return
    
    setLoading(true)
    try {
      if (user) {
        const res = await fetch('/api/fantasy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
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
        toast.success("Podium predictions submitted to global leaderboard!")
      } else {
        try {
          const guestKey = `apexis_guest_fantasy_${series}_${round}`
          localStorage.setItem(guestKey, JSON.stringify(predictions))
        } catch {}
        setSubmitted(true)
        toast.success("Podium predictions locked! Sign in to join the global leaderboard.")
      }
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
      ? `I scored ${score} pts in the ${series.toUpperCase()} Fantasy Game for Round ${round}! Play now at Apexis!`
      : `I just predicted my podium for ${series.toUpperCase()} Round ${round}!\nP1: ${predictions.p1}\nP2: ${predictions.p2}\nP3: ${predictions.p3}\nPlay now at Apexis!`
      
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
    <div className="card glass rounded-[var(--radius-xl)] p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm flex items-center justify-center">
          <Trophy size={16} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">Fantasy Predictions</h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            Round {round} Podium
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Side: Prediction Form or Results */}
        <div>
          {isAuthLoading ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-[14px]">
              Loading game state...
            </div>
          ) : !submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!user && (
                <div className="flex items-center justify-between text-xs text-[var(--amber)] bg-[var(--amber)]/10 border border-[var(--amber)]/20 px-3 py-2 rounded-[var(--radius-md)]">
                  <span>Guest Paddock Pass • Saved locally</span>
                  <Link href="/login" className="font-bold underline hover:text-white transition-colors">
                    Sign in to rank
                  </Link>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {(['p1', 'p2', 'p3'] as const).map((pos, idx) => (
                  <div key={pos} className="flex items-center gap-3">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${idx === 0 ? 'bg-[var(--amber)] text-black' : idx === 1 ? 'bg-slate-400 text-white' : 'bg-amber-700 text-white'}`}
                    >
                      {idx + 1}
                    </div>
                    <CustomSelect
                      value={predictions[pos]}
                      onChange={(val) => setPredictions(prev => {
                        const next = { ...prev, [pos]: val }
                        for (const key of ['p1', 'p2', 'p3'] as const) {
                          if (key !== pos && next[key] === val) {
                            next[key] = ''
                          }
                        }
                        return next
                      })}
                      options={sortedDrivers}
                      placeholder="Select Driver"
                    />
                  </div>
                ))}
              </div>

              <button 
                type="submit"
                disabled={loading || !predictions.p1 || !predictions.p2 || !predictions.p3 || hasDuplicatePicks}
                className="btn-primary mt-2"
              >
                {loading ? 'Saving...' : 'Lock Predictions'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${score !== null ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {score !== null ? <Trophy size={32} /> : <CheckCircle size={32} />}
              </div>
              
              <div>
                <h3 className="text-lg font-bold m-0 mb-2">
                  {score !== null ? `You Scored ${score} pts!` : 'Predictions Locked!'}
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] m-0">
                  {score !== null ? 'Final results have been calculated.' : 'Waiting for the race to finish...'}
                </p>
                {!user && (
                  <p className="text-[11px] text-[var(--amber)] mt-1">
                    Guest Pass Active • <Link href="/login" className="underline font-semibold">Sign in</Link> to sync to the leaderboard
                  </p>
                )}
              </div>

              <div className="flex gap-3 my-4">
                <div className="text-center">
                  <div className="font-mono font-black text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5 tracking-wider">P1</div>
                  <div className="text-xs font-semibold">{predictions.p1}</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-black text-xs px-2.5 py-1 rounded bg-slate-400/20 text-slate-200 border border-slate-400/40 mb-1.5 tracking-wider">P2</div>
                  <div className="text-xs font-semibold">{predictions.p2}</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-black text-xs px-2.5 py-1 rounded bg-amber-700/20 text-amber-500 border border-amber-700/40 mb-1.5 tracking-wider">P3</div>
                  <div className="text-xs font-semibold">{predictions.p3}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleShare} className="hover-lift bg-white/5 border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <Share2 size={14} />
                  Share Results
                </button>
                {!user && (
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-[var(--text-muted)] hover:text-white underline cursor-pointer py-2 px-1"
                  >
                    Edit Picks
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Global Leaderboard */}
        <div className="border-l border-[var(--border-subtle)] pl-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-muted)] mb-4">
            Global Leaderboard
          </h3>
          
          {leaderboard.length === 0 ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[13px]">
              <AlertCircle size={14} />
              No scores yet. Be the first!
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[250px]">
              {leaderboard.map((lbUser, idx) => (
                <div key={lbUser.userId} className={`flex items-center justify-between py-2 px-3 bg-white/5 rounded-[var(--radius-sm)] border ${user?.id === lbUser.userId ? 'border-yellow-500/30' : 'border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold ${idx === 0 ? 'text-[#fbbf24]' : idx === 1 ? 'text-[#94a3b8]' : idx === 2 ? 'text-[#b45309]' : 'text-[var(--text-muted)]'}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {lbUser.username}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">
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
