/**
 * Jira handler — Direct REST API v3 integration.
 *
 * Uses the Jira REST API directly.
 * Authenticates via Basic Auth (email + token) for Cloud, or
 * Bearer PAT for Server/DC.
 *
 * Environment variables:
 *   JIRA_BASE_URL   – e.g. https://yourcompany.atlassian.net
 *   JIRA_API_TOKEN  – API token (Cloud) or PAT (Server/DC)
 *   JIRA_USER_EMAIL – Email for Basic auth (Cloud). Omit for Bearer PAT.
 */

import axios, { type AxiosInstance } from "axios";
import {
  FetchTicketArgs,
  NormalizedTicketResult,
  AddCommentArgs,
  CommentResult,
} from "../types.js";

const DEFAULT_FIELDS =
  "summary,status,priority,assignee,reporter,created,updated,description,comment,issuetype,project,labels";

/**
 * Parse the issue key and base URL from a Jira issue URL.
 * Supports formats like:
 *   https://yourcompany.atlassian.net/browse/PROJ-123
 *   https://jira.example.com/browse/PROJ-456
 */
export function parseJiraUrl(ticketUrl: string): { baseUrl: string; issueKey: string } {
  const url = new URL(ticketUrl);
  const match = url.pathname.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/);

  if (!match) {
    throw new Error(
      `Invalid Jira URL: ${ticketUrl}. Expected format: https://{host}/browse/{PROJ-123}`,
    );
  }

  const baseUrl = `${url.protocol}//${url.host}`;
  return { baseUrl, issueKey: match[1] };
}

/**
 * Create an Axios client configured for Jira API auth.
 * Uses JIRA_BASE_URL env var if set, otherwise derives from the ticket URL.
 */
export function createJiraClient(baseUrlFromTicket: string): AxiosInstance {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "") || baseUrlFromTicket;
  const apiToken = process.env.JIRA_API_TOKEN;
  const userEmail = process.env.JIRA_USER_EMAIL;

  if (!apiToken) {
    throw new Error(
      "JIRA_API_TOKEN environment variable is required for Jira operations.",
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // Cloud uses Basic auth (email:token); Server/DC uses Bearer PAT
  if (userEmail) {
    const encoded = Buffer.from(`${userEmail}:${apiToken}`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  } else {
    headers["Authorization"] = `Bearer ${apiToken}`;
  }

  return axios.create({
    baseURL: baseUrl,
    headers,
    timeout: 30000,
  });
}

/**
 * Convert an Atlassian Document Format (ADF) node to plain text.
 * Jira API v3 returns description/comment bodies as ADF JSON.
 */
export function adfToText(node: unknown): string {
  if (node === null || node === undefined) {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (typeof node !== "object") {
    return String(node);
  }

  const obj = node as Record<string, unknown>;
  const parts: string[] = [];

  if (obj.type === "text") {
    parts.push((obj.text as string) ?? "");
  }

  const content = obj.content as unknown[] | undefined;
  if (Array.isArray(content)) {
    for (const child of content) {
      parts.push(adfToText(child));
    }
  }

  return parts.join("");
}

/** Safely drill into nested objects. */
function safe(fields: Record<string, unknown>, ...keys: string[]): unknown {
  let val: unknown = fields;
  for (const k of keys) {
    if (val && typeof val === "object") {
      val = (val as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }
  return val;
}

/**
 * Fetch a Jira issue's details and normalise them.
 */
export async function fetchJiraTicket(
  args: FetchTicketArgs,
): Promise<NormalizedTicketResult> {
  const { baseUrl, issueKey } = parseJiraUrl(args.ticket_url);
  const client = createJiraClient(baseUrl);

  const response = await client.get(`/rest/api/3/issue/${issueKey}`, {
    params: { fields: DEFAULT_FIELDS },
  });

  const issue = response.data as {
    key: string;
    fields: Record<string, unknown>;
  };

  const f = issue.fields;

  const description = adfToText(f.description);

  const commentsRaw = (safe(f, "comment", "comments") as Array<Record<string, unknown>>) || [];
  const comments = commentsRaw.map((c) => ({
    author: (safe(c, "author", "displayName") as string) ?? "Unknown",
    body: adfToText(c.body),
    created: (c.created as string) ?? "",
  }));

  return {
    platform: "jira",
    ticket_id: issue.key,
    title: (f.summary as string) ?? "",
    description,
    status: (safe(f, "status", "name") as string) ?? "Unknown",
    assignee: (safe(f, "assignee", "displayName") as string) ?? null,
    labels: (f.labels as string[]) ?? [],
    priority: (safe(f, "priority", "name") as string) ?? null,
    created: (f.created as string) ?? null,
    updated: (f.updated as string) ?? null,
    comments,
    url: args.ticket_url,
    raw: issue as unknown as Record<string, unknown>,
  };
}

/**
 * Post a comment on a Jira issue.
 * Uses ADF format for the comment body (Jira API v3).
 */
export async function addJiraComment(
  args: AddCommentArgs,
): Promise<CommentResult> {
  const { baseUrl, issueKey } = parseJiraUrl(args.ticket_url);
  const client = createJiraClient(baseUrl);

  const response = await client.post(
    `/rest/api/3/issue/${issueKey}/comment`,
    {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: args.comment }],
          },
        ],
      },
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = response.data as {
    id: string;
    self: string;
  };

  return {
    platform: "jira",
    ticket_id: issueKey,
    comment_id: data.id,
    url: data.self,
  };
}
