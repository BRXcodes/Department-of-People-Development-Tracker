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
| 5 | `05_rebuild_brandon_out.sql` | **Supersedes 01–04.** Full rebuild after Brandon went out Tue–Fri (Boise franchise). Adds the daily "Plan Morning Meeting Training" tasks. Idempotent UPSERT — running just this file produces the final state below. |

> **If starting fresh, run only `05_rebuild_brandon_out.sql`.** It is idempotent
> (UPSERT by id) and sets the complete final state on its own. Files 01–04 are
> kept for history and reflect earlier iterations.

## Final schedule (after 05)

Brandon is at the Boise franchise Tue–Fri and cannot run scenarios those days;
he is available Mon (whiteboards) and Sat. Working days come from the SLC
schedule (Brandon's SLC row ignored).

### Scenarios (coach 1 & coach 2)

- Wed 9/2 — Phelix Figueroa · Morning Meeting · David & Braxton
- Wed 9/2 — Imged Alatabi · BTL 3.3 · Brayden & Miguel
- Thu 9/3 — Michael Burton · Morning Meeting · Brayden & Miguel
- Thu 9/3 — Micheal Partain · Scenario 3.3 · David & Miguel
- Sat 9/5 — Daniel Archuleta · BTL 3.3 · Brayden & Brandon
- Sat 9/5 — Miguel Fuentes · Morning Meeting · David & Braxton

### Plan Morning Meeting Training (daily, Mon–Sat)

Holder must work that day and not be on a BTL 3.3 / 3.3 that day.

- Mon 8/31 · Brayden
- Tue 9/1 · Miguel
- Wed 9/2 · Braxton
- Thu 9/3 · Braxton
- Fri 9/4 · David
- Sat 9/5 · Braxton

### Whiteboards

- Brandon · Mon 8/31
- Braxton · Tue–Sat 9/1–9/5

Friday Raffle BTL is shown automatically by the app (not seeded).

**Combined load (scenario coaching + planning):** David 4, Brayden 4,
Miguel 4, Braxton 5 (2 scenarios + 3 planning), Brandon 1.

To roll everything back, run the UNDO block in `05_rebuild_brandon_out.sql`.
