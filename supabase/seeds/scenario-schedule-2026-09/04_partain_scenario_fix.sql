-- ============================================================================
-- FOLLOW-UP #3 (final): change Micheal Partain's Thu 9/3 scenario
--   from "BTL 3.3" to the regular "3.3" scenario.
-- ----------------------------------------------------------------------------
-- Run AFTER the previous seeds. Updates the schedule row and both coach tasks
-- (Brandon 1st + David 2nd). Reversible via the UNDO block below.
--
-- Note: the app labels scenario "3.3" as "Scenario 3.3" (only BTL 3.3 /
-- Raffle BTL / Morning Meeting are shown verbatim), so task text is updated
-- to match.
-- ============================================================================

-- Schedule row: scenario BTL 3.3 -> 3.3
UPDATE scenario_schedule
SET scenario = '3.3'
WHERE id = 'sched_20260903_michaelp';

-- Coach tasks (Brandon = 1st, David = 2nd) -> relabel to Scenario 3.3
UPDATE tasks
SET name = 'Scenario 3.3 — Micheal Partain',
    description = 'Run Scenario 3.3 with Micheal Partain'
WHERE id IN ('task_20260903_michaelp', 'task2_20260903_michaelp');


-- ============================================================================
-- VERIFY (optional):
--
--   SELECT date, scenario FROM scenario_schedule WHERE id = 'sched_20260903_michaelp';
--   SELECT id, name FROM tasks WHERE id IN ('task_20260903_michaelp','task2_20260903_michaelp');
-- ============================================================================


-- ============================================================================
-- UNDO — reverts this change back to BTL 3.3:
--
--   UPDATE scenario_schedule SET scenario = 'BTL 3.3' WHERE id = 'sched_20260903_michaelp';
--   UPDATE tasks
--     SET name = 'BTL 3.3 — Micheal Partain', description = 'Run BTL 3.3 with Micheal Partain'
--     WHERE id IN ('task_20260903_michaelp','task2_20260903_michaelp');
-- ============================================================================
