'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Radio, Zap, Sparkles, RefreshCw } from 'lucide-react'
import { SERIES_MAP } from '@/lib/data'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatbotProps {
  series: string
  contextData?: Record<string, any>
}

export default function Chatbot({ series, contextData }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const seriesInfo = SERIES_MAP[series]

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isStreaming])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return

    // Cancel any previous transmission in progress to respond instantly
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const userMessage: Message = { role: 'user', content: promptText }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setIsStreaming(false)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, series, contextData }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply || 'Copy that. Transmission unclear, standing by.' },
        ])
        setLoading(false)
      } else if (response.body) {
        // Stream text token-by-token directly into chat feed
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
        setLoading(false)
        setIsStreaming(true)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          setMessages((prev) => {
            const next = [...prev]
            if (next.length > 0 && next[next.length - 1].role === 'assistant') {
              next[next.length - 1] = { role: 'assistant', content: accumulated }
            }
            return next
          })
        }
        setIsStreaming(false)
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Radio static: Could not reach race control. Please repeat.',
        },
      ])
      setLoading(false)
      setIsStreaming(false)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendPrompt(input)
  }

  const suggestedQuestions = [
    'Who is leading?',
    'What are the gaps to P1?',
    'Tire compound strategy?',
    'Championship standings',
  ]

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[rgba(20,23,28,0.9)] hover:bg-[var(--surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--amber)] text-white shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all cursor-pointer"
        aria-label="Open Race Engineer AI"
      >
        <div className="relative">
          <Radio size={20} className="text-[var(--amber)] group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--green-flag)] shadow-[0_0_8px_var(--green-flag)] animate-pulse" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold tracking-wider font-mono uppercase text-white">Race Engineer</div>
          <div className="text-[10px] text-[var(--amber)] font-mono">Radio Online</div>
        </div>
      </button>
    )
  }

  return (
    <div className="card glass w-[390px] h-[540px] max-w-[calc(100vw-2rem)] rounded-[var(--radius-xl)] p-5 flex flex-col relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-2xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-[var(--amber)] flex items-center justify-center">
            <Radio size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-sm font-extrabold uppercase tracking-wide text-white m-0">Race Engineer AI</h2>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--green-flag)]/15 text-[var(--green-flag)] border border-[var(--green-flag)]/30">
                COMMS 1
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono m-0">
              {seriesInfo?.name || series.toUpperCase()} Pit Wall Telemetry
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10 cursor-pointer flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto mb-2 flex flex-col gap-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--amber)] shadow-inner">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wide">
                Pit Wall Connected
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed m-0 max-w-[260px]">
                Ask about live gaps, sector times, tire degradation, or regulations.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendPrompt(q)}
                  className="bg-white/5 border border-[var(--border-subtle)] rounded-full px-3 py-1.5 text-[11px] font-mono text-[var(--text-secondary)] hover:text-white hover:border-[var(--amber)] hover:bg-white/10 cursor-pointer transition-all"
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
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[9px] font-mono text-[var(--text-muted)] mb-1 px-1 uppercase tracking-wider">
                {msg.role === 'user' ? 'DRIVER // CAR 1' : 'PIT WALL // ENGINEER'}
              </span>
              <div 
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--amber)] text-black font-semibold rounded-br-xs'
                    : 'bg-white/5 text-[var(--text-primary)] rounded-bl-xs border border-[var(--border-subtle)]'
                }`}
              >
                <p className="whitespace-pre-wrap m-0 font-sans">
                  {msg.content}
                  {msg.role === 'assistant' && idx === messages.length - 1 && isStreaming && (
                    <span className="inline-block w-1.5 h-3 ml-1 bg-[var(--amber)] animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex flex-col items-start animate-fade-in">
            <span className="text-[9px] font-mono text-[var(--text-muted)] mb-1 px-1 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)] animate-ping" />
              RADIO TRANSMISSION INCOMING...
            </span>
            <div className="bg-white/5 rounded-2xl rounded-bl-xs px-4 py-3 flex gap-1.5 items-center border border-[var(--border-subtle)]">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 bg-[var(--amber)] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar (when active conversation) */}
      {messages.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto py-1 mb-2 shrink-0">
          {suggestedQuestions.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => handleSendPrompt(q)}
              disabled={loading}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white border border-white/5 whitespace-nowrap cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-[var(--border-subtle)] shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Radio Race Control..."
          disabled={loading}
          className="flex-1 bg-transparent border-none text-[var(--text-primary)] px-2.5 py-1.5 text-xs outline-none font-sans placeholder:text-[var(--text-muted)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`border-none rounded-lg px-3 py-1.5 flex items-center justify-center transition-all ${
            !input.trim() || loading
              ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-[var(--amber)] text-black font-bold cursor-pointer hover:opacity-90'
          }`}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
