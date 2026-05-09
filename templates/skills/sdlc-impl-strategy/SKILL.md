---
name: sdlc-impl-strategy
description: 'Create structured implementation plans with a fixed three-section output: What We Are Doing, How We Are Doing It / What Is Out of Scope, and Tracking List. USE FOR: planning refactors, migrations, feature delivery, technical execution plans, and persistent plan documents that will guide a later implementation phase. DO NOT USE FOR: direct execution, ad-hoc code explanations, one-off tiny edits that do not need planning, or broad product brainstorming without a concrete implementation target.'
argument-hint: 'Feature, route, or task to analyze and turn into an implementation plan'
---

# Implementation Plan

Create a reusable implementation plan that captures everything needed for a later execution phase. This skill is for producing the plan, not for carrying out the implementation.

## When to Use

- The user wants a concrete implementation plan before coding
- The task spans multiple files, components, modules, or execution steps
- The user wants a tracking document that can be updated during implementation
- The plan must define execution batches and validation without performing them yet

## Core Principle

The output of this skill is a planning artifact. That artifact must be specific enough that another agent, or a later phase in the same conversation, can execute the work without needing to re-discover the basic approach.

## Procedure

### Phase 1 - Discovery

Gather the minimum context required to produce a defensible plan:

1. Define the target outcome, scope, and explicit constraints.
2. Inspect the current implementation and identify the affected files, components, modules, or flows.
3. Identify dependencies, shared infrastructure, and risks that may force work out of scope.
4. Search the codebase to identify the relevant validation path: inspect files such as `Taskfile.yml`, `package.json`, `README.md`, CI configs, and existing docs to determine which build, test, runtime, and manual verification commands are actually used by the project. Then ask the user (one message, two questions):
   - *"What command(s) should run after each batch to verify it?"*
   - *"What command(s) should run globally after all batches complete?"*
   If the user says "auto-detect" or equivalent, use the discovered commands. Record the answers (or discovered commands) in `## Execution Config` in the plan — they become the per-batch and global verify commands embedded in every batch's `**Verify:**` line.
5. **Check for `sdlc-thomas`.** Search the workspace for any `SKILL.md` whose `name` field is `sdlc-thomas` (scan all `SKILL.md` files in the workspace). If found, ask the user:
   *"`sdlc-thomas` is installed — do you want it spawned as a subagent to witness every batch's Verify step before the batch is marked ✅?"*
   Record the answer as `thomas: enabled` or `thomas: disabled` in `## Execution Config`. If Thomas is disabled or not installed, omit the `Thomas` row and `**Thomas Gate:**` lines from all batches.
6. **Capture the Definition of Done (DoD).** Follow this order:
   1. Search the repo for any skill whose name or description contains terms like `definition-of-done`, `dod`, `acceptance`, or `validation-gate` by scanning all `SKILL.md` files found anywhere in the workspace.
   2. If one or more such skills are found, present them to the user and ask: *"I found a DoD skill in this repo: `<skill-name>` — do you want to use it as the verification gate for every batch?"* Wait for the user's answer before proceeding.
   3. If the user confirms, record the skill reference as `skill:<skill-name>` in `plan.md` under `## Definition of Done` and instruct every batch's `**DoD Gate:**` to invoke `skill:<skill-name>`.
   4. If the user declines, or no DoD skill is found, and the user supplies a validation script, acceptance criteria, or an explicit DoD inline, record it verbatim under `## Definition of Done`.
   5. If neither a repo skill nor an inline DoD is provided, omit the `## Definition of Done` section and the `DoD Gate` lines from all batches.
   This DoD — however sourced — is attached to every batch as a mandatory gate and cannot be removed or deferred to a later batch.
7. Group the work into batches of at most 4 items.

### Phase 2 - Design The Plan

Turn discovery into an execution-ready plan:

1. Define the in-scope workstreams.
2. Describe the implementation method at a level that removes ambiguity for the executor.
3. Separate non-goals and deferred work from the main plan.
4. Build a tracking list that can be used during execution without restructuring the document.
5. Attach concrete validation expectations to each batch.
6. **If a DoD was captured in Phase 1:** embed a `DoD` row in every batch table and append a mandatory `**DoD Gate:**` line after each `**Verify:**` line. The gate instructs the executor to spawn a validation subagent that runs every DoD criterion against the batch output before the batch can be marked complete.

### Phase 3 - Create Or Update The Plan Folder

The plan is a **folder**, not a single file. Every plan owns its own
directory so the plan document and its execution lessons travel together.

