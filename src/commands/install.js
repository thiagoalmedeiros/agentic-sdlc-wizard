"use strict";

const fs = require("fs");
const path = require("path");
const {
  VERSION,
  readConfig,
  writeConfig,
  getSkillsDir,
  getPromptsDir,
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

function installSkills(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const skillsDir = getSkillsDir();
  const targetDir = path.join(paths.claudeBase, "skills");

  // Copy each skill directory (preserving <name>/SKILL.md structure)
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

function installPrompts(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const promptsDir = getPromptsDir();
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((f) => f.endsWith(".md"));

  // Install for Copilot — keep .prompt.md extension as-is
  const copilotDir = path.join(paths.copilotBase, "prompts");
  for (const file of promptFiles) {
    copyFileSync(path.join(promptsDir, file), copilotDir, file);
  }

  // Install for Claude — strip .prompt from extension
  const claudeDir = path.join(paths.claudeBase, "commands");
  for (const file of promptFiles) {
    const claudeName = file.replace(/\.prompt\.md$/, ".md");
    copyFileSync(path.join(promptsDir, file), claudeDir, claudeName);
  }

  return promptFiles;
}

function installFantastic4(cwd, scope) {
  scope = scope || "project";
  const paths = resolvePaths(cwd, scope);
  const f4Dir = getFantastic4Dir();

  // Copilot agents
  const copilotAgentsDir = path.join(f4Dir, "agents", "copilot");
  const copilotAgentsTarget = path.join(paths.copilotBase, "agents");
  const copilotAgents = fs
    .readdirSync(copilotAgentsDir)
    .filter((f) => f.endsWith(".md"));
  for (const file of copilotAgents) {
    copyFileSync(path.join(copilotAgentsDir, file), copilotAgentsTarget, file);
  }

  // Claude Code agents
  const claudeAgentsDir = path.join(f4Dir, "agents", "claude-code");
  const claudeAgentsTarget = path.join(paths.claudeBase, "agents");
  const claudeAgents = fs
    .readdirSync(claudeAgentsDir)
    .filter((f) => f.endsWith(".md"));
  for (const file of claudeAgents) {
    copyFileSync(path.join(claudeAgentsDir, file), claudeAgentsTarget, file);
  }

  // Skills (recursive copy preserving subdirectory structure)
  const skillsSrc = path.join(f4Dir, "skills");
  const skillsTarget = path.join(paths.claudeBase, "skills");
  copyDirRecursive(skillsSrc, skillsTarget);

  // Global coding instructions
  const instructionsSrc = path.join(
    f4Dir,
    "instructions",
    "global-coding.instructions.md"
  );
  copyFileSync(
    instructionsSrc,
    path.join(paths.copilotBase, "instructions"),
    "global-coding.instructions.md"
  );
  copyFileSync(
    instructionsSrc,
    path.join(paths.claudeBase, "instructions"),
    "global-coding.instructions.md"
  );

  // lessons.md → project root (always project-level)
  const lessonsSrc = path.join(f4Dir, "lessons.md");
  fs.copyFileSync(lessonsSrc, path.join(paths.projectBase, "lessons.md"));

  // tasks/ directory → project root (always project-level)
  fs.mkdirSync(path.join(paths.projectBase, "tasks"), { recursive: true });

  return {
    copilotAgents,
    claudeAgents,
  };
}

/**
 * Show an interactive arrow-key menu to select the install scope.
 * Uses up/down arrows to navigate, Space or Enter to confirm.
 * Falls back to "project" scope when not running in an interactive terminal.
 * @returns {Promise<"project"|"global">}
 */
function promptScope() {
  return new Promise((resolve) => {
    // Non-interactive environment (e.g. CI, pipes, tests via stdin) — use default
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      resolve("project");
      return;
    }

    const readline = require("readline");

    const options = [
      {
        value: "project",
        label: "Project level  (.github and .claude in current directory)",
      },
      {
        value: "global",
        label: "Global level   (~/.claude and ~/copilot for all projects)",
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
      // Lines printed: 1 blank + 1 header + 1 blank + options.length + 1 blank + 1 hint
      const lines = options.length + 5;
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
      // Ctrl+C → abort
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.exit();
      }

      // Up arrow
      if (key === "\x1b[A") {
        cursor = (cursor - 1 + options.length) % options.length;
        clearRender();
        render();
        return;
      }

      // Down arrow
      if (key === "\x1b[B") {
        cursor = (cursor + 1) % options.length;
        clearRender();
        render();
        return;
      }

      // Enter (\r or \n) or Space → confirm selection
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
  return scope === "global" ? "global (~/.claude, ~/copilot)" : "project (.github, .claude)";
}

async function installCommand(cwd, subcommand, scope) {
  cwd = cwd || process.cwd();
  scope = scope || "project";

  const config = {
    version: VERSION,
    completedSteps: [],
    scope,
  };

  // Read existing config if present, to preserve completedSteps on subcommand installs
  const existing = readConfig(cwd);
  if (subcommand && existing) {
    config.version = existing.version || VERSION;
    config.completedSteps = existing.completedSteps || [];
  }

  if (!subcommand) {
    // Base install
    writeConfig(cwd, config);

    const skills = installSkills(cwd, scope);
    const prompts = installPrompts(cwd, scope);

    console.log(`\nSDLC Wizard v${VERSION} installed successfully (${scopeLabel(scope)}).`);
    console.log(`\nSkills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`);
    console.log(
      `Prompts installed to ${scope === "global" ? "~/copilot/prompts/ and ~/.claude/commands/" : ".github/prompts/ and .claude/commands/"}`
    );
    console.log(`\nInstalled skills: ${skills.join(", ")}`);
    console.log(`Installed prompts: ${prompts.map(f => f.replace(/\.prompt\.md$/, "").replace(/\.md$/, "")).join(", ")}`);
    console.log(`\nNext steps:`);
    console.log(
      `  Open your IDE chat (Copilot, Codex, or Claude) and use /sdlc-wizard`
    );
  } else if (subcommand === "fantastic4") {
    const result = installFantastic4(cwd, scope);

    if (!config.completedSteps.includes("fantastic4")) {
      config.completedSteps.push("fantastic4");
    }
    writeConfig(cwd, config);

    console.log(`\nFantastic 4 agent orchestra installed successfully (${scopeLabel(scope)}).`);
    console.log(`\nCopilot agents installed to ${scope === "global" ? "~/copilot/agents/" : ".github/agents/"}`);
    console.log(`  ${result.copilotAgents.join(", ")}`);
    console.log(`Claude Code agents installed to ${scope === "global" ? "~/.claude/agents/" : ".claude/agents/"}`);
    console.log(`  ${result.claudeAgents.join(", ")}`);
    console.log(`Skills installed to ${scope === "global" ? "~/.claude/skills/" : ".claude/skills/"}`);
    console.log(`Instructions installed to ${scope === "global" ? "~/copilot/instructions/ and ~/.claude/instructions/" : ".github/instructions/ and .claude/instructions/"}`);
    console.log(`Created lessons.md and tasks/ directory`);
    console.log(`\nNext steps:`);
    console.log(`  Use @captain in your IDE chat to begin a task with Captain`);
  } else {
    console.log(`Unknown subcommand: ${subcommand}`);
    process.exit(1);
  }
}

module.exports = { installCommand, installSkills, installPrompts, installFantastic4, promptScope };
