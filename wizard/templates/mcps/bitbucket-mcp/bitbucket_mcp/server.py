"""MCP server implementation using JSON-RPC 2.0 over stdio."""

import asyncio
import json
import sys


class McpServer:
    """A simple MCP server that communicates over stdio using JSON-RPC 2.0."""

    def __init__(self, name: str, env_params: list[dict] | None = None):
        self.name = name
        self.env_params = env_params or []
        self.tools: list[dict] = []

    def add_tool(self, name: str, description: str, handler) -> None:
        """Register a tool with the server."""
        self.tools.append({"name": name, "description": description, "handler": handler})

    def start(self) -> None:
        """Start the MCP server, reading JSON-RPC requests from stdin."""
        print(f"{self.name} MCP server started", file=sys.stderr)

        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                request = json.loads(line)
                response = asyncio.run(self._handle_request(request))
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
            except json.JSONDecodeError:
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": "Parse error"},
                    "id": None,
                }
                sys.stdout.write(json.dumps(error_response) + "\n")
                sys.stdout.flush()

    async def _handle_request(self, request: dict) -> dict:
        """Handle a single JSON-RPC request."""
        method = request.get("method")
        params = request.get("params", {})
        req_id = request.get("id")

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "result": {
                    "name": self.name,
                    "version": "1.0.0",
                    "capabilities": {"tools": {}},
                },
                "id": req_id,
            }

        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "result": {
                    "tools": [
                        {"name": t["name"], "description": t["description"]}
                        for t in self.tools
                    ]
                },
                "id": req_id,
            }

        if method == "tools/call":
            tool_name = params.get("name")
            tool = next((t for t in self.tools if t["name"] == tool_name), None)
            if not tool:
                return {
                    "jsonrpc": "2.0",
                    "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
                    "id": req_id,
                }
            result = await tool["handler"](params.get("arguments", {}))
            return {"jsonrpc": "2.0", "result": result, "id": req_id}

        return {
            "jsonrpc": "2.0",
            "error": {"code": -32601, "message": f"Unknown method: {method}"},
            "id": req_id,
        }
