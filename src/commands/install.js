"use strict";

const fs = require("fs");
const path = require("path");
const {
  VERSION,
  writeConfig,
  getSkillsDir,
  getPromptsDir,
} = require("../config");

function copyFileSync(src, destDir, filename) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, filename));
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

async function installCommand(cwd) {
  cwd = cwd || process.cwd();

  const config = {
    version: VERSION,
    completedSteps: [],
  };
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
  console.log(
    `\nNext steps:`
  );
  console.log(
    `  Open your IDE chat (Copilot, Codex, or Claude) and use /sdlc-wizard`
  );
}

module.exports = { installCommand, installSkills, installPrompts };
