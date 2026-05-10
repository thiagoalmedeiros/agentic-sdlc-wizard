---
name: sdlc-wizard-eval
description: >
  Interactive Waza evaluation wizard for AI agent skills. Guides you step-by-step
  through installing Waza, scaffolding eval suites, running benchmarks, checking
  skill readiness, improving quality, and viewing results. USE FOR: evaluating
  existing SKILL.md files with Waza, scaffolding eval suites from SKILL.md,
  running skill benchmarks, checking skill compliance and token budgets, improving
  skill frontmatter, grading agent output, viewing evaluation dashboards, CI/CD
  eval integration. DO NOT USE FOR: creating new skills from scratch (use
  sdlc-wizard), implementing features (use sdlc-council), planning (use
  sdlc-impl-strategy).
argument-hint: "Optional: skill name or path to jump directly to evaluating that skill"
---

# SDLC Wizard — Eval

This skill interactively guides you through the full Waza evaluation lifecycle
for skills that already exist in your workspace. It does **not** run commands
automatically — it asks what you want to do at each step, shows you the exact
command, and confirms the outcome.

---

## Step 0 — Detect context

Before presenting the menu, silently gather workspace context:

1. Check whether `waza` is on the `PATH`:
   ```bash
   which waza 2>/dev/null && waza --version || echo "NOT_INSTALLED"
   ```
2. Scan for existing `SKILL.md` files and list their paths.
3. Scan for existing `eval.yaml` files under `evals/` and note which skills
   already have coverage.

Use this context to pre-fill answers and highlight recommended actions.

If an argument was passed (e.g. `/sdlc-wizard-eval docs-sync`), skip the main
menu and jump directly to **Step 2** for that skill.

---

## Step 1 — Present the main menu

Greet the user with a brief summary of what was found:

```
🧙 SDLC Eval Wizard
═══════════════════════════════════════════
Found X skill(s)  |  Y already have evals  |  Waza: [installed / NOT installed]
═══════════════════════════════════════════

What would you like to do?

  1  Install / verify Waza
  2  Scaffold an eval suite for a skill (waza new eval)
  3  Suggest an eval suite with AI  (waza suggest)
  4  Run evaluations                (waza run)
  5  Check skill readiness          (waza check)
  6  Improve skill quality          (waza dev / waza quality)
  7  View coverage report           (waza coverage)
  8  Open results dashboard         (waza serve)
  9  Set up CI/CD integration
  0  Exit
```

Ask: **"Enter a number (or the name of a skill to evaluate it end-to-end):"**

---

## Step 2 — Execute the chosen action

### Quick Reference: Step 2 Decision Tree

| Option | Task                | Key Input                 | Output                                    |
| ------ | ------------------- | ------------------------- | ----------------------------------------- |
| **1**  | Install Waza        | Confirm                   | Verify with `waza --version`              |
| **2**  | Scaffold eval suite | Select skill              | Creates `evals/<skill>/eval.yaml` + tasks |
| **3**  | AI-generate eval    | Select skill + mode       | Preview or apply generated tasks          |
| **4**  | Run evaluations     | Select eval(s) + executor | Exit code: 0=pass, 1=fail, 2=config error |
| **5**  | Check readiness     | Select skill              | Compliance score + detailed report        |
| **6a** | Improve frontmatter | Select skill + target     | Interactive or one-pass report            |
| **6b** | Score quality       | Select skill + model      | 5-dimension quality breakdown             |
| **7**  | Coverage report     | Select format             | Grid showing eval coverage by skill       |
| **8**  | View dashboard      | Provide port/directory    | Browser-based results viewer              |
| **9**  | CI/CD setup         | Select skills             | GitHub Actions workflow file              |

---

### Option 1 — Install / verify Waza

**Action**: Show and confirm install command.

```bash
curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash
```

**After confirmation**, verify the install:

```bash
waza --version
```

**If it fails**, suggest the source-build alternative (requires Go 1.26+):

```bash
git clone https://github.com/microsoft/waza.git
cd waza && git lfs install && git lfs pull
go build -o waza ./cmd/waza && sudo mv waza /usr/local/bin/
```

Mark Waza as installed and return to the main menu.

---

### Option 2 — Scaffold an eval suite (waza new eval)

**Workflow:**

| Step | Prompt                          | Action                                                                        |
| ---- | ------------------------------- | ----------------------------------------------------------------------------- |
| 1    | List unevaluated skills         | Display numbered list                                                         |
| 2    | "Which skill? (number or path)" | Get user input                                                                |
| 3    | Show command                    | `waza new eval <skill-path>`                                                  |
| 4    | Explain outputs                 | `eval.yaml`, `tasks/positive-trigger-1.yaml`, `tasks/negative-trigger-1.yaml` |
| 5    | Confirm                         | "Run this command? (yes/no)"                                                  |
| 6    | Execute & show output           | Run command and display results                                               |
| 7    | Offer next steps                | Edit manually / AI-suggest / Run now                                          |

