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
  resolvePaths,
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
  test("creates config file with version, empty completedSteps, and scope", async () => {
    await installCommand(testDir);

    const config = readConfig(testDir);
    expect(config).not.toBeNull();
    expect(config.version).toBe(VERSION);
    expect(config.completedSteps).toEqual([]);
    expect(config.scope).toBe("project");
  });

  test("installs skills to .claude/skills/", async () => {
    await installCommand(testDir);

    const skillsTarget = path.join(testDir, ".claude", "skills");
    expect(fs.existsSync(skillsTarget)).toBe(true);

    const dirs = fs.readdirSync(skillsTarget);
    expect(dirs).toContain("devcontainer-setup");
    expect(dirs).toContain("implementation-plan");
    expect(dirs).toContain("sdlc-wizard");

    const skillFile = path.join(skillsTarget, "devcontainer-setup", "SKILL.md");
    expect(fs.existsSync(skillFile)).toBe(true);
  });

  test("installs sdlc-wizard as a skill", async () => {
    await installCommand(testDir);

    const skillFile = path.join(testDir, ".claude", "skills", "sdlc-wizard", "SKILL.md");
    expect(fs.existsSync(skillFile)).toBe(true);

    const content = fs.readFileSync(skillFile, "utf-8");
    expect(content).toContain("SDLC Wizard");
    expect(content).toContain("Step 1");
  });

  test("installs implementation-plan skill content from template", async () => {
    await installCommand(testDir);

    const srcSkill = fs.readFileSync(
      path.join(getSkillsDir(), "implementation-plan", "SKILL.md"),
      "utf-8"
    );
    const installedSkill = fs.readFileSync(
      path.join(testDir, ".claude", "skills", "implementation-plan", "SKILL.md"),
      "utf-8"
    );
    expect(installedSkill).toBe(srcSkill);
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

  test("sdlc-wizard prompt references the skill", async () => {
    await installCommand(testDir);

    const prompt = fs.readFileSync(
      path.join(testDir, ".github", "prompts", "sdlc-wizard.prompt.md"),
      "utf-8"
    );

    expect(prompt).toContain("sdlc-wizard");
    expect(prompt).toContain("SKILL.md");
  });

  test("stores scope in config for global install", async () => {
    await installCommand(testDir, undefined, "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
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

  test("installs skills to global path when scope is global", () => {
    // When scope is global, skills go to ~/.claude/skills/ via resolvePaths()
    const home = os.homedir();
    const globalSkillsDir = path.join(home, ".claude", "skills");
    const hadGlobalSkills = fs.existsSync(globalSkillsDir);

    try {
      const installed = installSkills(testDir, "global");
      expect(installed.length).toBeGreaterThan(0);

      // Verify skills were installed to the global path
      for (const skill of installed) {
        const skillFile = path.join(globalSkillsDir, skill, "SKILL.md");
        expect(fs.existsSync(skillFile)).toBe(true);
      }
    } finally {
      // Clean up global skills we created during the test
      if (!hadGlobalSkills && fs.existsSync(globalSkillsDir)) {
        fs.rmSync(globalSkillsDir, { recursive: true, force: true });
      }
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
      "implementation-debate",
      "start-task",
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

  test("installs start-task as a skill instead of a prompt", () => {
    installFantastic4(testDir);

    // start-task skill exists
    const skillFile = path.join(
      testDir,
      ".claude",
      "skills",
      "start-task",
      "SKILL.md"
    );
    expect(fs.existsSync(skillFile)).toBe(true);

    const content = fs.readFileSync(skillFile, "utf-8");
    expect(content).toContain("Captain");
    expect(content).toContain("Task Folder");

    // start-task prompt should NOT exist
    const copilotPromptFile = path.join(
      testDir,
      ".github",
      "prompts",
      "start-task.prompt.md"
    );
    expect(fs.existsSync(copilotPromptFile)).toBe(false);

    const claudeCommandFile = path.join(
      testDir,
      ".claude",
      "commands",
      "start-task.md"
    );
    expect(fs.existsSync(claudeCommandFile)).toBe(false);
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

  test("Copilot captain agent references start-task skill", () => {
    installFantastic4(testDir);

    const captainFile = path.join(
      testDir,
      ".github",
      "agents",
      "captain.agent.md"
    );
    const content = fs.readFileSync(captainFile, "utf-8");
    expect(content).toContain("../../.claude/skills/orchestrator/SKILL.md");
    expect(content).toContain("../../.claude/skills/start-task/SKILL.md");
  });

  test("Claude captain agent references start-task skill", () => {
    installFantastic4(testDir);

    const captainFile = path.join(
      testDir,
      ".claude",
      "agents",
      "captain.md"
    );
    const content = fs.readFileSync(captainFile, "utf-8");
    expect(content).toContain("start-task");
    expect(content).toContain("orchestrator");
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

describe("resolvePaths", () => {
  test("project scope resolves to cwd-relative paths", () => {
    const paths = resolvePaths("/my/project", "project");
    expect(paths.claudeBase).toBe(path.join("/my/project", ".claude"));
    expect(paths.copilotBase).toBe(path.join("/my/project", ".github"));
    expect(paths.projectBase).toBe("/my/project");
  });

  test("global scope resolves to home-relative paths", () => {
    const home = os.homedir();
    const paths = resolvePaths("/my/project", "global");
    expect(paths.claudeBase).toBe(path.join(home, ".claude"));
    expect(paths.copilotBase).toBe(path.join(home, "copilot"));
    expect(paths.projectBase).toBe("/my/project");
  });
});

describe("global scope install", () => {
  let globalClaudeDir;
  let globalCopilotDir;

  beforeEach(() => {
    // We cannot mock os.homedir() easily, so test with project scope
    // and verify path resolution separately. For integration testing of
    // global scope, we use a custom cwd that simulates the global dirs.
    globalClaudeDir = path.join(os.homedir(), ".claude");
    globalCopilotDir = path.join(os.homedir(), "copilot");
  });

  test("installCommand with global scope writes scope to config", async () => {
    await installCommand(testDir, undefined, "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
  });

  test("installCommand fantastic4 with global scope writes scope to config", async () => {
    await installCommand(testDir, undefined, "global");
    await installCommand(testDir, "fantastic4", "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
    expect(config.completedSteps).toContain("fantastic4");
  });
});
