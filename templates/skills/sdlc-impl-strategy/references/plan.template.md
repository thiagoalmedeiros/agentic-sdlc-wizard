# Plan: <short initiative title>

## Section 1 — What We Are Doing

1. **<Workstream title>** — <One-sentence outcome description. What changes and why it matters.>

2. **<Workstream title>** — <One-sentence outcome description.>

3. **<Workstream title>** — <One-sentence outcome description.>

4. **Continuous lessons capture** — Lessons are automatically logged to `lessons.md` after every user correction and every agent mistake discovered during execution — without being asked.

---

## Section 2 — How We Are Doing It / What Is Out of Scope

## Execution Config

> This section is read by any executor — standalone agent or `sdlc-council` —
> before starting batch work. Do not skip it.

| Setting | Value |
| ------- | ----- |
| Per-batch verify command | `<command agreed with user>` |
| Global verify command | `<command agreed with user>` |
| Thomas validation | `enabled` / `disabled` |
| Definition of Done | `skill:<name>` / `<inline criteria>` / `none` |

### Execution rules (always active)

1. **Lessons** — Dispatch `sdlc-lessons-learned` in `append` mode immediately after any user correction, any non-obvious failure, or any recurring pattern discovered. Do not wait to be asked. Do not batch multiple lessons into one call.
2. **Status updates** — Every item must be `🔄` before handoff to review. Every item must be `✅` before the next batch starts. Never advance with a `⬜` item in a completed batch.
3. **Verify gate** — After each batch, run the per-batch verify command listed above. If Thomas is enabled, dispatch `sdlc-thomas` as a subagent with the batch's exact `**Verify:**` checklist. Do not mark items `✅` until Thomas returns a WITNESSED PASSING verdict.
4. **Global gate** — After all batches complete, run the global verify command. If Thomas is enabled, dispatch `sdlc-thomas` for a final full-plan validation pass before presenting results to the user.

---

### Implementation checklist

#### `<path/to/primary/file.ext>`
- <Concrete change: method signature, field name, behavior, return value.>
- <Edge-case handling or error path to implement.>

#### `<path/to/secondary/file.ext>`
- <Concrete change.>
- <Data-flow or dependency note that affects sequencing.>

#### `<path/to/test/file_test.ext>`
- Import `<symbol>`.
- Add `<TestClass>` with:
  - `<test_name>` — <what it covers>.
  - `<test_name>` — <what it covers>.

### Validation strategy

Run after each batch:
```
<command to execute the test suite>
```

Or the project-wide shortcut: `<root-level shortcut command>`

### Out of scope

- **<Deferred area>** — <Reason for deferral or dependency that blocks it.>
- **<Unrelated system>** — unrelated to this initiative; no changes.
- **<Infrastructure concern>** — already handled; no changes needed here.

---

## Section 3 — Tracking List

### Batch 1 — <Short batch description>

| #      | Item              | File/Area                    | Status |
| ------ | ----------------- | ---------------------------- | ------ |
| 1      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 2      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 3      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 4      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| Thomas | Verify this batch | `sdlc-thomas` (if enabled)   | ⬜     |

**Verify:** `<command>` → <what passing looks like; no regressions in related suite.>
**Thomas Gate (if enabled):** Dispatch `skill:sdlc-thomas` as a subagent to execute every check in this batch's `Verify` line itself and confirm witnessed passing output. Thomas will also verify that all tracking-list rows for this batch are marked ✅ in `plan.md`. Mark the Thomas row ✅ only after Thomas issues an **APPROVED** verdict. If Thomas returns **NOT APPROVED**, the batch is not complete.

---

### Batch 2 — <Short batch description>

| #      | Item              | File/Area                    | Status |
| ------ | ----------------- | ---------------------------- | ------ |
| 1      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 2      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 3      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 4      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| Thomas | Verify this batch | `sdlc-thomas` (if enabled)   | ⬜     |

**Verify:** <Manual or automated check — describe what to inspect and what outcome confirms success.>
**Thomas Gate (if enabled):** Dispatch `skill:sdlc-thomas` as a subagent to execute every check in this batch's `Verify` line itself and confirm witnessed passing output. Thomas will also verify that all tracking-list rows for this batch are marked ✅ in `plan.md`. Mark the Thomas row ✅ only after Thomas issues an **APPROVED** verdict. If Thomas returns **NOT APPROVED**, the batch is not complete.

---

### Batch 3 — <Short batch description>

| #      | Item              | File/Area                    | Status |
| ------ | ----------------- | ---------------------------- | ------ |
| 1      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 2      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 3      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| 4      | `<Work item>`     | `<path/or/feature>`          | ⬜     |
| Thomas | Verify this batch | `sdlc-thomas` (if enabled)   | ⬜     |

**Verify:** `<command>` → <N> tests all green; `<suite command>` passes.
**Thomas Gate (if enabled):** Dispatch `skill:sdlc-thomas` as a subagent to execute every check in this batch's `Verify` line itself and confirm witnessed passing output. Thomas will also verify that all tracking-list rows for this batch are marked ✅ in `plan.md`. Mark the Thomas row ✅ only after Thomas issues an **APPROVED** verdict. If Thomas returns **NOT APPROVED**, the batch is not complete.

---

### Batch 4 — Final validation

| #      | Item                                               | File/Area                    | Status |
| ------ | -------------------------------------------------- | ---------------------------- | ------ |
| 1      | Run `<full test suite command>` — all suites green | repo root                    | ⬜     |
| 2      | <Manual code review item>                          | manual code review           | ⬜     |
| 3      | <Runtime smoke check or log verification>          | `<path/to/file>`             | ⬜     |
| Thomas | Full plan sign-off                                 | `sdlc-thomas` (if enabled)   | ⬜     |

**Verify:** `<global verify command from Execution Config>` → 0 failures; <observable outcome in logs or output that confirms end-to-end correctness.>
**Thomas Gate (if enabled):** Dispatch `skill:sdlc-thomas` as a subagent for the full-plan validation pass. Thomas re-runs the global verify command, reviews every section of `plan.md` to confirm all rows are ✅, and issues a final **APPROVED** or **NOT APPROVED** verdict for the plan as a whole. The plan is not complete until this verdict is **APPROVED**.
