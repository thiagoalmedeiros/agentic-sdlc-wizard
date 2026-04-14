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

function installSkills(cwd) {
  const skillsDir = getSkillsDir();
  const skillFiles = fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith(".md"));

  const targetDir = path.join(cwd, ".claude", "skills");

  for (const file of skillFiles) {
    copyFileSync(path.join(skillsDir, file), targetDir, file);
  }

  return skillFiles;
}

function installPrompts(cwd) {
  const promptsDir = getPromptsDir();
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((f) => f.endsWith(".md"));

  // Install for Copilot (.github/prompts)
  const copilotDir = path.join(cwd, ".github", "prompts");
  for (const file of promptFiles) {
    copyFileSync(path.join(promptsDir, file), copilotDir, file);
  }

  // Install for Claude (.claude/commands)
  const claudeDir = path.join(cwd, ".claude", "commands");
  for (const file of promptFiles) {
    copyFileSync(path.join(promptsDir, file), claudeDir, file);
  }

  return promptFiles;
}

function installFantastic4(cwd) {
  const f4Dir = getFantastic4Dir();

  // Copilot agents → .github/agents/
  const copilotAgentsDir = path.join(f4Dir, "agents", "copilot");
  const copilotAgentsTarget = path.join(cwd, ".github", "agents");
  const copilotAgents = fs
    .readdirSync(copilotAgentsDir)
    .filter((f) => f.endsWith(".md"));
  for (const file of copilotAgents) {
    copyFileSync(path.join(copilotAgentsDir, file), copilotAgentsTarget, file);
  }

  // Claude Code agents → .claude/agents/
  const claudeAgentsDir = path.join(f4Dir, "agents", "claude-code");
  const claudeAgentsTarget = path.join(cwd, ".claude", "agents");
  const claudeAgents = fs
    .readdirSync(claudeAgentsDir)
    .filter((f) => f.endsWith(".md"));
  for (const file of claudeAgents) {
    copyFileSync(path.join(claudeAgentsDir, file), claudeAgentsTarget, file);
  }

  // Skills (recursive copy preserving subdirectory structure) → .claude/skills/
  const skillsSrc = path.join(f4Dir, "skills");
  const skillsTarget = path.join(cwd, ".claude", "skills");
  copyDirRecursive(skillsSrc, skillsTarget);

  // Start-task prompt → .github/prompts/ (Copilot variant)
  const copilotPromptSrc = path.join(f4Dir, "prompts", "start-task.prompt.md");
  copyFileSync(
    copilotPromptSrc,
    path.join(cwd, ".github", "prompts"),
    "start-task.prompt.md"
  );

  // Start-task command → .claude/commands/ (Claude variant)
  const claudePromptSrc = path.join(f4Dir, "prompts", "start-task-claude.md");
  copyFileSync(
    claudePromptSrc,
    path.join(cwd, ".claude", "commands"),
    "start-task.md"
  );

  // Global coding instructions → .github/instructions/ and .claude/instructions/
  const instructionsSrc = path.join(
    f4Dir,
    "instructions",
    "global-coding.instructions.md"
  );
  copyFileSync(
    instructionsSrc,
    path.join(cwd, ".github", "instructions"),
    "global-coding.instructions.md"
  );
  copyFileSync(
    instructionsSrc,
    path.join(cwd, ".claude", "instructions"),
    "global-coding.instructions.md"
  );

  // lessons.md → project root
  const lessonsSrc = path.join(f4Dir, "lessons.md");
  fs.copyFileSync(lessonsSrc, path.join(cwd, "lessons.md"));

  // tasks/ directory → project root
  fs.mkdirSync(path.join(cwd, "tasks"), { recursive: true });

  return {
    copilotAgents,
    claudeAgents,
  };
}

async function installCommand(cwd, subcommand) {
  cwd = cwd || process.cwd();

  const config = {
    version: VERSION,
    completedSteps: [],
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

    const skills = installSkills(cwd);
    const prompts = installPrompts(cwd);

    console.log(`\nSDLC Wizard v${VERSION} installed successfully.`);
    console.log(`\nSkills installed to .claude/skills/`);
    console.log(
      `Prompts installed to .github/prompts/ and .claude/commands/`
    );
    console.log(`\nInstalled skills: ${skills.join(", ")}`);
    console.log(`Installed prompts: ${prompts.join(", ")}`);
    console.log(`\nNext steps:`);
    console.log(
      `  Open your IDE chat (Copilot, Codex, or Claude) and use /sdlc-wizard`
    );
  } else if (subcommand === "fantastic4") {
    const result = installFantastic4(cwd);

    if (!config.completedSteps.includes("fantastic4")) {
      config.completedSteps.push("fantastic4");
    }
    writeConfig(cwd, config);

    console.log(`\nFantastic 4 agent orchestra installed successfully.`);
    console.log(`\nCopilot agents installed to .github/agents/`);
    console.log(`  ${result.copilotAgents.join(", ")}`);
    console.log(`Claude Code agents installed to .claude/agents/`);
    console.log(`  ${result.claudeAgents.join(", ")}`);
    console.log(`Skills installed to .claude/skills/`);
    console.log(`Instructions installed to .github/instructions/ and .claude/instructions/`);
    console.log(`Start-task prompt installed to .github/prompts/ and .claude/commands/`);
    console.log(`Created lessons.md and tasks/ directory`);
    console.log(`\nNext steps:`);
    console.log(`  Use /start-task in your IDE chat to begin a task with Captain`);
  } else {
    console.log(`Unknown subcommand: ${subcommand}`);
    process.exit(1);
  }
}

module.exports = { installCommand, installSkills, installPrompts, installFantastic4 };
