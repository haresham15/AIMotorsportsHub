'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Compass, 
  Sparkles, 
  Archive, 
  ChevronDown 
} from 'lucide-react';

export type HistoryModule = 'overview' | 'goat' | 'head-to-head' | 'seasons' | 'tracks' | 'what-if';

interface ModuleItem {
  id: HistoryModule;
  label: string;
  shortLabel: string;
  href: string;
  badge?: string;
  icon: React.ElementType;
  description: string;
  category: 'Analysis & Ratings' | 'Database Archives' | 'Simulation';
}

const HISTORY_MODULES: ModuleItem[] = [
  {
    id: 'goat',
    label: 'The GOAT Debate',
    shortLabel: 'GOAT Elo',
    href: '/history/goat',
    badge: 'Dual-Elo',
    icon: Trophy,
    description: 'Mathematically isolated driver skill vs car dominance rankings',
    category: 'Analysis & Ratings',
  },
  {
    id: 'head-to-head',
    label: 'Driver Head-to-Head',
    shortLabel: 'Head-to-Head',
    href: '/history/head-to-head',
    badge: 'Pairwise',
    icon: Users,
    description: 'Direct telemetry, qualifying, and finish deltas between teammates & rivals',
    category: 'Analysis & Ratings',
  },
  {
    id: 'seasons',
    label: 'Past Seasons Archive',
    shortLabel: 'Seasons',
    href: '/history/seasons',
    badge: '74 Seasons',
    icon: Calendar,
    description: 'Full standings, race calendars, and statistics since 1950',
    category: 'Database Archives',
  },
  {
    id: 'tracks',
    label: 'Circuit Topography & Records',
    shortLabel: 'Circuits',
    href: '/history/tracks',
    badge: 'Records',
    icon: Compass,
    description: 'Track dimensions, turns, locations, and race counts',
    category: 'Database Archives',
  },
  {
    id: 'what-if',
    label: '"What If?" Strategy Simulator',
    shortLabel: 'What If?',
    href: '/history/what-if',
    badge: 'ML Engine',
    icon: Sparkles,
    description: 'Counterfactual race strategy simulations powered by neural models',
    category: 'Simulation',
  },
  {
    id: 'overview',
    label: 'Historical Overview Hub',
    shortLabel: 'Overview',
    href: '/history',
    badge: '1950–Pres',
    icon: Archive,
    description: 'Complete motorsport records and historical telemetry directories',
    category: 'Database Archives',
  },
];

interface Props {
  activeTab?: HistoryModule;
}

