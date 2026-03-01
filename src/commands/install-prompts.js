const path = require('path');
const fs = require('fs-extra');
const { checkbox } = require('@inquirer/prompts');
const { readConfig, getPromptsDir, getIdePromptsTarget } = require('../config');

async function installPrompts() {
  const cwd = process.cwd();
  const config = await readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const promptsDir = getPromptsDir();
  const files = await fs.readdir(promptsDir);
  const promptFiles = files.filter((f) => f.endsWith('.md'));

  if (promptFiles.length === 0) {
    console.log('No prompt templates available.');
    return;
  }

  const choices = promptFiles.map((f) => ({
    name: f.replace('.md', ''),
    value: f
  }));

  const selected = await checkbox({
    message: 'Select prompts to install:',
    choices,
    required: true
  });

  if (selected.length === 0) {
    console.log('No prompts selected. Aborting.');
    return;
  }

  const targets = getIdePromptsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    await fs.ensureDir(targetDir);
    for (const prompt of selected) {
      const src = path.join(promptsDir, prompt);
      const dest = path.join(targetDir, prompt);
      await fs.copy(src, dest);
    }
    console.log(`Prompts installed to ${path.relative(cwd, targetDir)}/`);
  }
}

module.exports = installPrompts;
