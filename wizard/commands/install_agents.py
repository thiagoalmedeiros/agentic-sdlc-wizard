"""Install agents command."""

import os
import shutil

from InquirerPy import inquirer

from wizard.config import get_agents_dir, get_ide_agents_target, read_config


def install_agents_command(cwd: str | None = None) -> None:
    """Run the install agents command."""
    cwd = cwd or os.getcwd()
    config = read_config(cwd)

    if not config:
        print('No wizard configuration found. Run "wizard install" first.')
        return

    agents_dir = get_agents_dir()
    agent_files = [f for f in os.listdir(agents_dir) if f.endswith(".md")]

    if not agent_files:
        print("No agent templates available.")
        return

    choices = [{"name": f.replace(".md", ""), "value": f} for f in sorted(agent_files)]

    selected = inquirer.checkbox(
        message="Select agents to install:",
        choices=choices,
    ).execute()

    if not selected:
        print("No agents selected. Aborting.")
        return

    targets = get_ide_agents_target(cwd, config["ides"])

    for ide, target_dir in targets.items():
        os.makedirs(target_dir, exist_ok=True)
        for agent in selected:
            src = os.path.join(agents_dir, agent)
            dest = os.path.join(target_dir, agent)
            shutil.copy2(src, dest)
        print(f"Agents installed to {os.path.relpath(target_dir, cwd)}/")
