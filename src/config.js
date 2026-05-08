"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const CONFIG_FILE = ".wizard.json";
const VERSION = "1.0.0";

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

function getSkillsDir() {
  return path.join(TEMPLATES_DIR, "skills");
}

function getInstructionsDir() {
  return path.join(TEMPLATES_DIR, "instructions");
}

function getGitignorePath(cwd) {
  return path.join(cwd, ".gitignore");
}

function updateGitignore(cwd, entries) {
  const gitignorePath = getGitignorePath(cwd);
  const existing = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf-8")
    : "";

  const lines = existing.split("\n");
  const toAdd = entries.filter((e) => !lines.some((l) => l.trim() === e.trim()));

  if (toAdd.length === 0) return;

  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(gitignorePath, existing + prefix + toAdd.join("\n") + "\n");
}

/**
 * Resolve target directories based on install scope.
 *
 * The wizard installs a single `.claude/` tree. VS Code Copilot reads
 * `.claude/` natively, so there is no separate Copilot-specific target
 * directory.
 *
 * @param {string} cwd - Current working directory
 * @param {"project"|"global"} scope - Install scope
 * @returns {{ claudeBase: string, projectBase: string }}
 */
function resolvePaths(cwd, scope) {
  if (scope === "global") {
    const home = os.homedir();
    return {
      claudeBase: path.join(home, ".claude"),
      projectBase: cwd,
    };
  }
  return {
    claudeBase: path.join(cwd, ".claude"),
    projectBase: cwd,
  };
}

module.exports = {
  CONFIG_FILE,
  VERSION,
  TEMPLATES_DIR,
  getConfigPath,
  readConfig,
  writeConfig,
  getSkillsDir,
  getInstructionsDir,
  getGitignorePath,
  updateGitignore,
  resolvePaths,
};
