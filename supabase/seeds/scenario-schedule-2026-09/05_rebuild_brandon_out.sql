-- ============================================================================
-- REBUILD (supersedes files 01-04): final schedule, Brandon out Tue-Fri,
-- plus daily "Plan Morning Meeting Training" tasks.
-- ----------------------------------------------------------------------------
-- Brandon is at the Boise franchise Tue-Fri (9/1-9/4) and cannot run scenarios
-- those days (available Mon + Sat). This script sets the FINAL state for the
-- week in one idempotent pass (UPSERT by id) — running just this file is
-- sufficient. Reversible via the UNDO block at the bottom.
--
-- Coach ids:  Brandon = hj32jih2, Braxton = yvo8wd7a,
--             Brayden = pkxedbgm, David = bn4cydke, Miguel = 26gv36sy
-- Coached ids: Phelix Figueroa = w8w01nej, Imged Alatabi = y61il7wr,
--              Michael Burton = phkzloky, Micheal Partain = lgmn59gr,
--              Daniel Archuleta = javh1fnu, Miguel Fuentes = y7r4eg2k
--
-- Working days (from SLC schedule; Brandon's SLC row ignored — he's in Boise):
--   Brandon: Mon, Sat            (out Tue-Fri)
--   Braxton: Tue-Sat  (whiteboards Tue-Sat; off Mon)
--   Brayden: Mon, Wed, Thu, Fri, Sat  (off Tue)
--   David:   Mon, Wed, Thu, Fri, Sat  (off Tue)
--   Miguel:  Tue, Wed, Thu, Fri, Sat  (off Mon; being coached Sat)
--
-- Constraints:
--   * Braxton whiteboards Tue-Sat -> may coach Morning Meeting, NOT BTL 3.3/3.3.
--   * "Plan Morning Meeting Training" runs daily Mon-Sat; the holder must work
--     that day and may NOT also be on a BTL 3.3/3.3 that day.
--   * Miguel is never a coach on his own Sat Morning Meeting.
--
-- Final scenario coaching (1st + 2nd):
--   Wed 9/2  Phelix Figueroa   Morning Meeting  David   + Braxton
--   Wed 9/2  Imged Alatabi     BTL 3.3          Brayden + Miguel
--   Thu 9/3  Michael Burton    Morning Meeting  Brayden + Miguel
--   Thu 9/3  Micheal Partain   3.3              David   + Miguel
--   Sat 9/5  Daniel Archuleta  BTL 3.3          Brayden + Brandon
--   Sat 9/5  Miguel Fuentes    Morning Meeting  David   + Braxton
--
-- Plan Morning Meeting Training (one per day Mon-Sat):
--   Mon 8/31 Brayden | Tue 9/1 Miguel | Wed 9/2 Braxton
--   Thu 9/3 Braxton  | Fri 9/4 David  | Sat 9/5 Braxton
--
-- Combined load (scenario coaching + planning): David 4, Brayden 4, Miguel 4,
--   Braxton 5 (2 scenarios + 3 planning), Brandon 1.
--
-- Friday's Raffle BTL is shown automatically by the app (not seeded).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Scenario schedule rows
--    scenario_schedule(id, member_id, scenario, date, assignee_id, assignee2_id)
-- ----------------------------------------------------------------------------
INSERT INTO scenario_schedule (id, member_id, scenario, date, assignee_id, assignee2_id) VALUES
  ('sched_20260902_phelix',    'w8w01nej', 'Morning Meeting', DATE '2026-09-02', 'bn4cydke', 'yvo8wd7a'), -- David   + Braxton
  ('sched_20260902_imged',     'y61il7wr', 'BTL 3.3',         DATE '2026-09-02', 'pkxedbgm', '26gv36sy'), -- Brayden + Miguel
  ('sched_20260903_michaelb',  'phkzloky', 'Morning Meeting', DATE '2026-09-03', 'pkxedbgm', '26gv36sy'), -- Brayden + Miguel
  ('sched_20260903_michaelp',  'lgmn59gr', '3.3',             DATE '2026-09-03', 'bn4cydke', '26gv36sy'), -- David   + Miguel
  ('sched_20260905_archuleta', 'javh1fnu', 'BTL 3.3',         DATE '2026-09-05', 'pkxedbgm', 'hj32jih2'), -- Brayden + Brandon
  ('sched_20260905_miguel',    'y7r4eg2k', 'Morning Meeting', DATE '2026-09-05', 'bn4cydke', 'yvo8wd7a')  -- David   + Braxton
ON CONFLICT (id) DO UPDATE
  SET member_id    = EXCLUDED.member_id,
      scenario     = EXCLUDED.scenario,
      date         = EXCLUDED.date,
      assignee_id  = EXCLUDED.assignee_id,
      assignee2_id = EXCLUDED.assignee2_id;

