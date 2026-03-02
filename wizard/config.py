"""Configuration management for the wizard."""

import json
import os
from pathlib import Path

CONFIG_FILE = ".wizard.json"

IDE_VSCODE = "vscode"
IDE_ANTIGRAVITY = "antigravity"

TEMPLATES_DIR = Path(__file__).parent / "templates"


def get_config_path(cwd: str) -> str:
    """Return the path to the wizard config file."""
    return os.path.join(cwd, CONFIG_FILE)


def read_config(cwd: str) -> dict | None:
    """Read the wizard config file. Returns None if it does not exist."""
    config_path = get_config_path(cwd)
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return json.load(f)
    return None


def write_config(cwd: str, config: dict) -> None:
    """Write the wizard config file."""
    config_path = get_config_path(cwd)
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)


def get_templates_dir() -> Path:
    """Return the templates directory."""
    return TEMPLATES_DIR


def get_agents_dir() -> Path:
    """Return the agents templates directory."""
    return TEMPLATES_DIR / "agents"


def get_prompts_dir() -> Path:
    """Return the prompts templates directory."""
    return TEMPLATES_DIR / "prompts"


def get_mcps_dir() -> Path:
    """Return the MCPs templates directory."""
    return TEMPLATES_DIR / "mcps"


def get_ide_agents_target(cwd: str, ides: list[str]) -> dict[str, str]:
    """Return IDE-specific agents target directories."""
    targets = {}
    if IDE_VSCODE in ides:
        targets[IDE_VSCODE] = os.path.join(cwd, ".vscode", "agents")
    if IDE_ANTIGRAVITY in ides:
        targets[IDE_ANTIGRAVITY] = os.path.join(cwd, ".antigravity", "agents")
    return targets


def get_ide_prompts_target(cwd: str, ides: list[str]) -> dict[str, str]:
    """Return IDE-specific prompts target directories."""
    targets = {}
    if IDE_VSCODE in ides:
        targets[IDE_VSCODE] = os.path.join(cwd, ".vscode", "prompts")
    if IDE_ANTIGRAVITY in ides:
        targets[IDE_ANTIGRAVITY] = os.path.join(cwd, ".antigravity", "prompts")
    return targets


def get_mcp_config_path(cwd: str, ide: str) -> str | None:
    """Return the MCP config file path for a given IDE."""
    if ide == IDE_VSCODE:
        return os.path.join(cwd, ".vscode", "mcp.json")
    if ide == IDE_ANTIGRAVITY:
        return os.path.join(cwd, ".antigravity", "mcp.json")
    return None
