"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  CONFIG_FILE,
  VERSION,
  getConfigPath,
  readConfig,
  writeConfig,
  getSkillsDir,
  getPromptsDir,
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
  const config = { version: VERSION, completedSteps: [] };
  writeConfig(testDir, config);
  expect(readConfig(testDir)).toEqual(config);
});

test("VERSION is defined", () => {
  expect(VERSION).toBeDefined();
  expect(typeof VERSION).toBe("string");
});

test("getSkillsDir ends with templates/skills", () => {
  const d = getSkillsDir();
  expect(d).toMatch(/templates[/\\]skills$/);
});

test("getPromptsDir ends with templates/prompts", () => {
  const d = getPromptsDir();
  expect(d).toMatch(/templates[/\\]prompts$/);
});

test("getGitignorePath returns path with .gitignore", () => {
  expect(getGitignorePath(testDir)).toBe(path.join(testDir, ".gitignore"));
});

test("updateGitignore creates .gitignore when missing", () => {
  updateGitignore(testDir, [".claude/skills/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain(".claude/skills/");
});

test("updateGitignore appends new entries", () => {
  fs.writeFileSync(path.join(testDir, ".gitignore"), "node_modules/\n");
  updateGitignore(testDir, [".claude/skills/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain("node_modules/");
  expect(content).toContain(".claude/skills/");
});

test("updateGitignore skips existing entries", () => {
  fs.writeFileSync(path.join(testDir, ".gitignore"), ".claude/skills/\n");
  updateGitignore(testDir, [".claude/skills/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  const occurrences = content
    .split("\n")
    .filter((l) => l.trim() === ".claude/skills/").length;
  expect(occurrences).toBe(1);
});

test("updateGitignore adds multiple entries at once", () => {
  updateGitignore(testDir, [".github/prompts/", ".claude/commands/"]);
  const content = fs.readFileSync(path.join(testDir, ".gitignore"), "utf-8");
  expect(content).toContain(".github/prompts/");
  expect(content).toContain(".claude/commands/");
});