---

### Option 3 — AI-suggested eval suite (waza suggest)

**Workflow:**

| Step | Prompt                            | Action                                                            |
| ---- | --------------------------------- | ----------------------------------------------------------------- |
| 1    | List skills without full coverage | Display numbered list                                             |
| 2    | "Which skill to target?"          | Get user input                                                    |
| 3    | "Preview only or write files?"    | Choose `--dry-run` (safe) or `--apply`                            |
| 4    | "Model override? (optional)"      | Optional: specify model ID                                        |
| 5    | Show command                      | `waza suggest <skill-path> [--dry-run \| --apply] [--model <id>]` |
| 6    | Execute & display output          | Run and show suggested YAML                                       |
| 7    | If `--dry-run`: confirm apply     | "Apply these files? (yes/no)" → re-run with `--apply`             |

---

### Option 4 — Run evaluations (waza run)

**Workflow:**

| Step | Prompt               | Action                                                                                                           |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | List available evals | Display numbered list with skill names                                                                           |
| 2    | "Which eval to run?" | Number, or 'all' to auto-discover                                                                                |
| 3    | "Executor type?"     | `mock` (fast, no API key) or `copilot-sdk` (requires GITHUB_TOKEN)                                               |
| 4    | "Verbose output?"    | -v flag for detailed logs                                                                                        |
| 5    | "Save results?"      | -o results.json to persist output                                                                                |
| 6    | "Run in parallel?"   | --parallel flag for concurrent execution                                                                         |
| 7    | Show final command   | Single: `waza run <eval.yaml> [-v] [-o results.json]` / All: `waza run --discover evals/ [-v] [-o results.json]` |
| 8    | Execute              | Run command and display results                                                                                  |
| 9    | Interpret exit code  | 0=✅ passed, 1=❌ failed, 2=⚠️ config error                                                                      |
| 10   | Offer next steps     | Compare results / Open dashboard / Fix failing tasks                                                             |

---

### Option 5 — Check skill readiness (waza check)

**Workflow:**

| Step | Prompt                              | Action                                                              |
| ---- | ----------------------------------- | ------------------------------------------------------------------- |
| 1    | List all skills (flag known issues) | Display numbered list                                               |
| 2    | "Which skill to check?"             | Number, or 'all'                                                    |
| 3    | Show command                        | `waza check <skill-path>`                                           |
| 4    | Execute                             | Run and display readiness report                                    |
| 5    | Explain report sections             | Compliance / Token Budget / Eval Suite / Spec Compliance / Advisory |
| 6    | Remediation                         | For each failure, explain what it means and suggest fix             |
| 7    | Offer improvement                   | "Would you like to improve this skill? (yes/no)" → go to Option 6   |

**Report sections explained:**

- **Compliance Score** — Frontmatter adherence (Low / Medium / Medium-High / High)
- **Token Budget** — Whether `SKILL.md` is within limits
- **Evaluation Suite** — Whether `eval.yaml` exists
- **Spec Compliance** — agentskills.io spec checks
- **Advisory Checks** — Quality and maintainability heuristics

---

### Option 6a — Improve skill quality: Frontmatter (waza dev)

**Workflow:**

| Step | Prompt                          | Action                                                                                                                 |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1    | List skills to improve          | Display numbered list                                                                                                  |
| 2    | "Which skill?"                  | Get user input                                                                                                         |
| 3    | "Improvement mode?"             | Interactive (iterative) or Copilot report (single-pass)                                                                |
| 4    | If interactive: "Target level?" | low / medium / medium-high / high (default: medium-high)                                                               |
| 5    | Show command                    | Interactive: `waza dev <skill-path> [--target medium-high]` / Report: `waza dev <skill-path> --copilot [--model <id>]` |
| 6    | Execute                         | Run and display improvements                                                                                           |
| 7    | Follow-up                       | Suggest running `waza check` again                                                                                     |

---

### Option 6b — Improve skill quality: LLM judge (waza quality)

**Workflow:**

| Step | Prompt                    | Action                                                            |
| ---- | ------------------------- | ----------------------------------------------------------------- |
| 1    | List skills to evaluate   | Display numbered list                                             |
| 2    | "Which skill?"            | Get user input                                                    |
| 3    | "Judge model? (optional)" | Optional: specify model ID                                        |
| 4    | "Output format?"          | table (default), json                                             |
| 5    | Show command              | `waza quality <skill-path> [--model <id>] [--format table\|json]` |
| 6    | Execute                   | Run and display five quality dimensions                           |
| 7    | Explain scoring           | Each dimension: score 1–5, explanation, and suggested fix         |

