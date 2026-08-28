'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import ApexisLogo from '@/components/ui/ApexisLogo'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[var(--graphite-950)] text-[var(--text-primary)] flex flex-col">
      <nav className="h-[68px] border-b border-[var(--graphite-700)] flex items-center px-[var(--sp-5)]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <ApexisLogo width={24} height={24} />
          <span className="font-[family-name:var(--font-disp)] font-extrabold text-[22px] tracking-[0.01em] text-white">APEXIS</span>
        </Link>
      </nav>
      
      <main className="flex-1 flex flex-col items-center justify-center p-[var(--sp-5)] text-center relative overflow-hidden">
        {/* Abstract background */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--flag-red) 0%, transparent 40%)' }}></div>
        
        <div className="relative z-10 max-w-[500px] w-full p-8 bg-[var(--graphite-900)] border border-[var(--graphite-700)] rounded-[12px] shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#2a1210] border-2 border-[#4a2018] flex items-center justify-center mx-auto mb-6 shadow-[0_0_24px_rgba(225,6,0,0.5)]">
            <div className="w-8 h-8 rounded-full bg-[var(--flag-red)] shadow-[0_0_16px_rgba(225,6,0,0.85)]"></div>
          </div>
          
          <h1 className="font-[family-name:var(--font-disp)] text-[36px] font-bold uppercase mb-2 tracking-[-0.01em]">
            Red Flag
          </h1>
          <p className="text-[var(--text-secondary)] text-[15px] mb-8 leading-[1.6]">
            Session suspended due to a technical incident. Our engineers are reviewing the telemetry. 
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => reset()}
              className="w-full sm:w-auto bg-[var(--amber)] text-[#1a1200] font-bold text-[15px] px-[28px] py-[12px] rounded-[6px] transition-transform hover:-translate-y-[1px]"
            >
              Restart Session
            </button>
            <Link 
              href="/"
              className="w-full sm:w-auto border border-[var(--graphite-600)] text-[var(--text-primary)] font-bold text-[15px] px-[28px] py-[12px] rounded-[6px] transition-colors hover:border-[var(--text-primary)] hover:bg-white/5"
            >
              Return to Paddock
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
