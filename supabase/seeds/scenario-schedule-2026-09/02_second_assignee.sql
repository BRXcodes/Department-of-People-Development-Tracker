-- ============================================================================
-- FOLLOW-UP: add a second PD coach to each Sep 2-5, 2026 scenario
-- ----------------------------------------------------------------------------
-- Run this AFTER seed_scenario_schedule_2026-09.sql. It:
--   1) UPDATEs the 6 scenario_schedule rows to set assignee2_id (2nd coach)
--   2) INSERTs 6 new coach tasks so the scenario shows on the 2nd coach's
--      dashboard too (mirrors how the app creates a task per assignee)
--
-- Only touches the 6 rows created by the first seed (matched by their fixed
-- ids). The UPDATE sets a column that was previously NULL. Fully reversible
-- via the UNDO block at the bottom.
--
-- Coach ids: Brandon = hj32jih2, Braxton = yvo8wd7a,
--            Brayden = pkxedbgm, David = bn4cydke
--
-- Availability considered:
--   * Braxton on whiteboards Tue-Fri -> not a coach Wed/Thu; free Sat.
--   * Miguel being coached Sat       -> not a coach Sat.
--   * David prioritized for the extra (2nd) sessions.
--
-- Plan (1st -> 2nd):
--   Wed 9/2  Phelix Figueroa   Brandon -> David
--   Wed 9/2  Imged Alatabi     Brayden -> David
--   Thu 9/3  Michael Burton    David   -> Brandon   (David already 1st here)
--   Thu 9/3  Micheal Partain   Brandon -> David
--   Sat 9/5  Daniel Archuleta  Braxton -> David
--   Sat 9/5  Miguel Fuentes    Brayden -> Braxton
--
-- Combined load: David 4, Brandon 3, Brayden 2, Braxton 2.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Set the second assignee on each scenario_schedule row
-- ----------------------------------------------------------------------------
UPDATE scenario_schedule SET assignee2_id = 'bn4cydke' WHERE id = 'sched_20260902_phelix';    -- David
UPDATE scenario_schedule SET assignee2_id = 'bn4cydke' WHERE id = 'sched_20260902_imged';     -- David
UPDATE scenario_schedule SET assignee2_id = 'hj32jih2' WHERE id = 'sched_20260903_michaelb';  -- Brandon
UPDATE scenario_schedule SET assignee2_id = 'bn4cydke' WHERE id = 'sched_20260903_michaelp';  -- David
UPDATE scenario_schedule SET assignee2_id = 'bn4cydke' WHERE id = 'sched_20260905_archuleta'; -- David
UPDATE scenario_schedule SET assignee2_id = 'yvo8wd7a' WHERE id = 'sched_20260905_miguel';    -- Braxton

-- ----------------------------------------------------------------------------
-- 2) Second-coach tasks (so it displays on the 2nd member's dashboard too).
--    Same name/description/day as the first coach's task; distinct ids.
--    tasks(id, name, description, member_id, days, priority, due_date, reminder_time)
-- ----------------------------------------------------------------------------
INSERT INTO tasks (id, name, description, member_id, days, priority, due_date, reminder_time) VALUES
  ('task2_20260902_phelix',    'Morning Meeting — Phelix Figueroa', 'Run Morning Meeting with Phelix Figueroa', 'bn4cydke', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260902_imged',     'BTL 3.3 — Imged Alatabi',           'Run BTL 3.3 with Imged Alatabi',           'bn4cydke', ARRAY['2026-09-02'], NULL, NULL, NULL),
  ('task2_20260903_michaelb',  'Morning Meeting — Michael Burton',  'Run Morning Meeting with Michael Burton',  'hj32jih2', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260903_michaelp',  'BTL 3.3 — Micheal Partain',         'Run BTL 3.3 with Micheal Partain',         'bn4cydke', ARRAY['2026-09-03'], NULL, NULL, NULL),
  ('task2_20260905_archuleta', 'BTL 3.3 — Daniel Archuleta',        'Run BTL 3.3 with Daniel Archuleta',        'bn4cydke', ARRAY['2026-09-05'], NULL, NULL, NULL),
  ('task2_20260905_miguel',    'Morning Meeting — Miguel Fuentes',  'Run Morning Meeting with Miguel Fuentes',  'yvo8wd7a', ARRAY['2026-09-05'], NULL, NULL, NULL);


-- ============================================================================
-- VERIFY (optional) — shows each scenario with both coaches:
--
--   SELECT s.date, s.scenario, coached.name AS coached,
--          c1.name AS run_by_1, c2.name AS run_by_2
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members c1 ON c1.id = s.assignee_id
--   LEFT JOIN members c2 ON c2.id = s.assignee2_id
--   WHERE s.id LIKE 'sched_2026%'
--   ORDER BY s.date, coached.name;
-- ============================================================================


-- ============================================================================
-- UNDO — reverts this follow-up only (clears the 2nd assignee, removes the
-- 2nd-coach tasks). Leaves the original seed intact:
--
--   UPDATE scenario_schedule SET assignee2_id = NULL WHERE id IN (
--     'sched_20260902_phelix','sched_20260902_imged','sched_20260903_michaelb',
--     'sched_20260903_michaelp','sched_20260905_archuleta','sched_20260905_miguel');
--
--   DELETE FROM tasks WHERE id IN (
--     'task2_20260902_phelix','task2_20260902_imged','task2_20260903_michaelb',
--     'task2_20260903_michaelp','task2_20260905_archuleta','task2_20260905_miguel');
-- ============================================================================
