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

### Option 1 — Install / verify Waza

Show the user the recommended install command:

```bash
curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash
```

After the user confirms it ran, verify:

```bash
waza --version
```

If successful, mark Waza as installed and return to the menu. If it fails,
suggest the source-build alternative (requires Go 1.26+):

```bash
git clone https://github.com/microsoft/waza.git
cd waza && git lfs install && git lfs pull
go build -o waza ./cmd/waza && sudo mv waza /usr/local/bin/
```

---

### Option 2 — Scaffold an eval suite (waza new eval)

1. List all skills that do **not** yet have an `evals/` directory, numbered.
2. Ask: **"Which skill? (enter number or path)"**
3. Show the command that will run:
   ```bash
   waza new eval <skill-path>
   ```
4. Explain what it creates:
   - `evals/<skill-name>/eval.yaml` — benchmark spec
   - `evals/<skill-name>/tasks/positive-trigger-1.yaml`
   - `evals/<skill-name>/tasks/negative-trigger-1.yaml`
5. Confirm: **"Run this command? (yes/no)"**
6. Run it, show output, then offer:
   - Edit generated tasks manually, OR
   - Continue to **Option 3** (AI-suggested evals), OR
   - Proceed to **Option 4** (run evals now)

---

### Option 3 — AI-suggested eval suite (waza suggest)

1. Ask which skill to target (list skills without full coverage).
2. Ask whether to preview only or write to disk:
   - **Preview** → `--dry-run` (default, safe)
   - **Apply** → `--apply` (writes files)
3. Optionally ask for a model override.
4. Show the full command:
   ```bash
   waza suggest <skill-path> [--dry-run | --apply] [--model <id>]
   ```
5. Run it, display the suggested YAML output.
6. If `--dry-run` was used, ask: **"Apply these files? (yes/no)"**
   If yes, re-run with `--apply`.

---

### Option 4 — Run evaluations (waza run)

1. List available `eval.yaml` files with their skill names, numbered.
2. Ask: **"Which eval to run? (number, or 'all' to discover all)"**
3. Ask clarifying questions:
   - **Executor**: `mock` (no API key, fast) or `copilot-sdk` (real model, requires `GITHUB_TOKEN`)?
   - **Verbose output?** (adds `-v`)
   - **Save results?** (adds `-o results.json`)
   - **Run in parallel?** (adds `--parallel`)
4. Build and show the command:

   ```bash
   # Single eval
   waza run <eval.yaml> [-v] [-o results.json] [--parallel]

   # All discovered evals
   waza run --discover evals/ [-v] [-o results.json]
   ```

5. Run it and display results.
6. On completion, show exit code meaning:
   - `0` → All tests passed ✅
   - `1` → One or more tests failed ❌
   - `2` → Configuration error ⚠️
7. Offer next steps: **Compare results**, **Open dashboard**, or **Fix failing tasks**.

---

### Option 5 — Check skill readiness (waza check)

1. List all skills, flagging ones with known issues (no eval, low token budget, etc.).
2. Ask: **"Which skill to check? (number or 'all')"**
3. Show command:
   ```bash
   waza check <skill-path>
   ```
4. Run it and display the readiness report. Explain each section:
   - **Compliance Score** — Frontmatter adherence (Low / Medium / Medium-High / High)
   - **Token Budget** — Whether `SKILL.md` is within token limits
   - **Evaluation Suite** — Whether `eval.yaml` is present
   - **Spec Compliance** — agentskills.io spec checks (frontmatter, naming, fields)
   - **Advisory Checks** — Quality and maintainability heuristics
5. For any failing check, explain what it means and suggest the fix.
6. Offer: **"Would you like to improve this skill now?"** → goes to Option 6.

---

### Option 6 — Improve skill quality (waza dev / waza quality)

Present two sub-options:

```
  A  Iterative frontmatter improvement  (waza dev)
  B  LLM-as-judge quality scoring       (waza quality)
```

**Sub-option A — waza dev**

1. Ask which skill to improve.
2. Ask improvement mode:
   - **Interactive** (default) — iterates until target adherence level is met
   - **Copilot report** (`--copilot`) — single-pass markdown report, no changes applied
3. For interactive mode, ask target level: `low` / `medium` / `medium-high` / `high` (default: `medium-high`)
4. Show command:
   ```bash
   waza dev <skill-path> [--target medium-high] [--auto]
   # or
   waza dev <skill-path> --copilot [--model <id>]
   ```
5. Run and display output. After completion, suggest running `waza check` again.

**Sub-option B — waza quality**

1. Ask which skill and optionally which judge model.
2. Show command:
   ```bash
   waza quality <skill-path> [--model <id>] [--format table|json]
   ```
3. Run and explain the five quality dimensions:
   - **Clarity** — Is the skill description clear and unambiguous?
   - **Completeness** — Does it cover all relevant scenarios?
   - **Trigger Precision** — Will the agent invoke it at the right times?
   - **Scope Coverage** — Is the workflow fully described?
   - **Anti-patterns** — Any patterns that hurt effectiveness?
4. For scores below 3/5, suggest specific edits to the `SKILL.md`.

---

### Option 7 — Coverage report (waza coverage)

1. Ask output format: `text` (default), `markdown`, or `json`.
2. Show command:
   ```bash
   waza coverage [--format markdown]
   ```
3. Run and display the grid. Explain coverage levels:
   - **Full** — Has tasks + 2+ grader types
   - **Partial** — Has eval.yaml but missing tasks or grader variety
   - **None** — No eval suite at all
4. For partially- or uncovered skills, offer to scaffold evals (→ Option 2).

---

### Option 8 — Results dashboard (waza serve)

1. Ask for the results directory (default: `.`).
2. Ask port (default: `3000`).
3. Show command:
   ```bash
   waza serve [--port 3000] [--results-dir ./results]
   ```
4. Launch the server and open the browser.
5. Explain what the dashboard shows:
   - Task-level pass/fail status
   - Score distributions across trials
   - Model comparisons
   - Aggregated metrics and trends
6. Remind the user to stop the server with `Ctrl+C` when done.

---

### Option 9 — CI/CD integration

Walk the user through adding Waza to GitHub Actions:

1. Ask which skill(s) to include in CI.
2. Generate a `.github/workflows/eval.yml` scaffold:

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

3. Explain exit codes for CI gating (0 = pass, 1 = fail, 2 = config error).
4. Offer to add token budget gating:
   ```bash
   waza tokens compare main --skills --threshold 10 --strict
   ```
5. Write the file if the user confirms.

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
