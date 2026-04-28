"use strict";

const fs = require("fs");
const path = require("path");
const {
  VERSION,
  readConfig,
  writeConfig,
  getSkillsDir,
  getInstructionsDir,
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
 * Install all skills into `<scope>/.claude/skills/`.
 *
 * Every template skill is installed by this function — there are no
 * optional skill bundles and no agents. Skills drive the entire workflow:
 * initial setup (`sdlc-wizard`), task orchestration (`sdlc-wizard-orchestrator`), planning
 * (`sdlc-wizard-implementation-plan`, `sdlc-wizard-planner`), coding (`sdlc-wizard-coder`), review
 * (`sdlc-wizard-reviewer`), debugging (`sdlc-wizard-bug-fixer`), pre-plan critique
 * (`sdlc-wizard-implementation-debate`), and per-step setup (`sdlc-wizard-devcontainer-setup`,
 * `sdlc-wizard-graphify-setup`).
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
      copyDirRecursive(
        path.join(skillsDir, entry.name),
        path.join(targetDir, entry.name)
      );
      skillNames.push(entry.name);
    }
  }

  return skillNames;
}

/**
 * Install global coding instructions into `<scope>/.claude/instructions/`.
 *
 * The instructions are shared coding standards applied to all generated
 * code — not tied to any single skill.
 */
function installInstructions(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const instructionsDir = getInstructionsDir();
  const targetDir = path.join(paths.claudeBase, "instructions");

  if (!fs.existsSync(instructionsDir)) {
    return [];
  }

  const files = fs
    .readdirSync(instructionsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name);

  for (const file of files) {
    copyFileSync(path.join(instructionsDir, file), targetDir, file);
  }

  return files;
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

async function installCommand(cwd, scope) {
  cwd = cwd || process.cwd();
  scope = scope || "project";

  const existing = readConfig(cwd);
  const config = {
    version: VERSION,
    completedSteps: (existing && existing.completedSteps) || [],
    scope,
  };

  writeConfig(cwd, config);

  const skills = installSkills(cwd, scope);
  const instructions = installInstructions(cwd, scope);

  console.log(`\nSDLC Wizard v${VERSION} installed successfully (${scopeLabel(scope)}).`);
  console.log(
    `\nSkills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`
  );
  console.log(`\nInstalled skills: ${skills.join(", ")}`);
  if (instructions.length > 0) {
    console.log(
      `\nInstructions installed to ${scope === "global" ? "~/.claude/instructions/" : ".claude/instructions/"}`
    );
    console.log(`  ${instructions.join(", ")}`);
  }
  console.log(`\nNext steps:`);
  console.log(
    `  Ask your IDE chat (Copilot or Claude Code) to run the "sdlc-wizard" skill`
  );
  console.log(
    `  for initial configuration, or the "sdlc-wizard-orchestrator" skill to begin an`
  );
  console.log(`  orchestrated task with planning, coding, and review.`);
}

module.exports = {
  installCommand,
  installSkills,
  installInstructions,
  promptScope,
};
