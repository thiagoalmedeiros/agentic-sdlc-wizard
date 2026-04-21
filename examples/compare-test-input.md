# Test Input — `wizard update` Command

> **Purpose:** Use this file as the task description when comparing the
> `implementation-plan` skill (solo planner) against the **Fantastic 4**
> captain approach. Feed the same _Task Description_ section to both, then
> compare the resulting `plans/wizard-update-command/plan.md` artifacts.

---

## How to Use This File

### Path A — Solo `implementation-plan` skill

Invoke the skill with the task description below. Example invocations:

**Claude Code**
```
/implementation-plan [paste the Task Description section below]
```

**VS Code Copilot**
```
@workspace /implementation-plan [paste the Task Description section below]
```

The skill will explore the codebase, produce
`plans/wizard-update-command/plan.md`, and initialize
`plans/wizard-update-command/lessons.md`.

---

### Path B — Fantastic 4 captain

Invoke the captain agent with the same task description. Example
invocations:

**Claude Code**
```
Agent(captain, "[paste the Task Description section below]")
```

**VS Code Copilot**
```
@captain [paste the Task Description section below]
```

The captain will run the clarification loop, delegate planning to Harper,
run the implementation-debate if the task warrants it, and produce the
same `plans/wizard-update-command/plan.md` + `lessons.md` — but shaped
by Benjamin's correctness pass and Lucas's contrarian review before it is
presented to you.

---

## What to Compare

Once both runs are complete, diff or read the two `plan.md` files side by
side and look for:

| Dimension | What to look for |
|-----------|-----------------|
| **Scope completeness** | Did one plan catch workstreams the other missed? |
| **Risk coverage** | Did Lucas's contrarian pass surface failure modes the solo planner skipped? |
| **Batch quality** | Are the batches independently validatable, or do they blur? |
| **Validation commands** | Are the `Verify:` lines concrete and project-specific? |
| **Out-of-scope list** | Did one plan define clearer non-goals? |
| **Architecture decisions** | Did Harper's "Why" section add insight beyond the solo plan? |

---

## Task Description

> Copy everything below this line and paste it as the input to either skill.

---

Add a `wizard update` CLI command to the `agentic-sdlc-wizard` project.

**Goal:** When a user runs `wizard update` in a project that already has the
wizard installed (a `.wizard.json` exists), the command should detect which
skills and agent files were originally installed, compare them against the
current versions bundled in the CLI package, and overwrite any file that
differs. Files that the user has locally modified since install should be
flagged with a warning but not overwritten without confirmation.

**Acceptance criteria:**

1. `wizard update` exits with a clear error if `.wizard.json` does not exist
   in the current directory (i.e. `wizard install` has not been run yet).
2. The command reads `.wizard.json` to determine the install scope
   (`project` vs `global`) and the list of completed install steps.
3. For each step listed in `completedSteps`, the command re-copies the
   corresponding template files from the CLI package to their install
   destination (`.claude/` for project scope, `~/.claude/` for global scope).
4. Before overwriting a file that differs from the packaged version, the
   command checks whether the destination file has been locally modified
   (heuristic: compare content hash against the version that would have been
   written at install time by re-running the same copy logic). If modified,
   print a warning and skip unless `--force` is passed.
5. After the update, `.wizard.json` is updated with the new `version` field
   matching the current CLI package version.
6. The command must be registered in `src/cli.js` under the verb `update` and
   follow the same patterns as the existing `install` command.
7. All new helper logic must be covered by unit tests in `test/` following the
   existing Jest conventions.

**Constraints:**

- Do not introduce new runtime npm dependencies; use only Node.js built-ins
  (`fs`, `crypto`, `path`, `readline`) and what is already in `package.json`.
- The existing `installCommand` function in `src/commands/install.js` must not
  be modified in ways that break the 42 existing tests.
- The `--force` flag must be opt-in; the default behavior is safe (warn, skip).
- Interactive confirmation prompts (if any) must follow the same TTY-detection
  pattern used in `promptScope()` in `src/commands/install.js`.
