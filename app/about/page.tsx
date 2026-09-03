'use client';

import Link from 'next/link';
import { 
  Cpu, 
  Gauge, 
  Activity, 
  Radio, 
  Sliders, 
  User, 
  ShieldCheck, 
  Flag, 
  Sparkles, 
  MessageSquarePlus, 
  ArrowRight,
  Database,
  Lock,
  Zap,
  Globe
} from 'lucide-react';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

export default function AboutPage() {
  return (
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Top Breadcrumb & Hero */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-10 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <Link href="/" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-block mb-3">
            &larr; Back to Racing Hub
          </Link>
          <div className="eyebrow">Platform Architecture &amp; Mission</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-4 tracking-tight font-[family-name:var(--font-disp)] uppercase">
            About Apexis
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-[760px] leading-[1.65]">
            Apexis was built to solve a simple problem: motorsport fans used to need a delayed timing app, a strategist&apos;s social feed, paywalled telemetry charts, and a highlights reel to understand a race. Apexis puts the entire weekend on one unified, high-performance wall.
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

      {/* Primary Objective Banner */}
      <section className="card glass rounded-[var(--radius-xl)] p-8 mb-16 border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[var(--amber)] shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase font-bold text-[var(--amber)] tracking-wider">The Core Objective</span>
            <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase mt-1 mb-2">
              Unifying Global Motorsports on One Screen
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0 max-w-[850px]">
              Our mission is to democratize telemetry and race intelligence. We believe broadcast-grade data—instant car coordinates, realistic sequential shifting physics, pit loss projections, and conversational AI pit radios—should not be locked behind private team networks or subscription fees. Apexis bridges Formula 1, NASCAR, Formula E, endurance racing, and feeder series into one cohesive, interactive command center.
            </p>
          </div>
        </div>
      </section>

      {/* Comprehensive Feature Grid */}
      <section className="mb-20">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
          <div>
            <span className="font-mono text-xs text-[var(--amber)] uppercase font-bold tracking-wider">Capability Matrix</span>
            <h2 className="text-3xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
              Core Platform Features
            </h2>
          </div>
          <Link href="/guide" className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1">
            <span>Read Operating Guide</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)] mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                2D Circuit Map &amp; Web Worker Replay
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Visual bird&apos;s-eye telemetry rendered on accurate circuit coordinates. Simulates up to 75,000 frames off-thread using dedicated Web Workers without blocking the main UI thread.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Multi-threaded • 1x to 32x scrubbing
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Gauge size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                Driver Telemetry HUD &amp; 8-Speed Physics
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Instantaneous vehicle speed (80 to 350+ km/h), dynamic 8-speed sequential shifting, responsive throttle (THR) and brake (BRK) pedal inputs, tyre compound age, and DRS indicators.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Curvature profiling • Threshold braking
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
                <Radio size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                AI Race Engineer Pit Wall Radio
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Interactive tactical AI radio streaming pit recommendations, gap analysis, and tire strategies. Powered by a sub-2ms local intent engine combined with Google Gemini.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Sub-2ms local parsing • Gemini streaming
            </div>
          </div>

          {/* Feature 4 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                Frame-Locked Timing Board
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Real-time leaderboard synchronized frame-for-frame with the track replay. Highlights followed favorites with illuminated amber FAV star badges.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Fixed 200 km/h avg delta • Anti-jitter
            </div>
          </div>

          {/* Feature 5 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                Digital Fan Hub &amp; Check-In Streaks
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Personalized fan profiles with digital Paddock IDs, My Garage favorites manager, race weekend check-in attendance streaks, and milestone Fan Accreditations.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Dual-layer sync • Local + Supabase
            </div>
          </div>

          {/* Feature 6 */}
          <div className="card glass rounded-[var(--radius-xl)] p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                <Sliders size={20} />
              </div>
              <h3 className="text-lg font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
                Strategy Sandbox &amp; ML Models
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Interactive pit stop time-loss projection sliders and trained neural network outputs predicting podium probabilities and tire degradation bands.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 font-mono text-[10px] text-[var(--text-muted)]">
              Trained models • Counterfactual analysis
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Philosophy */}
      <section className="mb-20">
        <div className="eyebrow">Engineering Standards</div>
        <h2 className="text-3xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight mb-8">
          Architectural Philosophy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card glass rounded-[var(--radius-xl)] p-6 border border-white/10">
            <div className="flex items-center gap-2.5 text-amber-400 font-mono text-xs uppercase font-bold mb-3">
              <ShieldCheck size={16} />
              <span>100% Guest-First Access</span>
            </div>
            <h3 className="text-xl font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
              No Compulsory Logins
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
              Per repository rule in <code className="font-mono text-amber-300">AGENTS.md</code>, core tools—Live Maps, Predictors, Simulators, and Pit Wall Radios—must remain fully usable for guest users without requiring a login. Fans who choose to log in receive personalized perks (favorites tracking, attendance streaks), but no racing fan is ever shut out.
            </p>
          </div>

          <div className="card glass rounded-[var(--radius-xl)] p-6 border border-white/10">
            <div className="flex items-center gap-2.5 text-emerald-400 font-mono text-xs uppercase font-bold mb-3">
              <Cpu size={16} />
              <span>Client-Side Heavy Compute</span>
            </div>
            <h3 className="text-xl font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
              $0 Serverless Overhead
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
              Heavy tasks are offloaded entirely to the client: track simulation executes inside isolated Web Workers, and live standings OCR extraction runs via in-browser Tesseract.js. This guarantees zero server compute latency, instant responsiveness, and infinite horizontal scalability.
            </p>
          </div>

          <div className="card glass rounded-[var(--radius-xl)] p-6 border border-white/10">
            <div className="flex items-center gap-2.5 text-sky-400 font-mono text-xs uppercase font-bold mb-3">
              <Database size={16} />
              <span>Hybrid Cloud Architecture</span>
            </div>
            <h3 className="text-xl font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
              Optimized Stack Integration
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
              Apexis leverages Next.js App Router route handlers for edge APIs, Supabase PostgreSQL and Auth for user profiles, Google Gemini for strategic reasoning, and AWS Lambda/S3 for background ingestion and asset caching.
            </p>
          </div>

          <div className="card glass rounded-[var(--radius-xl)] p-6 border border-white/10">
            <div className="flex items-center gap-2.5 text-purple-400 font-mono text-xs uppercase font-bold mb-3">
              <Lock size={16} />
              <span>Broadcast-Grade Design</span>
            </div>
            <h3 className="text-xl font-bold text-white font-[family-name:var(--font-disp)] uppercase mb-2">
              Formal Motorsport Aesthetics
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
              We strictly enforce professional paddock aesthetics: zero cartoon emojis, monospace timing typography, authentic team color bars, high-contrast dark modes, and authentic circuit layouts.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Contact & Suggestions Box Banner */}
      <section className="card glass rounded-[var(--radius-xl)] p-10 text-center bg-gradient-to-b from-white/[0.05] via-transparent to-black/40 border border-amber-500/30">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)] mx-auto mb-4">
          <MessageSquarePlus size={28} />
        </div>
        <div className="eyebrow text-amber-400 mb-1">Direct Engineering Connection</div>
        <h2 className="text-3xl font-extrabold text-white mb-3 font-[family-name:var(--font-disp)] uppercase tracking-tight">
          Help Shape the Future of Apexis
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-[620px] mx-auto mb-8 leading-relaxed">
          Apexis is built by motorsport engineers and developers for passionate fans. Whether you have an idea for a new telemetry gauge, a bug report, or a series request, your feedback is dispatched directly to engineering at <strong>haresham2006@gmail.com</strong>.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={openSuggestionsModal}
            className="btn-primary text-xs px-7 py-3 cursor-pointer font-bold inline-flex items-center gap-2 shadow-xl shadow-amber-500/20"
          >
            <MessageSquarePlus size={15} />
            <span>Open Suggestions Box</span>
          </button>
          
          <Link
            href="/faq"
            className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors no-underline"
          >
            Browse FAQ
          </Link>
          
          <Link
            href="/guide"
            className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors no-underline"
          >
            Operating Guide
          </Link>
        </div>
      </section>
    </main>
  );
}
