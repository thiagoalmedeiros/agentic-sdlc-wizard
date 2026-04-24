---
name: planner
description: >
  Architecture and specification skill. Decomposes features into actionable
  implementation plans with concrete file paths, function signatures, and
  batch groupings. Explores the codebase first, then produces
  `plans/<topic>/plan.md` + `lessons.md` by running the `implementation-plan`
  skill. Use when breaking down features, designing architecture, writing
  specs, re-planning after failures, or verifying approach alignment.
---

# Planner

## Purpose

Investigate the codebase, research the best approach, and produce a
concrete specification that can be executed. This skill is the workflow's
fact-checker and architect. If something is unclear, research it. If there
are multiple approaches, evaluate them. The output becomes the blueprint
the `coder` skill follows.

## Inputs

From the `wizard` skill:
- The clarified task description (one-sentence intent + acceptance criteria)
- Any existing codebase context (file tree, key files)
- Constraints and decisions already made
- Prior lessons from `plans/<topic>/lessons.md` if the folder already exists

## What You Produce

Produce the plan artifact by running the `implementation-plan` skill.
The output is always `plans/<topic>/plan.md` + `plans/<topic>/lessons.md`
— the same shape the user would get by running `implementation-plan`
directly. This skill's job is to make that plan deeply researched and
batch-ready.

The sections below describe the content that goes **into** `plan.md`'s
"How We Are Doing It" section and batch plan.

### Section 2: How

**What TO DO** — Numbered steps, each one:
- Concrete (file paths, function signatures, not vague descriptions)
- Verifiable (how do you know it's done?)
- Ordered by dependency (what must exist before the next step)

**What NOT TO DO** — Anti-patterns specific to this task:
- What shortcuts would cause regressions?
- What files should NOT be touched?
- What patterns should be avoided?

**Architecture Decisions** — For every non-obvious choice:
- Document the decision
- Explain why (not just what)
- List what you considered and rejected

### Batch Plan

Group the steps into logical batches:
- Each batch should be independently reviewable
- A batch should leave the codebase in a working state
- Aim for 3-5 files per batch
- Order batches by dependency

## Planning Process

1. **Explore** — Read the relevant codebase broadly. Understand what exists before proposing changes. Read adjacent code, not just the target files. When external behavior matters, verify it with web research or official documentation.
2. **Sketch** — Draft a rough plan. Identify the critical path.
3. **Detail** — Write the full specification. Be specific about file paths and function signatures.
4. **Challenge** — Re-read your plan and ask: "Is there a simpler way?" If yes, rewrite. Consider what the `reviewer` skill will challenge — preemptively address the contrarian view in your spec.
5. **Batch** — Group into batches. Each batch should be a logical unit a reviewer can assess.

## Research Approach

- **Ground decisions in evidence.** Don't recommend an approach unless you've verified it fits the existing codebase patterns.
- **Verify external claims.** If another skill cites framework behavior, package semantics, security guidance, or API constraints, confirm it against primary sources on the web before building it into the spec.
- **Flag uncertainties.** If you're 80% sure but not 100%, say so. The `wizard` skill will escalate to the user.
- **Consider the contrarian view.** What would the `reviewer` skill challenge? Address it in the spec.

## Quality Checks

Before handing the plan back to the `wizard` skill, verify:
- [ ] Every step references a specific file or location
- [ ] No step is vague ("improve the code" is not a step)
- [ ] Batches are ordered by dependency
- [ ] What NOT TO DO section prevents known pitfalls
- [ ] Architecture decisions have rationale, not just choices
- [ ] The plan could be executed by someone who wasn't in the planning session

## In the Debate Pattern

When the `wizard` skill runs the consensus check before presenting a batch:
- Verify the approach still aligns with the architecture
- Check that the `coder` skill's implementation didn't drift from the spec
- If it drifted, determine whether the drift was an improvement or a regression

## Re-Planning

If the `wizard` skill sends you back to re-plan (because the `reviewer`
skill or user rejected the approach):
1. Read the session log to understand what went wrong
2. Read the specific feedback
3. Produce a NEW plan, not a patch on the old one
4. Explain what changed and why in the Architecture Decisions table
