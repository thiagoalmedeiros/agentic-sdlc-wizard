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

Installed skills:

| Skill | Purpose |
|-------|---------|
| `sdlc-wizard` | Interactive initial configuration (DevContainer, Graphify, Implementation Plan) |
| `sdlc-wizard-orchestrator` | Multi-skill task orchestrator (plan → code → review → fix) |
| `sdlc-wizard-implementation-plan` | Produce a `plans/<topic>/plan.md` + `lessons.md` planning artifact |
| `sdlc-wizard-implementation-debate` | Pre-plan multi-skill critique that feeds `sdlc-wizard-implementation-plan` |
| `sdlc-wizard-planner` | Architecture and specification skill used during orchestrated tasks |
| `sdlc-wizard-coder` | Implementation skill used during orchestrated tasks |
| `sdlc-wizard-reviewer` | Code review and contrarian skill used during orchestrated tasks |
| `sdlc-wizard-bug-fixer` | Autonomous debugging skill for failing tests and runtime errors |
| `sdlc-wizard-devcontainer-setup` | Set up or audit a `.devcontainer/` environment |
| `sdlc-wizard-graphify-setup` | Install and configure the graphify knowledge-graph skill |

### 2. Use the wizard in your IDE

Open your IDE chat (VS Code Copilot or Claude Code) and ask it to run a
skill by name.

- Ask for the `sdlc-wizard` skill to interactively configure
  **DevContainer**, **Graphify**, or **Implementation Plan**. It tracks
  completed steps in `.wizard.json`.
- Ask for the `sdlc-wizard-orchestrator` skill to begin an orchestrated task. It runs the
  full loop: clarify intent → plan (`sdlc-wizard-implementation-plan`) → code
  (`sdlc-wizard-coder`) → review (`sdlc-wizard-reviewer`) → fix (`sdlc-wizard-bug-fixer`) → debate gate
  across `sdlc-wizard-coder`/`sdlc-wizard-reviewer`/`sdlc-wizard-implementation-plan` → user confirmation.
- Ask for the `sdlc-wizard-implementation-plan` skill directly to create a planning
  artifact for a feature or refactor without going through the
  orchestrator.

### 3. Orchestrated task workflow

When you run the `sdlc-wizard-orchestrator` skill, it orchestrates a structured workflow:

1. **Init** — derive a kebab-case topic and run the clarification loop
   until the task is unambiguous.
2. **Plan** — dispatch the `sdlc-wizard-implementation-plan` skill, producing
   `plans/<topic>/plan.md` + `lessons.md`. For non-trivial work, the
   `sdlc-wizard-implementation-debate` skill feeds a multi-skill-critiqued brief
   into the plan first.
3. **Execute** — dispatch the `sdlc-wizard-coder` skill for each batch following
   `plan.md`.
4. **Review** — dispatch the `sdlc-wizard-reviewer` skill to validate against the
   spec and challenge assumptions.
5. **Fix** — dispatch the `sdlc-wizard-bug-fixer` skill if tests fail or issues
   surface.
6. **Debate Gate** — before every user-facing result, dispatch the
   `sdlc-wizard-coder`, `sdlc-wizard-reviewer`, and `sdlc-wizard-implementation-plan` skills in parallel for
   a consensus check.
7. **Confirm** — results are presented to the user for approval.

### Skill dispatch (platform-aware)

The `sdlc-wizard-orchestrator` skill dispatches subagents using the primitive of the active
harness. Skill names are identical across harnesses.

| Harness | Sequential | Parallel |
|---------|------------|----------|
| Claude Code | One subagent call that loads the skill | Multiple subagent calls in a single message, each loading a skill |
| GitHub Copilot | One subagent message referencing the skill by name | A single message dispatching multiple subagents, each referencing a skill by name |

The `sdlc-wizard-orchestrator` and `sdlc-wizard-implementation-debate` skills document the full
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
    sdlc-wizard/           - Interactive initial configuration
    wizard/                - Multi-skill task orchestrator
    implementation-plan/   - Standalone planning skill
    implementation-debate/ - Pre-plan multi-skill critique
    planner/               - Architecture / specification skill
    coder/                 - Implementation skill
    reviewer/              - Code review skill
    bug-fixer/             - Autonomous debugging skill
    devcontainer-setup/    - DevContainer setup skill
    graphify-setup/        - Graphify setup skill
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
