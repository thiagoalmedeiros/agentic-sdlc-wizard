#!/usr/bin/env node
"use strict";

const { installCommand } = require("./commands/install");
const { installAgentsCommand } = require("./commands/install-agents");
const { installPromptsCommand } = require("./commands/install-prompts");
const { installMcpsCommand } = require("./commands/install-mcps");
const { installAllCommand } = require("./commands/install-all");

function printHelp() {
  console.log(
    "Usage: wizard [command]\n" +
      "\n" +
      "Agentic SDLC Wizard - Install and configure AI agents, prompts, and MCP servers\n" +
      "\n" +
      "Commands:\n" +
      "  install          Initialize wizard configuration or install components\n" +
      "\n" +
      "Options:\n" +
      "  --version        Show version number\n" +
      "  -h, --help       Show this help message"
  );
}

function printInstallHelp() {
  console.log(
    "Usage: wizard install [subcommand]\n" +
      "\n" +
      "Initialize wizard configuration or install components\n" +
      "\n" +
      "Subcommands:\n" +
      "  agents           Install AI agent definitions for your IDE\n" +
      "  prompts          Install prompt templates for your IDE\n" +
      "  mcps             Install and configure MCP servers for your IDE\n" +
      "  all              Install all agents, prompts, and MCP servers at once\n" +
      "\n" +
      "Options:\n" +
      "  -h, --help       Show this help message"
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    return;
  }

  if (args[0] === "--version") {
    console.log("1.0.0");
    return;
  }

  if (args[0] === "install") {
    const sub = args[1] || null;
    if (sub === null) {
      await installCommand();
    } else if (sub === "agents") {
      await installAgentsCommand();
    } else if (sub === "prompts") {
      await installPromptsCommand();
    } else if (sub === "mcps") {
      await installMcpsCommand();
    } else if (sub === "all") {
      await installAllCommand();
    } else if (sub === "-h" || sub === "--help") {
      printInstallHelp();
    } else {
      console.log(`Unknown subcommand: ${sub}`);
      printInstallHelp();
      process.exit(1);
    }
  } else {
    console.log(`Unknown command: ${args[0]}`);
    printHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

module.exports = { main, printHelp, printInstallHelp };
