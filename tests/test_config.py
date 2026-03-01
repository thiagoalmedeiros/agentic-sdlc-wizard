"""Tests for wizard.config module."""

import json
import os
import shutil
import tempfile

import pytest

from wizard.config import (
    CONFIG_FILE,
    IDE_ANTIGRAVITY,
    IDE_VSCODE,
    get_agents_dir,
    get_config_path,
    get_ide_agents_target,
    get_ide_prompts_target,
    get_mcp_config_path,
    get_mcps_dir,
    get_prompts_dir,
    read_config,
    write_config,
)


@pytest.fixture
def test_dir():
    """Create a temporary test directory."""
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d)


def test_get_config_path(test_dir):
    assert get_config_path(test_dir) == os.path.join(test_dir, CONFIG_FILE)


def test_read_config_returns_none_when_missing(test_dir):
    assert read_config(test_dir) is None


def test_write_and_read_config(test_dir):
    config = {"ides": [IDE_VSCODE]}
    write_config(test_dir, config)
    result = read_config(test_dir)
    assert result == config


def test_get_agents_dir():
    d = get_agents_dir()
    assert str(d).endswith(os.path.join("templates", "agents"))


def test_get_prompts_dir():
    d = get_prompts_dir()
    assert str(d).endswith(os.path.join("templates", "prompts"))


def test_get_mcps_dir():
    d = get_mcps_dir()
    assert str(d).endswith(os.path.join("templates", "mcps"))


def test_ide_agents_target_vscode(test_dir):
    targets = get_ide_agents_target(test_dir, [IDE_VSCODE])
    assert targets[IDE_VSCODE] == os.path.join(test_dir, ".vscode", "agents")
    assert IDE_ANTIGRAVITY not in targets


def test_ide_agents_target_antigravity(test_dir):
    targets = get_ide_agents_target(test_dir, [IDE_ANTIGRAVITY])
    assert targets[IDE_ANTIGRAVITY] == os.path.join(test_dir, ".antigravity", "agents")
    assert IDE_VSCODE not in targets


def test_ide_agents_target_both(test_dir):
    targets = get_ide_agents_target(test_dir, [IDE_VSCODE, IDE_ANTIGRAVITY])
    assert targets[IDE_VSCODE] == os.path.join(test_dir, ".vscode", "agents")
    assert targets[IDE_ANTIGRAVITY] == os.path.join(test_dir, ".antigravity", "agents")


def test_ide_prompts_target_vscode(test_dir):
    targets = get_ide_prompts_target(test_dir, [IDE_VSCODE])
    assert targets[IDE_VSCODE] == os.path.join(test_dir, ".vscode", "prompts")


def test_ide_prompts_target_antigravity(test_dir):
    targets = get_ide_prompts_target(test_dir, [IDE_ANTIGRAVITY])
    assert targets[IDE_ANTIGRAVITY] == os.path.join(test_dir, ".antigravity", "prompts")


def test_mcp_config_path_vscode(test_dir):
    p = get_mcp_config_path(test_dir, IDE_VSCODE)
    assert p == os.path.join(test_dir, ".vscode", "mcp.json")


def test_mcp_config_path_antigravity(test_dir):
    p = get_mcp_config_path(test_dir, IDE_ANTIGRAVITY)
    assert p == os.path.join(test_dir, ".antigravity", "mcp.json")


def test_mcp_config_path_unknown(test_dir):
    assert get_mcp_config_path(test_dir, "unknown") is None
