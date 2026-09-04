'use client';

import Link from 'next/link';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

export default function SiteFooter() {
  return (
    <footer className="py-12 relative z-10 border-t border-[var(--border-hairline)] bg-[var(--canvas-base)]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          <div className="pr-4">
            <Link href="/" className="logo no-underline mb-3 block">
              <span className="dot"></span>APEXIS
            </Link>
            <p className="text-xs text-[var(--text-muted)] max-w-[280px] leading-[1.6]">
              Independent telemetry console built for motorsport fans — live timing towers, telemetry telemetry delta replays, and AI strategy briefings.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[10px] tracking-wider uppercase text-[var(--amber)] font-bold mb-3">
              INTELLIGENCE &amp; MODELS
            </h4>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/models" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Predictive AI Accuracy
              </Link>
              <Link href="/history/what-if" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Counterfactual Simulator
              </Link>
              <Link href="/embed/f1" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Embed Live Widget
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[10px] tracking-wider uppercase text-[var(--amber)] font-bold mb-3">
              RESOURCES &amp; DOCS
            </h4>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/guide" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Operating User Guide
              </Link>
              <Link href="/faq" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Telemetry FAQ
              </Link>
              <Link href="/about/data" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Methodology &amp; OpenF1
              </Link>
              <Link href="/developers" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Developer API
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[10px] tracking-wider uppercase text-[var(--amber)] font-bold mb-3">
              PLATFORM &amp; PADDOCK
            </h4>
            <div className="flex flex-col gap-2 font-mono text-xs">
              <Link href="/about" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                About Apexis
              </Link>
              <button
                onClick={openSuggestionsModal}
                className="text-left text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Suggestions Box
              </button>
              <Link href="/legacy" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                Heritage Story
              </Link>
              <a href="https://github.com/haresham15/AIMotorsportsHub" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors no-underline">
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-2 border-t border-[var(--border-hairline)] pt-4 font-mono text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-flag)] shadow-[0_0_6px_var(--green-flag)]"></span>
            <span>TELEMETRY STACK OPERATIONAL &bull; 200 HZ</span>
          </div>
          <div>&copy; 2026 APEXIS &bull; INDEPENDENT MOTORSPORT TELEMETRY</div>
        </div>
      </div>
    </footer>
  );
}
