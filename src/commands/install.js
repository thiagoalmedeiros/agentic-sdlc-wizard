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
 * Prompt the user for install scope using readline.
 * @returns {Promise<"project"|"global">}
 */
function promptScope() {
  const readline = require("readline");
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log("\nWhere would you like to install?");
    console.log("  1. Project level (.github and .claude in current directory)");
    console.log("  2. Global level (~/.claude and ~/copilot for all projects)");
    rl.question("\nEnter your choice (1 or 2): ", (answer) => {
      rl.close();
      resolve(answer.trim() === "2" ? "global" : "project");
    });
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
