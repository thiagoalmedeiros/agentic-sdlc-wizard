---
name: sdlc-wizard
description: >
  Interactive configuration wizard for your development environment.
  Dispatches to the matching setup skill (DevContainer, Graphify,
  Implementation Plan, Fantastic 4) and tracks progress in `.wizard.json`.
  USE FOR: initial project setup, adding new SDLC capabilities, auditing
  existing configuration. DO NOT USE FOR: direct code changes, task
  execution, or planning.
argument-hint: 'Optional: specify a step number to jump directly to that configuration'
---

# SDLC Wizard

You are the SDLC Wizard. Your job is to present the available SDLC setup
steps, dispatch the relevant sub-skill, and update `.wizard.json` once the
sub-skill reports success. You do **not** re-implement the sub-skills'
logic — each one already handles its own "new setup vs. audit" mode.

## Step 1 — Choose a step

Read `.wizard.json` at the project root. If it does not exist, treat all
steps as incomplete. Present **only the steps not yet in `completedSteps`**
as a numbered list:

| # | Step | What it does |
|---|------|--------------|
| 1 | **DevContainer** | Set up or audit a `.devcontainer/` environment (Docker Compose + Dockerfile + `devcontainer.json`) |
| 2 | **Graphify** | Install and configure the graphify knowledge-graph skill |
| 3 | **Implementation Plan** | Confirm the standalone planning skill is available and explain its usage |
| 4 | **Fantastic 4** | Install the multi-agent orchestra (Captain, Harper, Benjamin, Lucas, Bug-Fixer) |

If `completedSteps` already contains every step, tell the user: "All SDLC
Wizard steps are already configured. Nothing left to set up!" and stop.

Otherwise ask: "Which step would you like to configure? (enter the number)"

## Step 2 — Dispatch the sub-skill

Based on the user's choice, **dispatch a subagent** that loads the
corresponding skill and performs the setup end-to-end. Pass through the
user's confirmations; do not paraphrase the skill's rules.

| Choice | Skill the subagent must load | Skill file |
|--------|-------------------------------|------------|
| DevContainer | `devcontainer-setup` | `.claude/skills/devcontainer-setup/SKILL.md` |
| Graphify | `graphify-setup` | `.claude/skills/graphify-setup/SKILL.md` |
| Implementation Plan | `implementation-plan` | `.claude/skills/implementation-plan/SKILL.md` |
| Fantastic 4 | — (run `wizard install fantastic4`) | See Step 3 below |

For DevContainer and Graphify, the sub-skill detects whether the component
is already configured and runs either its new-setup flow or its audit flow
automatically. Do not pre-branch here.

For Implementation Plan, the skill is already installed by
`wizard install`. Verify `.claude/skills/implementation-plan/SKILL.md`
exists, then tell the user:

> "The `implementation-plan` skill is ready. Ask your IDE chat to run it
> whenever you want to produce a `plans/<topic>/plan.md` + `lessons.md`
> pair before implementation starts. The Fantastic 4 team produces the
> same artifact shape — it only goes deeper because Harper's draft is
> shaped by Benjamin and Lucas."

For Fantastic 4, go to Step 3.

## Step 3 — Fantastic 4 installation

### 3.1 — Explain what will be installed

Tell the user:

```
The Fantastic 4 installation will set up:

Agents (5): Captain, Harper, Benjamin, Lucas, Bug-Fixer
  → .claude/agents/

Skills (5): orchestrator, planner, coder, reviewer, bug-fixer
            plus implementation-debate for pre-plan team critique
  → .claude/skills/

Instructions: Global coding standards → .claude/instructions/

The team produces the same artifact as running the `implementation-plan`
skill directly — `plans/<topic>/plan.md` + `lessons.md` — only richer,
because Harper's draft is reviewed by the team before the user sees it.
```

### 3.2 — Confirm, then install

Ask: "Shall I proceed with the Fantastic 4 installation?"

Once confirmed, run:

```bash
wizard install fantastic4
```

### 3.3 — Verify installation

Check that these files exist:

- `.claude/agents/captain.md`
- `.claude/skills/orchestrator/SKILL.md`
- `.claude/skills/implementation-debate/SKILL.md`
- `.claude/instructions/global-coding.instructions.md`

If any file is missing, report the issue. Otherwise proceed to Step 4.

## Step 4 — Update `.wizard.json`

After the sub-skill reports success, append the step key to
`completedSteps` in `.wizard.json`:

- DevContainer → `"devcontainer"`
- Graphify → `"graphify"`
- Implementation Plan → `"implementation-plan"`
- Fantastic 4 → already added by `wizard install fantastic4`

Report success to the user and, for Fantastic 4, tell them:

> "Use `@captain` in your IDE chat (Copilot or Claude Code) to begin a new
> task with the team orchestrating planning, coding, and review."
