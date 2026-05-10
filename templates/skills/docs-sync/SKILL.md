---
name: docs-sync
description: "Keep project documentation aligned with code changes. Use when: syncing docs after code changes, updating AGENTS.md, updating ARCHITECTURE.md, updating README.md, updating copilot-instructions.md, updating CLAUDE.md, detecting doc drift, running pre-merge documentation check, ensuring docs are current with main branch."
argument-hint: "optional base branch (defaults to origin/main)"
---

# Documentation Sync

Keep `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` aligned with actual code changes in the branch.

## When to Use

- Before merging a feature branch — ensure docs reflect new code
- After significant structural changes (new apps, libs, tasks, configs)
- When the agent detects references to files, tasks, or components that no longer exist or are newly introduced

## Target Files

| File                              | Governs                                     | Key Sections to Watch                                                                  |
| --------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `AGENTS.md`                       | AI agent workflows, key commands            | Key Workflows, Database Operations, Edit Configuration                                 |
| `ARCHITECTURE.md`                 | System design, components, directory tree   | System Components, Directory Structure, Configuration, Tests, Data Flow                |
| `README.md`                       | Setup guide, prerequisites, quick start     | Prerequisites, Environment Configuration, Documentation links                          |
| `CLAUDE.md`                       | Claude/agent session rules, essential rules | Essential Rules, Quick Reference                                                       |
| `.github/copilot-instructions.md` | Copilot context, navigation, file index     | Project Overview, Documentation Structure, Quick Navigation, Where to Find Information |

## Procedure

### Step 1 — Collect the diff

Use the base ref provided by the caller, default to `origin/main`.

```bash
git fetch origin
git diff origin/main...HEAD --name-status
```

Capture the full list of added (`A`), modified (`M`), deleted (`D`), and renamed (`R`) files.

### Step 2 — Classify changes

Scan the diff output and determine which documentation files are potentially affected. Use these heuristics:

- **Structural changes** (new/removed/renamed directories, apps, libs, services) → `ARCHITECTURE.md` (Components, Directory Structure), `README.md`, `copilot-instructions.md`
- **Build/task changes** (task definitions, build scripts, orchestration) → `AGENTS.md` (Workflows), `ARCHITECTURE.md` (Orchestration)
- **Configuration changes** (env vars, settings templates, port numbers) → `ARCHITECTURE.md` (Configuration), `README.md` (Setup)
- **Infrastructure changes** (Docker files, compose files, CI pipelines, deployment manifests) → `ARCHITECTURE.md` (Infrastructure, Ports, Directory Structure)
- **Dependency changes** (package manifests, requirements files) → `ARCHITECTURE.md` (Components), `README.md` (Prerequisites)
- **Agent/skill/instruction changes** (new or modified customization files in `.claude/` or `.github/instructions/`) → `copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`
- **Renamed or moved files** that are referenced in any doc → All four files
- **Database or migration changes** → `AGENTS.md` (Database Operations)
- **Other file changes** (not matching above heuristics) → Log and continue; do not force documentation updates for unrelated code changes. Notify the user if significant non-doc files changed but no documentation updates are warranted.

If no changes match any heuristic, report "Docs are up to date" and stop.

### Step 3 — Read current docs and changed files

Read each of the five target documentation files **in full**. Then read the content of every changed file that matched a pattern in Step 2. This is required to understand what the docs currently say and what the code now does.

### Step 4 — Detect drift

For each target file, compare its current content against the reality of the codebase after the branch changes. Look for:

1. **Stale references** — Paths, file names, task names, env vars, or port numbers that no longer exist.
2. **Missing entries** — New components, tasks, env vars, directories, or workflows not yet documented.
3. **Incorrect descriptions** — Text that contradicts the actual behavior of changed code.
4. **Structural mismatches** — Directory trees in ARCHITECTURE.md that don't reflect the actual layout.

### Step 5 — Present the update plan

**Do NOT edit files yet.** Present a structured plan to the user, grouped by file. Each item should state the action (Add / Update / Remove), the target section, and what triggered it from the diff.

Format:

```
## Documentation Sync Plan

### <filename>
- [ ] <Add|Update|Remove> — <section name>: <what changed and why, referencing the diff>

### <filename>
- (no changes needed)
```

If no drift is detected for a file, state: `(no changes needed)`.

### Step 6 — Apply approved changes

After the user reviews and approves (or adjusts) the plan:

1. Edit each file applying **only** the approved changes.
2. Preserve the existing writing style, heading structure, and formatting of each file.
3. Do NOT rewrite sections that are already correct.
4. Do NOT add content unrelated to the branch diff.
5. For the **Directory Structure** section in `ARCHITECTURE.md`: auto-regenerate the tree from the actual filesystem using `tree` or `ls -R`, then format it to match the existing indentation and annotation style (inline comments explaining purpose). Only include directories and key files shown in the current tree — do not dump every file.

### Step 7 — Verify

After edits, re-read each modified file and confirm:

- No broken markdown links to files that exist in the repo.
- No references to deleted files or tasks.
- Directory trees match actual `ls` output for the depicted paths.
- Tables are syntactically valid markdown.
- **Cross-references between the five docs are consistent**: every link from one target file to another resolves to a heading or file that actually exists (e.g., README.md links to `ARCHITECTURE.md` sections, `copilot-instructions.md` links to `AGENTS.md`, `CLAUDE.md` links to `AGENTS.md`/`ARCHITECTURE.md`, etc.). Flag any broken or orphaned cross-links.

Report the verification result to the user.

## Constraints

- NEVER apply edits without showing the plan first.
- NEVER rewrite documentation sections that are unaffected by the diff.
- NEVER invent features or components not evidenced by the diff.
- ALWAYS use three-dot diff syntax (`origin/main...HEAD`) to scope to branch-only changes.
- ALWAYS preserve the existing tone, structure, and formatting conventions of each file.
- If the base branch is not `main`, the caller must specify it explicitly.

## Output Format

### Sync Summary

One-paragraph summary: how many files need updates, severity (cosmetic, structural, or missing coverage).

### Update Plan

Grouped by file, with checkboxes for each proposed change (as shown in Step 5).

### Post-Apply Verification

After applying, a short confirmation listing files edited and any warnings.
