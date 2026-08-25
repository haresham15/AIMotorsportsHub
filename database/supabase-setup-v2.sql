-- ============================================================
-- The Motorsport Hub — Complete Database Schema (V2)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Racing Series
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO series (id, name) VALUES
  ('f1', 'Formula 1'),
  ('f2', 'Formula 2'),
  ('f3', 'Formula 3'),
  ('formula-e', 'Formula E'),
  ('nascar', 'NASCAR'),
  ('gt-world-challenge', 'GT World Challenge'),
  ('top-fuel', 'Top Fuel Dragster')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT REFERENCES series(id),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id)
);

-- User Followed Drivers (Junction)
CREATE TABLE IF NOT EXISTS user_followed_drivers (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, driver_id)
);

-- Live Race Data
CREATE TABLE IF NOT EXISTS mock_live_race_data (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  position INT NOT NULL,
  gap_to_leader TEXT,
  last_lap TEXT,
  tire_compound TEXT
);

-- Enable Real-time on race data
ALTER TABLE mock_live_race_data REPLICA IDENTITY FULL;

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- SEED DATA: TEAMS
-- ============================================================

-- F1 Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'f1', 'Red Bull Racing'),
  ('10000000-0000-0000-0000-000000000002', 'f1', 'Ferrari'),
  ('10000000-0000-0000-0000-000000000003', 'f1', 'Mercedes-AMG Petronas'),
  ('10000000-0000-0000-0000-000000000004', 'f1', 'McLaren'),
  ('10000000-0000-0000-0000-000000000005', 'f1', 'Aston Martin'),
  ('10000000-0000-0000-0000-000000000006', 'f1', 'Alpine'),
  ('10000000-0000-0000-0000-000000000007', 'f1', 'Williams'),
  ('10000000-0000-0000-0000-000000000008', 'f1', 'RB (VCARB)'),
  ('10000000-0000-0000-0000-000000000009', 'f1', 'Sauber'),
  ('10000000-0000-0000-0000-000000000010', 'f1', 'Haas')
ON CONFLICT (id) DO NOTHING;

-- F2 Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('20000000-0000-0000-0000-000000000001', 'f2', 'Prema Racing'),
  ('20000000-0000-0000-0000-000000000002', 'f2', 'ART Grand Prix'),
  ('20000000-0000-0000-0000-000000000003', 'f2', 'Carlin'),
  ('20000000-0000-0000-0000-000000000004', 'f2', 'Hitech Pulse-Eight'),
  ('20000000-0000-0000-0000-000000000005', 'f2', 'MP Motorsport')
ON CONFLICT (id) DO NOTHING;

-- F3 Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('30000000-0000-0000-0000-000000000001', 'f3', 'Prema Racing'),
  ('30000000-0000-0000-0000-000000000002', 'f3', 'Trident'),
  ('30000000-0000-0000-0000-000000000003', 'f3', 'ART Grand Prix'),
  ('30000000-0000-0000-0000-000000000004', 'f3', 'MP Motorsport')
ON CONFLICT (id) DO NOTHING;

-- Formula E Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('40000000-0000-0000-0000-000000000001', 'formula-e', 'Jaguar TCS Racing'),
  ('40000000-0000-0000-0000-000000000002', 'formula-e', 'DS Penske'),
  ('40000000-0000-0000-0000-000000000003', 'formula-e', 'Porsche'),
  ('40000000-0000-0000-0000-000000000004', 'formula-e', 'Nissan'),
  ('40000000-0000-0000-0000-000000000005', 'formula-e', 'Mahindra Racing')
ON CONFLICT (id) DO NOTHING;

-- NASCAR Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('50000000-0000-0000-0000-000000000001', 'nascar', 'Hendrick Motorsports'),
  ('50000000-0000-0000-0000-000000000002', 'nascar', 'Joe Gibbs Racing'),
  ('50000000-0000-0000-0000-000000000003', 'nascar', 'Team Penske'),
  ('50000000-0000-0000-0000-000000000004', 'nascar', 'Stewart-Haas Racing'),
  ('50000000-0000-0000-0000-000000000005', 'nascar', '23XI Racing')
ON CONFLICT (id) DO NOTHING;

