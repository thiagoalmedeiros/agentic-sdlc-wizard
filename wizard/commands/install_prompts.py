"""Install prompts command."""

import os
import shutil

from InquirerPy import inquirer

from wizard.config import get_ide_prompts_target, get_prompts_dir, read_config


def install_prompts_command(cwd: str | None = None) -> None:
    """Run the install prompts command."""
    cwd = cwd or os.getcwd()
    config = read_config(cwd)

    if not config:
        print('No wizard configuration found. Run "wizard install" first.')
        return

    prompts_dir = get_prompts_dir()
    prompt_files = [f for f in os.listdir(prompts_dir) if f.endswith(".md")]

    if not prompt_files:
        print("No prompt templates available.")
        return

    choices = [{"name": f.replace(".md", ""), "value": f} for f in sorted(prompt_files)]

    selected = inquirer.checkbox(
        message="Select prompts to install:",
        choices=choices,
    ).execute()

    if not selected:
        print("No prompts selected. Aborting.")
        return

    targets = get_ide_prompts_target(cwd, config["ides"])

    for ide, target_dir in targets.items():
        os.makedirs(target_dir, exist_ok=True)
        for prompt in selected:
            src = os.path.join(prompts_dir, prompt)
            dest = os.path.join(target_dir, prompt)
            shutil.copy2(src, dest)
        print(f"Prompts installed to {os.path.relpath(target_dir, cwd)}/")
