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

describe("SourceRepoMcp", () => {
  test("template files exist", () => {
    const mcpsDir = getMcpsDir();
    const proxyDir = path.join(mcpsDir, "source-repo-mcp");

    expect(fs.existsSync(path.join(proxyDir, "mcp.json"))).toBe(true);
    expect(fs.existsSync(path.join(proxyDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(proxyDir, "tsconfig.json"))).toBe(true);
    expect(fs.existsSync(path.join(proxyDir, "src", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(proxyDir, "src", "types.ts"))).toBe(true);
    expect(fs.existsSync(path.join(proxyDir, "src", "router.ts"))).toBe(true);
    expect(
      fs.existsSync(path.join(proxyDir, "src", "handlers", "github.ts"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(proxyDir, "src", "handlers", "bitbucket.ts"))
    ).toBe(true);
  });

  test("mcp.json has correct config", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(
      getMcpsDir(),
      "source-repo-mcp",
      "mcp.json"
    );
    const config = readMcpConfig(mcpJsonPath);

    expect(config.name).toBe("source-repo-mcp");
    expect(config.command).toBe("node");
    expect(config.module).toBe("dist/index.js");
    expect(config.env.length).toBe(3);

    const envNames = config.env.map((e) => e.name);
    expect(envNames).toContain("GITHUB_TOKEN");
    expect(envNames).toContain("BITBUCKET_EMAIL");
    expect(envNames).toContain("BITBUCKET_TOKEN");
  });

  test("package.json has MCP SDK dependency", () => {
    const mcpsDir = getMcpsDir();
    const pkgPath = path.join(mcpsDir, "source-repo-mcp", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

    expect(pkg.name).toBe("source-repo-mcp");
    expect(pkg.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
    expect(pkg.devDependencies["typescript"]).toBeDefined();
    expect(pkg.scripts.build).toBe("tsc");
  });

  test("install source-repo-mcp copies files and creates config", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const { installSelectedMcps } = require("../src/commands/install-mcps");
    installSelectedMcps(testDir, { ides: [IDE_VSCODE] }, ["source-repo-mcp"]);

    // Verify files were copied (custom node MCP)
    const mcpDestDir = path.join(testDir, ".wizard-mcps", "source-repo-mcp");
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

    expect(written.servers["source-repo-mcp"]).toBeDefined();
    expect(written.servers["source-repo-mcp"].type).toBe("stdio");
    expect(written.servers["source-repo-mcp"].command).toBe("node");

    // Verify relative path is used for args
    const args = written.servers["source-repo-mcp"].args;
    expect(args.length).toBe(1);
    expect(path.isAbsolute(args[0])).toBe(false);
    expect(args[0]).toBe(
      path.join(".wizard-mcps", "source-repo-mcp", "dist", "index.js")
    );

    // Verify env variables are set as input prompts (no defaults)
    const env = written.servers["source-repo-mcp"].env;
    expect(env.GITHUB_TOKEN).toBe("${input:GITHUB_TOKEN}");
    expect(env.BITBUCKET_EMAIL).toBe("${input:BITBUCKET_EMAIL}");
    expect(env.BITBUCKET_TOKEN).toBe("${input:BITBUCKET_TOKEN}");
  });

  test("source code contains get_pr_diff tool definition", () => {
    const mcpsDir = getMcpsDir();
    const indexTs = fs.readFileSync(
      path.join(mcpsDir, "source-repo-mcp", "src", "index.ts"),
      "utf-8"
    );

    expect(indexTs).toContain("get_pr_diff");
    expect(indexTs).toContain("repo_url");
    expect(indexTs).toContain("pr_identifier");
    expect(indexTs).toContain("StdioServerTransport");
  });

  test("router detects github platform from URL", () => {
    const routerTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-repo-mcp", "src", "router.ts"),
      "utf-8"
    );

    expect(routerTs).toContain("github.com");
    expect(routerTs).toContain("bitbucket.org");
    expect(routerTs).toContain("detectPlatform");
    expect(routerTs).toContain("Unsupported platform");
  });

  test("github handler uses direct REST API", () => {
    const githubTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-repo-mcp",
        "src",
        "handlers",
        "github.ts"
      ),
      "utf-8"
    );

    expect(githubTs).toContain("api.github.com");
    expect(githubTs).toContain("GITHUB_TOKEN");
    expect(githubTs).toContain("application/vnd.github.diff");
    // Should NOT use the GitHub MCP server as a proxy
    expect(githubTs).not.toContain("StdioClientTransport");
    expect(githubTs).not.toContain("@modelcontextprotocol/server-github");
  });

  test("bitbucket handler uses direct REST API", () => {
    const bitbucketTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-repo-mcp",
        "src",
        "handlers",
        "bitbucket.ts"
      ),
      "utf-8"
    );

    expect(bitbucketTs).toContain("api.bitbucket.org/2.0");
    expect(bitbucketTs).toContain("BITBUCKET_EMAIL");
    expect(bitbucketTs).toContain("BITBUCKET_TOKEN");
    expect(bitbucketTs).toContain("axios");
    // Should NOT use an MCP Client
    expect(bitbucketTs).not.toContain("StdioClientTransport");
  });

  test("types include normalization format", () => {
    const typesTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-repo-mcp", "src", "types.ts"),
      "utf-8"
    );

    expect(typesTs).toContain("NormalizedDiffResult");
    expect(typesTs).toContain("formatDiffResult");
    expect(typesTs).toContain("platform");
    expect(typesTs).toContain("diff_content");
  });

  test("source code contains comment_on_pr tool definition", () => {
    const mcpsDir = getMcpsDir();
    const indexTs = fs.readFileSync(
      path.join(mcpsDir, "source-repo-mcp", "src", "index.ts"),
      "utf-8"
    );

    expect(indexTs).toContain("comment_on_pr");
    expect(indexTs).toContain("comment");
    expect(indexTs).toContain("routeCommentRequest");
    expect(indexTs).toContain("formatCommentResult");
  });

  test("github handler contains comment endpoint", () => {
    const githubTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-repo-mcp",
        "src",
        "handlers",
        "github.ts"
      ),
      "utf-8"
    );

    expect(githubTs).toContain("commentOnGitHubPr");
    expect(githubTs).toContain("/issues/");
    expect(githubTs).toContain("/comments");
    expect(githubTs).toContain("CommentResult");
  });

  test("bitbucket handler contains comment endpoint", () => {
    const bitbucketTs = fs.readFileSync(
      path.join(
        getMcpsDir(),
        "source-repo-mcp",
        "src",
        "handlers",
        "bitbucket.ts"
      ),
      "utf-8"
    );

    expect(bitbucketTs).toContain("commentOnBitbucketPr");
    expect(bitbucketTs).toContain("/comments");
    expect(bitbucketTs).toContain("CommentResult");
    expect(bitbucketTs).toContain("content");
  });

  test("types include comment result format", () => {
    const typesTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-repo-mcp", "src", "types.ts"),
      "utf-8"
    );

    expect(typesTs).toContain("CommentOnPrArgs");
    expect(typesTs).toContain("CommentResult");
    expect(typesTs).toContain("formatCommentResult");
    expect(typesTs).toContain("comment_id");
    expect(typesTs).toContain("comment_url");
  });

  test("router includes comment routing", () => {
    const routerTs = fs.readFileSync(
      path.join(getMcpsDir(), "source-repo-mcp", "src", "router.ts"),
      "utf-8"
    );

    expect(routerTs).toContain("routeCommentRequest");
    expect(routerTs).toContain("commentOnGitHubPr");
    expect(routerTs).toContain("commentOnBitbucketPr");
  });
});
