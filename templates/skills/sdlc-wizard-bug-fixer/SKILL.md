---
name: sdlc-wizard-bug-fixer
description: >
  Autonomous debugging and repair skill. Diagnoses and resolves bugs, test
  failures, CI issues, and runtime errors without hand-holding. Operates
  independently: reproduce, locate, understand, fix, document. Use when
  encountering failing tests, runtime errors, CI failures, linting issues,
  or any bug report. Also triggers autonomously when errors are detected
  during implementation.
---

# Bug-Fixer

## Purpose

An autonomous debugging skill invoked when tests fail, CI breaks, or
runtime errors appear. Don't wait for instructions — diagnose and resolve.
The user should not need to context-switch to help. Figure it out.

## Core Principle: Zero Hand-Holding

When a bug or failure is received:
1. Don't ask the user what to do
2. Don't ask which file to look at
3. Don't ask for reproduction steps (find them yourself)
4. Just fix it

## Debugging Process

### Step 1: Reproduce

- Run the failing test or command
- Read the error message completely (don't skim)
- Capture the full stack trace

### Step 2: Locate

- Trace from the error to the root cause
- Read the relevant source files
- Check recent changes — what was modified in this batch?
- Check the active plan's `plans/<topic>/lessons.md` (if any) — has this pattern been seen before?
- If the failure involves third-party libraries, CI tooling, platform behavior, or framework semantics, verify likely causes with web research and primary documentation.

### Step 3: Understand

- Why does this code exist?
- What was it supposed to do?
- Why is it failing now?
- Is this a regression from the current batch or a pre-existing issue?
- Do not trust second-hand explanations from other skills without confirming them against code, logs, and when relevant external sources.

### Step 4: Fix

- Apply the minimal fix that resolves the root cause
- Do NOT apply band-aids (no `try/except: pass`, no ignoring errors)
- Ensure the fix doesn't break anything else
- Run the tests again to verify

### Step 5: Document

- Update the session log: what broke, why, and how it was fixed
- If this is a pattern that could recur, append it to the active plan's `plans/<topic>/lessons.md`
- Update file tracking status

## What To Fix

- Test failures (unit, integration, e2e)
- Linting and type errors
- Runtime exceptions
- CI pipeline failures
- Build errors
- Dependency conflicts

## What Not To Fix

- Architecture problems → flag to the `sdlc-wizard-orchestrator` skill for re-planning with the `sdlc-wizard-implementation-plan` skill
- Missing features → that's new work, not a bug
- Performance issues → flag to the `sdlc-wizard-reviewer` skill unless it's a clear regression

## Workflow Integration

- Context comes from the `sdlc-wizard-coder` skill's code and the `sdlc-wizard-reviewer` skill's issue reports
- After fixing, changes go back through the `sdlc-wizard-reviewer` skill
- If the fix requires architecture changes, escalate to the `sdlc-wizard-orchestrator` skill, which will involve the `sdlc-wizard-implementation-plan` skill

## Fix Quality Bar

Every fix must satisfy:
- [ ] Root cause addressed (not just symptoms)
- [ ] All tests pass after the fix
- [ ] No new warnings introduced
- [ ] Fix is minimal — only touches what's necessary
- [ ] Would survive a code review by the `sdlc-wizard-reviewer` skill

## When Stuck

If the root cause cannot be found after thorough investigation:
1. Document what was tried and what was ruled out
2. Flag to the `sdlc-wizard-orchestrator` skill with a clear description of the blocker
3. Suggest next diagnostic steps
4. Do NOT silently give up or apply a workaround
