"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  IDE_VSCODE,
  IDE_ANTIGRAVITY,
  writeConfig,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
} = require("../src/config");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("InstallAgents", () => {
  test("copy agents to vscode", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const agentsDir = getAgentsDir();
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));

    const targetDir = path.join(testDir, ".vscode", "agents");
    fs.mkdirSync(targetDir, { recursive: true });
    for (const f of files) {
      fs.copyFileSync(path.join(agentsDir, f), path.join(targetDir, f));
    }

    const installed = fs.readdirSync(targetDir);
    expect(installed.length).toBe(files.length);
    for (const f of files) {
      expect(installed).toContain(f);
      const content = fs.readFileSync(path.join(targetDir, f), "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  test("copy agents to antigravity", () => {
    writeConfig(testDir, { ides: [IDE_ANTIGRAVITY] });
    const agentsDir = getAgentsDir();
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));

    const targetDir = path.join(testDir, ".gemini", "agents");
    fs.mkdirSync(targetDir, { recursive: true });
    for (const f of files) {
      fs.copyFileSync(path.join(agentsDir, f), path.join(targetDir, f));
    }

    const installed = fs.readdirSync(targetDir);
    expect(installed.length).toBe(files.length);
  });
});

describe("InstallPrompts", () => {
  test("copy prompts to vscode", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const promptsDir = getPromptsDir();
    const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));

    const targetDir = path.join(testDir, ".vscode", "prompts");
    fs.mkdirSync(targetDir, { recursive: true });
    for (const f of files) {
      fs.copyFileSync(path.join(promptsDir, f), path.join(targetDir, f));
    }

    const installed = fs.readdirSync(targetDir);
    expect(installed.length).toBe(files.length);
    for (const f of files) {
      expect(installed).toContain(f);
    }
  });
});

