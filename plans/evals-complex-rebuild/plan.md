# Implementation Plan — evals-complex-rebuild

> Rebuild the 15 SDLC skill Waza eval suites under `evals/<skill>/` from
> minimal scaffolds into Waza-compatible, multi-grader, behavior-checked,
> tool-sequencing-aware suites with adversarial negatives and
> `trigger_tests.yaml`, iterating with `waza run` until every suite
> passes under locked thresholds.

## Execution Config

- **Per-batch verify:** `waza run --discover evals/<changed-skill>/ -v -o evals/<changed-skill>/results.json`
- **Global verify (final):** `waza run --discover evals/ -v -o results.json`
- **Skill source of truth:** `.claude/skills/*` (canonical). `templates/skills/*` deferred.
- **Executor / model:** `copilot-sdk` / `gpt-4o-mini` (as currently configured in every `eval.yaml`).
- **Locked thresholds (do not lower without `CHANGELOG.md` justification):**
  - `task_completion ≥ 0.8`
  - `efficiency ≥ 0.7`
  - `trigger` positive pass rate `≥ 0.8`
  - `trigger` negative false-positive rate `≤ 0.1`
- **Per-archetype budgets:**
  | Archetype | max_tokens | max_duration_ms | max_tool_calls | trials_per_task |
  | --- | --- | --- | --- | --- |
  | C/E single-skill (critic, sherlock, thomas, lessons-learned, docs-sync, jira-fetch) | 60_000 | 180_000 | 15 | 1 deterministic / 3 trigger / 5 prompt-grader |
  | B planner (impl-strategy, daedalus, hephaestus) | 200_000 | 300_000 | 40 | 1 deterministic / 5 action_sequence-or-prompt |
  | Role via orchestrator (C invoked inside A) | 150_000 | 300_000 | — | 5 multi-hop |
  | A orchestrator (council, strategy-debate, wizard, wizard-eval) | 300_000 | 600_000 | 80 | 5 multi-hop / 3 trigger |
  | D setup wizard (devcontainer-setup, graphify-setup) | 200_000 | 300_000 | 40 | 1 file-grader / 3 trigger |
- **Thomas:** `enabled` (validation subagent runs DoD before every batch is marked ✅; final batch is end-to-end sign-off).

## Definition of Done

Every batch is validated by a `skill:sdlc-thomas` subagent that must witness:

1. The batch's `Verify` command runs end-to-end and exits 0.
2. All locked thresholds above hold for every suite touched by the batch.
3. ≥1 deterministic grader (`text`, `file`, `regex`, `behavior`, `action_sequence`, or `skill_invocation`) is present on every task — failure is never solely attributable to judge noise.
4. Negatives pass before positives pass (no `trigger` negative may regress to fix a positive).
5. No `required_tools` / `forbidden_tools` list has been edited during this batch's iteration loop after Batch 0 locked them.
6. Every grader/threshold change in the batch is recorded in `evals/<skill>/CHANGELOG.md` with a one-line justification.
7. All tracking-list rows for the batch are ✅ in `plan.md` after the verify pass.

---

## 1. What We Are Doing

