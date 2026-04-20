---
name: start-task
description: >
  Task initialization procedure for Captain. Defines how to receive a new
  task, create the task folder and implementation document, run the
  clarification loop, and delegate planning to Harper using the Fantastic 4
  approach. USE FOR: starting any new feature, bug fix, or refactor through
  the multi-agent orchestra. DO NOT USE FOR: continuing an existing task,
  standalone planning without the Fantastic 4 team, or direct code execution.
argument-hint: 'Description of the task to start'
---

# Start Task

This skill defines the procedure Captain follows when a new task is submitted
to the Fantastic 4 multi-agent team. It bridges the orchestrator workflow with
the implementation-plan skill to produce a structured, team-reviewed plan
before any code is written.

## When to Use

- A new task, feature, or bug fix has been submitted by the user.
- The work has not yet been planned or started.
- Captain needs to initialize the task folder and coordinate the team.

## Inputs

- **Task description** — provided by the user (via `$ARGUMENTS` or inline)
- **Orchestrator skill** — loaded for team coordination rules
- **Planner template** — `skills/planner/templates/task-implementation.md`

## Procedure

### 1. Create the Task Folder and Document

- Derive a short kebab-case name from the task description.
- Create `tasks/<name>/task-implementation.md` using the template at
  `skills/planner/templates/task-implementation.md`.
- Fill Section 1 (Prompt) with the task description.

### 2. Run the Clarification Loop

- Read the task description carefully.
- If the intent is already unambiguous and has clear acceptance criteria —
  skip to step 3.
- Otherwise, ask **one focused question at a time** until you can articulate
  the task in one sentence.
- Document any decisions or clarifications in Section 1.

### 3. Delegate Planning to Harper

- Send Harper the filled Section 1 with any codebase context.
- Harper produces Section 2 (How) and the batch plan for Section 3.
- Update the task-implementation doc with Harper's output.

### 4. Present the Plan for Approval

- Present the plan to the user for approval before any code is written.
- Do NOT start implementation until the user explicitly approves the plan.

## Integration with Implementation Plan Skill

When the task warrants a standalone plan artifact (multi-batch work, cross-cutting
changes, or the user explicitly requests a plan document), Captain should
additionally invoke the `implementation-plan` skill to produce a formal
`plans/<topic>/plan.md` alongside the task-implementation doc. The two
artifacts serve complementary purposes:

- `tasks/<name>/task-implementation.md` — the team's working document with
  tracking, session logs, and debate gates.
- `plans/<topic>/plan.md` — the execution-ready plan with batch tables and
  validation commands.

Captain decides whether both artifacts are needed based on task complexity.

## Quality Bar

- The task folder must exist before any planning begins.
- Section 1 must be complete and unambiguous before delegating to Harper.
- The plan must be presented to the user before any implementation starts.
- All decisions and clarifications must be documented in the task document.
