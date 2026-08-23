-- Scenario Tracker tables
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS scenario_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT '1',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scenario_schedule (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT '1',
  date DATE NOT NULL,
  assignee_id TEXT,
  assignee2_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_schedule_date ON scenario_schedule(date);

-- Enable RLS
ALTER TABLE scenario_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_schedule ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for scenario_members" ON scenario_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for scenario_schedule" ON scenario_schedule FOR ALL USING (true) WITH CHECK (true);
