"use strict";

const fs = require("fs");
const path = require("path");
const {
  VERSION,
  readConfig,
  writeConfig,
  getSkillsDir,
  getFantastic4Dir,
  resolvePaths,
} = require("../config");

function copyFileSync(src, destDir, filename) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, filename));
}

function copyDirRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install base skills into `<scope>/.claude/skills/`.
 *
 * The sdlc-wizard skill is part of this bundle, so after `wizard install`
 * the wizard is available to any agent (Claude Code or Copilot) that reads
 * `.claude/skills/`.
 */
function installSkills(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const skillsDir = getSkillsDir();
  const targetDir = path.join(paths.claudeBase, "skills");

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skillNames = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      copyDirRecursive(path.join(skillsDir, entry.name), path.join(targetDir, entry.name));
      skillNames.push(entry.name);
    }
  }

  return skillNames;
}

/**
 * Install the Fantastic 4 agent orchestra into `<scope>/.claude/`.
 *
 * - Agent definitions → `.claude/agents/` (single set; skills describe how
 *   each platform dispatches them).
 * - Skills → `.claude/skills/` (readable by Claude Code and Copilot).
 * - Global coding instructions → `.claude/instructions/`.
 *
 * No project-root artifacts are created. The Fantastic 4 flow produces
 * plan folders on demand at `plans/<topic>/` via the `implementation-plan`
 * skill — the same artifact shape produced by running that skill directly.
 */
function installFantastic4(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const f4Dir = getFantastic4Dir();

  // Agents
  const agentsSrc = path.join(f4Dir, "agents");
  const agentsTarget = path.join(paths.claudeBase, "agents");
  const agentFiles = fs
    .readdirSync(agentsSrc)
    .filter((f) => f.endsWith(".md"));
  for (const file of agentFiles) {
    copyFileSync(path.join(agentsSrc, file), agentsTarget, file);
  }

  // Skills (recursive copy preserving subdirectory structure)
  const skillsSrc = path.join(f4Dir, "skills");
  const skillsTarget = path.join(paths.claudeBase, "skills");
  copyDirRecursive(skillsSrc, skillsTarget);

  // Global coding instructions (Claude only)
  const instructionsSrc = path.join(
    f4Dir,
    "instructions",
    "global-coding.instructions.md"
  );
  copyFileSync(
    instructionsSrc,
    path.join(paths.claudeBase, "instructions"),
    "global-coding.instructions.md"
  );

  return { agents: agentFiles };
}

/**
 * Show an interactive arrow-key menu to select the install scope.
 * Uses up/down arrows to navigate, Space or Enter to confirm.
 * Falls back to "project" scope when not running in an interactive terminal.
 * @returns {Promise<"project"|"global">}
 */
function promptScope() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      console.log("Non-interactive environment detected, defaulting to project scope.");
      resolve("project");
      return;
    }

    const readline = require("readline");

    const options = [
      {
        value: "project",
        label: "Project level  (.claude in current directory)",
      },
      {
        value: "global",
        label: "Global level   (~/.claude for all projects)",
      },
    ];

    let cursor = 0;

    function render() {
      process.stdout.write("\n");
      process.stdout.write("  Where would you like to install?\n");
      process.stdout.write("\n");
      for (let i = 0; i < options.length; i++) {
        if (i === cursor) {
          process.stdout.write(`  \x1b[36m❯\x1b[0m ${options[i].label}\n`);
        } else {
          process.stdout.write(`    ${options[i].label}\n`);
        }
      }
      process.stdout.write("\n");
      process.stdout.write("  (Use \u2191 \u2193 to move, Space or Enter to select)\n");
    }

    function clearRender() {
      const FIXED_LINES = 5;
      const lines = options.length + FIXED_LINES;
      for (let i = 0; i < lines; i++) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
      }
    }

    render();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function onData(key) {
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.exit(1);
      }

      if (key === "\x1b[A") {
        cursor = (cursor - 1 + options.length) % options.length;
        clearRender();
        render();
        return;
      }

      if (key === "\x1b[B") {
        cursor = (cursor + 1) % options.length;
        clearRender();
        render();
        return;
      }

      if (key === "\r" || key === "\n" || key === " ") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        clearRender();
        process.stdout.write(`\n  \u2714 ${options[cursor].label}\n\n`);
        resolve(options[cursor].value);
      }
    }

    process.stdin.on("data", onData);
  });
}

function scopeLabel(scope) {
  return scope === "global" ? "global (~/.claude)" : "project (.claude)";
}

async function installCommand(cwd, subcommand, scope) {
  cwd = cwd || process.cwd();
  scope = scope || "project";

  const config = {
    version: VERSION,
    completedSteps: [],
    scope,
  };

  const existing = readConfig(cwd);
  if (subcommand && existing) {
    config.version = existing.version || VERSION;
    config.completedSteps = existing.completedSteps || [];
  }

  if (!subcommand) {
    writeConfig(cwd, config);

    const skills = installSkills(cwd, scope);

    console.log(`\nSDLC Wizard v${VERSION} installed successfully (${scopeLabel(scope)}).`);
    console.log(
      `\nSkills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`
    );
    console.log(`\nInstalled skills: ${skills.join(", ")}`);
    console.log(`\nNext steps:`);
    console.log(
      `  Ask your IDE chat (Copilot or Claude Code) to run the "sdlc-wizard" skill.`
    );
  } else if (subcommand === "fantastic4") {
    const result = installFantastic4(cwd, scope);

    if (!config.completedSteps.includes("fantastic4")) {
      config.completedSteps.push("fantastic4");
    }
    writeConfig(cwd, config);

    console.log(`\nFantastic 4 agent orchestra installed successfully (${scopeLabel(scope)}).`);
    console.log(
      `\nAgents installed to ${scope === "global" ? "~/.claude/agents/" : ".claude/agents/"}`
    );
    console.log(`  ${result.agents.join(", ")}`);
    console.log(
      `Skills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`
    );
    console.log(
      `Instructions installed to ${scope === "global" ? "~/.claude/instructions/" : ".claude/instructions/"}`
    );
    console.log(`\nNext steps:`);
    console.log(`  Use @captain in your IDE chat to begin a task with Captain`);
  } else {
    console.log(`Unknown subcommand: ${subcommand}`);
    process.exit(1);
  }
}

module.exports = {
  installCommand,
  installSkills,
  installFantastic4,
  promptScope,
};
