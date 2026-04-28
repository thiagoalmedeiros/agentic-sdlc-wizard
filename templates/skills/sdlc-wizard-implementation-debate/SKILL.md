---
name: sdlc-wizard-implementation-debate
description: >
  Pre-implementation multi-skill debate. Dispatches `sdlc-wizard-planner`, `sdlc-wizard-coder`,
  and `sdlc-wizard-reviewer` in parallel to critique a proposal, then hands the
  synthesized brief to `sdlc-wizard-implementation-plan`. USE FOR: planning non-trivial
  features, refactors, migrations, or architecture decisions. DO NOT USE
  FOR: bug fixes, one-line edits, or work already covered by an approved
  plan.
argument-hint: 'The user prompt describing the feature or implementation to debate'
---

# Implementation Debate

Run a structured multi-skill debate on the user's proposed implementation,
then produce the plan through the `sdlc-wizard-implementation-plan` skill. The debate
exists to surface disagreements, blind spots, and alternatives **before** a
plan is committed — not to replace planning.

## Execution Protocol

This skill has a fixed execution contract. Every run follows it without
shortcuts:

1. **Always run through `sdlc-wizard-orchestrator`.** When `sdlc-wizard-orchestrator` asks for a plan, this
   skill is invoked first. There is no "small task" bypass from `sdlc-wizard-orchestrator`.
2. **Stage 1 — Decompose (caller, serial).** The caller restates the
   proposal in one sentence, derives `<topic-kebab-case>`, creates the
   plan folder, and writes 3–5 debate angles into `debate.md`.
3. **Stage 2 — Parallel fan-out as subagents.** Dispatch the `sdlc-wizard-planner`,
   `sdlc-wizard-coder`, and `sdlc-wizard-reviewer` skills **in parallel, one subagent per skill**,
   using the active harness's fan-out mechanism. Never collapse the three
   roles into a single call. Each subagent loads its own skill file, sees
   only its own role-specific deliverable, and must not see the others'
   output during this stage.
4. **Stage 3 — Parallel cross-critique as subagents.** Dispatch the same
   three skills again in parallel, each receiving the other two's Stage 2
   output verbatim. Fan-out is mandatory for this stage too — no serial
   shortcut.
5. **Stage 4 — Synthesis (caller, serial).** The caller merges Stage 2 +
   Stage 3 into the implementation brief and resolves disputes using the
   `sdlc-wizard-orchestrator` skill's conflict-resolution rules.
6. **Stage 5 — Handoff to `sdlc-wizard-implementation-plan`.** Invoke
   `sdlc-wizard-implementation-plan` sequentially with the Stage 4 brief and the
   existing plan folder so `plan.md` and `lessons.md` land next to
   `debate.md`.
7. **Stage 6 — Present to user.** Return the chosen approach, rejected
   alternatives, and any open questions along with the plan artifact.
   Do not proceed to execution — the `sdlc-wizard-orchestrator` skill owns the batch loop.

Hard rules that apply to the whole run:

- **Subagent dispatch is required** for Stages 2 and 3. If the harness
  cannot dispatch subagents, stop and surface the limitation to the user
  instead of simulating the debate in a single context.
- **One harness only.** Use Claude Code's or GitHub Copilot's fan-out
  mechanism — never mix them in the same run.
- **Do not write `plan.md`.** Only `sdlc-wizard-implementation-plan` writes the plan
  artifact. This skill owns `debate.md` only.
- **Stop at handoff.** This skill ends after Stage 6. It never implements
  code, runs tests, or opens review.

## When to Use

- **Always**, when invoked through the `sdlc-wizard-orchestrator` skill — every plan goes
  through this debate, regardless of task size.
- The user asks to plan or design a non-trivial implementation.
- The work spans multiple files, modules, or architectural concerns.
- There are plausible alternative approaches worth weighing.
- A previous plan failed review and needs re-examination from fresh angles.

## When NOT to Use

- The task is a mechanical fix with an obvious path **and** the caller is
  not the `sdlc-wizard-orchestrator` skill — go straight to `sdlc-wizard-implementation-plan`.
- The user asks for execution, not planning — the `sdlc-wizard-orchestrator` skill handles
  the batch loop directly.
- An approved plan already exists — update it, don't re-debate it.

## Harness Note — One or the Other

This project runs as **either** Claude Code **or** GitHub Copilot, never both
at once. Use the dispatch primitive of whichever harness is active:

