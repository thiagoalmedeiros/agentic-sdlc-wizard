"""Brave Search MCP server."""

from .server import McpServer


def main():
    """Start the Brave Search MCP server."""
    server = McpServer(
        name="brave-search-mcp",
        env_params=[
            {"name": "BRAVE_API_KEY", "description": "Brave Search API key", "required": True},
        ],
    )

    server.add_tool("web_search", "Search the web using Brave Search", web_search)
    server.add_tool("local_search", "Search for local businesses and places using Brave", local_search)

    server.start()


async def web_search(params):
    """Search the web using Brave Search API."""
    return {"description": "Searches the web using the Brave Search API and returns relevant results"}


async def local_search(params):
    """Search for local businesses and places."""
    return {"description": "Searches for local businesses and places using the Brave Local Search API"}


if __name__ == "__main__":
    main()
