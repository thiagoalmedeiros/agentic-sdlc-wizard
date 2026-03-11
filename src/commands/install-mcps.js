"use strict";

const fs = require("fs");
const path = require("path");
const { getMcpsDir, getMcpConfigPath, readConfig, updateGitignore } = require("../config");

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rmDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function installMcpsCommand(cwd) {
  const { checkbox } = require("@inquirer/prompts");
  cwd = cwd || process.cwd();
  const config = readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const mcpsDir = getMcpsDir();
  const mcpDirs = fs
    .readdirSync(mcpsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (mcpDirs.length === 0) {
    console.log("No MCP server templates available.");
    return;
  }

  const choices = mcpDirs.sort().map((name) => ({ name, value: name }));

  const selected = await checkbox({
    message: "Select MCP servers to install:",
    choices,
  });

  if (selected.length === 0) {
    console.log("No MCP servers selected. Aborting.");
    return;
  }

  installSelectedMcps(cwd, config, selected);
}

function installSelectedMcps(cwd, config, selected) {
  const mcpsDir = getMcpsDir();

  for (const ide of config.ides) {
    const mcpConfigPath = getMcpConfigPath(cwd, ide);
    if (!mcpConfigPath) continue;

    let mcpConfig = { servers: {} };
    if (fs.existsSync(mcpConfigPath)) {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
      if (!mcpConfig.servers) {
        mcpConfig.servers = {};
      }
    }

    for (const mcpName of selected) {
      const mcpSrcDir = path.join(mcpsDir, mcpName);
      const mcpJsonPath = path.join(mcpSrcDir, "mcp.json");

      const mcpMeta = readMcpConfig(mcpJsonPath);
      const envParams = mcpMeta.env || [];

      const envEntries = {};
      for (const param of envParams) {
        if (param.default !== undefined) {
          envEntries[param.name] = param.default;
        } else {
          envEntries[param.name] = "${input:" + param.name + "}";
        }
      }

      const command = mcpMeta.command || "node";

      if (command === "npx") {
        mcpConfig.servers[mcpName] = {
          type: "stdio",
          command: "npx",
          args: mcpMeta.args || [],
          env: envEntries,
        };
      } else {
        const module = mcpMeta.module || "server.js";
        const mcpDestDir = path.join(cwd, ".wizard-mcps", mcpName);
        rmDirSync(mcpDestDir);
        copyDirSync(mcpSrcDir, mcpDestDir);

        mcpConfig.servers[mcpName] = {
          type: "stdio",
          command: "node",
          args: [path.relative(cwd, path.join(mcpDestDir, module))],
          env: envEntries,
        };
      }
    }

    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    const relMcpConfig = path.relative(cwd, mcpConfigPath);
    updateGitignore(cwd, [relMcpConfig, ".wizard-mcps/"]);
    console.log(`MCP configuration written to ${relMcpConfig}`);
  }

  console.log(
    "\nMCP servers installed. Update the environment variables in your MCP config."
  );
}

function readMcpConfig(mcpJsonPath) {
  if (fs.existsSync(mcpJsonPath)) {
    return JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
  }
  return {};
}

module.exports = { installMcpsCommand, installSelectedMcps, readMcpConfig };
