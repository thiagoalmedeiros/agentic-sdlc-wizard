You are a developer-experience expert. Set up graphify (https://github.com/safishamsi/graphify) for this project so that the AI coding assistant can navigate the codebase via a knowledge graph.

---

## Mode detection

Before doing anything else, check whether graphify is already configured:

- Look for any of: `CLAUDE.md`, `AGENTS.md`, `.graphifyignore`, or `.git/hooks/post-commit` containing a `graphify` reference
- If graphify **is already configured** → follow the **Audit existing configuration** flow below
- If graphify **is not yet configured** → follow the **New setup** flow below

---

## Prerequisites — verify before doing anything else (both flows)

1. Check that Python 3.10+ is installed by running `python3 --version` (or `python --version` on Windows)
2. If Python 3.10+ is **not available**:
   - Stop immediately
   - Inform the user that Python 3.10 or later is required
   - Provide a link: https://www.python.org/downloads/
   - Do **not** proceed with any installation
3. If Python 3.10+ is available, proceed

---

## New setup flow

### Step 1 — Install graphify

Run the following in the project root:

```bash
pip install graphifyy
```

> **Note on package name:** The PyPI package is `graphifyy` (double-y). `pip install graphify` installs an unrelated package. The CLI command itself is still `graphify` (single y).

On systems where `pip` maps to Python 2, use `pip3` instead.

### Step 2 — Detect the AI platform in use

Determine which AI coding assistant(s) are active in this project. Check for:

| Signal | Platform |
|--------|----------|
| `.claude/` directory or `CLAUDE.md` exists | **Claude Code** |
| `.codex/` directory or `AGENTS.md` exists | **Codex** |
| `.github/copilot-instructions.md` or `.github/prompts/` exists | **GitHub Copilot** |

If multiple platforms are detected, configure all of them.

### Step 3 — Install the graphify skill and always-on integration

For each detected platform, run the appropriate commands:

#### Claude Code
```bash
graphify install              # installs /graphify skill for Claude
graphify claude install       # writes CLAUDE.md section + PreToolUse hook
```

#### Codex
```bash
graphify install --platform codex   # installs $graphify skill for Codex
graphify codex install               # writes AGENTS.md section + PreToolUse hook
```

> **Note:** Codex also requires `multi_agent = true` under `[features]` in `~/.codex/config.toml` for parallel extraction. Inform the user to add this if it is not already present.

#### GitHub Copilot
```bash
graphify install --platform copilot   # installs skill to ~/.copilot/skills/
graphify copilot install               # writes project-level always-on instructions
```

### Step 4 — Install git hooks

Run from the project root:

```bash
graphify hook install
```

This installs two hooks in `.git/hooks/`:
- `post-commit` — rebuilds the knowledge graph after every commit
- `post-checkout` — rebuilds the knowledge graph after every branch switch

If a rebuild fails, the hook exits with a non-zero code so git surfaces the error instead of silently continuing. Hooks are local to the repository and are not committed — inform the user that teammates must run `graphify hook install` themselves.

### Step 5 — Create .graphifyignore

Create a `.graphifyignore` file at the project root to exclude directories that should not be included in the knowledge graph. Use `.gitignore` syntax:

```
node_modules/
dist/
build/
.git/
.venv/
__pycache__/
*.generated.*
graphify-out/
```

Adjust the patterns based on the project's actual build artefacts and third-party directories.

### Step 6 — DevContainer integration (conditional)

**Only if a `.devcontainer/` directory exists** in the project root:

Open `.devcontainer/Dockerfile` and add the graphify installation **after** the base image declaration, alongside other global tooling. If other `pip3` packages are already being installed in an existing `RUN` step, add `graphifyy` to that same step to keep the image lean:

```dockerfile
# Standalone (no other pip packages yet):
RUN pip3 install graphifyy

# Combined with other pip packages (preferred when applicable):
# RUN pip3 install graphifyy other-tool-1 other-tool-2
```

Rules:
- Use `pip3` (not `pip`) to be explicit about Python 3
- Add it in a combined `RUN` step with other pip-based tools if any already exist, to keep the image lean
- Do **not** add `graphify install` or `graphify hook install` to the Dockerfile — those commands interact with the AI assistant environment and must be run by the developer after the container starts
- After editing the Dockerfile, inform the user that they need to rebuild the devcontainer image for the change to take effect

### Step 7 — Build the initial graph

Run the following once to build the first knowledge graph from the project:

```bash
graphify .
```

This produces:
- `graphify-out/graph.html` — interactive graph (open in a browser)
- `graphify-out/GRAPH_REPORT.md` — plain-language summary of god nodes and communities
- `graphify-out/graph.json` — queryable persistent graph

### Step 8 — Update .gitignore

Add the graphify output directory to `.gitignore` so generated artefacts are not committed:

```
graphify-out/
```

---

## General guidelines

- All configuration files (`CLAUDE.md`, `AGENTS.md`, `.graphifyignore`) must be placed at the **project root**
- Git hooks are local (`.git/hooks/`) and are not committed — inform the user that teammates must run `graphify hook install` themselves
- The PyPI package is `graphifyy` (double-y); `graphify` on PyPI is an unrelated package
- Keep the `.graphifyignore` minimal — only exclude directories that add noise without adding signal

---

## Audit existing configuration flow

When graphify is already partially configured, check each component against the standards above.

### Step A1 — Read existing configuration

Check for the presence and content of:
- `CLAUDE.md` — should contain a graphify section
- `AGENTS.md` — should contain a graphify section
- `.graphifyignore` — should exist with relevant exclusions
- `.git/hooks/post-commit` — should call `graphify hook`
- `.devcontainer/Dockerfile` — should install `graphifyy` if devcontainer is in use

### Step A2 — Present findings

List each component with its status:
- ✅ Configured correctly
- ⚠️ Missing or incomplete — state what is missing and the specific change needed

### Step A3 — Interactive selection

Ask the user: "Which items would you like me to fix? (enter the numbers separated by commas, 'all' for everything, or 'none' to skip)"

### Step A4 — Apply selected fixes

Apply only the selected changes. Preserve all existing configuration that was not flagged.
