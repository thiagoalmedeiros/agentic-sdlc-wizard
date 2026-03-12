/**
 * Bitbucket handler — Direct REST API integration.
 *
 * Uses the Bitbucket 2.0 REST API directly (no secondary MCP server).
 * Authenticates via Basic Auth with BITBUCKET_EMAIL and
 * BITBUCKET_TOKEN environment variables.
 */

import { GetPrDiffArgs, NormalizedDiffResult } from "../types.js";

/**
 * Parse workspace and repo slug from a Bitbucket URL.
 * Supports formats like:
 *   https://bitbucket.org/workspace/repo_slug
 *   https://bitbucket.org/workspace/repo_slug.git
 */
export function parseBitbucketUrl(
  repoUrl: string,
): { workspace: string; repoSlug: string } {
  const cleaned = repoUrl.replace(/\.git$/, "");
  const url = new URL(cleaned);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error(
      `Invalid Bitbucket URL: ${repoUrl}. Expected format: https://bitbucket.org/workspace/repo_slug`,
    );
  }

  return { workspace: segments[0], repoSlug: segments[1] };
}

/**
 * Build the Authorization header for Bitbucket Basic Auth.
 */
function getBitbucketAuthHeader(): string {
  const email = process.env.BITBUCKET_EMAIL;
  const token = process.env.BITBUCKET_TOKEN;

  if (!email || !token) {
    throw new Error(
      "BITBUCKET_EMAIL and BITBUCKET_TOKEN environment variables " +
      "are required for Bitbucket operations.",
    );
  }

  const encoded = Buffer.from(`${email}:${token}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Fetch a PR diff from Bitbucket via the REST API.
 */
export async function getBitbucketDiff(
  args: GetPrDiffArgs,
): Promise<NormalizedDiffResult> {
  const { workspace, repoSlug } = parseBitbucketUrl(args.repo_url);
  const prId = args.pr_identifier;

  const apiUrl =
    `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diff`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: getBitbucketAuthHeader(),
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Bitbucket API error: ${response.status} ${response.statusText} for ${apiUrl}`,
    );
  }

  const diffContent = await response.text();

  return {
    platform: "bitbucket",
    repository: `${workspace}/${repoSlug}`,
    pr_identifier: String(prId),
    diff_content: diffContent,
  };
}
