'use client'

import React from 'react'

interface LoaderProps {
  text?: string
  subtext?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  inline?: boolean
}

export default function Loader({ text, subtext, size = 'md', fullScreen = false, inline = false }: LoaderProps) {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  }

  const content = (
    <div className={`flex items-center justify-center ${inline ? 'gap-2 flex-row' : 'flex-col gap-4'}`}>
      {/* Apexis Stylized Spinner */}
      <div className="relative flex items-center justify-center">
        <div className={`rounded-full border-t-[var(--amber)] border-r-[var(--flag-red)] border-b-transparent border-l-transparent animate-spin ${sizeClasses[size]}`}></div>
        <div className={`absolute rounded-full border-t-transparent border-r-transparent border-b-[var(--accent-blue)] border-l-[var(--green-flag)] animate-spin-slow opacity-60 ${sizeClasses[size]}`} style={{ width: '80%', height: '80%' }}></div>
      </div>
      
      {/* Text Output */}
      {text && (
        <div className={inline ? '' : 'text-center'}>
          <p className="font-[family-name:var(--font-disp)] uppercase font-bold tracking-widest text-[var(--text-primary)] text-sm m-0">
            {text}
          </p>
          {subtext && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium m-0">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
        <div className="glass p-8 rounded-[var(--radius-xl)]">
          {content}
        </div>
      </div>
    )
  }

  return content
}
