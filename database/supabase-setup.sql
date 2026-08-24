-- Motorsport Hub Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Racing Series
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY, -- 'f1', 'f2', 'nascar', etc.
  name TEXT NOT NULL
);

-- Insert series data
INSERT INTO series (id, name) VALUES
  ('f1', 'Formula 1'),
  ('f2', 'Formula 2'),
  ('f3', 'Formula 3'),
  ('formula-e', 'Formula E'),
  ('nascar', 'NASCAR'),
  ('gt-world-challenge', 'GT World Challenge')
ON CONFLICT (id) DO NOTHING;

-- 2. Teams (simplified)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL
);

-- 3. Drivers (simplified)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id)
);

-- 4. User preferences (Junction table)
CREATE TABLE IF NOT EXISTS user_followed_drivers (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, driver_id)
);

-- 5. MOCK DATA - Live Race Simulation
CREATE TABLE IF NOT EXISTS mock_live_race_data (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  position INT NOT NULL,
  gap_to_leader TEXT,
  last_lap TEXT,
  tire_compound TEXT -- 'Soft', 'Medium', 'Hard'
);

-- 6. Enable Real-time on the mock data table
ALTER TABLE mock_live_race_data REPLICA IDENTITY FULL;

-- Create publication for real-time (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE mock_live_race_data;
  END IF;
END $$;

-- Example: Insert some sample teams and drivers for F1 (you can expand this)
-- First, insert a sample team
INSERT INTO teams (id, series_id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'f1', 'Red Bull Racing')
ON CONFLICT (id) DO NOTHING;

-- Insert sample drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'f1', 'Max Verstappen', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', 'f1', 'Lewis Hamilton', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'f1', 'Charles Leclerc', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample race data (you can update this to simulate a live race)
INSERT INTO mock_live_race_data (driver_id, position, gap_to_leader, last_lap, tire_compound) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, '0.000', '1:23.456', 'Soft'),
  ('00000000-0000-0000-0000-000000000002', 2, '+2.345', '1:23.789', 'Medium'),
  ('00000000-0000-0000-0000-000000000003', 3, '+5.678', '1:24.123', 'Hard')
ON CONFLICT (driver_id) DO UPDATE SET
  position = EXCLUDED.position,
  gap_to_leader = EXCLUDED.gap_to_leader,
  last_lap = EXCLUDED.last_lap,
  tire_compound = EXCLUDED.tire_compound;

