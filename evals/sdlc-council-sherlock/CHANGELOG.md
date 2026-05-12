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

## [2025-05-13] Batch 4 — Archetype C uplift

- Upgraded eval.yaml: Archetype C budget (max_tokens: 60000, max_duration_ms: 180000, max_tool_calls: 15)
- Rewrote positive-trigger-1.yaml: skill_invocation + behavior(bash) + text(contains) + behavior_budget
- Rewrote positive-trigger-2.yaml: skill_invocation + behavior(view) + prompt grader + behavior_budget
- Rewrote negative-trigger-1.yaml: adversarial negative with forbidden_tools + text.not_contains
