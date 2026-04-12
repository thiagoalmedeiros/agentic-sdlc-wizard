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

Run `wizard install` in your project folder. This creates the configuration file (`.wizard.json`), installs prompt files and skills.

```bash
wizard install
```

The install command will:
- Create `.wizard.json` with version and step tracking
- Install the `/sdlc-wizard` prompt to `.github/prompts/` (Copilot) and `.claude/commands/` (Claude)
- Install skills to `.claude/skills/` (readable by both Copilot and Claude)

### 2. Use the wizard in your IDE

Open your IDE chat window with any AI coding agent (Copilot, Codex, or Claude) and invoke:

```
/sdlc-wizard
```

The wizard will interactively guide you through configuration steps. Currently available:

- **DevContainer** — Set up a `.devcontainer` environment with Docker Compose, Dockerfile, and devcontainer.json

## How it works

1. The `/sdlc-wizard` prompt starts an interactive conversation
2. You choose which step to configure (e.g., DevContainer)
3. The agent analyzes your codebase and asks clarifying questions
4. Once confirmed, a subagent creates the configuration files
5. The setup is validated (e.g., Docker build and start)
6. `.wizard.json` is updated to track completed steps

## Project Structure

```
src/                  - Node.js CLI source
  cli.js              - CLI entry point and argument routing
  config.js           - Configuration management
  commands/
    install.js        - Install command (config + prompts + skills)
templates/
  prompts/            - Prompt templates (installed for Copilot and Claude)
    sdlc-wizard.md    - Interactive wizard prompt
  skills/             - Skill files (installed to .claude/skills/)
    devcontainer-setup.md - DevContainer setup skill
```

## Development

```bash
npm install
npm test
```

## License

MIT