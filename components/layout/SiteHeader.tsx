'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from '@/components/AuthButton';
import {
  ChevronDown,
  Activity,
  Database,
  Sparkles,
  HelpCircle,
  BookMarked,
  Info,
  MessageSquarePlus,
  Compass,
  Trophy,
  Cpu,
  Layers,
  Flame,
  ArrowUpRight,
  Menu,
  X,
  Users,
  Calendar,
  MapPin,
} from 'lucide-react';
import { SERIES, SERIES_MAP } from '@/lib/data';
import { useUserProfile } from '@/lib/userPreferences';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

const SERIES_GROUPS = [
  {
    category: 'Open Wheel Formula',
    ids: ['f1', 'f2', 'f3', 'formula-e'],
  },
  {
    category: 'Endurance & GT Racing',
    ids: ['gt-world-challenge', 'wec'],
  },
  {
    category: 'Stock Car & Drag',
    ids: ['nascar', 'top-fuel'],
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { isLoggedIn } = useUserProfile();

  // Active navigation dropdown states
  const [seriesDropdownOpen, setSeriesDropdownOpen] = useState(false);
  const [analyticsDropdownOpen, setAnalyticsDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const seriesRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seriesRef.current && !seriesRef.current.contains(event.target as Node)) {
        setSeriesDropdownOpen(false);
      }
      if (analyticsRef.current && !analyticsRef.current.contains(event.target as Node)) {
        setAnalyticsDropdownOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close all menus on route change
  useEffect(() => {
    setSeriesDropdownOpen(false);
    setAnalyticsDropdownOpen(false);
    setResourcesDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Identify active series if on a series dashboard
  const isDashboard = pathname?.startsWith('/dashboard');
  const currentSeriesKey = isDashboard && pathname.split('/')[2] ? pathname.split('/')[2] : 'f1';
  const currentSeries = SERIES_MAP[currentSeriesKey] || SERIES_MAP['f1'];

  const isAnalyticsActive =
    pathname?.startsWith('/history') || pathname?.startsWith('/models');
  const isResourcesActive =
    pathname?.startsWith('/guide') ||
    pathname?.startsWith('/faq') ||
    pathname?.startsWith('/about');

  return (
    <header className="sticky top-0 z-[100] bg-[var(--canvas-base)] border-b border-[var(--border-hairline)]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[58px]">
        
        {/* ── Left Deck: Brand & Interactive Series Switcher ───────────── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="logo no-underline flex items-center gap-2 group">
            <span className="dot transition-transform group-hover:scale-125" />
            <span className="tracking-[0.06em] font-black text-[var(--text-primary)] font-[family-name:var(--font-disp)] text-xl">
              APEXIS
            </span>
          </Link>

          {/* Championship Switcher Dropdown */}
          <div className="relative" ref={seriesRef}>
            <button
              onClick={() => {
                setSeriesDropdownOpen(!seriesDropdownOpen);
                setAnalyticsDropdownOpen(false);
                setResourcesDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xs border transition-colors cursor-pointer text-xs font-mono ${
                seriesDropdownOpen
                  ? 'bg-[var(--surface-elevated)] border-[var(--amber)] text-white'
                  : 'bg-[var(--surface-subtle)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-elevated)] hover:border-[var(--border-active)]'
              }`}
              title="Switch Racing Championship"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isDashboard ? currentSeries.color : 'var(--amber)' }}
              />
              <span className="font-bold uppercase tracking-wider text-white">
                {isDashboard ? currentSeries.name : 'Championship'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-white/5 text-[var(--text-muted)] border border-white/5 hidden md:inline">
                {isDashboard ? currentSeries.shortName : '7 GRIDS'}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-150 ${
                  seriesDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {/* Series Dropdown Menu - Categorized */}
            {seriesDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-84 rounded-sm bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-xl p-2 z-50 animate-fade-in-up">
                <div className="px-2.5 py-1.5 border-b border-[var(--border-hairline)] flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-[var(--amber)]">
                    SELECT CHAMPIONSHIP
                  </span>
                  <span className="text-[var(--text-muted)]">2026 SEASON</span>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  {SERIES_GROUPS.map((group) => {
                    const groupSeries = SERIES.filter((s) => group.ids.includes(s.id));
                    return (
                      <div key={group.category} className="space-y-0.5">
                        <div className="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[var(--amber)] opacity-60" />
                          <span>{group.category}</span>
                        </div>
                        {groupSeries.map((s) => {
                          const isSelected = isDashboard && s.id === currentSeriesKey;
                          return (
                            <Link
                              key={s.id}
                              href={`/dashboard/${s.id}`}
                              onClick={() => setSeriesDropdownOpen(false)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-none transition-colors no-underline group ${
                                isSelected
                                  ? 'bg-[var(--surface-elevated)] border-l-2 border-l-[var(--amber)] text-white'
                                  : 'hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-1 h-4 rounded-none shrink-0"
                                  style={{ backgroundColor: s.color }}
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-white group-hover:text-amber-300">
                                      {s.name}
                                    </span>
                                    <span className="font-mono text-[9px] px-1 py-0.2 rounded-none bg-white/5 text-[var(--text-muted)] border border-white/5">
                                      {s.shortName}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-none bg-[var(--amber)] mr-1" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center Deck: Organized Grouped Navigation ──────────────── */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-mono">
          {/* Live Racing Quick Link */}
          <Link
            href="/dashboard/f1"
            className={`px-2.5 py-1.5 rounded-none transition-colors flex items-center gap-1.5 no-underline ${
              isDashboard
                ? 'text-white font-bold bg-[var(--surface-elevated)] border-b-2 border-b-[var(--amber)]'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)]'
            }`}
          >
            <Activity size={13} className={isDashboard ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
            <span className="uppercase tracking-wider">Telemetry</span>
          </Link>

          {/* 1. Analytics & History Dropdown (F1 Specification) */}
          <div className="relative" ref={analyticsRef}>
            <button
              onClick={() => {
                setAnalyticsDropdownOpen(!analyticsDropdownOpen);
                setSeriesDropdownOpen(false);
                setResourcesDropdownOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                isAnalyticsActive || analyticsDropdownOpen
                  ? 'text-white font-bold bg-[var(--surface-elevated)] border-b-2 border-b-[var(--amber)]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)]'
              }`}
              title="Formula 1 Analytics & Historical Archive (Other motorsports in development)"
            >
              <Database size={13} className={isAnalyticsActive ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
              <span>F1 Analytics</span>
              <span className="text-[9px] px-1 py-0.2 rounded-xs bg-red-600/15 text-red-400 border border-red-500/25 hidden xl:inline font-bold">
                F1 ONLY
              </span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-150 ${
                  analyticsDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {analyticsDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-84 rounded-sm bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-xl p-1.5 z-50 animate-fade-in-up">
                <div className="px-2.5 py-1.5 border-b border-[var(--border-hairline)] flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e10600]" />
                    <span className="font-bold uppercase tracking-wider text-white">
                      FORMULA 1 ANALYTICS
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-none bg-red-600/15 text-red-400 border border-red-500/30 font-bold uppercase">
                    F1 ONLY
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 mt-1 font-mono">
                  {/* Category 1: F1 Historical Archive & Standings */}
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-white/5 border-y border-[var(--border-hairline)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--amber)]" />
                      <span>F1 Archive (1950–Present)</span>
                    </div>
                    <span className="text-[8px] text-[var(--amber)] font-bold">75 SEASONS</span>
                  </div>

                  <Link
                    href="/history"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Database size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        Historical Archive Hub
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        70+ years of Grand Prix telemetry &amp; results
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/history/goat"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Trophy size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        GOAT Debate (F1 Dual-Elo)
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Era-adjusted driver skill vs. machinery rating
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/history/head-to-head"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Users size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        Head-to-Head Comparison
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Teammate rivalries, shared starts &amp; qualifying deltas
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/history/seasons"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Calendar size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        Past Seasons Archive
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Every season standings from 1950 to 2025
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/history/tracks"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <MapPin size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        Circuit Records &amp; Directory
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Track directory, host nations &amp; classics
                      </div>
                    </div>
                  </Link>

                  {/* Category 2: F1 AI Strategy & Telemetry */}
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-white/5 border-y border-[var(--border-hairline)] mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-sky-400" />
                      <span>F1 AI Strategy &amp; Telemetry</span>
                    </div>
                    <span className="text-[8px] text-sky-400 font-bold">NEURAL ML</span>
                  </div>

                  <Link
                    href="/history/what-if"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Sparkles size={15} className="text-sky-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">
                        &ldquo;What If?&rdquo; Strategy Simulator
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Counterfactual pit timing &amp; tire degradation ML
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/models"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Cpu size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Model Benchmarks &amp; Health
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Real-time simulation error &amp; neural telemetry
                      </div>
                    </div>
                  </Link>

                  {/* Multi-Motorsport Roadmap Notice */}
                  <div className="mt-1 pt-1 border-t border-[var(--border-hairline)]">
                    <div className="p-2 bg-[var(--surface-subtle)] border border-[var(--border-hairline)] rounded-none font-mono">
                      <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">
                        <div className="flex items-center gap-1.5">
                          <Layers size={10} className="text-[var(--amber)]" />
                          <span>Other Motorsports Support</span>
                        </div>
                        <span className="text-[8px] text-[var(--amber)] border border-[var(--amber)]/30 px-1 rounded-xs bg-[var(--amber)]/10 font-bold">
                          IN DEVELOPMENT
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] leading-[1.4] m-0">
                        Analytics modules are currently calibrated for <strong className="text-white">Formula 1</strong>. Historical datasets and models for <span className="text-[var(--text-secondary)]">WEC, NASCAR, Formula E, and IndyCar</span> will launch in future updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Resources & Docs Dropdown */}
          <div className="relative" ref={resourcesRef}>
            <button
              onClick={() => {
                setResourcesDropdownOpen(!resourcesDropdownOpen);
                setSeriesDropdownOpen(false);
                setAnalyticsDropdownOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                isResourcesActive || resourcesDropdownOpen
                  ? 'text-white font-bold bg-[var(--surface-elevated)] border-b-2 border-b-[var(--amber)]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)]'
              }`}
            >
              <Compass size={13} className={isResourcesActive ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
              <span>Resources</span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-150 ${
                  resourcesDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {resourcesDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 rounded-sm bg-[var(--surface-console)] border border-[var(--border-hairline)] shadow-xl p-1.5 z-50 animate-fade-in-up">
                <div className="px-2.5 py-1.5 border-b border-[var(--border-hairline)]">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)]">
                    DOCUMENTATION &amp; GUIDES
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 mt-1">
                  <Link
                    href="/guide"
                    onClick={() => setResourcesDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <BookMarked size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        Operating User Guide
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Replay tools &amp; keyboard shortcuts
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/faq"
                    onClick={() => setResourcesDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <HelpCircle size={15} className="text-sky-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300">
                        FAQ Knowledge Base
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Telemetry math, Workers, and streaks
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setResourcesDropdownOpen(false)}
                    className="p-2 rounded-none hover:bg-[var(--surface-elevated)] transition-colors no-underline flex items-start gap-2.5 group border-t border-[var(--border-hairline)] mt-1"
                  >
                    <Info size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        About APEXIS
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Platform mission &amp; architecture
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── Right Deck: Quick Actions (Feedback & Paddock Profile) ──── */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Suggestions Box Direct Action */}
          <button
            onClick={openSuggestionsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-[var(--surface-subtle)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] hover:border-[var(--amber)] text-white hover:text-[var(--amber)] text-xs font-mono font-semibold transition-colors cursor-pointer"
            title="Open Suggestions Box"
          >
            <MessageSquarePlus size={12} className="text-[var(--amber)]" />
            <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Feedback</span>
          </button>

          {/* User Profile Avatar & Dropdown */}
          <AuthButton />

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 rounded-none bg-[var(--surface-subtle)] border border-[var(--border-hairline)] lg:hidden flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer Menu ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--surface-console)] border-b border-[var(--border-hairline)] px-5 py-4 max-h-[85vh] overflow-y-auto animate-fade-in-up font-mono">
          
          {/* Active Series Badge in Mobile */}
          <div className="mb-4 pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: currentSeries.color }}
              />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Active Series: {currentSeries.name}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-400 font-bold">
              {currentSeries.shortName}
            </span>
          </div>

          {/* Section 1: Championships Grid */}
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider mb-2">
              CHAMPIONSHIPS BY CATEGORY
            </div>
            <div className="space-y-2.5">
              {SERIES_GROUPS.map((group) => {
                const groupSeries = SERIES.filter((s) => group.ids.includes(s.id));
                return (
                  <div key={`mob-${group.category}`}>
                    <div className="text-[9px] font-mono uppercase text-[var(--text-muted)] tracking-wider mb-1">
                      {group.category}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {groupSeries.map((s) => (
                        <Link
                          key={s.id}
                          href={`/dashboard/${s.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-2.5 py-1.5 rounded-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-elevated)] border border-[var(--border-hairline)] text-xs font-mono flex items-center gap-2 text-white no-underline"
                        >
                          <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="truncate">{s.shortName}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Analytics & AI (F1 Specification) */}
          <div className="mb-4 border-t border-[var(--border-hairline)] pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider">
                F1 HISTORICAL ARCHIVE (F1 ONLY)
              </div>
              <span className="text-[8px] px-1.5 py-0.2 rounded-none bg-red-600/20 text-red-400 font-bold border border-red-500/30 uppercase">
                F1 ACTIVE
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-xs">
              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Database size={14} className="text-amber-400" />
                <span>F1 Historical Archive (1950–Present)</span>
              </Link>
              <Link
                href="/history/goat"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Trophy size={14} className="text-amber-400" />
                <span>GOAT Debate (F1 Dual-Elo Ratings)</span>
              </Link>
              <Link
                href="/history/head-to-head"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Users size={14} className="text-amber-400" />
                <span>F1 Head-to-Head Comparison</span>
              </Link>
              <Link
                href="/history/seasons"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Calendar size={14} className="text-amber-400" />
                <span>F1 Past Seasons Archive</span>
              </Link>
              <Link
                href="/history/tracks"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <MapPin size={14} className="text-amber-400" />
                <span>F1 Circuit Records &amp; Directory</span>
              </Link>
            </div>

            <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider mt-3 mb-2">
              F1 AI STRATEGY &amp; TELEMETRY (F1 ONLY)
            </div>
            <div className="flex flex-col gap-0.5 text-xs">
              <Link
                href="/history/what-if"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Sparkles size={14} className="text-sky-400" />
                <span>&ldquo;What If?&rdquo; Strategy Simulator</span>
              </Link>
              <Link
                href="/models"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Cpu size={14} className="text-emerald-400" />
                <span>AI Model Accuracy &amp; Benchmarks</span>
              </Link>
            </div>

            {/* Other Motorsports Roadmap Card in Mobile */}
            <div className="mt-3 p-2.5 rounded-xs bg-white/5 border border-white/10 text-[10px] font-mono text-[var(--text-muted)]">
              <div className="text-amber-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                <Layers size={11} />
                <span>Other Motorsports Roadmap</span>
              </div>
              <p className="leading-tight m-0 text-[10px] text-[var(--text-muted)]">
                Analytics are currently F1-exclusive. Historical datasets for WEC, NASCAR, Formula E, and IndyCar will be integrated in future releases.
              </p>
            </div>
          </div>

          {/* Section 3: Documentation & Support */}
          <div className="border-t border-[var(--border-hairline)] pt-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider mb-2">
              DOCUMENTATION &amp; GUIDES
            </div>
            <div className="flex flex-col gap-0.5 text-xs">
              <Link
                href="/guide"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <BookMarked size={14} className="text-amber-400" />
                <span>Operating User Guide</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <HelpCircle size={14} className="text-sky-400" />
                <span>FAQ Knowledge Base</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2.5 py-1.5 rounded-xs text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-subtle)] flex items-center gap-2.5 no-underline"
              >
                <Info size={14} className="text-emerald-400" />
                <span>About APEXIS</span>
              </Link>
            </div>
          </div>

        </div>
      )}
    </header>
  );
}
