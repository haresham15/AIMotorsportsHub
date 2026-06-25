'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          router.push('/')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        {/* Racing line accent */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: '120%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(139,92,246,0.3), transparent)',
          transform: 'rotate(-5deg)',
        }} />
        <div style={{
          position: 'absolute',
          top: '80%',
          left: '-10%',
          width: '120%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)',
          transform: 'rotate(3deg)',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.015) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo & Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }} className="animate-fade-in-up">
          <div style={{
            fontSize: '52px',
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.3))',
          }}>🏎️</div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            The Motorsport Hub
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.5,
          }}>
            Your personalized racing command center
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass animate-fade-in-up delay-200" style={{
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Glow accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent-blue), var(--accent-purple), transparent)',
          }} />

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    inputBackground: 'rgba(255,255,255,0.04)',
                    inputBorder: 'rgba(255,255,255,0.08)',
                    inputText: '#f1f5f9',
                    inputPlaceholder: '#64748b',
                    inputBorderFocus: '#3b82f6',
                    inputBorderHover: 'rgba(255,255,255,0.15)',
                  },
                  borderWidths: {
                    buttonBorderWidth: '0px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    inputBorderRadius: '12px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '13px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: 'var(--font-sans)',
                    buttonFontFamily: 'var(--font-sans)',
                    inputFontFamily: 'var(--font-sans)',
                    labelFontFamily: 'var(--font-sans)',
                  },
                  space: {
                    inputPadding: '14px 16px',
                    buttonPadding: '14px 16px',
                  },
                },
              },
              style: {
                button: {
                  fontWeight: '600',
                  letterSpacing: '0.01em',
                },
                anchor: {
                  color: '#3b82f6',
                  fontWeight: '500',
                  fontSize: '13px',
                },
                label: {
                  color: '#94a3b8',
                  fontWeight: '500',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                },
                message: {
                  color: '#f87171',
                  fontSize: '13px',
                },
              },
            }}
            theme="dark"
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : '/'}
          />
        </div>

        {/* Footer */}
        <div className="animate-fade-in delay-500" style={{
          textAlign: 'center',
          marginTop: '32px',
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            F1 · F2 · F3 · Formula E · NASCAR · GTC · Top Fuel
          </p>
        </div>
      </div>
    </div>
  )
}
