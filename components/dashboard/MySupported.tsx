'use client'

import { useState } from 'react'
import { Star, UserPlus } from 'lucide-react'

interface MySupportedProps {
  series: string
}

interface FollowedDriver {
  driver_id: string
  drivers: {
    name: string
    team_id: string
    teams?: {
      name: string
    }
  }
}

export default function MySupported({ series }: MySupportedProps) {
  // Authentication and driver following feature coming in v2
  const followed: FollowedDriver[] = []

  return (
    <div className="card glass rounded-[var(--radius-xl)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-amber-400/12 flex items-center justify-center text-amber-400">
            <Star size={16} />
          </div>
          <h2 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold tracking-[-0.01em]">My Supported</h2>
        </div>
      </div>

      <div className="text-center py-8 px-4 bg-white/5 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)]">
        <UserPlus size={28} className="text-[var(--text-muted)] mb-3 mx-auto" />
        <p className="text-[var(--text-muted)] text-[13px] leading-relaxed m-0">
          User authentication and driver following features are coming in v2!
        </p>
      </div>
    </div>
  )
}
