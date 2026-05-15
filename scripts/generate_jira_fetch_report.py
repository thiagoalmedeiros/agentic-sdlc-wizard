#!/usr/bin/env python3

import datetime
import json
from pathlib import Path

WITH_SKILL_PATH = Path("evals/jira-fetch/results-with-skill.json")
NO_SKILL_PATH = Path("evals/jira-fetch/results-no-skill.json")
REPORT_PATH = Path("evals/jira-fetch/ablation-report.md")
GRADER_NAME = "credential-guidance"


def load_json(path: Path) -> dict:
    with path.open() as handle:
        return json.load(handle)


def grader_pass_rate(data: dict, grader_name: str) -> float:
    scores = [
        run["validations"][grader_name]["score"]
        for task in data.get("tasks", [])
        for run in task.get("runs", [])
        if grader_name in run.get("validations", {})
    ]
    return (sum(score > 0 for score in scores) / len(scores) * 100) if scores else 0


def trigger_f1(data: dict) -> float:
    return data.get("trigger_metrics", {}).get("f1", 0) * 100


def build_report(with_skill: dict, without_skill: dict) -> str:
    with_skill_guided = grader_pass_rate(with_skill, GRADER_NAME)
    without_skill_guided = grader_pass_rate(without_skill, GRADER_NAME)
    lift = with_skill_guided - without_skill_guided
    verdict = (
        "✓ Skill IMPROVES behavior"
        if lift > 0
        else "~ No difference"
        if lift == 0
        else "✗ Skill HURTS behavior"
    )
    timestamp = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    model = with_skill.get("config", {}).get("model_id", "unknown")

    report = f"""# Skill Value Report — jira-fetch

**Run:** {timestamp}
**Skill:** jira-fetch  |  **Model:** {model}

## Result

```
====================================================
  SKILL VALUE: Credential Guard Behavior
====================================================
  With skill:     {with_skill_guided:.0f}%  (agent follows skill instructions)
  Without skill:  {without_skill_guided:.0f}%  (agent on its own)
  Lift:           {lift:+.0f}pp
  Verdict: {verdict}
====================================================
```

## Details

| Condition | Runs | Guidance rate | Trigger F1 |
|-----------|------|---------------|------------|
| With skill | {with_skill['config']['runs_per_test']} | {with_skill_guided:.0f}% | {trigger_f1(with_skill):.0f}% |
| Without skill | {without_skill['config']['runs_per_test']} | {without_skill_guided:.0f}% | {trigger_f1(without_skill):.0f}% |
"""
    return report


def main() -> None:
    with_skill = load_json(WITH_SKILL_PATH)
    without_skill = load_json(NO_SKILL_PATH)
    report = build_report(with_skill, without_skill)
    REPORT_PATH.write_text(report)
    print(report)


if __name__ == "__main__":
    main()
