'use client'

import { useState, useRef, useEffect } from 'react'
import { SERIES_MAP } from '@/lib/data'
import { Bot, Send, Sparkles, X, MessageCircle } from 'lucide-react'

interface ChatbotProps {
  series: string
  contextData?: any
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot({ series, contextData }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const seriesInfo = SERIES_MAP[series]

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

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
        body: JSON.stringify({ prompt: input, series, contextData }),
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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="glass-hover w-16 h-16 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center cursor-pointer text-[var(--text-primary)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      >
        <MessageCircle size={28} />
      </button>
    )
  }

  return (
    <div className="card glass w-[380px] h-[520px] rounded-[var(--radius-xl)] p-6 flex flex-col relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-blue-500/12 flex items-center justify-center text-blue-400">
            <Bot size={16} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em] m-0">Race Engineer AI</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-medium m-0">
              {seriesInfo?.name || series.toUpperCase()} Expert
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer p-1 flex items-center justify-center hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-3 flex flex-col gap-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-5">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-blue-500/10 flex items-center justify-center">
              <Sparkles size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-1 m-0">
                Race Control Online
              </p>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed m-0">
                Ask me about {seriesInfo?.name || series.toUpperCase()} stats, regulations, or history
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="bg-white/5 border border-[var(--border-subtle)] rounded-full px-3.5 py-1.5 text-[11px] text-[var(--text-secondary)] cursor-pointer transition-all duration-200 font-medium font-sans hover:bg-white/10 hover:border-[var(--border-hover)]"
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
              className={`animate-fade-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-[var(--radius-lg)] px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                    : 'bg-white/5 text-[var(--text-secondary)] rounded-bl-sm border border-[var(--border-subtle)]'
                }`}
              >
                <p className="text-[13px] whitespace-pre-wrap leading-relaxed m-0">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-[var(--radius-lg)] rounded-bl-sm px-5 py-3 flex gap-1.5 items-center border border-[var(--border-subtle)]">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-[7px] h-[7px] bg-blue-400 rounded-full"
                  style={{ animation: `pulseGlow 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 bg-black/20 p-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Race Control..."
          disabled={loading}
          className="flex-1 bg-transparent border-none text-[var(--text-primary)] px-3 py-2 text-[13px] outline-none font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`border-none rounded-[var(--radius-md)] px-3.5 py-2 flex items-center justify-center transition-all duration-200 ${
            !input.trim() || loading
              ? 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer'
          }`}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
