# Scenario schedule seed — week of Aug 31 – Sep 5, 2026

One-off SQL seeds that populate the scenario schedule and coach tasks for this
week. Run them in the Supabase SQL editor **in numeric order**. Each file is
INSERT/UPDATE only and includes its own VERIFY and UNDO blocks.

| Order | File | What it does |
| ----- | ---- | ------------ |
| 1 | `01_schedule.sql` | Creates the 6 scenario schedule rows (Wed/Thu/Sat) with their first coach, plus the Brandon (Mon) and Braxton (Tue–Fri) whiteboard tasks. |
| 2 | `02_second_assignee.sql` | Adds a second coach to each scenario (David prioritized for extras) and the matching second-coach tasks. |
| 3 | `03_saturday_fix.sql` | Extends Braxton's whiteboards to Saturday; moves Daniel Archuleta's BTL 3.3 to David + Miguel (BTL 3.3 conflicts with whiteboards). |
| 4 | `04_partain_scenario_fix.sql` | Changes Micheal Partain's Thu scenario from BTL 3.3 to regular 3.3. |

## Final schedule (after all four)

- Wed 9/2 — Phelix Figueroa · Morning Meeting · Brandon & David
- Wed 9/2 — Imged Alatabi · BTL 3.3 · Brayden & David
- Thu 9/3 — Michael Burton · Morning Meeting · David & Brandon
- Thu 9/3 — Micheal Partain · Scenario 3.3 · Brandon & David
- Sat 9/5 — Daniel Archuleta · BTL 3.3 · David & Miguel
- Sat 9/5 — Miguel Fuentes · Morning Meeting · Brayden & Braxton
- Whiteboards — Brandon Mon 8/31; Braxton Tue–Sat 9/1–9/5
- Friday Raffle BTL is shown automatically by the app (not seeded)

To roll everything back, run the UNDO blocks in reverse order (4 → 1).
