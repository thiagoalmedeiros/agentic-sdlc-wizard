---
name: implementation-debate
description: >
  Pre-implementation 4-agent debate — Captain runs a Grok-council-style
  discussion of a proposed implementation with Harper, Benjamin, and Lucas
  before any code is written, then hands the synthesized brief to the
  `implementation-plan` skill to produce the final plan artifact.
  USE FOR: non-trivial features, refactors, migrations, or architecture
  decisions where the team benefits from parallel critique before planning.
  DO NOT USE FOR: bug fixes, one-line edits, or tasks already covered by an
  existing plan.
argument-hint: 'The user prompt describing the feature or implementation to debate'
---

# Implementation Debate

Run a structured four-agent debate on the user's proposed implementation, then
produce the plan through the `implementation-plan` skill. The debate exists to
surface disagreements, blind spots, and alternatives **before** a plan is
committed — not to replace planning.

## When to Use

- The user asks to plan or design a non-trivial implementation.
- The work spans multiple files, modules, or architectural concerns.
- There are plausible alternative approaches worth weighing.
- A previous plan failed review and needs re-examination from fresh angles.

## When NOT to Use

- The task is a mechanical fix with an obvious path — go straight to
  `implementation-plan`.
- The user asks for execution, not planning — Captain's orchestrator skill
  handles the batch loop directly.
- An approved plan already exists — update it, don't re-debate it.

## Harness Note — One or the Other

This project runs as **either** Claude Code **or** GitHub Copilot, never both
at once. Use the dispatch primitive of whichever harness is active:

| Harness | Parallel dispatch | Agent reference |
|---------|-------------------|-----------------|
| Claude Code | multiple `Agent(subagent_type=...)` calls in a single message | `harper`, `benjamin`, `lucas` |
| GitHub Copilot | `/fleet` with `@agent` mentions | `@harper`, `@benjamin`, `@lucas` |

Wherever this skill says **"dispatch in parallel"**, use the mechanism of the
active harness. Do not attempt cross-harness fan-out.

## Inputs

