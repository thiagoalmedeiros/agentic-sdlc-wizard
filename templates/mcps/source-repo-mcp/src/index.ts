#!/usr/bin/env node

/**
 * Hybrid Proxy MCP Server
 *
 * A unified MCP gateway that exposes a single `get_pr_diff` tool and routes
 * requests to the appropriate platform handler based on the repository URL.
 *
 * Supported platforms:
 *   - GitHub   (MCP-to-MCP proxy via @modelcontextprotocol/server-github)
 *   - Bitbucket (direct REST API integration)
 *
 * To add a new platform (e.g. Azure DevOps):
 *   1. Create a handler in src/handlers/
 *   2. Register the platform pattern and handler in src/router.ts
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { routeRequest, routeCommentRequest } from "./router.js";
import { formatDiffResult, GetPrDiffArgs, formatCommentResult, CommentOnPrArgs } from "./types.js";

/** Create and configure the MCP server. */
export function createServer(): Server {
  const server = new Server(
    { name: "source-repo-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // ── List available tools ──────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_pr_diff",
        description:
          "Fetch the diff for a Pull Request. Automatically routes to the " +
          "correct platform (GitHub or Bitbucket) based on the repository URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            repo_url: {
              type: "string",
              description:
                "Full repository URL (e.g. https://github.com/owner/repo " +
                "or https://bitbucket.org/workspace/repo_slug)",
            },
            pr_identifier: {
              type: "string",
              description:
                "Pull request identifier (number for GitHub, ID for Bitbucket)",
            },
          },
          required: ["repo_url", "pr_identifier"],
        },
      },
      {
        name: "comment_on_pr",
        description:
          "Post a general comment on a Pull Request. Automatically routes to the " +
          "correct platform (GitHub or Bitbucket) based on the repository URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            repo_url: {
              type: "string",
              description:
                "Full repository URL (e.g. https://github.com/owner/repo " +
                "or https://bitbucket.org/workspace/repo_slug)",
            },
            pr_identifier: {
              type: "string",
              description:
                "Pull request identifier (number for GitHub, ID for Bitbucket)",
            },
            comment: {
              type: "string",
              description: "The comment text to post on the pull request",
            },
          },
          required: ["repo_url", "pr_identifier", "comment"],
        },
      },
    ],
  }));

  // ── Handle tool calls ─────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    if (toolName === "get_pr_diff") {
      const args = request.params.arguments as unknown as GetPrDiffArgs;

      if (!args?.repo_url || !args?.pr_identifier) {
        throw new Error(
          "Both repo_url and pr_identifier arguments are required.",
        );
      }

      try {
        const result = await routeRequest(args);
        return {
          content: [{ type: "text", text: formatDiffResult(result) }],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }

    if (toolName === "comment_on_pr") {
      const args = request.params.arguments as unknown as CommentOnPrArgs;

      if (!args?.repo_url || !args?.pr_identifier || !args?.comment) {
        throw new Error(
          "repo_url, pr_identifier, and comment arguments are required.",
        );
      }

      try {
        const result = await routeCommentRequest(args);
        return {
          content: [{ type: "text", text: formatCommentResult(result) }],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${toolName}`);
  });

  return server;
}

/** Main entry point — start the server on stdio. */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("source-repo-mcp server started\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
