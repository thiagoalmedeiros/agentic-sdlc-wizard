const { Command } = require('commander');
const install = require('./commands/install');
const installAgents = require('./commands/install-agents');
const installPrompts = require('./commands/install-prompts');
const installMcps = require('./commands/install-mcps');
const pkg = require('../package.json');

const program = new Command();

program
  .name('wizard')
  .description('Agentic SDLC Wizard - Install and configure AI agents, prompts, and MCP servers')
  .version(pkg.version);

const installCmd = program
  .command('install')
  .description('Initialize wizard configuration or install components')
  .action(install);

installCmd
  .command('agents')
  .description('Install AI agent definitions for your IDE')
  .action(installAgents);

installCmd
  .command('prompts')
  .description('Install prompt templates for your IDE')
  .action(installPrompts);

installCmd
  .command('mcps')
  .description('Install and configure MCP servers for your IDE')
  .action(installMcps);

program.parse(process.argv);
