'use client';

import React from 'react';
import { X, ShieldAlert, Flag, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface RaceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackStatus?: string;
}

export default function RaceControlModal({
  isOpen,
  onClose,
  trackStatus = '1',
}: RaceControlModalProps) {
  if (!isOpen) return null;

  const isGreen = trackStatus === '1';
  const isYellow = trackStatus === '2' || trackStatus === '4';
  const isSafetyCar = trackStatus === 'SC';
  const isVSC = trackStatus === 'VSC';
  const isRed = trackStatus === '5';

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] my-auto max-h-[90vh] flex flex-col bg-[rgba(11,14,19,0.98)] border border-white/15 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`h-1.5 w-full ${
            isGreen ? 'bg-emerald-500' : isSafetyCar || isYellow ? 'bg-amber-500' : 'bg-red-500'
          }`} 
        />

        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isGreen 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
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

        <div className="p-6 flex flex-col gap-4">
          {/* Status Card */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
            isGreen 
              ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-500/[0.08] border-amber-500/30 text-amber-300'
          }`}>
            <span className={`w-3 h-3 rounded-full ${
              isGreen ? 'bg-emerald-400 live-beacon-active' : 'bg-amber-400 live-beacon-active'
            }`} />
            <div>
              <div className="font-mono text-sm font-bold uppercase tracking-wider">
                {isGreen ? 'TRACK STATUS: GREEN (ALL CLEAR)' : 'CAUTION: SAFETY PROTOCOL ACTIVE'}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isGreen 
                  ? 'All micro-sectors nominal. DRS active and enabled in designated zones.'
                  : 'Speed limit enforced. Minimum safety car delta times applied across all sectors.'}
              </div>
            </div>
          </div>

          {/* Active Directives */}
          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Pit Lane Entrance:</span>
              <span className="text-emerald-400 font-bold">OPEN (Normal Delta)</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">DRS Zones:</span>
              <span className="text-white font-bold">{isGreen ? 'ENABLED' : 'DISABLED'}</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Investigation Status:</span>
              <span className="text-[var(--text-secondary)]">NO INCIDENTS NOTED</span>
            </div>
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
