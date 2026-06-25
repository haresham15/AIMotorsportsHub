# Quick Start Guide

Get The Motorsport Hub running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and paste the contents of `supabase-setup.sql`
4. Run the SQL script
5. Go to **Database** → **Replication** and enable real-time for `mock_live_race_data`
6. Go to **Authentication** → **Providers** and enable Email/Password (and Google if desired)

## Step 3: Get API Keys

1. **Supabase**: Go to Project Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_KEY`

2. **Google Gemini**: Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy it → `GEMINI_API_KEY`

## Step 4: Configure Environment

Create `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
```

## Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Test Live Data (Optional)

In a separate terminal, run the mock data generator:

```bash
python scripts/generate_mock_data.py
```

This will update the race data, and you should see real-time updates in the dashboard!

## Troubleshooting

- **"No race data available"**: Make sure you ran `supabase-setup.sql` which includes sample data
- **AI summaries not working**: Check that `GEMINI_API_KEY` is set correctly
- **Real-time not updating**: Verify real-time is enabled in Supabase for `mock_live_race_data` table
- **Login not working**: Check Supabase Auth providers are enabled

## Next Steps

- Customize the dashboard components
- Add more drivers/teams to the database
- Deploy to Vercel for production

Happy racing! 🏁