describe("InstallMcps", () => {
  test("copy mcp and create config for vscode", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const mcpsDir = getMcpsDir();
    const mcpName = "bitbucket-mcp";
    const mcpSrcDir = path.join(mcpsDir, mcpName);

    // Copy files
    const mcpDestDir = path.join(testDir, ".wizard-mcps", mcpName);
    fs.mkdirSync(mcpDestDir, { recursive: true });
    for (const f of fs.readdirSync(mcpSrcDir)) {
      fs.copyFileSync(path.join(mcpSrcDir, f), path.join(mcpDestDir, f));
    }

    // Verify files were copied
    expect(fs.existsSync(path.join(mcpDestDir, "mcp.json"))).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "server.js"))).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "package.json"))).toBe(true);

    // Read MCP config
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpMeta = readMcpConfig(path.join(mcpDestDir, "mcp.json"));

    expect(mcpMeta.command).toBe("node");
    expect(mcpMeta.module).toBe("server.js");

    const envEntries = {};
    for (const param of mcpMeta.env) {
      if (param.default !== undefined) {
        envEntries[param.name] = param.default;
      } else {
        envEntries[param.name] = "${input:" + param.name + "}";
      }
    }

    const mcpConfig = {
      servers: {
        [mcpName]: {
          type: "stdio",
          command: "node",
          args: [path.relative(testDir, path.join(mcpDestDir, "server.js"))],
          env: envEntries,
        },
      },
    };

    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

    // Verify mcp.json
    expect(fs.existsSync(mcpConfigPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    expect(written.servers[mcpName]).toBeDefined();
    expect(written.servers[mcpName].type).toBe("stdio");
    expect(written.servers[mcpName].command).toBe("node");
    expect(written.servers[mcpName].env.BITBUCKET_URL).toBe(
      "https://api.bitbucket.org/2.0"
    );
    expect(written.servers[mcpName].env.BITBUCKET_TOKEN).toBeDefined();
    expect(path.isAbsolute(written.servers[mcpName].args[0])).toBe(false);
  });

  test("merge with existing mcp config", () => {
    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(
      mcpConfigPath,
      JSON.stringify({
        servers: {
          "existing-mcp": {
            type: "stdio",
            command: "node",
            args: ["existing.js"],
          },
        },
      })
    );

    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    mcpConfig.servers["bitbucket-mcp"] = {
      type: "stdio",
      command: "node",
      args: ["server.js"],
    };
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

    const result = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    expect(result.servers["existing-mcp"]).toBeDefined();
    expect(result.servers["bitbucket-mcp"]).toBeDefined();
  });

  test("copy trello mcp and create config for vscode", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const mcpsDir = getMcpsDir();
    const mcpName = "trello-mcp";
    const mcpSrcDir = path.join(mcpsDir, mcpName);

    // Copy files
    const mcpDestDir = path.join(testDir, ".wizard-mcps", mcpName);
    fs.mkdirSync(mcpDestDir, { recursive: true });
    for (const f of fs.readdirSync(mcpSrcDir)) {
      fs.copyFileSync(path.join(mcpSrcDir, f), path.join(mcpDestDir, f));
    }

    // Verify files were copied
    expect(fs.existsSync(path.join(mcpDestDir, "mcp.json"))).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "server.js"))).toBe(true);
    expect(fs.existsSync(path.join(mcpDestDir, "package.json"))).toBe(true);

    // Read MCP config
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpMeta = readMcpConfig(path.join(mcpDestDir, "mcp.json"));

    expect(mcpMeta.command).toBe("node");
    expect(mcpMeta.module).toBe("server.js");

    const envEntries = {};
    for (const param of mcpMeta.env) {
      if (param.default !== undefined) {
        envEntries[param.name] = param.default;
      } else {
        envEntries[param.name] = "${input:" + param.name + "}";
      }
    }

    const mcpConfig = {
      servers: {
        [mcpName]: {
          type: "stdio",
          command: "node",
          args: [path.relative(testDir, path.join(mcpDestDir, "server.js"))],
          env: envEntries,
        },
      },
    };

    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

    // Verify mcp.json
    expect(fs.existsSync(mcpConfigPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
    expect(written.servers[mcpName]).toBeDefined();
    expect(written.servers[mcpName].type).toBe("stdio");
    expect(written.servers[mcpName].command).toBe("node");
    expect(written.servers[mcpName].env.TRELLO_BASE_URL).toBe(
      "https://api.trello.com/1"
    );
    expect(written.servers[mcpName].env.TRELLO_API_KEY).toBe(
      "${input:TRELLO_API_KEY}"
    );
    expect(written.servers[mcpName].env.TRELLO_TOKEN).toBe(
      "${input:TRELLO_TOKEN}"
    );
    expect(path.isAbsolute(written.servers[mcpName].args[0])).toBe(false);
  });
});

