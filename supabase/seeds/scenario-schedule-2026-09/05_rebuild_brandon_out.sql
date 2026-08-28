-- ============================================================================
-- REBUILD (supersedes files 01-04): final schedule with Brandon out Tue-Fri
-- ----------------------------------------------------------------------------
-- Brandon is at the Boise franchise Tue-Fri (9/1-9/4) and cannot run scenarios
-- those days. He is available Mon (whiteboards) and Sat. This script sets the
-- FINAL correct state for the whole week in one pass.
--
-- Safe to run whether or not files 02-04 were applied: it UPSERTs the schedule
-- rows and coach tasks by their fixed ids, so it converges to the same result.
-- Reversible via the UNDO block at the bottom (removes everything for the week).
--
-- Coach ids: Brandon = hj32jih2, Braxton = yvo8wd7a,
--            Brayden = pkxedbgm, David = bn4cydke, Miguel = 26gv36sy
-- Coached ids: Phelix Figueroa = w8w01nej, Imged Alatabi = y61il7wr,
--              Michael Burton = phkzloky, Micheal Partain = lgmn59gr,
--              Daniel Archuleta = javh1fnu, Miguel Fuentes = y7r4eg2k
--
-- Constraints honored:
--   * Brandon: no scenarios Tue-Fri; may coach Saturday.
--   * Braxton: whiteboards Tue-Sat -> may coach Morning Meeting (no conflict)
--     but NOT BTL 3.3 / 3.3 on those days.
--   * Miguel: not a coach on his own Sat Morning Meeting.
--
-- Final plan (1st + 2nd):
--   Wed 9/2  Phelix Figueroa   Morning Meeting  Brayden + Braxton
--   Wed 9/2  Imged Alatabi     BTL 3.3          David   + Brayden
--   Thu 9/3  Michael Burton    Morning Meeting  David   + Braxton
--   Thu 9/3  Micheal Partain   3.3              Brayden + David
--   Sat 9/5  Daniel Archuleta  BTL 3.3          David   + Brandon
--   Sat 9/5  Miguel Fuentes    Morning Meeting  Brayden + Braxton
--
--   Coach load: David 4, Brayden 4, Braxton 3, Brandon 1, Miguel 0.
--
-- Friday's Raffle BTL is shown automatically by the app (not seeded).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Scenario schedule rows (UPSERT so this works fresh or as a correction)
--    scenario_schedule(id, member_id, scenario, date, assignee_id, assignee2_id)
-- ----------------------------------------------------------------------------
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260902_phelix',    'w8w01nej', 'Morning Meeting', DATE '2026-09-02', 'pkxedbgm', 'yvo8wd7a'), -- Brayden + Braxton
  ('sched_20260902_imged',     'y61il7wr', 'BTL 3.3',         DATE '2026-09-02', 'bn4cydke', 'pkxedbgm'), -- David   + Brayden
  ('sched_20260903_michaelb',  'phkzloky', 'Morning Meeting', DATE '2026-09-03', 'bn4cydke', 'yvo8wd7a'), -- David   + Braxton
  ('sched_20260903_michaelp',  'lgmn59gr', '3.3',             DATE '2026-09-03', 'pkxedbgm', 'bn4cydke'), -- Brayden + David
  ('sched_20260905_archuleta', 'javh1fnu', 'BTL 3.3',         DATE '2026-09-05', 'bn4cydke', 'hj32jih2'), -- David   + Brandon
  ('sched_20260905_miguel',    'y7r4eg2k', 'Morning Meeting', DATE '2026-09-05', 'pkxedbgm', 'yvo8wd7a')  -- Brayden + Braxton
ON CONFLICT (id) DO UPDATE
  SET member_id    = EXCLUDED.member_id,
      scenario     = EXCLUDED.scenario,
      date         = EXCLUDED.date,
      assignee_id  = EXCLUDED.assignee_id,
      assignee2_id = EXCLUDED.assignee2_id;

