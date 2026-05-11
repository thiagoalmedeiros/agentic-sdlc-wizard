---
description: Automatically log every user correction and every agent-detected mistake to a date-stamped session lessons file using skill:sdlc-lessons-learned.
applyTo: "**"
---

# Auto Lessons Logging

## Rule: Always log user corrections automatically

Whenever the user corrects your approach, output, reasoning, or any assumption you made, follow these steps in order:

1. **Detect:** Identify that a user correction has occurred.
2. **Determine path:** Use `sessions/<YYYY-MM-DD>.md` inside the nearest `plans/` directory, or `sessions/<YYYY-MM-DD>.md` in the workspace root if no `plans/` directory exists.
3. **Log entry:** Immediately invoke `skill:sdlc-lessons-learned` in `append` mode with an entry describing what the user corrected, what was wrong, and the rule to prevent recurrence.

Do not wait until the end of the session. Do not batch multiple corrections. This is mandatory and cannot be skipped or deferred.

## Rule: Always log agent-detected mistakes automatically

Whenever you detect that you have made an error (wrong file, wrong logic, wrong assumption, wrong command), you **must**:

1. Fix the error first.
2. Immediately invoke `skill:sdlc-lessons-learned` in `append` mode to record what went wrong and how it was corrected.

Do not wait to be asked. Do not batch to the end of the session.

## Target path for session logs

Log corrections to:

```
sessions/YYYY-MM-DD.md
```

where `sessions/` is the first directory found as a sibling of the active `lessons.md` file, or a top-level `sessions/` folder if no `lessons.md` is in scope. Create the `sessions/` directory if it does not exist. If the `sessions/` directory cannot be created due to a file system error, log an error message to the output pane and notify the user.

## What to record

Each entry must follow the `skill:sdlc-lessons-learned` append format:

```
### [YYYY-MM-DD] — <Short Title>
**Context:** <one or two sentences describing what was happening>
**Mistake:** <what was wrong or what the user corrected>
**Rule:** <the rule to prevent this recurrence>
**Applies to:** <file, area, or task>
```

## What NOT to do

- Do **not** ask the user whether to log.
- Do **not** skip logging because the correction seemed minor.
- Do **not** defer logging to the end of the session.
- Do **not** log speculative or hypothetical mistakes — only actual errors that were made or corrections the user explicitly issued.
