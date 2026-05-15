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

### [2026-05-14] — Ablation study: credential-guard behavior
**Change:** Added `ablation-eval.yaml` and two tasks (`tasks/ablation/missing-creds-with-skill.yaml`, `tasks/ablation/missing-creds-no-skill.yaml`) comparing the same prompt with and without `skill:jira-fetch` when Jira credentials are absent.
**Rationale:** Validates that the skill adds measurable value on two axes: (1) credential-guard — structured stop before any API curl call; (2) token efficiency — ≤15 000 tokens / 5 tool calls vs the full 60 000 / 15-call archetype-E ceiling used by the raw agent. Run with `waza run evals/jira-fetch/ablation-eval.yaml -v`.
**Threshold delta:** New eval — no locked thresholds changed in main `eval.yaml`.

### [2025-05-12] — Initial seed
**Change:** Seeded CHANGELOG.md with locked thresholds contract.
**Rationale:** Batch 0 anti-overfit guardrail — establish baseline before any grader is written.
**Threshold delta:** None (initial).
