"use strict";

const { IDE_VSCODE, IDE_ANTIGRAVITY, writeConfig } = require("../config");

async function installCommand(cwd) {
  const { checkbox } = require("@inquirer/prompts");
  cwd = cwd || process.cwd();

  const ides = await checkbox({
    message: "Select the IDEs you need support for:",
    choices: [
      { name: "VS Code", value: IDE_VSCODE },
      { name: "Antigravity", value: IDE_ANTIGRAVITY },
    ],
  });

  if (ides.length === 0) {
    console.log("No IDEs selected. Aborting.");
    return;
  }

  const config = { ides };
  writeConfig(cwd, config);

  console.log(`\nConfiguration saved. Selected IDEs: ${ides.join(", ")}`);
  console.log("\nNext steps:");
  console.log("  wizard install agents   - Install AI agent definitions");
  console.log("  wizard install prompts  - Install prompt templates");
  console.log("  wizard install mcps     - Install MCP servers");
}

module.exports = { installCommand };
