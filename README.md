# Agentic SDLC Wizard

Install and configure AI agents, prompts, and MCP servers for your IDE.

## Installation

```bash
npm install -g agentic-sdlc-wizard
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

Run `wizard install mcps` to choose MCP servers (e.g. Bitbucket). The server files are copied locally and your IDE's `mcp.json` is configured automatically. Environment variables are referenced using `${input:VAR_NAME}` so the IDE can prompt for them.

```bash
wizard install mcps
```

The MCP servers run as local Node.js processes started via `node <path>/index.js`, making them available to Copilot and other AI tools through the standard MCP stdio protocol.

## Project Structure

```
templates/
  agents/       - Agent definition markdown files
  prompts/      - Prompt template markdown files
  mcps/         - MCP server implementations
    bitbucket-mcp/  - Bitbucket MCP server example
```

## License

MIT