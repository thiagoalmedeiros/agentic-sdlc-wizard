const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs-extra');
const {
  writeConfig,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
  IDE_VSCODE,
  IDE_ANTIGRAVITY
} = require('../src/config');

const TEST_DIR = path.join(__dirname, '..', '.test-workspace');

describe('install-agents (file operations)', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should copy agent files to vscode agents directory', async () => {
    await writeConfig(TEST_DIR, { ides: [IDE_VSCODE] });

    const agentsDir = getAgentsDir();
    const files = (await fs.readdir(agentsDir)).filter((f) => f.endsWith('.md'));

    const targetDir = path.join(TEST_DIR, '.vscode', 'agents');
    await fs.ensureDir(targetDir);
    for (const file of files) {
      await fs.copy(path.join(agentsDir, file), path.join(targetDir, file));
    }

    const installed = await fs.readdir(targetDir);
    assert.strictEqual(installed.length, files.length);
    for (const file of files) {
      assert.ok(installed.includes(file));
      const content = await fs.readFile(path.join(targetDir, file), 'utf8');
      assert.ok(content.length > 0);
    }
  });

  it('should copy agent files to antigravity agents directory', async () => {
    await writeConfig(TEST_DIR, { ides: [IDE_ANTIGRAVITY] });

    const agentsDir = getAgentsDir();
    const files = (await fs.readdir(agentsDir)).filter((f) => f.endsWith('.md'));

    const targetDir = path.join(TEST_DIR, '.antigravity', 'agents');
    await fs.ensureDir(targetDir);
    for (const file of files) {
      await fs.copy(path.join(agentsDir, file), path.join(targetDir, file));
    }

    const installed = await fs.readdir(targetDir);
    assert.strictEqual(installed.length, files.length);
  });
});

describe('install-prompts (file operations)', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should copy prompt files to vscode prompts directory', async () => {
    await writeConfig(TEST_DIR, { ides: [IDE_VSCODE] });

    const promptsDir = getPromptsDir();
    const files = (await fs.readdir(promptsDir)).filter((f) => f.endsWith('.md'));

    const targetDir = path.join(TEST_DIR, '.vscode', 'prompts');
    await fs.ensureDir(targetDir);
    for (const file of files) {
      await fs.copy(path.join(promptsDir, file), path.join(targetDir, file));
    }

    const installed = await fs.readdir(targetDir);
    assert.strictEqual(installed.length, files.length);
    for (const file of files) {
      assert.ok(installed.includes(file));
    }
  });
});

describe('install-mcps (file operations)', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should copy MCP files and create mcp.json for vscode', async () => {
    await writeConfig(TEST_DIR, { ides: [IDE_VSCODE] });

    const mcpsDir = getMcpsDir();
    const mcpName = 'bitbucket-mcp';
    const mcpSrcDir = path.join(mcpsDir, mcpName);
    const mcpMetaPath = path.join(mcpSrcDir, 'mcp.json');
    const mcpMeta = await fs.readJson(mcpMetaPath);

    const mcpDestDir = path.join(TEST_DIR, 'node_modules', '.wizard-mcps', mcpName);
    await fs.ensureDir(mcpDestDir);
    await fs.copy(mcpSrcDir, mcpDestDir, {
      filter: (src) => path.basename(src) !== 'mcp.json'
    });

    // Verify files were copied (excluding mcp.json)
    const copiedFiles = await fs.readdir(mcpDestDir);
    assert.ok(copiedFiles.includes('index.js'));
    assert.ok(copiedFiles.includes('server.js'));
    assert.ok(!copiedFiles.includes('mcp.json'));

    // Build MCP config
    const envEntries = {};
    for (const param of mcpMeta.envParams) {
      envEntries[param.name] = `\${input:${param.name}}`;
    }

    const mcpConfig = {
      servers: {
        [mcpName]: {
          type: 'stdio',
          command: 'node',
          args: [path.join(mcpDestDir, 'index.js')],
          env: envEntries
        }
      }
    };

    const mcpConfigPath = path.join(TEST_DIR, '.vscode', 'mcp.json');
    await fs.ensureDir(path.dirname(mcpConfigPath));
    await fs.writeJson(mcpConfigPath, mcpConfig, { spaces: 2 });

    // Verify mcp.json was created
    assert.ok(await fs.pathExists(mcpConfigPath));
    const writtenConfig = await fs.readJson(mcpConfigPath);
    assert.ok(writtenConfig.servers[mcpName]);
    assert.strictEqual(writtenConfig.servers[mcpName].type, 'stdio');
    assert.strictEqual(writtenConfig.servers[mcpName].command, 'node');
    assert.ok(writtenConfig.servers[mcpName].env.BITBUCKET_URL);
    assert.ok(writtenConfig.servers[mcpName].env.BITBUCKET_TOKEN);
  });

  it('should merge with existing mcp.json', async () => {
    const mcpConfigPath = path.join(TEST_DIR, '.vscode', 'mcp.json');
    await fs.ensureDir(path.dirname(mcpConfigPath));
    await fs.writeJson(mcpConfigPath, {
      servers: {
        'existing-mcp': { type: 'stdio', command: 'node', args: ['existing.js'] }
      }
    });

    const mcpConfig = await fs.readJson(mcpConfigPath);
    mcpConfig.servers['bitbucket-mcp'] = {
      type: 'stdio',
      command: 'node',
      args: ['bitbucket.js']
    };
    await fs.writeJson(mcpConfigPath, mcpConfig, { spaces: 2 });

    const result = await fs.readJson(mcpConfigPath);
    assert.ok(result.servers['existing-mcp']);
    assert.ok(result.servers['bitbucket-mcp']);
  });
});
