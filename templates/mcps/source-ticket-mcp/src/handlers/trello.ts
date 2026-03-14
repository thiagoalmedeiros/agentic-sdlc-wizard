/**
 * Trello handler — Direct REST API integration.
 *
 * Uses the Trello REST API directly.
 * Authenticates via query parameters using TRELLO_API_KEY and TRELLO_TOKEN
 * environment variables.
 */

import axios from "axios";
import {
  FetchTicketArgs,
  NormalizedTicketResult,
  AddCommentArgs,
  CommentResult,
} from "../types.js";

const TRELLO_API = "https://api.trello.com/1";

/**
 * Parse the card short ID from a Trello card URL.
 * Supports formats like:
 *   https://trello.com/c/abc123/42-card-title
 *   https://trello.com/c/abc123
 */
export function parseTrelloUrl(ticketUrl: string): string {
  const url = new URL(ticketUrl);
  const segments = url.pathname.split("/").filter(Boolean);

  // Expected: ["c", "{shortId}", ...optional slug]
  if (segments.length < 2 || segments[0] !== "c") {
    throw new Error(
      `Invalid Trello card URL: ${ticketUrl}. Expected format: https://trello.com/c/{cardId}`,
    );
  }

  return segments[1];
}

/** Build auth query params for the Trello API. */
function getAuthParams(): { key: string; token: string } {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;

  if (!key || !token) {
    throw new Error(
      "TRELLO_API_KEY and TRELLO_TOKEN environment variables are required for Trello operations.",
    );
  }

  return { key, token };
}

/**
 * Fetch a Trello card's details and normalise them.
 */
export async function fetchTrelloTicket(
  args: FetchTicketArgs,
): Promise<NormalizedTicketResult> {
  const cardId = parseTrelloUrl(args.ticket_url);
  const auth = getAuthParams();

  // Fetch card with members and comment actions
  const cardResponse = await axios.get(`${TRELLO_API}/cards/${cardId}`, {
    params: {
      ...auth,
      fields: "name,desc,idList,labels,due,dateLastActivity,shortUrl,idMembers",
      members: "true",
      member_fields: "fullName",
      actions_type: "commentCard",
      actions_limit: "50",
    },
  });

  const card = cardResponse.data as {
    id: string;
    name: string;
    desc: string;
    idList: string;
    labels: Array<{ name: string; color: string }>;
    due: string | null;
    dateLastActivity: string;
    shortUrl: string;
    members: Array<{ fullName: string }>;
    actions: Array<{
      id: string;
      type: string;
      date: string;
      memberCreator: { fullName: string };
      data: { text: string };
    }>;
  };

  // Fetch the list name to determine the card's status
  const listResponse = await axios.get(
    `${TRELLO_API}/lists/${card.idList}`,
    { params: { ...auth, fields: "name" } },
  );
  const listName = (listResponse.data as { name: string }).name;

  const comments = (card.actions || [])
    .filter((a) => a.type === "commentCard")
    .map((a) => ({
      author: a.memberCreator?.fullName ?? "Unknown",
      body: a.data?.text ?? "",
      created: a.date,
    }));

  return {
    platform: "trello",
    ticket_id: card.id,
    title: card.name,
    description: card.desc,
    status: listName,
    assignee: card.members?.[0]?.fullName ?? null,
    labels: (card.labels || []).map((l) => l.name).filter(Boolean),
    priority: null, // Trello has no built-in priority field
    created: null, // Trello cards don't expose creation date directly
    updated: card.dateLastActivity,
    comments,
    url: card.shortUrl,
    raw: card as unknown as Record<string, unknown>,
  };
}

/**
 * Post a comment on a Trello card.
 */
export async function addTrelloComment(
  args: AddCommentArgs,
): Promise<CommentResult> {
  const cardId = parseTrelloUrl(args.ticket_url);
  const auth = getAuthParams();

  const response = await axios.post(
    `${TRELLO_API}/cards/${cardId}/actions/comments`,
    null,
    {
      params: {
        ...auth,
        text: args.comment,
      },
    },
  );

  const data = response.data as { id: string };

  return {
    platform: "trello",
    ticket_id: cardId,
    comment_id: data.id,
    url: `https://trello.com/c/${cardId}`,
  };
}
