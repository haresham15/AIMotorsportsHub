import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="py-[var(--sp-8)] relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]">
      <div className="max-w-[1180px] mx-auto px-[var(--sp-5)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--sp-6)] padding-bottom-[var(--sp-7)]">
          <div className="pr-4">
            <Link href="/" className="logo no-underline mb-[var(--sp-3)] block">
              <span className="dot"></span>APEXIS
            </Link>
            <p className="text-[13px] text-[var(--text-muted)] max-w-[280px] leading-[1.6]">
              An independent dashboard built for motorsport fans who want the whole weekend - live timing, AI briefings, and full replays - in one place.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-[var(--sp-4)]">
              Product
            </h4>
            <Link href="/models" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              Predictive AI Models
            </Link>
            <Link href="/embed/f1" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              Embed Widget
            </Link>
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-[var(--sp-4)]">
              Resources
            </h4>
            <Link href="/about/data" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              Data & Methodology
            </Link>
            <Link href="/developers" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              Developer API
            </Link>
          </div>
          <div>
            <h4 className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--text-muted)] mb-[var(--sp-4)]">
              About
            </h4>
            <Link href="/legacy" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              Legacy
            </Link>
            <Link href="/about" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              About Apexis
            </Link>
            <a href="https://github.com/haresham15/AIMotorsportsHub" target="_blank" rel="noopener noreferrer" className="block text-[14px] text-[var(--text-secondary)] mb-[var(--sp-3)] hover:text-[var(--amber)] transition-colors">
              GitHub
            </a>
          </div>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-[var(--sp-3)] border-t border-[var(--border-subtle)] pt-[var(--sp-5)] font-mono text-[12px] text-[var(--text-muted)] mt-[var(--sp-6)]">
          <div className="flex items-center gap-[8px]">
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--green-flag)] shadow-[0_0_6px_var(--green-flag)]"></span>
            ALL SYSTEMS LIVE
          </div>
          <div>(c) 2026 APEXIS - NOT AFFILIATED WITH FIA, NASCAR, OR NHRA</div>
        </div>
      </div>
    </footer>
  );
}
