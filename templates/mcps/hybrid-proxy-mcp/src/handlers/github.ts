/**
 * GitHub handler — MCP-to-MCP proxy.
 *
 * Spawns the official GitHub MCP server as a child process and communicates
 * with it over stdio using the MCP SDK Client.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GetPrDiffArgs, NormalizedDiffResult } from "../types.js";

/**
 * Parse owner and repo from a GitHub URL.
 * Supports formats like:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 */
export function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl.replace(/\.git$/, "");
  const url = new URL(cleaned);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error(
      `Invalid GitHub URL: ${repoUrl}. Expected format: https://github.com/owner/repo`,
    );
  }

  return { owner: segments[0], repo: segments[1] };
}

/**
 * Fetch a PR diff from GitHub by proxying through the official GitHub MCP server.
 */
export async function getGitHubDiff(
  args: GetPrDiffArgs,
): Promise<NormalizedDiffResult> {
  const { owner, repo } = parseGitHubUrl(args.repo_url);
  const prNumber = Number(args.pr_identifier);

  if (Number.isNaN(prNumber)) {
    throw new Error(
      `Invalid PR identifier for GitHub: "${args.pr_identifier}". Must be a number.`,
    );
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required for GitHub operations.",
    );
  }

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env as Record<string, string>,
      GITHUB_PERSONAL_ACCESS_TOKEN: githubToken,
    },
  });

  const client = new Client({ name: "hybrid-proxy", version: "1.0.0" });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_pull_request",
      arguments: { owner, repo, pull_number: prNumber },
    });

    const textContent =
      Array.isArray(result.content)
        ? result.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text)
            .join("\n")
        : String(result.content);

    return {
      platform: "github",
      repository: `${owner}/${repo}`,
      pr_identifier: String(prNumber),
      diff_content: textContent,
    };
  } finally {
    await client.close();
  }
}
