const path = require('path');
const fs = require('fs-extra');

const CONFIG_FILE = '.wizard.json';
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const IDE_VSCODE = 'vscode';
const IDE_ANTIGRAVITY = 'antigravity';

function getConfigPath(cwd) {
  return path.join(cwd, CONFIG_FILE);
}

async function readConfig(cwd) {
  const configPath = getConfigPath(cwd);
  if (await fs.pathExists(configPath)) {
    return fs.readJson(configPath);
  }
  return null;
}

async function writeConfig(cwd, config) {
  const configPath = getConfigPath(cwd);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

function getTemplatesDir() {
  return TEMPLATES_DIR;
}

function getAgentsDir() {
  return path.join(TEMPLATES_DIR, 'agents');
}

function getPromptsDir() {
  return path.join(TEMPLATES_DIR, 'prompts');
}

function getMcpsDir() {
  return path.join(TEMPLATES_DIR, 'mcps');
}

function getIdeAgentsTarget(cwd, ides) {
  const targets = {};
  if (ides.includes(IDE_VSCODE)) {
    targets[IDE_VSCODE] = path.join(cwd, '.vscode', 'agents');
  }
  if (ides.includes(IDE_ANTIGRAVITY)) {
    targets[IDE_ANTIGRAVITY] = path.join(cwd, '.antigravity', 'agents');
  }
  return targets;
}

function getIdePromptsTarget(cwd, ides) {
  const targets = {};
  if (ides.includes(IDE_VSCODE)) {
    targets[IDE_VSCODE] = path.join(cwd, '.vscode', 'prompts');
  }
  if (ides.includes(IDE_ANTIGRAVITY)) {
    targets[IDE_ANTIGRAVITY] = path.join(cwd, '.antigravity', 'prompts');
  }
  return targets;
}

function getMcpConfigPath(cwd, ide) {
  if (ide === IDE_VSCODE) {
    return path.join(cwd, '.vscode', 'mcp.json');
  }
  if (ide === IDE_ANTIGRAVITY) {
    return path.join(cwd, '.antigravity', 'mcp.json');
  }
  return null;
}

module.exports = {
  CONFIG_FILE,
  IDE_VSCODE,
  IDE_ANTIGRAVITY,
  readConfig,
  writeConfig,
  getConfigPath,
  getTemplatesDir,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
  getIdeAgentsTarget,
  getIdePromptsTarget,
  getMcpConfigPath
};
