'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, User, ChevronDown, Flame, Star, ShieldCheck } from 'lucide-react'
import { useUserProfile } from '@/lib/userPreferences'

export default function AuthButton() {
  const { profile, isLoggedIn, followedDrivers, followedTeams, logout } = useUserProfile()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  if (isLoggedIn && profile) {
    const initials = profile.displayName
      ? profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : 'U'

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-left"
          title="Open Fan Profile Menu"
        >
          {/* User Avatar Circle */}
          <div className="w-7 h-7 rounded-full bg-[var(--amber)]/20 border border-[var(--amber)]/40 flex items-center justify-center font-mono font-bold text-xs text-[var(--amber)] shrink-0 shadow-[0_0_8px_rgba(255,176,32,0.2)]">
            {initials}
          </div>

          {/* User Name & Streak */}
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
              {profile.displayName}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1 leading-tight">
              {profile.checkInStreak > 0 ? (
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Flame size={10} className="text-amber-400 fill-amber-400" />
                  {profile.checkInStreak} Streak
                </span>
              ) : (
                <span>{profile.paddockTier}</span>
              )}
            </span>
          </div>

          <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[rgba(18,21,26,0.98)] backdrop-blur-2xl border border-[var(--border-subtle)] shadow-2xl p-2 z-50 animate-fade-in-up">
            {/* Header info */}
            <div className="p-3 border-b border-white/5 mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)] flex items-center gap-1">
                  <ShieldCheck size={12} />
                  {profile.paddockTier}
                </span>
                {profile.isDemo && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-emerald-300 border border-emerald-500/30">
                    DEMO VIP
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white truncate">{profile.displayName}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{profile.email}</div>
            </div>

            {/* Quick Favorites Summary */}
            <div className="px-3 py-2 text-xs font-mono text-[var(--text-secondary)] border-b border-white/5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                Following:
              </span>
              <span className="text-white font-bold">
                {followedDrivers.length} Drivers • {followedTeams.length} Teams
              </span>
            </div>

            {/* Menu Links */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-white hover:bg-white/10 transition-colors no-underline"
              >
                <User size={15} className="text-[var(--amber)]" />
                <span>My Profile &amp; Favorites</span>
              </Link>
            </div>

            {/* Sign Out */}
            <div className="pt-1 border-t border-white/5">
              <button
                onClick={async () => {
                  setDropdownOpen(false)
                  await logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-400 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold no-underline transition-transform hover:-translate-y-0.5 shadow-sm"
    >
      <span>Sign In</span>
      <span className="hidden sm:inline text-[10px] font-mono uppercase bg-black/30 px-1.5 py-0.2 rounded-full text-amber-200">
        Pass
      </span>
    </Link>
  )
}
