---
name: sdlc-wizard-openspec-feature
description: >
  Guided wizard for the full OpenSpec spec-driven development lifecycle.
  Asks the user, in plain language, what stage of the work they are at —
  exploring an idea, proposing a new feature, breaking it down, building
  it, checking it, or wrapping it up — and runs the matching OpenSpec
  command (`openspec` CLI or `/opsx:*` slash command) end-to-end. Covers
  every OpenSpec flow: explore, propose, new, continue, ff, apply,
  verify, sync, archive, bulk-archive, onboard, status, list, validate,
  update. USE FOR: starting a new feature with OpenSpec, continuing work
  on an existing change, finishing/archiving a change, asking "what
  should I do next" inside an OpenSpec project, learning the workflow.
  DO NOT USE FOR: installing/initializing OpenSpec (that is handled by
  `sdlc-wizard`), generic planning without OpenSpec, projects with no
  `openspec/` folder.
argument-hint: 'Optional: a stage keyword (explore|propose|plan|build|check|finish), a change name, or a free-form description'
---

# OpenSpec Feature Wizard

A single, didactic entry point for the entire
[OpenSpec](https://github.com/Fission-AI/OpenSpec) workflow. The wizard
asks **what stage of the work the user is at** — using plain-language
labels (not raw `/opsx:*` names) — then runs the right OpenSpec command
end-to-end and explains what just happened.

This skill **owns every OpenSpec flow**. It does not hand off to other
skills for the expanded-mode commands; it executes them directly through
the `openspec` CLI and the `/opsx:*` slash commands installed by
`openspec init` / `openspec update`.

## Preconditions

Before showing any menu, verify the project is OpenSpec-ready:

1. `openspec/config.yaml` exists at the project root.
2. The `openspec` CLI is on PATH (`openspec --version`).

If either check fails, stop and tell the user:

> "OpenSpec is not initialized in this project. Run the `sdlc-wizard`
> skill and choose the **OpenSpec** step (or run `npm install -g
> @fission-ai/openspec@latest && openspec init` manually) before using
> this wizard."

If `openspec config profile` is set to `core` and the user wants any
expanded-mode action (anything other than explore / propose / apply /
archive), offer to switch:

> "That action lives in OpenSpec's expanded workflow. Run
> `openspec config profile` (select **workflows**) and `openspec
> update`? — y/N"

If yes, run those two commands, then continue.

## Step 1 — Detect current state

Run `openspec list` (and inspect `openspec/changes/`) to find:

- **Active changes**: subdirectories of `openspec/changes/` that are not
  inside `archive/`.
- For each active change, inspect:
  - Which planning artifacts exist (`proposal.md`, `specs/`,
    `design.md`, `tasks.md`).
  - Whether `tasks.md` still has unchecked `[ ]` items.

Classify the project:

| State | Signal |
|-------|--------|
| **Empty** | No active changes |
| **Planning** | Active change(s) missing one or more required artifacts |
| **Implementing** | All artifacts present, `tasks.md` has unchecked items |
| **Ready to finish** | All tasks `[x]` complete |

If the user passed an explicit stage keyword or change name as an
argument, skip the menu and jump to Step 3.

## Step 2 — Ask the user what stage they are at

Show a numbered menu using **didactic, plain-language labels**. Map
each label to the underlying OpenSpec command(s) but do not lead with
the raw command names. Only show the actions that make sense for the
detected state.

### Stage A — Starting something new (always shown)

| # | Plain-language label | What happens | Underlying command |
|---|----------------------|--------------|--------------------|
| 1 | **Think out loud first** — explore an idea, no files created | The wizard asks a topic and runs an exploratory conversation that searches the codebase. | `/opsx:explore` |
| 2 | **Propose a new feature** (recommended) — one shot: create a change folder + proposal + specs + design + tasks | Asks for a kebab-case name or description, then scaffolds everything in one go. Best when the scope is clear. | `/opsx:propose <name>` |
| 3 | **Plan a new change step by step** — scaffold first, write each artifact one at a time | For complex changes where the user wants to review each artifact before the next is created. | `/opsx:new <name>` then `/opsx:continue` |
| 4 | **Plan a new change in one batch** — scaffold + create all planning artifacts back-to-back | Same outcome as #2 but uses the expanded-mode pair (`new` + `ff`) so each artifact step is visible. | `/opsx:new <name>` then `/opsx:ff` |

### Stage B — Continuing planning (shown only if any change is in *Planning*)

| # | Plain-language label | What happens | Underlying command |
|---|----------------------|--------------|--------------------|
| 5 | **Write the next planning artifact** — proposal → specs → design → tasks | Creates the next ready artifact in the dependency chain and stops. | `/opsx:continue [change]` |
| 6 | **Finish all planning artifacts now** | Creates every remaining planning artifact for the change in one pass. | `/opsx:ff [change]` |

### Stage C — Building (shown only if any change is in *Implementing*)

| # | Plain-language label | What happens | Underlying command |
|---|----------------------|--------------|--------------------|
| 7 | **Build it** — work through `tasks.md` and check items off | Implements the unchecked tasks one by one and marks them `[x]`. Resumable. | `/opsx:apply [change]` |

### Stage D — Wrapping up (shown only if any change is *Ready to finish*)

| # | Plain-language label | What happens | Underlying command |
|---|----------------------|--------------|--------------------|
| 8 | **Check the work** — verify implementation matches the artifacts | Reports completeness, correctness, and coherence with CRITICAL/WARNING/SUGGESTION levels. Does not block archive. | `/opsx:verify [change]` |
| 9 | **Promote specs into the main spec set** (optional) | Merges the change's delta specs into `openspec/specs/`. The change stays active. Archive will offer to do this for you. | `/opsx:sync [change]` |
| 10 | **Wrap up the change** — archive it (and sync specs if needed) | Moves the change to `openspec/changes/archive/YYYY-MM-DD-<name>/` and prompts to sync delta specs first. | `/opsx:archive [change]` |

### Stage E — Housekeeping (always shown)

| # | Plain-language label | What happens | Underlying command |
|---|----------------------|--------------|--------------------|
| 11 | **Wrap up several finished changes at once** | Lists every completed change, resolves spec conflicts, archives them in chronological order. | `/opsx:bulk-archive` |
| 12 | **Walk me through OpenSpec on this codebase** — guided tutorial | Runs the interactive tutorial that picks a real, small improvement and takes it through the full workflow. | `/opsx:onboard` |
| 13 | **Show me what's going on** — list active changes and their status | Prints active changes, artifact status, and remaining tasks. | `openspec list` and `openspec status --change <name>` |
| 14 | **Validate OpenSpec files** — check change/spec structure | Surfaces structural problems in the `openspec/` tree. | `openspec validate` |
| 15 | **Refresh OpenSpec slash commands** | Re-installs `/opsx:*` definitions after upgrading the package or changing the profile. | `openspec update` |

If multiple active changes exist and the chosen action targets one of
them, ask the user **which change** before running anything (offer the
list from Step 1, including artifact + task progress).

## Step 3 — Confirm and dispatch

Before running any command:

1. Restate what is about to happen in one sentence, e.g.
   > "I'll wrap up `add-dark-mode`: archive it and sync its delta
   > specs into `openspec/specs/`."
2. Show the exact command(s) that will run.
3. Get explicit confirmation (`y/N`).
4. Run.

Dispatch rules:

- **CLI commands** — run directly in the terminal:
  - `openspec list`
  - `openspec status --change <name>`
  - `openspec validate`
  - `openspec config profile`
  - `openspec update`
  - `openspec new change <name>` (used internally by `/opsx:new`)
- **`/opsx:*` slash commands** — these are AI-assistant commands, not
  shell commands. Execute them by **following the procedure below for
  each one**. The wizard owns the procedure end-to-end; do not bounce
  the user to another skill.

### `/opsx:explore` — exploratory conversation

1. Ask the user: "What would you like to explore?"
2. Investigate the codebase (read files, search) to answer.
3. Compare options when relevant; produce diagrams if helpful.
4. Do **not** create any files.
5. When the user is ready to commit to a change, offer to jump to
   action **#2 Propose a new feature** (or **#3/#4** in expanded mode).

### `/opsx:propose <name>` — one-shot change creation

1. Ask for a change name (kebab-case) or description; derive the name
   from the description if needed (e.g., "add user auth" →
   `add-user-auth`).
2. Run `openspec new change "<name>"` to scaffold
   `openspec/changes/<name>/`.
3. Generate every planning artifact required by the configured schema
   (`spec-driven` by default): `proposal.md`,
   `specs/<capability>/spec.md`, `design.md`, `tasks.md`. Use the change
   name and the user's intent; read `openspec/config.yaml` for project
   context and per-artifact rules.
4. Confirm: "Ready for implementation. Run action **#7 Build it** when
   you're ready."

### `/opsx:new <name>` — scaffold only (expanded mode)

1. Ask for a kebab-case name; reject vague names (`update`, `wip`,
   `changes`).
2. Run `openspec new change "<name>"`.
3. Report the schema in use and which artifact is ready next.
4. Offer the user: "Use action **#5** to write artifacts one at a time,
   or action **#6** to fast-forward through all of them."

### `/opsx:continue [change]` — next artifact only

1. If no change name is given and only one is active, use it; if many
   are active, ask which.
2. Inspect the artifact dependency graph for that change. Show the
   user a status table: `✓ done`, `◆ ready`, `○ blocked (needs: …)`.
3. Pick the first **ready** artifact, read its dependencies for context,
   and create it using the schema's template.
4. Stop. Report what just became available next.

### `/opsx:ff [change]` — fast-forward planning

1. Resolve the change as in `/opsx:continue`.
2. Walk the dependency graph; for each artifact, read its dependencies
   and create it.
3. Stop when every `apply-required` artifact exists.
4. Confirm: "Planning complete. Run action **#7 Build it** when ready."

### `/opsx:apply [change]` — implement tasks

1. Resolve the change.
2. Read `tasks.md` and list the unchecked items.
3. Work through them in order. For each task: implement, run tests if
   relevant, then flip the checkbox to `[x]` in `tasks.md`.
4. The flow is resumable — interruption just leaves checkboxes as-is.
5. After all tasks pass, suggest action **#8 Check the work**.

### `/opsx:verify [change]` — validate implementation

1. Resolve the change.
2. Search the codebase for evidence of each requirement and scenario.
3. Report findings under three headings: **Completeness**,
   **Correctness**, **Coherence**, with each item tagged
   CRITICAL / WARNING / SUGGESTION.
4. End with a summary line: `Critical issues: N · Warnings: N · Ready
   to archive: Yes/No (with warnings)` and 1-3 recommendations.
5. Verify never blocks archive on its own — surface the issues and let
   the user decide.

### `/opsx:sync [change]` — merge delta specs

1. Resolve the change.
2. Read each spec under `openspec/changes/<change>/specs/` and parse
   `## ADDED`, `## MODIFIED`, `## REMOVED`, `## RENAMED` sections.
3. For each target spec under `openspec/specs/`, apply the delta
   intelligently — preserve content not mentioned in the delta; do not
   duplicate scenarios.
4. Report which spec files were updated. The change stays active.

### `/opsx:archive [change]` — finalize a change

1. Resolve the change.
2. Print the artifact + task status. Warn if any task is still `[ ]`.
3. If delta specs are not yet synced, ask: "Sync delta specs into
   `openspec/specs/` first? (recommended) y/N". If yes, run the
   `/opsx:sync` procedure above.
4. Move the change folder to
   `openspec/changes/archive/YYYY-MM-DD-<name>/` (today's date).
5. Confirm: "Change archived. Ready for the next feature."

### `/opsx:bulk-archive` — archive several changes

1. List every change with all tasks complete.
2. Detect spec conflicts across them (multiple changes touching the
   same spec file).
3. For conflicting specs, inspect the codebase to confirm what is
   actually implemented, then plan to apply deltas in chronological
   order of creation.
4. Show the plan and ask for confirmation.
5. Archive each one (running the `/opsx:archive` procedure per change).

### `/opsx:onboard` — guided tutorial

1. Welcome the user; explain that this will pick a real, small
   improvement from their codebase and run the full OpenSpec lifecycle.
2. Scan the codebase for 2-3 candidate improvements (e.g., add input
   validation, improve error messages, add a loading state).
3. Let the user pick one (or suggest their own).
4. Walk through, narrating each step:
   `/opsx:new` → write proposal → write specs → write design → write
   tasks → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`.
5. End with a summary of the artifacts created and a pointer to the
   normal wizard flow.

## Step 4 — Report and loop

After any dispatched action returns:

1. Summarize what was created/changed (new artifacts, tasks completed,
   change archived, etc.).
2. Recommend the next stage based on the new state. Use the canonical
   path:

   ```
   explore? → propose / plan → build → check → finish
   ```

3. Ask: "Run another OpenSpec action?" If yes, go back to **Step 1**.

## Reference: command cheat sheet

| OpenSpec command | Purpose |
|------------------|---------|
| `openspec init` | Initialize OpenSpec (handled by `sdlc-wizard`, not here) |
| `openspec update` | Refresh AI guidance and `/opsx:*` slash commands |
| `openspec list` | List active changes |
| `openspec status --change <name>` | Artifact + task status of a change |
| `openspec validate` | Validate change/spec structure |
| `openspec config profile` | Switch between `core` and expanded workflow |
| `/opsx:explore` | Investigate without creating artifacts |
| `/opsx:propose <name>` | One-shot: create change + all planning artifacts |
| `/opsx:new <name>` | Scaffold a change folder (expanded mode) |
| `/opsx:continue [name]` | Create the next artifact in the dependency chain |
| `/opsx:ff [name]` | Create all remaining planning artifacts at once |
| `/opsx:apply [name]` | Implement tasks from `tasks.md` |
| `/opsx:verify [name]` | Validate implementation against artifacts |
| `/opsx:sync [name]` | Merge delta specs into `openspec/specs/` |
| `/opsx:archive [name]` | Finalize and archive the change |
| `/opsx:bulk-archive` | Archive multiple completed changes at once |
| `/opsx:onboard` | Guided tutorial on the user's own codebase |

## Anti-patterns

- **Do not** invent spec/proposal/design/tasks content that ignores
  `openspec/config.yaml`. Always read project context and per-artifact
  rules before generating an artifact.
- **Do not** edit files inside `openspec/changes/archive/` — archived
  changes are read-only history.
- **Do not** assume which active change the user means when more than
  one exists; always ask.
- **Do not** run `openspec init` from this wizard. Initialization is
  owned by `sdlc-wizard`.
- **Do not** lead with raw `/opsx:*` names in the menu — use the plain
  language labels so the user understands the *stage* they are picking.
