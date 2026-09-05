'use client';

import React from 'react';
import { X, ShieldAlert, Flag, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface RaceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackStatus?: string;
  messages?: Array<{
    time?: string | number;
    message: string;
    flag?: string;
    category?: string;
  }>;
}

export default function RaceControlModal({
  isOpen,
  onClose,
  trackStatus = '1',
  messages = [],
}: RaceControlModalProps) {
  if (!isOpen) return null;

  const isGreen = trackStatus === '1';
  const isYellow = trackStatus === '2';
  const isSafetyCar = trackStatus === '4' || trackStatus === 'SC';
  const isVSC = trackStatus === '6' || trackStatus === 'VSC';
  const isRed = trackStatus === '5';

  const statusLabel = isGreen
    ? 'TRACK STATUS: GREEN (ALL CLEAR)'
    : isSafetyCar
    ? 'SAFETY CAR DEPLOYED'
    : isVSC
    ? 'VIRTUAL SAFETY CAR ACTIVE'
    : isYellow
    ? 'CAUTION: YELLOW FLAG ACTIVE'
    : 'SESSION SUSPENDED: RED FLAG';

  const statusDesc = isGreen
    ? 'All micro-sectors nominal. DRS active and enabled in designated zones.'
    : isSafetyCar || isVSC
    ? 'Full-course caution in effect. Reduce speed and match safety car delta time.'
    : isYellow
    ? 'Hazard on circuit. Hazard sector speed restriction enforced. Overtaking prohibited.'
    : 'Session halted. All cars return to pit lane under controlled speed.';

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[540px] my-auto max-h-[90vh] flex flex-col bg-[rgba(11,14,19,0.98)] border border-white/15 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`h-1.5 w-full ${
            isGreen ? 'bg-emerald-500' : isSafetyCar || isVSC ? 'bg-orange-500' : isYellow ? 'bg-amber-500' : 'bg-red-500'
          }`} 
        />

        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isGreen 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : isSafetyCar || isVSC
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : isYellow
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold tracking-wider">
                FIA Race Directorate
              </div>
              <h2 className="text-xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-wide m-0">
                Race Control Bulletin
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close race control modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {/* Status Card */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
            isGreen 
              ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300' 
              : isSafetyCar || isVSC
              ? 'bg-orange-500/[0.08] border-orange-500/30 text-orange-300'
              : isYellow
              ? 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300'
              : 'bg-red-500/[0.08] border-red-500/30 text-red-300'
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              isGreen ? 'bg-emerald-400 live-beacon-active' : isSafetyCar || isVSC ? 'bg-orange-400 live-beacon-active' : isYellow ? 'bg-amber-400 live-beacon-active' : 'bg-red-400 live-beacon-active'
            }`} />
            <div>
              <div className="font-mono text-sm font-bold uppercase tracking-wider">
                {statusLabel}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {statusDesc}
              </div>
            </div>
          </div>

          {/* Active Directives */}
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Pit Lane Entrance:</span>
              <span className={isRed ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isRed ? 'CLOSED' : 'OPEN (Controlled Delta)'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">DRS Zones:</span>
              <span className="text-white font-bold">{isGreen ? 'ENABLED' : 'DISABLED'}</span>
            </div>
          </div>

          {/* Chronological Directives / Live Bulletins */}
          <div className="mt-2">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold tracking-wider mb-2 flex items-center justify-between">
              <span>Official Session Notices ({messages.length})</span>
              <span className="text-emerald-400">Authenticated Feed</span>
            </div>

            {messages.length > 0 ? (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {messages.map((msg, idx) => {
                  const flagUpper = (msg.flag || '').toUpperCase();
                  const isScFlag = flagUpper.includes('SAFETY') || flagUpper.includes('SC');
                  const isYellowFlag = flagUpper.includes('YELLOW');
                  const isRedFlag = flagUpper.includes('RED');
                  const isGreenFlag = flagUpper.includes('GREEN') || flagUpper.includes('CLEAR');

                  const badgeColor = isRedFlag
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : isScFlag
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : isYellowFlag
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isGreenFlag
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 text-white border-white/20';

                  const formatTime = (t: string | number | undefined) => {
                    if (t === undefined) return '';
                    if (typeof t === 'number') {
                      const m = Math.floor(t / 60);
                      const s = Math.floor(t % 60);
                      return `${m}:${String(s).padStart(2, '0')}`;
                    }
                    return String(t);
                  };

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-start gap-2.5 text-xs font-mono transition-colors"
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 ${badgeColor}`}>
                        {msg.flag || msg.category || 'NOTICE'}
                      </span>
                      <span className="text-white/90 flex-1 leading-relaxed">
                        {msg.message}
                      </span>
                      {msg.time !== undefined && (
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-bold">
                          {formatTime(msg.time)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono text-[var(--text-muted)] text-center">
                NO ACTIVE INCIDENTS NOTED BY STEWARDS
              </div>
            )}
          </div>
        </div>

        <div className="p-4 px-6 border-t border-white/10 bg-white/[0.01] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