Default layout:

```
plans/<topic-kebab-case>/
├── plan.md        # the 3-section plan artifact (this skill's primary output)
└── lessons.md     # per-plan execution lessons, appended during implementation
```

Rules:

- `<topic-kebab-case>` is a short, descriptive kebab-case slug derived from
  the initiative (e.g. `auth-middleware-rewrite`, `ingest-pipeline-v2`).
- `plans/` is the default parent directory. If the project already organizes
  planning artifacts under a different root (e.g. `tasks/`, `docs/plans/`),
  use the existing convention and note the choice in the plan.
- If the folder does not exist:
  1. Create `plan.md` and populate it immediately using the Output
     Structure below. Use `templates/skills/sdlc-impl-strategy/references/plan.template.md`
     as the reference file — replace every `<placeholder>` with content
     specific to the task.
  2. **MANDATORY — do not skip:** Dispatch the `sdlc-lessons-learned`
     skill in `init <topic>` mode to create `lessons.md` in the same
     folder. This step is **not optional**. The plan folder is incomplete
     until `lessons.md` exists. This skill does **not** write
     `lessons.md` directly — `sdlc-lessons-learned` owns that file's
     lifecycle.
- If the folder already exists, read `plan.md` first, preserve completed
  status items, and update it in place. Do **not** touch `lessons.md` —
  it belongs to `sdlc-lessons-learned` and the execution phase.

> **HARD RULE:** Every new plan folder must contain both `plan.md` and
> `lessons.md` before this skill finishes. If `sdlc-lessons-learned` is
> not available, surface the missing dependency to the user and do not
> proceed.

Always use the exact section structure defined in the Output Structure
section below for `plan.md`.

### Phase 4 - Handoff

**Before handing off, verify both files exist in the plan folder:**
- `plan.md` — written by this skill
- `lessons.md` — initialized by `sdlc-lessons-learned` (dispatched in
  Phase 3, step 2)

If `lessons.md` is missing, dispatch `sdlc-lessons-learned` in
`init <topic>` mode now — do not skip it.

**Once both files exist, run the council detection check:**

Search the workspace for any `SKILL.md` whose `name` field is `sdlc-council`
(scan all `SKILL.md` files found anywhere in the workspace). If found, ask the
user exactly this question before starting execution:

> "The plan is ready. `sdlc-council` is installed — do you want to execute it
> now using the full council workflow (debate-gated batches, multi-skill review,
> Thomas validation)? Or should I execute the plan directly?"

- **If the user confirms `sdlc-council`:** read the `sdlc-council` skill file
  and hand off immediately. Pass the plan path (`plans/<topic>/plan.md`) as the
  task context. From this point the `sdlc-council` skill owns the execution
  loop — this skill's job is done.
- **If the user declines, or `sdlc-council` is not installed:** proceed to
  execute the plan directly. Read the `## Execution Config` section from
  `plan.md` and begin executing batches in order, following all execution rules
  embedded there (lessons capture, status updates, verify commands, Thomas gate
  if enabled). No further user confirmation is required to start.

---

## Output Structure

Every implementation plan must use exactly these 3 sections.

### Section 1 - What We Are Doing

Use a numbered list of the actual changes or workstreams being delivered.

Rules:

- Each item must have a bold title and a short explanation.
- Describe the outcome, not just the mechanism.
- Keep this section scoped to in-scope work only.
- **Always include a standing item for continuous lessons capture:** `Lessons are automatically logged to \`lessons.md\` after every user correction and every agent mistake discovered during execution — without being asked.`

Example patterns:

1. **Route-level performance cleanup** - Reduce initial render cost and defer below-the-fold content.
2. **Component API modernization** - Replace legacy decorators and constructor injection with modern Angular APIs.
3. **Validation flow hardening** - Add required build and runtime verification after each batch.

### Section 2 - How We Are Doing It / What Is Out of Scope

This section must contain both:

1. The execution method
2. The explicit non-goals

Required content:

- The implementation checklist by item type if relevant, such as TypeScript, template, styling, backend, config, or runtime.
- The validation strategy that the executor must run after each batch.
- An explicit out-of-scope list.

Planning standard:

- Write this section so an executor can follow it without guessing the intended architecture.
- Prefer concrete file paths, modules, interfaces, routes, or commands over abstract guidance.
- Record assumptions or dependencies when they affect sequencing.

Out-of-scope guidance:

- List what will not be changed.
- Call out shared infrastructure that should be handled separately.
- Exclude speculative cleanup that is not required for the current task.

