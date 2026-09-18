-- ============================================================================
-- People Development weekly schedule — week of Sep 21-26, 2026 (Mon-Sat)
-- ----------------------------------------------------------------------------
-- SAFE TO RUN: INSERT/UPSERT only, keyed by fixed ids. Re-running converges to
-- the same state. Reversible via the UNDO block at the bottom.
--
-- Coached people:
--   Alejandro Velazquez-Galeas -> matched by name ILIKE '%velazquez%'
--   Micheal Partain            -> id lgmn59gr (confirmed)
--   Dusty Schlund              -> matched by name ILIKE '%schlund%'
--
-- Coach ids (People Development / members table):
--   Mike (Michael Burton) = 7n0gimoo
--   Brandon = hj32jih2, Braxton = yvo8wd7a, Brayden = pkxedbgm, David = bn4cydke
--
-- Scenarios (scenario_schedule + 2 coach tasks each: assignee + assist):
--   Mon 9/21  Alejandro   Scenario 1  Brayden (solo)
--   Tue 9/22  Partain     3.3         Braxton + Brandon (assist)
--   Wed 9/23  Dusty       3.2         Braxton + David (assist)
--   Thu 9/24  Partain     3.3         Braxton (solo)
--   Sat 9/26  Alejandro   Scenario 1  Brandon + Mike (assist)
--
-- Standalone tasks:
--   Mon  Mike: Whiteboards, Morning Meeting
--   Tue  Braxton: Whiteboards | Brandon: Meeting
--   Wed  Braxton: Whiteboards | David: Meeting
--   Thu  Braxton: Work on Next Week's Schedule | Mike: Whiteboards, Meeting
--   Fri  Braxton: Whiteboards | BOLT (all 5 coaches)
--   Sat  Mike: Whiteboards | Brandon: Meeting
--
-- Friday Raffle BTL is shown automatically by the app (not seeded).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Scenario schedule rows
--    scenario_schedule(id, member_id, scenario, date, assignee_id, assignee2_id)
-- ----------------------------------------------------------------------------

-- Mon 9/21 Alejandro Scenario 1 -> Brayden (solo)
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260921_alejandro', am.id, '1', DATE '2026-09-21', 'pkxedbgm', NULL
FROM attendance_members am WHERE am.name ILIKE '%velazquez%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET member_id = EXCLUDED.member_id, scenario = EXCLUDED.scenario,
  date = EXCLUDED.date, assignee_id = EXCLUDED.assignee_id, assignee2_id = EXCLUDED.assignee2_id;

-- Tue 9/22 Partain 3.3 -> Braxton + Brandon
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260922_partain', 'lgmn59gr', '3.3', DATE '2026-09-22', 'yvo8wd7a', 'hj32jih2')
ON CONFLICT (id) DO UPDATE SET member_id = EXCLUDED.member_id, scenario = EXCLUDED.scenario,
  date = EXCLUDED.date, assignee_id = EXCLUDED.assignee_id, assignee2_id = EXCLUDED.assignee2_id;

-- Wed 9/23 Dusty 3.2 -> Braxton + David
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260923_dusty', am.id, '3.2', DATE '2026-09-23', 'yvo8wd7a', 'bn4cydke'
FROM attendance_members am WHERE am.name ILIKE '%schlund%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET member_id = EXCLUDED.member_id, scenario = EXCLUDED.scenario,
  date = EXCLUDED.date, assignee_id = EXCLUDED.assignee_id, assignee2_id = EXCLUDED.assignee2_id;

-- Thu 9/24 Partain 3.3 -> Braxton (solo)
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260924_partain', 'lgmn59gr', '3.3', DATE '2026-09-24', 'yvo8wd7a', NULL)
ON CONFLICT (id) DO UPDATE SET member_id = EXCLUDED.member_id, scenario = EXCLUDED.scenario,
  date = EXCLUDED.date, assignee_id = EXCLUDED.assignee_id, assignee2_id = EXCLUDED.assignee2_id;

