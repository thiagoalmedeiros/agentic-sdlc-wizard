"""Tests for wizard commands file operations."""

import json
import os
import shutil
import tempfile

import pytest

from wizard.config import (
    IDE_ANTIGRAVITY,
    IDE_VSCODE,
    get_agents_dir,
    get_mcps_dir,
    get_prompts_dir,
    write_config,
)


@pytest.fixture
def test_dir():
    """Create a temporary test directory."""
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d)


class TestInstallAgents:
    def test_copy_agents_to_vscode(self, test_dir):
        write_config(test_dir, {"ides": [IDE_VSCODE]})
        agents_dir = get_agents_dir()
        files = [f for f in os.listdir(agents_dir) if f.endswith(".md")]

        target_dir = os.path.join(test_dir, ".vscode", "agents")
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(agents_dir, f), os.path.join(target_dir, f))

        installed = os.listdir(target_dir)
        assert len(installed) == len(files)
        for f in files:
            assert f in installed
            with open(os.path.join(target_dir, f)) as fh:
                assert len(fh.read()) > 0

    def test_copy_agents_to_antigravity(self, test_dir):
        write_config(test_dir, {"ides": [IDE_ANTIGRAVITY]})
        agents_dir = get_agents_dir()
        files = [f for f in os.listdir(agents_dir) if f.endswith(".md")]

        target_dir = os.path.join(test_dir, ".antigravity", "agents")
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(agents_dir, f), os.path.join(target_dir, f))

        installed = os.listdir(target_dir)
        assert len(installed) == len(files)


class TestInstallPrompts:
    def test_copy_prompts_to_vscode(self, test_dir):
        write_config(test_dir, {"ides": [IDE_VSCODE]})
        prompts_dir = get_prompts_dir()
        files = [f for f in os.listdir(prompts_dir) if f.endswith(".md")]

        target_dir = os.path.join(test_dir, ".vscode", "prompts")
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(prompts_dir, f), os.path.join(target_dir, f))

        installed = os.listdir(target_dir)
        assert len(installed) == len(files)
        for f in files:
            assert f in installed


class TestInstallMcps:
    def test_copy_mcp_and_create_config_vscode(self, test_dir):
        write_config(test_dir, {"ides": [IDE_VSCODE]})
        mcps_dir = get_mcps_dir()
        mcp_name = "bitbucket-mcp"
        mcp_src_dir = os.path.join(mcps_dir, mcp_name)

        mcp_dest_dir = os.path.join(test_dir, ".wizard-mcps", mcp_name)
        shutil.copytree(mcp_src_dir, mcp_dest_dir)

        # Verify files were copied
        assert os.path.exists(os.path.join(mcp_dest_dir, "pyproject.toml"))
        assert os.path.exists(
            os.path.join(mcp_dest_dir, "bitbucket_mcp", "__init__.py")
        )
        assert os.path.exists(
            os.path.join(mcp_dest_dir, "bitbucket_mcp", "server.py")
        )

        # Build MCP config
        from wizard.commands.install_mcps import _parse_env_params

        env_params = _parse_env_params(
            os.path.join(mcp_dest_dir, "pyproject.toml")
        )

        env_entries = {}
        for param in env_params:
            env_entries[param["name"]] = "${input:" + param["name"] + "}"

        mcp_config = {
            "servers": {
                mcp_name: {
                    "type": "stdio",
                    "command": "uv",
                    "args": [
                        "run",
                        "--directory",
                        mcp_dest_dir,
                        "python",
                        "-m",
                        "bitbucket_mcp",
                    ],
                    "env": env_entries,
                }
            }
        }

        mcp_config_path = os.path.join(test_dir, ".vscode", "mcp.json")
        os.makedirs(os.path.dirname(mcp_config_path), exist_ok=True)
        with open(mcp_config_path, "w") as f:
            json.dump(mcp_config, f, indent=2)

        # Verify mcp.json
        assert os.path.exists(mcp_config_path)
        with open(mcp_config_path) as f:
            written = json.load(f)
        assert mcp_name in written["servers"]
        assert written["servers"][mcp_name]["type"] == "stdio"
        assert written["servers"][mcp_name]["command"] == "uv"
        assert "BITBUCKET_URL" in written["servers"][mcp_name]["env"]
        assert "BITBUCKET_TOKEN" in written["servers"][mcp_name]["env"]

    def test_merge_with_existing_mcp_config(self, test_dir):
        mcp_config_path = os.path.join(test_dir, ".vscode", "mcp.json")
        os.makedirs(os.path.dirname(mcp_config_path), exist_ok=True)
        with open(mcp_config_path, "w") as f:
            json.dump(
                {
                    "servers": {
                        "existing-mcp": {
                            "type": "stdio",
                            "command": "python",
                            "args": ["existing.py"],
                        }
                    }
                },
                f,
            )

        with open(mcp_config_path) as f:
            mcp_config = json.load(f)
        mcp_config["servers"]["bitbucket-mcp"] = {
            "type": "stdio",
            "command": "uv",
            "args": ["run", "bitbucket"],
        }
        with open(mcp_config_path, "w") as f:
            json.dump(mcp_config, f, indent=2)

        with open(mcp_config_path) as f:
            result = json.load(f)
        assert "existing-mcp" in result["servers"]
        assert "bitbucket-mcp" in result["servers"]


