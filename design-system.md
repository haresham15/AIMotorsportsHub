# Design System: Dual-Register Motorsport Architecture

The single source of truth for Apexis / AIMotorsportsHub UI architecture, typography scale, mathematical OKLCH color relationships, hairline border rules, and data density specifications.

---

## 1. Core Architecture: The Dual-Register Model

Motorsport lives in two distinct realities, and the design system reflects this through a deliberate register shift rather than flattening the entire product into a single tone:

```
┌─────────────────────────────────────────────────────────────┐
│               AIMotorsportsHub Design System                │
├──────────────────────────────┬──────────────────────────────┤
│  REGISTER 1: PADDOCK MAGAZINE │  REGISTER 2: PIT-WALL COCKPIT│
│  (Homepage, History, Stories)│  (Dashboard, Live, Models)   │
├──────────────────────────────┼──────────────────────────────┤
│ • Big Shoulders Display      │ • IBM Plex Sans + JetBrains  │
│ • Generous negative space    │ • Tabular numbers, high data │
│ • Human drama & photo focus  │ • Hairline 1px grid panels   │
│ • Editorial prose rhythm     │ • MoTeC / ATLAS telemetry    │
│ • Rich narrative hierarchy   │ • Real-time status lamps     │
└──────────────────────────────┴──────────────────────────────┘
```

### Register 1: The Paddock Magazine (`/`, `/about`, `/legacy`, `/history`)
- **Tone**: Prestige editorial, cultural heritage, long-form journalism, human drama.
- **Typography**: Big Shoulders Display for scoreboard headers; structured editorial paragraphs (`max-w-prose`, line-height 1.6).
- **Layout**: Asymmetric, generous negative space, high visual breathing room, hero photography.

### Register 2: The Pit-Wall Cockpit (`/dashboard/[series]`, `/history/what-if`, `/models`)
- **Tone**: Real-time engineering tool, MoTeC / McLaren ATLAS telemetry console, high-frequency decision making.
- **Typography**: IBM Plex Sans for technical labels and micro-readouts; JetBrains Mono with `tabular-nums` for speeds, deltas, and car numbers.
- **Layout**: Hairline-divided CSS grid areas, high data density, tabular telemetry rows, live FIA status indicators.

---

## 2. Mathematical OKLCH Color Palette

Defined in Tailwind CSS v4 `@theme` and CSS variables:

### Core Carbon Surfaces & Hairline Borders
- `--canvas-base`: `oklch(0.12 0.01 260)` (`#090b0e`) — Deep matte carbon chassis canvas (glare-free)
- `--surface-console`: `oklch(0.16 0.012 260)` (`#12151a`) — Pit-wall telemetry panel surface
- `--surface-elevated`: `oklch(0.20 0.015 260)` (`#191d24`) — Active/elevated deck, sub-bars, and keycap buttons
- `--surface-subtle`: `oklch(0.14 0.01 260)` (`#0e1116`) — Sunken or recessed track beds
- `--border-hairline`: `oklch(0.28 0.015 260)` (`#222832`) — 1px precision mechanical border
- `--border-subtle`: `oklch(0.22 0.012 260)` (`#1a1f27`) — Table divider hairline
- `--border-active`: `oklch(0.42 0.02 260)` (`#3e4757`) — High-contrast interactive hover/focus state

### Typographic Contrast
- `--text-primary`: `oklch(0.96 0.005 260)` (`#f3f4f6`) — Crisp telemetry readout off-white
- `--text-secondary`: `oklch(0.72 0.015 260)` (`#9da5b4`) — Secondary engineering metadata
- `--text-muted`: `oklch(0.48 0.015 260)` (`#5a6272`) — Technical labels, units, and timestamps

### Telemetry Status & FIA Signal Flags
- `--amber-pit`: `oklch(0.78 0.18 75)` (`#ffb020`) — Pit Lane Amber / Leader Delta / Active Timing Indicator
- `--amber-dim`: `oklch(0.45 0.10 75)` (`#805206`) — Subtle amber border / inactive state
- `--flag-green`: `oklch(0.72 0.20 145)` (`#10b981`) — Session Live / Green Sector Delta / DRS Active
- `--flag-red`: `oklch(0.62 0.24 25)` (`#ef4444`) — Red Flag Stoppage / Delta Lost / Retired Car
- `--flag-purple`: `oklch(0.65 0.24 305)` (`#c084fc`) — Absolute Purple Fastest Sector
- `--flag-blue`: `oklch(0.65 0.18 250)` (`#3b82f6`) — Lapped Traffic / Wet Compound / CV Scan Sync

---

## 3. Typography Hierarchy

- **Display & Headings (`--font-disp`)**: `Big Shoulders Display`, weights `700`, `800`, `900`.
  - Inspired by public scoreboards and circuit timing pylons. Condensed tracking, impactful vertical cadence.
- **Interface & Technical UI (`--font-sans`)**: `IBM Plex Sans`, weights `400`, `500`, `600`, `700`.
  - Engineered for technical specifications and instrumentation. Crisp, readable at micro-sizes, zero startup-cliché quirks.
- **Telemetry & Numbers (`--font-mono`)**: `JetBrains Mono`, weights `500`, `700`.
  - Enforced `tabular-nums` for all telemetry clocks, delta times, car numbers, and standings positions.
- **Prose Bounds**: Limit paragraph width strictly to 65–75 characters (`max-w-prose`), body line-height `1.5`.

---

## 4. Machined Radii Scale (Anti-Bubble)

- **Layout Grids & Timing Towers**: `rounded-none` (0px) — maximum data density, edge-to-edge structural precision.
- **Console Panels & Bezel Frames**: `rounded-xs` (2px) — precision CNC-machined anodized aluminum bezels.
- **Buttons, Toggles & Inputs**: `rounded-sm` (4px) — tangible mechanical keycap feel.
- **Status Badges & Serial Tags**: `rounded-xs` (2px) with uppercase monospace labels (`[PIT]`, `[DRS]`, `[P01]`).
- **Strictly Banned**: Arbitrary `rounded-xl`, `rounded-2xl`, or `rounded-full` cards on structural content.

---

## 5. Interaction & Motion Rules

- Transitions strictly under **200ms** (`transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1)`).
- Hover feedback must be immediate and high-contrast: hairline border shifts from `--border-hairline` to `--border-active`.
- Immediate focus rings without blurry drop-shadow halos.
