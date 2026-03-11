#!/usr/bin/env node
"use strict";

const readline = require("readline");

class McpServer {
  constructor(name, envParams) {
    this.name = name;
    this.envParams = envParams || [];
    this.tools = [];
  }

  addTool(name, description, handler) {
    this.tools.push({ name, description, handler });
  }

  start() {
    process.stderr.write(this.name + " MCP server started\n");

    const rl = readline.createInterface({ input: process.stdin });

    rl.on("line", async (line) => {
      line = line.trim();
      if (!line) return;

      try {
        const request = JSON.parse(line);
        const response = await this._handleRequest(request);
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch (_e) {
        const errorResponse = {
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        };
        process.stdout.write(JSON.stringify(errorResponse) + "\n");
      }
    });
  }

  async _handleRequest(request) {
    const method = request.method;
    const params = request.params || {};
    const reqId = request.id;

    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        result: {
          name: this.name,
          version: "1.0.0",
          capabilities: { tools: {} },
        },
        id: reqId,
      };
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        result: {
          tools: this.tools.map((t) => ({
            name: t.name,
            description: t.description,
          })),
        },
        id: reqId,
      };
    }

    if (method === "tools/call") {
      const toolName = params.name;
      const tool = this.tools.find((t) => t.name === toolName);
      if (!tool) {
        return {
          jsonrpc: "2.0",
          error: { code: -32601, message: "Unknown tool: " + toolName },
          id: reqId,
        };
      }
      const result = await tool.handler(params.arguments || {});
      return { jsonrpc: "2.0", result: result, id: reqId };
    }

    return {
      jsonrpc: "2.0",
      error: { code: -32601, message: "Unknown method: " + method },
      id: reqId,
    };
  }
}

async function listRepos(_params) {
  const baseUrl = process.env.BITBUCKET_URL || "https://api.bitbucket.org/2.0";
  return {
    description:
      "Lists all repositories in the specified Bitbucket project",
    baseUrl,
  };
}

async function getPullRequests(_params) {
  const baseUrl = process.env.BITBUCKET_URL || "https://api.bitbucket.org/2.0";
  return {
    description: "Retrieves pull requests for the specified repository",
    baseUrl,
  };
}

async function createPullRequest(_params) {
  const baseUrl = process.env.BITBUCKET_URL || "https://api.bitbucket.org/2.0";
  return {
    description:
      "Creates a new pull request in the specified repository",
    baseUrl,
  };
}

const server = new McpServer("bitbucket-mcp", [
  {
    name: "BITBUCKET_URL",
    description: "Bitbucket API URL",
    required: false,
    default: "https://api.bitbucket.org/2.0",
  },
  {
    name: "BITBUCKET_TOKEN",
    description: "Bitbucket personal access token",
    required: true,
  },
  {
    name: "BITBUCKET_USERNAME",
    description: "Bitbucket username",
    required: false,
  },
]);

server.addTool("list_repos", "List repositories for a project", listRepos);
server.addTool(
  "get_pull_requests",
  "Get pull requests for a repository",
  getPullRequests
);
server.addTool(
  "create_pull_request",
  "Create a new pull request",
  createPullRequest
);

server.start();
