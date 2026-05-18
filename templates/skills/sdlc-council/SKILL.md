---
name: sdlc-council
description: >
  Multi-skill workflow orchestrator. Runs the full task loop: initialize the
  task, clarify intent, delegate planning via `skill:sdlc-impl-strategy`,
  execute batches via `skill:sdlc-council-hephaestus`, review via `skill:sdlc-council-critic`,
  fix via `skill:sdlc-council-sherlock`, and gate every user-facing result
  through a parallel debate that combines `skill:sdlc-council-daedalus`, `skill:sdlc-council-hephaestus`, and
  `skill:sdlc-council-critic`. The plan artifact produced by the workflow is the same
  `plans/<topic>/plan.md` + `lessons.md` pair produced by running
  `skill:sdlc-impl-strategy` alone — only richer, because it is shaped by
  multi-skill critique. USE FOR: starting any new task, managing batches,
  running the clarification loop, coordinating subagents that run each
  skill, synthesizing multi-skill output. DO NOT USE FOR: direct code
  execution without planning, or standalone planning without the workflow
  (use `skill:sdlc-impl-strategy` directly for that).
argument-hint: "Optional: the task description when starting a new task"
---

# Orchestrator — The Orchestrator Skill

## STOP — Pre-flight Gate

> **Read this section completely before doing anything else.**

This skill enforces a strict staged workflow. Violating the sequence is a
critical failure, not a time-saving shortcut.

**Hard rules — these apply regardless of task size:**

- NEVER write, edit, or create any file before `plans/<topic>/plan.md` is
  approved by the user.
- NEVER invoke `skill:sdlc-council-hephaestus` before plan approval.
- ALWAYS complete Stage 0 (clarify) and Stage 1 (debate → plan) first.
- If you feel tempted to skip planning because the task looks small, that
  feeling is the signal to slow down, not speed up.

**Before writing a single line of code or editing any file, you must:**

1. ☐ Complete Stage 0 — clarify intent with the user until the task fits
   one sentence they confirm.
2. ☐ Complete Stage 1 — run `skill:sdlc-strategy-debate`, produce
   `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`.
3. ☐ Obtain explicit user approval of the plan (`yes / approved / lgtm /
   go ahead`).

If **any** box above is unchecked, **STOP**. Do not proceed. Return to the
lowest unchecked step.

The only exception to this gate is if the user explicitly says
"skip planning" — in which case record the decision in `plan.md` before
proceeding and still create the plan file.

---

## Purpose

This skill orchestrates a task end-to-end by coordinating other skills. It
does not write code or review it. It decides what work needs to happen,
ensures the right skill handles the right task at the right time, assembles
the result, and keeps the user in control through batch confirmations.

Be skeptical by default. Treat implementation reports, bug-fix summaries,
and factual claims produced while running any other skill as unverified
until they are supported by code inspection, tests, or any external
documentation, including user-provided sources.

## Skills Coordinated

| Skill                             | Role                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| `skill:sdlc-council` (this skill) | Coordination, flow control, user communication                          |
| `skill:sdlc-impl-strategy`        | Research, architecture, specification                                   |
| `skill:sdlc-council-hephaestus`   | Implementation, code, logic verification                                |
| `skill:sdlc-council-critic`       | Review, contrarian thinking, quality gates                              |
| `skill:sdlc-council-sherlock`     | Autonomous debugging (invoked when needed)                              |
| `skill:sdlc-thomas`               | Hands-on validation — executes every check itself, never accepts claims |
| `skill:sdlc-strategy-debate`      | Pre-plan multi-skill critique (**mandatory for every plan**)            |
| `skill:sdlc-lessons-learned`      | Owns `plans/<topic>/lessons.md` lifecycle (init/read/append)            |

## Core Loop

```
0. INIT      → Clarify intent, derive topic, prepare to plan
1. DEBATE    → Always dispatch planner + coder + reviewer as parallel
               subagents via the strategy-debate skill, then hand
               the brief to the impl-strategy skill
2. EXECUTE   → Delegate batches to the coder skill
3. REVIEW    → Delegate to the reviewer skill
4. VALIDATE  → Delegate to sdlc-thomas; only accepts witnessed passing output
5. FIX       → Delegate to the bug-fixer skill if issues found
6. DEBATE    → Parallel consensus check using the coder, reviewer, and planner skills
7. CONFIRM   → Present batch results to user
8. REPEAT    → Next batch (step 2), or re-plan (step 1) if scope changed
```

---

## Stage 0 — Task Initialization

Run this stage once at the start of every new task.

