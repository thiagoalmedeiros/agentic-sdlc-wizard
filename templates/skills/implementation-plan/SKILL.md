---
name: implementation-plan
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
4. Search the codebase to identify the relevant validation path: inspect files such as `Taskfile.yml`, `package.json`, `README.md`, CI configs, and existing docs to determine which build, test, runtime, and manual verification commands are actually used by the project.
5. Group the work into batches of at most 4 items.

### Phase 2 - Design The Plan

Turn discovery into an execution-ready plan:

1. Define the in-scope workstreams.
2. Describe the implementation method at a level that removes ambiguity for the executor.
3. Separate non-goals and deferred work from the main plan.
4. Build a tracking list that can be used during execution without restructuring the document.
5. Attach concrete validation expectations to each batch.

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
- If the folder does not exist, create both files:
  - `plan.md` — populated immediately using the Output Structure below.
  - `lessons.md` — initialized with the header shown in the "Lessons File"
    section; left otherwise empty for the execution phase to append to.
- If the folder already exists, read `plan.md` first, preserve completed
  status items, and update it in place. Do **not** overwrite `lessons.md` —
  it belongs to the execution phase.

Always use the exact section structure defined in the Output Structure
section below for `plan.md`.

### Phase 4 - Handoff

Stop after `plan.md` is complete and `lessons.md` is initialized. Do not
execute the plan.

If execution is requested later, the plan folder becomes the source of truth
for that work:

- The executor updates status values in `plan.md` as batches land.
- The executor appends to `lessons.md` whenever the user corrects an
  approach, a batch fails review, or a non-obvious pattern is discovered.
- This skill is responsible for defining plan content and initializing the
  lessons file; it is not responsible for appending execution lessons.

---

## Output Structure

Every implementation plan must use exactly these 3 sections.

### Section 1 - What We Are Doing

Use a numbered list of the actual changes or workstreams being delivered.

Rules:

- Each item must have a bold title and a short explanation.
- Describe the outcome, not just the mechanism.
- Keep this section scoped to in-scope work only.

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

Use this table shape:

```markdown
### Batch N - <description>

| #   | Item        | File/Area                 | Status |
| --- | ----------- | ------------------------- | ------ |
| 1   | `Work item` | `src/app/path/or/feature` | ⬜     |
| 2   | `Work item` | `src/app/path/or/feature` | ⬜     |

**Verify:** `<command>` -> `<command>` -> check <routes/tests/scenarios>
```

Status values:

- `⬜` pending
- `🔄` in progress
- `✅` completed

When creating the plan, default new items to `⬜` unless preserving status from an existing document.

---

## Lessons File

Every plan folder contains a `lessons.md` sibling of `plan.md`. This skill
**initializes** it; the execution phase **appends** to it.

Initialize `lessons.md` with exactly this header and nothing else:

```markdown
# Lessons — <Topic Title>

_Per-plan execution lessons. Append an entry whenever the user corrects an
approach, a batch fails review, or a non-obvious pattern is discovered
during implementation of this plan. Read this file at the start of every
execution session._

## Format

Each lesson follows this structure:

### [YYYY-MM-DD] — [Short Title]
**Context:** What was happening when this was discovered
**Mistake:** What went wrong (or what was nearly missed)
**Rule:** The rule to prevent recurrence
**Applies to:** [batch name or file/area]

---

_No lessons recorded yet. This file will grow as the plan is executed._
```

Rules for this skill:

- Create `lessons.md` alongside `plan.md`. Do not skip it even if the plan
  is small — the file is the execution phase's memory.
- Do not pre-populate lesson entries. Lessons are earned during execution,
  not predicted during planning.
- If the project also maintains a team-level or cross-plan lessons file,
  this per-plan file does **not** replace it. This one is scoped to the
  plan's execution; the team-level one persists across plans.

---

## Output Flow

Follow this flow every time the skill is used:

1. Research the current state.
2. Design the execution approach and batch structure.
3. Create or update the plan folder: write `plan.md` using the 3-section
   structure and initialize `lessons.md` with the template header.
4. Stop once the plan folder is complete, unless the user explicitly asks
   to transition into a separate execution workflow.

If the user asked only for planning, the completed plan folder is the final
output.

If the user asked to continue an existing plan, update `plan.md` from the
first incomplete or outdated batch, leave `lessons.md` untouched, and do
not execute as part of this skill.

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
- The output is a **folder** (`plans/<topic>/`) containing `plan.md` and an
  initialized `lessons.md`. A single loose `.md` file at project root is no
  longer acceptable unless the user explicitly requested an in-chat-only
  plan.
