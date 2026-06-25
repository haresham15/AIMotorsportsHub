# The Motorsport Hub

A centralized, personalized web platform for motorsport fans to track their favorite racing series, teams, and drivers across F1, F2, F3, Formula E, NASCAR, and GT World Challenge.

## Features

- **Multi-Series Support**: Track F1, F2, F3, Formula E, NASCAR, and GT World Challenge
- **Personalized Dashboard**: Follow your favorite drivers and teams
- **AI-Powered Summaries**: Get AI-generated news summaries for each racing series
- **Live Race Data**: Real-time standings and 2D race map visualization
- **AI Chatbot**: Ask questions about races and get context-aware answers
- **User Authentication**: Secure login with Supabase Auth (Email/Password and OAuth)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python Serverless Functions (FastAPI) on Vercel
- **Database & Auth**: Supabase (PostgreSQL, Authentication, Real-time)
- **AI**: Google Gemini API

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- A Supabase account (free tier available)
- A Google Gemini API key (free tier available)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following schema:

```sql
-- 1. Racing Series
CREATE TABLE series (
  id TEXT PRIMARY KEY, -- 'f1', 'f2', 'nascar', etc.
  name TEXT NOT NULL
);

-- 2. Teams (simplified)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL
);

-- 3. Drivers (simplified)
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id)
);

-- 4. User preferences (Junction table)
CREATE TABLE user_followed_drivers (
  user_id UUID REFERENCES auth.users(id),
  driver_id UUID REFERENCES drivers(id),
  PRIMARY KEY (user_id, driver_id)
);

-- 5. MOCK DATA - Live Race Simulation
CREATE TABLE mock_live_race_data (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id),
  position INT,
  gap_to_leader TEXT,
  last_lap TEXT,
  tire_compound TEXT -- 'Soft', 'Medium', 'Hard'
);

-- 6. Enable Real-time on the mock data table
ALTER TABLE mock_live_race_data REPLICA IDENTITY FULL;
CREATE PUBLICATION supabase_realtime FOR TABLE mock_live_race_data;
```

3. Go to **Database** → **Replication** and enable "Supabase Realtime" for the `mock_live_race_data` table
4. Go to **Authentication** → **Providers** and enable:
   - Email/Password
   - Google (optional, requires OAuth setup)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Found in Supabase project settings
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Supabase project settings → API
   - `SUPABASE_SERVICE_KEY`: Found in Supabase project settings → API (service_role key)
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Install Python Dependencies (for local development)

```bash
pip install -r api/requirements.txt
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── dashboard/[series]/    # Sport-specific dashboard pages
│   ├── login/                 # Authentication page
│   └── page.tsx               # Main dashboard
├── api/
│   └── ai/
│       ├── summary.py         # AI summary endpoint
│       └── chat.py            # AI chat endpoint
├── components/
│   └── dashboard/
│       ├── AiSummary.tsx      # AI news summary component
│       ├── MySupported.tsx   # User's followed drivers
│       ├── LiveStandings.tsx  # Real-time race standings
│       ├── LiveMap2D.tsx      # 2D race map visualization
│       ├── Chatbot.tsx        # AI chatbot interface
│       └── WhereToWatch.tsx   # Watch links component
├── lib/
│   └── supabaseClient.ts      # Supabase client configuration
└── vercel.json                # Vercel deployment configuration
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

The Python serverless functions will automatically be deployed and configured.

## Mock Data Setup

The `supabase-setup.sql` file includes sample data. After running it, you can:

1. **Manual Updates**: Update the `mock_live_race_data` table directly in Supabase
2. **Python Script**: Use the provided script to simulate a live race:

```bash
# Make sure your .env.local has Supabase credentials
python scripts/generate_mock_data.py
```

The script will update driver positions, lap times, and tire compounds. The real-time subscriptions will automatically update the UI when this data changes.

To run continuous simulation (updates every 3 seconds), uncomment the loop in `scripts/generate_mock_data.py`.

## Features in Detail

### Main Dashboard
- Overview of all supported racing series
- Quick AI summaries for each series
- Navigation to sport-specific dashboards

### Sport-Specific Dashboard
- **AI News Summary**: Current events and upcoming races
- **My Supported**: Your followed drivers and their standings
- **Race Results**: Live standings with real-time updates
- **2D Live Race Map**: Visual representation of driver positions
- **Where to Watch**: Links to official broadcasters
- **AI Chatbot**: Ask questions about the race or series

## Future Enhancements (V2.0)

- Push notifications for race events
- Historical data and statistics
- Unified calendar across all series
- Additional racing series (IndyCar, WEC, WRC, MotoGP)
- Social features (comments, forums, live chat)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
