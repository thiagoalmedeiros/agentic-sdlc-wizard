"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  IDE_VSCODE,
  writeConfig,
  getMcpsDir,
} = require("../src/config");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("SourceTicketMcp", () => {
  test("template files exist", () => {
    const mcpsDir = getMcpsDir();
    const ticketDir = path.join(mcpsDir, "source-ticket-mcp");

    expect(fs.existsSync(path.join(ticketDir, "mcp.json"))).toBe(true);
    expect(fs.existsSync(path.join(ticketDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(ticketDir, "tsconfig.json"))).toBe(true);
    expect(fs.existsSync(path.join(ticketDir, "src", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(ticketDir, "src", "types.ts"))).toBe(true);
    expect(fs.existsSync(path.join(ticketDir, "src", "router.ts"))).toBe(true);
    expect(
      fs.existsSync(path.join(ticketDir, "src", "handlers", "trello.ts"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(ticketDir, "src", "handlers", "jira.ts"))
    ).toBe(true);
  });

  test("mcp.json has correct config", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(
      getMcpsDir(),
      "source-ticket-mcp",
      "mcp.json"
    );
    const config = readMcpConfig(mcpJsonPath);

    expect(config.name).toBe("source-ticket-mcp");
    expect(config.command).toBe("node");
    expect(config.module).toBe("dist/index.js");
    expect(config.env.length).toBe(5);

    const envNames = config.env.map((e) => e.name);
    expect(envNames).toContain("TRELLO_API_KEY");
    expect(envNames).toContain("TRELLO_TOKEN");
    expect(envNames).toContain("JIRA_BASE_URL");
    expect(envNames).toContain("JIRA_API_TOKEN");
    expect(envNames).toContain("JIRA_USER_EMAIL");
  });

  test("package.json has MCP SDK dependency", () => {
    const mcpsDir = getMcpsDir();
    const pkgPath = path.join(mcpsDir, "source-ticket-mcp", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    expect(pkg.name).toBe("source-ticket-mcp");
    expect(pkg.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
    expect(pkg.dependencies["axios"]).toBeDefined();
    expect(pkg.devDependencies["typescript"]).toBeDefined();
    expect(pkg.scripts.build).toBe("tsc");
  });

  test("install source-ticket-mcp copies files and creates config", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const { installSelectedMcps } = require("../src/commands/install-mcps");
    installSelectedMcps(testDir, { ides: [IDE_VSCODE] }, ["source-ticket-mcp"]);

    // Verify files were copied (custom node MCP)
    const mcpDestDir = path.join(testDir, ".wizard-mcps", "source-ticket-mcp");
    expect(fs.existsSync(mcpDestDir)).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "mcp.json"))).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "package.json"))).toBe(true);
    expect(
      fs.existsSync(path.join(mcpDestDir, "src", "index.ts"))
    ).toBe(true);

    // Verify mcp.json config was written
    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    expect(fs.existsSync(mcpConfigPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));

    expect(written.servers["source-ticket-mcp"]).toBeDefined();
    expect(written.servers["source-ticket-mcp"].type).toBe("stdio");
    expect(written.servers["source-ticket-mcp"].command).toBe("node");

    // Verify relative path is used for args
    const args = written.servers["source-ticket-mcp"].args;
    expect(args.length).toBe(1);
    expect(path.isAbsolute(args[0])).toBe(false);
    expect(args[0]).toBe(
      path.join(".wizard-mcps", "source-ticket-mcp", "dist", "index.js")
    );

    // Verify env variables are set as input prompts (all have no defaults)
    const env = written.servers["source-ticket-mcp"].env;
    expect(env.TRELLO_API_KEY).toBe("${input:TRELLO_API_KEY}");
    expect(env.TRELLO_TOKEN).toBe("${input:TRELLO_TOKEN}");
    expect(env.JIRA_BASE_URL).toBe("${input:JIRA_BASE_URL}");
    expect(env.JIRA_API_TOKEN).toBe("${input:JIRA_API_TOKEN}");
    expect(env.JIRA_USER_EMAIL).toBe("${input:JIRA_USER_EMAIL}");
  });

  test("source code contains fetch_ticket tool definition", () => {
    const mcpsDir = getMcpsDir();
    const indexTs = fs.readFileSync(
      path.join(mcpsDir, "source-ticket-mcp", "src", "index.ts"),
      "utf-8"
    );

    expect(indexTs).toContain("fetch_ticket");
    expect(indexTs).toContain("ticket_url");
    expect(indexTs).toContain("StdioServerTransport");
    expect(indexTs).toContain("routeFetchTicket");
    expect(indexTs).toContain("formatTicketResult");
  });

  test("source code contains add_comment tool definition", () => {
    const mcpsDir = getMcpsDir();
    const indexTs = fs.readFileSync(
      path.join(mcpsDir, "source-ticket-mcp", "src", "index.ts"),
      "utf-8"
    );

    expect(indexTs).toContain("add_comment");
    expect(indexTs).toContain("comment");
    expect(indexTs).toContain("routeAddComment");
    expect(indexTs).toContain("formatCommentResult");
  });

  test("router detects trello and jira platforms from URLs", () => {
    const routerTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-ticket-mcp", "src", "router.ts"),
      "utf-8"
    );

    expect(routerTs).toContain("trello.com");
    expect(routerTs).toContain("atlassian.net");
    expect(routerTs).toContain("detectPlatform");
    expect(routerTs).toContain("Unsupported platform");
    expect(routerTs).toContain("/browse/");
  });

  test("router includes comment routing", () => {
    const routerTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-ticket-mcp", "src", "router.ts"),
      "utf-8"
    );

    expect(routerTs).toContain("routeAddComment");
    expect(routerTs).toContain("addTrelloComment");
    expect(routerTs).toContain("addJiraComment");
  });

  test("trello handler uses direct REST API", () => {
    const trelloTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-ticket-mcp",
        "src",
        "handlers",
        "trello.ts"
      ),
      "utf-8"
    );

    expect(trelloTs).toContain("api.trello.com/1");
    expect(trelloTs).toContain("TRELLO_API_KEY");
    expect(trelloTs).toContain("TRELLO_TOKEN");
    expect(trelloTs).toContain("axios");
    expect(trelloTs).toContain("fetchTrelloTicket");
    expect(trelloTs).toContain("addTrelloComment");
    // Should NOT use an MCP Client
    expect(trelloTs).not.toContain("StdioClientTransport");
  });

  test("jira handler uses direct REST API v3", () => {
    const jiraTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-ticket-mcp",
        "src",
        "handlers",
        "jira.ts"
      ),
      "utf-8"
    );

    expect(jiraTs).toContain("rest/api/3/issue");
    expect(jiraTs).toContain("JIRA_API_TOKEN");
    expect(jiraTs).toContain("JIRA_USER_EMAIL");
    expect(jiraTs).toContain("axios");
    expect(jiraTs).toContain("fetchJiraTicket");
    expect(jiraTs).toContain("addJiraComment");
    expect(jiraTs).toContain("adfToText");
    // Should NOT use an MCP Client
    expect(jiraTs).not.toContain("StdioClientTransport");
  });

  test("jira handler supports ADF to text conversion", () => {
    const jiraTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-ticket-mcp",
        "src",
        "handlers",
        "jira.ts"
      ),
      "utf-8"
    );

    expect(jiraTs).toContain("adfToText");
    expect(jiraTs).toContain("type");
    expect(jiraTs).toContain("content");
    expect(jiraTs).toContain("text");
  });

  test("jira handler posts comments in ADF format", () => {
    const jiraTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-ticket-mcp",
        "src",
        "handlers",
        "jira.ts"
      ),
      "utf-8"
    );

    expect(jiraTs).toContain("/comment");
    expect(jiraTs).toContain("paragraph");
    expect(jiraTs).toContain("CommentResult");
  });

  test("types include ticket normalization format", () => {
    const typesTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-ticket-mcp", "src", "types.ts"),
      "utf-8"
    );

    expect(typesTs).toContain("NormalizedTicketResult");
    expect(typesTs).toContain("formatTicketResult");
    expect(typesTs).toContain("platform");
    expect(typesTs).toContain("ticket_id");
    expect(typesTs).toContain("title");
    expect(typesTs).toContain("description");
    expect(typesTs).toContain("status");
  });

  test("types include comment result format", () => {
    const typesTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-ticket-mcp", "src", "types.ts"),
      "utf-8"
    );

    expect(typesTs).toContain("AddCommentArgs");
    expect(typesTs).toContain("CommentResult");
    expect(typesTs).toContain("formatCommentResult");
    expect(typesTs).toContain("comment_id");
  });
});
