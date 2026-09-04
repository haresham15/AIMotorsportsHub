'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Loader from '@/components/ui/Loader'
import { ShieldCheck, Star, Flame, Radio, ArrowRight, Zap } from 'lucide-react'
import { loginAsDemoUser } from '@/lib/userPreferences'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success("Welcome back to the Paddock!")
        router.push('/profile')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success("Account created successfully! Your Paddock Pass is active.")
        router.push('/profile')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleInstantDemoLogin = () => {
    const user = loginAsDemoUser()
    toast.success(`Welcome to the Paddock, ${user.displayName}! VIP Gold Pass activated.`)
    router.push('/profile')
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] py-12">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left: Perks & Member Experience */}
        <div className="flex flex-col gap-6 order-2 md:order-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <ShieldCheck size={13} />
              Paddock Pass Membership
            </div>
            <h1 className="font-[family-name:var(--font-disp)] uppercase text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
              Elevate Your <span className="text-[var(--amber)]">Race Weekend</span>.
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2.5 leading-relaxed">
              Unlock personalized live telemetry, track your favorite constructors and drivers across sessions, and build your race weekend check-in streak.
            </p>
          </div>

          {/* Member Benefits List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Star size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Track Favorite Teams &amp; Drivers</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Follow Ferrari, Red Bull, Hamilton, or Norris and highlight their telemetry deltas on the live map and leaderboard.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Flame size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Grand Prix Race Check-Ins</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Check in during race sessions, build attendance streaks, and earn loyalty accreditation badges.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Radio size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Personalized Pit Radio &amp; Profile</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Direct AI pit radio responses tailored to your supported driver and custom pit notifications.
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Instant Demo Login Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                Quick Preview
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">No credentials required</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] m-0">
              Want to test the full personalized experience immediately? Enter with a pre-configured VIP Paddock Pass.
            </p>
            <button
              onClick={handleInstantDemoLogin}
              className="mt-1 w-full py-2.5 px-4 rounded-lg bg-[var(--amber)] hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-[0_0_16px_rgba(255,176,32,0.4)]"
            >
              <span>Instant Paddock Pass (VIP Fan Demo)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Authentication Card */}
        <div className="card glass animate-fade-in-up p-8 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)] order-1 md:order-2 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-tight text-white mb-2">
              {isLogin ? 'Pit Lane Login' : 'Register Pass'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isLogin 
                ? 'Sign in to access your saved favorites and race check-ins.' 
                : 'Join Apexis for personalized race weekend telemetry.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {error && (
              <div className="bg-[var(--flag-red)]/10 border border-[var(--flag-red)]/20 text-[var(--flag-red)] p-3 rounded-[var(--radius-md)] text-xs text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="driver@pitwall.com"
                className="glass-input w-full p-3 text-sm rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full p-3 text-sm rounded-lg"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full p-3 mt-2 flex items-center justify-center gap-2 text-sm bg-[var(--amber)] text-[#1a1200] font-extrabold uppercase tracking-wider rounded-lg transition-transform hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)] cursor-pointer" 
              disabled={loading}
            >
              {loading && <Loader size="xs" inline />}
              {isLogin ? 'Sign In to Paddock' : 'Create Paddock Pass'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-[var(--text-muted)]">
            {isLogin ? "Don't have a Paddock Pass? " : "Already registered? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="bg-transparent border-none text-[var(--amber)] font-bold cursor-pointer p-0 hover:underline"
            >
              {isLogin ? 'Register now' : 'Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-white no-underline transition-colors">
              Continue as Guest &rarr;
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
