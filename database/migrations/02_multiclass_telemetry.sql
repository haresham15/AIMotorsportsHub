INSERT INTO series (id, name) VALUES
  ('wec', 'FIA World Endurance Championship'),
  ('elms', 'European Le Mans Series'),
  ('imsa', 'IMSA SportsCar Championship')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS race_sessions (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series(id),
  provider TEXT NOT NULL,
  name TEXT,
  track_name TEXT,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_entries (
  session_id TEXT NOT NULL REFERENCES race_sessions(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  category_code TEXT,
  team_name TEXT,
  manufacturer TEXT,
  current_driver_id TEXT,
  overall_position INT,
  class_position INT,
  laps_completed INT NOT NULL DEFAULT 0,
  stint_duration_ms BIGINT,
  pit_status TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, car_number)
);

CREATE TABLE IF NOT EXISTS telemetry_laps (
  session_id TEXT NOT NULL REFERENCES race_sessions(id) ON DELETE CASCADE,
  car_number TEXT NOT NULL,
  lap_number INT NOT NULL,
  driver_id TEXT,
  category_code TEXT,
  lap_time_ms BIGINT,
  sector_1_ms BIGINT,
  sector_2_ms BIGINT,
  sector_3_ms BIGINT,
  maximum_speed_kph NUMERIC,
  track_limits_count INT,
  completed_at TIMESTAMPTZ,
  raw_payload JSONB,
  PRIMARY KEY (session_id, car_number, lap_number)
);

CREATE INDEX IF NOT EXISTS telemetry_laps_session_lap_idx
  ON telemetry_laps (session_id, lap_number);

ALTER TABLE race_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_laps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for race sessions" ON race_sessions;
CREATE POLICY "Public read for race sessions" ON race_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read for session entries" ON session_entries;
CREATE POLICY "Public read for session entries" ON session_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read for telemetry laps" ON telemetry_laps;
CREATE POLICY "Public read for telemetry laps" ON telemetry_laps FOR SELECT USING (true);
