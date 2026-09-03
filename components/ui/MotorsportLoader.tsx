'use client';

import React, { useState, useEffect } from 'react';

interface MotorsportLoaderProps {
  variant?: 'starting-lights' | 'tachometer' | 'radar' | 'spinner';
  text?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function MotorsportLoader({
  variant = 'starting-lights',
  text = 'INITIALIZING TELEMETRY',
  subtext,
  size = 'md',
  fullScreen = false,
}: MotorsportLoaderProps) {
  // Starting lights sequence: 0 to 5 lights on, then 6 = all green flash / lights out
  const [lightStep, setLightStep] = useState(0);

  useEffect(() => {
    if (variant !== 'starting-lights') return;

    const interval = setInterval(() => {
      setLightStep((prev) => (prev >= 6 ? 1 : prev + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [variant]);

  // Tachometer RPM sweep simulation
  const [rpmStep, setRpmStep] = useState(3);
  useEffect(() => {
    if (variant !== 'tachometer') return;

    const interval = setInterval(() => {
      setRpmStep((prev) => (prev >= 10 ? 2 : prev + 1));
    }, 120);

    return () => clearInterval(interval);
  }, [variant]);

  const renderVisual = () => {
    switch (variant) {
      case 'starting-lights':
        return (
          <div className="flex flex-col items-center gap-3">
            {/* 5-Pod Starting Lights Gantry */}
            <div className="bg-[#0D1016] border border-white/20 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5">
              {[1, 2, 3, 4, 5].map((podIndex) => {
                const isRed = lightStep >= podIndex && lightStep < 6;
                const isGreen = lightStep === 6;

                return (
                  <div
                    key={podIndex}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-black/80 flex items-center justify-center transition-all duration-150"
                    style={{
                      backgroundColor: isGreen
                        ? '#10B981'
                        : isRed
                        ? '#EF4444'
                        : '#1F242D',
                      boxShadow: isGreen
                        ? '0 0 16px #10B981, inset 0 0 6px #6EE7B7'
                        : isRed
                        ? '0 0 14px #EF4444, inset 0 0 5px #FCA5A5'
                        : 'none',
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isGreen
                          ? '#FFFFFF'
                          : isRed
                          ? '#FFFFFF'
                          : '#141820',
                        opacity: isRed || isGreen ? 0.8 : 0.2,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase font-bold">
              {lightStep === 6 ? 'LIGHTS OUT • AWAY WE GO' : 'GRID CALIBRATION'}
            </div>
          </div>
        );

      case 'tachometer':
        return (
          <div className="flex flex-col items-center gap-2">
            {/* Shift Lights Array (4 Green, 3 Yellow, 2 Red, 1 Blue) */}
            <div className="flex items-center gap-1.5 bg-[#0D1016] p-2 rounded-lg border border-white/15">
              {[
                { col: '#10B981', glow: 'rgba(16, 185, 129, 0.8)' },
                { col: '#10B981', glow: 'rgba(16, 185, 129, 0.8)' },
                { col: '#10B981', glow: 'rgba(16, 185, 129, 0.8)' },
                { col: '#10B981', glow: 'rgba(16, 185, 129, 0.8)' },
                { col: '#F59E0B', glow: 'rgba(245, 158, 11, 0.8)' },
                { col: '#F59E0B', glow: 'rgba(245, 158, 11, 0.8)' },
                { col: '#F59E0B', glow: 'rgba(245, 158, 11, 0.8)' },
                { col: '#EF4444', glow: 'rgba(239, 68, 68, 0.8)' },
                { col: '#EF4444', glow: 'rgba(239, 68, 68, 0.8)' },
                { col: '#3B82F6', glow: 'rgba(59, 130, 246, 0.9)' },
              ].map((led, i) => {
                const active = i < rpmStep;
                return (
                  <div
                    key={i}
                    className="w-2.5 h-6 rounded-xs transition-all duration-100"
                    style={{
                      backgroundColor: active ? led.col : '#1F242D',
                      boxShadow: active ? `0 0 10px ${led.glow}` : 'none',
                    }}
                  />
                );
              })}
            </div>
            <div className="text-[11px] font-mono font-bold text-white tracking-widest">
              {Math.min(13500, 4000 + rpmStep * 950)} <span className="text-[9px] text-[var(--text-muted)]">RPM</span>
            </div>
          </div>
        );

      case 'radar':
        return (
          <div className="relative w-16 h-16 rounded-full border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-2 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-4 rounded-full border border-emerald-500/10" />
            <div className="absolute w-full h-[1px] bg-emerald-500/20" />
            <div className="absolute h-full w-[1px] bg-emerald-500/20" />
            {/* Rotating Beam */}
            <div className="absolute inset-0 animate-radar-sweep">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/40 to-transparent origin-bottom-right" />
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-[var(--amber)] animate-spin" />
            <div className="absolute w-6 h-6 rounded-full border-2 border-red-500/20 border-b-[var(--flag-red)] animate-spin-slow" />
          </div>
        );
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      {renderVisual()}

      {text && (
        <div>
          <p className="font-[family-name:var(--font-disp)] uppercase font-extrabold tracking-widest text-white text-base m-0">
            {text}
          </p>
          {subtext && (
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono m-0 max-w-xs">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,13,16,0.85)] backdrop-blur-md">
        <div className="card glass p-8 rounded-[var(--radius-xl)] border border-white/10 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
