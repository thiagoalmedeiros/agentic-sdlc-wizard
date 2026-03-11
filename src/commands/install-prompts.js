"use strict";

const fs = require("fs");
const path = require("path");
const {
  getPromptsDir,
  getIdePromptsTarget,
  readConfig,
  updateGitignore,
} = require("../config");

async function installPromptsCommand(cwd) {
  const { checkbox } = require("@inquirer/prompts");
  cwd = cwd || process.cwd();
  const config = readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const promptsDir = getPromptsDir();
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((f) => f.endsWith(".md"));

  if (promptFiles.length === 0) {
    console.log("No prompt templates available.");
    return;
  }

  const choices = promptFiles
    .sort()
    .map((f) => ({ name: f.replace(".md", ""), value: f }));

  const selected = await checkbox({
    message: "Select prompts to install:",
    choices,
  });

  if (selected.length === 0) {
    console.log("No prompts selected. Aborting.");
    return;
  }

  const targets = getIdePromptsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const prompt of selected) {
      const src = path.join(promptsDir, prompt);
      const dest = path.join(targetDir, prompt);
      fs.copyFileSync(src, dest);
    }
    const relDir = path.relative(cwd, targetDir);
    updateGitignore(cwd, [relDir + "/"]);
    console.log(`Prompts installed to ${relDir}/`);
  }
}

module.exports = { installPromptsCommand };
