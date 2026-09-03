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
} from 'lucide-react';
import { SERIES, SERIES_MAP } from '@/lib/data';
import { useUserProfile } from '@/lib/userPreferences';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

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
    <header className="sticky top-0 z-[100] bg-[rgba(11,13,16,0.88)] backdrop-blur-2xl border-b border-[var(--border-subtle)] transition-all">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center justify-between h-[68px]">
        
        {/* ── Left Deck: Brand & Interactive Series Switcher ───────────── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="logo no-underline flex items-center gap-2 group">
            <span className="dot transition-transform group-hover:scale-125 shadow-[0_0_10px_var(--amber)]" />
            <span className="tracking-[0.06em] font-extrabold text-[var(--text-primary)] font-[family-name:var(--font-disp)] text-xl">
              APEXIS
            </span>
          </Link>

          <span className="hidden sm:inline text-white/15">|</span>

          {/* Championship Switcher Dropdown */}
          <div className="relative" ref={seriesRef}>
            <button
              onClick={() => {
                setSeriesDropdownOpen(!seriesDropdownOpen);
                setAnalyticsDropdownOpen(false);
                setResourcesDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                seriesDropdownOpen
                  ? 'bg-white/10 border-[var(--amber)] text-white shadow-[0_0_15px_rgba(255,176,32,0.15)]'
                  : 'bg-white/5 border-white/10 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
              title="Switch Racing Championship"
            >
              <span
                className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: isDashboard ? currentSeries.color : 'var(--amber)' }}
              />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                {isDashboard ? currentSeries.name : 'Series'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[var(--text-muted)] hidden md:inline">
                {isDashboard ? currentSeries.shortName : '7 Series'}
              </span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  seriesDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {/* Series Dropdown Menu */}
            {seriesDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[rgba(14,17,23,0.98)] backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)]">
                    Select Championship
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)]">Live Telemetry</span>
                </div>

                <div className="flex flex-col gap-1 mt-1.5">
                  {SERIES.map((s) => {
                    const isSelected = isDashboard && s.id === currentSeriesKey;
                    return (
                      <Link
                        key={s.id}
                        href={`/dashboard/${s.id}`}
                        onClick={() => setSeriesDropdownOpen(false)}
                        className={`flex items-center justify-between p-2 rounded-xl transition-all no-underline group ${
                          isSelected
                            ? 'bg-white/10 border border-white/10 text-white'
                            : 'hover:bg-white/5 text-[var(--text-secondary)] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-1.5 h-6 rounded-full shrink-0"
                            style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}80` }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                                {s.name}
                              </span>
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-[var(--text-muted)] border border-white/5">
                                {s.shortName}
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono truncate max-w-[170px]">
                              {s.description}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[var(--amber)] shadow-[0_0_6px_var(--amber)] mr-1" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Center Deck: Organized Grouped Navigation ──────────────── */}
        <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium">
          {/* Live Racing Quick Link */}
          <Link
            href="/dashboard/f1"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isDashboard
                ? 'text-white font-semibold bg-white/5'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={14} className={isDashboard ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
            <span>Telemetry</span>
          </Link>

          {/* 1. Analytics & History Dropdown */}
          <div className="relative" ref={analyticsRef}>
            <button
              onClick={() => {
                setAnalyticsDropdownOpen(!analyticsDropdownOpen);
                setSeriesDropdownOpen(false);
                setResourcesDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                isAnalyticsActive || analyticsDropdownOpen
                  ? 'text-white font-semibold bg-white/5'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Database size={14} className={isAnalyticsActive ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
              <span>Analytics</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  analyticsDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {analyticsDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-[rgba(14,17,23,0.98)] backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-white/10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)]">
                    Motorsport Intelligence &amp; AI
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1.5">
                  <Link
                    href="/history"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Database size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        The Historical Archive
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        70+ years of Grand Prix telemetry &amp; results
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/history/what-if"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Sparkles size={16} className="text-sky-400 mt-0.5 shrink-0" />
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
                    href="/history/goat"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <Trophy size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">
                        GOAT Debate (Dual-Elo)
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Era-adjusted driver skill vs. machinery rating
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/models"
                    onClick={() => setAnalyticsDropdownOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group border-t border-white/5"
                  >
                    <Cpu size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Model Benchmarks
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Real-time simulation error &amp; neural telemetry
                      </div>
                    </div>
                  </Link>
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
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                isResourcesActive || resourcesDropdownOpen
                  ? 'text-white font-semibold bg-white/5'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass size={14} className={isResourcesActive ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
              <span>Resources</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  resourcesDropdownOpen ? 'rotate-180 text-[var(--amber)]' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>

            {resourcesDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-[rgba(14,17,23,0.98)] backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-white/10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)]">
                    Documentation &amp; Support
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-1.5">
                  <Link
                    href="/guide"
                    onClick={() => setResourcesDropdownOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <BookMarked size={16} className="text-amber-400 mt-0.5 shrink-0" />
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
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group"
                  >
                    <HelpCircle size={16} className="text-sky-400 mt-0.5 shrink-0" />
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
                    className="p-2.5 rounded-xl hover:bg-white/5 transition-colors no-underline flex items-start gap-2.5 group border-t border-white/5"
                  >
                    <Info size={16} className="text-emerald-400 mt-0.5 shrink-0" />
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
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Suggestions Box Direct Action */}
          <button
            onClick={openSuggestionsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/5 hover:scale-105"
            title="Open Suggestions Box (Sends to haresham2006@gmail.com)"
          >
            <MessageSquarePlus size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* User Profile Avatar & Dropdown */}
          <AuthButton />

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 lg:hidden flex items-center justify-center text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer Menu ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[rgba(11,13,16,0.98)] backdrop-blur-2xl border-b border-[var(--border-subtle)] px-5 py-5 max-h-[85vh] overflow-y-auto animate-fade-in-up">
          
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
              Championships
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SERIES.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/${s.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-mono flex items-center gap-2 text-white no-underline"
                >
                  <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.shortName}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 2: Analytics & AI */}
          <div className="mb-4 border-t border-white/10 pt-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider mb-2">
              Analytics &amp; AI
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <Database size={15} className="text-amber-400" />
                <span>Historical Archive (1950–Present)</span>
              </Link>
              <Link
                href="/history/what-if"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <Sparkles size={15} className="text-sky-400" />
                <span>&ldquo;What If?&rdquo; Strategy Simulator</span>
              </Link>
              <Link
                href="/history/goat"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <Trophy size={15} className="text-amber-400" />
                <span>GOAT Debate Dual-Elo Ratings</span>
              </Link>
              <Link
                href="/models"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <Cpu size={15} className="text-emerald-400" />
                <span>AI Model Accuracy &amp; Benchmarks</span>
              </Link>
            </div>
          </div>

          {/* Section 3: Documentation & Support */}
          <div className="border-t border-white/10 pt-3">
            <div className="text-[10px] font-mono uppercase font-bold text-[var(--amber)] tracking-wider mb-2">
              Documentation &amp; Support
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Link
                href="/guide"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <BookMarked size={15} className="text-amber-400" />
                <span>Operating User Guide</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <HelpCircle size={15} className="text-sky-400" />
                <span>FAQ Knowledge Base</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2.5 no-underline"
              >
                <Info size={15} className="text-emerald-400" />
                <span>About APEXIS</span>
              </Link>
            </div>
          </div>

        </div>
      )}
    </header>
  );
}
