'use client';

import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Sliders, 
  Activity, 
  Radio, 
  User, 
  Calendar, 
  Flag, 
  Sparkles, 
  Keyboard, 
  MessageSquarePlus, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge
} from 'lucide-react';
import { openSuggestionsModal } from '@/components/SuggestionsModal';

export default function GuidePage() {
  return (
    <main className="max-w-[1100px] mx-auto px-6 py-12">
      {/* Top Breadcrumb & Hero */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <Link href="/" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-block mb-3">
            &larr; Back to Racing Hub
          </Link>
          <div className="eyebrow">Operating Manual &amp; Documentation</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-2 mb-3 tracking-tight font-[family-name:var(--font-disp)] uppercase">
            Apexis User Guide
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-[700px] leading-relaxed">
            Master the Apexis ecosystem—from scrubbing multi-threaded 2D circuit replays and inspecting real-time pedal telemetry, to conversing with your AI Race Engineer and tracking Grand Prix attendance streaks.
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

      {/* Quick Jump Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14">
        {[
          { id: 'replay', title: '1. Track Replay', icon: Play },
          { id: 'telemetry', title: '2. Telemetry HUD', icon: Gauge },
          { id: 'standings', title: '3. Timing Board', icon: Activity },
          { id: 'engineer', title: '4. AI Race Engineer', icon: Radio },
          { id: 'profile', title: '5. Profile & Streaks', icon: User },
          { id: 'strategy', title: '6. Strategy Sandbox', icon: Sliders },
          { id: 'series', title: '7. Multi-Series Grid', icon: Flag },
          { id: 'hotkeys', title: '8. Hotkeys & Tips', icon: Keyboard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.06] transition-all no-underline flex items-center gap-2.5 text-xs font-semibold text-white group"
            >
              <Icon size={14} className="text-[var(--amber)] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">{item.title}</span>
            </a>
          );
        })}
      </div>

      {/* Guide Content Sections */}
      <div className="flex flex-col gap-16">

        {/* Section 1: Live 2D Track Map & Race Replay */}
        <section id="replay" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)]">
              <Play size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--amber)] uppercase font-bold tracking-wider">Module 01</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Live 2D Track Map &amp; Replay Engine
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            The Apexis 2D Circuit Map provides a frame-accurate bird&apos;s-eye view of every vehicle on track, powered by an off-thread Web Worker engine that simulates up to 75,000 frames without UI hitching.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Scrubbing &amp; Timeline Transport
              </h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Drag the bottom timeline slider to instantly jump to any lap or turn in the race. Seeking executes in &lt;1ms with immediate frame synchronization to the timing leaderboard.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Playback Multipliers (1x – 32x)
              </h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Switch playback speed between <strong>1x</strong> (real-time broadcast speed), <strong>2x</strong>, <strong>4x</strong>, <strong>8x</strong>, <strong>16x</strong>, and <strong>32x</strong> to swiftly review full endurance or NASCAR Cup stints.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Standings Dock (Key: S)
              </h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                The right-hand sidebar displays instant live gaps, tire compounds, and speeds. Click the collapse icon or press <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">S</kbd> to view the circuit map in full widescreen.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Circuit Labels &amp; DRS Zones
              </h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Toggle the <strong>Labels</strong> button to show or hide 3-letter driver codes beside cars, and the <strong>DRS</strong> button to inspect official FIA Drag Reduction System activation zones.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Driver Telemetry HUD */}
        <section id="telemetry" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gauge size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Module 02</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Driver Telemetry HUD &amp; Sequential Physics
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Click any driver on the 2D Circuit Map or in the Live Timing table to lock the camera and activate their dedicated Driver Telemetry HUD in the lower left corner.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">Speed</div>
              <div className="text-xl font-mono font-black text-white">80 – 350+ <span className="text-xs font-normal text-[var(--text-muted)]">km/h</span></div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Calculated from forward-backward track curvature profiling and lateral tire grip limits.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">Gearbox</div>
              <div className="text-xl font-mono font-black text-[var(--amber)]">Gears 2 – 8</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Sequential downshifts through braking zones into hairpins, upshifting on straights.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">Throttle (THR)</div>
              <div className="text-xl font-mono font-black text-emerald-400">0% – 100%</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Drops to 0% in braking zones, balances at 35%–45% at corner apex, pins to 100% on straights.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-1">Brake (BRK)</div>
              <div className="text-xl font-mono font-black text-red-400">0% – 100%</div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Spikes up to 70%–100% on threshold braking, then trail-brakes to 15%–40% turning in.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/[0.07] border border-amber-500/20 text-xs text-amber-200 leading-relaxed font-mono">
            <strong>PRO TIP:</strong> To dismiss the focused driver HUD and return to all-car camera overview, click the &ldquo;X&rdquo; button on the HUD card or click anywhere on the open circuit canvas.
          </div>
        </section>

        {/* Section 3: Live Standings & Followed Drivers */}
        <section id="standings" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Activity size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-sky-400 uppercase font-bold tracking-wider">Module 03</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Timing Leaderboard &amp; Favorite Driver Highlighting
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            The lower live timing table synchronizes in real time with the active replay frame or live session feed. Per architectural guidelines in <code className="font-mono text-amber-300">AGENTS.md</code>, gap calculations utilize a fixed average speed delta (200 km/h) to prevent visual gap jitter in heavy braking zones.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5 text-amber-300">★ FAV Badges</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Drivers you follow in your Digital Fan Profile Hub (e.g. HAM, NOR, ANT) are marked with an amber <strong>FAV</strong> star pill and illuminated border accent.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Tyre Compounds &amp; Laps</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Pirelli color-coded compound tags (Red for Soft, Yellow for Medium, White for Hard) display the exact stint age in laps.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Interactive Telemetry Sync</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Clicking any row on the timing leaderboard locks that driver on the 2D map and opens their telemetry HUD.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: AI Race Engineer Pit Wall Radio */}
        <section id="engineer" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Radio size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-red-400 uppercase font-bold tracking-wider">Module 04</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                AI Race Engineer Pit Wall Radio
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Positioned in the bottom-right corner of the dashboard, your AI Race Engineer acts as your personal strategist, listening to telemetry and answering tactical questions with sub-millisecond local intent parsing and streaming Gemini generation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-2">Example Tactical Questions</h4>
              <ul className="space-y-1.5 text-[var(--text-secondary)] pl-4 list-disc font-mono text-[11px]">
                <li>&ldquo;Who is leading the race?&rdquo;</li>
                <li>&ldquo;What is the gap between P1 and P2?&rdquo;</li>
                <li>&ldquo;What tire compound is Lewis Hamilton running?&rdquo;</li>
                <li>&ldquo;Should we pit under this Safety Car?&rdquo;</li>
                <li>&ldquo;Is DRS currently enabled?&rdquo;</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-2">High-Speed Streaming Architecture</h4>
              <p className="text-[var(--text-muted)] leading-relaxed mb-2">
                Common race queries (Leader, Gaps, Tyres, Weather) are parsed in &lt;2ms by the local intent engine, delivering immediate pit wall responses without roundtrip API latency.
              </p>
              <div className="p-2 rounded bg-white/5 font-mono text-[10px] text-emerald-400">
                ● STATUS: RADIO ONLINE • TELEMETRY SYNCED
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Digital Fan Profile Hub & Check-Ins */}
        <section id="profile" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <User size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-purple-400 uppercase font-bold tracking-wider">Module 05</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Digital Fan Profile Hub, Favorites &amp; Check-In Streaks
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Apexis offers an optional personalized fan tier for users who want to follow favorite drivers, customize telemetry notifications, and log attendance across race weekends.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">My Garage Manager</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Browse and follow drivers across Formula 1, F2, and NASCAR. Manage your roster from <Link href="/profile" className="text-amber-400 underline">/profile</Link> with instant cross-tab synchronization.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Grand Prix Check-Ins</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Click <strong>&ldquo;Check In for this Race&rdquo;</strong> in the Paddock Fan HQ bar on race day. Build attendance streaks and unlock Fan Accreditations (e.g. <em>Tifosi Vanguard</em>, <em>Pole Sitter</em>).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Instant Paddock Pass (VIP Demo)</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Try the full authenticated experience with 1 click on the <Link href="/login" className="text-amber-400 underline">/login</Link> screen—no email confirmation or password required.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Strategy Sandbox & ML Models */}
        <section id="strategy" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)]">
              <Sliders size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--amber)] uppercase font-bold tracking-wider">Module 06</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Strategy Sandbox &amp; Machine Learning Models
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Simulate alternate pit stop strategies and explore predictive machine learning forecasts trained on historical race telemetry.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Interactive Pit Window Slider</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                Adjust the pit stop lap slider (Lap 1 to Lap 40) and toggle between Soft, Medium, and Hard tires to view projected time loss versus clean track undercut advantages.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <h4 className="font-bold text-white mb-1.5">Podium Probability Bands</h4>
              <p className="text-[var(--text-muted)] leading-relaxed m-0">
                View trained neural network outputs predicting podium odds based on current race position, tire delta, and safety car probability. Inspect model metrics at <Link href="/models" className="text-amber-400 underline">/models</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Multi-Series Grid */}
        <section id="series" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Flag size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-indigo-400 uppercase font-bold tracking-wider">Module 07</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Multi-Series Ecosystem
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Apexis supports a unified telemetry interface across major worldwide racing categories:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { name: 'Formula 1', code: 'F1', href: '/dashboard/f1' },
              { name: 'Formula 2', code: 'F2', href: '/dashboard/f2' },
              { name: 'Formula 3', code: 'F3', href: '/dashboard/f3' },
              { name: 'Formula E', code: 'FE', href: '/dashboard/formula-e' },
              { name: 'NASCAR Cup', code: 'CUP', href: '/dashboard/nascar-cup' },
              { name: 'NASCAR Xfinity', code: 'XFIN', href: '/dashboard/nascar-xfinity' },
              { name: 'NASCAR Truck', code: 'TRK', href: '/dashboard/nascar-truck' },
              { name: 'IndyCar', code: 'INDY', href: '/dashboard/indycar' },
              { name: 'WEC', code: 'WEC', href: '/dashboard/wec' },
              { name: 'IMSA', code: 'IMSA', href: '/dashboard/imsa' },
              { name: 'MotoGP', code: 'MOTO', href: '/dashboard/motogp' },
              { name: 'Top Fuel Drag', code: 'TF', href: '/dashboard/top-fuel' },
            ].map((s) => (
              <Link
                key={s.code}
                href={s.href}
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition-colors no-underline flex items-center justify-between text-white"
              >
                <span className="font-sans font-semibold text-xs">{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-amber-300 font-bold">{s.code}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 8: Keyboard Shortcuts & Tips */}
        <section id="hotkeys" className="scroll-mt-24 card glass p-8 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Keyboard size={18} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Module 08</span>
              <h2 className="text-2xl font-extrabold text-white font-[family-name:var(--font-disp)] uppercase tracking-tight m-0">
                Keyboard Shortcuts &amp; Power User Tips
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[var(--text-muted)] uppercase">
                  <th className="py-2.5 px-3">Key</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[var(--text-secondary)]">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white"><kbd className="bg-white/10 px-2 py-0.5 rounded">Space</kbd></td>
                  <td className="py-2.5 px-3">Play / Pause Race Replay</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">Circuit Map</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white"><kbd className="bg-white/10 px-2 py-0.5 rounded">S</kbd></td>
                  <td className="py-2.5 px-3">Toggle Standings Dock (Widescreen)</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">Circuit Map</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white"><kbd className="bg-white/10 px-2 py-0.5 rounded">M</kbd></td>
                  <td className="py-2.5 px-3">Mute / Unmute Pit Radio SFX</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">Global</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white"><kbd className="bg-white/10 px-2 py-0.5 rounded">Esc</kbd></td>
                  <td className="py-2.5 px-3">Dismiss Driver HUD or Suggestions Modal</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">Modals / HUD</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-white"><kbd className="bg-white/10 px-2 py-0.5 rounded">&larr;</kbd> / <kbd className="bg-white/10 px-2 py-0.5 rounded">&rarr;</kbd></td>
                  <td className="py-2.5 px-3">Step 10 Frames Backward / Forward</td>
                  <td className="py-2.5 px-3 text-[var(--text-muted)]">Replay Controls</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Suggestions Call To Action Banner */}
        <section className="card glass rounded-[var(--radius-xl)] p-8 text-center bg-gradient-to-b from-white/[0.04] to-transparent border border-amber-500/20">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[var(--amber)] mx-auto mb-3">
            <MessageSquarePlus size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 font-[family-name:var(--font-disp)] uppercase tracking-tight">
            Have a Feature Idea or Telemetry Request?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-[540px] mx-auto mb-6 leading-relaxed">
            Apexis is continuously evolving. Let us know which features, tracks, series, or UI enhancements you&apos;d love to see. Suggestions are dispatched directly to engineering at <strong>haresham2006@gmail.com</strong>.
          </p>
          <button
            onClick={openSuggestionsModal}
            className="btn-primary text-xs px-6 py-3 cursor-pointer font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <MessageSquarePlus size={15} />
            <span>Open Suggestions Box</span>
          </button>
        </section>

      </div>
    </main>
  );
}
