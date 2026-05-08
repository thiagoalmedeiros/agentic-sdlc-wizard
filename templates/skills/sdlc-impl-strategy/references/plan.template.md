# Plan: <short initiative title>

## Section 1 — What We Are Doing

1. **<Workstream title>** — <One-sentence outcome description. What changes and why it matters.>

2. **<Workstream title>** — <One-sentence outcome description.>

3. **<Workstream title>** — <One-sentence outcome description.>

4. **Continuous lessons capture** — Lessons are automatically logged to `lessons.md` after every user correction and every agent mistake discovered during execution — without being asked.

---

## Section 2 — How We Are Doing It / What Is Out of Scope

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

| #   | Item | File/Area | Status |
| --- | ---- | --------- | ------ |
| 1   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 2   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 3   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 4   | `<Work item>` | `<path/or/feature>` | ⬜ |

**Verify:** `<command>` → <what passing looks like; no regressions in related suite.>

---

### Batch 2 — <Short batch description>

| #   | Item | File/Area | Status |
| --- | ---- | --------- | ------ |
| 1   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 2   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 3   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 4   | `<Work item>` | `<path/or/feature>` | ⬜ |

**Verify:** <Manual or automated check — describe what to inspect and what outcome confirms success.>

---

### Batch 3 — <Short batch description>

| #   | Item | File/Area | Status |
| --- | ---- | --------- | ------ |
| 1   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 2   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 3   | `<Work item>` | `<path/or/feature>` | ⬜ |
| 4   | `<Work item>` | `<path/or/feature>` | ⬜ |

**Verify:** `<command>` → <N> tests all green; `<suite command>` passes.

---

### Batch 4 — Final validation

| #   | Item | File/Area | Status |
| --- | ---- | --------- | ------ |
| 1   | Run `<full test suite command>` — all suites green | repo root | ⬜ |
| 2   | <Manual code review item> | manual code review | ⬜ |
| 3   | <Runtime smoke check or log verification> | `<path/to/file>` | ⬜ |

**Verify:** `<full suite command>` → 0 failures; <observable outcome in logs or output that confirms end-to-end correctness.>