1. **Tool-name canonicalization probe** — Run a Batch-0 `waza` probe under the active `copilot-sdk` executor across 5 representative prompts and commit `evals/_probe/TOOL_NAMES.md` so every downstream `required_tools` / `forbidden_tools` / `action_sequence` string is grounded in real emitter names instead of VS-Code Copilot-Chat names.
2. **Folder hygiene** — `git mv evals/sdlc-council-lucas evals/sdlc-council-critic`, add `evals/_shared/budgets.md`, and stand up the per-skill `CHANGELOG.md` discipline.
3. **`trigger_tests.yaml` for all 15 skills** — Add the cheap static-trigger gate with 6 positive + 6 negative prompts per skill (mix of high/medium confidence), plus cross-skill negatives for the seven planning-family skills.
4. **Archetype B + E uplift** — Rebuild eval.yaml + 4–6 tasks per skill for `sdlc-impl-strategy`, `sdlc-council-daedalus`, `sdlc-council-hephaestus`, `sdlc-lessons-learned`, `docs-sync`, `jira-fetch` with file-grader–heavy, multi-grader coverage and behavior budgets.
5. **Archetype A + D uplift** — Same treatment for `sdlc-council`, `sdlc-strategy-debate`, `sdlc-wizard`, `sdlc-wizard-eval`, `sdlc-devcontainer-setup`, `sdlc-graphify-setup`, introducing `skill_invocation` (first-hop only) and cross-skill `trigger` negatives.
6. **Archetype C uplift + one `prompt` grader per B-skill** — Rebuild `sdlc-council-critic`, `sdlc-council-sherlock`, `sdlc-thomas`, then add one structural `prompt` grader to each Batch-2 B-skill.
7. **Hold-out negatives, CHANGELOGs, and full regression** — Author hold-out adversarial negatives only at the end (no peeking during iteration), write `evals/<skill>/CHANGELOG.md` for every grader change, and run the global `waza run --discover evals/ -v -o results.json` regression until thresholds hold for every suite.
8. **Continuous lessons capture** — Lessons are automatically logged to `lessons.md` after every user correction and every agent mistake discovered during execution — without being asked.

---

## 2. How We Are Doing It / What Is Out of Scope

### Implementation method

- **Archetypes (canonical mapping):**
  - **A — Orchestrator:** `sdlc-council`, `sdlc-strategy-debate`, `sdlc-wizard`, `sdlc-wizard-eval`
  - **B — File-producing planner:** `sdlc-impl-strategy`, `sdlc-council-daedalus`, `sdlc-council-hephaestus`
  - **C — Reviewer / Policy:** `sdlc-council-critic`, `sdlc-council-sherlock`, `sdlc-thomas`
  - **D — Setup wizard:** `sdlc-devcontainer-setup`, `sdlc-graphify-setup`
  - **E — Lessons / Log / Fetch:** `sdlc-lessons-learned`, `docs-sync`, `jira-fetch`
- **Graders allowed and how to use them:**
  - `text` — `contains`, `not_contains`, `contains_cs`, `not_contains_cs`, `regex_match`, `regex_not_match`.
  - `behavior` — `max_tool_calls`, `max_tokens`, `max_duration_ms`, `required_tools`, `forbidden_tools` (exact emitter names from Batch-0 probe only).
  - `action_sequence` — `matching_mode: exact_match | in_order_match | any_order_match`, `expected_actions`.
  - `skill_invocation` — `mode: exact_match | in_order | any_order`, `required_skills`, `allow_extra` (first-hop only this sweep).
  - `file` — `must_exist`, `must_not_exist`, `content_patterns: [{ path, must_match, must_not_match }]` (workspace-relative).
  - `trigger` — `skill_path`, `mode: positive | negative`, `threshold` (default 0.6); static, does not invoke executor.
  - `prompt` — restricted in this round to structural checks only (e.g., "contains the 3 required sections"); uses `set_waza_grade_pass/fail` tool calls; disables cache.
  - `trigger_tests.yaml` — sibling of `eval.yaml`, lists `should_trigger_prompts` / `should_not_trigger_prompts` with `confidence: high|medium`; adds `trigger_accuracy` metric.
