'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-[var(--sp-5)] text-center relative overflow-hidden min-h-[calc(100vh-200px)]">
      {/* Abstract background track curves */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-[var(--border-subtle)] rounded-full opacity-30"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-[var(--border-subtle)] rounded-full opacity-50"></div>
      
      <div className="relative z-10">
        <div className="font-[family-name:var(--font-disp)] text-[clamp(80px,15vw,140px)] font-black leading-none text-[var(--amber)] drop-shadow-[0_0_40px_rgba(255,176,32,0.2)]">
          404
        </div>
        <h1 className="font-[family-name:var(--font-disp)] text-[clamp(32px,5vw,48px)] font-bold uppercase mt-4 mb-2 tracking-tight">
          Off Track
        </h1>
        <p className="text-[var(--text-secondary)] text-[16px] max-w-[400px] mx-auto mb-8 leading-[1.6]">
          The page or session you&apos;re looking for doesn&apos;t exist, has been retired, or you took a wrong turn at the chicane.
        </p>
        
        <Link 
          href="/"
          className="inline-block bg-[var(--amber)] text-[#1a1200] font-bold text-[15px] px-[32px] py-[14px] rounded-[6px] transition-transform hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(255,176,32,0.25)]"
        >
          Return to Paddock &rarr;
        </Link>
      </div>
    </main>
  )
}
