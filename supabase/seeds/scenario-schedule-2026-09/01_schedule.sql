-- ============================================================================
-- Scenario schedule + whiteboard task seed for the week of Aug 31 – Sep 5, 2026
-- ----------------------------------------------------------------------------
-- SAFE TO RUN: this script only INSERTs rows. It does not update or delete any
-- existing data. If anything looks wrong afterward, the rows can be removed
-- (see the "UNDO" block at the very bottom).
--
-- Coached people use CONFIRMED attendance_members ids (verified by name lookup).
-- Coach ids come from the People Development roster (members table).
--
-- Confirmed coached ids:
--   Phelix Figueroa   = w8w01nej
--   Imged Alatabi     = y61il7wr
--   Michael Burton    = phkzloky   (the "Michael B" on the list)
--   Daniel Archuleta  = javh1fnu
--   Miguel Fuentes    = y7r4eg2k
--   Micheal Partain   = lgmn59gr   (the "Michael P" on the list; spelled Micheal)
--
-- Coach ids (People Development):
--   Brandon = hj32jih2, Braxton = yvo8wd7a, Brayden = pkxedbgm,
--   David   = bn4cydke, Miguel  = 26gv36sy
--
-- Assignment plan (scenarios), even across coaches, respecting:
--   * Brandon  -> whiteboards every Monday (here: Mon 8/31)
--   * Braxton  -> whiteboards Tue–Fri (9/1–9/4), so NO scenarios those days
--   * Miguel   -> being coached Sat, so never assigned as a coach here
--
--   Wed 9/2  Phelix Figueroa  -> Morning Meeting  (run by Brandon)
--   Wed 9/2  Imged Alatabi    -> BTL 3.3          (run by Brayden)
--   Thu 9/3  Michael Burton   -> Morning Meeting  (run by David)
--   Thu 9/3  Michael Partain  -> BTL 3.3          (run by Brandon)
--   Sat 9/5  Daniel Archuleta -> BTL 3.3          (run by Braxton)
--   Sat 9/5  Miguel Fuentes   -> Morning Meeting  (run by Brayden)
--
--   Coach load: Brandon 2, Brayden 2, David 1, Braxton 1.
--
-- Friday's "Raffle BTL" is shown automatically by the app every Friday and is
-- intentionally NOT inserted here.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Scenario schedule entries
--    scenario_schedule(id, member_id, scenario, date, assignee_id, assignee2_id)
-- ----------------------------------------------------------------------------

INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260902_phelix',    'w8w01nej', 'Morning Meeting', DATE '2026-09-02', 'hj32jih2', NULL),
  ('sched_20260902_imged',     'y61il7wr', 'BTL 3.3',         DATE '2026-09-02', 'pkxedbgm', NULL),
  ('sched_20260903_michaelb',  'phkzloky', 'Morning Meeting', DATE '2026-09-03', 'bn4cydke', NULL),
  ('sched_20260905_archuleta', 'javh1fnu', 'BTL 3.3',         DATE '2026-09-05', 'yvo8wd7a', NULL),
  ('sched_20260905_miguel',    'y7r4eg2k', 'Morning Meeting', DATE '2026-09-05', 'pkxedbgm', NULL);

-- Michael P = "Micheal Partain" (id lgmn59gr; note the first name is spelled Micheal).
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260903_michaelp', 'lgmn59gr', 'BTL 3.3', DATE '2026-09-03', 'hj32jih2', NULL);


-- ----------------------------------------------------------------------------
-- 2) Coach tasks for each scheduled scenario (mirrors what the app creates when
--    an assignee is selected in the Schedule modal).
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
--    days is a text[] of "YYYY-MM-DD" strings.
-- ----------------------------------------------------------------------------

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_20260902_phelix',    'Morning Meeting — Phelix Figueroa',  'Run Morning Meeting with Phelix Figueroa',  'hj32jih2', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task_20260902_imged',     'BTL 3.3 — Imged Alatabi',            'Run BTL 3.3 with Imged Alatabi',            'pkxedbgm', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task_20260903_michaelb',  'Morning Meeting — Michael Burton',   'Run Morning Meeting with Michael Burton',   'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task_20260905_archuleta', 'BTL 3.3 — Daniel Archuleta',         'Run BTL 3.3 with Daniel Archuleta',         'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task_20260905_miguel',    'Morning Meeting — Miguel Fuentes',   'Run Morning Meeting with Miguel Fuentes',   'pkxedbgm', ARRAY['2026-09-05'], NULL, NULL, NULL);

-- Michael P (Micheal Partain) coach task:
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_20260903_michaelp', 'BTL 3.3 — Micheal Partain', 'Run BTL 3.3 with Micheal Partain', 'hj32jih2', ARRAY['2026-09-03'], NULL, NULL, NULL);


-- ----------------------------------------------------------------------------
-- 3) Whiteboard exception tasks
--    Brandon -> Whiteboards every Monday (assigned to Mon 8/31/2026)
--    Braxton -> Whiteboards Tue–Fri (9/1, 9/2, 9/3, 9/4)
-- ----------------------------------------------------------------------------

INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_wb_brandon_20260831', 'Whiteboards', 'Run whiteboard sessions (every Monday).',   'hj32jih2', ARRAY['2026-08-31'], NULL, NULL, NULL),
  ('task_wb_braxton_20260901', 'Whiteboards', 'Run whiteboard sessions (Tuesday–Friday).', 'yvo8wd7a', ARRAY['2026-09-01','2026-09-02','2026-09-03','2026-09-04'], NULL, NULL, NULL);


-- ============================================================================
-- VERIFY (optional) — run after inserting to confirm everything landed:
--
--   SELECT s.date, s.scenario, coached.name AS coached, coach.name AS run_by
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members coach ON coach.id = s.assignee_id
--   WHERE s.id LIKE 'sched_2026%'
--   ORDER BY s.date;
-- ============================================================================


-- ============================================================================
-- UNDO — run this block ONLY if you want to remove everything this script added:
--
--   DELETE FROM scenario_schedule WHERE id IN (
--     'sched_20260902_phelix','sched_20260902_imged','sched_20260903_michaelb',
--     'sched_20260903_michaelp','sched_20260905_archuleta','sched_20260905_miguel');
--
--   DELETE FROM tasks WHERE id IN (
--     'task_20260902_phelix','task_20260902_imged','task_20260903_michaelb',
--     'task_20260903_michaelp','task_20260905_archuleta','task_20260905_miguel',
--     'task_wb_brandon_20260831','task_wb_braxton_20260901');
-- ============================================================================
