/**
 * URL-based router that determines which platform handler to invoke.
 *
 * To add a new platform (e.g. Linear):
 *  1. Add a pattern entry to {@link PLATFORM_PATTERNS}.
 *  2. Import and wire the handler in {@link routeFetchTicket} / {@link routeAddComment}.
 */

import { FetchTicketArgs, NormalizedTicketResult, Platform, AddCommentArgs, CommentResult } from "./types.js";
import { fetchTrelloTicket, addTrelloComment } from "./handlers/trello.js";
import { fetchJiraTicket, addJiraComment } from "./handlers/jira.js";

/** Map of hostname substrings to platform identifiers. */
const PLATFORM_PATTERNS: ReadonlyArray<{ pattern: string; platform: Platform }> = [
  { pattern: "trello.com", platform: "trello" },
  { pattern: "atlassian.net", platform: "jira" },
];

/** Detect the platform from a ticket URL. */
export function detectPlatform(ticketUrl: string): Platform {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (ticketUrl.includes(pattern)) {
      return platform;
    }
  }

  // Fallback heuristic: Jira self-hosted instances use /browse/PROJ-KEY paths
  if (/\/browse\/[A-Z][A-Z0-9]+-\d+/.test(ticketUrl)) {
    return "jira";
  }

  throw new Error(
    `Unsupported platform for URL: ${ticketUrl}. ` +
    `Supported platforms: Trello (trello.com), Jira (atlassian.net or /browse/ URLs)`
  );
}

/** Route a fetch_ticket request to the correct platform handler. */
export async function routeFetchTicket(
  args: FetchTicketArgs,
): Promise<NormalizedTicketResult> {
  const platform = detectPlatform(args.ticket_url);

  switch (platform) {
    case "trello":
      return fetchTrelloTicket(args);
    case "jira":
      return fetchJiraTicket(args);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`No handler for platform: ${_exhaustive}`);
    }
  }
}

/** Route an add_comment request to the correct platform handler. */
export async function routeAddComment(
  args: AddCommentArgs,
): Promise<CommentResult> {
  const platform = detectPlatform(args.ticket_url);

  switch (platform) {
    case "trello":
      return addTrelloComment(args);
    case "jira":
      return addJiraComment(args);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`No handler for platform: ${_exhaustive}`);
    }
  }
}