class TestParseEnvParams:
    def test_parse_env_params_from_pyproject(self):
        from wizard.commands.install_mcps import _parse_env_params

        pyproject_path = os.path.join(
            get_mcps_dir(), "bitbucket-mcp", "pyproject.toml"
        )
        params = _parse_env_params(pyproject_path)

        assert len(params) == 3
        assert params[0]["name"] == "BITBUCKET_URL"
        assert params[0]["required"] is True
        assert params[1]["name"] == "BITBUCKET_TOKEN"
        assert params[1]["required"] is True
        assert params[2]["name"] == "BITBUCKET_USERNAME"
        assert params[2]["required"] is False

    def test_parse_env_params_brave_search(self):
        from wizard.commands.install_mcps import _parse_env_params

        pyproject_path = os.path.join(
            get_mcps_dir(), "brave-search-mcp", "pyproject.toml"
        )
        params = _parse_env_params(pyproject_path)

        assert len(params) == 1
        assert params[0]["name"] == "BRAVE_API_KEY"
        assert params[0]["required"] is True


class TestBraveSearchMcp:
    def test_copy_brave_mcp_and_create_config_vscode(self, test_dir):
        write_config(test_dir, {"ides": [IDE_VSCODE]})
        mcps_dir = get_mcps_dir()
        mcp_name = "brave-search-mcp"
        mcp_src_dir = os.path.join(mcps_dir, mcp_name)

        mcp_dest_dir = os.path.join(test_dir, ".wizard-mcps", mcp_name)
        shutil.copytree(mcp_src_dir, mcp_dest_dir)

        # Verify files were copied
        assert os.path.exists(os.path.join(mcp_dest_dir, "pyproject.toml"))
        assert os.path.exists(
            os.path.join(mcp_dest_dir, "brave_search_mcp", "__init__.py")
        )
        assert os.path.exists(
            os.path.join(mcp_dest_dir, "brave_search_mcp", "server.py")
        )

        # Build MCP config
        from wizard.commands.install_mcps import _parse_env_params

        env_params = _parse_env_params(
            os.path.join(mcp_dest_dir, "pyproject.toml")
        )

        env_entries = {}
        for param in env_params:
            env_entries[param["name"]] = "${input:" + param["name"] + "}"

        mcp_config = {
            "servers": {
                mcp_name: {
                    "type": "stdio",
                    "command": "uv",
                    "args": [
                        "run",
                        "--directory",
                        mcp_dest_dir,
                        "python",
                        "-m",
                        "brave_search_mcp",
                    ],
                    "env": env_entries,
                }
            }
        }

        mcp_config_path = os.path.join(test_dir, ".vscode", "mcp.json")
        os.makedirs(os.path.dirname(mcp_config_path), exist_ok=True)
        with open(mcp_config_path, "w") as f:
            json.dump(mcp_config, f, indent=2)

        # Verify mcp.json
        assert os.path.exists(mcp_config_path)
        with open(mcp_config_path) as f:
            written = json.load(f)
        assert mcp_name in written["servers"]
        assert written["servers"][mcp_name]["type"] == "stdio"
        assert written["servers"][mcp_name]["command"] == "uv"
        assert "BRAVE_API_KEY" in written["servers"][mcp_name]["env"]


class TestInstallAll:
    def test_install_all_vscode(self, test_dir):
        write_config(test_dir, {"ides": [IDE_VSCODE]})

        from wizard.commands.install_all import install_all_command

        install_all_command(cwd=test_dir)

        # Verify agents were installed
        agents_dir = get_agents_dir()
        agent_files = [f for f in os.listdir(agents_dir) if f.endswith(".md")]
        vscode_agents_dir = os.path.join(test_dir, ".vscode", "agents")
        assert os.path.exists(vscode_agents_dir)
        installed_agents = os.listdir(vscode_agents_dir)
        assert len(installed_agents) == len(agent_files)

        # Verify prompts were installed
        prompts_dir = get_prompts_dir()
        prompt_files = [f for f in os.listdir(prompts_dir) if f.endswith(".md")]
        vscode_prompts_dir = os.path.join(test_dir, ".vscode", "prompts")
        assert os.path.exists(vscode_prompts_dir)
        installed_prompts = os.listdir(vscode_prompts_dir)
        assert len(installed_prompts) == len(prompt_files)

        # Verify MCPs were installed
        mcps_dir = get_mcps_dir()
        mcp_dirs = [
            d for d in os.listdir(mcps_dir) if os.path.isdir(os.path.join(mcps_dir, d))
        ]
        for mcp_name in mcp_dirs:
            assert os.path.exists(
                os.path.join(test_dir, ".wizard-mcps", mcp_name, "pyproject.toml")
            )

        # Verify mcp.json was created
        mcp_config_path = os.path.join(test_dir, ".vscode", "mcp.json")
        assert os.path.exists(mcp_config_path)
        with open(mcp_config_path) as f:
            mcp_config = json.load(f)
        for mcp_name in mcp_dirs:
            assert mcp_name in mcp_config["servers"]

    def test_install_all_no_config(self, test_dir, capsys):
        from wizard.commands.install_all import install_all_command

        install_all_command(cwd=test_dir)

        captured = capsys.readouterr()
        assert "No wizard configuration found" in captured.out
