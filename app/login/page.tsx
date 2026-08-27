'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ApexisLogo from '@/components/ui/ApexisLogo'
import { toast } from 'sonner'

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
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        // If sign up is successful and email confirmation is disabled, user is logged in automatically
        // If email confirmation is enabled, they need to check email. For now we assume no confirmation required for prototype
        toast.success("Account created successfully! You are now logged in.")
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== NAVBAR ===== */}
      <nav className="glass-nav px-6">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-extrabold flex items-center gap-2 text-[var(--text-primary)] no-underline">
            <ApexisLogo width={24} height={24} />
            Apexis
          </Link>
          <Link href="/" className="btn-ghost flex items-center gap-1.5 no-underline">
            <ArrowLeft size={14} />
            <span>Back to Apexis</span>
          </Link>
        </div>
      </nav>

      {/* ===== LOGIN FORM ===== */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card glass animate-fade-in-up w-full max-w-[400px] p-8 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold mb-2">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {isLogin 
                ? 'Sign in to access Fantasy Predictions and more.' 
                : 'Join Apexis to start playing Fantasy Predictions.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-[var(--radius-md)] text-[13px] text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-[var(--border-subtle)] p-3 rounded-[var(--radius-md)] text-[var(--text-primary)] text-[15px] font-sans outline-none focus:border-[var(--accent-blue)] transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
                Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-[var(--border-subtle)] p-3 rounded-[var(--radius-md)] text-[var(--text-primary)] text-[15px] font-sans outline-none focus:border-[var(--accent-blue)] transition-colors"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full p-3 mt-2 flex items-center justify-center gap-2 text-[15px]" 
              disabled={loading}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-[var(--text-muted)]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="bg-transparent border-none text-[var(--accent-blue)] font-semibold cursor-pointer p-0 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