- **Per-skill artifact regex (Hephaestus checklist — embed in `file` content_patterns):**
  - `sdlc-impl-strategy`: `plan.md` must match `(?m)^## 1\. What We Are Doing\b`, `(?m)^## 2\. How We Are Doing It`, `(?m)^## 3\. Tracking List\b`, and contain `DoD Gate`.
  - `sdlc-lessons-learned`: `lessons.md` entries match `(?m)^### \[\d{4}-\d{2}-\d{2}\] —`.
  - `sdlc-devcontainer-setup`: `.devcontainer/devcontainer.json` matches `"name"\s*:`; `Dockerfile` matches `^FROM\s`; `docker-compose.yml` matches `^services:`.
  - `sdlc-council`: `plans/<topic>/{plan.md,debate.md,lessons.md}`; `debate.md` matches `(?m)^## (Daedalus|Hephaestus|Critic)\b`.
  - `sdlc-strategy-debate`: `plans/<topic>/debate.md` contains `## Daedalus`, `## Hephaestus`, `## Critic`, `## Synthesis`.
  - `jira-fetch`: ticket file name matches `^[A-Z][A-Z0-9]+-\d+\.md$`, begins with `^# `, contains `^## Description`.
  - Role skills (`thomas`, `critic`, `sherlock`, `hephaestus`, `daedalus`): grade via `skill_invocation` against orchestrator prompt OR `prompt`-grader on role-specific headings — Thomas: `Evidence Record` / `Observed:`; Critic: `Review Findings` / `Severity:`; Sherlock: `Bug Fix Summary` / `Root cause:`; Hephaestus: `Files changed:`; Daedalus: `Architecture Brief` / `Decisions:`.
- **Adversarial negative bait (embed verbatim in `trigger_tests.yaml#should_not_trigger_prompts` AND as `trigger` negative graders in `eval.yaml`):**
  - `sdlc-council` → "Tell me how a council of mages would design dragons in a D&D campaign."
  - `sdlc-council-critic` → "Write a movie critic's review of Blade Runner 2049."
  - `sdlc-council-daedalus` → "Summarize the Greek myth of Daedalus and Icarus."
  - `sdlc-council-hephaestus` → "What metals did Hephaestus forge in Greek mythology?"
  - `sdlc-council-sherlock` → "Recommend a Sherlock Holmes novel for a flight."
  - `sdlc-thomas` → "Who was Thomas Aquinas and what did he write about?"
  - `sdlc-impl-strategy` → "Plan my weekend trip to Kyoto." AND "What's the best chess opening against the Sicilian?"
  - `sdlc-strategy-debate` → "Help me prepare for a high-school debate team on AI ethics."
  - `sdlc-lessons-learned` → "What lessons did humanity learn from the 2008 financial crisis?"
  - `sdlc-devcontainer-setup` → "Explain the difference between a shipping container and a freight car."
  - `sdlc-graphify-setup` → "How do I plot a bar graph in matplotlib?"
  - `sdlc-wizard` → "Write a children's story about a wizard who loses his hat."
  - `sdlc-wizard-eval` → "Evaluate this Harry Potter fan fiction."
  - `jira-fetch` → "What's the etymology of the word 'jira'?" AND "Fetch me a coffee."
  - `docs-sync` → "Sync my Google Docs to Dropbox."
- **Coverage rule:** Every task carries ≥2 grader types AND ≥1 deterministic grader so coverage flips from Partial to Full and judge-noise can never solely cause a failure.
- **Cross-skill negative-trigger matrix:** Mandatory for the seven planning-family skills (`sdlc-council`, `sdlc-strategy-debate`, `sdlc-impl-strategy`, `sdlc-council-daedalus`, `sdlc-council-hephaestus`, `sdlc-council-critic`, `sdlc-council-sherlock`). Each must include at least one `trigger` negative grader pointing at a sibling planning-family skill to prove non-cross-firing.
- **Validation strategy after each batch:** Run the per-batch verify command listed in `## Execution Config`, inspect `results.json` for each touched skill, then dispatch `skill:sdlc-thomas` as the DoD gate (see Definition of Done). Final batch additionally runs the global verify command.

### Non-negotiable anti-overfit guardrails (Critic-mandated)

