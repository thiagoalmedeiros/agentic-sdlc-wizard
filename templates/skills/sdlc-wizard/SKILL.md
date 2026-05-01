---
name: sdlc-wizard
description: >
  Interactive configuration wizard for your development environment.
  Dispatches to the matching setup skill (DevContainer, Graphify,
  Implementation Plan) and tracks progress in `.wizard.json`. USE FOR:
  initial project setup, adding new SDLC capabilities, auditing existing
  configuration. DO NOT USE FOR: direct code changes, task execution, or
  planning.
argument-hint: 'Optional: specify a step number to jump directly to that configuration'
---

# SDLC Wizard

This skill presents the available SDLC setup steps, dispatches the
relevant sub-skill, and updates `.wizard.json` once the sub-skill reports
success. It does **not** re-implement the sub-skills' logic — each one
already handles its own "new setup vs. audit" mode.

## Step 1 — Choose a step

Read `.wizard.json` at the project root. If it does not exist, treat all
steps as incomplete. Present **only the steps not yet in `completedSteps`**
as a numbered list:

| # | Step | What it does |
|---|------|--------------|
| 1 | **DevContainer** | Set up or audit a `.devcontainer/` environment (Docker Compose + Dockerfile + `devcontainer.json`) |
| 2 | **Graphify** | Install and configure the graphify knowledge-graph skill |
| 3 | **Implementation Plan** | Confirm the standalone planning skill is available and explain its usage |

If `completedSteps` already contains every step, tell the user: "All SDLC
Wizard steps are already configured. Nothing left to set up!" and stop.

Otherwise ask: "Which step would you like to configure? (enter the number)"

## Step 2 — Dispatch the sub-skill

Based on the user's choice, **dispatch a subagent** that loads the
corresponding skill and performs the setup end-to-end. Pass through the
user's confirmations; do not paraphrase the skill's rules.

| Choice | Skill the subagent must load | Skill file |
|--------|-------------------------------|------------|
| DevContainer | `sdlc-devcontainer-setup` | `.claude/skills/sdlc-devcontainer-setup/SKILL.md` |
| Graphify | `sdlc-graphify-setup` | `.claude/skills/sdlc-graphify-setup/SKILL.md` |
| Implementation Plan | `sdlc-impl-strategy` | `.claude/skills/sdlc-impl-strategy/SKILL.md` |

For DevContainer and Graphify, the sub-skill detects whether the component
is already configured and runs either its new-setup flow or its audit flow
automatically. Do not pre-branch here.

For Implementation Plan, the skill is already installed by
`wizard install`. Verify `.claude/skills/sdlc-impl-strategy/SKILL.md`
exists, then tell the user:

> "The `sdlc-impl-strategy` skill is ready. Ask your IDE chat to run it
> whenever you want to produce a `plans/<topic>/plan.md` + `lessons.md`
> pair before implementation starts. For a richer, multi-skill workflow
> (orchestrated planning, coding, review, and debate), run the `sdlc-council`
> skill instead — it produces the same artifact shape, only shaped by the
> `sdlc-council-daedalus`, `sdlc-council-hephaestus`, and `sdlc-council-thomas` skills in combination."

## Step 3 — Update `.wizard.json`

After the sub-skill reports success, append the step key to
`completedSteps` in `.wizard.json`:

- DevContainer → `"devcontainer"`
- Graphify → `"graphify"`
- Implementation Plan → `"impl-strategy"`

Report success to the user and, when relevant, point them at the `sdlc-council`
skill for end-to-end task orchestration:

> "Run the `sdlc-council` skill in your IDE chat (Copilot or Claude Code) to
> begin a new task with orchestrated planning, coding, and review."