**Five quality dimensions:**

- **Clarity** — Is the skill description clear and unambiguous?
- **Completeness** — Does it cover all relevant scenarios?
- **Trigger Precision** — Will the agent invoke it at the right times?
- **Scope Coverage** — Is the workflow fully described?
- **Anti-patterns** — Any patterns that hurt effectiveness?

---

### Option 7 — Coverage report (waza coverage)

**Workflow:**

| Step | Prompt                  | Action                                               |
| ---- | ----------------------- | ---------------------------------------------------- |
| 1    | "Output format?"        | text (default), markdown, or json                    |
| 2    | Show command            | `waza coverage [--format markdown]`                  |
| 3    | Execute                 | Run and display grid                                 |
| 4    | Explain coverage levels | Full / Partial / None                                |
| 5    | Recommend actions       | For uncovered skills, offer to scaffold (→ Option 2) |

**Coverage levels:**

- **Full** — Has tasks + 2+ grader types
- **Partial** — Has eval.yaml but missing tasks or grader variety
- **None** — No eval suite at all

---

### Option 8 — Results dashboard (waza serve)

**Workflow:**

| Step | Prompt                            | Action                                                           |
| ---- | --------------------------------- | ---------------------------------------------------------------- |
| 1    | "Results directory? (default: .)" | Get path or accept default                                       |
| 2    | "Port? (default: 3000)"           | Get port or accept default                                       |
| 3    | Show command                      | `waza serve [--port 3000] [--results-dir ./results]`             |
| 4    | Execute                           | Run server and open browser                                      |
| 5    | Explain dashboard                 | Task pass/fail / Scores / Model comparisons / Aggregated metrics |
| 6    | Cleanup reminder                  | "Stop the server with Ctrl+C when done."                         |

---

### Option 9 — CI/CD integration

**Workflow:**

| Step | Prompt                        | Action                                                          |
| ---- | ----------------------------- | --------------------------------------------------------------- |
| 1    | "Which skill(s) to include?"  | List and select skills                                          |
| 2    | Generate scaffold             | Create `.github/workflows/eval.yml`                             |
| 3    | Explain exit codes            | 0=pass, 1=fail, 2=config error                                  |
| 4    | Optional: token budget gating | Add `waza tokens compare main --skills --threshold 10 --strict` |
| 5    | Confirm                       | "Write workflow file? (yes/no)"                                 |
| 6    | Finalize                      | Write file and show path                                        |

**Generated workflow scaffold:**

```yaml
name: Skill Evaluation
on:
  pull_request:
    paths:
      - "skills/**"
      - "evals/**"

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Waza
        run: curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash
      - name: Run evaluations
        run: waza run --discover evals/ -v -o results.json
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: results.json
```

---

## Step 3 — After each action

After every action completes:

1. Show a brief **summary** of what was done and whether it succeeded.
2. Update the user's awareness of overall eval coverage (X of Y skills covered).
3. Ask: **"What would you like to do next?"** and re-present the menu.

Persist a lightweight session state so the wizard remembers:

- Which skills have been checked this session
- Whether Waza is confirmed installed
- Results file paths generated this session

---

## Reference: Waza Command Cheatsheet

| Goal                        | Command                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Install                     | `curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh \| bash`     |
| Scaffold eval from SKILL.md | `waza new eval <skill-path>`                                                              |
| AI-generate eval            | `waza suggest <skill-path> --apply`                                                       |
| Run single eval             | `waza run evals/<skill>/eval.yaml -v`                                                     |
| Run all evals               | `waza run --discover evals/ -v`                                                           |
| Check readiness             | `waza check <skill-path>`                                                                 |
| Improve frontmatter         | `waza dev <skill-path>`                                                                   |
| LLM quality score           | `waza quality <skill-path>`                                                               |
| Coverage grid               | `waza coverage --format markdown`                                                         |
| Token count                 | `waza tokens count skills/`                                                               |
| Token budget CI             | `waza tokens compare main --skills --threshold 10`                                        |
| Results dashboard           | `waza serve --results-dir ./results`                                                      |
| Compare runs                | `waza compare results-a.json results-b.json`                                              |
| Save results                | `waza run eval.yaml -o results.json`                                                      |
| Grade previous run          | `waza run eval.yaml --output results.json && waza grade eval.yaml --results results.json` |
| List models                 | `waza models`                                                                             |
| Clear cache                 | `waza cache clear`                                                                        |
