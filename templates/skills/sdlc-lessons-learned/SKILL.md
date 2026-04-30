---
name: sdlc-lessons-learned
description: >
  Standalone lessons-learned skill. Logs problems, mistakes, and
  non-obvious patterns discovered during a working session into a
  `lessons.md` file at a caller-supplied location. USE FOR: initializing,
  reading, or appending entries to a `lessons.md` log. DO NOT USE FOR:
  writing implementation plans, running code changes, or producing
  generic best-practice documents.
argument-hint: 'init <path> | read <path> | append <path> "<short-title>"'
---

# Lessons Learned

A self-contained skill for capturing lessons during any working session.
The caller decides **where** the `lessons.md` lives by passing a path;
this skill only owns **how** it is created, read, and appended to.

## Location

The caller passes a target location as the first argument. It may be
either:

- A directory path → the skill writes/reads `<path>/lessons.md`.
- A file path ending in `.md` → the skill uses that file directly.

The skill never invents a location. If no path is given, ask the caller
for one before doing anything.

## Modes

### 1. `init <path>`

Create the `lessons.md` file at the resolved location if and only if it
does not already exist. Never overwrite an existing file. The initial
content is exactly:

```markdown
# Lessons Learned

_Append an entry whenever the user corrects an approach, something fails
in a non-obvious way, or a pattern worth remembering is discovered. Read
this file at the start of every working session._

## Format

Each lesson follows this structure:

### [YYYY-MM-DD] — [Short Title]
**Context:** What was happening when this was discovered
**Mistake:** What went wrong (or what was nearly missed)
**Rule:** The rule to prevent recurrence
**Applies to:** [file, area, or task]

---

_No lessons recorded yet._
```

### 2. `read <path>`

Return the full contents of the `lessons.md` at the resolved location.
If the file does not exist, return an empty result and tell the caller
no prior lessons exist at that location. Callers should read lessons at
the start of a session before acting.

### 3. `append <path> "<short-title>"`

Append a new lesson entry to the bottom of the file. Each entry uses
this format:

```markdown
### [YYYY-MM-DD] — <Short Title>
**Context:** <one or two sentences>
**Mistake:** <what went wrong or was nearly missed>
**Rule:** <the rule to prevent recurrence>
**Applies to:** <file, area, or task>
```

Rules:

- One lesson per entry. Do not batch multiple unrelated lessons.
- Keep `Rule` short and prescriptive — it must be actionable as a check
  next time.
- If the file still has the `_No lessons recorded yet._` placeholder
  line, remove the placeholder when adding the first entry.
- Use today's date in `YYYY-MM-DD` format.
- If the file does not exist when `append` is invoked, run `init` first,
  then append.

## When To Append A Lesson

Append whenever any of the following happens during a session:

- The user corrects an approach you chose.
- Something fails for a non-obvious reason and the diagnosis is worth
  remembering.
- A recurring pattern in this codebase or environment is discovered.
- A disagreement is resolved and the resolution should be remembered.

Do **not** append:

- Pre-emptive or speculative lessons. Lessons are earned, not predicted.
- Generic best practices that aren't specific to this project, codebase,
  or recurring situation.

## Quality Bar

- Every lesson entry has all four fields filled in.
- No lesson entry exceeds a small handful of lines — long write-ups
  belong in code comments or design docs, not here.
- The file is append-only during a session. Editing or deleting prior
  entries requires explicit user instruction.
