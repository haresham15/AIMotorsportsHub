'use client'

import { useState, useEffect } from 'react'
import { Bell, Send, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AlertSettings() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('motorsport-discord-webhook')
    if (saved) {
      setWebhookUrl(saved)
      setSavedUrl(saved)
    }
  }, [])

  const handleSave = () => {
    if (!webhookUrl.trim()) {
      localStorage.removeItem('motorsport-discord-webhook')
      setSavedUrl('')
      toast.success('Webhook removed.')
      return
    }
    
    // Basic validation
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      toast.error('Invalid Discord webhook URL.')
      return
    }

    localStorage.setItem('motorsport-discord-webhook', webhookUrl)
    setSavedUrl(webhookUrl)
    toast.success('Webhook saved successfully!')
  }

  const handleTest = async () => {
    if (!savedUrl) return
    setTesting(true)

    try {
      const res = await fetch('/api/alerts/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: savedUrl,
          series: 'System',
          eventType: 'TEST_ALERT',
          message: 'This is a test alert from Apexis.',
          data: { Connection: 'Successful' }
        })
      })

      if (res.ok) {
        toast.success('Test alert sent! Check your Discord channel.')
      } else {
        throw new Error('Failed to send')
      }
    } catch (e) {
      toast.error('Failed to send test alert. Check the URL.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm flex items-center justify-center">
          <Bell size={16} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em] m-0">Outbound Alerts</h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium m-0">
            Configure Discord Notifications
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed m-0">
          Receive live proactive alerts for race events, safety car deployments, and session changes directly to your Discord server.
        </p>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
            Discord Webhook URL
          </label>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-white/5 border border-[var(--border-subtle)] px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--text-primary)] text-[14px] font-sans focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              onClick={handleSave}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {savedUrl && webhookUrl === savedUrl ? <CheckCircle2 size={16} /> : 'Save'}
            </button>
            {savedUrl && (
              <button 
                onClick={() => { setWebhookUrl(''); handleSave(); }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 rounded-[var(--radius-md)] cursor-pointer flex items-center transition-colors hover:bg-red-500/20"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>



        {savedUrl && (
          <button 
            onClick={handleTest}
            disabled={testing}
            className={`bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2.5 rounded-[var(--radius-md)] flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors ${testing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-indigo-500/20'}`}
          >
            <Send size={14} />
            {testing ? 'Sending...' : 'Send Test Alert'}
          </button>
        )}
      </div>
    </div>
  )
}
