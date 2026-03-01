const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs-extra');
const {
  readConfig,
  writeConfig,
  getConfigPath,
  getAgentsDir,
  getPromptsDir,
  getMcpsDir,
  getIdeAgentsTarget,
  getIdePromptsTarget,
  getMcpConfigPath,
  IDE_VSCODE,
  IDE_ANTIGRAVITY,
  CONFIG_FILE
} = require('../src/config');

const TEST_DIR = path.join(__dirname, '..', '.test-workspace');

describe('config', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should return config path', () => {
    const p = getConfigPath(TEST_DIR);
    assert.strictEqual(p, path.join(TEST_DIR, CONFIG_FILE));
  });

  it('should return null when config does not exist', async () => {
    const config = await readConfig(TEST_DIR);
    assert.strictEqual(config, null);
  });

  it('should write and read config', async () => {
    const config = { ides: [IDE_VSCODE] };
    await writeConfig(TEST_DIR, config);
    const result = await readConfig(TEST_DIR);
    assert.deepStrictEqual(result, config);
  });

  it('should return correct agents dir', () => {
    const dir = getAgentsDir();
    assert.ok(dir.endsWith(path.join('templates', 'agents')));
  });

  it('should return correct prompts dir', () => {
    const dir = getPromptsDir();
    assert.ok(dir.endsWith(path.join('templates', 'prompts')));
  });

  it('should return correct mcps dir', () => {
    const dir = getMcpsDir();
    assert.ok(dir.endsWith(path.join('templates', 'mcps')));
  });

  it('should return vscode agents target', () => {
    const targets = getIdeAgentsTarget(TEST_DIR, [IDE_VSCODE]);
    assert.strictEqual(targets[IDE_VSCODE], path.join(TEST_DIR, '.vscode', 'agents'));
    assert.strictEqual(targets[IDE_ANTIGRAVITY], undefined);
  });

  it('should return antigravity agents target', () => {
    const targets = getIdeAgentsTarget(TEST_DIR, [IDE_ANTIGRAVITY]);
    assert.strictEqual(targets[IDE_ANTIGRAVITY], path.join(TEST_DIR, '.antigravity', 'agents'));
    assert.strictEqual(targets[IDE_VSCODE], undefined);
  });

  it('should return both agents targets', () => {
    const targets = getIdeAgentsTarget(TEST_DIR, [IDE_VSCODE, IDE_ANTIGRAVITY]);
    assert.strictEqual(targets[IDE_VSCODE], path.join(TEST_DIR, '.vscode', 'agents'));
    assert.strictEqual(targets[IDE_ANTIGRAVITY], path.join(TEST_DIR, '.antigravity', 'agents'));
  });

  it('should return vscode prompts target', () => {
    const targets = getIdePromptsTarget(TEST_DIR, [IDE_VSCODE]);
    assert.strictEqual(targets[IDE_VSCODE], path.join(TEST_DIR, '.vscode', 'prompts'));
  });

  it('should return antigravity prompts target', () => {
    const targets = getIdePromptsTarget(TEST_DIR, [IDE_ANTIGRAVITY]);
    assert.strictEqual(targets[IDE_ANTIGRAVITY], path.join(TEST_DIR, '.antigravity', 'prompts'));
  });

  it('should return vscode mcp config path', () => {
    const p = getMcpConfigPath(TEST_DIR, IDE_VSCODE);
    assert.strictEqual(p, path.join(TEST_DIR, '.vscode', 'mcp.json'));
  });

  it('should return antigravity mcp config path', () => {
    const p = getMcpConfigPath(TEST_DIR, IDE_ANTIGRAVITY);
    assert.strictEqual(p, path.join(TEST_DIR, '.antigravity', 'mcp.json'));
  });

  it('should return null for unknown ide mcp config path', () => {
    const p = getMcpConfigPath(TEST_DIR, 'unknown');
    assert.strictEqual(p, null);
  });
});
