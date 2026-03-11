"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  CONFIG_FILE,
  IDE_VSCODE,
  IDE_ANTIGRAVITY,
  getConfigPath,
  readConfig,
  writeConfig,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
  getIdeAgentsTarget,
  getIdePromptsTarget,
  getMcpConfigPath,
  getGitignorePath,
  updateGitignore,
} = require("../src/config");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

test("getConfigPath returns path with config file", () => {
  expect(getConfigPath(testDir)).toBe(path.join(testDir, CONFIG_FILE));
});

test("readConfig returns null when missing", () => {
  expect(readConfig(testDir)).toBeNull();
});

test("writeConfig and readConfig round-trip", () => {
  const config = { ides: [IDE_VSCODE] };
  writeConfig(testDir, config);
  expect(readConfig(testDir)).toEqual(config);
});

test("getAgentsDir ends with templates/agents", () => {
  const d = getAgentsDir();
  expect(d).toMatch(/templates[/\\]agents$/);
});

test("getPromptsDir ends with templates/prompts", () => {
  const d = getPromptsDir();
  expect(d).toMatch(/templates[/\\]prompts$/);
});

test("getMcpsDir ends with templates/mcps", () => {
  const d = getMcpsDir();
  expect(d).toMatch(/templates[/\\]mcps$/);
});

test("getIdeAgentsTarget for vscode", () => {
  const targets = getIdeAgentsTarget(testDir, [IDE_VSCODE]);
  expect(targets[IDE_VSCODE]).toBe(path.join(testDir, ".vscode", "agents"));
  expect(targets[IDE_ANTIGRAVITY]).toBeUndefined();
});

test("getIdeAgentsTarget for antigravity", () => {
  const targets = getIdeAgentsTarget(testDir, [IDE_ANTIGRAVITY]);
  expect(targets[IDE_ANTIGRAVITY]).toBe(
    path.join(testDir, ".gemini", "agents")
  );
  expect(targets[IDE_VSCODE]).toBeUndefined();
});

test("getIdeAgentsTarget for both", () => {
  const targets = getIdeAgentsTarget(testDir, [IDE_VSCODE, IDE_ANTIGRAVITY]);
  expect(targets[IDE_VSCODE]).toBe(path.join(testDir, ".vscode", "agents"));
  expect(targets[IDE_ANTIGRAVITY]).toBe(
    path.join(testDir, ".gemini", "agents")
  );
});

test("getIdePromptsTarget for vscode", () => {
  const targets = getIdePromptsTarget(testDir, [IDE_VSCODE]);
  expect(targets[IDE_VSCODE]).toBe(path.join(testDir, ".vscode", "prompts"));
});

test("getIdePromptsTarget for antigravity", () => {
  const targets = getIdePromptsTarget(testDir, [IDE_ANTIGRAVITY]);
  expect(targets[IDE_ANTIGRAVITY]).toBe(
    path.join(testDir, ".gemini", "prompts")
  );
});

test("getMcpConfigPath for vscode", () => {
  expect(getMcpConfigPath(testDir, IDE_VSCODE)).toBe(
    path.join(testDir, ".vscode", "mcp.json")
  );
});

test("getMcpConfigPath for antigravity", () => {
  expect(getMcpConfigPath(testDir, IDE_ANTIGRAVITY)).toBe(
    path.join(testDir, ".gemini", "mcp.json")
  );
});

test("getMcpConfigPath for unknown returns null", () => {
  expect(getMcpConfigPath(testDir, "unknown")).toBeNull();
});

test("getGitignorePath returns path with .gitignore", () => {
  expect(getGitignorePath(testDir)).toBe(path.join(testDir, ".gitignore"));
});

test("updateGitignore creates .gitignore when missing", () => {
  updateGitignore(testDir, [".vscode/agents/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain(".vscode/agents/");
});

test("updateGitignore appends new entries", () => {
  fs.writeFileSync(path.join(testDir, ".gitignore"), "node_modules/\n");
  updateGitignore(testDir, [".vscode/agents/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain("node_modules/");
  expect(content).toContain(".vscode/agents/");
});

test("updateGitignore skips existing entries", () => {
  fs.writeFileSync(path.join(testDir, ".gitignore"), ".vscode/agents/\n");
  updateGitignore(testDir, [".vscode/agents/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  const occurrences = content
    .split("\n")
    .filter((l) => l.trim() === ".vscode/agents/").length;
  expect(occurrences).toBe(1);
});

test("updateGitignore adds multiple entries at once", () => {
  updateGitignore(testDir, [".vscode/mcp.json", ".wizard-mcps/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain(".vscode/mcp.json");
  expect(content).toContain(".wizard-mcps/");
});
