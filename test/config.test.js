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
