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
