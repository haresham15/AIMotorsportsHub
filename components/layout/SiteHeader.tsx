'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from '@/components/AuthButton';
import { Menu, X, ChevronRight, Activity, Database, Sparkles, BookOpen, Info } from 'lucide-react';
import { SERIES_MAP } from '@/lib/data';

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if we are on a series dashboard
  const isDashboard = pathname?.startsWith('/dashboard/');
  const currentSeriesKey = isDashboard ? pathname.split('/')[2] : null;
  const currentSeries = currentSeriesKey ? SERIES_MAP[currentSeriesKey] : null;

  const navLinks = [
    { href: '/#series', label: 'Series', icon: Activity },
    { href: '/history', label: 'History', icon: Database },
    { href: '/models', label: 'Models', icon: Sparkles },
    { href: '/legacy', label: 'Legacy', icon: BookOpen },
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-[100] bg-[rgba(11,13,16,0.85)] backdrop-blur-xl border-b border-[var(--border-subtle)] transition-all">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 flex items-center justify-between h-[68px]">
        
        {/* Brand / Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="logo no-underline flex items-center gap-2 group">
            <span className="dot transition-transform group-hover:scale-125"></span>
            <span className="tracking-[0.05em] font-extrabold text-[var(--text-primary)]">APEXIS</span>
          </Link>

          {currentSeries && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-3 ml-1">
              <ChevronRight size={14} className="text-[var(--text-muted)]" />
              <span className="text-base">{currentSeries.icon}</span>
              <span className="font-semibold text-[var(--text-primary)] tracking-wide">
                {currentSeries.name}
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                Live Telemetry
              </span>
            </div>
          )}
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-[var(--text-secondary)] font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 relative hover:text-[var(--text-primary)] ${
                  isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[var(--amber)] rounded-full shadow-[0_0_8px_var(--amber)]" />
                )}
              </Link>
            );
          })}
          
          <div className="ml-2 pl-3 border-l border-[var(--border-subtle)]">
            <AuthButton />
          </div>
        </nav>

        {/* Mobile Hamburger & Quick Auth */}
        <div className="flex md:hidden items-center gap-3">
          <AuthButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-lg bg-white/5 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(11,13,16,0.96)] backdrop-blur-2xl border-b border-[var(--border-subtle)] px-6 py-6 animate-fade-in-up">
          {currentSeries && (
            <div className="mb-4 pb-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <span className="text-xl">{currentSeries.icon}</span>
              <div>
                <div className="text-xs font-mono text-[var(--amber)] font-bold uppercase tracking-wider">Active Series</div>
                <div className="text-base font-bold text-[var(--text-primary)]">{currentSeries.name}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/10 text-[var(--text-primary)] font-semibold border border-[var(--border-hover)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'} />
                  <span className="text-base">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Switch Series</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SERIES_MAP).slice(0, 6).map(([key, item]) => (
                <Link
                  key={key}
                  href={`/dashboard/${key}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--amber)] transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
