'use client';

import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function SiteHeader() {
  return (
    <nav className="sticky top-0 z-[100] bg-[rgba(11,13,16,0.85)] backdrop-blur-[10px] border-b border-[var(--border-subtle)]">
      <div className="max-w-[1180px] mx-auto px-[var(--sp-5)] flex items-center justify-between h-[68px]">
        <Link href="/" className="logo no-underline">
          <span className="dot"></span>APEXIS
        </Link>
        <div className="flex items-center gap-[var(--sp-6)] text-[14px] text-[var(--text-secondary)] font-medium">
          <Link href="/#series" className="hover:text-[var(--text-primary)] transition-colors hidden sm:block">
            Series
          </Link>
          <Link href="/history" className="hover:text-[var(--text-primary)] transition-colors hidden sm:block">
            History
          </Link>
          <Link href="/legacy" className="hover:text-[var(--text-primary)] transition-colors hidden sm:block">
            Legacy
          </Link>
          <Link href="/about" className="hover:text-[var(--text-primary)] transition-colors hidden sm:block">
            About
          </Link>
          <div className="ml-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
