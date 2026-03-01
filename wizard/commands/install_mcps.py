"""Install MCP servers command."""

import json
import os
import shutil

from InquirerPy import inquirer

from wizard.config import get_mcp_config_path, get_mcps_dir, read_config


def install_mcps_command(cwd: str | None = None) -> None:
    """Run the install mcps command."""
    cwd = cwd or os.getcwd()
    config = read_config(cwd)

    if not config:
        print('No wizard configuration found. Run "wizard install" first.')
        return

    mcps_dir = get_mcps_dir()
    mcp_dirs = [
        d
        for d in os.listdir(mcps_dir)
        if os.path.isdir(os.path.join(mcps_dir, d))
    ]

    if not mcp_dirs:
        print("No MCP server templates available.")
        return

    choices = [{"name": name, "value": name} for name in sorted(mcp_dirs)]

    selected = inquirer.checkbox(
        message="Select MCP servers to install:",
        choices=choices,
    ).execute()

    if not selected:
        print("No MCP servers selected. Aborting.")
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

        for mcp_name in selected:
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


def _parse_env_params(pyproject_path: str) -> list[dict]:
    """Parse environment parameters from a pyproject.toml file."""
    env_params = []
    in_env_section = False
    current_param: dict = {}

    with open(pyproject_path, "r") as f:
        for line in f:
            line = line.strip()
            if line == "[[tool.mcp.env]]":
                if current_param:
                    env_params.append(current_param)
                current_param = {}
                in_env_section = True
                continue
            if in_env_section:
                if line.startswith("[") and line != "[[tool.mcp.env]]":
                    if current_param:
                        env_params.append(current_param)
                        current_param = {}
                    in_env_section = False
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip().strip('"')
                    if key == "name":
                        current_param["name"] = value
                    elif key == "description":
                        current_param["description"] = value
                    elif key == "required":
                        current_param["required"] = value.lower() == "true"

    if current_param:
        env_params.append(current_param)

    return env_params
