/**
 * URL-based router that determines which platform handler to invoke.
 *
 * To add a new platform (e.g. Azure DevOps):
 *  1. Add a pattern entry to {@link PLATFORM_PATTERNS}.
 *  2. Import and wire the handler in {@link routeRequest}.
 */

import { GetPrDiffArgs, NormalizedDiffResult, Platform, CommentOnPrArgs, CommentResult } from "./types.js";
import { getGitHubDiff, commentOnGitHubPr } from "./handlers/github.js";
import { getBitbucketDiff, commentOnBitbucketPr } from "./handlers/bitbucket.js";

/** Map of hostname substrings to platform identifiers. */
const PLATFORM_PATTERNS: ReadonlyArray<{ pattern: string; platform: Platform }> = [
  { pattern: "github.com", platform: "github" },
  { pattern: "bitbucket.org", platform: "bitbucket" },
];

/** Detect the platform from a repository URL. */
export function detectPlatform(repoUrl: string): Platform {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (repoUrl.includes(pattern)) {
      return platform;
    }
  }
  throw new Error(
    `Unsupported platform for URL: ${repoUrl}. ` +
    `Supported platforms: ${PLATFORM_PATTERNS.map((p) => p.pattern).join(", ")}`
  );
}

/** Route a get_pr_diff request to the correct platform handler. */
export async function routeRequest(
  args: GetPrDiffArgs,
): Promise<NormalizedDiffResult> {
  const platform = detectPlatform(args.repo_url);

  switch (platform) {
    case "github":
      return getGitHubDiff(args);
    case "bitbucket":
      return getBitbucketDiff(args);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`No handler for platform: ${_exhaustive}`);
    }
  }
}

/** Route a comment_on_pr request to the correct platform handler. */
export async function routeCommentRequest(
  args: CommentOnPrArgs,
): Promise<CommentResult> {
  const platform = detectPlatform(args.repo_url);

  switch (platform) {
    case "github":
      return commentOnGitHubPr(args);
    case "bitbucket":
      return commentOnBitbucketPr(args);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`No handler for platform: ${_exhaustive}`);
    }
  }
}