-- GT World Challenge Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('60000000-0000-0000-0000-000000000001', 'gt-world-challenge', 'WRT'),
  ('60000000-0000-0000-0000-000000000002', 'gt-world-challenge', 'Iron Lynx'),
  ('60000000-0000-0000-0000-000000000003', 'gt-world-challenge', 'AKKA ASP')
ON CONFLICT (id) DO NOTHING;

-- Top Fuel Teams
INSERT INTO teams (id, series_id, name) VALUES
  ('70000000-0000-0000-0000-000000000001', 'top-fuel', 'John Force Racing'),
  ('70000000-0000-0000-0000-000000000002', 'top-fuel', 'Kalitta Motorsports'),
  ('70000000-0000-0000-0000-000000000003', 'top-fuel', 'Don Schumacher Racing'),
  ('70000000-0000-0000-0000-000000000004', 'top-fuel', 'Brittany Force Racing')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA: DRIVERS
-- ============================================================

-- F1 Drivers (20 drivers)
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('11000000-0000-0000-0000-000000000001', 'f1', 'Max Verstappen', '10000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000002', 'f1', 'Sergio Perez', '10000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000003', 'f1', 'Charles Leclerc', '10000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000004', 'f1', 'Lewis Hamilton', '10000000-0000-0000-0000-000000000002'),
  ('11000000-0000-0000-0000-000000000005', 'f1', 'George Russell', '10000000-0000-0000-0000-000000000003'),
  ('11000000-0000-0000-0000-000000000006', 'f1', 'Andrea Kimi Antonelli', '10000000-0000-0000-0000-000000000003'),
  ('11000000-0000-0000-0000-000000000007', 'f1', 'Lando Norris', '10000000-0000-0000-0000-000000000004'),
  ('11000000-0000-0000-0000-000000000008', 'f1', 'Oscar Piastri', '10000000-0000-0000-0000-000000000004'),
  ('11000000-0000-0000-0000-000000000009', 'f1', 'Fernando Alonso', '10000000-0000-0000-0000-000000000005'),
  ('11000000-0000-0000-0000-000000000010', 'f1', 'Lance Stroll', '10000000-0000-0000-0000-000000000005'),
  ('11000000-0000-0000-0000-000000000011', 'f1', 'Pierre Gasly', '10000000-0000-0000-0000-000000000006'),
  ('11000000-0000-0000-0000-000000000012', 'f1', 'Jack Doohan', '10000000-0000-0000-0000-000000000006'),
  ('11000000-0000-0000-0000-000000000013', 'f1', 'Alex Albon', '10000000-0000-0000-0000-000000000007'),
  ('11000000-0000-0000-0000-000000000014', 'f1', 'Carlos Sainz', '10000000-0000-0000-0000-000000000007'),
  ('11000000-0000-0000-0000-000000000015', 'f1', 'Yuki Tsunoda', '10000000-0000-0000-0000-000000000008'),
  ('11000000-0000-0000-0000-000000000016', 'f1', 'Isack Hadjar', '10000000-0000-0000-0000-000000000008'),
  ('11000000-0000-0000-0000-000000000017', 'f1', 'Nico Hulkenberg', '10000000-0000-0000-0000-000000000009'),
  ('11000000-0000-0000-0000-000000000018', 'f1', 'Gabriel Bortoleto', '10000000-0000-0000-0000-000000000009'),
  ('11000000-0000-0000-0000-000000000019', 'f1', 'Esteban Ocon', '10000000-0000-0000-0000-000000000010'),
  ('11000000-0000-0000-0000-000000000020', 'f1', 'Oliver Bearman', '10000000-0000-0000-0000-000000000010')
ON CONFLICT (id) DO NOTHING;

