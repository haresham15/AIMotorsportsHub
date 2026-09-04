'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  ShieldCheck,
  Flame,
  Star,
  Plus,
  Trash2,
  Calendar,
  Award,
  Bell,
  Radio,
  ExternalLink,
  ChevronRight,
  Check,
  Zap,
  Clock,
  Compass
} from 'lucide-react'
import {
  useUserProfile,
  BASE_ACHIEVEMENTS,
  FollowedDriver,
  FollowedTeam
} from '@/lib/userPreferences'
import { SERIES_DRIVERS, TEAM_HISTORY, SERIES } from '@/lib/data'
import Loader from '@/components/ui/Loader'

export default function ProfilePage() {
  const {
    profile,
    isLoggedIn,
    loading,
    followedDrivers,
    followedTeams,
    checkIns,
    alertPrefs,
    toggleDriver,
    toggleTeam,
    updateAlertPreferences,
    loginDemo,
    logout,
  } = useUserProfile()

  const [activeTab, setActiveTab] = useState<'favorites' | 'checkins' | 'achievements' | 'alerts'>('favorites')
  const [favoriteCategory, setFavoriteCategory] = useState<'drivers' | 'teams'>('drivers')
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<string>('f1')

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-160px)]">
        <Loader text="Accessing Paddock Pass..." subtext="Authenticating telemetry credentials" variant="starting-lights" />
      </main>
    )
  }

  // If user is not logged in, render a stylish Paddock Pass prompt
  if (!isLoggedIn || !profile) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-160px)]">
        <div className="console-panel w-full max-w-[480px] p-8 text-center border border-[var(--border-hairline)] shadow-xl">
          <div className="w-12 h-12 rounded-none bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 flex items-center justify-center text-[var(--amber-pit)] mx-auto mb-4">
            <ShieldCheck size={24} />
          </div>
          <div className="text-[10px] font-mono text-[var(--amber-pit)] uppercase tracking-widest mb-1">[AUTHENTICATION-REQUIRED]</div>
          <h1 className="font-[family-name:var(--font-disp)] uppercase text-2xl font-extrabold text-white tracking-tight mb-2">
            Paddock Pass Required
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-mono">
            Sign in to track driver telemetry, record race weekend check-in deltas, and synchronize customized telemetry alerts.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xs bg-[var(--amber-pit)] hover:bg-[var(--amber-pit-hover)] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 no-underline transition-colors"
            >
              <span>Sign In to Your Pass</span>
              <ChevronRight size={14} />
            </Link>
            <button
              onClick={() => loginDemo()}
              className="w-full py-2.5 px-4 rounded-xs bg-[var(--surface-elevated)] hover:bg-[var(--surface-pressed)] border border-[var(--border-hairline)] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Zap size={14} className="text-[var(--amber-pit)] fill-[var(--amber-pit)]" />
              <span>Instant VIP Demo Access</span>
            </button>
            <Link href="/" className="text-xs font-mono text-[var(--text-muted)] hover:text-white no-underline mt-2">
              &larr; Back to Race Wall
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const initials = profile.displayName
    ? profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  // Driver pool for Add Favorites modal
  const availableDrivers = SERIES_DRIVERS[selectedSeries] || []
  const availableTeams = TEAM_HISTORY[selectedSeries] || []

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 max-w-[1280px] mx-auto flex flex-col gap-8">
      
      {/* ===== DIGITAL PADDOCK ID HEADER CARD ===== */}
      <section className="console-panel p-6 sm:p-7 relative border border-[var(--border-hairline)]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* User Profile Details */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none bg-[var(--surface-elevated)] border-2 border-[var(--amber-pit)]/50 flex items-center justify-center font-mono font-bold text-xl sm:text-2xl text-[var(--amber-pit)] shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-[family-name:var(--font-disp)] uppercase text-2xl sm:text-3xl font-extrabold text-white tracking-tight m-0">
                  {profile.displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-[var(--surface-elevated)] border border-[var(--amber-pit)]/40 text-[var(--amber-pit)] font-mono text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} />
                  {profile.paddockTier}
                </span>
                {profile.isDemo && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-[var(--flag-green)]/15 text-[var(--flag-green)] border border-[var(--flag-green)]/30">
                    VIP DEMO
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                {profile.email} &bull; Member since {profile.memberSince}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/dashboard/f1"
              className="flex-1 md:flex-initial py-2.5 px-4 rounded-lg bg-[var(--amber)] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 no-underline transition-all shadow-md"
            >
              <span>Live Telemetry</span>
              <ExternalLink size={14} />
            </Link>
            <button
              onClick={async () => await logout()}
              className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-muted)] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Fan Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5 font-mono">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider flex items-center justify-center gap-1">
              <Flame size={12} className="text-amber-400 fill-amber-400" />
              Check-In Streak
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {profile.checkInStreak} <span className="text-xs text-[var(--text-muted)] font-normal">Rounds</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider flex items-center justify-center gap-1">
              <Calendar size={12} className="text-emerald-400" />
              Total Check-Ins
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {profile.totalCheckIns}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider flex items-center justify-center gap-1">
              <Star size={12} className="text-purple-400 fill-purple-400" />
              Followed Drivers
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1">
              {followedDrivers.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider flex items-center justify-center gap-1">
              <Compass size={12} className="text-cyan-400" />
              Followed Teams
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1">
              {followedTeams.length}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION NAVIGATION TABS ===== */}
      <div className="flex border-b border-[var(--border-subtle)] gap-2 sm:gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
            activeTab === 'favorites'
              ? 'border-[var(--amber)] text-[var(--amber)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Star size={16} className={activeTab === 'favorites' ? 'fill-amber-400' : ''} />
          <span>My Garage &amp; Favorites ({followedDrivers.length + followedTeams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checkins')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
            activeTab === 'checkins'
              ? 'border-[var(--amber)] text-[var(--amber)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Calendar size={16} />
          <span>Check-In History ({checkIns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
            activeTab === 'achievements'
              ? 'border-[var(--amber)] text-[var(--amber)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Award size={16} />
          <span>Fan Accreditations</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer border-b-2 ${
            activeTab === 'alerts'
              ? 'border-[var(--amber)] text-[var(--amber)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Bell size={16} />
          <span>Telemetry Alerts</span>
        </button>
      </div>

      {/* ===== TAB 1: FAVORITES (MY GARAGE) ===== */}
      {activeTab === 'favorites' && (
        <div className="flex flex-col gap-6">
          {/* Subheader & Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setFavoriteCategory('drivers')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  favoriteCategory === 'drivers'
                    ? 'bg-[var(--amber)] text-black shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Drivers ({followedDrivers.length})
              </button>
              <button
                onClick={() => setFavoriteCategory('teams')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  favoriteCategory === 'teams'
                    ? 'bg-[var(--amber)] text-black shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Teams ({followedTeams.length})
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-[var(--amber)]" />
              <span>Add to Favorites</span>
            </button>
          </div>

          {/* Drivers Grid */}
          {favoriteCategory === 'drivers' && (
            <div>
              {followedDrivers.length === 0 ? (
                <div className="card glass p-12 text-center rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <Star size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Drivers Followed Yet</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-4">
                    Follow drivers across Formula 1, NASCAR, and Formula E to prioritize their telemetry, race radio, and timing deltas.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Browse Drivers Grid
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followedDrivers.map((driver) => (
                    <div
                      key={`${driver.series}-${driver.code}`}
                      className="card glass p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Team color accent */}
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0"
                          style={{ background: driver.color || 'var(--amber)' }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                              {driver.code}
                            </span>
                            {driver.number && (
                              <span className="font-mono text-xs text-[var(--text-muted)]">
                                #{driver.number}
                              </span>
                            )}
                            <span className="font-bold text-sm text-white">{driver.name}</span>
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                            <span>{driver.team}</span>
                            <span>&bull;</span>
                            <span className="uppercase text-[10px] font-mono text-amber-300 font-bold">{driver.series}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/${driver.series}`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
                          title="Open Live Telemetry"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => toggleDriver(driver)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer border-none"
                          title="Remove from Favorites"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teams Grid */}
          {favoriteCategory === 'teams' && (
            <div>
              {followedTeams.length === 0 ? (
                <div className="card glass p-12 text-center rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <Compass size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Teams Followed Yet</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-4">
                    Follow constructors and racing teams to get dedicated pit wall briefings and track check-ins.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Browse Teams Grid
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followedTeams.map((team) => (
                    <div
                      key={`${team.series}-${team.name}`}
                      className="card glass p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0"
                          style={{ background: team.color || 'var(--amber)' }}
                        />
                        <div>
                          <div className="font-bold text-sm text-white">{team.name}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                            {team.country && <span>{team.country}</span>}
                            <span>&bull;</span>
                            <span className="uppercase text-[10px] font-mono text-amber-300 font-bold">{team.series}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/${team.series}`}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
                          title="Open Live Telemetry"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => toggleTeam(team)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer border-none"
                          title="Remove from Favorites"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: CHECK-IN HISTORY ===== */}
      {activeTab === 'checkins' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold text-white m-0">
                Grand Prix Check-In History
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your official motorsport attendance and telemetry check-ins logged across race sessions.
              </p>
            </div>
            <div className="font-mono text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              {profile.checkInStreak} Active Streak
            </div>
          </div>

          {checkIns.length === 0 ? (
            <div className="card glass p-12 text-center rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <Calendar size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Check-Ins Logged Yet</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-4">
                Open any live Grand Prix race session and click &ldquo;Check In for this Race&rdquo; to start your fan streak!
              </p>
              <Link href="/dashboard/f1" className="btn-primary text-xs py-2 px-4 no-underline inline-block">
                Go to Live Telemetry
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {checkIns.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="card glass p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0">
                      R{item.round}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.raceName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/15 uppercase">
                          {item.series}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                        <span>{item.circuit}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">
                          {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    {item.supportedDriverCode && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white">
                        <span className="text-[var(--text-muted)]">Supported:</span>
                        <span className="font-black text-amber-300">
                          {item.supportedDriverName || item.supportedDriverCode}
                        </span>
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <Check size={14} /> Checked In
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: FAN ACHIEVEMENTS ===== */}
      {activeTab === 'achievements' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold text-white m-0">
              Fan Accreditations &amp; Milestones
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Earn badges by maintaining check-in streaks, using AI pit wall telemetry, and following constructors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BASE_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className={`card glass p-5 rounded-xl border transition-all ${
                  ach.unlocked
                    ? 'bg-[var(--bg-card)] border-amber-500/30 shadow-[0_0_16px_rgba(255,176,32,0.08)]'
                    : 'bg-white/[0.02] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-mono font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    ach.unlocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-[var(--text-muted)] border border-white/10'
                  }`}>
                    {ach.badgeText}
                  </span>
                  {ach.unlocked ? (
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={12} /> UNLOCKED
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={12} /> IN PROGRESS
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-white">{ach.title}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {ach.description}
                </div>

                {ach.unlockedAt && (
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-[var(--text-muted)]">
                    Accredited: {ach.unlockedAt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 4: TELEMETRY ALERTS ===== */}
      {activeTab === 'alerts' && (
        <div className="card glass p-6 sm:p-8 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-subtle)] max-w-2xl flex flex-col gap-6">
          <div>
            <h2 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold text-white m-0">
              Personalized Telemetry Alerts
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Configure real-time in-session notifications tailored to your followed drivers and constructors.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white">Pit Lane Entry Alerts</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Notify instantly when your followed driver pits for tires.</div>
              </div>
              <input
                type="checkbox"
                checked={alertPrefs.pitEntry}
                onChange={e => updateAlertPreferences({ pitEntry: e.target.checked })}
                className="w-4 h-4 accent-[var(--amber)] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white">Fastest Lap Notifications</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Alert when your driver sets a purple sector or fastest lap of the race.</div>
              </div>
              <input
                type="checkbox"
                checked={alertPrefs.fastestLap}
                onChange={e => updateAlertPreferences({ fastestLap: e.target.checked })}
                className="w-4 h-4 accent-[var(--amber)] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white">Position Overtakes</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Live notification on position gains and defensive overtakes.</div>
              </div>
              <input
                type="checkbox"
                checked={alertPrefs.overtakes}
                onChange={e => updateAlertPreferences({ overtakes: e.target.checked })}
                className="w-4 h-4 accent-[var(--amber)] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-bold text-white">AI Race Engineer Radio Transmissions</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Stream radio alerts and gap predictions directly to your pit wall.</div>
              </div>
              <input
                type="checkbox"
                checked={alertPrefs.radioHighlights}
                onChange={e => updateAlertPreferences({ radioHighlights: e.target.checked })}
                className="w-4 h-4 accent-[var(--amber)] cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* ===== ADD FAVORITES MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="card glass w-full max-w-xl max-h-[85vh] rounded-2xl bg-[rgba(18,21,26,0.98)] border border-[var(--border-subtle)] p-6 flex flex-col shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-[family-name:var(--font-disp)] uppercase text-xl font-extrabold text-white m-0">
                Add to My Garage
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white cursor-pointer border-none"
              >
                &times;
              </button>
            </div>

            {/* Series selector */}
            <div className="flex gap-2 my-4 overflow-x-auto pb-1">
              {['f1', 'f2', 'nascar'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeries(s)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                    selectedSeries === s
                      ? 'bg-[var(--amber)] text-black'
                      : 'bg-white/5 text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search driver or team name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-input w-full p-2.5 text-xs rounded-lg mb-4"
            />

            {/* Drivers list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 max-h-80">
              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mb-1">
                Drivers on Grid ({availableDrivers.length})
              </div>
              {availableDrivers
                .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.team.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((d) => {
                  const isFollowed = followedDrivers.some(fd => fd.code === d.code && fd.series === selectedSeries)
                  return (
                    <div
                      key={d.code}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-6 rounded-full" style={{ background: d.color || 'var(--amber)' }} />
                        <span className="font-mono font-black text-xs text-white">{d.code}</span>
                        <span className="text-xs font-semibold text-white">{d.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">&bull; {d.team}</span>
                      </div>
                      <button
                        onClick={() => toggleDriver({ ...d, series: selectedSeries })}
                        className={`py-1 px-3 rounded text-xs font-bold font-mono uppercase cursor-pointer border transition-colors ${
                          isFollowed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                            : 'bg-white/5 text-white border-white/15 hover:bg-[var(--amber)] hover:text-black'
                        }`}
                      >
                        {isFollowed ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  )
                })}

              <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] mt-4 mb-1">
                Constructors &amp; Teams ({availableTeams.length})
              </div>
              {availableTeams
                .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((t) => {
                  const isFollowed = followedTeams.some(ft => ft.name.toLowerCase() === t.name.toLowerCase() && ft.series === selectedSeries)
                  return (
                    <div
                      key={t.name}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-white">{t.name}</span>
                        {t.country && <span className="text-xs text-[var(--text-muted)]">&bull; {t.country}</span>}
                      </div>
                      <button
                        onClick={() => toggleTeam({ name: t.name, series: selectedSeries, country: t.country })}
                        className={`py-1 px-3 rounded text-xs font-bold font-mono uppercase cursor-pointer border transition-colors ${
                          isFollowed
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                            : 'bg-white/5 text-white border-white/15 hover:bg-[var(--amber)] hover:text-black'
                        }`}
                      >
                        {isFollowed ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  )
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
