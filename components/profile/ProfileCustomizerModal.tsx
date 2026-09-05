'use client'

import React, { useState } from 'react'
import { UserProfile, AvatarFrameType, PaddockPrivacy } from '@/lib/userPreferences'
import { PaddockAvatar } from './PaddockAvatar'

export interface ProfileCustomizerModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile
  onSave: (updates: Partial<UserProfile>) => void
}

const PRESET_AVATARS = [
  { id: 'preset:helmet_gold', name: 'Gold Champion', desc: 'Championship gold lid' },
  { id: 'preset:helmet_red', name: 'Rosso Corsa', desc: 'Maranello scarlet' },
  { id: 'preset:helmet_papaya', name: 'Papaya Orange', desc: 'Woking speed orange' },
  { id: 'preset:wheel', name: 'Cockpit Wheel', desc: 'High-tech telemetry wheel' },
  { id: 'preset:v10', name: 'Twin-Turbo V10', desc: 'Pure combustion roar' },
  { id: 'preset:eagle', name: 'Apex Predator', desc: 'Precision apex hunter' },
  { id: 'preset:flag', name: 'Chequered Flag', desc: 'Victory lane finisher' },
]

const AVATAR_FRAMES: { id: AvatarFrameType; name: string; color: string; desc: string }[] = [
  { id: 'carbon', name: 'Carbon Fiber', color: 'border-neutral-600', desc: 'Lightweight weave, stealth finish' },
  { id: 'gold_champion', name: 'Gold Champion', color: 'border-amber-400 text-amber-400', desc: 'World Champion trophy luster' },
  { id: 'tifosi_rosso', name: 'Tifosi Rosso', color: 'border-red-600 text-red-500', desc: 'Scuderia scarlet intensity' },
  { id: 'neon_halo', name: 'Neon Halo', color: 'border-cyan-400 text-cyan-400', desc: 'Electric telemetry cockpit glow' },
  { id: 'speed_demon', name: 'Speed Demon', color: 'border-orange-500 text-orange-400', desc: 'High-rpm burnout flame' },
  { id: 'stealth_night', name: 'Stealth Night', color: 'border-violet-500 text-violet-400', desc: 'Night race laser underglow' },
]

const TITLES = [
  'Pit Wall Strategist',
  'Apex Hunter',
  'Telemetry Analyst',
  'Tifosi Vanguard',
  'Grand Prix Veteran',
  'Sim Racer',
  'Race Engineer',
  'Aerodynamicist',
  'Paddock Insider',
]

const CIRCUITS = [
  'Silverstone Circuit',
  'Autodromo Nazionale Monza',
  'Circuit de Spa-Francorchamps',
  'Suzuka International Racing Course',
  'Autódromo José Carlos Pace (Interlagos)',
  'Circuit de Monaco',
  'Circuit of the Americas (COTA)',
  'Circuit de la Sarthe (Le Mans)',
  'Daytona International Speedway',
  'Nürburgring Nordschleife',
  'Mount Panorama (Bathurst)',
  'Melbourne Grand Prix Circuit',
  'Red Bull Ring (Spielberg)',
]

const THEME_COLORS = [
  { id: 'amber', name: 'Apex Amber', hex: '#F59E0B', bg: 'bg-amber-500' },
  { id: 'ferrari', name: 'Rosso Corsa', hex: '#EF4444', bg: 'bg-red-600' },
  { id: 'mercedes', name: 'Petronas Teal', hex: '#27F4D2', bg: 'bg-cyan-400' },
  { id: 'mclaren', name: 'Papaya Orange', hex: '#FF8000', bg: 'bg-orange-500' },
  { id: 'violet', name: 'Night Violet', hex: '#A855F7', bg: 'bg-purple-600' },
  { id: 'emerald', name: 'Racing Green', hex: '#10B981', bg: 'bg-emerald-500' },
]