| Harness | Parallel dispatch | Skill reference |
|---------|-------------------|-----------------|
| Claude Code | Multiple subagent calls in a single message, each loading a skill | `sdlc-wizard-planner`, `sdlc-wizard-coder`, `sdlc-wizard-reviewer` |
| GitHub Copilot | A single message that dispatches multiple subagents, each referencing a skill by name | `sdlc-wizard-planner`, `sdlc-wizard-coder`, `sdlc-wizard-reviewer` |

Wherever this skill says **"dispatch in parallel"**, use the mechanism of
the active harness. Do not attempt cross-harness fan-out.

## Inputs

- `$ARGUMENTS` — the user's implementation prompt
- `plans/<topic>/lessons.md` (prior plans) — corrections relevant to this
  workflow
- Current codebase (for the `sdlc-wizard-planner` skill's exploration step)

## Skills Involved

| Skill | Debate role |
|-------|-------------|
| **`sdlc-wizard-orchestrator` (caller)** | Decomposes, dispatches, synthesizes, resolves conflicts, invokes `sdlc-wizard-implementation-plan` |
| **`sdlc-wizard-planner`** | Architecture fit, external-fact grounding, existing patterns |
| **`sdlc-wizard-coder`** | Correctness, edge cases, data/state invariants, logic walkthrough |
| **`sdlc-wizard-reviewer`** | Contrarian, alternative designs, failure modes, blind spots |

The `sdlc-wizard-bug-fixer` skill is **not** part of the debate — it is invoked later
if the executed plan produces failures.

---

## Procedure

### Stage 1 — Decompose (caller, serial)

1. Read `$ARGUMENTS` and restate the implementation in one sentence.
2. If intent is ambiguous, run the `sdlc-wizard-orchestrator` skill's clarification loop first.
3. Break the proposal into 3–5 **debate angles**. Good angles include:
   - Architecture fit with the existing codebase
   - Data/state model and invariants
   - Failure modes and recoverability
   - Alternative designs worth considering
   - External facts that must be verified (framework behavior, API contracts,
     security guidance)
4. Derive `<topic-kebab-case>` from the prompt and create the plan folder:
   `plans/<topic-kebab-case>/`. Inside it, create `debate.md` with the
   angles listed. The folder is shared with the `sdlc-wizard-implementation-plan` skill
   (Stage 5) — `plan.md` and `lessons.md` will land here next to
   `debate.md`.

### Stage 2 — Parallel Thinking (fan-out, no cross-talk)

Dispatch the `sdlc-wizard-planner`, `sdlc-wizard-coder`, and `sdlc-wizard-reviewer` skills **in parallel as
subagents** using the active harness's mechanism. This step is **not
optional** and must not be collapsed into a single call that tries to
play all three roles — the whole point of the debate is three
independent contexts. Each subagent receives the **same** decomposed
angles but a **role-specific deliverable**. They must not see each
other's output in this stage.

Dispatch contract — every call includes:

1. Task context (the user prompt + decomposed angles + relevant files)
2. Role-specific deliverable (see below)
3. Scope boundary — "Do not propose a full plan. Critique and reason only."

**`sdlc-wizard-planner` deliverable:**

> "Architecture & research pass on <proposal>. For each debate angle: does
> the existing codebase already have a pattern? What external facts
> (framework, API, security) must be verified? Cite sources. Flag drift
> risks. Return: findings, verified facts, open questions."

**`sdlc-wizard-coder` deliverable:**

> "Correctness pass on <proposal>. For each debate angle: walk the data
> flow and state transitions. List invariants. Enumerate edge cases and
> off-by-one risks. Return: invariants, edge cases, concrete failure
> scenarios."

**`sdlc-wizard-reviewer` deliverable:**

> "Contrarian pass on <proposal>. Propose at least 2 alternative designs.
> Identify blind spots the other skills will miss. List the top failure
> modes in production. Return: alternatives, blind spots, failure-mode
> ranking."

Collect all three outputs into `plans/<topic-kebab-case>/debate.md` under a
**Stage 2 — Independent Takes** heading.

### Stage 3 — Debate Round (parallel cross-critique)

Dispatch the same three skills **in parallel as subagents again**. Like
Stage 2, this fan-out is mandatory — do not fold the cross-critique into
a single call. This time each subagent receives the **other two**
skills' Stage 2 output and must either concede, refine, or escalate each
point.

Dispatch contract:

- Include the other two skills' full Stage 2 output verbatim.
- Specific deliverable: "For each point raised by the others: concede,
  refine (with evidence), or escalate (with reason). Add any new blind spots
  this cross-reading exposed."
- Scope boundary: "Do not rewrite your Stage 2 output. Respond to theirs."

Collect responses under **Stage 3 — Cross-Critique** in `debate.md`.

### Stage 4 — Synthesis (caller, serial)

The caller produces the **implementation brief** by merging Stage 2 +
Stage 3:

1. **Consensus items** — agreed by all three skills, or unchallenged in
   Stage 3.
2. **Disputed items** — where Stage 3 responses did not converge.
3. **Resolution** — for each disputed item, apply the `sdlc-wizard-orchestrator` skill's
   conflict-resolution rules:
   - Spec / architecture question → the `sdlc-wizard-planner` skill's position wins,
     unless the `sdlc-wizard-reviewer` skill provides evidence
   - Code quality / correctness → the `sdlc-wizard-reviewer` skill's position wins if
     the risk is concrete
   - Unverified external fact → require web-backed verification before
     deciding
   - True architecture fork → escalate to the user with both positions
4. **Chosen approach** — one paragraph: what is being built and why this path
   over the alternatives.
5. **Rejected alternatives** — short list with the reason each was set aside
   (so the plan reviewer can re-challenge if needed).
6. **Open questions for the user** — only the items that genuinely require
   user judgment.

Append the brief to `plans/<topic-kebab-case>/debate.md` under **Stage 4 — Brief**.

### Stage 5 — Handoff to `sdlc-wizard-implementation-plan`

Invoke the `sdlc-wizard-implementation-plan` skill with the Stage 4 brief as input, and
tell it to use the **existing** plan folder created in Stage 1 (so `plan.md`
and `lessons.md` land next to `debate.md`). Pass:

- The plan folder path — `plans/<topic-kebab-case>/`
- The one-sentence restatement from Stage 1
- The **Chosen approach** paragraph
- The **Consensus items** list (as the "what we are doing" seed)
- The **Rejected alternatives** list (to populate "out of scope")
- Any **Open questions** still outstanding

The `sdlc-wizard-implementation-plan` skill owns `plan.md` and initializes `lessons.md`.
Do not duplicate its output in `debate.md`; the three documents are linked
but distinct and all live in the same folder:

```
plans/<topic-kebab-case>/
├── debate.md      # why this approach was chosen (this skill)
├── plan.md        # what will be executed (implementation-plan skill)
└── lessons.md     # execution lessons, appended during implementation
```

### Stage 6 — Present to User

Present two things to the user:

1. A short summary of the chosen approach, rejected alternatives, and any
   open questions from Stage 4.
2. The plan artifact produced by `sdlc-wizard-implementation-plan`.

Do not proceed to execution. This skill ends at the handoff — execution
is driven by the `sdlc-wizard-orchestrator` skill's batch loop.

---

## Quality Bar

- Stage 2 outputs are **independent** — if any subagent references
  another's output, the fan-out was not parallel and the debate is
  compromised. Redo the stage.
- Stage 3 critiques cite **specific points** from Stage 2. Generic agreement
  ("looks good") is not an acceptable response.
- Stage 4 brief explicitly lists which alternatives were rejected and why.
  A synthesis with no rejections means the debate surfaced nothing — reopen
  it with sharper angles.
- Every disputed item is either resolved with a rule, escalated to the user,
  or documented as an accepted risk. No silent omissions.
- The `sdlc-wizard-implementation-plan` invocation receives the brief verbatim — do not
  summarize it away.

## Failure Modes to Avoid

- **Debate theater** — three subagents agreeing to save time. If the
  `sdlc-wizard-reviewer` skill finds nothing, push harder; if it still finds nothing,
  note it explicitly.
- **Cross-harness dispatch** — this project is Claude OR Copilot, not both.
- **Skipping the plan skill** — `sdlc-wizard-implementation-debate` produces a brief,
  not a plan. The plan must come from `sdlc-wizard-implementation-plan` so the tracking
  list, batch structure, and validation rules are consistent with the rest
  of the project.
- **Debating during execution** — if an implementation is already underway
  and disagreement emerges, use the post-hoc Debate Gate in the `sdlc-wizard-orchestrator`
  skill, not this one.

## Output Summary

At the end of a successful run you will have produced a single plan folder
containing three files:

- `plans/<topic-kebab-case>/debate.md` — decomposition, three independent
  takes, cross-critique, synthesized brief (this skill)
- `plans/<topic-kebab-case>/plan.md` — the 3-section plan artifact (created
  by the `sdlc-wizard-implementation-plan` skill from the Stage 4 brief)
- `plans/<topic-kebab-case>/lessons.md` — initialized empty by
  `sdlc-wizard-implementation-plan`, appended to during execution

Plus a user-facing summary with chosen approach, rejected alternatives, and
any open questions.
