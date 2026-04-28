---
name: sdlc-wizard-lessons-learned
description: >
  Standard lessons-learned skill. Owns the lifecycle of every plan's
  `plans/<topic>/lessons.md` file: initializing it next to `plan.md`,
  reading prior lessons before each execution session, and appending new
  entries when the user corrects an approach, a batch fails review, or a
  non-obvious pattern is discovered. USE FOR: creating, reading, or
  appending entries to a per-plan `lessons.md`. DO NOT USE FOR: writing
  `plan.md` (that's `sdlc-wizard-implementation-plan`), running batches, or
  global cross-plan notes.
argument-hint: 'init <topic> | read <topic> | append <topic> "<short-title>"'
---

# Lessons Learned

The standard skill that owns the per-plan `lessons.md` file. Every other
skill in this workflow defers to this skill whenever it needs to
initialize, read, or append a lesson. There is no inline `lessons.md`
template duplicated elsewhere — the source of truth is here.

## Where Lessons Live

Per-plan, one file per plan folder:

```
plans/<topic-kebab-case>/
├── plan.md        # owned by sdlc-wizard-implementation-plan
└── lessons.md     # owned by THIS skill
```

There is no global project-root `lessons.md`. If a project also keeps a
team-level cross-plan log, that file is out of scope for this skill.

## Modes

This skill has three modes. Other skills invoke it by name and pass the
plan topic plus the requested mode.

### 1. `init <topic>`

Create `plans/<topic>/lessons.md` if and only if it does not already
exist. Never overwrite an existing file. The initial content is exactly:

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

Replace `<Topic Title>` with the plan's human-readable title (e.g.
`auth-middleware-rewrite` → `Auth Middleware Rewrite`).

### 2. `read <topic>`

Return the contents of `plans/<topic>/lessons.md`. If the file does not
exist, return an empty result and tell the caller no prior lessons exist
for this plan. Callers must read lessons before dispatching the
`sdlc-wizard-coder`, `sdlc-wizard-reviewer`, or `sdlc-wizard-bug-fixer`
skills.

### 3. `append <topic> "<short-title>"`

Append a new lesson entry to the bottom of `plans/<topic>/lessons.md`.
Each entry uses the format declared in `init`:

```markdown
### [YYYY-MM-DD] — <Short Title>
**Context:** <one or two sentences>
**Mistake:** <what went wrong or was nearly missed>
**Rule:** <the rule to prevent recurrence>
**Applies to:** <batch name or file/area>
```

Rules:

- One lesson per entry. Do not batch multiple unrelated lessons.
- Keep `Rule` short and prescriptive — it must be actionable as a check
  next time.
- If the file still has the `_No lessons recorded yet_` placeholder line,
  remove the placeholder when adding the first entry.
- Use today's date in `YYYY-MM-DD` format.

## When To Append A Lesson

Append whenever any of the following happens while a plan is being
executed:

- The user corrects an approach the workflow chose.
- A `sdlc-wizard-reviewer` batch is rejected for a reason that could
  recur on a future batch or future plan.
- The `sdlc-wizard-bug-fixer` skill finds a non-obvious failure pattern.
- The `sdlc-wizard-orchestrator` skill resolves a disagreement between
  skills (record both positions and the resolution).

Do **not** append:

- Pre-emptive lessons during planning. Lessons are earned during
  execution, not predicted up front.
- Generic best practices. Only record what is specific to this plan or to
  a recurring pattern in this codebase.

## Caller Contract

Other skills invoke `sdlc-wizard-lessons-learned` instead of editing
`lessons.md` directly. The caller passes:

1. The plan topic (kebab-case slug used in `plans/<topic>/`).
2. The mode (`init`, `read`, or `append`).
3. For `append`: the short title plus values for `Context`, `Mistake`,
   `Rule`, and `Applies to`.

The caller must not:

- Hard-code the `lessons.md` template inline.
- Skip the `init` step when creating a new plan folder.
- Append a lesson while bypassing this skill (no direct `lessons.md`
  edits from `sdlc-wizard-coder`, `sdlc-wizard-reviewer`,
  `sdlc-wizard-bug-fixer`, or `sdlc-wizard-orchestrator`).

## Quality Bar

- Every plan folder has a `lessons.md` initialized through this skill.
- Every lesson entry has all four fields filled in.
- No lesson entry exceeds a small handful of lines — long write-ups
  belong in the plan or a code comment, not here.
- The file is append-only during execution. Editing or deleting prior
  entries requires explicit user instruction.
