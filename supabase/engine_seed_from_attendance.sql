-- Populate The SLC Engine board from the attendance roster.
-- One-time convenience: copies every attendance_members person into
-- engine_employees (role defaults to CEL; other fields blank).
-- Safe to re-run: skips anyone already on the engine board (by name).
--
-- Run AFTER engine_table.sql has created the engine_employees table.

INSERT INTO engine_employees (id, name, role, can_drive, sort_order)
SELECT
  'eng_' || am.id,          -- deterministic id so re-runs don't duplicate
  am.name,
  'CEL',
  FALSE,
  ROW_NUMBER() OVER (ORDER BY am.name) - 1
FROM attendance_members am
WHERE NOT EXISTS (
  SELECT 1 FROM engine_employees e
  WHERE lower(e.name) = lower(am.name)
);

-- Verify:
--   SELECT name, role FROM engine_employees ORDER BY sort_order;
