#!/usr/bin/env node
"use strict";

const { installCommand, promptScope } = require("./commands/install");
const { VERSION } = require("./config");

function printHelp() {
  console.log(
    "Usage: wizard [command]\n" +
      "\n" +
      "SDLC Wizard - Configure your development environment with skills\n" +
      "\n" +
      "Commands:\n" +
      "  install          Install wizard configuration and all skills\n" +
      "\n" +
      "Options:\n" +
      "  --version        Show version number\n" +
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
    console.log(VERSION);
    return;
  }

  if (args[0] === "install") {
    if (args[1] === "-h" || args[1] === "--help") {
      printHelp();
      return;
    }

    // Always show the interactive scope menu
    const scope = await promptScope();

    await installCommand(undefined, scope);
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
