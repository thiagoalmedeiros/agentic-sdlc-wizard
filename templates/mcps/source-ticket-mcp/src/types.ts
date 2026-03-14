/**
 * Shared types for the Source Ticket MCP Server.
 *
 * Adding a new platform handler (e.g. Linear):
 *  1. Create a new handler in src/handlers/
 *  2. Add the platform to {@link Platform} and PLATFORM_PATTERNS in router.ts
 *  3. Register the handler in {@link routeFetchTicket} / {@link routeAddComment}
 */

/** Supported ticket platforms. */
export type Platform = "trello" | "jira";

/** Input arguments for the fetch_ticket tool. */
export interface FetchTicketArgs {
  ticket_url: string;
}

/** A single comment on a ticket. */
export interface TicketComment {
  author: string;
  body: string;
  created: string;
}

/** Normalised result returned by every platform handler for fetch_ticket. */
export interface NormalizedTicketResult {
  platform: Platform;
  ticket_id: string;
  title: string;
  description: string;
  status: string;
  assignee: string | null;
  labels: string[];
  priority: string | null;
  created: string | null;
  updated: string | null;
  comments: TicketComment[];
  url: string;
  raw: Record<string, unknown>;
}

/** Input arguments for the add_comment tool. */
export interface AddCommentArgs {
  ticket_url: string;
  comment: string;
}

/** Result returned after posting a ticket comment. */
export interface CommentResult {
  platform: Platform;
  ticket_id: string;
  comment_id: string;
  url: string;
}

/**
 * Format a {@link NormalizedTicketResult} into a stable text block that the
 * upstream AI agent can parse regardless of which platform produced it.
 */
export function formatTicketResult(result: NormalizedTicketResult): string {
  const lines = [
    `=== Ticket Details ===`,
    `Platform: ${result.platform}`,
    `Ticket ID: ${result.ticket_id}`,
    `Title: ${result.title}`,
    `Status: ${result.status}`,
    `Priority: ${result.priority ?? "N/A"}`,
    `Assignee: ${result.assignee ?? "Unassigned"}`,
    `Labels: ${result.labels.length > 0 ? result.labels.join(", ") : "None"}`,
    `Created: ${result.created ?? "N/A"}`,
    `Updated: ${result.updated ?? "N/A"}`,
    `URL: ${result.url}`,
    ``,
    `--- Description ---`,
    result.description || "(no description)",
    ``,
  ];

  if (result.comments.length > 0) {
    lines.push(`--- Comments (${result.comments.length}) ---`);
    for (const c of result.comments) {
      lines.push(`[${c.created}] ${c.author}: ${c.body}`);
    }
    lines.push(``);
  }

  lines.push(`=== End of Ticket ===`);
  return lines.join("\n");
}

/**
 * Format a {@link CommentResult} into a stable text block.
 */
export function formatCommentResult(result: CommentResult): string {
  return [
    `=== Ticket Comment ===`,
    `Platform: ${result.platform}`,
    `Ticket ID: ${result.ticket_id}`,
    `Comment ID: ${result.comment_id}`,
    `URL: ${result.url}`,
    `=== End of Comment ===`,
  ].join("\n");
}
