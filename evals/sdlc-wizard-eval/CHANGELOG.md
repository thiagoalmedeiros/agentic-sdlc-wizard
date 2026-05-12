# Eval CHANGELOG

<!-- LOCKED THRESHOLDS — any lowering requires a dated entry below with rationale -->
| Metric | Threshold |
|---|---|
| task_completion | ≥ 0.80 |
| efficiency | ≥ 0.70 |
| trigger_accuracy (positive) | ≥ 0.80 |
| trigger_accuracy (negative FP) | ≤ 0.10 |

## Entries

<!-- Format:
### [YYYY-MM-DD] — Short title
**Change:** What changed (grader, task, threshold)
**Rationale:** Why
**Threshold delta:** e.g. "task_completion 0.8 → 0.75 — see grader coverage gap"
-->

### [2025-05-12] — Initial seed
**Change:** Seeded CHANGELOG.md with locked thresholds contract.
**Rationale:** Batch 0 anti-overfit guardrail — establish baseline before any grader is written.
**Threshold delta:** None (initial).

## [2025-05-13] Batch 3 — Archetype A+D uplift

- Upgraded eval.yaml: proper archetype budget (max_tokens, max_duration_ms, max_tool_calls)
- Rewrote positive-trigger-1.yaml: multi-grader (skill_invocation + file/behavior + behavior_budget)
- Rewrote positive-trigger-2.yaml: multi-grader (action_sequence + file/behavior + behavior_budget)
- Rewrote negative-trigger-1.yaml: adversarial negative with forbidden_tools + file.must_not_exist + text graders
