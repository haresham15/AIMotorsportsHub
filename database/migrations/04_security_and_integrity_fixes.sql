-- ============================================================
-- Migration 04: Security, Tenant Isolation & Schema Integrity Fixes
-- Addresses audit vulnerabilities:
-- 1. Fantasy predictions RLS policy tightening (replaces open USING (true) with auth.uid())
-- 2. Unique constraint and distinct podium check constraint on predictions
-- 3. Profiles table definition with RLS for client user-preference synchronization
-- 4. Automatic updated_at timestamp triggers
-- ============================================================

-- 1. Tighten fantasy_predictions RLS and constraints
DROP POLICY IF EXISTS "Allow user all access" ON fantasy_predictions;
DROP POLICY IF EXISTS "Users can view own predictions" ON fantasy_predictions;
DROP POLICY IF EXISTS "Users can insert own predictions" ON fantasy_predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON fantasy_predictions;

-- Restrict read/write to prediction owner (or public leaderboard reads where user_id matches)
CREATE POLICY "Users can view own predictions" ON fantasy_predictions
  FOR SELECT USING (auth.uid()::text = user_id OR score IS NOT NULL);

CREATE POLICY "Users can insert own predictions" ON fantasy_predictions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own predictions" ON fantasy_predictions
  FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Enforce distinct podium finishers and positive round numbers
ALTER TABLE fantasy_predictions DROP CONSTRAINT IF EXISTS chk_fantasy_distinct_podium;
ALTER TABLE fantasy_predictions ADD CONSTRAINT chk_fantasy_distinct_podium
  CHECK (p1 <> p2 AND p2 <> p3 AND p1 <> p3);

ALTER TABLE fantasy_predictions DROP CONSTRAINT IF EXISTS chk_fantasy_positive_round;
ALTER TABLE fantasy_predictions ADD CONSTRAINT chk_fantasy_positive_round
  CHECK (round > 0);

-- Prevent duplicate predictions per user, series, and race round
ALTER TABLE fantasy_predictions DROP CONSTRAINT IF EXISTS uq_fantasy_user_series_round;
ALTER TABLE fantasy_predictions ADD CONSTRAINT uq_fantasy_user_series_round
  UNIQUE (user_id, series, round);

-- 2. Create missing profiles table for user settings and preferences
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  favorite_driver TEXT,
  favorite_team TEXT,
  favorite_series TEXT DEFAULT 'f1',
  privacy TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for profiles" ON profiles;
CREATE POLICY "Public read for profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Automatic timestamp trigger function
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fantasy_predictions_updated_at ON fantasy_predictions;
CREATE TRIGGER trg_fantasy_predictions_updated_at
  BEFORE UPDATE ON fantasy_predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 4. Server-Side Leaderboard Materialized View
CREATE OR REPLACE VIEW fantasy_leaderboard AS
SELECT 
  user_id,
  username,
  SUM(score)::INT AS total_score,
  COUNT(round)::INT AS rounds_played
FROM fantasy_predictions
WHERE score IS NOT NULL
GROUP BY user_id, username
ORDER BY total_score DESC;
