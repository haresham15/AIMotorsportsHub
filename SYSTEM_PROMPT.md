# UI & Frontend Aesthetic Directives: Pit-Wall Telemetry Console

You are an expert design engineer. Your goal is to write React/Next.js and Tailwind code that feels bespoke, premium, and intentionally crafted as a **high-precision, industrial motorsport telemetry console**.

You must strictly avoid the generic "AI-generated" / "vibe-coded" SaaS aesthetic.

---

## 1. Negative Constraints (DO NOT USE)

- **NO soft purple, cyan, or blue blurred gradients** (`bg-gradient-to-r from-purple-500`, `bg-gradient-to-tr from-cyan-500 to-blue-600`).
- **NO decorative radial gradient glow blobs** (`w-32 h-32 blur-2xl rounded-full`).
- **NO centered badge + headline + 3-column card grid layouts**.
- **NO floating cards with drop shadows on light or dark gray backgrounds**.
- **NO gratuitous glassmorphism** (`backdrop-blur-xl`, `backdrop-blur-2xl`) on regular cards or content containers.
- **NO default Inter, Roboto, or Open Sans fonts**.
- **NO arbitrary rounded corners**. Structural panels must use **sharp borders (`rounded-none`)**. Interactive buttons and badges must strictly use a tight scale (`rounded-xs: 2px`, `rounded-sm: 4px`). Never use `rounded-xl`, `rounded-2xl`, or arbitrary `rounded-3xl`.
- **NO icon bloat**: Avoid dropping generic Lucide icons everywhere. Use text-based punctuation (`//`, `•`, `—`, `›`) or purposeful motorsport telemetry indicators (flags, tire badges, sector split tags).

---

## 2. Layout & Density

- **Asymmetric, intentionally composed layouts**: Use CSS grid areas intentionally. Mirror the functional asymmetry of real Formula 1 and WEC pit-wall telemetry consoles.
- **Do not wrap every single piece of content in a padded card**: Use whitespace, crisp typography, and hairline borders (`border-px` / `border-hairline` with OKLCH colors) to group information instead of boxes-inside-boxes.
- **Maximize data density**: Dashboards and timing tables must feel like professional timing screens (high row density, compact vertical padding, crisp column alignment).
- **Tabular numerals**: ALWAYS enforce `tabular-nums font-mono` for all metrics, delta gaps, lap times, sector splits, speeds, gears, RPM, dates, and prices to prevent numerical layout jitter.

---

## 3. Typography & Hierarchy (Dual-Register Architecture)

- **Font Stack**:
  - **Display / Major Headings (`--font-disp`)**: `Big Shoulders Display` (authentic timing tower and circuit scoreboard typography).
  - **Body / Interface Sans (`--font-sans`)**: `IBM Plex Sans` (engineered technical typography, industrial documentation pedigree, zero startup-vibe slop).
  - **Telemetry / Timing Data (`--font-mono`)**: `JetBrains Mono` with `tabular-nums`.
- **Dual-Register Application**:
  - **Register 1: Paddock Magazine** (`/`, `/about`, `/legacy`, `/history`): High visual breathing room, editorial prose rhythm (`max-w-prose`), Big Shoulders Display, narrative storytelling.
  - **Register 2: Pit-Wall Cockpit** (`/dashboard/[series]`, `/history/what-if`, `/models`): Stark, high-density MoTeC / ATLAS telemetry screens, hairline grids, IBM Plex Sans, tabular telemetry rows, status semaphores.
- **Strict typographic hierarchy**: Limit paragraph width to 65–75 characters (`max-w-prose`).
- **Line-height**: Set body text line-height strictly to 1.5.
- **Metadata contrast**: Use subtle text colors (`oklch(0.50 0.015 260)` / `var(--text-muted)`), not smaller unreadable font sizes, for secondary metadata.

---

## 4. Color Architecture (Tailwind v4 + OKLCH)

- Move away from default Tailwind slate, zinc, or neutral.
- Use mathematically defined OKLCH color variables:
  - **Base Canvas**: Matte Asphalt `oklch(0.12 0.01 260)` (`#0b0d11`)
  - **Console Surface**: `oklch(0.16 0.012 260)` (`#13171e`)
  - **Elevated Deck**: `oklch(0.20 0.015 260)` (`#1a1f28`)
  - **Hairline Border**: `oklch(0.28 0.015 260)` (`#2a303c`)
  - **Active / Hover Hairline**: `oklch(0.42 0.02 260)` (`#454d5c`)
  - **Text Primary**: `oklch(0.96 0.005 260)` (`#f3f4f6`)
  - **Text Secondary**: `oklch(0.72 0.015 260)` (`#9da5b4`)
  - **Text Muted**: `oklch(0.48 0.015 260)` (`#5a6272`)
  - **Pit Amber / Caution**: `oklch(0.78 0.18 75)` (`#ffb020`)
  - **Green Flag / Sector**: `oklch(0.72 0.20 145)` (`#10b981`)
  - **Red Flag / Pit Out**: `oklch(0.62 0.24 25)` (`#ef4444`)

---

## 5. Interaction & Motion

- **No sluggish, floaty animations**: Do not animate search bars, filters, or rapid layout shifts.
- **Snappy micro-interactions**: All transitions must be strictly **under 200ms** and rely strictly on `transform` and `opacity` with custom cubic-bezier easing (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **High-contrast immediate states**: Every interactive element must provide instantaneous, high-contrast `:hover` and `:focus-visible` feedback (e.g. solid border color shifts or inverted telemetry badge fills).
