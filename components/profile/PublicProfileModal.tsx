'use client'

import React from 'react'
import { FriendConnection, FriendRequest } from '@/lib/userPreferences'
import { PaddockAvatar } from './PaddockAvatar'

export interface PublicProfileModalProps {
  member: FriendConnection | null
  isOpen: boolean
  onClose: () => void
  isFriend: boolean
  pendingRequest?: FriendRequest
  onSendRequest: (member: FriendConnection) => void
  onAcceptRequest: (requestId: string) => void
  onDeclineRequest: (requestId: string) => void
  onCancelRequest: (requestId: string) => void
  onRemoveFriend: (friendId: string) => void
}

export function PublicProfileModal({
  member,
  isOpen,
  onClose,
  isFriend,
  pendingRequest,
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
}: PublicProfileModalProps) {
  if (!isOpen || !member) return null

  const isIncoming = pendingRequest?.direction === 'incoming'
  const isOutgoing = pendingRequest?.direction === 'outgoing'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Banner with speed graphic */}
        <div className="relative h-24 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px]" />
          <span className="relative px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded bg-neutral-900/90 border border-neutral-700 text-neutral-300">
            Paddock ID // {member.paddockTier}
          </span>
          <button
            onClick={onClose}
            className="relative p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Details */}
        <div className="relative px-6 pb-6 pt-0 space-y-5">
          {/* Avatar overlapping banner */}
          <div className="-mt-12 flex items-end justify-between">
            <PaddockAvatar
              avatarUrl={member.avatarUrl}
              avatarFrame={member.avatarFrame || 'carbon'}
              name={member.displayName}
              size="2xl"
              status={member.status}
              showStatus
            />
            {member.statusText && (
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  ● {member.statusText}
                </span>
              </div>
            )}
          </div>

          {/* Identity Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-bold text-white tracking-wide">
                {member.displayName}
              </h3>
              {member.title && (
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  {member.title}
                </span>
              )}
            </div>
            {member.tagline && (
              <p className="text-sm text-neutral-300 italic pt-0.5">
                &ldquo;{member.tagline}&rdquo;
              </p>
            )}
          </div>

          {/* Motorsport Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Home Circuit</div>
              <div className="text-neutral-200 font-semibold truncate mt-0.5">
                {member.homeCircuit || 'Monza'}
              </div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Primary Driver</div>
              <div className="text-neutral-200 font-semibold truncate mt-0.5">
                {member.primaryDriver || 'Unassigned'}
              </div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Allegiance Team</div>
              <div className="text-neutral-200 font-semibold truncate mt-0.5">
                {member.primaryTeam || 'Independent'}
              </div>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Check-in Streak</div>
              <div className="text-amber-400 font-semibold truncate mt-0.5 flex items-center gap-1.5">
                <span>🔥 {member.checkInStreak || 0} Grands Prix</span>
              </div>
            </div>
          </div>

          {/* Social Connection Action Bar */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-neutral-500">
              {isFriend ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Friends since {member.connectedSince || '2025'}
                </span>
              ) : (
                <span>Community Paddock Member</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isFriend ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${member.displayName} from your Paddock friends?`)) {
                      onRemoveFriend(member.id)
                      onClose()
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors"
                >
                  Disconnect Friend
                </button>
              ) : isIncoming ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptRequest(pendingRequest!.id)
                      onClose()
                    }}
                    className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeclineRequest(pendingRequest!.id)
                      onClose()
                    }}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-200 border border-neutral-800 rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              ) : isOutgoing ? (
                <button
                  type="button"
                  onClick={() => {
                    onCancelRequest(pendingRequest!.id)
                  }}
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-neutral-200 border border-neutral-700 rounded-lg transition-colors"
                >
                  Cancel Request
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSendRequest(member)
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-mono uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Connect & Add Friend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