- `$ARGUMENTS` — the user's implementation prompt
- `plans/<topic>/lessons.md` (prior plans) — corrections relevant to this team
- Current codebase (for Harper's exploration step)

## Roles

| Agent | Debate role |
|-------|-------------|
| **Captain (you)** | Decomposes, dispatches, synthesizes, resolves conflicts, invokes `implementation-plan` |
| **Harper** | Architecture fit, external-fact grounding, existing patterns |
| **Benjamin** | Correctness, edge cases, data/state invariants, logic walkthrough |
| **Lucas** | Contrarian, alternative designs, failure modes, blind spots |

Bug-Fixer is **not** part of the debate — it is invoked later if the executed
plan produces failures.

---

## Procedure

### Stage 1 — Decompose (Captain, serial)

1. Read `$ARGUMENTS` and restate the implementation in one sentence.
2. If intent is ambiguous, run the orchestrator's clarification loop first.
3. Break the proposal into 3–5 **debate angles**. Good angles include:
   - Architecture fit with the existing codebase
   - Data/state model and invariants
   - Failure modes and recoverability
   - Alternative designs worth considering
   - External facts that must be verified (framework behavior, API contracts,
     security guidance)
4. Derive `<topic-kebab-case>` from the prompt and create the plan folder:
   `plans/<topic-kebab-case>/`. Inside it, create `debate.md` with the
   angles listed. The folder is shared with the `implementation-plan` skill
   (Stage 5) — `plan.md` and `lessons.md` will land here next to
   `debate.md`.

### Stage 2 — Parallel Thinking (fan-out, no cross-talk)

Dispatch Harper, Benjamin, and Lucas **in parallel** using the active
harness's mechanism. Each agent receives the **same** decomposed angles but a
**role-specific deliverable**. They must not see each other's output in this
stage.

Dispatch contract — every call includes:

1. Task context (the user prompt + decomposed angles + relevant files)
2. Role-specific deliverable (see below)
3. Scope boundary — "Do not propose a full plan. Critique and reason only."

**Harper deliverable:**

> "Architecture & research pass on <proposal>. For each debate angle: does the
> existing codebase already have a pattern? What external facts (framework,
> API, security) must be verified? Cite sources. Flag drift risks. Return:
> findings, verified facts, open questions."

**Benjamin deliverable:**

> "Correctness pass on <proposal>. For each debate angle: walk the data flow
> and state transitions. List invariants. Enumerate edge cases and off-by-one
> risks. Return: invariants, edge cases, concrete failure scenarios."

**Lucas deliverable:**

> "Contrarian pass on <proposal>. Propose at least 2 alternative designs.
> Identify blind spots the other agents will miss. List the top failure modes
> in production. Return: alternatives, blind spots, failure-mode ranking."

Collect all three outputs into `plans/<topic-kebab-case>/debate.md` under a
**Stage 2 — Independent Takes** heading.

### Stage 3 — Debate Round (parallel cross-critique)

Dispatch the same three agents **in parallel again**. This time each agent
receives the **other two** agents' Stage 2 output and must either concede,
refine, or escalate each point.

Dispatch contract:

- Include the other two agents' full Stage 2 output verbatim.
- Specific deliverable: "For each point raised by the others: concede,
  refine (with evidence), or escalate (with reason). Add any new blind spots
  this cross-reading exposed."
- Scope boundary: "Do not rewrite your Stage 2 output. Respond to theirs."

Collect responses under **Stage 3 — Cross-Critique** in `debate.md`.

### Stage 4 — Synthesis (Captain, serial)

Captain produces the **implementation brief** by merging Stage 2 + Stage 3:

1. **Consensus items** — agreed by all three agents, or unchallenged in
   Stage 3.
2. **Disputed items** — where Stage 3 responses did not converge.
3. **Resolution** — for each disputed item, apply the orchestrator's
   conflict-resolution rules:
   - Spec / architecture question → Harper's position wins, unless Lucas
     provides evidence
   - Code quality / correctness → Lucas's position wins if the risk is
     concrete
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

### Stage 5 — Handoff to `implementation-plan`

Invoke the `implementation-plan` skill with the Stage 4 brief as input, and
tell it to use the **existing** plan folder created in Stage 1 (so `plan.md`
and `lessons.md` land next to `debate.md`). Pass:

- The plan folder path — `plans/<topic-kebab-case>/`
- The one-sentence restatement from Stage 1
- The **Chosen approach** paragraph
- The **Consensus items** list (as the "what we are doing" seed)
- The **Rejected alternatives** list (to populate "out of scope")
- Any **Open questions** still outstanding

The `implementation-plan` skill owns `plan.md` and initializes `lessons.md`.
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
2. The plan artifact produced by `implementation-plan`.

Do not proceed to execution. This skill ends at the handoff — execution
is driven by the `orchestrator` skill's batch loop.

---

## Quality Bar

- Stage 2 outputs are **independent** — if any agent references another's
  output, the fan-out was not parallel and the debate is compromised. Redo
  the stage.
- Stage 3 critiques cite **specific points** from Stage 2. Generic agreement
  ("looks good") is not an acceptable response.
- Stage 4 brief explicitly lists which alternatives were rejected and why.
  A synthesis with no rejections means the debate surfaced nothing — reopen
  it with sharper angles.
- Every disputed item is either resolved with a rule, escalated to the user,
  or documented as an accepted risk. No silent omissions.
- The `implementation-plan` invocation receives the brief verbatim — do not
  summarize it away.

## Failure Modes to Avoid

- **Debate theater** — three agents agreeing to save time. If Lucas finds
  nothing, push harder; if he still finds nothing, note it explicitly.
- **Cross-harness dispatch** — this project is Claude OR Copilot, not both.
- **Skipping the plan skill** — `implementation-debate` produces a brief,
  not a plan. The plan must come from `implementation-plan` so the tracking
  list, batch structure, and validation rules are consistent with the rest
  of the project.
- **Debating during execution** — if an implementation is already underway
  and disagreement emerges, use the post-hoc Debate Gate in the orchestrator
  skill, not this one.

## Output Summary

At the end of a successful run you will have produced a single plan folder
containing three files:

- `plans/<topic-kebab-case>/debate.md` — decomposition, three independent
  takes, cross-critique, synthesized brief (this skill)
- `plans/<topic-kebab-case>/plan.md` — the 3-section plan artifact (created
  by the `implementation-plan` skill from the Stage 4 brief)
- `plans/<topic-kebab-case>/lessons.md` — initialized empty by
  `implementation-plan`, appended to during execution

Plus a user-facing summary with chosen approach, rejected alternatives, and
any open questions.
