'use client'

import { useState } from 'react'
import { Key, Copy, Check, Terminal } from 'lucide-react'
import Link from 'next/link'
import Loader from '@/components/ui/Loader'

export default function DevelopersPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateKey = () => {
    setLoading(true)
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
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Back to Hub</Link>
      
      <div className="eyebrow mt-8">Developer Tools</div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 font-[family-name:var(--font-disp)] uppercase">Developer API <span className="text-[var(--text-muted)] text-2xl font-mono lowercase tracking-widest">v1</span></h1>
      <p className="text-[var(--text-secondary)] text-lg max-w-[640px] mb-12 leading-[1.65]">
        Build your own racing applications using our unified API. Get real-time telemetry, 
        championship standings, and race schedules across 7 different motorsport series with a single API key.
      </p>

      <div className="card glass rounded-[var(--radius-xl)] p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Key size={24} className="text-[var(--amber)]" />
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-tight m-0">Your API Key</h2>
        </div>

        {!apiKey ? (
          <div className="text-center py-10">
            <p className="text-[var(--text-muted)] mb-6">
              You haven&apos;t generated an API key yet.
            </p>
            <button onClick={generateKey} className="bg-[var(--amber)] text-[#1a1200] font-bold text-[15px] px-[28px] py-[12px] rounded-[6px] transition-transform hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)] flex items-center justify-center gap-2 mx-auto" disabled={loading}>
              {loading && <Loader size="xs" inline />}
              {loading ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[var(--text-muted)] mb-3 text-sm">
              Keep this key secret. Do not expose it in client-side code.
            </p>
            <div className="flex bg-black/50 border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
              <div className="flex-1 p-4 font-mono tracking-widest text-[var(--amber)]">
                {apiKey}
              </div>
              <button 
                onClick={copyToClipboard}
                className="px-6 bg-white/5 border-none border-l border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                {copied ? <Check size={18} className="text-[var(--green-flag)]" /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="eyebrow">Quick Start</div>
      <h2 className="font-[family-name:var(--font-disp)] uppercase text-3xl font-extrabold tracking-tight mb-6">Get Started in Seconds</h2>
      <div className="card glass rounded-[var(--radius-xl)] p-6">
        <div className="flex items-center gap-3 mb-4 text-[var(--text-secondary)]">
          <Terminal size={20} className="text-[var(--amber)]" />
          <span className="font-semibold">Get F1 Championship Standings</span>
        </div>
        <pre className="bg-black/60 p-6 rounded-[var(--radius-md)] overflow-x-auto font-mono text-sm leading-relaxed text-[var(--amber)]">
{`curl -X GET "https://api.apexis.com/api/v1/f1/standings" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        </pre>
      </div>
    </main>
  )
}