1. **Frozen thresholds.** The locked thresholds in `## Execution Config` cannot be lowered during iteration. Any change requires a new line in `evals/<skill>/CHANGELOG.md` with explicit justification.
2. **Hold-out adversarial tasks.** 30% of the adversarial negatives are authored only in Batch 5 and are not visible during Batches 1–4 iteration.
3. **`CHANGELOG.md` per skill.** Every grader change, threshold tweak, or task rewrite is recorded in `evals/<skill>/CHANGELOG.md`.
4. **No `required_tools` edits during iteration.** Tool-name lists are locked after Batch 0 and only re-opened if a Batch-0 re-probe is justified in `CHANGELOG.md`.
5. **≥1 deterministic grader per task.** No task may be graded solely by `prompt`.
6. **Negatives pass before positives pass.** Acceptance gate: a suite is not green until its negative trigger / negative behavior graders pass, AND positive graders pass on top. Patching a positive at the cost of a negative is forbidden.

### Out of scope (deferred this sweep)

- `diff` graders against plan-file snapshots (no frozen fixture corpus exists yet).
- End-to-end orchestrator runs — full debate → plan → impl → critic → thomas loops. Only **first-hop delegation** is graded in Batch 3.
- `prompt`-grader rubrics scoring abstract "plan quality" — restricted to structural checks this round.
- LLM-generated negatives — every negative is hand-authored this round.
- Parallel evals for `templates/skills/*` — only `.claude/skills/*` is canonical this sweep.
- Reconciliation between `templates/skills/*` and `.claude/skills/*` content (separate plan).
- Performance benchmarking beyond budget caps (no latency targets beyond `max_duration_ms`).
- CI integration of `waza run` (separate plan).

---

## 3. Tracking List

### Batch 0 — Probe, rename, budget table

| #      | Item                                                                                                                    | File/Area                                                   | Status |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| 1      | Run `waza new task from-prompt` × 5 representative prompts under `copilot-sdk` and capture canonical emitter tool names | `evals/_probe/` (new) → `evals/_probe/TOOL_NAMES.md`        | ⬜     |
| 2      | Rename mis-named eval folder so it matches the canonical skill name                                                     | `git mv evals/sdlc-council-lucas evals/sdlc-council-critic` | ⬜     |
| 3      | Write the per-archetype budget table + locked thresholds + tool-name lock policy as a shared reference                  | `evals/_shared/budgets.md`                                  | ⬜     |
| 4      | Seed empty `evals/<skill>/CHANGELOG.md` for all 15 skills with the locked-thresholds contract header                    | `evals/<skill>/CHANGELOG.md` × 15                           | ⬜     |
| DoD    | Validate batch                                                                                                          | DoD criteria 1–7 in `## Definition of Done`                 | ⬜     |
| Thomas | Verify this batch                                                                                                       | `skill:sdlc-thomas`                                         | ⬜     |

**Verify:** `waza --version` → confirm `evals/_probe/TOOL_NAMES.md` exists and lists ≥5 distinct emitter tool names → confirm `evals/sdlc-council-critic/` exists and `evals/sdlc-council-lucas/` does not → `ls evals/*/CHANGELOG.md | wc -l` returns `15`.
**DoD Gate:** Invoke a `skill:sdlc-thomas` validation subagent to run every check in this batch's `Verify` line, confirm `evals/_shared/budgets.md` contains the budget table and the six anti-overfit guardrails verbatim, and confirm `evals/_probe/TOOL_NAMES.md` contains a `<!-- tool-names LOCKED -->` marker. Mandatory; cannot be skipped. Mark DoD ✅ only when all criteria pass.
**Thomas Gate:** After the DoD Gate passes, dispatch `skill:sdlc-thomas` as a subagent to re-execute the `Verify` checks first-hand and confirm every tracking-list row above is ✅. Mark Thomas ✅ only after an **APPROVED** verdict.

---

### Batch 1 — `trigger_tests.yaml` for all 15 skills

