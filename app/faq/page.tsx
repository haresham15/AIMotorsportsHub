'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  MessageSquarePlus, 
  Activity, 
  Radio, 
  User, 
  Flag, 
  ShieldCheck,
  Zap,
  Gauge
} from 'lucide-react';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'what-is-apexis',
    category: 'General',
    question: 'What is Apexis and what is its main objective?',
    badge: 'Overview',
    answer: 'Apexis is an independent, broadcast-grade motorsport telemetry and race intelligence platform. Its primary mission is to unify the fragmented racing world—consolidating live telemetry, frame-accurate 2D circuit replays, AI pit wall radio, predictive strategy sandboxes, and fan attendance tracking across Formula 1, NASCAR, Formula E, and junior categories onto a single high-performance screen.',
  },
  {
    id: 'guest-access',
    category: 'General',
    question: 'Do I need an account to view telemetry or use the AI Race Engineer?',
    badge: 'Guest Access',
    answer: 'No. Apexis strictly adheres to a guest-first architecture. All core features—including the live 2D circuit map, race replays, driver telemetry HUD, live timing leaderboard, and AI Race Engineer—are 100% accessible to guest visitors without mandatory login or paywalls. Creating an account is optional and enables personalized features such as following favorite drivers/teams, logging Grand Prix check-ins, and tracking attendance streaks.',
  },
  {
    id: 'how-physics-works',
    category: 'Telemetry',
    question: 'How are vehicle speed, 8-speed gears, throttle, and braking calculated?',
    badge: 'Physics Engine',
    answer: 'Apexis uses a forward-backward velocity profiling engine. It computes local track curvature (κ) from the circuit reference line to calculate corner apex minimum speeds based on lateral tire grip limits (V ≤ √(a_lat / κ)). A backward braking pass (~4.7g) calculates realistic braking markers 100–150m before turns, and a forward acceleration pass (~1.1g) models traction-limited speed build-up. The 8-speed sequential gearbox shifts dynamically between 80 km/h (Gear 2) and 350+ km/h (Gear 8), while throttle cuts to 0% and brakes ramp up to 100% in braking zones.',
  },
  {
    id: 'replay-sync',
    category: 'Telemetry',
    question: 'What does "REPLAY SYNCED" mean on the timing board?',
    badge: 'Leaderboard Sync',
    answer: 'When replaying a session, the timing leaderboard locks strictly to the active replay frame instead of background live polls. Per our architectural guidelines, timing gaps are converted using a fixed average speed delta (200 km/h) rather than instantaneous speeds to prevent visual gap stuttering as cars brake into tight chicanes.',
  },
  {
    id: 'worker-performance',
    category: 'Telemetry',
    question: 'How does the 2D Circuit Map simulate full races without lagging?',
    badge: 'Architecture',
    answer: 'Race simulations run inside background Web Workers (workers/simulator.worker.ts) off the main browser thread. This isolates heavy coordinate math and handles up to 75,000 frames seamlessly. State updates to the main thread are throttled to ~10 FPS during playback for 60+ FPS smooth rendering, while executing instantly (<1ms) when scrubbing or paused.',
  },
  {
    id: 'data-sources',
    category: 'Telemetry',
    question: 'Where does the data come from?',
    badge: 'Data Feeds',
    answer: 'Live Formula 1 data is sourced from the OpenF1 API proxy. Endurance and GT data integrate with Al Kamel Systems timing feeds, and circuit geometries are derived from real GPS coordinates. When live telemetry is unavailable between race weekends, the multi-threaded simulator seamlessly synthesizes realistic, track-specific race data.',
  },
  {
    id: 'ai-race-engineer',
    category: 'AI Engineer',
    question: 'How does the AI Race Engineer respond in milliseconds?',
    badge: 'AI Pit Wall',
    answer: 'The Race Engineer features a dual-layer intelligence pipeline: common telemetry queries (race leader, current gaps, active tire compounds, safety car status, weather) are parsed in <2ms by an in-memory intent recognition engine without roundtrip API overhead. Complex strategic questions stream directly from Google Gemini, pre-injected with the exact active race frame context.',
  },
  {
    id: 'check-in-streaks',
    category: 'Fan Profile',
    question: 'How do Grand Prix Check-Ins and attendance streaks work?',
    badge: 'Fan HQ',
    answer: 'When logged in, users can click "Check In for this Race" in the Paddock Fan HQ bar on any series dashboard during a race round. Each check-in increments your total attendances and active race streak. Consistent attendance unlocks Fan Accreditations (such as Tifosi Vanguard, Pole Sitter, and Silver Arrows VIP) displayed on your Digital Paddock ID card at /profile.',
  },
  {
    id: 'instant-demo-pass',
    category: 'Fan Profile',
    question: 'What is the Instant Paddock Pass (VIP Demo)?',
    badge: 'Testing',
    answer: 'To make testing seamless without requiring email confirmations or third-party sign-ins, the login screen (/login) provides a 1-click "Instant Paddock Pass (VIP Fan Demo)" button that initializes an active profile, 3-race streak, and followed favorites immediately.',
  },
  {
    id: 'supported-series',
    category: 'Series',
    question: 'Which motorsport series are supported?',
    badge: 'Coverage',
    answer: 'Apexis supports Formula 1, Formula 2, Formula 3, Formula E, NASCAR Cup Series, NASCAR Xfinity Series, NASCAR Craftsman Truck Series, IndyCar, WEC (World Endurance Championship), IMSA WeatherTech SportsCar, MotoGP, World Superbike, and Top Fuel Drag Racing.',
  },
  {
    id: 'suggestions-box',
    category: 'Feedback',
    question: 'How do I submit feedback, bug reports, or feature requests?',
    badge: 'Contact',
    answer: 'You can submit suggestions through the built-in Suggestions Box modal. Click the "Suggestions Box" button in the header, footer, or on this page. All feedback is logged and dispatched directly to engineering at haresham2006@gmail.com.',
  },
];