1. **Derive a kebab-case topic** from the task description
   (e.g. `auth-middleware-rewrite`, `checkout-refactor`). Keep it short and
   descriptive.
2. **Run the clarification loop** before creating any folder:
   - Ask **one focused question at a time** until intent is unambiguous.
   - Stop when you can articulate the task in one sentence and the user
     confirms it.
   - If the user says "just do it" or "you decide" — make the call, record
     the decision in `plan.md` later, and proceed.
3. **Delegate plan creation** by invoking `skill:sdlc-strategy-debate`
   (see Stage 1). The debate skill dispatches `skill:sdlc-council-daedalus`,
   `skill:sdlc-council-hephaestus`, and `skill:sdlc-council-critic` as parallel subagents, then hands the
   synthesized brief to `skill:sdlc-impl-strategy`, which owns the
   plan folder and writes `plan.md` inside `plans/<topic>/`.
   `skill:sdlc-impl-strategy` then invokes
   `skill:sdlc-lessons-learned` to initialize `lessons.md` next to
   `plan.md`. The debate is **not optional** — every plan produced by
   this skill goes through it, regardless of task size.
4. **Do not start implementation** until the user explicitly approves the
   plan produced in Stage 1.

**Exit condition for Stage 0:** `plans/<topic>/plan.md` + `lessons.md`
exist and the user has approved the plan.

> The plan artifact is identical in shape to what the user would get by
> running `skill:sdlc-impl-strategy` directly — a `plan.md` + `lessons.md` pair
> inside `plans/<topic>/`. This workflow always produces a richer plan
> because the draft is shaped by `skill:sdlc-council-daedalus`'s architecture pass,
> `skill:sdlc-council-hephaestus`'s correctness pass, and `skill:sdlc-council-critic`'s
> contrarian pass — all dispatched as parallel subagents by
> `skill:sdlc-strategy-debate` — before `skill:sdlc-impl-strategy` writes the
> final artifact. The debate is mandatory for all tasks routed through
> `skill:sdlc-council`, regardless of size. `skill:sdlc-impl-strategy`, when
> invoked directly by the user (not through this skill), is a separate,
> debate-free path — not an exception to this rule.

---

## Stage 1 — Plan Delegation (Debate-First, Always)

This skill does **not** write the plan directly. Every plan produced
through `skill:sdlc-council` goes through the full debate flow — there is no
"lightweight" path that skips it.

Mandatory sequence:

1. **Invoke `skill:sdlc-strategy-debate`** as the single entry point for
   planning. That skill is responsible for fanning out `skill:sdlc-council-daedalus`,
   `skill:sdlc-council-hephaestus`, and `skill:sdlc-council-critic` as **parallel subagents** (one subagent
   per skill, in a single dispatch message for the active harness). Each
   subagent loads its own skill file and returns its role-specific
   deliverable. The caller must not collapse the three roles into one
   request.
2. **`skill:sdlc-strategy-debate` synthesizes the brief** (Stages 1–4 of its
   procedure) and hands it to `skill:sdlc-impl-strategy`.
3. **`skill:sdlc-impl-strategy` writes the artifact** at
   `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`.

- **Skill to run first:** `skill:sdlc-strategy-debate` (never
  `skill:sdlc-impl-strategy` on its own from this skill)
- **Artifact location:** `plans/<topic>/debate.md` +
  `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`
- **Inputs passed through to the debate:**
  - The clarified task description from Stage 0
  - Relevant codebase context (file tree, key files)
  - Any constraints or decisions the user made during clarification
  - Prior lessons from `plans/<topic>/lessons.md` if it already exists
  - **A mandatory enforcement note for `skill:sdlc-impl-strategy`:** "When writing `plan.md`, you must follow your own SKILL.md output structure rules exactly — specifically: (1) Section 1 must include the standing lessons-capture item ('Lessons are automatically logged to `lessons.md` after every user correction and every agent mistake discovered during execution — without being asked.'), and (2) every batch in Section 3 must include a `**DoD Gate:**` line that spawns a validation subagent to run every DoD criterion before the batch is marked complete. These are not optional — omitting either is a plan quality failure."

The debate feeds its synthesized brief into `skill:sdlc-impl-strategy` so
the final artifact still lives at `plans/<topic>/plan.md`.

---

## Batch Management

Work is organized into logical batches of 3–5 related files as defined in
`plan.md`. Each batch follows this sequential protocol:

