---
name: jira-fetch
description: "Fetch Jira ticket details from a URL. Use when: user provides a Jira URL or ticket key and wants full ticket information including description, comments, subtasks, and linked issues. Saves results to a markdown file."
argument-hint: "Jira ticket URL (e.g. https://your-org.atlassian.net/browse/PROJ-123)"
uses-skills:
  - caveman
---

# Jira Ticket Fetch

> This skill uses the **caveman** skill for all chat responses. Load and activate it at **full** intensity before proceeding.
> **Caveman applies only to agent commentary** — never shorten, abbreviate, or truncate Jira content (summaries, descriptions, comments, subtask details). All ticket data must be preserved verbatim.

## When to Use

- User provides a Jira ticket URL and wants to see the full details
- User provides a Jira issue key (e.g. `PROJ-123`) and wants to fetch it
- User needs ticket context (description, comments, subtasks) for planning or implementation

## Procedure

### Step 1 — Parse the Issue Key

Extract the issue key from the user input. The input can be:

- **Full URL**: `https://<domain>.atlassian.net/browse/PROJ-123` → extract `PROJ-123`
- **Board URL**: `https://<domain>.atlassian.net/jira/software/projects/PROJ/boards/1?selectedIssue=PROJ-123` → extract `PROJ-123`
- **Bare key**: `PROJ-123` → use as-is

The issue key pattern is: `[A-Z][A-Z0-9]+-\d+`

If the input does not contain a recognizable issue key, ask the user for clarification.

### Step 2 — Load Credentials

Search for `JIRA_DOMAIN`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` by checking the following locations **in order**, stopping at the first file that contains all three variables:

1. `.claude/.env` — skill-specific credentials (preferred)
2. `.github/.env` — shared CI/tooling credentials
3. `.env` — project root (fallback)
4. Environment variables already present in the shell (`$JIRA_DOMAIN`, etc.)

Use this shell snippet to resolve them at runtime:

```bash
_load_jira_env() {
  for f in .claude/.env .github/.env .env; do
    if [[ -f "$f" ]] && grep -q 'JIRA_DOMAIN' "$f" && grep -q 'JIRA_EMAIL' "$f" && grep -q 'JIRA_API_TOKEN' "$f"; then
      set -a; source "$f"; set +a
      return 0
    fi
  done
  # Fall through to environment — check if all vars are already set
  if [[ -n "$JIRA_DOMAIN" && -n "$JIRA_EMAIL" && -n "$JIRA_API_TOKEN" ]]; then
    return 0
  fi
  echo "ERROR: JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN not found." >&2
  echo "Create .claude/.env from .claude/.env.sample and set the values." >&2
  return 1
}
_load_jira_env || exit 1
```

If the function exits with an error, stop and instruct the user to create `.claude/.env` from `.claude/.env.sample`.

### Step 3 — Fetch the Parent Ticket via REST API

Call the Jira REST API directly using `run_in_terminal`:

```bash
curl -s \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "https://$JIRA_DOMAIN/rest/api/3/issue/PROJ-123?fields=summary,description,status,priority,issuetype,project,labels,assignee,reporter,created,updated,comment,subtasks"
```

The response includes: summary, description, status, priority, issue type, project, labels, assignee, reporter, dates, comments array, and subtasks array.

### Step 4 — Fetch Subtasks

From the parent ticket response, extract the `subtasks` array. Each item contains a key (e.g. `PROJ-124`).

For **each subtask key**, call:

```bash
curl -s \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "https://$JIRA_DOMAIN/rest/api/3/issue/PROJ-124?fields=summary,status,assignee,description,comment"
```

Collect all subtask details (summary, status, assignee, description, comments).

### Step 4b — Fetch All Comments (Pagination)

Comments are paginated. Follow this decision tree:

#### Case 1: All comments fit in initial response

- Check the parent ticket response: `fields.comment.total` and `fields.comment.maxResults`
- **If** `total ≤ maxResults`: All comments are already in the response. No additional fetch needed.
- Example: `total=5, maxResults=20` → proceed to Step 5

#### Case 2: Comments exceed initial response

- **If** `total > maxResults`: Fetch remaining comments using the dedicated endpoint.
- Example: `total=150, maxResults=20` → fetch pages 1, 2, 3, ... until all retrieved

**For each ticket (parent and subtasks) that exceeds the page limit:**

1. Start with `startAt=20` (the first page already has 20 comments from the issue response)
2. Fetch the next batch:

```bash
curl -s \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "https://$JIRA_DOMAIN/rest/api/3/issue/PROJ-123/comment?startAt=20&maxResults=100"
```

3. Append the results to the comments already in memory
4. Increment `startAt` by 100: `startAt=120`, then `startAt=220`, etc.
5. Stop when `startAt >= total`

**Example workflow:**

- Initial response: 20 comments, `total=150`
- Fetch page 2: `startAt=20` returns comments 21–120 (100 items)
- Fetch page 3: `startAt=120` returns comments 121–150 (30 items)
- Merge all three batches into the final comment list

### Step 5 — Save to File

Save the full ticket details to a markdown file at:

```
plans/<ISSUE_KEY>/context.md
```

The file must contain the full untruncated content of all fields, all comments, and all subtask details, formatted as markdown:

```markdown
## [PROJ-123] Ticket Summary

**Status**: In Progress | **Priority**: High | **Type**: Story
**Assignee**: Name | **Reporter**: Name
**Project**: Project Name | **Labels**: label1, label2

### Description

(full description text)

### Subtasks (N total)

| Key      | Summary       | Status | Assignee |
| -------- | ------------- | ------ | -------- |
| PROJ-124 | Subtask title | To Do  | Name     |

### Comments (N total)

**Author** — 2025-01-15:

> Comment body text

---

**Author** — 2025-01-14:

> Another comment

### Subtask Comments

#### [PROJ-124] Subtask title

**Author** — 2025-01-15:

> Comment on subtask

---

(Repeat for each subtask that has comments. Omit this section if no subtasks have comments.)
```

Create the `plans/<ISSUE_KEY>/` directory if it does not exist. Do **not** display the ticket content in chat — confirm only with the file path once saved.

## Authentication

Credentials are resolved via Basic Auth (email + API token) using the lookup order below:

| Location          | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `.claude/.env`    | Skill-specific credentials — **preferred** location |
| `.github/.env`    | Shared CI / tooling credentials                     |
| `.env`            | Project root — fallback                             |
| Shell environment | Variables already exported in the current session   |

| Variable         | Purpose                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `JIRA_DOMAIN`    | Atlassian instance (e.g. `your-company.atlassian.net`)                                        |
| `JIRA_EMAIL`     | User email for Basic Auth                                                                     |
| `JIRA_API_TOKEN` | Jira API token ([generate here](https://id.atlassian.com/manage-profile/security/api-tokens)) |

If **none** of the locations contain all three variables, the skill must stop with an explicit error and instruct the user to copy `.claude/.env.sample` to `.claude/.env` and fill in the values.

If the curl call returns `401 Unauthorized`, ask the user to verify `JIRA_EMAIL` and `JIRA_API_TOKEN`.
If it returns `404 Not Found`, verify the issue key and `JIRA_DOMAIN`.

## Constraints

- Only fetch **direct subtasks** (1 level deep), not sub-subtasks.
- Do **not** modify, update, or transition any Jira tickets — this skill is read-only.
- No MCP server is required — all calls are direct HTTP to the Jira REST API.
- Always source credentials via the lookup chain (`.claude/.env` → `.github/.env` → `.env` → shell env), never hard-code them.
