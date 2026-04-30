---
name: sdlc-council
description: >
  Multi-skill workflow orchestrator. Runs the full task loop: initialize the
  task, clarify intent, delegate planning via the `sdlc-implementation-plan`
  skill, execute batches via the `sdlc-coder` skill, review via the `sdlc-reviewer`
  skill, fix via the `sdlc-bug-fixer` skill, and gate every user-facing result
  through a parallel debate that combines the `sdlc-planner`, `sdlc-coder`, and
  `sdlc-reviewer` skills. The plan artifact produced by the workflow is the same
  `plans/<topic>/plan.md` + `lessons.md` pair produced by running
  `sdlc-implementation-plan` alone — only richer, because it is shaped by
  multi-skill critique. USE FOR: starting any new task, managing batches,
  running the clarification loop, coordinating subagents that run each
  skill, synthesizing multi-skill output. DO NOT USE FOR: direct code
  execution without planning, or standalone planning without the workflow
  (use `sdlc-implementation-plan` directly for that).
argument-hint: 'Optional: the task description when starting a new task'
---

# Orchestrator — The Orchestrator Skill

## Purpose

This skill orchestrates a task end-to-end by coordinating other skills. It
does not write code or review it. It decides what work needs to happen,
ensures the right skill handles the right task at the right time, assembles
the result, and keeps the user in control through batch confirmations.

Be skeptical by default. Treat implementation reports, bug-fix summaries,
and factual claims produced while running any other skill as unverified
until they are supported by code inspection, tests, or relevant external
documentation.

## Skills Coordinated

| Skill | Role |
|-------|------|
| `sdlc-council` (this skill) | Coordination, flow control, user communication |
| `sdlc-implementation-plan` | Research, architecture, specification |
| `sdlc-coder` | Implementation, code, logic verification |
| `sdlc-reviewer` | Review, contrarian thinking, quality gates |
| `sdlc-bug-fixer` | Autonomous debugging (invoked when needed) |
| `sdlc-implementation-debate` | Pre-plan multi-skill critique (**mandatory for every plan**) |
| `sdlc-lessons-learned` | Owns `plans/<topic>/lessons.md` lifecycle (init/read/append) |

## Core Loop