| #      | Item                                                                                             | File/Area                                                                                                                               | Status |
| ------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1      | Author 6 positive + 6 negative prompts (high+medium) for B+E skills                              | `evals/{sdlc-impl-strategy,sdlc-council-daedalus,sdlc-council-hephaestus,sdlc-lessons-learned,docs-sync,jira-fetch}/trigger_tests.yaml` | ⬜     |
| 2      | Author 6 positive + 6 negative prompts (high+medium) for A+D skills                              | `evals/{sdlc-council,sdlc-strategy-debate,sdlc-wizard,sdlc-wizard-eval,sdlc-devcontainer-setup,sdlc-graphify-setup}/trigger_tests.yaml` | ⬜     |
| 3      | Author 6 positive + 6 negative prompts (high+medium) for C skills                                | `evals/{sdlc-council-critic,sdlc-council-sherlock,sdlc-thomas}/trigger_tests.yaml`                                                      | ⬜     |
| 4      | Embed the adversarial bait list verbatim under `should_not_trigger_prompts` (per skill, from §2) | All 15 `trigger_tests.yaml`                                                                                                             | ⬜     |
| DoD    | Validate batch                                                                                   | DoD criteria 1–7                                                                                                                        | ⬜     |
| Thomas | Verify this batch                                                                                | `skill:sdlc-thomas`                                                                                                                     | ⬜     |

**Verify:** `find evals -name trigger_tests.yaml | wc -l` returns `15` → `waza run --discover evals/ -v -o results.json` → in `results.json` every suite reports `trigger_accuracy` with positive pass-rate ≥ 0.8 AND negative false-positive ≤ 0.1.
**DoD Gate:** `skill:sdlc-thomas` subagent confirms (a) every `trigger_tests.yaml` lists ≥6 positive and ≥6 negative prompts, (b) every adversarial-bait sentence from §2 is present verbatim in the right file, (c) `trigger_accuracy` thresholds hold on every suite, (d) negatives pass before positives — and records the result in `evals/<skill>/CHANGELOG.md`. Mandatory; cannot be skipped.
**Thomas Gate:** Dispatch `skill:sdlc-thomas` to re-run the verify command and confirm every row above is ✅ before advancing. Mark Thomas ✅ only after an **APPROVED** verdict.

---

### Batch 2 — Archetype B + E full uplift

| #      | Item                                                                                                                              | File/Area                                                                                             | Status |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------ |
| 1      | Rebuild eval.yaml + 4–6 tasks for B planners (impl-strategy, daedalus, hephaestus) — file+regex+behavior+action_sequence          | `evals/{sdlc-impl-strategy,sdlc-council-daedalus,sdlc-council-hephaestus}/eval.yaml` + `tasks/*.yaml` | ⬜     |
| 2      | Rebuild eval.yaml + 4–6 tasks for E (lessons-learned, docs-sync, jira-fetch) — file+regex+behavior+trigger                        | `evals/{sdlc-lessons-learned,docs-sync,jira-fetch}/eval.yaml` + `tasks/*.yaml`                        | ⬜     |
| 3      | Embed per-archetype `behavior` budgets (max_tokens / max_duration_ms / max_tool_calls) directly inside each `eval.yaml`           | Same files as rows 1 & 2                                                                              | ⬜     |
| 4      | Set `trials_per_task` per archetype (1 deterministic / 3 trigger / 5 prompt-grader / 5 action_sequence) per `## Execution Config` | Same files                                                                                            | ⬜     |
| DoD    | Validate batch                                                                                                                    | DoD criteria 1–7                                                                                      | ⬜     |
| Thomas | Verify this batch                                                                                                                 | `skill:sdlc-thomas`                                                                                   | ⬜     |

**Verify:** `waza run --discover evals/sdlc-impl-strategy/ --discover evals/sdlc-council-daedalus/ --discover evals/sdlc-council-hephaestus/ --discover evals/sdlc-lessons-learned/ --discover evals/docs-sync/ --discover evals/jira-fetch/ -v -o results.json` → in each `results.json` `task_completion ≥ 0.8` and `efficiency ≥ 0.7` AND every task carries ≥2 grader types incl. ≥1 deterministic.
**DoD Gate:** `skill:sdlc-thomas` subagent confirms (a) every task in the 6 touched suites uses ≥2 grader types and ≥1 deterministic grader, (b) per-archetype budgets and `trials_per_task` match the table in `## Execution Config`, (c) no `required_tools` list mutated relative to Batch-0 lock, (d) thresholds hold, (e) negatives still pass — and writes a CHANGELOG entry per touched skill. Mandatory; cannot be skipped.
**Thomas Gate:** Dispatch `skill:sdlc-thomas` to re-execute verify, inspect each `results.json`, and confirm every row is ✅. Mark Thomas ✅ only after an **APPROVED** verdict.

