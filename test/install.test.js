"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  VERSION,
  readConfig,
  getSkillsDir,
  getFantastic4Dir,
} = require("../src/config");
const {
  installCommand,
  installSkills,
  installFantastic4,
} = require("../src/commands/install");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// installCommand (base install — .claude only, no prompts, no .github)
// ---------------------------------------------------------------------------

describe("installCommand (base)", () => {
  test("writes .wizard.json with version, empty completedSteps, scope", async () => {
    await installCommand(testDir);

    const config = readConfig(testDir);
    expect(config).not.toBeNull();
    expect(config.version).toBe(VERSION);
    expect(config.completedSteps).toEqual([]);
    expect(config.scope).toBe("project");
  });

  test("installs every template skill to .claude/skills/", async () => {
    await installCommand(testDir);

    const skillsTarget = path.join(testDir, ".claude", "skills");
    expect(fs.existsSync(skillsTarget)).toBe(true);

    const expected = fs
      .readdirSync(getSkillsDir(), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const actual = fs.readdirSync(skillsTarget);

    for (const name of expected) {
      expect(actual).toContain(name);
      expect(
        fs.existsSync(path.join(skillsTarget, name, "SKILL.md"))
      ).toBe(true);
    }
  });

  test("installs sdlc-wizard as a skill", async () => {
    await installCommand(testDir);

    const skill = path.join(testDir, ".claude", "skills", "sdlc-wizard", "SKILL.md");
    expect(fs.existsSync(skill)).toBe(true);

    const content = fs.readFileSync(skill, "utf-8");
    expect(content).toContain("SDLC Wizard");
    expect(content).toContain("Step 1");
  });

  test("does NOT create a .github tree (Copilot reads .claude natively)", async () => {
    await installCommand(testDir);

    expect(fs.existsSync(path.join(testDir, ".github"))).toBe(false);
  });

  test("does NOT install any prompt or command wrapper for sdlc-wizard", async () => {
    await installCommand(testDir);

    expect(
      fs.existsSync(path.join(testDir, ".claude", "commands"))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(testDir, ".github", "prompts"))
    ).toBe(false);
  });

  test("installed skill files match their templates byte-for-byte", async () => {
    await installCommand(testDir);

    const skills = fs
      .readdirSync(getSkillsDir(), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const name of skills) {
      const src = fs.readFileSync(
        path.join(getSkillsDir(), name, "SKILL.md"),
        "utf-8"
      );
      const installed = fs.readFileSync(
        path.join(testDir, ".claude", "skills", name, "SKILL.md"),
        "utf-8"
      );
      expect(installed).toBe(src);
    }
  });

  test("stores scope=global in config when invoked with global scope", async () => {
    await installCommand(testDir, undefined, "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
  });
});

// ---------------------------------------------------------------------------
// installSkills
// ---------------------------------------------------------------------------

describe("installSkills", () => {
  test("returns the list of installed skill directory names", () => {
    const installed = installSkills(testDir);
    const expected = fs
      .readdirSync(getSkillsDir(), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    expect(installed).toEqual(expected);
  });

  test("installs to the global .claude path when scope is global", () => {
    const globalSkills = path.join(os.homedir(), ".claude", "skills");
    const hadGlobal = fs.existsSync(globalSkills);

    try {
      const installed = installSkills(testDir, "global");
      expect(installed.length).toBeGreaterThan(0);

      for (const skill of installed) {
        expect(
          fs.existsSync(path.join(globalSkills, skill, "SKILL.md"))
        ).toBe(true);
      }
    } finally {
      if (!hadGlobal && fs.existsSync(globalSkills)) {
        fs.rmSync(globalSkills, { recursive: true, force: true });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// installFantastic4
// ---------------------------------------------------------------------------

describe("installFantastic4", () => {
  test("installs a single set of agents to .claude/agents/", () => {
    installFantastic4(testDir);

    const agentsDir = path.join(testDir, ".claude", "agents");
    expect(fs.existsSync(agentsDir)).toBe(true);

    const files = fs.readdirSync(agentsDir);
    expect(files).toContain("captain.md");
    expect(files).toContain("harper.md");
    expect(files).toContain("benjamin.md");
    expect(files).toContain("lucas.md");
    expect(files).toContain("bug-fixer.md");
  });

  test("does NOT install any .github/agents/ directory", () => {
    installFantastic4(testDir);

    expect(
      fs.existsSync(path.join(testDir, ".github", "agents"))
    ).toBe(false);
    expect(fs.existsSync(path.join(testDir, ".github"))).toBe(false);
  });

  test("installs all skills to .claude/skills/ with subdirectory structure", () => {
    installFantastic4(testDir);

    const skillsDir = path.join(testDir, ".claude", "skills");
    const expected = [
      "orchestrator",
      "planner",
      "coder",
      "reviewer",
      "bug-fixer",
      "implementation-debate",
    ];
    for (const skill of expected) {
      const skillFile = path.join(skillsDir, skill, "SKILL.md");
      expect(fs.existsSync(skillFile)).toBe(true);
      expect(fs.readFileSync(skillFile, "utf-8").length).toBeGreaterThan(0);
    }

    // Deprecated skills must not appear
    for (const removed of ["start-task", "security-reviewer"]) {
      expect(
        fs.existsSync(path.join(skillsDir, removed))
      ).toBe(false);
    }

    // The legacy planner template is gone — plan.md is now produced by
    // the implementation-plan skill, not from a template.
    expect(
      fs.existsSync(path.join(skillsDir, "planner", "templates"))
    ).toBe(false);
  });

  test("installs instructions only to .claude/instructions/", () => {
    installFantastic4(testDir);

    const claudeInstr = path.join(
      testDir,
      ".claude",
      "instructions",
      "global-coding.instructions.md"
    );
    expect(fs.existsSync(claudeInstr)).toBe(true);
    expect(fs.readFileSync(claudeInstr, "utf-8").length).toBeGreaterThan(0);

    expect(
      fs.existsSync(path.join(testDir, ".github", "instructions"))
    ).toBe(false);
  });

  test("does NOT create a project-root lessons.md", () => {
    installFantastic4(testDir);

    expect(fs.existsSync(path.join(testDir, "lessons.md"))).toBe(false);
  });

  test("does NOT create a tasks/ directory at project root", () => {
    installFantastic4(testDir);

    expect(fs.existsSync(path.join(testDir, "tasks"))).toBe(false);
  });

  test("captain agent references the orchestrator skill (and no longer start-task)", () => {
    installFantastic4(testDir);

    const captain = fs.readFileSync(
      path.join(testDir, ".claude", "agents", "captain.md"),
      "utf-8"
    );
    expect(captain).toContain("orchestrator");
    expect(captain).not.toContain("start-task");
  });

  test("orchestrator skill documents dispatch for both Claude Code and Copilot", () => {
    installFantastic4(testDir);

    const orchestrator = fs.readFileSync(
      path.join(testDir, ".claude", "skills", "orchestrator", "SKILL.md"),
      "utf-8"
    );
    // Both harnesses must be covered in the dispatch protocol
    expect(orchestrator).toMatch(/Claude Code/);
    expect(orchestrator).toMatch(/Copilot/);
    expect(orchestrator).toMatch(/Agent\(/);
    expect(orchestrator).toMatch(/\/fleet/);
    expect(orchestrator).toMatch(/@agent/);
  });

  test("fantastic4 templates do not leak any .github paths", () => {
    installFantastic4(testDir);

    const roots = [
      path.join(testDir, ".claude", "agents"),
      path.join(testDir, ".claude", "skills"),
      path.join(testDir, ".claude", "instructions"),
    ];

    function walk(dir) {
      const out = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          out.push(...walk(p));
        } else {
          out.push(p);
        }
      }
      return out;
    }

    const offenders = [];
    for (const root of roots) {
      for (const file of walk(root)) {
        const content = fs.readFileSync(file, "utf-8");
        if (/\.github\//.test(content)) {
          offenders.push(path.relative(testDir, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// installCommand with fantastic4 subcommand
// ---------------------------------------------------------------------------

describe("installCommand with fantastic4 subcommand", () => {
  test("installs fantastic4 and updates .wizard.json", async () => {
    await installCommand(testDir);
    await installCommand(testDir, "fantastic4");

    const config = readConfig(testDir);
    expect(config.completedSteps).toContain("fantastic4");

    expect(
      fs.existsSync(path.join(testDir, ".claude", "agents", "captain.md"))
    ).toBe(true);
  });

  test("does not duplicate fantastic4 in completedSteps on re-install", async () => {
    await installCommand(testDir);
    await installCommand(testDir, "fantastic4");
    await installCommand(testDir, "fantastic4");

    const config = readConfig(testDir);
    const count = config.completedSteps.filter((s) => s === "fantastic4")
      .length;
    expect(count).toBe(1);
  });

  test("preserves scope on subcommand install (global)", async () => {
    await installCommand(testDir, undefined, "global");
    await installCommand(testDir, "fantastic4", "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
    expect(config.completedSteps).toContain("fantastic4");
  });
});

// ---------------------------------------------------------------------------
// Repository contract — the deprecated pieces must stay removed
// ---------------------------------------------------------------------------

describe("repository contract", () => {
  const repoRoot = path.join(__dirname, "..");

  test("no templates/prompts directory exists", () => {
    expect(fs.existsSync(path.join(repoRoot, "templates", "prompts"))).toBe(
      false
    );
  });

  test("no templates/mcps directory exists", () => {
    expect(fs.existsSync(path.join(repoRoot, "templates", "mcps"))).toBe(
      false
    );
  });

  test("no templates/fantastic4/agents/copilot directory exists", () => {
    expect(
      fs.existsSync(
        path.join(repoRoot, "templates", "fantastic4", "agents", "copilot")
      )
    ).toBe(false);
  });

  test("no templates/fantastic4/lessons.md exists", () => {
    expect(
      fs.existsSync(path.join(repoRoot, "templates", "fantastic4", "lessons.md"))
    ).toBe(false);
  });

  test("deprecated fantastic4 skill folders are removed", () => {
    const skillsRoot = path.join(repoRoot, "templates", "fantastic4", "skills");
    for (const removed of ["start-task", "security-reviewer"]) {
      expect(fs.existsSync(path.join(skillsRoot, removed))).toBe(false);
    }
  });

  test("planner no longer ships a task-implementation template", () => {
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          "templates",
          "fantastic4",
          "skills",
          "planner",
          "templates"
        )
      )
    ).toBe(false);
  });

  test("fantastic4 agents live directly under templates/fantastic4/agents", () => {
    const agentsDir = path.join(repoRoot, "templates", "fantastic4", "agents");
    const files = fs.readdirSync(agentsDir);
    expect(files).toEqual(
      expect.arrayContaining([
        "captain.md",
        "harper.md",
        "benjamin.md",
        "lucas.md",
        "bug-fixer.md",
      ])
    );
  });

  test("install.js does not reference .github or copilotBase", () => {
    const src = fs.readFileSync(
      path.join(repoRoot, "src", "commands", "install.js"),
      "utf-8"
    );
    expect(src).not.toMatch(/\.github/);
    expect(src).not.toMatch(/copilotBase/);
  });

  test("config.js does not reference .github or copilotBase", () => {
    const src = fs.readFileSync(
      path.join(repoRoot, "src", "config.js"),
      "utf-8"
    );
    expect(src).not.toMatch(/\.github/);
    expect(src).not.toMatch(/copilotBase/);
  });
});
