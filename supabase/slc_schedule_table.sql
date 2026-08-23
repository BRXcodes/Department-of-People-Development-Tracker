-- SLC Calendar schedule table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS slc_schedule (
  id TEXT PRIMARY KEY,
  week_start DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE slc_schedule ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key
CREATE POLICY "Allow all for slc_schedule" ON slc_schedule FOR ALL USING (true) WITH CHECK (true);