export function ProfileCustomizerModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: ProfileCustomizerModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [tagline, setTagline] = useState(profile.tagline || '')
  const [title, setTitle] = useState(profile.title || 'Pit Wall Strategist')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || 'preset:helmet_gold')
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameType>(profile.avatarFrame || 'gold_champion')
  const [homeCircuit, setHomeCircuit] = useState(profile.homeCircuit || 'Silverstone Circuit')
  const [primaryDriver, setPrimaryDriver] = useState(profile.primaryDriver || 'Lewis Hamilton')
  const [primaryTeam, setPrimaryTeam] = useState(profile.primaryTeam || 'Scuderia Ferrari')
  const [themeColor, setThemeColor] = useState(profile.themeColor || 'amber')
  const [privacy, setPrivacy] = useState<PaddockPrivacy>(profile.privacy || 'public')
  const [customAvatarInput, setCustomAvatarInput] = useState(
    profile.avatarUrl && !profile.avatarUrl.startsWith('preset:') ? profile.avatarUrl : ''
  )
  const [avatarTab, setAvatarTab] = useState<'presets' | 'custom'>(
    profile.avatarUrl && !profile.avatarUrl.startsWith('preset:') ? 'custom' : 'presets'
  )

  if (!isOpen) return null

  const handleSave = () => {
    const finalAvatar = avatarTab === 'custom' && customAvatarInput.trim() ? customAvatarInput.trim() : avatarUrl
    onSave({
      displayName: displayName.trim() || 'Motorsport Fan',
      tagline: tagline.trim(),
      title,
      avatarUrl: finalAvatar,
      avatarFrame,
      homeCircuit,
      primaryDriver,
      primaryTeam,
      themeColor,
      privacy,
    })
    onClose()
  }

  const effectiveAvatar = avatarTab === 'custom' && customAvatarInput.trim() ? customAvatarInput.trim() : avatarUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-amber-500 rounded-full" />
            <div>
              <h2 className="text-lg font-bold text-neutral-100 uppercase tracking-wide">
                Paddock Profile Customizer
              </h2>
              <p className="text-xs text-neutral-400">
                Personalize your racing identity, telemetry title, avatar aura, and paddock visibility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Preview Card */}
          <div className="relative rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-5 overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/10 border-b border-l border-amber-500/20 text-[10px] font-mono tracking-wider text-amber-400 uppercase rounded-bl-lg">
              Live Preview
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <PaddockAvatar
                avatarUrl={effectiveAvatar}
                avatarFrame={avatarFrame}
                name={displayName}
                size="xl"
                status="online"
                showStatus
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-wide">
                    {displayName || 'Alex Turner'}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                    {title}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    {profile.paddockTier}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 line-clamp-2 italic">
                  &ldquo;{tagline || 'Analyzing telemetry deltas & tire deg models since 2018. Tifosi at heart.'}&rdquo;
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="text-neutral-500">Track:</span>
                    <span className="text-neutral-200">{homeCircuit}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-neutral-500">Driver:</span>
                    <span className="text-neutral-200">{primaryDriver}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-neutral-500">Team:</span>
                    <span className="text-neutral-200">{primaryTeam}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-neutral-500">Privacy:</span>
                    <span className="text-neutral-300 capitalize">{privacy.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Tabs / Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity & Bio */}
            <div className="space-y-4 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                1. Driver Identity & Tagline
              </h4>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Turner"
                  maxLength={32}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Motorsport Bio / Tagline</label>
                <textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  rows={2}
                  placeholder="Share your favorite team, iconic GP memory, or telemetry focus..."
                  maxLength={140}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
                <div className="text-right text-[10px] text-neutral-500 font-mono mt-0.5">
                  {tagline.length}/140
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Paddock Title / Specialization</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Home Circuit</label>
                <select
                  value={homeCircuit}
                  onChange={(e) => setHomeCircuit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {CIRCUITS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Avatar & Frame Selector */}
            <div className="space-y-4 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                2. Avatar & Championship Aura
              </h4>

              {/* Avatar Type Toggle */}
              <div className="flex gap-2 p-1 bg-neutral-900 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAvatarTab('presets')}
                  className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                    avatarTab === 'presets'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Preset Helmets & Icons
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('custom')}
                  className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                    avatarTab === 'custom'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Custom Image URL
                </button>
              </div>

              {avatarTab === 'presets' ? (
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = avatarUrl === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.id)}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                        }`}
                        title={preset.desc}
                      >
                        <PaddockAvatar avatarUrl={preset.id} size="sm" />
                        <span className="text-[10px] text-neutral-300 font-medium mt-1 truncate w-full">
                          {preset.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs text-neutral-400">External Image URL</label>
                  <input
                    type="url"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or discord avatar link"
                    className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 font-mono">
                    Paste any public image link (PNG, JPG, WebP)
                  </p>
                </div>
              )}

              {/* Avatar Frame Selection */}
              <div>
                <label className="block text-xs text-neutral-400 mb-2">Avatar Aura & Frame Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVATAR_FRAMES.map((frame) => {
                    const isSelected = avatarFrame === frame.id
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => setAvatarFrame(frame.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                            : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full border-2 ${frame.color}`} />
                          <span className="text-xs font-semibold text-neutral-200 truncate">
                            {frame.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                          {frame.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Favorite Allegiance */}
            <div className="space-y-4 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                3. Allegiance & Favorites
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Primary Driver</label>
                  <input
                    type="text"
                    value={primaryDriver}
                    onChange={(e) => setPrimaryDriver(e.target.value)}
                    placeholder="e.g. Lewis Hamilton"
                    className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Primary Team</label>
                  <input
                    type="text"
                    value={primaryTeam}
                    onChange={(e) => setPrimaryTeam(e.target.value)}
                    placeholder="e.g. Scuderia Ferrari"
                    className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Theme Accent Color</label>
                <div className="flex flex-wrap gap-2.5">
                  {THEME_COLORS.map((color) => {
                    const isSelected = themeColor === color.id
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setThemeColor(color.id)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                          isSelected
                            ? 'border-neutral-200 bg-neutral-800 text-white ring-1 ring-neutral-400'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                        {color.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Privacy & Visibility */}
            <div className="space-y-4 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                4. Paddock Visibility & Privacy
              </h4>

              <div className="space-y-2">
                {[
                  {
                    id: 'public' as PaddockPrivacy,
                    label: 'Public Paddock',
                    desc: 'Visible in Paddock Directory. Anyone can discover and connect.',
                  },
                  {
                    id: 'friends_only' as PaddockPrivacy,
                    label: 'Friends Only',
                    desc: 'Only confirmed friends can view your telemetry stats and home track.',
                  },
                  {
                    id: 'private' as PaddockPrivacy,
                    label: 'Stealth / Private',
                    desc: 'Hidden from discovery directory. Connection requests require direct invite.',
                  },
                ].map((item) => {
                  const isSelected = privacy === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPrivacy(item.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500/80 bg-emerald-500/10 shadow-sm'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-200">
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {item.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 active:scale-95 font-semibold rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Customizations
          </button>
        </div>
      </div>
    </div>
  )
}