-- ----------------------------------------------------------------------------
-- 2) Coach tasks — one per (scenario, coach). task_* = 1st coach, task2_* = 2nd.
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  -- Wed 9/2 Phelix (Morning Meeting): David + Braxton
  ('task_20260902_phelix',  'Morning Meeting — Phelix Figueroa', 'Run Morning Meeting with Phelix Figueroa', 'bn4cydke', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260902_phelix', 'Morning Meeting — Phelix Figueroa', 'Run Morning Meeting with Phelix Figueroa', 'yvo8wd7a', ARRAY['2026-09-02'], NULL, NULL, NULL),
  -- Wed 9/2 Imged (BTL 3.3): Brayden + Miguel
  ('task_20260902_imged',   'BTL 3.3 — Imged Alatabi',           'Run BTL 3.3 with Imged Alatabi',           'pkxedbgm', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260902_imged',  'BTL 3.3 — Imged Alatabi',           'Run BTL 3.3 with Imged Alatabi',           '26gv36sy', ARRAY['2026-09-02'], NULL, NULL, NULL),
  -- Thu 9/3 Michael Burton (Morning Meeting): Brayden + Miguel
  ('task_20260903_michaelb',  'Morning Meeting — Michael Burton', 'Run Morning Meeting with Michael Burton', 'pkxedbgm', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260903_michaelb', 'Morning Meeting — Michael Burton', 'Run Morning Meeting with Michael Burton', '26gv36sy', ARRAY['2026-09-03'], NULL, NULL, NULL),
  -- Thu 9/3 Micheal Partain (3.3): David + Miguel
  ('task_20260903_michaelp',  'Scenario 3.3 — Micheal Partain',  'Run Scenario 3.3 with Micheal Partain',    'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260903_michaelp', 'Scenario 3.3 — Micheal Partain',  'Run Scenario 3.3 with Micheal Partain',    '26gv36sy', ARRAY['2026-09-03'], NULL, NULL, NULL),
  -- Sat 9/5 Daniel Archuleta (BTL 3.3): Brayden + Brandon
  ('task_20260905_archuleta',  'BTL 3.3 — Daniel Archuleta',     'Run BTL 3.3 with Daniel Archuleta',        'pkxedbgm', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task2_20260905_archuleta', 'BTL 3.3 — Daniel Archuleta',     'Run BTL 3.3 with Daniel Archuleta',        'hj32jih2', ARRAY['2026-09-05'], NULL, NULL, NULL),
  -- Sat 9/5 Miguel Fuentes (Morning Meeting): David + Braxton
  ('task_20260905_miguel',  'Morning Meeting — Miguel Fuentes',  'Run Morning Meeting with Miguel Fuentes',  'bn4cydke', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task2_20260905_miguel', 'Morning Meeting — Miguel Fuentes',  'Run Morning Meeting with Miguel Fuentes',  'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      member_id   = EXCLUDED.member_id,
      days        = EXCLUDED.days;

-- ----------------------------------------------------------------------------
-- 3) "Plan Morning Meeting Training" tasks — one per day Mon-Sat
--    Holder must work that day and NOT be on a BTL 3.3/3.3 that day.
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_pmmt_20260831', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', 'pkxedbgm', ARRAY['2026-08-31'], NULL, NULL, NULL), -- Mon Brayden
  ('task_pmmt_20260901', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', '26gv36sy', ARRAY['2026-09-01'], NULL, NULL, NULL), -- Tue Miguel
  ('task_pmmt_20260902', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', 'yvo8wd7a', ARRAY['2026-09-02'], NULL, NULL, NULL), -- Wed Braxton
  ('task_pmmt_20260903', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', 'yvo8wd7a', ARRAY['2026-09-03'], NULL, NULL, NULL), -- Thu Braxton
  ('task_pmmt_20260904', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', 'bn4cydke', ARRAY['2026-09-04'], NULL, NULL, NULL), -- Fri David
  ('task_pmmt_20260905', 'Plan Morning Meeting Training', 'Plan the morning meeting training for the day.', 'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL)  -- Sat Braxton
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      member_id   = EXCLUDED.member_id,
      days        = EXCLUDED.days;

-- ----------------------------------------------------------------------------
-- 4) Whiteboard tasks — Brandon Mon 8/31, Braxton Tue-Sat
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task_wb_brandon_20260831', 'Whiteboards', 'Run whiteboard sessions (every Monday).',     'hj32jih2', ARRAY['2026-08-31'], NULL, NULL, NULL),
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
--   SELECT t.id, t.name, m.name AS assigned_to, t.days
--   FROM tasks t LEFT JOIN members m ON m.id = t.member_id
--   WHERE t.id LIKE 'task_2026%' OR t.id LIKE 'task2_2026%'
--      OR t.id LIKE 'task_pmmt_%' OR t.id LIKE 'task_wb_%'
--   ORDER BY t.id;
-- ============================================================================


-- ============================================================================
-- UNDO — removes the entire week's schedule + all seeded tasks:
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
--     'task_pmmt_20260831','task_pmmt_20260901','task_pmmt_20260902',
--     'task_pmmt_20260903','task_pmmt_20260904','task_pmmt_20260905',
--     'task_wb_brandon_20260831','task_wb_braxton_20260901');
-- ============================================================================
