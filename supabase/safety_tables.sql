-- Fleet & Safety points tracker
-- Each unsafe-driving clip = 1 point. 3 points = termination threshold.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS safety_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES safety_members(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_incidents_employee ON safety_incidents(employee_id);

-- Enable RLS
ALTER TABLE safety_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for safety_members" ON safety_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for safety_incidents" ON safety_incidents FOR ALL USING (true) WITH CHECK (true);
