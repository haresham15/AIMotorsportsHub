'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Loader from '@/components/ui/Loader'

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
    <main className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-200px)]">
      <div className="card glass animate-fade-in-up w-full max-w-[400px] p-8 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-disp)] uppercase text-4xl font-extrabold tracking-tight mb-2">
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
            <div className="bg-[var(--flag-red)]/10 border border-[var(--flag-red)]/20 text-[var(--flag-red)] p-3 rounded-[var(--radius-md)] text-[13px] text-center">
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
              className="glass-input w-full p-3 text-[15px]"
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
              className="glass-input w-full p-3 text-[15px]"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full p-3 mt-2 flex items-center justify-center gap-2 text-[15px] bg-[var(--amber)] text-[#1a1200] font-bold rounded-[6px] transition-transform hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)]" 
            disabled={loading}
          >
            {loading && <Loader size="xs" inline />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-[var(--text-muted)]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="bg-transparent border-none text-[var(--amber)] font-semibold cursor-pointer p-0 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </main>
  )
}
