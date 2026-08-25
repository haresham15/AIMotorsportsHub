'use client'

import { useState, useEffect } from 'react'
import { Bell, Send, Trash2, CheckCircle2 } from 'lucide-react'

export default function AlertSettings() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

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
      setStatus({ type: 'success', message: 'Webhook removed.' })
      return
    }
    
    // Basic validation
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      setStatus({ type: 'error', message: 'Invalid Discord webhook URL.' })
      return
    }

    localStorage.setItem('motorsport-discord-webhook', webhookUrl)
    setSavedUrl(webhookUrl)
    setStatus({ type: 'success', message: 'Webhook saved successfully!' })
  }

  const handleTest = async () => {
    if (!savedUrl) return
    setTesting(true)
    setStatus(null)

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
        setStatus({ type: 'success', message: 'Test alert sent! Check your Discord channel.' })
      } else {
        throw new Error('Failed to send')
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Failed to send test alert. Check the URL.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(99,102,241,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
        }}>
          <Bell size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Outbound Alerts</h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Configure Discord Notifications
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          Receive live proactive alerts for race events, safety car deployments, and session changes directly to your Discord server.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Discord Webhook URL
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="password" 
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button 
              onClick={handleSave}
              className="btn-primary"
              style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {savedUrl && webhookUrl === savedUrl ? <CheckCircle2 size={16} /> : 'Save'}
            </button>
            {savedUrl && (
              <button 
                onClick={() => { setWebhookUrl(''); handleSave(); }}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {status && (
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 500,
            color: status.type === 'success' ? '#4ade80' : '#f87171',
            background: status.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {status.message}
          </div>
        )}

        {savedUrl && (
          <button 
            onClick={handleTest}
            disabled={testing}
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818cf8',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              cursor: testing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            <Send size={14} />
            {testing ? 'Sending...' : 'Send Test Alert'}
          </button>
        )}
      </div>
    </div>
  )
}