### Section 3 - Tracking List

Track the work in batches of at most 4 items.

Each batch must include:

- A short batch title
- A markdown table
- A verification line describing what the executor must run and what they must check, based on commands discovered by searching the codebase rather than guessed commands
- **If a DoD was provided:** a `DoD` row in the table and a mandatory `**DoD Gate:**` line after `**Verify:**`

Use this table shape (without DoD):

```markdown
### Batch N - <description>

| #      | Item              | File/Area                 | Status |
| ------ | ----------------- | ------------------------- | ------ |
| 1      | `Work item`       | `src/app/path/or/feature` | ⬜     |
| 2      | `Work item`       | `src/app/path/or/feature` | ⬜     |
| Thomas | Verify this batch | `sdlc-thomas` (if available) | ⬜  |

**Verify:** `<command>` -> `<command>` -> check <routes/tests/scenarios>
**Thomas Gate (if available):** After the `Verify` command passes, dispatch `skill:sdlc-thomas` as a subagent to execute every check in this batch's `Verify` line itself and confirm witnessed passing output. Thomas will also verify that all tracking-list rows for this batch are marked ✅ in `plan.md`. Mark the Thomas row ✅ only after Thomas issues an **APPROVED** verdict. If Thomas returns **NOT APPROVED**, the batch is not complete.
```

Use this table shape **when a DoD was provided**:

```markdown
### Batch N - <description>

| #      | Item              | File/Area                    | Status |
| ------ | ----------------- | ---------------------------- | ------ |
| 1      | `Work item`       | `src/app/path/or/feature`    | ⬜     |
| 2      | `Work item`       | `src/app/path/or/feature`    | ⬜     |
| DoD    | Validate batch    | DoD / validation script      | ⬜     |
| Thomas | Verify this batch | `sdlc-thomas` (if available) | ⬜     |

**Verify:** `<command>` -> `<command>` -> check <routes/tests/scenarios>
**DoD Gate:** Invoke `skill:<dod-skill-name>` (or run the inline DoD criteria) against this batch's output using a validation subagent. This step is **mandatory and cannot be skipped**. Mark the DoD row ✅ only after the subagent confirms all criteria pass. If any criterion fails, fix the failure, log the correction in `lessons.md`, and re-run the gate before proceeding to the next batch.
**Thomas Gate (if available):** After the DoD Gate passes, dispatch `skill:sdlc-thomas` as a subagent to execute every check itself and confirm witnessed passing output. Thomas will also verify that all tracking-list rows for this batch — including the DoD row — are marked ✅ in `plan.md`. Mark the Thomas row ✅ only after Thomas issues an **APPROVED** verdict. If Thomas returns **NOT APPROVED**, the batch is not complete.
```

Status values:

- `⬜` pending
- `🔄` in progress
- `✅` completed

When creating the plan, default new items to `⬜` unless preserving status from an existing document.

---

## Lessons File

Every plan folder contains a `lessons.md` sibling of `plan.md`, but this
skill does **not** own it. The `sdlc-lessons-learned` skill owns
the full lifecycle of `lessons.md` — its template, initialization, reads,
and appends.

Rules for this skill:

- Always dispatch `sdlc-lessons-learned` in `init <topic>` mode
  when creating a new plan folder. Do not skip it even if the plan is
  small — the file is the execution phase's memory.
- Never write or overwrite `lessons.md` from this skill. If the
  `sdlc-lessons-learned` skill is not available, surface the
  missing dependency to the user instead of inlining a template.
- Do not pre-populate lesson entries. Lessons are earned during
  execution, not predicted during planning.
- If the project also maintains a team-level or cross-plan lessons file,
  the per-plan file owned by `sdlc-lessons-learned` does **not**
  replace it. This one is scoped to the plan's execution; the team-level
  one persists across plans.
- **User corrections are logged automatically.** Any time the user corrects the agent's approach, output, or reasoning during a session, the executor must immediately dispatch `sdlc-lessons-learned` in `append` mode — without being asked. The entry must describe what was wrong and what the correct approach is.
- **Agent mistakes are logged automatically.** Any time the agent detects it has made an error (wrong file, wrong logic, wrong assumption), it must fix the error first, then immediately dispatch `sdlc-lessons-learned` in `append` mode to record what went wrong and how it was corrected. This is not optional and must not be deferred to the end of the session.

---

## Output Flow

Follow this flow every time the skill is used:

1. Research the current state.
2. Design the execution approach and batch structure.
3. Write `plan.md` using the 3-section structure.
4. **Dispatch `sdlc-lessons-learned` in `init <topic>` mode** to
   initialize `lessons.md` in the same folder. **This step is
   mandatory.** Do not stop before it is done.
5. Run the council detection check (Phase 4): offer `sdlc-council` if installed,
   otherwise execute the plan directly using the `## Execution Config` from
   `plan.md`. Either way, execution starts without requiring further user input.

Throughout every execution session that uses this plan:

- **After every user correction:** dispatch `sdlc-lessons-learned` in `append` mode immediately. Do not batch corrections to the end of the session.
- **After every agent mistake caught and corrected:** fix the error first, then dispatch `sdlc-lessons-learned` in `append` mode immediately. Do not skip this step.
- **After every batch with a DoD Gate:** spawn a validation subagent to run all DoD criteria before advancing. The DoD row in the batch table must be ✅ before the next batch starts.
- **After every batch (if `sdlc-thomas` is available):** dispatch `skill:sdlc-thomas` as a subagent after the `Verify` step (and after the DoD Gate, if present). Thomas executes every check itself, then verifies that all tracking-list rows for the batch are ✅ in `plan.md`. The Thomas row must be ✅ before the next batch starts.
- **Final batch — full plan review (if `sdlc-thomas` is available):** the last batch in every plan must include a Thomas Gate that covers the entire plan, not just the final batch. Thomas re-runs the full validation suite, reviews every section of `plan.md` to confirm all rows are ✅, and issues a final **APPROVED** or **NOT APPROVED** verdict for the plan as a whole. This is Thomas's end-to-end sign-off. The plan is not complete until this verdict is **APPROVED**.

If the user asked to continue an existing plan, update `plan.md` from the
first incomplete or outdated batch, leave `lessons.md` untouched (it is
owned by `sdlc-lessons-learned`), and do not execute as part of
this skill.

---

## Batching Rules

- Default to batches of 4 items maximum.
- Prefer grouping by user-visible outcome or tightly related files.
- Do not mix unrelated risk areas in the same batch.
- If a single item is large enough to need isolated validation, give it its own batch.
- Each batch should leave the executor with a coherent validation target.

---

## Validation Rules

- Define validation in the plan before implementation begins.
- Search the codebase first to discover the project's relevant commands before writing any `Verify` line.
- Prioritize commands found in `Taskfile.yml`, `package.json`, `README.md`, pipeline files, existing plan documents, and other repo-local sources of truth.
- Use the project's standard commands when they exist.
- When the task affects runtime behavior, specify the manual checks the executor must perform.
- If validation cannot yet be determined, record the gap explicitly in the plan rather than inventing commands.
- **If the user supplies a DoD or validation script:** record it verbatim in the plan under `## Definition of Done` and attach it to every batch. Each batch must include a `DoD Gate` step. A validation subagent **must** be spawned to execute every DoD criterion after the batch lands — this is non-negotiable and cannot be deferred. The subagent must report pass/fail for each criterion; any failure means the batch is not complete until fixed and re-validated.

---

## Decision Points

### When To Create A Plan Folder

- Create `plans/<topic>/` with `plan.md` + `lessons.md` when the user asks
  for a document, wants persistent tracking, or the work spans multiple
  batches.
- If the user wants only an in-chat plan (explicitly no file), use the same
  3-section structure in the response and skip the folder. This is the
  exception, not the default.
- If the project already has a different planning root (`tasks/`,
  `docs/plans/`, etc.), match it — consistency with existing convention
  wins over the default.

### When To Execute Immediately

This skill does not execute immediately.

If the user also wants implementation, finish the plan first and then transition to a separate execution phase that uses the plan as input.

### When To Mark Something Out Of Scope

- Mark it out of scope when it changes business logic beyond the requested work.
- Mark it out of scope when it touches shared infrastructure with likely cross-feature impact.
- Mark it out of scope when it is cleanup that is not required to complete the requested outcome.

---

## Quality Bar

- The plan must be specific enough that each batch can be executed without re-planning the whole task.
- The plan must describe execution, but must not perform execution.
- Each batch must have a clear validation path.
- The tracking list must be usable as a working checklist during implementation.
- The final output must clearly distinguish in-scope work, out-of-scope work, assumptions, and deferred items.
- The output is a **folder** (`plans/<topic>/`) containing `plan.md` and a
  `lessons.md` initialized through the `sdlc-lessons-learned`
  skill. A single loose `.md` file at project root is no longer acceptable
  unless the user explicitly requested an in-chat-only plan.
