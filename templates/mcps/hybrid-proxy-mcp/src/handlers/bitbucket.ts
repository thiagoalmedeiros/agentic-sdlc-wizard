/**
 * Bitbucket handler — Direct REST API integration.
 *
 * Uses the Bitbucket 2.0 REST API directly (no secondary MCP server).
 * Authenticates via Basic Auth with BITBUCKET_EMAIL and
 * BITBUCKET_TOKEN environment variables.
 */

import axios, { type AxiosInstance } from "axios";
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
 * Create an axios client for Bitbucket API with auth-aware redirect handling.
 *
 * The Bitbucket diff endpoint (and others) returns a 302 redirect.
 * By default, axios strips auth headers on redirects. This client
 * disables automatic redirects and follows them manually with auth intact.
 */
export function createBitbucketClient(): AxiosInstance {
  const email = process.env.BITBUCKET_EMAIL;
  const token = process.env.BITBUCKET_TOKEN;

  if (!email || !token) {
    throw new Error(
      "BITBUCKET_EMAIL and BITBUCKET_TOKEN environment variables " +
      "are required for Bitbucket operations.",
    );
  }

  const client = axios.create({
    baseURL: "https://api.bitbucket.org/2.0",
    auth: {
      username: email,
      password: token,
    },
    maxRedirects: 0,
    validateStatus: (s: number) => (s >= 200 && s < 300) || s === 302,
  });

  client.interceptors.response.use(async (response) => {
    if (response.status === 302 && response.headers.location) {
      return client.request({
        ...response.config,
        url: response.headers.location,
        baseURL: undefined,
        maxRedirects: 5,
        validateStatus: (s: number) => s >= 200 && s < 300,
      });
    }
    return response;
  });

  return client;
}

/**
 * Fetch a PR diff from Bitbucket via the REST API.
 */
export async function getBitbucketDiff(
  args: GetPrDiffArgs,
  client: AxiosInstance = createBitbucketClient(),
): Promise<NormalizedDiffResult> {
  const { workspace, repoSlug } = parseBitbucketUrl(args.repo_url);
  const prId = args.pr_identifier;

  const response = await client.get(
    `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diff`,
    {
      headers: { Accept: "text/plain" },
      responseType: "text",
    },
  );

  return {
    platform: "bitbucket",
    repository: `${workspace}/${repoSlug}`,
    pr_identifier: String(prId),
    diff_content: response.data as string,
  };
}
