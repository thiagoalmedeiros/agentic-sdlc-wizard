const path = require('path');
const fs = require('fs-extra');
const { checkbox } = require('@inquirer/prompts');
const { readConfig, getMcpsDir, getMcpConfigPath } = require('../config');

async function installMcps() {
  const cwd = process.cwd();
  const config = await readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const mcpsDir = getMcpsDir();
  const entries = await fs.readdir(mcpsDir, { withFileTypes: true });
  const mcpDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (mcpDirs.length === 0) {
    console.log('No MCP server templates available.');
    return;
  }

  const choices = mcpDirs.map((name) => ({ name, value: name }));

  const selected = await checkbox({
    message: 'Select MCP servers to install:',
    choices,
    required: true
  });

  if (selected.length === 0) {
    console.log('No MCP servers selected. Aborting.');
    return;
  }

  for (const ide of config.ides) {
    const mcpConfigPath = getMcpConfigPath(cwd, ide);
    if (!mcpConfigPath) continue;

    let mcpConfig = { servers: {} };
    if (await fs.pathExists(mcpConfigPath)) {
      mcpConfig = await fs.readJson(mcpConfigPath);
      if (!mcpConfig.servers) {
        mcpConfig.servers = {};
      }
    }

    for (const mcpName of selected) {
      const mcpSrcDir = path.join(mcpsDir, mcpName);
      const mcpMetaPath = path.join(mcpSrcDir, 'mcp.json');
      let envParams = [];

      if (await fs.pathExists(mcpMetaPath)) {
        const mcpMeta = await fs.readJson(mcpMetaPath);
        envParams = mcpMeta.envParams || [];
      }

      const mcpDestDir = path.join(cwd, 'node_modules', '.wizard-mcps', mcpName);
      await fs.ensureDir(mcpDestDir);
      await fs.copy(mcpSrcDir, mcpDestDir, {
        filter: (src) => path.basename(src) !== 'mcp.json'
      });

      const envEntries = {};
      for (const param of envParams) {
        envEntries[param.name] = `\${input:${param.name}}`;
      }

      mcpConfig.servers[mcpName] = {
        type: 'stdio',
        command: 'node',
        args: [path.join(mcpDestDir, 'index.js')],
        env: envEntries
      };
    }

    await fs.ensureDir(path.dirname(mcpConfigPath));
    await fs.writeJson(mcpConfigPath, mcpConfig, { spaces: 2 });
    console.log(`MCP configuration written to ${path.relative(cwd, mcpConfigPath)}`);
  }

  console.log('\nMCP servers installed. Update the environment variables in your MCP config.');
}

module.exports = installMcps;
