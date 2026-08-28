-- ============================================================================
-- FOLLOW-UP #2: Saturday 9/5/2026 adjustments
-- ----------------------------------------------------------------------------
-- Run AFTER the first two seeds. Changes only Saturday items. Reversible via
-- the UNDO block at the bottom.
--
-- Rules clarified:
--   * Braxton does whiteboards Saturday too -> extend his whiteboard task to 9/5.
--   * Whiteboards conflict with BTL 3.3 but NOT with Morning Meeting.
--   * So Braxton stays OFF the BTL 3.3 (Daniel Archuleta) but MAY stay on the
--     Morning Meeting (Miguel Fuentes).
--
-- Resulting Saturday coaching:
--   Daniel Archuleta (BTL 3.3)      -> David (1st) + Miguel (2nd)   [was Braxton + David]
--   Miguel Fuentes  (Morning Mtg)   -> Brayden (1st) + Braxton (2nd) [unchanged]
--
-- Coach ids: Brandon = hj32jih2, Braxton = yvo8wd7a,
--            Brayden = pkxedbgm, David = bn4cydke, Miguel = 26gv36sy
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Extend Braxton's whiteboard task to include Saturday 9/5
-- ----------------------------------------------------------------------------
UPDATE tasks
SET days = ARRAY['2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05']
WHERE id = 'task_wb_braxton_20260901';

-- ----------------------------------------------------------------------------
-- 2) Daniel Archuleta (BTL 3.3): 1st Braxton -> David, 2nd David -> Miguel
-- ----------------------------------------------------------------------------
UPDATE scenario_schedule
SET assignee_id  = 'bn4cydke',   -- David  (was Braxton)
    assignee2_id = '26gv36sy'    -- Miguel (was David)
WHERE id = 'sched_20260905_archuleta';

-- Move the FIRST-coach task from Braxton to David
UPDATE tasks SET member_id = 'bn4cydke' WHERE id = 'task_20260905_archuleta';

-- Move the SECOND-coach task from David to Miguel
UPDATE tasks SET member_id = '26gv36sy' WHERE id = 'task2_20260905_archuleta';

-- (Miguel Fuentes Morning Meeting is unchanged: Brayden + Braxton.)


-- ============================================================================
-- VERIFY (optional):
--
--   SELECT s.date, s.scenario, coached.name AS coached,
--          c1.name AS run_by_1, c2.name AS run_by_2
--   FROM scenario_schedule s
--   LEFT JOIN attendance_members coached ON coached.id = s.member_id
--   LEFT JOIN members c1 ON c1.id = s.assignee_id
--   LEFT JOIN members c2 ON c2.id = s.assignee2_id
--   WHERE s.date = DATE '2026-09-05'
--   ORDER BY coached.name;
--
--   SELECT id, name, member_id, days FROM tasks
--   WHERE id IN ('task_wb_braxton_20260901','task_20260905_archuleta','task2_20260905_archuleta');
-- ============================================================================


-- ============================================================================
-- UNDO — reverts this follow-up #2 back to the state after follow-up #1:
--
--   UPDATE tasks SET days = ARRAY['2026-09-01','2026-09-02','2026-09-03','2026-09-04']
--     WHERE id = 'task_wb_braxton_20260901';
--
--   UPDATE scenario_schedule
--     SET assignee_id = 'yvo8wd7a', assignee2_id = 'bn4cydke'
--     WHERE id = 'sched_20260905_archuleta';
--
--   UPDATE tasks SET member_id = 'yvo8wd7a' WHERE id = 'task_20260905_archuleta';
--   UPDATE tasks SET member_id = 'bn4cydke' WHERE id = 'task2_20260905_archuleta';
-- ============================================================================
