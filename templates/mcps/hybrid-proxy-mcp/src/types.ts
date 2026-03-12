/**
 * Shared types for the Hybrid Proxy MCP Server.
 *
 * Adding a new platform handler (e.g. Azure DevOps) requires:
 *  1. Creating a new handler in src/handlers/
 *  2. Adding the platform to {@link Platform} and {@link PLATFORM_PATTERNS}
 *  3. Registering the handler in {@link routeRequest} (router.ts)
 */

/** Supported source-control platforms. */
export type Platform = "github" | "bitbucket";

/** Input arguments for the get_pr_diff tool. */
export interface GetPrDiffArgs {
  repo_url: string;
  pr_identifier: string;
}

/** Normalised result returned by every platform handler. */
export interface NormalizedDiffResult {
  platform: Platform;
  repository: string;
  pr_identifier: string;
  diff_content: string;
}

/**
 * Format a {@link NormalizedDiffResult} into a stable text block that the
 * upstream AI agent can parse regardless of which platform produced it.
 */
export function formatDiffResult(result: NormalizedDiffResult): string {
  return [
    `=== Pull Request Diff ===`,
    `Platform: ${result.platform}`,
    `Repository: ${result.repository}`,
    `PR Identifier: ${result.pr_identifier}`,
    ``,
    result.diff_content,
    `=== End of Diff ===`,
  ].join("\n");
}
