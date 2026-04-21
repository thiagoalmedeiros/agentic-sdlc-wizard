# SDLC Wizard

Configure your development environment with AI coding agents (VS Code Copilot or Claude Code).

## How the install targets work

The wizard installs a single `.claude/` tree. VS Code Copilot reads `.claude/`
natively in recent versions, so the same skills, agents, and instructions
are available to both Copilot and Claude Code. There is no `.github/`
tree, no prompt wrappers, and no separate Copilot install directory.

## Installation

```bash
npm install -g agentic-sdlc-wizard
```

Or install from source:

```bash
npm install
npm link
```

## Usage

### 1. Install the wizard

Run `wizard install` in your project folder. An interactive menu will ask
whether to install at **project level** (`.claude/` in the current
directory) or **global level** (`~/.claude/` for all projects). Use the
up/down arrow keys to move between options and press **Space** or **Enter**
to confirm.

```bash
wizard install
```

The install command will:
- Create `.wizard.json` with version, step tracking, and install scope.
- Install the shared skills to `.claude/skills/`: **DevContainer**,
  **Graphify**, **Implementation Plan**, and **SDLC Wizard**.

### 2. Use the wizard in your IDE

Open your IDE chat (VS Code Copilot or Claude Code) and ask it to run the
`sdlc-wizard` skill. The wizard will interactively guide you through the
available configuration steps:

- **DevContainer** — Set up a `.devcontainer` environment (Docker Compose +
  Dockerfile + `devcontainer.json`).
- **Graphify** — Install and configure the graphify knowledge-graph skill.
- **Implementation Plan** — Enable the standalone planning workflow that
  creates execution-ready implementation plans before coding starts.
- **Fantastic 4** — Install a multi-agent orchestra for structured task
  execution.

You can also invoke the `implementation-plan` skill directly when you want
to create a planning artifact for a feature or refactor without going
through the wizard.

### 3. Install the Fantastic 4 agent orchestra

Install via CLI or through the wizard. The interactive scope menu appears
here too:

```bash
wizard install fantastic4
```

This installs:
- **5 agents** (Captain, Harper, Benjamin, Lucas, Bug-Fixer) to
  `.claude/agents/`. A single agent definition per role — each skill
  describes how the active harness (Claude Code or Copilot) dispatches
  them.
- **6 skills** (orchestrator, planner, coder, reviewer, bug-fixer,
  implementation-debate) to `.claude/skills/`.
- **Global coding instructions** to `.claude/instructions/`.

The Fantastic 4 team produces the **same plan artifact** as running the
`implementation-plan` skill directly — `plans/<topic>/plan.md` +
`lessons.md`. The team path only goes deeper, because Harper's draft is
shaped by Benjamin and Lucas before the user sees it. No project-root
`lessons.md` or `tasks/` directory is created.

After installation, use `@captain` in your IDE chat to begin a new task
with Captain orchestrating the team.

## How it works

1. The `sdlc-wizard` skill starts an interactive conversation when you ask
   your IDE to run it.
2. You choose which step to configure (DevContainer, Graphify,
   Implementation Plan, Fantastic 4).
3. The agent analyzes your codebase and asks clarifying questions.
4. Once confirmed, a subagent creates the configuration files.
5. The setup is validated (e.g., Docker build and start).
6. `.wizard.json` is updated to track completed steps.

### Fantastic 4 workflow

When using `@captain`, Captain orchestrates a structured workflow defined
by the `orchestrator` skill:

1. **Init** — Captain derives a kebab-case topic and runs the
   clarification loop until the task is unambiguous.
2. **Plan** — Harper runs the `implementation-plan` skill, producing
   `plans/<topic>/plan.md` + `lessons.md`. For non-trivial work, the
   `implementation-debate` skill feeds a team-critiqued brief into the
   plan first.
3. **Execute** — Benjamin implements each batch following `plan.md`.
4. **Review** — Lucas validates against the spec and challenges
   assumptions.
5. **Fix** — Bug-Fixer handles any test failures or issues.
6. **Debate Gate** — Before every user-facing result, Captain dispatches
   Benjamin, Lucas, and Harper in parallel for a consensus check.
7. **Confirm** — Results are presented to the user for approval.

### Agent dispatch (platform-aware)

Captain dispatches team members using the primitive of the active harness:

| Harness | Sequential | Parallel |
|---------|-----------|----------|
| Claude Code | One `Agent(<name>, ...)` call | Multiple `Agent(...)` calls in one message |
| GitHub Copilot | `@agentname` mention | `/fleet` command with multiple `@agent` mentions |

The orchestrator and implementation-debate skills document the full
dispatch protocol. Cross-harness dispatch is not supported.

## Project Structure

```
src/                  - Node.js CLI source
  cli.js              - CLI entry point and argument routing
  config.js           - Configuration management and path resolution
  commands/
    install.js        - Install command (config + skills + fantastic4)
templates/
  skills/             - Skills installed to .claude/skills/
    devcontainer-setup/    - DevContainer setup skill
    graphify-setup/        - Graphify setup skill
    implementation-plan/   - Standalone implementation planning skill
    sdlc-wizard/           - Interactive wizard skill (full behavior)
  fantastic4/         - Fantastic 4 agent orchestra templates
    agents/           - Agent definitions (installed to .claude/agents/)
    skills/           - Agent skill definitions
    instructions/     - Global coding standards
```

## Development

```bash
npm install
npm test
```

## License

MIT
