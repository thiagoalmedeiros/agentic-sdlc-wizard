const path = require('path');
const fs = require('fs-extra');
const { checkbox } = require('@inquirer/prompts');
const { readConfig, getAgentsDir, getIdeAgentsTarget } = require('../config');

async function installAgents() {
  const cwd = process.cwd();
  const config = await readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const agentsDir = getAgentsDir();
  const files = await fs.readdir(agentsDir);
  const agentFiles = files.filter((f) => f.endsWith('.md'));

  if (agentFiles.length === 0) {
    console.log('No agent templates available.');
    return;
  }

  const choices = agentFiles.map((f) => ({
    name: f.replace('.md', ''),
    value: f
  }));

  const selected = await checkbox({
    message: 'Select agents to install:',
    choices,
    required: true
  });

  if (selected.length === 0) {
    console.log('No agents selected. Aborting.');
    return;
  }

  const targets = getIdeAgentsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    await fs.ensureDir(targetDir);
    for (const agent of selected) {
      const src = path.join(agentsDir, agent);
      const dest = path.join(targetDir, agent);
      await fs.copy(src, dest);
    }
    console.log(`Agents installed to ${path.relative(cwd, targetDir)}/`);
  }
}

module.exports = installAgents;
