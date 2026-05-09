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

Based on the user’s choice, **dispatch a subagent** that invokes the
corresponding skill and performs the setup end-to-end. Pass through the
user’s confirmations; do not paraphrase the skill’s rules.

| Choice | Skill |
|--------|-------|
| DevContainer | `skill:sdlc-devcontainer-setup` |
| Graphify | `skill:sdlc-graphify-setup` |
| Implementation Plan | `skill:sdlc-impl-strategy` |

For DevContainer and Graphify, the sub-skill detects whether the component
is already configured and runs either its new-setup flow or its audit flow
automatically. Do not pre-branch here.

For Implementation Plan, the skill is already installed by
`wizard install`. Verify that `skill:sdlc-impl-strategy` is available, then tell the user:

> "The `skill:sdlc-impl-strategy` skill is ready. Ask your IDE chat to run it
> whenever you want to produce a `plans/<topic>/plan.md` + `lessons.md`
> pair before implementation starts. `skill:sdlc-thomas` is also
> installed — it runs every verification check itself and issues an
> **APPROVED** or **NOT APPROVED** verdict after each batch; it is called
> automatically when `skill:sdlc-impl-strategy` or `skill:sdlc-council` executes a plan.
> For a richer, multi-skill workflow (orchestrated planning, coding, review,
> validation, and debate), run `skill:sdlc-council` instead — it produces
> the same artifact shape, only shaped by `skill:sdlc-council-daedalus`,
> `skill:sdlc-council-hephaestus`, and `skill:sdlc-council-lucas` in combination,
> with `skill:sdlc-thomas` as the mandatory verification gate after every batch."

## Step 3 — Update `.wizard.json`

After the sub-skill reports success, append the step key to
`completedSteps` in `.wizard.json`:

- DevContainer → `"devcontainer"`
- Graphify → `"graphify"`
- Implementation Plan → `"impl-strategy"`

Report success to the user and, when relevant, point them at `skill:sdlc-council`
for end-to-end task orchestration:

> "Run `skill:sdlc-council` in your IDE chat (Copilot or Claude Code) to
> begin a new task with orchestrated planning, coding, and review."
