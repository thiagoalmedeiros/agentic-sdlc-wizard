#!/usr/bin/env node
"use strict";

const { installCommand, promptScope } = require("./commands/install");
const { VERSION } = require("./config");

function printHelp() {
  console.log(
    "Usage: wizard [command]\n" +
      "\n" +
      "SDLC Wizard - Configure your development environment with AI agents\n" +
      "\n" +
      "Commands:\n" +
      "  install               Install wizard configuration, prompts, and skills\n" +
      "  install fantastic4    Install the Fantastic 4 multi-agent orchestra\n" +
      "\n" +
      "Options:\n" +
      "  --project        Install at project level (.github and .claude)\n" +
      "  --global         Install at global level (~/.claude and ~/copilot)\n" +
      "  --version        Show version number\n" +
      "  -h, --help       Show this help message"
  );
}

function parseScope(args) {
  if (args.includes("--global")) return "global";
  if (args.includes("--project")) return "project";
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printHelp();
    return;
  }

  if (args[0] === "--version") {
    console.log(VERSION);
    return;
  }

  if (args[0] === "install") {
    if (args[1] === "-h" || args[1] === "--help") {
      printHelp();
      return;
    }

    // Extract scope from flags, or prompt interactively
    let scope = parseScope(args);
    if (!scope) {
      scope = await promptScope();
    }

    // Extract subcommand (first non-flag argument after "install")
    const subcommand = args.slice(1).find((a) => !a.startsWith("-"));

    await installCommand(undefined, subcommand, scope);
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

module.exports = { main, printHelp };
