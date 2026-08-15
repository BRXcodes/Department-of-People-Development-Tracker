-- Attendance tracking tables
-- Run this in your Supabase SQL editor to create the required tables

CREATE TABLE IF NOT EXISTS attendance_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_incidents (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES attendance_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by employee
CREATE INDEX IF NOT EXISTS idx_attendance_incidents_employee ON attendance_incidents(employee_id);

-- Enable RLS (adjust policies as needed for your setup)
ALTER TABLE attendance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_incidents ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as your existing tables)
CREATE POLICY "Allow all for attendance_members" ON attendance_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for attendance_incidents" ON attendance_incidents FOR ALL USING (true) WITH CHECK (true);