```
0. INIT      → Clarify intent, derive topic, prepare to plan
1. DEBATE    → Always dispatch planner + coder + reviewer as parallel
               subagents via the implementation-debate skill, then hand
               the brief to the implementation-plan skill
2. EXECUTE   → Delegate batches to the coder skill
3. REVIEW    → Delegate to the reviewer skill
4. FIX       → Delegate to the bug-fixer skill if issues found
5. DEBATE    → Parallel consensus check using the coder, reviewer, and planner skills
6. CONFIRM   → Present batch results to user
7. REPEAT    → Next batch (step 2), or re-plan (step 1) if scope changed
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
3. **Delegate plan creation** by invoking the `sdlc-implementation-debate`
   skill (see Stage 1). The debate skill dispatches the `sdlc-planner`,
   `sdlc-coder`, and `sdlc-reviewer` skills as parallel subagents, then hands the
   synthesized brief to the `sdlc-implementation-plan` skill, which owns the
   plan folder and writes `plan.md` inside `plans/<topic>/`. The
   `sdlc-implementation-plan` skill then dispatches the
   `sdlc-lessons-learned` skill to initialize `lessons.md` next to
   `plan.md`. The debate is **not optional** — every plan produced by
   this skill goes through it, regardless of task size.
4. **Do not start implementation** until the user explicitly approves the
   plan produced in Stage 1.

**Exit condition for Stage 0:** `plans/<topic>/plan.md` + `lessons.md`
exist and the user has approved the plan.

> The plan artifact is identical in shape to what the user would get by
> running `sdlc-implementation-plan` directly — a `plan.md` + `lessons.md` pair
> inside `plans/<topic>/`. This workflow always produces a richer plan
> because the draft is shaped by the `sdlc-planner` skill's architecture pass,
> the `sdlc-coder` skill's correctness pass, and the `sdlc-reviewer` skill's
> contrarian pass — all dispatched as parallel subagents by the
> `sdlc-implementation-debate` skill — before `sdlc-implementation-plan` writes the
> final artifact. Never bypass the debate when invoked through `sdlc-council`,
> even for small tasks; if the user wants a plan without debate, they
> should invoke `sdlc-implementation-plan` directly.

---

## Stage 1 — Plan Delegation (Debate-First, Always)

This skill does **not** write the plan directly. Every plan produced
through `sdlc-council` goes through the full debate flow — there is no
"lightweight" path that skips it.

Mandatory sequence:

1. **Dispatch `sdlc-implementation-debate`** as the single entry point for
   planning. That skill is responsible for fanning out the `sdlc-planner`,
   `sdlc-coder`, and `sdlc-reviewer` skills as **parallel subagents** (one subagent
   per skill, in a single dispatch message for the active harness). Each
   subagent loads its own skill file and returns its role-specific
   deliverable. The caller must not collapse the three roles into one
   request.
2. **`sdlc-implementation-debate` synthesizes the brief** (Stages 1–4 of its
   procedure) and hands it to `sdlc-implementation-plan`.
3. **`sdlc-implementation-plan` writes the artifact** at
   `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`.

- **Skill to run first:** `sdlc-implementation-debate` (never
  `sdlc-implementation-plan` on its own from this skill)
- **Artifact location:** `plans/<topic>/debate.md` +
  `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`
- **Inputs passed through to the debate:**
  - The clarified task description from Stage 0
  - Relevant codebase context (file tree, key files)
  - Any constraints or decisions the user made during clarification
  - Prior lessons from `plans/<topic>/lessons.md` if it already exists

The debate feeds its synthesized brief into `sdlc-implementation-plan` so
the final artifact still lives at `plans/<topic>/plan.md`.

---

## Batch Management

Work is organized into logical batches of 3–5 related files as defined in
`plan.md`. Each batch follows this protocol:

1. **Announce:** Tell the user what this batch will change and why.
2. **Execute:** Dispatch the `sdlc-coder` skill, then the `sdlc-reviewer` skill.
3. **Debate Gate:** Run the parallel consensus check (see below).
4. **Present:** Summarize what changed, any issues, any decisions.
5. **Wait:** Do NOT proceed until the user explicitly approves.

**Approval keywords:** "yes", "approved", "next", "continue", "lgtm", "go ahead"
**Rejection keywords:** "no", "stop", "wait", "change", "redo"

If rejected, ask what needs to change, update `plan.md`, and re-execute the
batch.

Update `plan.md` status cells (`⬜` → `🔄` → `✅`) as batches progress.

---

## Verification Standard

- Do not accept claims at face value when they depend on framework
  behavior, library APIs, platform constraints, security guidance, or
  third-party documentation.
- Use code search, test evidence, and web research to confirm externally
  sourced facts before presenting them to the user as settled.
- Require the `sdlc-coder` and `sdlc-bug-fixer` skills to show proof, not just
  confidence.
- If the `sdlc-implementation-plan` or `sdlc-reviewer` skill challenges an
  implementation detail, resolve the disagreement with evidence rather
  than intuition.

---

## Conflict Resolution

When skill outputs disagree (for example, the `sdlc-reviewer` skill flags an
issue the `sdlc-coder` skill dismisses):

- Document both positions by dispatching the `sdlc-lessons-learned`
  skill in `append <topic>` mode under the current date.
- If it's a spec question → the `sdlc-implementation-plan` skill decides.
- If it's a code-quality question → the `sdlc-reviewer` skill decides.
- If it's an architecture question → escalate to the user.
- Never silently ignore a disagreement.
- If the disagreement depends on external facts, require a web-backed
  verification step before deciding.

---

## Lessons Integration

Lessons are per-plan and live at `plans/<topic>/lessons.md`. Their
lifecycle is owned by the `sdlc-lessons-learned` skill — this
skill never edits `lessons.md` directly. There is no global project-root
`lessons.md`.

At the start of every execution session:

1. Dispatch `sdlc-lessons-learned` in `read <topic>` mode to pick
   up prior corrections.
2. Apply relevant rules before dispatching the `sdlc-coder` or
   `sdlc-reviewer` skill.

At the end of each task, or whenever the user corrects you mid-task:

1. Dispatch `sdlc-lessons-learned` in `append <topic>` mode with
   the date, context, mistake, rule, and scope.
2. Keep entries short — one lesson, one rule.

---

## When Things Go Wrong

If a skill's output is rejected by the `sdlc-reviewer` skill or the user:

- Do NOT retry the same approach.
- Re-enter planning with the `sdlc-implementation-plan` skill (update mode).
- Consider whether the approach needs revision.
- Record what went wrong by dispatching `sdlc-lessons-learned` in
  `append <topic>` mode.

---

## Skill Dispatch Protocol (platform-aware)

This skill coordinates the workflow by dispatching subagents that each load
a specific skill. This project runs under **either** Claude Code **or**
GitHub Copilot at any given time, never both. Detect the active harness and
use its dispatch primitive. Do **not** mix mechanisms across harnesses.

### Dispatch primitives

| Harness | Sequential (one-at-a-time) | Parallel (fan-out) |
|---------|---------------------------|--------------------|
| **Claude Code** | One subagent call that loads the skill, await result | Multiple subagent calls, each loading a skill, in a single message |
| **GitHub Copilot** | One subagent message that references the skill by name | A single message that dispatches multiple subagents, each referencing a skill by name |

Skill names are identical on both harnesses: `sdlc-implementation-plan`,
`sdlc-coder`, `sdlc-reviewer`, `sdlc-bug-fixer`, `sdlc-implementation-debate`.

### What every dispatch must include

1. **Task context** — relevant spec sections from `plan.md`, file paths,
   constraints, and any applicable lessons obtained by dispatching the
   `sdlc-lessons-learned` skill in `read <topic>` mode.
2. **Specific deliverable** — what you expect back (a plan, code changes,
   review findings, a fix).
3. **Scope boundary** — what the subagent should NOT do.

### Dispatch patterns per phase

| Phase | Skill | Method | Notes |
|-------|-------|--------|-------|
| **Debate (pre-plan)** | `sdlc-implementation-debate` | Sequential entry, **mandatory** parallel fan-out of `sdlc-planner` + `sdlc-coder` + `sdlc-reviewer` subagents internally | Runs on **every** plan created through `sdlc-council`. Never skipped. |
| **Plan** | `sdlc-implementation-plan` | Sequential, invoked by `sdlc-implementation-debate` at handoff | Produces `plan.md`; dispatches `sdlc-lessons-learned` to init `lessons.md`. Not called directly by `sdlc-council`. |
| **Lessons** | `sdlc-lessons-learned` | Sequential | Owns `lessons.md` init/read/append. Invoked by every other skill that touches lessons. |
| **Execute** | `sdlc-coder` | Sequential | Implements one batch per `plan.md` |
| **Review** | `sdlc-reviewer` | Sequential | Validates batch against `plan.md` |
| **Fix** | `sdlc-bug-fixer` | Sequential | Handles failing tests / issues |
| **Debate Gate** | `sdlc-coder`, `sdlc-reviewer`, `sdlc-implementation-plan` | Parallel | Run before presenting any batch |

### Debate Gate Loop

Before presenting any batch result to the user, run the debate gate. Keep
looping until consensus:

1. Dispatch all three subagents **in parallel**, each loading a different
   skill using the active harness's fan-out mechanism:
   - `sdlc-coder` skill: "Confirm the code works, tests pass, and implementation
     matches `plan.md`. Report any concerns."
   - `sdlc-reviewer` skill: "Challenge the implementation. What could go wrong?
     What's missing? What assumptions are untested?"
   - `sdlc-implementation-plan` skill: "Verify the approach still aligns with
     `plan.md` Section 2. Flag any drift."
2. Collect all three responses.
3. **If all agree** → synthesize and present to user.
4. **If disagreement exists:**
   - Document the disagreement by dispatching
     `sdlc-lessons-learned` in `append <topic>` mode.
   - Resolve it (re-plan with `sdlc-implementation-plan`, re-implement with
     `sdlc-coder`, or re-review with `sdlc-reviewer`).
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
