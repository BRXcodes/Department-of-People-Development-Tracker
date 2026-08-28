-- ============================================================================
-- Scenario schedule + whiteboard task seed for the week of Aug 31 – Sep 5, 2026
-- ----------------------------------------------------------------------------
-- SAFE TO RUN: this script only INSERTs rows. It does not update or delete any
-- existing data. If anything looks wrong afterward, the rows can be removed
-- (see the "UNDO" block at the very bottom).
--
-- Coached people are matched by name against attendance_members using ILIKE,
-- so shortened names still resolve. Coach IDs are taken from the People
-- Development roster (members table) and are hardcoded below.
--
-- Assignment plan (scenarios), even across coaches, respecting:
--   * Brandon  -> whiteboards every Monday (here: Mon 8/31)
--   * Braxton  -> whiteboards Tue–Fri (9/1–9/4), so NO scenarios those days
--   * Miguel   -> being coached Sat, so never assigned as a coach here
--
--   Wed 9/2  Phelix  -> Morning Meeting  (run by Brandon)
--   Wed 9/2  Imged   -> BTL 3.3          (run by Brayden)
--   Thu 9/3  Michael B -> Morning Meeting (run by David)
--   Thu 9/3  Michael P -> BTL 3.3         (run by Brandon)
--   Sat 9/5  Daniel Archuleta -> BTL 3.3  (run by Braxton)
--   Sat 9/5  Miguel  -> Morning Meeting   (run by Brayden)
--
--   Coach load: Brandon 2, Brayden 2, David 1, Braxton 1.
--
-- Friday's "Raffle BTL" is shown automatically by the app every Friday and is
-- intentionally NOT inserted here.
-- ============================================================================

-- Coach ids (People Development) from the members table:
--   Brandon = hj32jih2, Braxton = yvo8wd7a, Brayden = pkxedbgm,
--   David   = bn4cydke, Miguel  = 26gv36sy

-- ----------------------------------------------------------------------------
-- 1) Scenario schedule entries
--    scenario_schedule(id, member_id, scenario, date, assignee_id, assignee2_id)
--    member_id  -> the person being coached (attendance_members)
--    assignee_id-> the coach running it (members / People Development)
-- ----------------------------------------------------------------------------

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260902_phelix', am.id, 'Morning Meeting', DATE '2026-09-02', 'hj32jih2', NULL
FROM attendance_members am WHERE am.name ILIKE '%phelix%' LIMIT 1;

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260902_imged', am.id, 'BTL 3.3', DATE '2026-09-02', 'pkxedbgm', NULL
FROM attendance_members am WHERE am.name ILIKE '%imged%' LIMIT 1;

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260903_michaelb', am.id, 'Morning Meeting', DATE '2026-09-03', 'bn4cydke', NULL
FROM attendance_members am WHERE am.name ILIKE '%michael%b%' LIMIT 1;

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260903_michaelp', am.id, 'BTL 3.3', DATE '2026-09-03', 'hj32jih2', NULL
FROM attendance_members am WHERE am.name ILIKE '%michael%p%' LIMIT 1;

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260905_archuleta', am.id, 'BTL 3.3', DATE '2026-09-05', 'yvo8wd7a', NULL
FROM attendance_members am WHERE am.name ILIKE '%archuleta%' LIMIT 1;

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id)
SELECT 'sched_20260905_miguel', am.id, 'Morning Meeting', DATE '2026-09-05', 'pkxedbgm', NULL
FROM attendance_members am WHERE am.name ILIKE '%miguel%' LIMIT 1;


-- ----------------------------------------------------------------------------
-- 2) Coach tasks for each scheduled scenario (mirrors what the app creates when
--    an assignee is selected in the Schedule modal).
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
--    days is a text[] of "YYYY-MM-DD" strings.
-- ----------------------------------------------------------------------------

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260902_phelix',
       'Morning Meeting — ' || am.name,
       'Run Morning Meeting with ' || am.name,
       'hj32jih2', ARRAY['2026-09-02'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%phelix%' LIMIT 1;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260902_imged',
       'BTL 3.3 — ' || am.name,
       'Run BTL 3.3 with ' || am.name,
       'pkxedbgm', ARRAY['2026-09-02'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%imged%' LIMIT 1;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260903_michaelb',
       'Morning Meeting — ' || am.name,
       'Run Morning Meeting with ' || am.name,
       'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%michael%b%' LIMIT 1;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260903_michaelp',
       'BTL 3.3 — ' || am.name,
       'Run BTL 3.3 with ' || am.name,
       'hj32jih2', ARRAY['2026-09-03'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%michael%p%' LIMIT 1;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260905_archuleta',
       'BTL 3.3 — ' || am.name,
       'Run BTL 3.3 with ' || am.name,
       'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%archuleta%' LIMIT 1;

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
SELECT 'task_20260905_miguel',
       'Morning Meeting — ' || am.name,
       'Run Morning Meeting with ' || am.name,
       'pkxedbgm', ARRAY['2026-09-05'], NULL, NULL, NULL
FROM attendance_members am WHERE am.name ILIKE '%miguel%' LIMIT 1;


-- ----------------------------------------------------------------------------
-- 3) Whiteboard exception tasks
--    Brandon -> Whiteboards every Monday (assigned to Mon 8/31/2026)
--    Braxton -> Whiteboards Tue–Fri (9/1, 9/2, 9/3, 9/4)
-- ----------------------------------------------------------------------------

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
VALUES (
  'task_wb_brandon_20260831',
  'Whiteboards',
  'Run whiteboard sessions (every Monday).',
  'hj32jih2',
  ARRAY['2026-08-31'],
  NULL, NULL, NULL
);

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time)
VALUES (
  'task_wb_braxton_20260901',
  'Whiteboards',
  'Run whiteboard sessions (Tuesday–Friday).',
  'yvo8wd7a',
  ARRAY['2026-09-01','2026-09-02','2026-09-03','2026-09-04'],
  NULL, NULL, NULL
);


-- ============================================================================
-- VERIFY (optional) — run after inserting to confirm names resolved correctly:
--
--   SELECT s.date, s.scenario,
--          coached.name  AS coached,
--          coach.name    AS run_by
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members coach ON coach.id = s.assignee_id
--   WHERE s.id LIKE 'sched_2026%'
--   ORDER BY s.date;
--
-- If any "coached" column is NULL, that name didn't match — tell me the exact
-- spelling from the dropdown and I'll fix that one line.
-- ============================================================================


-- ============================================================================
-- UNDO — run this block ONLY if you want to remove everything this script added:
--
--   DELETE FROM scenario_schedule WHERE id IN (
--     'sched_20260902_phelix','sched_20260902_imged',
--     'sched_20260903_michaelb','sched_20260903_michaelp',
--     'sched_20260905_archuleta','sched_20260905_miguel');
--
--   DELETE FROM tasks WHERE id IN (
--     'task_20260902_phelix','task_20260902_imged',
--     'task_20260903_michaelb','task_20260903_michaelp',
--     'task_20260905_archuleta','task_20260905_miguel',
--     'task_wb_brandon_20260831','task_wb_braxton_20260901');
-- ============================================================================
