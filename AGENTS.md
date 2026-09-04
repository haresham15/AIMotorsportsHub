# AIMotorsportsHub - Agent Context & Rules

This file provides critical context, architectural rules, and coding conventions for AI agents working in this repository.

## 1. Tech Stack & Frameworks

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend API**: Next.js Route Handlers (`app/api/*`).
- **Auth & Database**: Supabase (PostgreSQL, Supabase Auth).
- **AI Processing**: Google Gemini API (via Next.js Route Handlers and AWS Lambda).
- **Background Jobs**: AWS Lambda.

## 2. Core Architectural Principles

- **Hybrid Cloud Strategy**: Do not assume all backend logic goes into Next.js.
  - Standard APIs -> Next.js Route Handlers.
  - Python APIs -> Vercel Serverless Functions (`python/` dir).
  - Background/Scheduled Tasks -> AWS Lambda.
  - Asset Storage -> AWS S3.
- **Client-Side Heavy Processing**: To keep serverless compute costs at $0, heavy tasks are pushed to the client:
  - **Simulation**: The `raceSimulator.ts` runs inside Web Workers (`workers/simulator.worker.ts`).
  - **Computer Vision**: Live standings extraction uses `tesseract.js` entirely in the browser. Do not try to move OCR to the server.
- **Guest Access**: Core features (Live Map, Predictors) must remain fully usable for guest users without requiring a Supabase login.

## 3. Data Flow & Integrations

- **Live Data**: F1 telemetry is sourced from the OpenF1 API proxy. When live data is unavailable, the system seamlessly falls back to the local Web Worker simulator or CV scans.
- **Timing Board Physics**: Gap calculations in the `ReplayLeaderboard` must strictly use a fixed average speed (e.g. 200km/h) for converting physical distance deltas into time gaps to prevent UI stuttering in braking zones.

## 4. Coding Conventions

- Use standard Github-flavored Markdown for documentation (`README.md`, `PRD.md`).
- Keep Next.js Route Handlers edge-compatible where possible, but use Node.js runtime if heavy Node APIs are required.
- Do not poll for React state updates inside high-frequency `requestAnimationFrame` loops (throttle UI state syncs to ~10 FPS to prevent main thread blocking).
- All AWS interactions must use least-privilege IAM credentials passed securely via environment variables.

<!-- markdownlint-disable MD025 -->
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
<!-- markdownlint-enable MD025 -->
