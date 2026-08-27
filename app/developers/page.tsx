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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Simple Header */}
      <header className="py-6 px-12 border-b border-white/5 flex justify-between items-center">
        <Link href="/" className="text-xl font-extrabold text-[var(--accent)] no-underline">
          APEXIS
        </Link>
        <div className="flex gap-6">
          <Link href="/dashboard/f1" className="text-[var(--text-secondary)] no-underline">Dashboard</Link>
          <span className="text-white font-semibold">Developers</span>
        </div>
      </header>

      <main className="max-w-[800px] my-16 mx-auto px-6">
        <h1 className="text-4xl mb-4">Developer API (v1)</h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-12">
          Build your own racing applications using our unified API. Get real-time telemetry, 
          championship standings, and race schedules across 7 different motorsport series with a single API key.
        </p>

        <div className="glass p-8 rounded-[var(--radius-xl)] mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Key size={24} color="var(--accent)" />
            <h2 className="text-2xl m-0">Your API Key</h2>
          </div>

          {!apiKey ? (
            <div className="text-center py-10">
              <p className="text-[var(--text-muted)] mb-6">
                You haven't generated an API key yet.
              </p>
              <button onClick={generateKey} className="btn-primary" disabled={loading}>
                {loading ? 'Generating...' : 'Generate API Key'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[var(--text-muted)] mb-3 text-sm">
                Keep this key secret. Do not expose it in client-side code.
              </p>
              <div className="flex bg-black/50 border border-white/10 rounded-[var(--radius-md)] overflow-hidden">
                <div className="flex-1 p-4 font-mono tracking-widest">
                  {apiKey}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="px-6 bg-white/5 border-none border-l border-white/10 text-white cursor-pointer flex items-center gap-2"
                >
                  {copied ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className="text-2xl mb-6">Quick Start</h2>
        <div className="glass p-6 rounded-[var(--radius-lg)]">
          <div className="flex items-center gap-3 mb-4 text-[var(--text-secondary)]">
            <Terminal size={20} />
            <span className="font-semibold">Get F1 Championship Standings</span>
          </div>
          <pre className="bg-black p-6 rounded-[var(--radius-md)] overflow-x-auto font-mono text-sm leading-relaxed text-indigo-300">
{`curl -X GET "https://api.apexis.com/api/v1/f1/standings" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          </pre>
        </div>
      </main>
    </div>
  )
}