---

### Batch 3 — Archetype A + D uplift (first-hop only)

| #      | Item                                                                                                                                  | File/Area                                                                                                                                                        | Status |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1      | Rebuild eval.yaml + 4–6 tasks for A orchestrators (council, strategy-debate, wizard, wizard-eval) with `skill_invocation` (first-hop) | `evals/{sdlc-council,sdlc-strategy-debate,sdlc-wizard,sdlc-wizard-eval}/eval.yaml` + `tasks/*.yaml`                                                              | ⬜     |
| 2      | Rebuild eval.yaml + 4–6 tasks for D setup wizards (devcontainer-setup, graphify-setup) with file-grader regex from §2                 | `evals/{sdlc-devcontainer-setup,sdlc-graphify-setup}/eval.yaml` + `tasks/*.yaml`                                                                                 | ⬜     |
| 3      | Add cross-skill `trigger` negatives for the 7 planning-family skills (each negative points at a sibling planning-family skill)        | `evals/{sdlc-council,sdlc-strategy-debate,sdlc-impl-strategy,sdlc-council-daedalus,sdlc-council-hephaestus,sdlc-council-critic,sdlc-council-sherlock}/eval.yaml` | ⬜     |
| 4      | Embed archetype A/D budgets and `trials_per_task` per `## Execution Config`                                                           | Same files as rows 1 & 2                                                                                                                                         | ⬜     |
| DoD    | Validate batch                                                                                                                        | DoD criteria 1–7                                                                                                                                                 | ⬜     |
| Thomas | Verify this batch                                                                                                                     | `skill:sdlc-thomas`                                                                                                                                              | ⬜     |

**Verify:** `waza run --discover evals/sdlc-council/ --discover evals/sdlc-strategy-debate/ --discover evals/sdlc-wizard/ --discover evals/sdlc-wizard-eval/ --discover evals/sdlc-devcontainer-setup/ --discover evals/sdlc-graphify-setup/ -v -o results.json` → thresholds hold AND every planning-family suite shows ≥1 cross-skill `trigger` negative passing.
**DoD Gate:** `skill:sdlc-thomas` subagent confirms (a) `skill_invocation` graders are scoped first-hop only (no nested debate→impl→critic chains), (b) cross-skill negative matrix is present for all 7 planning-family skills, (c) D-skills' file-grader regexes match the per-skill artifact regex list in §2, (d) thresholds hold, (e) CHANGELOG updated. Mandatory; cannot be skipped.
**Thomas Gate:** Dispatch `skill:sdlc-thomas` to re-run verify, validate `results.json`, and confirm every row is ✅. Mark Thomas ✅ only after an **APPROVED** verdict.

---

### Batch 4 — Archetype C uplift + one `prompt` grader per B-skill

| #      | Item                                                                                                                        | File/Area                                                                                  | Status |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| 1      | Rebuild eval.yaml + 4–6 tasks for C reviewers (critic, sherlock, thomas) with role-specific heading checks from §2          | `evals/{sdlc-council-critic,sdlc-council-sherlock,sdlc-thomas}/eval.yaml` + `tasks/*.yaml` | ⬜     |
| 2      | Add ONE structural `prompt` grader per B-skill (verifies "contains the 3 required sections" only — no plan-quality scoring) | `evals/{sdlc-impl-strategy,sdlc-council-daedalus,sdlc-council-hephaestus}/eval.yaml`       | ⬜     |
| 3      | Confirm every C/B task still carries ≥1 deterministic grader (`prompt` never stands alone)                                  | Same files as rows 1 & 2                                                                   | ⬜     |
| 4      | Embed archetype C budgets and `trials_per_task` per `## Execution Config` (incl. role-via-orchestrator caps)                | Same files                                                                                 | ⬜     |
| DoD    | Validate batch                                                                                                              | DoD criteria 1–7                                                                           | ⬜     |
| Thomas | Verify this batch                                                                                                           | `skill:sdlc-thomas`                                                                        | ⬜     |

