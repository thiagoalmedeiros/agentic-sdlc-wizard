# Task: {{TASK_NAME}}

> **Feature folder:** `tasks/{{FOLDER_NAME}}/`
> **Created:** {{DATE}}
> **Status:** {{STATUS}}
> **Batch:** {{CURRENT_BATCH}} of {{TOTAL_BATCHES}}

---

## 1. Prompt (Intent)

_Use this section as the starting prompt for a new AI chat session. It contains the full intent of the feature._

### Context

{{Describe the project context, what exists today, and why this change is needed.}}

### Goal

{{One clear sentence: what is the desired end state after this task is complete.}}

### Acceptance Criteria

- [ ] {{Criterion 1}}
- [ ] {{Criterion 2}}
- [ ] {{Criterion 3}}

### Constraints

- {{Runtime, language, framework, or dependency constraints}}
- {{Performance or compatibility requirements}}

---

## 2. How (Specification)

### What TO DO

1. {{Step-by-step implementation approach}}
2. {{Each step should be concrete and verifiable}}
3. {{Include file paths, function names, or API endpoints where relevant}}

### What NOT TO DO

- {{Anti-pattern or shortcut to avoid}}
- {{Do not introduce new dependencies unless approved}}
- {{Do not modify files outside the scope of this task}}

### Architecture Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| {{Decision 1}} | {{Why}} | {{What else was considered}} |

---

## 3. Tracking (Flow Session)

### Workflow Orchestration Rules

> _These are reminders. Full definitions live in each agent's skill file._

- **Plan first:** Enter plan mode for any non-trivial task (see `skills/planner/SKILL.md`)
- **Subagent strategy:** Use subagents to keep main context clean; one task per subagent
- **Self-improvement loop:** After any user correction, update the active plan's `plans/<topic>/lessons.md` (see `skills/orchestrator/SKILL.md`)
- **Verify before done:** Never mark complete without proof — tests, logs, correctness (see `skills/reviewer/SKILL.md`)
- **Demand elegance (balanced):** For non-trivial changes, pause and ask "is there a more elegant way?" Skip for simple fixes
- **Autonomous bug fixing:** Diagnose and resolve without hand-holding (see `skills/bug-fixer/SKILL.md`)
- Challenge your own work before presenting it

#### Autonomous Bug Fixing
- See `skills/bug-fixer/SKILL.md` for full process

### Core Principles
- **Simplicity First:** Make every change as simple as possible. Impact minimal code.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Changes should only touch what's necessary. Avoid introducing bugs.

---

### Debate Gate (before user sees any batch)

> _Internal debate gate before user-facing output_

| Agent | Check | Status |
|-------|-------|--------|
| **Benjamin** | Code works, tests pass, matches spec | `pending` |
| **Lucas** | What could go wrong, what's missing | `pending` |
| **Harper** | Approach aligns with architecture | `pending` |
| **Captain** | Synthesize result, document disagreements | `pending` |

**Consensus:** `pending` | `agreed` | `disagreement-documented`

---

### Batch Plan

| Batch | Description | Files | Status |
|-------|-------------|-------|--------|
| 1 | {{Logical group description}} | {{file1, file2, file3}} | `pending` |
| 2 | {{Next logical group}} | {{file4, file5}} | `pending` |
| 3 | {{Final group}} | {{file6}} | `pending` |

> **Batch Flow:** Each batch requires explicit user confirmation before proceeding.
> A new batch is ONLY started with positive confirmation ("yes", "approved", "next").

---

### File Tracking

| File | Agent | Status | Notes |
|------|-------|--------|-------|
| {{path/to/file1}} | Benjamin | `todo` | {{Brief note}} |
| {{path/to/file2}} | Benjamin | `todo` | {{Brief note}} |
| {{path/to/file3}} | Lucas | `todo` | {{Review after batch 1}} |

**Status values:** `todo` | `in-progress` | `review` | `done` | `blocked`

---

### Session Log

| Timestamp | Agent | Action | Outcome |
|-----------|-------|--------|---------|
| {{YYYY-MM-DD HH:MM}} | Captain | Session started | Initial plan created |
| | | | |

---

### Batch Confirmation Log

| Batch | Requested | User Response | Timestamp |
|-------|-----------|---------------|-----------|
| 1 | {{Summary of changes}} | `pending` | |
| 2 | | `not-started` | |

---

_This document is the single source of truth for this task. Captain updates it as work progresses. See the active plan's `plans/<topic>/lessons.md` for per-plan execution learnings._
