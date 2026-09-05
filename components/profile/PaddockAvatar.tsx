'use client'

import React from 'react'
import { AvatarFrameType } from '@/lib/userPreferences'

export interface PaddockAvatarProps {
  avatarUrl?: string
  avatarFrame?: AvatarFrameType
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'in_replay' | 'in_garage' | 'offline'
  className?: string
  showStatus?: boolean
}

const SIZE_CONFIGS = {
  xs: { box: 'w-7 h-7 text-xs', icon: 'w-3.5 h-3.5', ring: 'ring-1', badge: 'w-2 h-2 -bottom-0.5 -right-0.5' },
  sm: { box: 'w-9 h-9 text-xs', icon: 'w-4 h-4', ring: 'ring-1', badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5' },
  md: { box: 'w-12 h-12 text-sm', icon: 'w-6 h-6', ring: 'ring-2', badge: 'w-3 h-3 bottom-0 right-0' },
  lg: { box: 'w-16 h-16 text-base', icon: 'w-8 h-8', ring: 'ring-2', badge: 'w-3.5 h-3.5 bottom-0.5 right-0.5' },
  xl: { box: 'w-20 h-20 text-lg', icon: 'w-10 h-10', ring: 'ring-[3px]', badge: 'w-4 h-4 bottom-1 right-1' },
  '2xl': { box: 'w-24 h-24 text-xl', icon: 'w-12 h-12', ring: 'ring-[3px]', badge: 'w-5 h-5 bottom-1 right-1' },
}

const FRAME_CLASSES: Record<AvatarFrameType, string> = {
  carbon: 'ring-neutral-600/90 border border-neutral-700/60 shadow-[0_0_12px_rgba(0,0,0,0.85)]',
  gold_champion: 'ring-amber-400 border border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.55)] ring-offset-1 ring-offset-black',
  tifosi_rosso: 'ring-red-600 border border-red-500 shadow-[0_0_16px_rgba(232,0,45,0.65)] ring-offset-1 ring-offset-black',
  neon_halo: 'ring-cyan-400 border border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.6)] ring-offset-1 ring-offset-black animate-pulse',
  speed_demon: 'ring-orange-500 border border-pink-500 shadow-[0_0_16px_rgba(249,115,22,0.65)] ring-offset-1 ring-offset-black',
  stealth_night: 'ring-violet-500/80 border border-violet-400/50 shadow-[0_0_14px_rgba(139,92,246,0.45)] ring-offset-1 ring-offset-black',
}

const STATUS_CONFIGS = {
  online: { bg: 'bg-emerald-500', ping: true, label: 'Online' },
  in_replay: { bg: 'bg-amber-400', ping: false, label: 'In Telemetry Replay' },
  in_garage: { bg: 'bg-violet-400', ping: false, label: 'In Setup Garage' },
  offline: { bg: 'bg-neutral-500', ping: false, label: 'Offline' },
}

function PresetIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'preset:helmet_gold':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M4 14a8 8 0 0115.5-3.5c.3 1.2.5 2.5.5 3.5 0 4.4-3.6 8-8 8H7c-1.7 0-3-1.3-3-3v-5z" fill="#FBBF24" fillOpacity="0.25" stroke="#FBBF24" />
          <path d="M7 13h10v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2z" fill="#0A0A0A" stroke="#FBBF24" strokeWidth="1.5" />
          <path d="M12 4v4" stroke="#FBBF24" strokeLinecap="round" />
        </svg>
      )
    case 'preset:helmet_red':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M4 14a8 8 0 0115.5-3.5c.3 1.2.5 2.5.5 3.5 0 4.4-3.6 8-8 8H7c-1.7 0-3-1.3-3-3v-5z" fill="#EF4444" fillOpacity="0.25" stroke="#EF4444" />
          <path d="M7 13h10v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2z" fill="#0A0A0A" stroke="#EF4444" strokeWidth="1.5" />
          <path d="M12 4v4" stroke="#EF4444" strokeLinecap="round" />
        </svg>
      )
    case 'preset:helmet_papaya':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M4 14a8 8 0 0115.5-3.5c.3 1.2.5 2.5.5 3.5 0 4.4-3.6 8-8 8H7c-1.7 0-3-1.3-3-3v-5z" fill="#F97316" fillOpacity="0.25" stroke="#F97316" />
          <path d="M7 13h10v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2z" fill="#0A0A0A" stroke="#F97316" strokeWidth="1.5" />
          <path d="M12 4v4" stroke="#F97316" strokeLinecap="round" />
        </svg>
      )
    case 'preset:wheel':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="9" stroke="#22D3EE" fill="#22D3EE" fillOpacity="0.15" />
          <circle cx="12" cy="12" r="3" stroke="#22D3EE" fill="#0A0A0A" />
          <path d="M3 12h6M15 12h6M12 3v6" stroke="#22D3EE" strokeLinecap="round" />
        </svg>
      )
    case 'preset:v10':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M4 8l4-4h8l4 4v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" fill="#EC4899" fillOpacity="0.15" stroke="#EC4899" />
          <path d="M9 13l3 3 3-3M12 8v8" stroke="#EC4899" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'preset:eagle':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M12 3L2 12h6v8h8v-8h6L12 3z" fill="#A855F7" fillOpacity="0.2" stroke="#A855F7" />
          <circle cx="12" cy="10" r="2" fill="#A855F7" />
        </svg>
      )
    case 'preset:flag':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.75">
          <path d="M4 22V4c4-2 6 2 10 0s4 2 6 0v10c-2 2-4 0-6 0s-6 2-10 0" stroke="#F59E0B" fill="#F59E0B" fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9c3-1.5 5 1.5 8 0" stroke="#F59E0B" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export function PaddockAvatar({
  avatarUrl,
  avatarFrame = 'carbon',
  name = 'Racer',
  size = 'md',
  status,
  className = '',
  showStatus = false,
}: PaddockAvatarProps) {
  const sizeCfg = SIZE_CONFIGS[size]
  const frameCls = FRAME_CLASSES[avatarFrame] || FRAME_CLASSES.carbon
  const isPreset = avatarUrl?.startsWith('preset:')
  const isHttp = avatarUrl?.startsWith('http://') || avatarUrl?.startsWith('https://')

  const initials = name
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P'

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-full overflow-hidden bg-neutral-900 select-none ${sizeCfg.box} ${sizeCfg.ring} ${frameCls}`}
      >
        {isPreset ? (
          <PresetIcon type={avatarUrl!} className={sizeCfg.icon} />
        ) : isHttp ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initials on broken image URL
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="font-bold tracking-wider text-neutral-200">
            {initials}
          </span>
        )}
      </div>

      {showStatus && status && (
        <span
          className={`absolute rounded-full ring-2 ring-black ${sizeCfg.badge} ${STATUS_CONFIGS[status]?.bg || 'bg-neutral-500'}`}
          title={STATUS_CONFIGS[status]?.label || status}
        >
          {STATUS_CONFIGS[status]?.ping && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
        </span>
      )}
    </div>
  )
}
