# Eval Budget Reference — copilot-sdk Executor

<!-- budgets LOCKED — any changes require CHANGELOG.md entry with rationale -->

## Per-archetype budget table

| Archetype                  | Skills                                                             | model      | max_tokens | max_duration_ms | max_tool_calls | trials (det.) | trials (action_seq/prompt) |
| -------------------------- | ------------------------------------------------------------------ | ---------- | ---------- | --------------- | -------------- | ------------- | -------------------------- |
| A — Orchestrator           | sdlc-council, sdlc-strategy-debate, sdlc-wizard, sdlc-wizard-eval  | gpt-5-mini | 300,000    | 600,000         | 80             | 5             | 3                          |
| B — File-producing planner | sdlc-impl-strategy, sdlc-council-daedalus, sdlc-council-hephaestus | gpt-5-mini | 200,000    | 300,000         | 40             | 1             | 5                          |
| C — Reviewer/Policy        | sdlc-council-critic, sdlc-council-sherlock, sdlc-thomas            | gpt-5-mini | 60,000     | 180,000         | 15             | 5             | 5                          |
| D — Setup wizard           | sdlc-devcontainer-setup, sdlc-graphify-setup                       | gpt-5-mini | 200,000    | 300,000         | 40             | 1             | 3                          |
| E — Lessons/Log/Fetch      | sdlc-lessons-learned, docs-sync, jira-fetch                        | gpt-5-mini | 60,000     | 180,000         | 15             | 1             | 3                          |

## Locked thresholds (do not lower without CHANGELOG.md entry)

| Metric                         | Threshold |
| ------------------------------ | --------- |
| task_completion                | ≥ 0.80    |
| efficiency                     | ≥ 0.70    |
| trigger_accuracy (positive)    | ≥ 0.80    |
| trigger_accuracy (negative FP) | ≤ 0.10    |

## Anti-overfit guardrails

1. **Frozen thresholds** — any threshold lowering must be documented in `CHANGELOG.md`
2. **Hold-out negatives** — 30% adversarial negatives authored only in Batch 5 (not visible during Batches 1-4)
3. **No required_tools edits during iteration** — `required_tools`/`forbidden_tools` locked after Batch 0
4. **≥1 deterministic grader per task** — no prompt-only tasks allowed
5. **Negatives-pass gate** — negative tasks must pass before positive acceptance

## Tool names (copilot-sdk canonical)

See `evals/_probe/TOOL_NAMES.md` for the full mapping table.

Short form:

- `bash`, `create`, `view`, `glob`, `skill`, `web_fetch`
