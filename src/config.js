"use strict";

const fs = require("fs");
const path = require("path");

const CONFIG_FILE = ".wizard.json";

const IDE_VSCODE = "vscode";
const IDE_ANTIGRAVITY = "antigravity";

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

function getConfigPath(cwd) {
  return path.join(cwd, CONFIG_FILE);
}

function readConfig(cwd) {
  const configPath = getConfigPath(cwd);
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  return null;
}

function writeConfig(cwd, config) {
  const configPath = getConfigPath(cwd);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getTemplatesDir() {
  return TEMPLATES_DIR;
}

function getAgentsDir() {
  return path.join(TEMPLATES_DIR, "agents");
}

function getPromptsDir() {
  return path.join(TEMPLATES_DIR, "prompts");
}

function getMcpsDir() {
  return path.join(TEMPLATES_DIR, "mcps");
}

function getIdeAgentsTarget(cwd, ides) {
  const targets = {};
  if (ides.includes(IDE_VSCODE)) {
    targets[IDE_VSCODE] = path.join(cwd, ".vscode", "agents");
  }
  if (ides.includes(IDE_ANTIGRAVITY)) {
    targets[IDE_ANTIGRAVITY] = path.join(cwd, ".gemini", "agents");
  }
  return targets;
}

function getIdePromptsTarget(cwd, ides) {
  const targets = {};
  if (ides.includes(IDE_VSCODE)) {
    targets[IDE_VSCODE] = path.join(cwd, ".vscode", "prompts");
  }
  if (ides.includes(IDE_ANTIGRAVITY)) {
    targets[IDE_ANTIGRAVITY] = path.join(cwd, ".gemini", "prompts");
  }
  return targets;
}

function getMcpConfigPath(cwd, ide) {
  if (ide === IDE_VSCODE) {
    return path.join(cwd, ".vscode", "mcp.json");
  }
  if (ide === IDE_ANTIGRAVITY) {
    return path.join(cwd, ".gemini", "mcp.json");
  }
  return null;
}

module.exports = {
  CONFIG_FILE,
  IDE_VSCODE,
  IDE_ANTIGRAVITY,
  TEMPLATES_DIR,
  getConfigPath,
  readConfig,
  writeConfig,
  getTemplatesDir,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
  getIdeAgentsTarget,
  getIdePromptsTarget,
  getMcpConfigPath,
};
