-- LOCO — Local Commercial opportunities
-- National CSA sets up opportunities (OP ID, account, appointment, notes);
-- the Local CSA visits each on site and logs what happened.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS loco_opportunities (
  id TEXT PRIMARY KEY,
  op_id TEXT,                               -- Opportunity ID from the national system
  account_name TEXT NOT NULL,
  contact_name TEXT,                        -- on-site contact (national CSA)
  contact_phone TEXT,                       -- contact phone (national CSA)
  appointment_at TIMESTAMPTZ,               -- date + time of the appointment
  national_notes TEXT,                      -- notes from the national CSA
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | visited | not_home | rescheduled | closed
  visit_notes TEXT,                         -- on-site notes from the local CSA
  visited_at TIMESTAMPTZ,                    -- when the local CSA logged the visit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loco_appointment ON loco_opportunities(appointment_at);

-- Enable RLS
ALTER TABLE loco_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for loco_opportunities" ON loco_opportunities FOR ALL USING (true) WITH CHECK (true);

-- If the table already existed before contact fields were added, run these once:
ALTER TABLE loco_opportunities ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE loco_opportunities ADD COLUMN IF NOT EXISTS contact_phone TEXT;
