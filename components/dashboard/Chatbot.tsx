'use client'

import { useState, useRef, useEffect } from 'react'
import { SERIES_MAP } from '@/lib/data'
import { Bot, Send, Sparkles } from 'lucide-react'

interface ChatbotProps {
  series: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot({ series }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const seriesInfo = SERIES_MAP[series]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, series }),
      })

      const data = await response.json()
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process your request.',
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Error: Could not connect to the AI service. Please try again later.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    'Who is leading?',
    'Track conditions?',
    'Latest results',
    'Championship standings',
  ]

  return (
    <div className="glass" style={{
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      height: '520px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(59,130,246,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60a5fa',
        }}>
          <Bot size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Race Engineer AI</h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {seriesInfo?.name || series.toUpperCase()} Expert
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '4px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '16px',
            textAlign: 'center',
            padding: '20px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(59,130,246,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={24} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '4px',
              }}>
                Race Control Online
              </p>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}>
                Ask me about {seriesInfo?.name || series.toUpperCase()} stats, regulations, or history
              </p>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '8px',
            }}>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.borderColor = 'var(--border-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className="animate-fade-in"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '85%',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                ...(msg.role === 'user'
                  ? {
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    borderBottomRightRadius: '4px',
                  }
                  : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    borderBottomLeftRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }),
              }}>
                <p style={{
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)',
              borderBottomLeftRadius: '4px',
              padding: '12px 20px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              border: '1px solid var(--border-subtle)',
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: '7px',
                  height: '7px',
                  background: '#60a5fa',
                  borderRadius: '50%',
                  animation: `pulseGlow 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(0,0,0,0.2)',
        padding: '8px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Race Control..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            padding: '8px 12px',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: !input.trim() || loading
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            color: !input.trim() || loading ? 'var(--text-muted)' : 'white',
            cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
