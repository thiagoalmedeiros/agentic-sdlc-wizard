# SDLC Wizard

Configure your development environment with skills for AI coding
assistants (VS Code Copilot or Claude Code). The wizard is **skill-only**
— there are no agent persona definitions. Every capability is packaged as
a skill that any AI coding assistant can load.

## How the install target works

The wizard installs a single `.claude/` tree. VS Code Copilot reads
`.claude/` natively in recent versions, so the same skills and
instructions are available to both Copilot and Claude Code. There is no
`.github/` tree, no prompt wrappers, no agent definitions, and no
separate Copilot install directory.

## Installation

```bash
npm install -g agentic-sdlc-wizard
```

Or install from source:

```bash
git clone https://github.com/thiagoalmedeiros/agentic-sdlc-wizard.git
cd agentic-sdlc-wizard
npm install
npm link
```

After either method, verify with:

```bash
wizard --version
wizard --help
```

The project has no runtime dependencies — only `jest` as a dev
dependency.

## Usage

### 1. Install the wizard

Run `wizard install` in your project folder. An interactive menu will ask
whether to install at **project level** (`.claude/` in the current
directory) or **global level** (`~/.claude/` for all projects). Use the
up/down arrow keys to move between options and press **Space** or **Enter**
to confirm. In non-interactive environments (CI, pipes) the scope falls
back to `project` with a log message.

```bash
wizard install
```

The install command will:
- Create `.wizard.json` with version, step tracking, and install scope.
- Install every skill to `.claude/skills/`.
- Install global coding standards to `.claude/instructions/`.

To install only a chosen subset of skills, run:

```bash
wizard install skills
```

This shows an interactive multi-select menu. Use the up/down arrow
keys to move, **Space** to toggle a skill, and **Enter** to confirm.
In non-interactive environments (CI, pipes) all skills are selected by
default.

Installed skills:

| Skill | Purpose |
|-------|---------|
| `sdlc-wizard` | Interactive initial configuration (DevContainer, Graphify, Implementation Plan) |
| `sdlc-council` | Multi-skill task orchestrator (plan → code → review → fix) |
| `sdlc-implementation-plan` | Produce a `plans/<topic>/plan.md` planning artifact (delegates `lessons.md` init to `sdlc-lessons-learned`) |
| `sdlc-implementation-debate` | Pre-plan multi-skill critique that feeds `sdlc-implementation-plan` |
| `sdlc-lessons-learned` | Owns the per-plan `plans/<topic>/lessons.md` lifecycle (init / read / append) |
| `sdlc-council-daedalus` | Architecture and specification skill used during orchestrated tasks |
| `sdlc-council-hephaestus` | Implementation skill used during orchestrated tasks |
| `sdlc-council-thomas` | Code review and contrarian skill used during orchestrated tasks |
| `sdlc-council-sherlock` | Autonomous debugging skill for failing tests and runtime errors |
| `sdlc-devcontainer-setup` | Set up or audit a `.devcontainer/` environment |
| `sdlc-graphify-setup` | Install and configure the graphify knowledge-graph skill |

### 2. Use the wizard in your IDE

Open your IDE chat (VS Code Copilot or Claude Code) and ask it to run a
skill by name.

- Ask for the `sdlc-wizard` skill to interactively configure
  **DevContainer**, **Graphify**, or **Implementation Plan**. It tracks
  completed steps in `.wizard.json`.
- Ask for the `sdlc-council` skill to begin an orchestrated task. It runs the
  full loop: clarify intent → plan (`sdlc-implementation-plan`) → code
  (`sdlc-council-hephaestus`) → review (`sdlc-council-thomas`) → fix (`sdlc-council-sherlock`) → debate gate
  across `sdlc-council-hephaestus`/`sdlc-council-thomas`/`sdlc-implementation-plan` → user confirmation.
- Ask for the `sdlc-implementation-plan` skill directly to create a planning
  artifact for a feature or refactor without going through the
  orchestrator.

### 3. Orchestrated task workflow

When you run the `sdlc-council` skill, it orchestrates a structured workflow:

1. **Init** — derive a kebab-case topic and run the clarification loop
   until the task is unambiguous.
2. **Plan** — dispatch the `sdlc-implementation-plan` skill, producing
   `plans/<topic>/plan.md` + `lessons.md`. For non-trivial work, the
   `sdlc-implementation-debate` skill feeds a multi-skill-critiqued brief
   into the plan first.
3. **Execute** — dispatch the `sdlc-council-hephaestus` skill for each batch following
   `plan.md`.
4. **Review** — dispatch the `sdlc-council-thomas` skill to validate against the
   spec and challenge assumptions.
5. **Fix** — dispatch the `sdlc-council-sherlock` skill if tests fail or issues
   surface.
6. **Debate Gate** — before every user-facing result, dispatch the
   `sdlc-council-hephaestus`, `sdlc-council-thomas`, and `sdlc-implementation-plan` skills in parallel for
   a consensus check.
7. **Confirm** — results are presented to the user for approval.

### Skill dispatch (platform-aware)

The `sdlc-council` skill dispatches subagents using the primitive of the active
harness. Skill names are identical across harnesses.

| Harness | Sequential | Parallel |
|---------|------------|----------|
| Claude Code | One subagent call that loads the skill | Multiple subagent calls in a single message, each loading a skill |
| GitHub Copilot | One subagent message referencing the skill by name | A single message dispatching multiple subagents, each referencing a skill by name |

The `sdlc-council` and `sdlc-implementation-debate` skills document the full
dispatch protocol. Cross-harness dispatch is not supported.

## Project Structure

```
src/                  - Node.js CLI source
  cli.js              - CLI entry point and argument routing
  config.js           - Configuration management and path resolution
  commands/
    install.js        - Install command (config + skills + instructions)
templates/
  skills/             - Skills installed to .claude/skills/
    sdlc-wizard/                 - Interactive initial configuration
    sdlc-council/                - Multi-skill task orchestrator
    sdlc-implementation-plan/    - Standalone planning skill
    sdlc-implementation-debate/  - Pre-plan multi-skill critique
    sdlc-council-daedalus/                - Architecture / specification skill
    sdlc-council-hephaestus/                  - Implementation skill
    sdlc-council-thomas/               - Code review skill
    sdlc-council-sherlock/              - Autonomous debugging skill
    sdlc-lessons-learned/        - Per-plan lessons.md lifecycle
    sdlc-devcontainer-setup/     - DevContainer setup skill
    sdlc-graphify-setup/         - Graphify setup skill
  instructions/       - Installed to .claude/instructions/
    global-coding.instructions.md
```

## Development

```bash
npm install
npm test
```

## License

MIT