-- Sat 9/26 Alejandro Scenario 1 -> Brandon + Mike
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260926_alejandro', am.id, '1', DATE '2026-09-26', 'hj32jih2', '7n0gimoo'
FROM attendance_members am WHERE am.name ILIKE '%velazquez%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET member_id = EXCLUDED.member_id, scenario = EXCLUDED.scenario,
  date = EXCLUDED.date, assignee_id = EXCLUDED.assignee_id, assignee2_id = EXCLUDED.assignee2_id;


-- ----------------------------------------------------------------------------
-- 2) Coach tasks for the scenarios (task_* = assignee, task2_* = assist)
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
-- ----------------------------------------------------------------------------

-- Mon 9/21 Alejandro Scenario 1 (Brayden, solo)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260921_alejandro', 'Scenario 1 — ' || am.name, 'Run Scenario 1 with ' || am.name,
  'pkxedbgm', ARRAY['2026-09-21'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%velazquez%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

-- Tue 9/22 Partain 3.3 (Braxton + Brandon assist)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_20260922_partain',  'Scenario 3.3 — Micheal Partain', 'Run Scenario 3.3 with Micheal Partain',            'yvo8wd7a', ARRAY['2026-09-22'], NULL, NULL, NULL),
  ('task2_20260922_partain', 'Scenario 3.3 — Micheal Partain', 'Assist with Scenario 3.3 for Micheal Partain',     'hj32jih2', ARRAY['2026-09-22'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

-- Wed 9/23 Dusty 3.2 (Braxton + David assist)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260923_dusty', 'Scenario 3.2 — ' || am.name, 'Run Scenario 3.2 with ' || am.name,
  'yvo8wd7a', ARRAY['2026-09-23'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%schlund%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task2_20260923_dusty', 'Scenario 3.2 — ' || am.name, 'Assist with Scenario 3.2 for ' || am.name,
  'bn4cydke', ARRAY['2026-09-23'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%schlund%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

-- Thu 9/24 Partain 3.3 (Braxton, solo)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_20260924_partain', 'Scenario 3.3 — Micheal Partain', 'Run Scenario 3.3 with Micheal Partain', 'yvo8wd7a', ARRAY['2026-09-24'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

-- Sat 9/26 Alejandro Scenario 1 (Brandon + Mike assist)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260926_alejandro', 'Scenario 1 — ' || am.name, 'Run Scenario 1 with ' || am.name,
  'hj32jih2', ARRAY['2026-09-26'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%velazquez%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task2_20260926_alejandro', 'Scenario 1 — ' || am.name, 'Assist with Scenario 1 for ' || am.name,
  '7n0gimoo', ARRAY['2026-09-26'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%velazquez%' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;


-- ----------------------------------------------------------------------------
-- 3) Standalone tasks (whiteboards, meetings, schedule, BOLT)
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  -- Monday
  ('task_wb_mike_20260921',      'Whiteboards',      'Run whiteboard sessions.',       '7n0gimoo', ARRAY['2026-09-21'], NULL, NULL, NULL),
  ('task_mm_mike_20260921',      'Morning Meeting',  'Lead the morning meeting.',      '7n0gimoo', ARRAY['2026-09-21'], NULL, NULL, NULL),
  -- Tuesday
  ('task_wb_braxton_20260922',   'Whiteboards',      'Run whiteboard sessions.',       'yvo8wd7a', ARRAY['2026-09-22'], NULL, NULL, NULL),
  ('task_meet_brandon_20260922', 'Meeting',          'Attend meeting.',                'hj32jih2', ARRAY['2026-09-22'], NULL, NULL, NULL),
  -- Wednesday
  ('task_wb_braxton_20260923',   'Whiteboards',      'Run whiteboard sessions.',       'yvo8wd7a', ARRAY['2026-09-23'], NULL, NULL, NULL),
  ('task_meet_david_20260923',   'Meeting',          'Attend meeting.',                'bn4cydke', ARRAY['2026-09-23'], NULL, NULL, NULL),
  -- Thursday
  ('task_sched_braxton_20260924','Work on Next Week''s Schedule', 'Build next week''s schedule.', 'yvo8wd7a', ARRAY['2026-09-24'], NULL, NULL, NULL),
  ('task_wb_mike_20260924',      'Whiteboards',      'Run whiteboard sessions.',       '7n0gimoo', ARRAY['2026-09-24'], NULL, NULL, NULL),
  ('task_meet_mike_20260924',    'Meeting',          'Attend meeting.',                '7n0gimoo', ARRAY['2026-09-24'], NULL, NULL, NULL),
  -- Friday
  ('task_wb_braxton_20260925',   'Whiteboards',      'Run whiteboard sessions.',       'yvo8wd7a', ARRAY['2026-09-25'], NULL, NULL, NULL),
  -- Saturday
  ('task_wb_mike_20260926',      'Whiteboards',      'Run whiteboard sessions.',       '7n0gimoo', ARRAY['2026-09-26'], NULL, NULL, NULL),
  ('task_meet_brandon_20260926', 'Meeting',          'Attend meeting.',                'hj32jih2', ARRAY['2026-09-26'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;

-- Friday BOLT leadership meeting — one task per coach (all 5)
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_bolt_mike_20260925',    'BOLT', 'Weekly Friday leadership meeting.', '7n0gimoo', ARRAY['2026-09-25'], NULL, NULL, NULL),
  ('task_bolt_brandon_20260925', 'BOLT', 'Weekly Friday leadership meeting.', 'hj32jih2', ARRAY['2026-09-25'], NULL, NULL, NULL),
  ('task_bolt_braxton_20260925', 'BOLT', 'Weekly Friday leadership meeting.', 'yvo8wd7a', ARRAY['2026-09-25'], NULL, NULL, NULL),
  ('task_bolt_brayden_20260925', 'BOLT', 'Weekly Friday leadership meeting.', 'pkxedbgm', ARRAY['2026-09-25'], NULL, NULL, NULL),
  ('task_bolt_david_20260925',   'BOLT', 'Weekly Friday leadership meeting.', 'bn4cydke', ARRAY['2026-09-25'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  member_id = EXCLUDED.member_id, days = EXCLUDED.days;


-- ============================================================================
-- VERIFY (optional) — confirm names resolved and everything landed:
--
--   SELECT s.date, s.scenario, coached.name AS coached,
--          c1.name AS run_by, c2.name AS assist
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members c1 ON c1.id = s.assignee_id
--   LEFT JOIN members c2 ON c2.id = s.assignee2_id
--   WHERE s.id LIKE 'sched_202609%' AND s.date BETWEEN DATE '2026-09-21' AND DATE '2026-09-26'
--   ORDER BY s.date;
--
--   SELECT t.id, t.name, m.name AS assigned_to, t.days
--   FROM tasks t LEFT JOIN members m ON m.id = t.member_id
--   WHERE t.days && ARRAY['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25','2026-09-26']
--   ORDER BY t.days, t.name;
--
-- Any NULL "coached" means Alejandro or Dusty didn't match — tell me the exact
-- name and I'll fix that line.
-- ============================================================================


-- ============================================================================
-- UNDO — removes everything this seed added:
--
--   DELETE FROM scenario_schedule WHERE id IN (
--     'sched_20260921_alejandro','sched_20260922_partain','sched_20260923_dusty',
--     'sched_20260924_partain','sched_20260926_alejandro');
--
--   DELETE FROM tasks WHERE id IN (
--     'task_20260921_alejandro',
--     'task_20260922_partain','task2_20260922_partain',
--     'task_20260923_dusty','task2_20260923_dusty',
--     'task_20260924_partain',
--     'task_20260926_alejandro','task2_20260926_alejandro',
--     'task_wb_mike_20260921','task_mm_mike_20260921',
--     'task_wb_braxton_20260922','task_meet_brandon_20260922',
--     'task_wb_braxton_20260923','task_meet_david_20260923',
--     'task_sched_braxton_20260924','task_wb_mike_20260924','task_meet_mike_20260924',
--     'task_wb_braxton_20260925',
--     'task_wb_mike_20260926','task_meet_brandon_20260926',
--     'task_bolt_mike_20260925','task_bolt_brandon_20260925','task_bolt_braxton_20260925',
--     'task_bolt_brayden_20260925','task_bolt_david_20260925');
-- ============================================================================