describe("ReadMcpConfig", () => {
  test("read env params from bitbucket mcp.json", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(getMcpsDir(), "bitbucket-mcp", "mcp.json");
    const config = readMcpConfig(mcpJsonPath);

    expect(config.env.length).toBe(3);
    expect(config.env[0].name).toBe("BITBUCKET_URL");
    expect(config.env[0].required).toBe(false);
    expect(config.env[0].default).toBe("https://api.bitbucket.org/2.0");
    expect(config.env[1].name).toBe("BITBUCKET_TOKEN");
    expect(config.env[1].required).toBe(true);
    expect(config.env[2].name).toBe("BITBUCKET_EMAIL");
    expect(config.env[2].required).toBe(false);
  });

  test("read env params from brave search mcp.json", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(
      getMcpsDir(),
      "brave-search-mcp",
      "mcp.json"
    );
    const config = readMcpConfig(mcpJsonPath);

    expect(config.env.length).toBe(1);
    expect(config.env[0].name).toBe("BRAVE_API_KEY");
    expect(config.env[0].required).toBe(true);
  });

  test("read npx mcp config", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(
      getMcpsDir(),
      "brave-search-mcp",
      "mcp.json"
    );
    const config = readMcpConfig(mcpJsonPath);

    expect(config.command).toBe("npx");
    expect(config.args).toEqual([
      "-y",
      "@modelcontextprotocol/server-brave-search",
    ]);
  });

  test("read node mcp config", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(getMcpsDir(), "bitbucket-mcp", "mcp.json");
    const config = readMcpConfig(mcpJsonPath);

    expect(config.command).toBe("node");
    expect(config.module).toBe("server.js");
  });

  test("read env params from trello mcp.json", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(getMcpsDir(), "trello-mcp", "mcp.json");
    const config = readMcpConfig(mcpJsonPath);

    expect(config.env.length).toBe(3);
    expect(config.env[0].name).toBe("TRELLO_API_KEY");
    expect(config.env[0].required).toBe(true);
    expect(config.env[1].name).toBe("TRELLO_TOKEN");
    expect(config.env[1].required).toBe(true);
    expect(config.env[2].name).toBe("TRELLO_BASE_URL");
    expect(config.env[2].required).toBe(false);
    expect(config.env[2].default).toBe("https://api.trello.com/1");
  });

  test("read trello node mcp config", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(getMcpsDir(), "trello-mcp", "mcp.json");
    const config = readMcpConfig(mcpJsonPath);

    expect(config.command).toBe("node");
    expect(config.module).toBe("server.js");
    expect(config.enabled).toBeUndefined();
  });
});

describe("DisabledMcps", () => {
  test("disabled MCPs are excluded from install all", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });

    const { installAllCommand } = require("../src/commands/install-all");
    installAllCommand(testDir);

    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));

    // Disabled MCPs should not be installed
    expect(mcpConfig.servers["brave-search-mcp"]).toBeUndefined();
    expect(mcpConfig.servers["bitbucket-mcp"]).toBeUndefined();

    // Enabled MCPs should be installed
    expect(mcpConfig.servers["source-repo-mcp"]).toBeDefined();
    expect(mcpConfig.servers["trello-mcp"]).toBeDefined();
  });

  test("brave-search-mcp has enabled false", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(
      getMcpsDir(),
      "brave-search-mcp",
      "mcp.json"
    );
    const config = readMcpConfig(mcpJsonPath);
    expect(config.enabled).toBe(false);
  });

  test("bitbucket-mcp has enabled false", () => {
    const { readMcpConfig } = require("../src/commands/install-mcps");
    const mcpJsonPath = path.join(getMcpsDir(), "bitbucket-mcp", "mcp.json");
    const config = readMcpConfig(mcpJsonPath);
    expect(config.enabled).toBe(false);
  });
});