**Verify:** `waza run --discover evals/sdlc-council-critic/ --discover evals/sdlc-council-sherlock/ --discover evals/sdlc-thomas/ --discover evals/sdlc-impl-strategy/ --discover evals/sdlc-council-daedalus/ --discover evals/sdlc-council-hephaestus/ -v -o results.json` → thresholds hold AND each B-skill suite shows exactly one `prompt` grader AND every task has ≥1 deterministic grader.
**DoD Gate:** `skill:sdlc-thomas` subagent confirms (a) C-skill role-heading regexes match §2, (b) exactly one structural `prompt` grader per B-skill, (c) no task is `prompt`-only, (d) `trials_per_task = 5` wherever a `prompt` grader appears, (e) thresholds hold, (f) negatives still pass before positives, (g) CHANGELOG updated. Mandatory; cannot be skipped.
**Thomas Gate:** Dispatch `skill:sdlc-thomas` to re-execute verify, inspect `results.json`, and confirm every row is ✅. Mark Thomas ✅ only after an **APPROVED** verdict.

---

### Batch 5 — Hold-out negatives, CHANGELOGs, full regression (final sign-off)

| #      | Item                                                                                                                                            | File/Area                                               | Status |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| 1      | Author hold-out adversarial negatives (~30% of total negatives, NOT touched during Batches 1–4) and add to `trigger_tests.yaml` + `eval.yaml`   | All 15 `evals/<skill>/trigger_tests.yaml` + `eval.yaml` | ⬜     |
| 2      | Complete `evals/<skill>/CHANGELOG.md` per skill with full grader/threshold history for this sweep                                               | `evals/<skill>/CHANGELOG.md` × 15                       | ⬜     |
| 3      | Run global regression `waza run --discover evals/ -v -o results.json` and iterate fixes until every suite passes locked thresholds              | `results.json` (workspace root)                         | ⬜     |
| 4      | Confirm locked-threshold contract: `task_completion ≥ 0.8`, `efficiency ≥ 0.7`, trigger positive ≥ 0.8, trigger negative FP ≤ 0.1 — every suite | `results.json`                                          | ⬜     |
| DoD    | Validate batch + entire plan                                                                                                                    | DoD criteria 1–7 across all 15 suites                   | ⬜     |
| Thomas | End-to-end plan sign-off                                                                                                                        | `skill:sdlc-thomas` (full-plan review)                  | ⬜     |

**Verify:** `waza run --discover evals/ -v -o results.json` → parse `results.json` → for every of 15 suites: `task_completion ≥ 0.8`, `efficiency ≥ 0.7`, trigger positive pass-rate ≥ 0.8, trigger negative false-positive ≤ 0.1 AND hold-out negatives pass on the first iteration without any grader edit.
**DoD Gate:** `skill:sdlc-thomas` subagent runs the global verify itself, confirms (a) hold-out negatives were authored only in this batch (git log evidence), (b) no `required_tools` list mutated after Batch 0, (c) every `CHANGELOG.md` records its sweep entries, (d) negatives pass before positives across all 15 suites, (e) locked thresholds hold without any in-iteration threshold lowering. Mandatory; cannot be skipped.
**Thomas Gate (full-plan):** Dispatch `skill:sdlc-thomas` for end-to-end sign-off — Thomas re-runs the global verify, reviews every section of `plan.md` to confirm all rows in Batches 0–5 are ✅, and issues a final **APPROVED** or **NOT APPROVED** verdict for the plan as a whole. The plan is not complete until this verdict is **APPROVED**.