```
Announce → Execute → Validate → Checkmark Gate → Debate Gate → Present → Wait
    └─ if rejected: ask → update plan.md → re-Execute
    └─ if NOT APPROVED: invoke Sherlock → re-Validate
    └─ if Debate Gate fails: resolve → re-Debate
```

1. **Announce:** Tell the user what this batch will change and why.
2. **Execute:** Invoke `skill:sdlc-council-hephaestus`, then `skill:sdlc-council-critic`.
3. **Validate:** Invoke `skill:sdlc-thomas`. Thomas runs every check itself and returns an Evidence Record with an **APPROVED** or **NOT APPROVED** verdict. If **NOT APPROVED**, invoke `skill:sdlc-council-sherlock` to fix the failures, then re-run `skill:sdlc-thomas`. Do NOT advance to the Debate Gate until Thomas issues an **APPROVED** verdict.
4. **Checkmark gate:** Before the Debate Gate, verify in `plan.md` that every item in the current batch shows `✅`. If any item is still `🔄` or `⬜`, do not proceed — return to step 2 to resolve outstanding work first.
5. **Debate Gate:** Run the parallel consensus check (see below).
6. **Present:** Summarize what changed, any issues, any decisions.
7. **Wait:** Do NOT proceed until the user explicitly approves.

**Approval keywords:** "yes", "approved", "next", "continue", "lgtm", "go ahead"
**Rejection keywords:** "no", "stop", "wait", "change", "redo"

If rejected, ask what needs to change, update `plan.md`, and re-execute the
batch.

Update `plan.md` status cells (`⬜` → `🔄` → `✅`) as batches progress. Items
must be `🔄` before handing off to `skill:sdlc-council-critic` review, and `✅` before
reaching the Checkmark Gate (step 4). Never present a batch to the user with
any item below `✅`.

---

## Verification Standard

- Do not accept claims at face value when they depend on framework
  behavior, library APIs, platform constraints, security guidance, or
  third-party documentation.
- Use code search, test evidence, and web research to confirm externally
  sourced facts before presenting them to the user as settled.
- Require `skill:sdlc-council-hephaestus` and `skill:sdlc-council-sherlock` to show proof, not just
  confidence.
- If `skill:sdlc-impl-strategy` or `skill:sdlc-council-critic` challenges an
  implementation detail, resolve the disagreement with evidence rather
  than intuition.

---

## Conflict Resolution

When skill outputs disagree (for example, `skill:sdlc-council-critic` flags an
issue `skill:sdlc-council-hephaestus` dismisses):

- Document both positions by invoking `skill:sdlc-lessons-learned`
  in `append <topic>` mode under the current date.
- If it's a spec question → `skill:sdlc-impl-strategy` decides.
- If it's a code-quality question → `skill:sdlc-council-critic` decides.
- If it's an architecture question → escalate to the user.
- Never silently ignore a disagreement.
- If the disagreement depends on external facts, require a web-backed
  verification step before deciding.

---

## Lessons Integration

Lessons are per-plan and live at `plans/<topic>/lessons.md`. Their
lifecycle is owned by `skill:sdlc-lessons-learned` — this
skill never edits `lessons.md` directly. There is no global project-root
`lessons.md`.

At the start of every execution session:

1. Invoke `skill:sdlc-lessons-learned` in `read <topic>` mode to pick
   up prior corrections.
2. Apply relevant rules before invoking `skill:sdlc-council-hephaestus` or
   `skill:sdlc-council-critic`.

At the end of each task, or whenever any of the following happens:

- The user corrects an approach mid-task
- A batch fails Thomas validation or critic review
- A non-obvious failure or codebase pattern is discovered

Invoke `skill:sdlc-lessons-learned` in `append <topic>` mode immediately —
**without being asked**. Do not batch lessons to the end of the session. Keep
entries short: one lesson, one rule.

---

## When Things Go Wrong

If a skill's output is rejected by `skill:sdlc-council-critic` or the user:

- Do NOT retry the same approach unchanged — a retry without revision is forbidden.
- Re-enter planning via `skill:sdlc-impl-strategy` (update mode) with a revised approach.
- Consider whether the approach needs revision.
- Record what went wrong by invoking `skill:sdlc-lessons-learned` in
  `append <topic>` mode.
- If a skill fails two or more consecutive times without improvement, stop and
  escalate to the user with a summary of attempts and failure reasons before proceeding.

---

## Skill Dispatch Protocol (platform-aware)

This skill coordinates the workflow by dispatching subagents that each load
a specific skill. This project runs under **either** Claude Code **or**
GitHub Copilot at any given time, never both. Detect the active harness and
use its dispatch primitive. Do **not** mix mechanisms across harnesses.