describe("InstallAll", () => {
  test("install all for vscode", async () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });

    const { installAllCommand } = require("../src/commands/install-all");
    await installAllCommand(testDir);

    // Verify agents were installed
    const agentsDir = getAgentsDir();
    const agentFiles = fs
      .readdirSync(agentsDir)
      .filter((f) => f.endsWith(".md"));
    const vscodeAgentsDir = path.join(testDir, ".vscode", "agents");
    expect(fs.existsSync(vscodeAgentsDir)).toBe(true);
    const installedAgents = fs.readdirSync(vscodeAgentsDir);
    expect(installedAgents.length).toBe(agentFiles.length);

    // Verify prompts were installed
    const promptsDir = getPromptsDir();
    const promptFiles = fs
      .readdirSync(promptsDir)
      .filter((f) => f.endsWith(".md"));
    const vscodePromptsDir = path.join(testDir, ".vscode", "prompts");
    expect(fs.existsSync(vscodePromptsDir)).toBe(true);
    const installedPrompts = fs.readdirSync(vscodePromptsDir);
    expect(installedPrompts.length).toBe(promptFiles.length);

    // Verify mcp.json was created with correct config
    const mcpConfigPath = path.join(testDir, ".vscode", "mcp.json");
    expect(fs.existsSync(mcpConfigPath)).toBe(true);
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));

    // Enabled MCPs should be installed (brave-search and bitbucket are disabled)
    expect(mcpConfig.servers["source-repo-mcp"]).toBeDefined();
    expect(mcpConfig.servers["source-repo-mcp"].command).toBe("node");
    expect(mcpConfig.servers["trello-mcp"]).toBeDefined();
    expect(mcpConfig.servers["trello-mcp"].command).toBe("node");
    expect(
      fs.existsSync(
        path.join(testDir, ".wizard-mcps", "source-repo-mcp", "src", "index.ts")
      )
    ).toBe(true);

    // Verify relative path is used for source-repo MCP args
    const sourceRepoArgs = mcpConfig.servers["source-repo-mcp"].args;
    expect(sourceRepoArgs.length).toBe(1);
    expect(path.isAbsolute(sourceRepoArgs[0])).toBe(false);
    expect(sourceRepoArgs[0]).toBe(
      path.join(".wizard-mcps", "source-repo-mcp", "dist", "index.js")
    );

    // Disabled MCPs should not be present
    expect(mcpConfig.servers["bitbucket-mcp"]).toBeUndefined();
    expect(mcpConfig.servers["brave-search-mcp"]).toBeUndefined();

    // Verify .gitignore was updated with installed paths
    const gitignore = fs.readFileSync(
      path.join(testDir, ".gitignore"),
      "utf-8"
    );
    expect(gitignore).toContain(".vscode/agents/");
    expect(gitignore).toContain(".vscode/prompts/");
    expect(gitignore).toContain(".vscode/mcp.json");
    expect(gitignore).toContain(".wizard-mcps/");
  });

  test("install all with no config shows message", () => {
    const { installAllCommand } = require("../src/commands/install-all");

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    installAllCommand(testDir);

    console.log = origLog;
    expect(logs.some((l) => l.includes("No wizard configuration found"))).toBe(
      true
    );
  });
});

describe("Gitignore", () => {
  test("install MCPs updates .gitignore with mcp config and wizard-mcps", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const { installSelectedMcps } = require("../src/commands/install-mcps");
    installSelectedMcps(testDir, { ides: [IDE_VSCODE] }, ["source-repo-mcp"]);

    const gitignore = fs.readFileSync(
      path.join(testDir, ".gitignore"),
      "utf-8"
    );
    expect(gitignore).toContain(".vscode/mcp.json");
    expect(gitignore).toContain(".wizard-mcps/");
  });

  test("install MCPs does not duplicate .gitignore entries on re-run", () => {
    writeConfig(testDir, { ides: [IDE_VSCODE] });
    const { installSelectedMcps } = require("../src/commands/install-mcps");
    installSelectedMcps(testDir, { ides: [IDE_VSCODE] }, ["source-repo-mcp"]);
    installSelectedMcps(testDir, { ides: [IDE_VSCODE] }, ["source-repo-mcp"]);

    const gitignore = fs.readFileSync(
      path.join(testDir, ".gitignore"),
      "utf-8"
    );
    const lines = gitignore.split("\n").filter((l) => l.trim() !== "");
    const mcpJsonEntries = lines.filter((l) => l === ".vscode/mcp.json");
    expect(mcpJsonEntries.length).toBe(1);
  });

  test("install MCPs for antigravity updates .gitignore with gemini paths", () => {
    writeConfig(testDir, { ides: [IDE_ANTIGRAVITY] });
    const { installSelectedMcps } = require("../src/commands/install-mcps");
    installSelectedMcps(
      testDir,
      { ides: [IDE_ANTIGRAVITY] },
      ["source-repo-mcp"]
    );

    const gitignore = fs.readFileSync(
      path.join(testDir, ".gitignore"),
      "utf-8"
    );
    expect(gitignore).toContain(".gemini/mcp.json");
    expect(gitignore).toContain(".wizard-mcps/");
  });
});