-- F2 Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('21000000-0000-0000-0000-000000000001', 'f2', 'Kimi Antonelli', '20000000-0000-0000-0000-000000000001'),
  ('21000000-0000-0000-0000-000000000002', 'f2', 'Paul Aron', '20000000-0000-0000-0000-000000000001'),
  ('21000000-0000-0000-0000-000000000003', 'f2', 'Victor Martins', '20000000-0000-0000-0000-000000000002'),
  ('21000000-0000-0000-0000-000000000004', 'f2', 'Jak Crawford', '20000000-0000-0000-0000-000000000003'),
  ('21000000-0000-0000-0000-000000000005', 'f2', 'Isack Hadjar', '20000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- F3 Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('31000000-0000-0000-0000-000000000001', 'f3', 'Leonardo Fornaroli', '30000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000002', 'f3', 'Dino Beganovic', '30000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000003', 'f3', 'Gabriele Mini', '30000000-0000-0000-0000-000000000002'),
  ('31000000-0000-0000-0000-000000000004', 'f3', 'Luke Browning', '30000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Formula E Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('41000000-0000-0000-0000-000000000001', 'formula-e', 'Mitch Evans', '40000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000002', 'formula-e', 'Nick Cassidy', '40000000-0000-0000-0000-000000000001'),
  ('41000000-0000-0000-0000-000000000003', 'formula-e', 'Jean-Eric Vergne', '40000000-0000-0000-0000-000000000002'),
  ('41000000-0000-0000-0000-000000000004', 'formula-e', 'Stoffel Vandoorne', '40000000-0000-0000-0000-000000000002'),
  ('41000000-0000-0000-0000-000000000005', 'formula-e', 'Pascal Wehrlein', '40000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- NASCAR Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('51000000-0000-0000-0000-000000000001', 'nascar', 'Chase Elliott', '50000000-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000002', 'nascar', 'Kyle Larson', '50000000-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000003', 'nascar', 'William Byron', '50000000-0000-0000-0000-000000000001'),
  ('51000000-0000-0000-0000-000000000004', 'nascar', 'Martin Truex Jr.', '50000000-0000-0000-0000-000000000002'),
  ('51000000-0000-0000-0000-000000000005', 'nascar', 'Denny Hamlin', '50000000-0000-0000-0000-000000000002'),
  ('51000000-0000-0000-0000-000000000006', 'nascar', 'Ryan Blaney', '50000000-0000-0000-0000-000000000003'),
  ('51000000-0000-0000-0000-000000000007', 'nascar', 'Joey Logano', '50000000-0000-0000-0000-000000000003'),
  ('51000000-0000-0000-0000-000000000008', 'nascar', 'Bubba Wallace', '50000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- GT World Challenge Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('61000000-0000-0000-0000-000000000001', 'gt-world-challenge', 'Dries Vanthoor', '60000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000002', 'gt-world-challenge', 'Charles Weerts', '60000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000003', 'gt-world-challenge', 'Davide Rigon', '60000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000004', 'gt-world-challenge', 'Raffaele Marciello', '60000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Top Fuel Drivers
INSERT INTO drivers (id, series_id, name, team_id) VALUES
  ('71000000-0000-0000-0000-000000000001', 'top-fuel', 'Brittany Force', '70000000-0000-0000-0000-000000000004'),
  ('71000000-0000-0000-0000-000000000002', 'top-fuel', 'Doug Kalitta', '70000000-0000-0000-0000-000000000002'),
  ('71000000-0000-0000-0000-000000000003', 'top-fuel', 'Steve Torrence', '70000000-0000-0000-0000-000000000003'),
  ('71000000-0000-0000-0000-000000000004', 'top-fuel', 'Antron Brown', '70000000-0000-0000-0000-000000000003'),
  ('71000000-0000-0000-0000-000000000005', 'top-fuel', 'Tony Schumacher', '70000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED LIVE RACE DATA (F1 example)
-- ============================================================

INSERT INTO mock_live_race_data (driver_id, position, gap_to_leader, last_lap, tire_compound) VALUES
  ('11000000-0000-0000-0000-000000000001', 1, '0.000', '1:23.456', 'Soft'),
  ('11000000-0000-0000-0000-000000000003', 2, '+2.345', '1:23.789', 'Soft'),
  ('11000000-0000-0000-0000-000000000007', 3, '+5.123', '1:23.912', 'Medium'),
  ('11000000-0000-0000-0000-000000000005', 4, '+8.567', '1:24.101', 'Medium'),
  ('11000000-0000-0000-0000-000000000004', 5, '+12.234', '1:24.345', 'Hard'),
  ('11000000-0000-0000-0000-000000000008', 6, '+15.678', '1:24.567', 'Medium'),
  ('11000000-0000-0000-0000-000000000009', 7, '+18.901', '1:24.789', 'Hard'),
  ('11000000-0000-0000-0000-000000000006', 8, '+22.345', '1:25.012', 'Medium'),
  ('11000000-0000-0000-0000-000000000002', 9, '+25.678', '1:25.234', 'Hard'),
  ('11000000-0000-0000-0000-000000000010', 10, '+28.901', '1:25.456', 'Soft')
ON CONFLICT (driver_id) DO UPDATE SET
  position = EXCLUDED.position,
  gap_to_leader = EXCLUDED.gap_to_leader,
  last_lap = EXCLUDED.last_lap,
  tire_compound = EXCLUDED.tire_compound;

-- NASCAR live data
INSERT INTO mock_live_race_data (driver_id, position, gap_to_leader, last_lap, tire_compound) VALUES
  ('51000000-0000-0000-0000-000000000002', 1, '0.000', '0:31.234', 'Standard'),
  ('51000000-0000-0000-0000-000000000001', 2, '+0.456', '0:31.345', 'Standard'),
  ('51000000-0000-0000-0000-000000000006', 3, '+1.234', '0:31.567', 'Standard'),
  ('51000000-0000-0000-0000-000000000005', 4, '+2.345', '0:31.789', 'Standard'),
  ('51000000-0000-0000-0000-000000000007', 5, '+3.456', '0:32.012', 'Standard'),
  ('51000000-0000-0000-0000-000000000003', 6, '+4.567', '0:32.234', 'Standard'),
  ('51000000-0000-0000-0000-000000000004', 7, '+5.678', '0:32.456', 'Standard'),
  ('51000000-0000-0000-0000-000000000008', 8, '+6.789', '0:32.678', 'Standard')
ON CONFLICT (driver_id) DO UPDATE SET
  position = EXCLUDED.position,
  gap_to_leader = EXCLUDED.gap_to_leader,
  last_lap = EXCLUDED.last_lap,
  tire_compound = EXCLUDED.tire_compound;

-- Top Fuel live data
INSERT INTO mock_live_race_data (driver_id, position, gap_to_leader, last_lap, tire_compound) VALUES
  ('71000000-0000-0000-0000-000000000001', 1, '0.000', '3.689', 'Slick'),
  ('71000000-0000-0000-0000-000000000002', 2, '+0.034', '3.723', 'Slick'),
  ('71000000-0000-0000-0000-000000000003', 3, '+0.078', '3.767', 'Slick'),
  ('71000000-0000-0000-0000-000000000004', 4, '+0.156', '3.845', 'Slick'),
  ('71000000-0000-0000-0000-000000000005', 5, '+0.212', '3.901', 'Slick')
ON CONFLICT (driver_id) DO UPDATE SET
  position = EXCLUDED.position,
  gap_to_leader = EXCLUDED.gap_to_leader,
  last_lap = EXCLUDED.last_lap,
  tire_compound = EXCLUDED.tire_compound;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followed_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_live_race_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "Public read for series" ON series;
DROP POLICY IF EXISTS "Public read for teams" ON teams;
DROP POLICY IF EXISTS "Public read for drivers" ON drivers;
DROP POLICY IF EXISTS "Users can read own followed drivers" ON user_followed_drivers;
DROP POLICY IF EXISTS "Users can insert own followed drivers" ON user_followed_drivers;
DROP POLICY IF EXISTS "Users can delete own followed drivers" ON user_followed_drivers;
DROP POLICY IF EXISTS "Public read for race data" ON mock_live_race_data;

-- Public read policies
CREATE POLICY "Public read for series" ON series FOR SELECT USING (true);
CREATE POLICY "Public read for teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read for drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY "Public read for race data" ON mock_live_race_data FOR SELECT USING (true);

-- User-specific policies for followed drivers
CREATE POLICY "Users can read own followed drivers" ON user_followed_drivers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own followed drivers" ON user_followed_drivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own followed drivers" ON user_followed_drivers
  FOR DELETE USING (auth.uid() = user_id);

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);
