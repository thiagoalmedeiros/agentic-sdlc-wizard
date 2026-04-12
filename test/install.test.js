"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  VERSION,
  writeConfig,
  readConfig,
  getSkillsDir,
  getPromptsDir,
} = require("../src/config");
const {
  installCommand,
  installSkills,
  installPrompts,
} = require("../src/commands/install");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("installCommand", () => {
  test("creates config file with version and empty completedSteps", async () => {
    await installCommand(testDir);

    const config = readConfig(testDir);
    expect(config).not.toBeNull();
    expect(config.version).toBe(VERSION);
    expect(config.completedSteps).toEqual([]);
  });

  test("installs skills to .claude/skills/", async () => {
    await installCommand(testDir);

    const skillsTarget = path.join(testDir, ".claude", "skills");
    expect(fs.existsSync(skillsTarget)).toBe(true);

    const files = fs.readdirSync(skillsTarget);
    expect(files).toContain("devcontainer-setup.md");
  });

  test("installs prompts to .github/prompts/ for Copilot", async () => {
    await installCommand(testDir);

    const copilotDir = path.join(testDir, ".github", "prompts");
    expect(fs.existsSync(copilotDir)).toBe(true);

    const files = fs.readdirSync(copilotDir);
    expect(files).toContain("sdlc-wizard.md");
  });

  test("installs prompts to .claude/commands/ for Claude", async () => {
    await installCommand(testDir);

    const claudeDir = path.join(testDir, ".claude", "commands");
    expect(fs.existsSync(claudeDir)).toBe(true);

    const files = fs.readdirSync(claudeDir);
    expect(files).toContain("sdlc-wizard.md");
  });

  test("skill content matches template", async () => {
    await installCommand(testDir);

    const srcSkill = fs.readFileSync(
      path.join(getSkillsDir(), "devcontainer-setup.md"),
      "utf-8"
    );
    const installedSkill = fs.readFileSync(
      path.join(testDir, ".claude", "skills", "devcontainer-setup.md"),
      "utf-8"
    );
    expect(installedSkill).toBe(srcSkill);
  });

  test("prompt content matches template", async () => {
    await installCommand(testDir);

    const srcPrompt = fs.readFileSync(
      path.join(getPromptsDir(), "sdlc-wizard.md"),
      "utf-8"
    );
    const copilotPrompt = fs.readFileSync(
      path.join(testDir, ".github", "prompts", "sdlc-wizard.md"),
      "utf-8"
    );
    const claudePrompt = fs.readFileSync(
      path.join(testDir, ".claude", "commands", "sdlc-wizard.md"),
      "utf-8"
    );
    expect(copilotPrompt).toBe(srcPrompt);
    expect(claudePrompt).toBe(srcPrompt);
  });
});

describe("installSkills", () => {
  test("copies all skill files to .claude/skills/", () => {
    const skillsDir = getSkillsDir();
    const templateFiles = fs
      .readdirSync(skillsDir)
      .filter((f) => f.endsWith(".md"));

    const installed = installSkills(testDir);

    expect(installed).toEqual(templateFiles);

    const targetDir = path.join(testDir, ".claude", "skills");
    const targetFiles = fs.readdirSync(targetDir);
    expect(targetFiles.length).toBe(templateFiles.length);

    for (const file of templateFiles) {
      expect(targetFiles).toContain(file);
      const content = fs.readFileSync(path.join(targetDir, file), "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});

describe("installPrompts", () => {
  test("copies all prompt files to .github/prompts/ and .claude/commands/", () => {
    const promptsDir = getPromptsDir();
    const templateFiles = fs
      .readdirSync(promptsDir)
      .filter((f) => f.endsWith(".md"));

    const installed = installPrompts(testDir);

    expect(installed).toEqual(templateFiles);

    // Copilot prompts
    const copilotDir = path.join(testDir, ".github", "prompts");
    const copilotFiles = fs.readdirSync(copilotDir);
    expect(copilotFiles.length).toBe(templateFiles.length);

    // Claude commands
    const claudeDir = path.join(testDir, ".claude", "commands");
    const claudeFiles = fs.readdirSync(claudeDir);
    expect(claudeFiles.length).toBe(templateFiles.length);

    for (const file of templateFiles) {
      expect(copilotFiles).toContain(file);
      expect(claudeFiles).toContain(file);
    }
  });
});
