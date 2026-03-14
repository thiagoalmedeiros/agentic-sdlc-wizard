#!/usr/bin/env node

/**
 * Source Ticket MCP Server
 *
 * A unified MCP gateway that exposes `fetch_ticket` and `add_comment` tools
 * and routes requests to the appropriate platform handler based on the ticket URL.
 *
 * Supported platforms:
 *   - Trello  (direct REST API integration)
 *   - Jira    (direct REST API v3 integration)
 *
 * To add a new platform (e.g. Linear):
 *   1. Create a handler in src/handlers/
 *   2. Register the platform pattern and handler in src/router.ts
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { routeFetchTicket, routeAddComment } from "./router.js";
import { formatTicketResult, FetchTicketArgs, formatCommentResult, AddCommentArgs } from "./types.js";

/** Create and configure the MCP server. */
export function createServer(): Server {
  const server = new Server(
    { name: "source-ticket-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  // ── List available tools ──────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "fetch_ticket",
        description:
          "Fetch ticket details from a ticketing platform. Automatically routes to the " +
          "correct platform (Trello or Jira) based on the ticket URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            ticket_url: {
              type: "string",
              description:
                "Full ticket URL (e.g. https://trello.com/c/abc123/my-card " +
                "or https://yourcompany.atlassian.net/browse/PROJ-123)",
            },
          },
          required: ["ticket_url"],
        },
      },
      {
        name: "add_comment",
        description:
          "Post a comment on a ticket. Automatically routes to the " +
          "correct platform (Trello or Jira) based on the ticket URL.",
        inputSchema: {
          type: "object" as const,
          properties: {
            ticket_url: {
              type: "string",
              description:
                "Full ticket URL (e.g. https://trello.com/c/abc123/my-card " +
                "or https://yourcompany.atlassian.net/browse/PROJ-123)",
            },
            comment: {
              type: "string",
              description: "The comment text to post on the ticket",
            },
          },
          required: ["ticket_url", "comment"],
        },
      },
    ],
  }));

  // ── Handle tool calls ─────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    if (toolName === "fetch_ticket") {
      const args = request.params.arguments as unknown as FetchTicketArgs;

      if (!args?.ticket_url) {
        throw new Error("ticket_url argument is required.");
      }

      try {
        const result = await routeFetchTicket(args);
        return {
          content: [{ type: "text", text: formatTicketResult(result) }],
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

    if (toolName === "add_comment") {
      const args = request.params.arguments as unknown as AddCommentArgs;

      if (!args?.ticket_url || !args?.comment) {
        throw new Error("ticket_url and comment arguments are required.");
      }

      try {
        const result = await routeAddComment(args);
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
  process.stderr.write("source-ticket-mcp server started\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
