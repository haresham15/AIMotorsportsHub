# Next Steps After Running SQL Setup

Great! You've successfully run the SQL script. Here's what to do next:

## Step 1: Enable Real-Time Replication (Required for Live Updates)

1. In your Supabase dashboard, go to **Database** → **Replication** (in the left sidebar)
2. Find the `mock_live_race_data` table in the list
3. Toggle the switch to **enable** real-time for this table
4. This allows the dashboard to receive live updates when race data changes

## Step 2: Set Up Authentication Providers

1. In Supabase, go to **Authentication** → **Providers** (in the left sidebar)
2. Enable **Email** provider:
   - Toggle "Enable Email provider" to ON
   - You can leave the default settings
3. (Optional) Enable **Google** provider:
   - Toggle "Enable Google provider" to ON
   - You'll need to add OAuth credentials (can skip for now if you just want email/password)

## Step 3: Get Your Supabase API Keys

1. In Supabase, go to **Project Settings** (gear icon in left sidebar) → **API**
2. You'll need three values:
   - **Project URL**: Copy this → you'll use it as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key: Copy this → you'll use it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key: Copy this → you'll use it as `SUPABASE_SERVICE_KEY`
     - ⚠️ **Important**: The service_role key is secret - don't share it publicly!

## Step 4: Get Google Gemini API Key (For AI Features)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key → you'll use it as `GEMINI_API_KEY`
5. (Optional) You can restrict the key to specific APIs if you want extra security

## Step 5: Create Environment Variables File

1. In your project root directory, create a file named `.env.local`
2. Copy the template below and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

## Step 6: Install Dependencies and Run the App

1. Open a terminal in your project directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to: [http://localhost:3000](http://localhost:3000)

## Step 7: Test the Application

1. You should see the login page
2. Click "Sign up" to create a new account (or use Google if you enabled it)
3. After logging in, you'll see the main dashboard with all racing series
4. Click on any series (e.g., "Formula 1") to see the sport-specific dashboard

## Step 8: (Optional) Test Live Race Data

To see the real-time features in action:

1. Open a new terminal window
2. Make sure your `.env.local` file has the Supabase credentials
3. Run the mock data generator:
   ```bash
   python scripts/generate_mock_data.py
   ```
4. Go back to your browser and navigate to the F1 dashboard
5. You should see the race standings update in real-time!

## Troubleshooting

### "No race data available" message
- This is normal if you haven't run the mock data generator yet
- The SQL script includes sample data, but you can also manually add more in Supabase

### Real-time updates not working
- Make sure you enabled real-time replication in Step 1
- Check that your `.env.local` file has the correct Supabase URL and keys

### Can't log in
- Make sure you enabled Email provider in Step 2
- Try creating a new account with email/password

### AI features not working
- Check that `GEMINI_API_KEY` is set correctly in `.env.local`
- Make sure you've restarted the dev server after adding environment variables

## What's Next?

Once everything is working:
- Explore the different racing series dashboards
- Try the AI chatbot on any sport dashboard
- Add more drivers/teams to your database
- Customize the UI to your liking

Need help? Check the main README.md for more detailed information!