-- ----------------------------------------------------------------------------
-- 2) Coach tasks — one per (scenario, coach). First-coach ids use task_*,
--    second-coach ids use task2_*. UPSERT keeps them correct on re-run.
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  -- Wed 9/2 Phelix (Morning Meeting): Brayden + Braxton
  ('task_20260902_phelix',  'Morning Meeting — Phelix Figueroa', 'Run Morning Meeting with Phelix Figueroa', 'pkxedbgm', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260902_phelix', 'Morning Meeting — Phelix Figueroa', 'Run Morning Meeting with Phelix Figueroa', 'yvo8wd7a', ARRAY['2026-09-02'], NULL, NULL, NULL),
  -- Wed 9/2 Imged (BTL 3.3): David + Brayden
  ('task_20260902_imged',   'BTL 3.3 — Imged Alatabi',           'Run BTL 3.3 with Imged Alatabi',           'bn4cydke', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260902_imged',  'BTL 3.3 — Imged Alatabi',           'Run BTL 3.3 with Imged Alatabi',           'pkxedbgm', ARRAY['2026-09-02'], NULL, NULL, NULL),
  -- Thu 9/3 Michael Burton (Morning Meeting): David + Braxton
  ('task_20260903_michaelb',  'Morning Meeting — Michael Burton', 'Run Morning Meeting with Michael Burton', 'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260903_michaelb', 'Morning Meeting — Michael Burton', 'Run Morning Meeting with Michael Burton', 'yvo8wd7a', ARRAY['2026-09-03'], NULL, NULL, NULL),
  -- Thu 9/3 Micheal Partain (3.3): Brayden + David
  ('task_20260903_michaelp',  'Scenario 3.3 — Micheal Partain',  'Run Scenario 3.3 with Micheal Partain',    'pkxedbgm', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260903_michaelp', 'Scenario 3.3 — Micheal Partain',  'Run Scenario 3.3 with Micheal Partain',    'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL),
  -- Sat 9/5 Daniel Archuleta (BTL 3.3): David + Brandon
  ('task_20260905_archuleta',  'BTL 3.3 — Daniel Archuleta',     'Run BTL 3.3 with Daniel Archuleta',        'bn4cydke', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task2_20260905_archuleta', 'BTL 3.3 — Daniel Archuleta',     'Run BTL 3.3 with Daniel Archuleta',        'hj32jih2', ARRAY['2026-09-05'], NULL, NULL, NULL),
  -- Sat 9/5 Miguel Fuentes (Morning Meeting): Brayden + Braxton
  ('task_20260905_miguel',  'Morning Meeting — Miguel Fuentes',  'Run Morning Meeting with Miguel Fuentes',  'pkxedbgm', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task2_20260905_miguel', 'Morning Meeting — Miguel Fuentes',  'Run Morning Meeting with Miguel Fuentes',  'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      member_id   = EXCLUDED.member_id,
      days        = EXCLUDED.days;

-- ----------------------------------------------------------------------------
-- 3) Whiteboard tasks — Brandon Mon 8/31 (unaffected), Braxton Tue-Sat
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_wb_brandon_20260831', 'Whiteboards', 'Run whiteboard sessions (every Monday).',   'hj32jih2', ARRAY['2026-08-31'], NULL, NULL, NULL),
  ('task_wb_braxton_20260901', 'Whiteboards', 'Run whiteboard sessions (Tuesday–Saturday).', 'yvo8wd7a', ARRAY['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      member_id   = EXCLUDED.member_id,
      days        = EXCLUDED.days;


-- ============================================================================
-- VERIFY (optional):
--
--   SELECT s.date, s.scenario, coached.name AS coached,
--          c1.name AS run_by_1, c2.name AS run_by_2
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members c1 ON c1.id = s.assignee_id
--   LEFT JOIN members c2 ON c2.id = s.assignee2_id
--   WHERE s.id LIKE 'sched_2026%'
--   ORDER BY s.date, coached.name;
--
--   SELECT id, name, member_id, days FROM tasks
--   WHERE id LIKE 'task_2026%' OR id LIKE 'task2_2026%' OR id LIKE 'task_wb_%'
--   ORDER BY id;
-- ============================================================================


-- ============================================================================
-- UNDO — removes the entire week's schedule + tasks:
--
--   DELETE FROM scenario_schedule WHERE id IN (
--     'sched_20260902_phelix','sched_20260902_imged','sched_20260903_michaelb',
--     'sched_20260903_michaelp','sched_20260905_archuleta','sched_20260905_miguel');
--
--   DELETE FROM tasks WHERE id IN (
--     'task_20260902_phelix','task2_20260902_phelix',
--     'task_20260902_imged','task2_20260902_imged',
--     'task_20260903_michaelb','task2_20260903_michaelb',
--     'task_20260903_michaelp','task2_20260903_michaelp',
--     'task_20260905_archuleta','task2_20260905_archuleta',
--     'task_20260905_miguel','task2_20260905_miguel',
--     'task_wb_brandon_20260831','task_wb_braxton_20260901');
-- ============================================================================
