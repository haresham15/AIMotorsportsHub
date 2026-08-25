'use client'

import { useState } from 'react'
import { Key, Copy, Check, Terminal, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DevelopersPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateKey = () => {
    setLoading(true)
    // Mock key generation since we aren't wired to Supabase auth in this environment
    setTimeout(() => {
      const newKey = 'mh_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      setApiKey(newKey)
      setLoading(false)
    }, 800)
  }

  const copyToClipboard = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Simple Header */}
      <header style={{ padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', textDecoration: 'none' }}>
          APEXIS
        </Link>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/dashboard/f1" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: 'white', fontWeight: 600 }}>Developers</span>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Developer API (v1)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px' }}>
          Build your own racing applications using our unified API. Get real-time telemetry, 
          championship standings, and race schedules across 7 different motorsport series with a single API key.
        </p>

        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Key size={24} color="var(--accent)" />
            <h2 style={{ fontSize: '24px', margin: 0 }}>Your API Key</h2>
          </div>

          {!apiKey ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                You haven't generated an API key yet.
              </p>
              <button onClick={generateKey} className="btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate API Key'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '14px' }}>
                Keep this key secret. Do not expose it in client-side code.
              </p>
              <div style={{ 
                display: 'flex', 
                background: 'rgba(0,0,0,0.5)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <div style={{ flex: 1, padding: '16px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                  {apiKey}
                </div>
                <button 
                  onClick={copyToClipboard}
                  style={{ 
                    padding: '0 24px', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: 'none', 
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {copied ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Quick Start</h2>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <Terminal size={20} />
            <span style={{ fontWeight: 600 }}>Get F1 Championship Standings</span>
          </div>
          <pre style={{ 
            background: '#000', 
            padding: '24px', 
            borderRadius: 'var(--radius-md)', 
            overflowX: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#a5b4fc'
          }}>
{`curl -X GET "https://api.apexis.com/api/v1/f1/standings" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          </pre>
        </div>
      </main>
    </div>
  )
}
