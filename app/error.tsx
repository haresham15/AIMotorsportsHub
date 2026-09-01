'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-[var(--sp-5)] text-center relative overflow-hidden min-h-[calc(100vh-200px)]">
      {/* Abstract background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--flag-red) 0%, transparent 40%)' }}></div>
      
      <div className="relative z-10 max-w-[500px] w-full p-8 card glass rounded-[var(--radius-xl)] shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#2a1210] border-2 border-[#4a2018] flex items-center justify-center mx-auto mb-6 shadow-[0_0_24px_rgba(225,6,0,0.5)]">
          <div className="w-8 h-8 rounded-full bg-[var(--flag-red)] shadow-[0_0_16px_rgba(225,6,0,0.85)]"></div>
        </div>
        
        <h1 className="font-[family-name:var(--font-disp)] text-[36px] font-bold uppercase mb-2 tracking-tight">
          Red Flag
        </h1>
        <p className="text-[var(--text-secondary)] text-[15px] mb-8 leading-[1.6]">
          Session suspended due to a technical incident. Our engineers are reviewing the telemetry. 
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[var(--amber)] text-[#1a1200] font-bold text-[15px] px-[28px] py-[12px] rounded-[6px] transition-transform hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)]"
          >
            Restart Session
          </button>
          <Link 
            href="/"
            className="w-full sm:w-auto border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-[15px] px-[28px] py-[12px] rounded-[6px] transition-colors hover:border-[var(--text-secondary)] hover:bg-white/5 text-center"
          >
            Return to Paddock
          </Link>
        </div>
      </div>
    </main>
  )
}
