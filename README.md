# SDLC Wizard

Configure your development environment with AI coding agents (Copilot, Codex, or Claude).

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

Run `wizard install` in your project folder. The installer will ask whether to install at **project level** (`.github/` and `.claude/` in the current directory) or **global level** (`~/.claude/` and `~/copilot/` for all projects).

```bash
wizard install
```

You can also skip the prompt with a flag:

```bash
wizard install --project   # project-level install
wizard install --global    # global-level install
```

The install command will:
- Create `.wizard.json` with version, step tracking, and install scope
- Install the `/sdlc-wizard` prompt to Copilot prompts and Claude commands directories
- Install shared skills to the Claude skills directory: DevContainer, Graphify, Implementation Plan, and SDLC Wizard

### 2. Use the wizard in your IDE

Open your IDE chat window with any AI coding agent (Copilot, Codex, or Claude) and invoke:

```
/sdlc-wizard
```

The wizard will interactively guide you through configuration steps. Currently available:

- **DevContainer** — Set up a `.devcontainer` environment with Docker Compose, Dockerfile, and devcontainer.json
- **Graphify** — Install and configure the graphify knowledge-graph skill
- **Implementation Plan** — Enable the standalone planning workflow that creates execution-ready implementation plans before coding starts
- **Fantastic 4** — Install a multi-agent orchestra for structured task execution

After the base install, you can also use `/implementation-plan` in your IDE chat to create a planning artifact for a feature or refactor.

### 3. Install the Fantastic 4 agent orchestra

You can install the Fantastic 4 directly via CLI or through the wizard. The same scope prompt (or flag) applies:

```bash
wizard install fantastic4
wizard install fantastic4 --project
wizard install fantastic4 --global
```

This installs:
- **5 agents** (Captain, Harper, Benjamin, Lucas, Bug-Fixer) for both Copilot and Claude Code
- **8 skills** (orchestrator, planner, coder, reviewer, bug-fixer, security-reviewer, implementation-debate, start-task) to the Claude skills directory
- **Global coding instructions** for both platforms
- **`lessons.md`** at project root for capturing patterns and mistakes
- **`tasks/`** directory for task implementation documents

After installation, use `@captain` in your IDE chat to begin a new task with Captain orchestrating the team.

## How it works

1. The `/sdlc-wizard` prompt starts an interactive conversation
2. You choose which step to configure (e.g., DevContainer, Implementation Plan, Fantastic 4)
3. The agent analyzes your codebase and asks clarifying questions
4. Once confirmed, a subagent creates the configuration files
5. The setup is validated (e.g., Docker build and start)
6. `.wizard.json` is updated to track completed steps

### Fantastic 4 workflow

When using `@captain`, Captain orchestrates a structured workflow using the start-task skill:

1. **Clarify** — Captain asks focused questions until the task is unambiguous
2. **Plan** — Harper decomposes the task into actionable specs and batch plans
3. **Execute** — Benjamin implements the code following the spec precisely
4. **Review** — Lucas validates against the spec and challenges assumptions
5. **Fix** — Bug-Fixer handles any test failures or issues
6. **Confirm** — Results are presented to the user for approval

## Project Structure

```
src/                  - Node.js CLI source
  cli.js              - CLI entry point and argument routing
  config.js           - Configuration management and path resolution
  commands/
    install.js        - Install command (config + prompts + skills)
templates/
  prompts/            - Prompt templates (thin wrappers referencing skills)
    sdlc-wizard.prompt.md - Thin wrapper that loads the sdlc-wizard skill
  skills/             - Skill files (installed to .claude/skills/)
    devcontainer-setup/    - DevContainer setup skill
    graphify-setup/        - Graphify setup skill
    implementation-plan/   - Standalone implementation planning skill
    sdlc-wizard/           - Interactive wizard skill (full behavior)
  fantastic4/         - Fantastic 4 agent orchestra templates
    agents/           - Agent definitions (copilot/ and claude-code/)
    skills/           - Agent skill definitions (including start-task)
    instructions/     - Global coding standards
    lessons.md        - Lessons learned template
```

## Development

```bash
npm install
npm test
```

## License

MIT