const CATEGORIES = ['All', 'General', 'Telemetry', 'AI Engineer', 'Fan Profile', 'Series', 'Feedback'];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({
    'what-is-apexis': true,
    'how-physics-works': true,
  });

  const toggleItem = (id: string) => {
    setOpenItemIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = 
        !searchQuery.trim() || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <main className="max-w-[960px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <Link href="/" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-block mb-3">
            &larr; Back to Racing Hub
          </Link>
          <div className="eyebrow">Knowledge Base &amp; FAQ</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-3 tracking-tight font-[family-name:var(--font-disp)] uppercase">
            Frequently Asked Questions
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-[640px] leading-relaxed">
            Everything you need to know about the Apexis telemetry engine, AI race engineer, physics profiling, and fan features.
          </p>
        </div>

        <button
          onClick={openSuggestionsModal}
          className="btn-primary text-xs px-5 py-3 flex items-center gap-2 cursor-pointer font-bold shadow-lg shadow-amber-500/10"
        >
          <MessageSquarePlus size={15} />
          <span>Suggestions Box</span>
        </button>
      </div>

      {/* Search Bar & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword (e.g. physics, telemetry, gemini, streak)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-2 rounded-lg font-mono transition-colors cursor-pointer shrink-0 ${
                  active 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' 
                    : 'bg-white/5 text-[var(--text-muted)] border border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion List */}
      {filteredFAQs.length === 0 ? (
        <div className="text-center py-16 px-4 card glass rounded-[var(--radius-xl)]">
          <HelpCircle size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No matching questions found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-4">
            Try adjusting your search terms or submit your question directly through the suggestions box.
          </p>
          <button
            onClick={openSuggestionsModal}
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-2 cursor-pointer font-bold"
          >
            <MessageSquarePlus size={13} />
            <span>Ask via Suggestions Box</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-12">
          {filteredFAQs.map((item) => {
            const isOpen = !!openItemIds[item.id];
            return (
              <div
                key={item.id}
                className="card glass rounded-xl border border-white/10 bg-[var(--bg-card)] overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    {item.badge && (
                      <span className="hidden sm:inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/10 shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <h3 className="text-sm sm:text-base font-bold text-white m-0 tracking-wide">
                      {item.question}
                    </h3>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-white/5 animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Contact Banner */}
      <section className="card glass rounded-[var(--radius-xl)] p-8 text-center bg-gradient-to-b from-white/[0.04] to-transparent border border-amber-500/20">
        <h2 className="text-xl font-extrabold text-white mb-2 font-[family-name:var(--font-disp)] uppercase tracking-tight">
          Have a Question Not Listed Here?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-[500px] mx-auto mb-5 leading-relaxed">
          Send your question or feedback directly to engineering. Every submission is routed to <strong>haresham2006@gmail.com</strong>.
        </p>
        <button
          onClick={openSuggestionsModal}
          className="btn-primary text-xs px-6 py-2.5 cursor-pointer font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <MessageSquarePlus size={14} />
          <span>Open Suggestions Box</span>
        </button>
      </section>
    </main>
  );
}
