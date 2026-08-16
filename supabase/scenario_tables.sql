-- Scenario Tracker table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS scenario_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT '1',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scenario_members ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for scenario_members" ON scenario_members FOR ALL USING (true) WITH CHECK (true);
