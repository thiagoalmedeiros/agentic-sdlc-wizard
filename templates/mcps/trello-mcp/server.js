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

// Boards

async function listBoards(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Lists all boards for the authenticated user (GET /members/me/boards)",
    baseUrl,
  };
}

async function getBoard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Get board details by ID (GET /boards/{id})",
    baseUrl,
  };
}

// Lists

async function getBoardLists(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Get all lists on a board (GET /boards/{id}/lists)",
    baseUrl,
  };
}

async function createList(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Create a new list on a board (POST /boards/{id}/lists)",
    baseUrl,
  };
}

// Cards

async function getListCards(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Get all cards in a list (GET /lists/{id}/cards)",
    baseUrl,
  };
}

async function getCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Get card details by ID (GET /cards/{id})",
    baseUrl,
  };
}

async function createCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Create a new card in a list, requires idList (POST /cards)",
    baseUrl,
  };
}

async function updateCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Update card fields such as name, desc, due, idList (PUT /cards/{id})",
    baseUrl,
  };
}

async function deleteCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Delete a card (DELETE /cards/{id})",
    baseUrl,
  };
}

// Comments

async function addComment(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Add a new comment to a card (POST /cards/{id}/actions/comments)",
    baseUrl,
  };
}

async function getCardComments(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Get comments and actions on a card (GET /cards/{id}/actions)",
    baseUrl,
  };
}

// Members

async function getBoardMembers(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "List members of a board (GET /boards/{id}/members)",
    baseUrl,
  };
}

async function assignMember(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Add a member to a card (POST /cards/{id}/idMembers)",
    baseUrl,
  };
}

async function removeMember(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Remove a member from a card (DELETE /cards/{id}/idMembers/{idMember})",
    baseUrl,
  };
}

// Labels

async function getBoardLabels(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "List labels on a board (GET /boards/{id}/labels)",
    baseUrl,
  };
}

async function addLabelToCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description: "Add a label to a card (POST /cards/{id}/idLabels)",
    baseUrl,
  };
}

async function removeLabelFromCard(_params) {
  const baseUrl = process.env.TRELLO_BASE_URL || "https://api.trello.com/1";
  return {
    description:
      "Remove a label from a card (DELETE /cards/{id}/idLabels/{idLabel})",
    baseUrl,
  };
}

const server = new McpServer("trello-mcp", [
  {
    name: "TRELLO_API_KEY",
    description: "Trello API key",
    required: true,
  },
  {
    name: "TRELLO_TOKEN",
    description: "Trello personal access token",
    required: true,
  },
  {
    name: "TRELLO_BASE_URL",
    description: "Trello API base URL",
    required: false,
    default: "https://api.trello.com/1",
  },
]);

// Boards
server.addTool("list_boards", "List all boards for the authenticated user", listBoards);
server.addTool("get_board", "Get board details by ID", getBoard);

// Lists
server.addTool("get_board_lists", "Get all lists on a board", getBoardLists);
server.addTool("create_list", "Create a new list on a board", createList);

// Cards
server.addTool("get_list_cards", "Get all cards in a list", getListCards);
server.addTool("get_card", "Get card details by ID", getCard);
server.addTool("create_card", "Create a new card in a list", createCard);
server.addTool("update_card", "Update card fields", updateCard);
server.addTool("delete_card", "Delete a card", deleteCard);

// Comments
server.addTool("add_comment", "Add a comment to a card", addComment);
server.addTool("get_card_comments", "Get comments on a card", getCardComments);

// Members
server.addTool("get_board_members", "List members of a board", getBoardMembers);
server.addTool("assign_member", "Add a member to a card", assignMember);
server.addTool("remove_member", "Remove a member from a card", removeMember);

// Labels
server.addTool("get_board_labels", "List labels on a board", getBoardLabels);
server.addTool("add_label_to_card", "Add a label to a card", addLabelToCard);
server.addTool(
  "remove_label_from_card",
  "Remove a label from a card",
  removeLabelFromCard
);

server.start();
