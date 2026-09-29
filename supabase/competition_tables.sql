-- Competition tables
-- Two teams compete; each member logs per-person metrics.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS competition_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slot INTEGER NOT NULL,              -- 1 = Team A (left), 2 = Team B (right)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES competition_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  job_count INTEGER NOT NULL DEFAULT 0,      -- total jobs (used for team balancing)
  resi_ajs NUMERIC NOT NULL DEFAULT 0,       -- residential average job size ($)
  revenue NUMERIC NOT NULL DEFAULT 0,        -- revenue ($)
  nps NUMERIC NOT NULL DEFAULT 0,            -- NPS score (per person)
  google_reviews INTEGER NOT NULL DEFAULT 0, -- count
  cancels INTEGER NOT NULL DEFAULT 0,        -- count (lower is better)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competition_members_team ON competition_members(team_id);

-- Enable RLS
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_members ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for competition_teams" ON competition_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for competition_members" ON competition_members FOR ALL USING (true) WITH CHECK (true);

-- If the table already existed before job_count was added, run this once:
ALTER TABLE competition_members ADD COLUMN IF NOT EXISTS job_count INTEGER NOT NULL DEFAULT 0;

-- Seed the two default teams (safe to re-run: only inserts if slot is missing)
INSERT INTO competition_teams (id, name, slot)
SELECT 'comp_team_a', 'Team A', 1
WHERE NOT EXISTS (SELECT 1 FROM competition_teams WHERE slot = 1);

INSERT INTO competition_teams (id, name, slot)
SELECT 'comp_team_b', 'Team B', 2
WHERE NOT EXISTS (SELECT 1 FROM competition_teams WHERE slot = 2);