export default function HistoryNav({ activeTab }: Props) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect active tab from pathname if not explicitly passed
  const currentTabId = activeTab || (() => {
    if (pathname.startsWith('/history/goat')) return 'goat';
    if (pathname.startsWith('/history/head-to-head')) return 'head-to-head';
    if (pathname.startsWith('/history/seasons')) return 'seasons';
    if (pathname.startsWith('/history/tracks')) return 'tracks';
    if (pathname.startsWith('/history/what-if')) return 'what-if';
    return 'overview';
  })();

  const currentModule = HISTORY_MODULES.find(m => m.id === currentTabId) || HISTORY_MODULES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['Analysis & Ratings', 'Database Archives', 'Simulation'] as const;

  return (
    <div className="w-full mb-8 pt-2">
      {/* Top Breadcrumb row */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[var(--border-hairline)] text-xs font-mono">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-[var(--text-muted)] hover:text-white transition-colors no-underline uppercase tracking-wider"
          >
            Paddock Hub
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <Link
            href="/history"
            className={`no-underline uppercase tracking-wider ${
              currentTabId === 'overview' ? 'text-[var(--amber)] font-bold' : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            History Archive
          </Link>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-none bg-red-600/15 text-red-400 border border-red-500/25 uppercase tracking-wider hidden sm:inline">
            F1 Specification (1950–Present)
          </span>
          {currentTabId !== 'overview' && (
            <>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-white font-bold uppercase tracking-wider">
                {currentModule.shortLabel}
              </span>
            </>
          )}
        </div>

        {/* Quick Module Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-none border text-xs font-mono transition-all cursor-pointer ${
              dropdownOpen
                ? 'bg-[var(--surface-elevated)] border-[var(--amber)] text-white shadow-lg'
                : 'bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-active)]'
            }`}
          >
            <currentModule.icon size={13} className="text-[var(--amber)] shrink-0" />
            <span className="font-bold uppercase tracking-wider hidden sm:inline">Jump To:</span>
            <span className="text-white font-bold">{currentModule.shortLabel}</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-150 text-[var(--text-muted)] ${
                dropdownOpen ? 'rotate-180 text-[var(--amber)]' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-84 rounded-sm bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-2xl p-2 z-50 animate-fade-in-up">
              <div className="px-2.5 py-1.5 border-b border-[var(--border-hairline)] flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="font-bold uppercase tracking-wider text-[var(--amber)]">
                    F1 HISTORICAL MODULES
                  </span>
                </div>
                <span className="text-[9px] px-1 py-0.2 rounded-none bg-red-600/15 text-red-400 border border-red-500/25 uppercase font-bold">
                  F1 Active
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-2 max-h-[70vh] overflow-y-auto">
                {categories.map((cat) => {
                  const itemsInCat = HISTORY_MODULES.filter(m => m.category === cat);
                  if (itemsInCat.length === 0) return null;
                  return (
                    <div key={cat} className="flex flex-col gap-0.5">
                      <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] bg-white/5">
                        {cat}
                      </div>
                      {itemsInCat.map((m) => {
                        const isSelected = m.id === currentTabId;
                        const Icon = m.icon;
                        return (
                          <Link
                            key={m.id}
                            href={m.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-start gap-2.5 px-2.5 py-2 rounded-none transition-colors no-underline group ${
                              isSelected
                                ? 'bg-[var(--surface-elevated)] border-l-2 border-l-[var(--amber)] text-white'
                                : 'hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
                            }`}
                          >
                            <Icon
                              size={15}
                              className={`mt-0.5 shrink-0 ${
                                isSelected ? 'text-[var(--amber)]' : 'text-[var(--text-muted)] group-hover:text-amber-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white group-hover:text-amber-300 truncate">
                                  {m.label}
                                </span>
                                {m.badge && (
                                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 bg-white/5 text-[var(--text-muted)] border border-white/5 rounded-none shrink-0">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5 mb-0 line-clamp-1 font-sans">
                                {m.description}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-none bg-[var(--amber)] shrink-0 mt-1.5" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Multi-Motorsport Roadmap Notice in Module Switcher */}
              <div className="mt-2 pt-2 border-t border-[var(--border-hairline)] px-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-muted)] uppercase mb-1">
                  <span className="text-amber-400 font-bold">Multi-Series Roadmap:</span>
                  <span className="text-[8px] bg-white/5 border border-white/5 px-1 py-0.2">In Dev</span>
                </div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] leading-tight m-0">
                  WEC, NASCAR, Formula E &amp; IndyCar archives are currently in staging and will launch in upcoming updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Tab Deck (Organized Pills) */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {HISTORY_MODULES.filter(m => m.id !== 'overview').map((m) => {
          const isSelected = m.id === currentTabId;
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              href={m.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-none text-xs font-mono transition-all no-underline shrink-0 ${
                isSelected
                  ? 'bg-[var(--amber)] text-black font-extrabold shadow-md'
                  : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-hairline)]'
              }`}
            >
              <Icon size={13} className={isSelected ? 'text-black' : 'text-[var(--amber)]'} />
              <span>{m.label}</span>
              {m.badge && (
                <span className={`text-[9px] font-bold px-1 py-0.2 ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-white/5 text-[var(--text-muted)]'
                }`}>
                  {m.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* F1 Only Status Badge */}
        <div className="ml-auto shrink-0 hidden xl:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-none bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--text-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          <span className="text-white font-bold">F1 Active</span>
          <span className="text-[9px] text-[var(--text-muted)]">&bull; Other Series in Dev</span>
        </div>
      </div>
    </div>
  );
}
