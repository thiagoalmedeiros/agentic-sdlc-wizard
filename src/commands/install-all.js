"use strict";

const fs = require("fs");
const path = require("path");
const {
  getAgentsDir,
  getIdeAgentsTarget,
  getIdePromptsTarget,
  getMcpsDir,
  getPromptsDir,
  readConfig,
} = require("../config");
const { installSelectedMcps } = require("./install-mcps");

async function installAllCommand(cwd) {
  cwd = cwd || process.cwd();
  const config = readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  installAllAgents(cwd, config);
  installAllPrompts(cwd, config);
  installAllMcps(cwd, config);

  console.log("\nAll components installed successfully.");
}

function installAllAgents(cwd, config) {
  const agentsDir = getAgentsDir();
  const agentFiles = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"));

  if (agentFiles.length === 0) {
    console.log("No agent templates available.");
    return;
  }

  const targets = getIdeAgentsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const agent of agentFiles) {
      const src = path.join(agentsDir, agent);
      const dest = path.join(targetDir, agent);
      fs.copyFileSync(src, dest);
    }
    console.log(`Agents installed to ${path.relative(cwd, targetDir)}/`);
  }
}

function installAllPrompts(cwd, config) {
  const promptsDir = getPromptsDir();
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((f) => f.endsWith(".md"));

  if (promptFiles.length === 0) {
    console.log("No prompt templates available.");
    return;
  }

  const targets = getIdePromptsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const prompt of promptFiles) {
      const src = path.join(promptsDir, prompt);
      const dest = path.join(targetDir, prompt);
      fs.copyFileSync(src, dest);
    }
    console.log(`Prompts installed to ${path.relative(cwd, targetDir)}/`);
  }
}

function installAllMcps(cwd, config) {
  const mcpsDir = getMcpsDir();
  const mcpDirs = fs
    .readdirSync(mcpsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (mcpDirs.length === 0) {
    console.log("No MCP server templates available.");
    return;
  }

  installSelectedMcps(cwd, config, mcpDirs);
}

module.exports = { installAllCommand };
