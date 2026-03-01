"""Bitbucket MCP server."""

import json
import sys

from .server import McpServer


def main():
    """Start the Bitbucket MCP server."""
    server = McpServer(
        name="bitbucket-mcp",
        env_params=[
            {"name": "BITBUCKET_URL", "description": "Bitbucket server URL", "required": True},
            {"name": "BITBUCKET_TOKEN", "description": "Bitbucket personal access token", "required": True},
            {"name": "BITBUCKET_USERNAME", "description": "Bitbucket username", "required": False},
        ],
    )

    server.add_tool("list_repos", "List repositories for a project", list_repos)
    server.add_tool("get_pull_requests", "Get pull requests for a repository", get_pull_requests)
    server.add_tool("create_pull_request", "Create a new pull request", create_pull_request)

    server.start()


async def list_repos(params):
    """List repositories."""
    return {"description": "Lists all repositories in the specified Bitbucket project"}


async def get_pull_requests(params):
    """Get pull requests."""
    return {"description": "Retrieves pull requests for the specified repository"}


async def create_pull_request(params):
    """Create a pull request."""
    return {"description": "Creates a new pull request in the specified repository"}


if __name__ == "__main__":
    main()
