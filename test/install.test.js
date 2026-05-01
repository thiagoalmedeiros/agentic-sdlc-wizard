"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  VERSION,
  readConfig,
  getSkillsDir,
  getInstructionsDir,
} = require("../src/config");
const {
  installCommand,
  installSkills,
  installInstructions,
} = require("../src/commands/install");

let testDir;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "wizard-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// installCommand (installs everything — skills + instructions)
// ---------------------------------------------------------------------------

describe("installCommand", () => {
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

  test("installs the expected skill set (no agents, wizard replaces orchestrator)", async () => {
    await installCommand(testDir);

    const skillsTarget = path.join(testDir, ".claude", "skills");
    const actual = fs.readdirSync(skillsTarget).sort();

    const expected = [
      "sdlc-wizard",
      "sdlc-council-sherlock",
      "sdlc-council-hephaestus",
      "sdlc-devcontainer-setup",
      "sdlc-graphify-setup",
      "sdlc-strategy-debate",
      "sdlc-impl-strategy",
      "sdlc-lessons-learned",
      "sdlc-council-daedalus",
      "sdlc-council-thomas",
      "sdlc-council",
    ].sort();

    expect(actual).toEqual(expected);
  });

  test("installs the sdlc-wizard skill", async () => {
    await installCommand(testDir);

    const skill = path.join(testDir, ".claude", "skills", "sdlc-wizard", "SKILL.md");
    expect(fs.existsSync(skill)).toBe(true);

    const content = fs.readFileSync(skill, "utf-8");
    expect(content).toContain("SDLC Wizard");
    expect(content).toContain("Step 1");
  });

  test("installs the sdlc-council (orchestrator) skill", async () => {
    await installCommand(testDir);

    const skill = path.join(testDir, ".claude", "skills", "sdlc-council", "SKILL.md");
    expect(fs.existsSync(skill)).toBe(true);

    const content = fs.readFileSync(skill, "utf-8");
    expect(content).toMatch(/name:\s*sdlc-council/);
    expect(content).toContain("Orchestrator");
  });

  test("installs global coding instructions to .claude/instructions/", async () => {
    await installCommand(testDir);

    const instr = path.join(
      testDir,
      ".claude",
      "instructions",
      "global-coding.instructions.md"
    );
    expect(fs.existsSync(instr)).toBe(true);
    expect(fs.readFileSync(instr, "utf-8").length).toBeGreaterThan(0);
  });

  test("does NOT create any .claude/agents directory", async () => {
    await installCommand(testDir);

    expect(fs.existsSync(path.join(testDir, ".claude", "agents"))).toBe(false);
  });

  test("does NOT create a .github tree (Copilot reads .claude natively)", async () => {
    await installCommand(testDir);

    expect(fs.existsSync(path.join(testDir, ".github"))).toBe(false);
  });

  test("does NOT install any prompt or command wrapper", async () => {
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
    await installCommand(testDir, "global");

    const config = readConfig(testDir);
    expect(config.scope).toBe("global");
  });

  test("preserves completedSteps across reinstall", async () => {
    await installCommand(testDir);
    // Simulate a previously completed step
    const existing = readConfig(testDir);
    existing.completedSteps = ["devcontainer"];
    fs.writeFileSync(
      path.join(testDir, ".wizard.json"),
      JSON.stringify(existing, null, 2)
    );

    await installCommand(testDir);
    const config = readConfig(testDir);
    expect(config.completedSteps).toContain("devcontainer");
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
    expect(installed.sort()).toEqual(expected.sort());
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
// installInstructions
// ---------------------------------------------------------------------------

describe("installInstructions", () => {
  test("copies instruction files to .claude/instructions/", () => {
    const files = installInstructions(testDir);
    expect(files).toContain("global-coding.instructions.md");

    for (const file of files) {
      expect(
        fs.existsSync(path.join(testDir, ".claude", "instructions", file))
      ).toBe(true);
    }
  });

  test("installs to the global .claude path when scope is global", () => {
    const globalInstr = path.join(os.homedir(), ".claude", "instructions");
    const hadGlobal = fs.existsSync(globalInstr);

    try {
      const files = installInstructions(testDir, "global");
      for (const file of files) {
        expect(fs.existsSync(path.join(globalInstr, file))).toBe(true);
      }
    } finally {
      if (!hadGlobal && fs.existsSync(globalInstr)) {
        fs.rmSync(globalInstr, { recursive: true, force: true });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Repository contract — agents and fantastic4 are gone
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

  test("no templates/fantastic4 directory exists", () => {
    expect(fs.existsSync(path.join(repoRoot, "templates", "fantastic4"))).toBe(
      false
    );
  });

  test("templates has only skills and instructions directories", () => {
    const entries = fs
      .readdirSync(path.join(repoRoot, "templates"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(entries).toEqual(["instructions", "skills"]);
  });

  test("no agent definition files exist anywhere under templates/", () => {
    function walk(dir) {
      const out = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(p));
        else out.push(p);
      }
      return out;
    }

    const personaNames = [
      "captain.md",
      "harper.md",
      "benjamin.md",
      "lucas.md",
    ];
    const files = walk(path.join(repoRoot, "templates")).map((p) =>
      path.basename(p)
    );
    for (const name of personaNames) {
      expect(files).not.toContain(name);
    }
  });

  test("no persona names appear in any skill content", () => {
    function walk(dir) {
      const out = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(p));
        else if (p.endsWith(".md")) out.push(p);
      }
      return out;
    }

    // Word-boundary matches on the persona names (case-insensitive) so we
    // don't get false positives on unrelated words.
    const forbidden = [
      /\bCaptain\b/i,
      /\bHarper\b/i,
      /\bBenjamin\b/i,
      /\bLucas\b/i,
      /\bFantastic\s*4\b/i,
    ];

    const offenders = [];
    for (const file of walk(path.join(repoRoot, "templates", "skills"))) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of forbidden) {
        if (pattern.test(content)) {
          offenders.push(`${path.relative(repoRoot, file)}: ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("install.js does not reference agents, fantastic4, or .github", () => {
    const src = fs.readFileSync(
      path.join(repoRoot, "src", "commands", "install.js"),
      "utf-8"
    );
    expect(src).not.toMatch(/\.github/);
    expect(src).not.toMatch(/copilotBase/);
    expect(src).not.toMatch(/fantastic4/i);
    expect(src).not.toMatch(/installAgents|\.claude\/agents/);
  });

  test("config.js does not reference agents, fantastic4, or .github", () => {
    const src = fs.readFileSync(
      path.join(repoRoot, "src", "config.js"),
      "utf-8"
    );
    expect(src).not.toMatch(/\.github/);
    expect(src).not.toMatch(/copilotBase/);
    expect(src).not.toMatch(/fantastic4/i);
  });

  test("cli.js does not reference fantastic4 subcommand", () => {
    const src = fs.readFileSync(
      path.join(repoRoot, "src", "cli.js"),
      "utf-8"
    );
    expect(src).not.toMatch(/fantastic4/i);
  });

  test("wizard skill documents dispatch for both Claude Code and Copilot", () => {
    const wizard = fs.readFileSync(
      path.join(repoRoot, "templates", "skills", "sdlc-council", "SKILL.md"),
      "utf-8"
    );
    expect(wizard).toMatch(/Claude Code/);
    expect(wizard).toMatch(/Copilot/);
  });

  test("all skills have name frontmatter matching their directory", () => {
    const skillsDir = path.join(repoRoot, "templates", "skills");
    const dirs = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const dir of dirs) {
      const content = fs.readFileSync(
        path.join(skillsDir, dir, "SKILL.md"),
        "utf-8"
      );
      const match = content.match(/^name:\s*(\S+)/m);
      expect(match).not.toBeNull();
      expect(match[1]).toBe(dir);
    }
  });
});