### Dispatch primitives

| Harness            | Sequential (one-at-a-time)                             | Parallel (fan-out)                                                                    |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Claude Code**    | One subagent call that loads the skill, await result   | Multiple subagent calls, each loading a skill, in a single message                    |
| **GitHub Copilot** | One subagent message that references the skill by name | A single message that dispatches multiple subagents, each referencing a skill by name |

Skill names follow the `skill:` prefix convention on both harnesses: `skill:sdlc-impl-strategy`,
`skill:sdlc-council-hephaestus`, `skill:sdlc-council-critic`, `skill:sdlc-council-sherlock`, `skill:sdlc-strategy-debate`.

### What every dispatch must include

Use this checklist for every dispatch to avoid omissions:

- [ ] **Task context** — relevant spec sections from `plan.md`, file paths, constraints, and applicable lessons from `skill:sdlc-lessons-learned` (`read <topic>` mode)
- [ ] **Specific deliverable** — exactly what you expect back (a plan, code changes, review findings, or a fix)
- [ ] **Scope boundary** — what the subagent must NOT do

### Dispatch patterns per phase

| Phase                 | Skill                                                                                    | Method                                                                                                                                                                 | Notes                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Debate (pre-plan)** | `skill:sdlc-strategy-debate`                                                             | Sequential entry, **mandatory** parallel fan-out of `skill:sdlc-council-daedalus` + `skill:sdlc-council-hephaestus` + `skill:sdlc-council-critic` subagents internally | Runs on **every** plan created through `skill:sdlc-council`. Never skipped.                                                 |
| **Plan**              | `skill:sdlc-impl-strategy`                                                               | Sequential, invoked by `skill:sdlc-strategy-debate` at handoff                                                                                                         | Produces `plan.md`; invokes `skill:sdlc-lessons-learned` to init `lessons.md`. Not called directly by `skill:sdlc-council`. |
| **Lessons**           | `skill:sdlc-lessons-learned`                                                             | Sequential                                                                                                                                                             | Owns `lessons.md` init/read/append. Invoked by every other skill that touches lessons.                                      |
| **Execute**           | `skill:sdlc-council-hephaestus`                                                          | Sequential                                                                                                                                                             | Implements one batch per `plan.md`                                                                                          |
| **Review**            | `skill:sdlc-council-critic`                                                              | Sequential                                                                                                                                                             | Validates batch against `plan.md`                                                                                           |
| **Validate**          | `skill:sdlc-thomas`                                                                      | Sequential, after Review                                                                                                                                               | Executes every check itself; issues APPROVED or NOT APPROVED verdict                                                        |
| **Fix**               | `skill:sdlc-council-sherlock`                                                            | Sequential                                                                                                                                                             | Handles failing tests / issues                                                                                              |
| **Debate Gate**       | `skill:sdlc-council-hephaestus`, `skill:sdlc-council-critic`, `skill:sdlc-impl-strategy` | Parallel                                                                                                                                                               | Run before presenting any batch                                                                                             |

### Debate Gate Loop

Before presenting any batch result to the user, run the debate gate. Keep
looping until consensus:

1. Dispatch all three subagents **in parallel**, each invoking a different
   skill using the active harness's fan-out mechanism:
   - `skill:sdlc-council-hephaestus`: “Confirm the code works, tests pass, and implementation
     matches `plan.md`. Report any concerns.”
   - `skill:sdlc-council-critic`: “Challenge the implementation. What could go wrong?
     What’s missing? What assumptions are untested?”
   - `skill:sdlc-impl-strategy`: “Verify the approach still aligns with
     `plan.md` Section 2. Flag any drift."
2. Collect all three responses.
3. **If all agree** → synthesize and present to user.
4. **If disagreement exists:**
   - Document the disagreement by invoking
     `skill:sdlc-lessons-learned` in `append <topic>` mode.
   - Resolve it (re-plan with `skill:sdlc-impl-strategy`, re-implement with
     `skill:sdlc-council-hephaestus`, or re-review with `skill:sdlc-council-critic`).
   - **Re-run the debate gate** — dispatch all three again in parallel.
5. **Repeat until consensus** or until disagreements are documented and
   explicitly acknowledged.

Only present to the user when the debate gate passes.

### Rules

- Never fan out with a mix of dispatch mechanisms — pick the one that
  matches the active harness.
- Parallel dispatch requires that the subtasks are genuinely independent.
  If one depends on another's output, dispatch sequentially.
- Never silently collapse a debate gate into a single-skill opinion.
