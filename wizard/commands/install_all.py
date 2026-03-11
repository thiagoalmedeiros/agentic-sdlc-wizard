"""Install all components (agents, prompts, MCPs) at once."""

import json
import os
import shutil

from wizard.config import (
    get_agents_dir,
    get_ide_agents_target,
    get_ide_prompts_target,
    get_mcp_config_path,
    get_mcps_dir,
    get_prompts_dir,
    read_config,
)
from wizard.commands.install_mcps import _parse_env_params


def install_all_command(cwd: str | None = None) -> None:
    """Install all agents, prompts, and MCP servers without interactive selection."""
    cwd = cwd or os.getcwd()
    config = read_config(cwd)

    if not config:
        print('No wizard configuration found. Run "wizard install" first.')
        return

    _install_all_agents(cwd, config)
    _install_all_prompts(cwd, config)
    _install_all_mcps(cwd, config)

    print("\nAll components installed successfully.")


def _install_all_agents(cwd: str, config: dict) -> None:
    """Install all available agents."""
    agents_dir = get_agents_dir()
    agent_files = [f for f in os.listdir(agents_dir) if f.endswith(".md")]

    if not agent_files:
        print("No agent templates available.")
        return

    targets = get_ide_agents_target(cwd, config["ides"])

    for ide, target_dir in targets.items():
        os.makedirs(target_dir, exist_ok=True)
        for agent in agent_files:
            src = os.path.join(agents_dir, agent)
            dest = os.path.join(target_dir, agent)
            shutil.copy2(src, dest)
        print(f"Agents installed to {os.path.relpath(target_dir, cwd)}/")


def _install_all_prompts(cwd: str, config: dict) -> None:
    """Install all available prompts."""
    prompts_dir = get_prompts_dir()
    prompt_files = [f for f in os.listdir(prompts_dir) if f.endswith(".md")]

    if not prompt_files:
        print("No prompt templates available.")
        return

    targets = get_ide_prompts_target(cwd, config["ides"])

    for ide, target_dir in targets.items():
        os.makedirs(target_dir, exist_ok=True)
        for prompt in prompt_files:
            src = os.path.join(prompts_dir, prompt)
            dest = os.path.join(target_dir, prompt)
            shutil.copy2(src, dest)
        print(f"Prompts installed to {os.path.relpath(target_dir, cwd)}/")


def _install_all_mcps(cwd: str, config: dict) -> None:
    """Install all available MCP servers."""
    mcps_dir = get_mcps_dir()
    mcp_dirs = [
        d
        for d in os.listdir(mcps_dir)
        if os.path.isdir(os.path.join(mcps_dir, d))
    ]

    if not mcp_dirs:
        print("No MCP server templates available.")
        return

    for ide in config["ides"]:
        mcp_config_path = get_mcp_config_path(cwd, ide)
        if not mcp_config_path:
            continue

        mcp_config: dict = {"servers": {}}
        if os.path.exists(mcp_config_path):
            with open(mcp_config_path, "r") as f:
                mcp_config = json.load(f)
            if "servers" not in mcp_config:
                mcp_config["servers"] = {}

        for mcp_name in mcp_dirs:
            mcp_src_dir = os.path.join(mcps_dir, mcp_name)
            pyproject_path = os.path.join(mcp_src_dir, "pyproject.toml")
            env_params = []

            if os.path.exists(pyproject_path):
                env_params = _parse_env_params(pyproject_path)

            mcp_dest_dir = os.path.join(cwd, ".wizard-mcps", mcp_name)
            if os.path.exists(mcp_dest_dir):
                shutil.rmtree(mcp_dest_dir)
            shutil.copytree(mcp_src_dir, mcp_dest_dir)

            env_entries = {}
            for param in env_params:
                env_entries[param["name"]] = "${input:" + param["name"] + "}"

            mcp_config["servers"][mcp_name] = {
                "type": "stdio",
                "command": "uv",
                "args": ["run", "--directory", mcp_dest_dir, "python", "-m", mcp_name.replace("-", "_")],
                "env": env_entries,
            }

        os.makedirs(os.path.dirname(mcp_config_path), exist_ok=True)
        with open(mcp_config_path, "w") as f:
            json.dump(mcp_config, f, indent=2)
        print(f"MCP configuration written to {os.path.relpath(mcp_config_path, cwd)}")

    print("\nMCP servers installed. Update the environment variables in your MCP config.")
