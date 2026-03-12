/**
 * GitHub handler — Direct REST API integration.
 *
 * Uses the GitHub REST API directly (no secondary MCP server).
 * Authenticates via Bearer token using the GITHUB_TOKEN environment variable.
 */

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
 * Fetch a PR diff from GitHub using the REST API directly.
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

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.diff",
      "User-Agent": "hybrid-proxy-mcp",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status}: ${response.statusText} for ${apiUrl}`,
    );
  }

  const diffContent = await response.text();

  return {
    platform: "github",
    repository: `${owner}/${repo}`,
    pr_identifier: String(prNumber),
    diff_content: diffContent,
  };
}
