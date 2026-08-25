'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <User size={16} />
          <span className="hide-mobile">{user.email?.split('@')[0]}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Sign out"
        >
          <LogOut size={16} />
          <span className="hide-mobile">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <Link href="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
      Sign In
    </Link>
  )
}
