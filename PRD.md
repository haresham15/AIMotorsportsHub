# Product Requirements Document (PRD): AIMotorsportsHub

## 1. Project Overview
**AIMotorsportsHub** is a centralized, personalized web platform designed for motorsport fans. It aggregates tracking and insights across major racing series including Formula 1, Formula 2, Formula 3, Formula E, NASCAR, and GT World Challenge. The platform combines real-time race data visualization with AI-powered features (like news summaries and an intelligent chatbot) to provide a deeply engaging and unified hub for racing enthusiasts.

## 2. Problem Statement
Motorsport fans who follow multiple disciplines (e.g., F1, NASCAR, Formula E) currently have to juggle multiple apps, websites, and subscription services to keep track of schedules, live timings, and news. There is a lack of a single, unified dashboard that offers personalized tracking of favorite drivers and teams across different racing categories, paired with contextual, AI-driven insights to help fans understand complex race strategies or catch up on missed events.

## 3. Target Audience
- **Hardcore Motorsport Fans**: Users who follow multiple racing series and want deep, real-time analytics and a 2D track map visualization.
- **Casual Viewers**: Users who want to catch up quickly on race weekend events via AI summaries without watching hours of coverage.
- **Data Enthusiasts**: Fans interested in telemetry, tire strategies, gaps to the leader, and predictive insights.

## 4. Key Features (MVP)

### 4.1 Authentication & Personalization
- **User Authentication**: Secure signup/login using Supabase Auth (Email/Password, OAuth).
- **Personalized Dashboard**: Users can "follow" their favorite drivers and teams across different racing series.

### 4.2 Core Application & Dashboards
- **Multi-Series Support**: Dedicated sections for F1, F2, F3, FE, NASCAR, and GTWC.
- **Main Dashboard**: Overview of all series, high-level AI news summaries, and global navigation.
- **Sport-Specific Dashboards**:
  - *My Supported*: Quick view of followed drivers' current standings.
  - *Live Race Results*: Real-time standings, gaps, intervals, and tire compound data.
  - *Where to Watch*: Links to official broadcasters and streaming platforms.

### 4.3 Data Visualization
- **Live 2D Race Map**: Visual representation of driver positions on a circuit, utilizing real track geometry or mock telemetry simulations to recreate the race flow in a browser canvas.
- **Driver Telemetry Panel**: Clickable drivers on the map/leaderboard to view specific metrics.

### 4.4 AI Integrations
- **AI-Powered Summaries**: Google Gemini-driven news summaries providing current events, qualifying recaps, and upcoming race context.
- **Context-Aware AI Chatbot**: An embedded chatbot where users can ask complex questions about the race, drivers, or rules, and get answers grounded in the current context of the sport.

## 5. Future Enhancements (V2.0+)
- **Push Notifications**: Alerts for session starts, red flags, or major incidents.
- **Historical Data & Statistics**: Deep dive into past seasons, driver head-to-heads, and track records.
- **Unified Global Calendar**: A single calendar view consolidating all motorsport events.
- **Additional Series Expansion**: Support for IndyCar, WEC, WRC, and MotoGP.
- **Social Features**: Live chat rooms, forums, and community polls during race sessions.

## 6. Technical Architecture

### 6.1 Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS.
- **Backend / APIs**: Next.js Route Handlers (`app/api/`) and Python Serverless Functions (FastAPI) deployed on Vercel.
- **Database & Auth**: Supabase (PostgreSQL). Leverages Supabase Realtime for pushing live telemetry to clients.
- **AI Provider**: Google Gemini API.

### 6.2 Data Flow & Sources
- **Live Data Ingestion**: Python scripts (`generate_mock_data.py`) or OpenF1 integrations to push telemetry to the Supabase PostgreSQL database.
- **Realtime Sync**: Supabase Realtime broadcasts row-level changes (e.g., driver position updates) to the Next.js frontend via websockets.
- **AI Processing**: Next.js API endpoints interface with the Gemini API to fetch and stream generated summaries and chat responses back to the user interface.

## 7. User Flow
1. **Onboarding**: User lands on the homepage, signs up, and selects their favorite racing series and drivers.
2. **Global View**: User is taken to the main dashboard to see a high-level AI summary of the weekend's motorsport events.
3. **Deep Dive**: User clicks into the "Formula 1" dashboard to view the live 2D track map for an ongoing race.
4. **Interaction**: User selects their favorite driver on the map to view their tire strategy, and asks the AI chatbot "Why did they pit so early?" to get a strategic breakdown.
5. **Post-Race**: User checks the final standings and reads the AI-generated race recap.
