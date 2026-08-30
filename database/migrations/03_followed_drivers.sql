CREATE TABLE IF NOT EXISTS followed_drivers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, series, driver_id)
);

ALTER TABLE followed_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their followed drivers" ON followed_drivers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can follow drivers" ON followed_drivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow drivers" ON followed_drivers
  FOR DELETE USING (auth.uid() = user_id);
