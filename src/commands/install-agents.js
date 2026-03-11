"use strict";

const fs = require("fs");
const path = require("path");
const { getAgentsDir, getIdeAgentsTarget, readConfig } = require("../config");

async function installAgentsCommand(cwd) {
  const { checkbox } = require("@inquirer/prompts");
  cwd = cwd || process.cwd();
  const config = readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const agentsDir = getAgentsDir();
  const agentFiles = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"));

  if (agentFiles.length === 0) {
    console.log("No agent templates available.");
    return;
  }

  const choices = agentFiles
    .sort()
    .map((f) => ({ name: f.replace(".md", ""), value: f }));

  const selected = await checkbox({
    message: "Select agents to install:",
    choices,
  });

  if (selected.length === 0) {
    console.log("No agents selected. Aborting.");
    return;
  }

  const targets = getIdeAgentsTarget(cwd, config.ides);

  for (const [ide, targetDir] of Object.entries(targets)) {
    fs.mkdirSync(targetDir, { recursive: true });
    for (const agent of selected) {
      const src = path.join(agentsDir, agent);
      const dest = path.join(targetDir, agent);
      fs.copyFileSync(src, dest);
    }
    console.log(`Agents installed to ${path.relative(cwd, targetDir)}/`);
  }
}

module.exports = { installAgentsCommand };
