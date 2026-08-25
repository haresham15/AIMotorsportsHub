-- 01_fantasy_predictions.sql

CREATE TABLE IF NOT EXISTS fantasy_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  series TEXT NOT NULL,
  round INT NOT NULL,
  p1 TEXT NOT NULL,
  p2 TEXT NOT NULL,
  p3 TEXT NOT NULL,
  score INT,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, series, round)
);

ALTER TABLE fantasy_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for fantasy predictions" ON fantasy_predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions" ON fantasy_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own predictions" ON fantasy_predictions FOR UPDATE USING (true);
