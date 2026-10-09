-- The SLC Engine — leadership board (top-3 only)
-- One row per employee tracked here. Added/removed manually on the tab.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS engine_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CEL',          -- CEL | CSL | SSL | DOPD | DOO | GM
  last_one_on_one DATE,                       -- date of last 1-on-1 (nullable)
  comments TEXT,                              -- priorities communicated in the 1-on-1
  can_drive BOOLEAN NOT NULL DEFAULT FALSE,   -- DOT checkbox
  strengths TEXT,
  weaknesses TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engine_employees_sort ON engine_employees(sort_order, created_at);

-- Enable RLS
ALTER TABLE engine_employees ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for engine_employees" ON engine_employees FOR ALL USING (true) WITH CHECK (true);
