# Agentic SDLC Wizard

Install and configure AI agents, prompts, and MCP servers for your IDE.

## Installation

```bash
uv tool install agentic-sdlc-wizard
```

Or install from source:

```bash
uv pip install -e .
```

## Usage

### 1. Initialize configuration

Run `wizard install` in your project folder. A multi-select prompt will ask which IDEs you need support for (VS Code, Antigravity). Your selection is saved to `.wizard.json`.

```bash
wizard install
```

### 2. Install agents

Run `wizard install agents` to choose agent definitions. Selected agents are copied to `.vscode/agents/` and/or `.antigravity/agents/` so they appear as custom agents in your IDE chat window.

```bash
wizard install agents
```

### 3. Install prompts

Run `wizard install prompts` to choose prompt templates. Selected prompts are copied to the IDE-specific prompts directory.

```bash
wizard install prompts
```

### 4. Install MCP servers

Run `wizard install mcps` to choose MCP servers (e.g. Bitbucket, Brave Search). The server files are copied locally and your IDE's `mcp.json` is configured automatically. Environment variables are referenced using `${input:VAR_NAME}` so the IDE can prompt for them.

```bash
wizard install mcps
```

The MCP servers are Python packages run via `uv run python -m <module>`, making them available to Copilot and other AI tools through the standard MCP stdio protocol.

### 5. Install everything at once

Run `wizard install all` to install all available agents, prompts, and MCP servers at once without interactive selection.

```bash
wizard install all
```

## Project Structure

```
wizard/              - Python CLI package
  cli.py             - CLI entry point and argument routing
  config.py          - Configuration management
  commands/          - Command implementations
    install.py       - IDE selection
    install_agents.py  - Agent installation
    install_prompts.py - Prompt installation
    install_mcps.py    - MCP server installation
templates/
  agents/            - Agent definition markdown files
  prompts/           - Prompt template markdown files
  mcps/              - MCP server implementations
    bitbucket-mcp/   - Bitbucket MCP server (Python, pyproject.toml)
    brave-search-mcp/ - Brave Search MCP server (Python, pyproject.toml)
```

## Development

```bash
uv sync
uv run pytest
```

## License

MIT