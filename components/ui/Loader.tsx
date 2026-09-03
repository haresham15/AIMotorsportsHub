'use client';

import React from 'react';
import MotorsportLoader from './MotorsportLoader';

interface LoaderProps {
  text?: string;
  subtext?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'starting-lights' | 'tachometer' | 'radar' | 'spinner';
  fullScreen?: boolean;
  inline?: boolean;
}

export default function Loader({
  text,
  subtext,
  size = 'md',
  variant,
  fullScreen = false,
  inline = false,
}: LoaderProps) {
  // If explicitly requested as inline or tiny, render compact spinner
  if (inline || size === 'xs' || size === 'sm') {
    const sizeClasses = {
      xs: 'w-3.5 h-3.5 border',
      sm: 'w-5 h-5 border-2',
      md: 'w-7 h-7 border-2',
      lg: 'w-10 h-10 border-2',
    };

    const spinnerContent = (
      <div className={`flex items-center justify-center ${inline ? 'gap-2 flex-row' : 'flex-col gap-2'}`}>
        <div className="relative flex items-center justify-center">
          <div className={`rounded-full border-amber-500/20 border-t-[var(--amber)] animate-spin ${sizeClasses[size]}`} />
        </div>
        {text && (
          <span className="font-mono text-xs text-[var(--text-secondary)] font-medium">
            {text}
          </span>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
          <div className="glass p-6 rounded-[var(--radius-xl)] border border-white/10">
            {spinnerContent}
          </div>
        </div>
      );
    }
    return spinnerContent;
  }

  // Otherwise, render broadcast-grade MotorsportLoader!
  const chosenVariant = variant || (text?.toLowerCase().includes('replay') || text?.toLowerCase().includes('circuit') ? 'starting-lights' : 'tachometer');

  return (
    <MotorsportLoader
      variant={chosenVariant}
      text={text}
      subtext={subtext}
      size={size === 'lg' ? 'lg' : 'md'}
      fullScreen={fullScreen}
    />
  );
}
