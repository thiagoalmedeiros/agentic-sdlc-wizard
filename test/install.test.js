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
  getFantastic4Dir,
} = require("../src/config");
const {
  installCommand,
  installSkills,
  installPrompts,
  installFantastic4,
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

    const dirs = fs.readdirSync(skillsTarget);
    expect(dirs).toContain("devcontainer-setup");

    const skillFile = path.join(skillsTarget, "devcontainer-setup", "SKILL.md");
    expect(fs.existsSync(skillFile)).toBe(true);
  });

  test("installs prompts to .github/prompts/ for Copilot", async () => {
    await installCommand(testDir);

    const copilotDir = path.join(testDir, ".github", "prompts");
    expect(fs.existsSync(copilotDir)).toBe(true);

    const files = fs.readdirSync(copilotDir);
    expect(files).toContain("sdlc-wizard.prompt.md");
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
      path.join(getSkillsDir(), "devcontainer-setup", "SKILL.md"),
      "utf-8"
    );
    const installedSkill = fs.readFileSync(
      path.join(testDir, ".claude", "skills", "devcontainer-setup", "SKILL.md"),
      "utf-8"
    );
    expect(installedSkill).toBe(srcSkill);
  });

  test("prompt content matches template", async () => {
    await installCommand(testDir);

    const srcPrompt = fs.readFileSync(
      path.join(getPromptsDir(), "sdlc-wizard.prompt.md"),
      "utf-8"
    );
    const copilotPrompt = fs.readFileSync(
      path.join(testDir, ".github", "prompts", "sdlc-wizard.prompt.md"),
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
  test("copies all skill directories to .claude/skills/", () => {
    const skillsDir = getSkillsDir();
    const templateDirs = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const installed = installSkills(testDir);

    expect(installed).toEqual(templateDirs);

    const targetDir = path.join(testDir, ".claude", "skills");
    const targetDirs = fs.readdirSync(targetDir);
    expect(targetDirs.length).toBe(templateDirs.length);

    for (const dir of templateDirs) {
      expect(targetDirs).toContain(dir);
      const skillFile = path.join(targetDir, dir, "SKILL.md");
      expect(fs.existsSync(skillFile)).toBe(true);
      const content = fs.readFileSync(skillFile, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});

describe("installPrompts", () => {
  test("copies prompt files to .github/prompts/ and .claude/commands/", () => {
    const promptsDir = getPromptsDir();
    const templateFiles = fs
      .readdirSync(promptsDir)
      .filter((f) => f.endsWith(".md"));

    const installed = installPrompts(testDir);

    expect(installed).toEqual(templateFiles);

    // Copilot prompts (keep .prompt.md extension)
    const copilotDir = path.join(testDir, ".github", "prompts");
    const copilotFiles = fs.readdirSync(copilotDir);
    expect(copilotFiles.length).toBe(templateFiles.length);

    // Claude commands (strip .prompt from extension)
    const claudeDir = path.join(testDir, ".claude", "commands");
    const claudeFiles = fs.readdirSync(claudeDir);
    expect(claudeFiles.length).toBe(templateFiles.length);

    for (const file of templateFiles) {
      expect(copilotFiles).toContain(file);
      const claudeName = file.replace(/\.prompt\.md$/, ".md");
      expect(claudeFiles).toContain(claudeName);
    }
  });
});

describe("installFantastic4", () => {
  test("copies Copilot agents to .github/agents/", () => {
    installFantastic4(testDir);

    const agentsDir = path.join(testDir, ".github", "agents");
    expect(fs.existsSync(agentsDir)).toBe(true);

    const files = fs.readdirSync(agentsDir);
    expect(files).toContain("captain.agent.md");
    expect(files).toContain("benjamin.agent.md");
    expect(files).toContain("harper.agent.md");
    expect(files).toContain("lucas.agent.md");
    expect(files).toContain("bug-fixer.agent.md");
  });

  test("copies Claude Code agents to .claude/agents/", () => {
    installFantastic4(testDir);

    const agentsDir = path.join(testDir, ".claude", "agents");
    expect(fs.existsSync(agentsDir)).toBe(true);

    const files = fs.readdirSync(agentsDir);
    expect(files).toContain("captain.md");
    expect(files).toContain("benjamin.md");
    expect(files).toContain("harper.md");
    expect(files).toContain("lucas.md");
    expect(files).toContain("bug-fixer.md");
  });

  test("copies skills with subdirectory structure to .claude/skills/", () => {
    installFantastic4(testDir);

    const skillsDir = path.join(testDir, ".claude", "skills");
    expect(fs.existsSync(skillsDir)).toBe(true);

    // Check skill subdirectories exist with SKILL.md
    const expectedSkills = [
      "orchestrator",
      "planner",
      "coder",
      "reviewer",
      "bug-fixer",
      "security-reviewer",
    ];
    for (const skill of expectedSkills) {
      const skillFile = path.join(skillsDir, skill, "SKILL.md");
      expect(fs.existsSync(skillFile)).toBe(true);
      const content = fs.readFileSync(skillFile, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }

    // Check planner template
    const templateFile = path.join(
      skillsDir,
      "planner",
      "templates",
      "task-implementation.md"
    );
    expect(fs.existsSync(templateFile)).toBe(true);
  });

  test("copies start-task prompt to .github/prompts/", () => {
    installFantastic4(testDir);

    const promptFile = path.join(
      testDir,
      ".github",
      "prompts",
      "start-task.prompt.md"
    );
    expect(fs.existsSync(promptFile)).toBe(true);

    const content = fs.readFileSync(promptFile, "utf-8");
    expect(content).toContain("Captain");
  });

  test("copies start-task command to .claude/commands/", () => {
    installFantastic4(testDir);

    const commandFile = path.join(
      testDir,
      ".claude",
      "commands",
      "start-task.md"
    );
    expect(fs.existsSync(commandFile)).toBe(true);

    const content = fs.readFileSync(commandFile, "utf-8");
    expect(content).toContain("Captain");
  });

  test("copies instructions to .github/instructions/ and .claude/instructions/", () => {
    installFantastic4(testDir);

    const githubInstr = path.join(
      testDir,
      ".github",
      "instructions",
      "global-coding.instructions.md"
    );
    const claudeInstr = path.join(
      testDir,
      ".claude",
      "instructions",
      "global-coding.instructions.md"
    );

    expect(fs.existsSync(githubInstr)).toBe(true);
    expect(fs.existsSync(claudeInstr)).toBe(true);

    const content1 = fs.readFileSync(githubInstr, "utf-8");
    const content2 = fs.readFileSync(claudeInstr, "utf-8");
    expect(content1).toBe(content2);
    expect(content1.length).toBeGreaterThan(0);
  });

  test("creates lessons.md at project root", () => {
    installFantastic4(testDir);

    const lessonsFile = path.join(testDir, "lessons.md");
    expect(fs.existsSync(lessonsFile)).toBe(true);

    const content = fs.readFileSync(lessonsFile, "utf-8");
    expect(content).toContain("Lessons Learned");
  });

  test("creates tasks/ directory at project root", () => {
    installFantastic4(testDir);

    const tasksDir = path.join(testDir, "tasks");
    expect(fs.existsSync(tasksDir)).toBe(true);
    expect(fs.statSync(tasksDir).isDirectory()).toBe(true);
  });

  test("Copilot agent skill paths reference .claude/skills/", () => {
    installFantastic4(testDir);

    const captainFile = path.join(
      testDir,
      ".github",
      "agents",
      "captain.agent.md"
    );
    const content = fs.readFileSync(captainFile, "utf-8");
    expect(content).toContain("../../.claude/skills/orchestrator/SKILL.md");
  });
});

describe("installCommand with fantastic4 subcommand", () => {
  test("installs fantastic4 and updates .wizard.json", async () => {
    // First run base install to create .wizard.json
    await installCommand(testDir);

    // Then install fantastic4
    await installCommand(testDir, "fantastic4");

    const config = readConfig(testDir);
    expect(config.completedSteps).toContain("fantastic4");

    // Verify agents are installed
    expect(
      fs.existsSync(path.join(testDir, ".github", "agents", "captain.agent.md"))
    ).toBe(true);
    expect(
      fs.existsSync(path.join(testDir, ".claude", "agents", "captain.md"))
    ).toBe(true);
  });

  test("does not duplicate fantastic4 in completedSteps on re-install", async () => {
    await installCommand(testDir);
    await installCommand(testDir, "fantastic4");
    await installCommand(testDir, "fantastic4");

    const config = readConfig(testDir);
    const count = config.completedSteps.filter((s) => s === "fantastic4").length;
    expect(count).toBe(1);
  });
});
